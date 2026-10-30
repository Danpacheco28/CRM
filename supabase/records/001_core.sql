-- Apply only to disposable homologation after the internal-users migration.
-- No writes to crm_workspace. No route in the published app uses this schema.
begin;
create schema crm_records;
revoke all on schema crm_records from public,anon,authenticated;
grant usage on schema crm_records to service_role;

create table crm_records.contacts(
 id text primary key check(id ~ '^[A-Za-z0-9_-]{1,100}$'),
 kind text not null check(kind in ('organization','person')),
 name text not null check(length(trim(name)) between 1 and 200),
 organization_id text, organization_kind text not null default 'organization' check(organization_kind='organization'),
 email text not null default '' check(length(email)<=250),phone text not null default '' check(length(phone)<=80),
 active boolean not null default true,attributes jsonb not null default '{}' check(jsonb_typeof(attributes)='object'),
 version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),updated_by uuid not null,
 unique(id,kind),check(organization_id is null or (kind='person' and organization_id<>id)),
 foreign key(organization_id,organization_kind) references crm_records.contacts(id,kind) on delete no action deferrable initially deferred
);
create table crm_records.pipelines(
 id text primary key check(id ~ '^[A-Za-z0-9_-]{1,100}$'),name text not null check(length(trim(name)) between 1 and 120),
 kind text not null check(kind in ('lead','opportunity','aftersale')),attributes jsonb not null default '{}' check(jsonb_typeof(attributes)='object'),
 version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),updated_by uuid not null
);
create table crm_records.stages(
 id text primary key check(id ~ '^[A-Za-z0-9_-]{1,100}$'),pipeline_id text not null references crm_records.pipelines(id) on delete no action deferrable initially deferred,
 name text not null check(length(trim(name)) between 1 and 100),position integer not null check(position>=0),probability numeric(5,2) not null check(probability between 0 and 100),
 attributes jsonb not null default '{}' check(jsonb_typeof(attributes)='object'),version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),updated_by uuid not null,
 unique(pipeline_id,id),unique(pipeline_id,position) deferrable initially deferred
);
create table crm_records.deals(
 id text primary key check(id ~ '^[A-Za-z0-9_-]{1,100}$'),title text not null check(length(trim(title)) between 1 and 200),
 pipeline_id text not null,stage_id text not null,organization_id text,person_id text,
 organization_kind text not null default 'organization' check(organization_kind='organization'),person_kind text not null default 'person' check(person_kind='person'),
 owner_label text not null check(length(trim(owner_label)) between 1 and 150),value numeric(18,2) not null check(value>=0 and value<=1000000000000),
 status text not null check(status in ('ativo','ganho','perdido')),loss_reason text not null default '',
 attributes jsonb not null default '{}' check(jsonb_typeof(attributes)='object' and not attributes ? 'attachments'),
 version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),updated_by uuid not null,
 check(organization_id is not null or person_id is not null),check(status<>'perdido' or length(trim(loss_reason)) between 1 and 300),
 foreign key(pipeline_id,stage_id) references crm_records.stages(pipeline_id,id) on delete no action deferrable initially deferred,
 foreign key(organization_id,organization_kind) references crm_records.contacts(id,kind) on delete no action deferrable initially deferred,
 foreign key(person_id,person_kind) references crm_records.contacts(id,kind) on delete no action deferrable initially deferred
);
create index on crm_records.contacts(organization_id);
create index on crm_records.contacts(lower(email));
create index on crm_records.contacts(name,id);
create index on crm_records.deals(pipeline_id,stage_id,id);
create index on crm_records.deals(organization_id);
create index on crm_records.deals(person_id);
create index on crm_records.deals(status,id);
create table crm_records.history(
 id bigint generated always as identity primary key,actor_id uuid not null,request_id text not null,
 entity text not null,entity_id text not null,action text not null,version bigint,at timestamptz not null default now(),
 source_id text unique,source_event jsonb
 -- Historical target IDs survive deletion. This is an immutable event log,
 -- not a live entity relationship. Operational references use real FKs above.
);
create index on crm_records.history(entity,entity_id,id);
create table crm_records.requests(actor_id uuid not null,request_id text not null,body jsonb not null,result jsonb,primary key(actor_id,request_id));
create table crm_records.retired(entity text not null,id text not null,primary key(entity,id));
create table crm_records.imports(source_history jsonb not null,id boolean primary key default true check(id),request_id text not null,actor_id uuid not null,at timestamptz not null default now());

create function crm_records.authorize(p_actor uuid) returns text language plpgsql security definer set search_path=pg_catalog,public,crm_records as $$
declare member public.crm_members;
begin
 -- Shared row locks permit independent editors and serialize with revocation.
 select * into member from public.crm_members where id=p_actor for share;
 if not found or not member.active or member.deleting or member.must_change_password then raise exception 'Acesso não autorizado.';end if;
 return member.role;
end $$;

create function crm_records.apply_changes(p_actor uuid,p_request text,p_changes jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,crm_records as $$
declare c jsonb;d jsonb;prev jsonb;v_result jsonb:='[]';row_data jsonb;v bigint;table_name text;expected bigint;identity text;seen text[]:='{}';body jsonb:=p_changes;
begin
 perform crm_records.authorize(p_actor);
 if p_request is null or length(p_request) not between 1 and 100 then raise exception 'Identificador de requisição inválido.';end if;
 if p_changes is null or jsonb_typeof(p_changes)<>'array' or jsonb_array_length(p_changes) not between 1 and 500 or octet_length(p_changes::text)>2097152 then raise exception 'Lote inválido ou maior que 2 MB.';end if;
 insert into crm_records.requests(actor_id,request_id,body) values(p_actor,p_request,body) on conflict do nothing;
 select r.body,r.result into prev,row_data from crm_records.requests r where actor_id=p_actor and request_id=p_request for update;
 if prev<>body then raise exception 'Requisição reutilizada com conteúdo diferente.';end if;
 if row_data is not null then return row_data;end if;
 if exists(select from jsonb_array_elements(p_changes) item where item->>'entity' in ('pipelines','stages')) then perform pg_advisory_xact_lock(62429002);end if;
 -- Deterministic lock order avoids reversed-batch deadlocks. FKs are deferred.
 for c in select x from jsonb_array_elements(p_changes) x order by x->>'entity',x->>'id' loop
  table_name:=c->>'entity';d:=c->'data';
  if table_name not in ('contacts','pipelines','stages','deals') or table_name is null or c->>'op' not in ('put','delete') or c->>'op' is null or coalesce(c->>'id','') !~ '^[A-Za-z0-9_-]{1,100}$' or coalesce(c->>'expectedVersion','') !~ '^[0-9]{1,15}$' then raise exception 'Alteração inválida.';end if;
  expected:=(c->>'expectedVersion')::bigint;identity:=table_name||':'||(c->>'id');
  if identity=any(seen) then raise exception 'Registro repetido na transação.';end if;seen:=array_append(seen,identity);
  if c->>'op'='put' and (d is null or jsonb_typeof(d)<>'object' or d->>'id' is distinct from c->>'id' or octet_length(d::text)>131072) then raise exception 'Dados do registro inválidos.';end if;
  execute format('select version from crm_records.%I where id=$1 for update',table_name) into v using c->>'id';
  if (v is null and expected<>0) or (v is not null and v<>expected) then raise exception 'CONFLICT: registro % alterado ou removido.',identity;end if;
  if v is null and exists(select from crm_records.retired where entity=table_name and id=c->>'id') then raise exception 'CONFLICT: identificador removido não pode ser reutilizado.';end if;
  if c->>'op'='delete' then
   if v is null then raise exception 'CONFLICT: registro removido.';end if;
   execute format('delete from crm_records.%I where id=$1',table_name) using c->>'id';
   insert into crm_records.retired(entity,id) values(table_name,c->>'id');
   row_data:=jsonb_build_object('id',c->>'id','deleted',true,'version',v+1);
  else
   -- Inserts and updates are expanded below per entity; metadata is server-owned.
   if table_name='contacts' then
    insert into crm_records.contacts(id,kind,name,organization_id,email,phone,active,attributes,updated_by)
    values(d->>'id',d->>'type',d->>'name',nullif(d->>'organizationId',''),coalesce(d->>'email',''),coalesce(d->>'phone',''),coalesce((d->>'active')::boolean,true),d-array['id','type','name','organizationId','email','phone','active','version','updated_at','updated_by'],p_actor)
    on conflict(id) do update set kind=excluded.kind,name=excluded.name,organization_id=excluded.organization_id,email=excluded.email,phone=excluded.phone,active=excluded.active,attributes=excluded.attributes,version=contacts.version+1,updated_at=clock_timestamp(),updated_by=p_actor where contacts.version=expected returning to_jsonb(contacts.*) into row_data;
   elsif table_name='pipelines' then
    if d ? 'stages' then raise exception 'Etapas devem ser gravadas individualmente.';end if;
    insert into crm_records.pipelines(id,name,kind,attributes,updated_by) values(d->>'id',d->>'name',d->>'type',d-array['id','name','type','version','updated_at','updated_by'],p_actor)
    on conflict(id) do update set name=excluded.name,kind=excluded.kind,attributes=excluded.attributes,version=pipelines.version+1,updated_at=clock_timestamp(),updated_by=p_actor where pipelines.version=expected returning to_jsonb(pipelines.*) into row_data;
   elsif table_name='stages' then
    insert into crm_records.stages(id,pipeline_id,name,position,probability,attributes,updated_by) values(d->>'id',d->>'pipelineId',d->>'name',(d->>'position')::integer,(d->>'probability')::numeric,d-array['id','pipelineId','name','position','probability','version','updated_at','updated_by'],p_actor)
    on conflict(id) do update set pipeline_id=excluded.pipeline_id,name=excluded.name,position=excluded.position,probability=excluded.probability,attributes=excluded.attributes,version=stages.version+1,updated_at=clock_timestamp(),updated_by=p_actor where stages.version=expected returning to_jsonb(stages.*) into row_data;
   else
    if jsonb_array_length(coalesce(d->'attachments','[]'))>0 then raise exception 'Migre os anexos para Storage.';end if;
    insert into crm_records.deals(id,title,pipeline_id,stage_id,organization_id,person_id,owner_label,value,status,loss_reason,attributes,updated_by)
    values(d->>'id',d->>'title',d->>'pipelineId',d->>'stageId',nullif(d->>'organizationId',''),nullif(d->>'personId',''),d->>'owner',(d->>'value')::numeric,d->>'status',coalesce(d->>'lossReason',''),d-array['id','title','pipelineId','stageId','organizationId','personId','owner','value','status','lossReason','attachments','version','updated_at','updated_by'],p_actor)
    on conflict(id) do update set title=excluded.title,pipeline_id=excluded.pipeline_id,stage_id=excluded.stage_id,organization_id=excluded.organization_id,person_id=excluded.person_id,owner_label=excluded.owner_label,value=excluded.value,status=excluded.status,loss_reason=excluded.loss_reason,attributes=excluded.attributes,version=deals.version+1,updated_at=clock_timestamp(),updated_by=p_actor where deals.version=expected returning to_jsonb(deals.*) into row_data;
   end if;
   -- Covers races where a concurrent create won after our initial lookup.
   if row_data is null then raise exception 'CONFLICT: registro % alterado.',identity;end if;
  end if;
  insert into crm_records.history(actor_id,request_id,entity,entity_id,action,version) values(p_actor,p_request,table_name,c->>'id',c->>'op',coalesce((row_data->>'version')::bigint,v+1));
  v_result:=v_result||jsonb_build_array(jsonb_build_object('entity',table_name,'record',row_data));
 end loop;
 if exists(select from crm_records.pipelines p where not exists(select from crm_records.stages s where s.pipeline_id=p.id)) then raise exception 'Pipeline precisa de ao menos uma etapa.';end if;
 if exists(select from jsonb_array_elements(p_changes) item where item->>'entity'='pipelines' and item->>'op'='delete') and not exists(select from crm_records.pipelines) then raise exception 'Mantenha ao menos um pipeline.';end if;
 -- Force relational validation before storing a success/idempotency response.
 set constraints all immediate;
 set constraints all deferred;
 update crm_records.requests set result=v_result where actor_id=p_actor and request_id=p_request;
 return v_result;
end $$;

create function crm_records.page(p_actor uuid,p_entity text,p_limit integer default 25,p_offset integer default 0,p_search text default '',p_pipeline text default '') returns jsonb language plpgsql security definer set search_path=pg_catalog,public,crm_records as $$
declare rows jsonb;label text;filter text;
begin
 perform crm_records.authorize(p_actor);
 if p_entity is null or p_entity not in ('contacts','pipelines','stages','deals') or p_limit is null or p_limit not between 1 and 100 or p_offset is null or p_offset<0 or p_search is null or length(p_search)>200 or p_pipeline is null then raise exception 'Consulta inválida.';end if;
 label:=case when p_entity='deals' then 'title' else 'name' end;
 filter:=case when p_entity in ('stages','deals') then ' and ($4='''' or pipeline_id=$4)' else '' end;
 execute format('select coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) from (select * from crm_records.%I where strpos(lower(%I),lower($1))>0 %s order by id limit $2 offset $3) r',p_entity,label,filter) into rows using p_search,p_limit+1,p_offset,p_pipeline;
 return jsonb_build_object('rows',case when jsonb_array_length(rows)>p_limit then rows-(jsonb_array_length(rows)-1) else rows end,'hasMore',jsonb_array_length(rows)>p_limit);
end $$;

create function crm_records.import_core(p_actor uuid,p_request text,p_changes jsonb,p_history jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,crm_records as $$
declare result jsonb;h jsonb;previous text;
begin
 if crm_records.authorize(p_actor)<>'admin' then raise exception 'Somente administradores importam.';end if;
 if p_history is null or jsonb_typeof(p_history)<>'array' or jsonb_array_length(p_history)>50000 or octet_length(p_history::text)>2097152 then raise exception 'Histórico inválido ou maior que 2 MB.';end if;
 -- Import is an explicit empty-target operation, not a dual-write migration.
 lock table crm_records.contacts,crm_records.pipelines,crm_records.stages,crm_records.deals in exclusive mode;
 select request_id into previous from crm_records.imports where id=true;
 if previous is not null then
  if previous<>p_request or not exists(select from crm_records.imports where source_history=p_history) then raise exception 'Importação já realizada.';end if;
  select r.result into result from crm_records.requests r where actor_id=p_actor and request_id=p_request and body=p_changes;
  if result is null then raise exception 'Requisição de importação divergente.';end if;
  return result;
 end if;
 if exists(select from crm_records.contacts) or exists(select from crm_records.pipelines) or exists(select from crm_records.deals) then raise exception 'Importação exige destino vazio.';end if;
 if exists(select from jsonb_array_elements(p_changes) c where c->>'op'<>'put' or c->>'expectedVersion'<>'0') then raise exception 'Plano de importação inválido.';end if;
 if exists(select from crm_records.requests where actor_id=p_actor and request_id=p_request) then raise exception 'Identificador de importação já utilizado.';end if;
 result:=crm_records.apply_changes(p_actor,p_request,p_changes);
 for h in select * from jsonb_array_elements(p_history) loop
  if coalesce(h->>'id','') !~ '^[A-Za-z0-9_-]{1,100}$' or jsonb_typeof(h)<>'object' then raise exception 'Evento de histórico inválido.';end if;
  insert into crm_records.history(actor_id,request_id,entity,entity_id,action,source_id,source_event) values(p_actor,p_request,coalesce(h->>'kind','legacy'),coalesce(h->>'entityId',''),'import',h->>'id',h);
 end loop;
 insert into crm_records.imports(source_history,id,request_id,actor_id) values(p_history,true,p_request,p_actor);
 return result;
end $$;

-- RLS + service-only SQL functions; neither browser role can reach the tables.
alter table crm_records.contacts enable row level security;
alter table crm_records.pipelines enable row level security;
alter table crm_records.stages enable row level security;
alter table crm_records.deals enable row level security;
alter table crm_records.history enable row level security;
alter table crm_records.requests enable row level security;
alter table crm_records.imports enable row level security;
alter table crm_records.retired enable row level security;
revoke all on all tables in schema crm_records from public,anon,authenticated;
revoke all on all functions in schema crm_records from public,anon,authenticated;
grant select,insert,update,delete on all tables in schema crm_records to service_role;
grant usage,select on all sequences in schema crm_records to service_role;
grant execute on function crm_records.apply_changes(uuid,text,jsonb),crm_records.page(uuid,text,integer,integer,text,text),crm_records.import_core(uuid,text,jsonb,jsonb) to service_role;
-- PostgREST exposes public only; keep storage schema private.
create function public.crm_records_apply(p_actor uuid,p_request text,p_changes jsonb) returns jsonb language sql security invoker set search_path=pg_catalog as $$select crm_records.apply_changes(p_actor,p_request,p_changes)$$;
create function public.crm_records_page(p_actor uuid,p_entity text,p_limit integer default 25,p_offset integer default 0,p_search text default '',p_pipeline text default '') returns jsonb language sql security invoker set search_path=pg_catalog as $$select crm_records.page(p_actor,p_entity,p_limit,p_offset,p_search,p_pipeline)$$;
create function public.crm_records_import(p_actor uuid,p_request text,p_changes jsonb,p_history jsonb) returns jsonb language sql security invoker set search_path=pg_catalog as $$select crm_records.import_core(p_actor,p_request,p_changes,p_history)$$;
create function public.crm_records_history(p_actor uuid,p_entity text,p_id text,p_limit integer default 25,p_before bigint default null) returns jsonb language plpgsql security definer set search_path=pg_catalog,crm_records as $$
declare events jsonb;
begin
 perform crm_records.authorize(p_actor);
 if p_entity is null or p_entity not in ('contacts','pipelines','stages','deals') or coalesce(p_id,'') !~ '^[A-Za-z0-9_-]{1,100}$' or p_limit is null or p_limit not between 1 and 100 then raise exception 'Consulta inválida.';end if;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into events from (select * from crm_records.history where (entity=p_entity or (p_entity='deals' and entity='deal')) and entity_id=p_id and (p_before is null or id<p_before) order by id desc limit p_limit) r;
 return events;
end $$;
revoke all on function public.crm_records_history(uuid,text,text,integer,bigint) from public,anon,authenticated;
grant execute on function public.crm_records_history(uuid,text,text,integer,bigint) to service_role;
create function public.crm_records_get(p_actor uuid,p_entity text,p_id text) returns jsonb language plpgsql security definer set search_path=pg_catalog,crm_records as $$
declare record jsonb;
begin
 perform crm_records.authorize(p_actor);
 if p_entity is null or p_entity not in ('contacts','pipelines','stages','deals') or coalesce(p_id,'') !~ '^[A-Za-z0-9_-]{1,100}$' then raise exception 'Consulta inválida.';end if;
 execute format('select to_jsonb(r) from crm_records.%I r where id=$1',p_entity) into record using p_id;
 return record;
end $$;
revoke all on function public.crm_records_get(uuid,text,text) from public,anon,authenticated;
grant execute on function public.crm_records_get(uuid,text,text) to service_role;
revoke all on function public.crm_records_apply(uuid,text,jsonb),public.crm_records_page(uuid,text,integer,integer,text,text),public.crm_records_import(uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.crm_records_apply(uuid,text,jsonb),public.crm_records_page(uuid,text,integer,integer,text,text),public.crm_records_import(uuid,text,jsonb,jsonb) to service_role;
commit;
