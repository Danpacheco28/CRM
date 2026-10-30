-- Additive production bridge. Installation does not activate the new store.
begin;
alter table public.crm_workspace add column storage_mode text not null default 'snapshot' check(storage_mode in ('snapshot','records'));
create schema crm_store;
revoke all on schema crm_store from public,anon,authenticated;
create table crm_store.entries(
 collection text not null,id text not null,data jsonb,version bigint not null check(version>0),
 deleted boolean not null default false,ordinal bigint generated always as identity,
 updated_by uuid not null,updated_at timestamptz not null default now(),primary key(collection,id)
);
create table crm_store.backups(id bigint generated always as identity primary key,payload jsonb not null,revision bigint not null,actor_id uuid not null,at timestamptz not null default now());
create table crm_store.receipts(actor_id uuid not null,request_id text not null,changes jsonb not null,revision bigint not null,primary key(actor_id,request_id));
create table crm_store.metadata(id boolean primary key default true check(id),revision bigint not null,saved_at text not null);
alter table crm_store.entries enable row level security;
alter table crm_store.backups enable row level security;
alter table crm_store.receipts enable row level security;
alter table crm_store.metadata enable row level security;
revoke all on all tables in schema crm_store from public,anon,authenticated;

create function crm_store.authorize(p_actor uuid) returns text language plpgsql security definer set search_path=pg_catalog,public as $$
declare m public.crm_members;
begin
 select * into m from public.crm_members where id=p_actor for share;
 if not found or not m.active or m.deleting or m.must_change_password then raise exception 'Acesso não autorizado.';end if;
 return m.role;
end $$;

create function public.crm_record_read(p_actor uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,crm_store as $$
declare w public.crm_workspace;meta crm_store.metadata;e record;payload jsonb;versions jsonb:='{}';
begin
 perform crm_store.authorize(p_actor);
 select * into w from public.crm_workspace where id=true for share;
 if w.storage_mode='snapshot' then return jsonb_build_object('payload',w.payload,'revision',w.revision,'mode','snapshot','versions','{}'::jsonb);end if;
 select * into meta from crm_store.metadata where id=true;
 payload:='{}'::jsonb;
 for e in select * from crm_store.entries where not deleted order by ordinal loop
  versions:=versions||jsonb_build_object(e.collection||':'||e.id,e.version);
  if e.collection='extra' then payload:=payload||e.data;
  elsif e.collection in ('settings','operationSettings') then payload:=payload||jsonb_build_object(e.collection,e.data);
  else payload:=jsonb_set(payload,array[e.collection],coalesce(payload->e.collection,'[]'::jsonb)||jsonb_build_array(e.data));end if;
 end loop;
 for e in select unnest(array['pipelines','contacts','deals','activities','products','priceLists','quotes','orders','history','templates','projects','bookingTypes','bookings','journeys','enrollments','campaigns','deliveries','goals','dashboards','reportPresets']) as collection loop
  if not payload ? e.collection then payload:=payload||jsonb_build_object(e.collection,'[]'::jsonb);end if;
 end loop;
 payload:=payload||jsonb_build_object('schema',2,'revision',meta.revision,'savedAt',meta.saved_at);
 return jsonb_build_object('payload',payload,'versions',versions,'revision',meta.revision,'mode','records');
end $$;

create function public.crm_record_activate(p_actor uuid,p_expected bigint,p_snapshot jsonb,p_entries jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,crm_store as $$
declare w public.crm_workspace;e jsonb;n integer:=0;
begin
 perform pg_advisory_xact_lock(62423001);
 if crm_store.authorize(p_actor)<>'admin' then raise exception 'Somente administradores podem migrar.';end if;
 select * into w from public.crm_workspace where id=true for update;
 if w.storage_mode='records' then return jsonb_build_object('alreadyActive',true);end if;
 if w.payload is null or w.revision<>p_expected or w.payload<>p_snapshot then raise exception 'CONFLICT: a base mudou antes da migração.';end if;
 if exists(select from crm_store.entries) then raise exception 'Destino não está vazio.';end if;
 insert into crm_store.backups(payload,revision,actor_id) values(w.payload,w.revision,p_actor);
 for e in select value from jsonb_each(p_entries) order by coalesce((value->>'position')::int,0) loop
  insert into crm_store.entries(collection,id,data,version,updated_by) values(e->>'collection',e->>'id',e->'data',1,p_actor);n:=n+1;
 end loop;
 insert into crm_store.metadata(id,revision,saved_at) values(true,w.revision,coalesce(w.payload->>'savedAt',''));
 update public.crm_workspace set storage_mode='records' where id=true;
 -- Original payload is retained as the frozen pre-cutover backup, not live data.
 insert into public.crm_access_audit(actor_id,action) values(p_actor,'records.activate');
 return jsonb_build_object('records',n,'revision',w.revision);
end $$;

create function public.crm_record_receipt(p_actor uuid,p_request text,p_changes jsonb) returns boolean language plpgsql security definer set search_path=pg_catalog,public,crm_store as $$
declare previous jsonb;
begin
 perform crm_store.authorize(p_actor);
 select changes into previous from crm_store.receipts where actor_id=p_actor and request_id=p_request;
 if found and previous<>p_changes then raise exception 'Requisição reutilizada com conteúdo diferente.';end if;
 return found;
end $$;

create function public.crm_record_apply(p_actor uuid,p_request text,p_expected bigint,p_changes jsonb,p_saved_at text) returns boolean language plpgsql security definer set search_path=pg_catalog,public,crm_store as $$
declare meta crm_store.metadata;c jsonb;existing crm_store.entries;seen text[]:='{}';k text;
begin
 perform pg_advisory_xact_lock(62423001);
 perform crm_store.authorize(p_actor);
 perform 1 from public.crm_workspace where id=true and storage_mode='records' for update;
 if not found then raise exception 'Gravação por registro ainda não ativada.';end if;
 if public.crm_record_receipt(p_actor,p_request,p_changes) then return true;end if;
 if p_request is null or p_request !~ '^[A-Za-z0-9_-]{1,100}$' or p_changes is null or jsonb_typeof(p_changes)<>'array' or jsonb_array_length(p_changes) not between 1 and 2000 or octet_length(p_changes::text)>15728640 then raise exception 'Lote de registros inválido.';end if;
 select * into meta from crm_store.metadata where id=true for update;
 if meta.revision<>p_expected then raise exception 'REBASE: alterações recebidas durante a validação.';end if;
 for c in select value from jsonb_array_elements(p_changes) loop
  k:=c->>'collection'||':'||(c->>'id');
  if k is null or k=any(seen) or c->>'collection' not in ('pipelines','contacts','deals','activities','products','priceLists','quotes','orders','history','templates','projects','bookingTypes','bookings','journeys','enrollments','campaigns','deliveries','goals','dashboards','reportPresets','settings','operationSettings','extra') or coalesce(c->>'id','') !~ '^[A-Za-z0-9_-]{1,100}$' or coalesce(c->>'expected','') !~ '^[0-9]{1,15}$' or jsonb_typeof(c->'deleted') is distinct from 'boolean' then raise exception 'Registro inválido.';end if;
  seen:=array_append(seen,k);
  select * into existing from crm_store.entries where collection=c->>'collection' and id=c->>'id';
  if coalesce(existing.version,0)<>(c->>'expected')::bigint then raise exception 'CONFLICT: registro alterado ou removido.';end if;
  if coalesce((c->>'deleted')::boolean,false) and existing.version is null then raise exception 'CONFLICT: registro removido.';end if;
  insert into crm_store.entries(collection,id,data,version,deleted,updated_by) values(c->>'collection',c->>'id',c->'data',1,(c->>'deleted')::boolean,p_actor)
  on conflict(collection,id) do update set data=excluded.data,version=entries.version+1,deleted=excluded.deleted,updated_by=p_actor,updated_at=clock_timestamp();
 end loop;
 update crm_store.metadata set revision=meta.revision+1,saved_at=p_saved_at where id=true;
 update public.crm_workspace set revision=meta.revision+1,updated_at=clock_timestamp(),updated_by=p_actor where id=true;
 insert into crm_store.receipts(actor_id,request_id,changes,revision) values(p_actor,p_request,p_changes,meta.revision+1);
 insert into public.crm_access_audit(actor_id,action) values(p_actor,'records.apply');
 return true;
end $$;

-- Old tabs/functions cannot overwrite the archived snapshot after cutover.
create function crm_store.guard_workspace() returns trigger language plpgsql set search_path=pg_catalog as $$
begin
 if old.storage_mode='records' and new.payload is distinct from old.payload then raise exception 'CONFLICT: aplicativo antigo. Atualize a página antes de salvar.';end if;
 return new;
end $$;
create trigger crm_record_guard before update on public.crm_workspace for each row execute function crm_store.guard_workspace();
revoke all on all functions in schema crm_store from public,anon,authenticated;
revoke all on function public.crm_record_read(uuid),public.crm_record_activate(uuid,bigint,jsonb,jsonb),public.crm_record_receipt(uuid,text,jsonb),public.crm_record_apply(uuid,text,bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.crm_record_read(uuid),public.crm_record_activate(uuid,bigint,jsonb,jsonb),public.crm_record_receipt(uuid,text,jsonb),public.crm_record_apply(uuid,text,bigint,jsonb,text) to service_role;
commit;
