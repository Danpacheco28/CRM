-- One internal company. Public clients have no direct write access.
begin;
create table public.crm_members (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 2 and 100),
  email text not null unique,
  role text not null check(role in ('admin','member')),
  active boolean not null default true,
  must_change_password boolean not null default true,
  deleting boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.crm_workspace (
  id boolean primary key default true check(id),
  revision bigint not null default 0,
  payload jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create table public.crm_password_checks (
  id uuid primary key references auth.users(id) on delete cascade,
  initial_hash text not null
);
insert into public.crm_workspace(id) values(true);
create table public.crm_access_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  target_id uuid,
  action text not null,
  at timestamptz not null default now()
);
alter table public.crm_members enable row level security;
alter table public.crm_workspace enable row level security;
alter table public.crm_access_audit enable row level security;
alter table public.crm_password_checks enable row level security;
revoke all on public.crm_password_checks from public,anon,authenticated;
revoke all on public.crm_members,public.crm_workspace,public.crm_access_audit from anon,authenticated;
grant all on public.crm_members,public.crm_workspace,public.crm_access_audit to service_role;
grant usage,select on sequence public.crm_access_audit_id_seq to service_role;

-- Single lock serializes membership changes and writes: revocation cannot race a save.
create function public.crm_member_action(p_actor uuid,p_action text,p_target uuid default null,p_values jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.crm_members; target public.crm_members; result jsonb;
begin
  perform pg_advisory_xact_lock(62423001);
  select * into actor from public.crm_members where id=p_actor and active and not deleting;
  if not found then raise exception 'Acesso desativado ou não autorizado.'; end if;
  if p_action='passwordChanged' then
    if actor.must_change_password and exists(select 1 from public.crm_password_checks c join auth.users u on u.id=c.id where c.id=p_actor and c.initial_hash=u.encrypted_password) then
      raise exception 'Altere sua senha inicial antes de continuar.';
    end if;
    update public.crm_members set must_change_password=false where id=p_actor;
    delete from public.crm_password_checks where id=p_actor;
    return '{}'::jsonb;
  end if;
  if actor.must_change_password then raise exception 'Altere sua senha inicial antes de continuar.';end if;
  if actor.role<>'admin' then raise exception 'Somente administradores podem gerenciar usuários.';end if;
  if p_action='create' then
    insert into public.crm_members(id,name,email,role) values(p_target,p_values->>'name',p_values->>'email',p_values->>'role');
    insert into public.crm_password_checks(id,initial_hash) select id,encrypted_password from auth.users where id=p_target;
  else
    select * into target from public.crm_members where id=p_target;
    if not found then raise exception 'Usuário não encontrado.';end if;
    if p_target=p_actor and (p_action='delete' or p_values->>'role'<>'admin' or not coalesce((p_values->>'active')::boolean,true)) then
      raise exception 'Você não pode remover, desativar ou rebaixar seu próprio acesso.';
    end if;
    if target.role='admin' and target.active and (p_action='delete' or p_values->>'role'<>'admin' or not coalesce((p_values->>'active')::boolean,true)) and
       (select count(*) from public.crm_members where active and not deleting and role='admin' and id<>p_target)=0 then
      raise exception 'Mantenha ao menos um administrador ativo.';
    end if;
    if p_action='update' then
      if target.deleting then raise exception 'Usuário em exclusão. Conclua a exclusão antes de editar.';end if;
      update public.crm_members set name=p_values->>'name',role=p_values->>'role',active=(p_values->>'active')::boolean where id=p_target;
    elsif p_action='delete' then
      update public.crm_members set active=false,deleting=true where id=p_target;
    else raise exception 'Operação inválida.';end if;
  end if;
  insert into public.crm_access_audit(actor_id,target_id,action) values(p_actor,p_target,p_action);
  return '{}'::jsonb;
end $$;
revoke all on function public.crm_member_action(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.crm_member_action(uuid,text,uuid,jsonb) to service_role;

create function public.crm_save_workspace(p_actor uuid,p_expected bigint,p_payload jsonb,p_initialize boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.crm_members; workspace public.crm_workspace;
begin
  perform pg_advisory_xact_lock(62423001);
  select * into actor from public.crm_members where id=p_actor and active and not deleting;
  if not found or actor.must_change_password then raise exception 'Acesso não autorizado. Entre novamente ou altere a senha inicial.';end if;
  select * into workspace from public.crm_workspace where id=true for update;
  if p_initialize then
    if actor.role<>'admin' or workspace.payload is not null then raise exception 'A inicialização está indisponível.';end if;
  elsif workspace.payload is null then raise exception 'A base ainda não foi inicializada pelo administrador.';
  end if;
  if workspace.revision<>p_expected then raise exception 'CONFLICT: outro usuário alterou a base. Atualize antes de continuar.';end if;
  if octet_length(p_payload::text)>15728640 then raise exception 'Base maior que 15 MB. Exporte os anexos e contate o administrador.';end if;
  p_payload=jsonb_set(p_payload,'{revision}',to_jsonb(workspace.revision+1));
  update public.crm_workspace set payload=p_payload,revision=workspace.revision+1,updated_at=now(),updated_by=p_actor where id=true;
  insert into public.crm_access_audit(actor_id,action) values(p_actor,case when p_initialize then 'workspace.initialize' else 'workspace.save' end);
  return p_payload;
end $$;
revoke all on function public.crm_save_workspace(uuid,bigint,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.crm_save_workspace(uuid,bigint,jsonb,boolean) to service_role;
commit;
