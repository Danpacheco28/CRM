// Maintainer utility: regenerate the additive work-module migration from core.
// Input 001 stays immutable; output 002 is installed after it in homologation.
import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile(new URL('../supabase/records/001_core.sql',import.meta.url),'utf8');
const tables=`
create table crm_records.projects(
 id text primary key check(id ~ '^[A-Za-z0-9_-]{1,100}$'),name text not null check(length(trim(name)) between 1 and 200),
 status text not null check(status in ('ativo','concluido','arquivado')),due date,
 attributes jsonb not null default '{}' check(jsonb_typeof(attributes)='object'),
 version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),updated_by uuid not null
);
create table crm_records.activities(
 id text primary key check(id ~ '^[A-Za-z0-9_-]{1,100}$'),title text not null check(length(trim(title)) between 1 and 200),
 contact_id text references crm_records.contacts(id) on delete no action deferrable initially deferred,
 deal_id text references crm_records.deals(id) on delete no action deferrable initially deferred,
 project_id text references crm_records.projects(id) on delete no action deferrable initially deferred,
 due_local timestamp without time zone not null,timezone_name text not null default 'America/Sao_Paulo' check(timezone_name='America/Sao_Paulo'),
 due_at timestamptz generated always as (due_local at time zone timezone_name) stored,
 owner_label text not null check(length(trim(owner_label)) between 1 and 150),
 status text not null check(status in ('pendente','concluida','cancelada')),priority text not null check(priority in ('baixa','normal','alta','urgente')),
 duration integer not null check(duration between 5 and 1440),
 recurrence text not null default 'none' check(recurrence='none'),
 attributes jsonb not null default '{}' check(jsonb_typeof(attributes)='object'),
 version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),updated_by uuid not null
);
create index on crm_records.activities(contact_id);
create index on crm_records.activities(deal_id);
create index on crm_records.activities(project_id);
create index on crm_records.activities(status,due_at,id);
create index on crm_records.projects(status,id);
alter table crm_records.projects enable row level security;
alter table crm_records.activities enable row level security;
revoke all on crm_records.projects,crm_records.activities from public,anon,authenticated;
grant select,insert,update,delete on crm_records.projects,crm_records.activities to service_role;
`;
const branch=`
   elsif table_name='projects' then
    insert into crm_records.projects(id,name,status,due,attributes,updated_by) values(d->>'id',d->>'name',d->>'status',nullif(d->>'due','')::date,d-array['id','name','status','due','version','updated_at','updated_by'],p_actor)
    on conflict(id) do update set name=excluded.name,status=excluded.status,due=excluded.due,attributes=excluded.attributes,version=projects.version+1,updated_at=clock_timestamp(),updated_by=p_actor where projects.version=expected returning to_jsonb(projects.*) into row_data;
   elsif table_name='activities' then
    if coalesce(d->>'due','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' then raise exception 'Prazo local inválido.';end if;
    insert into crm_records.activities(id,title,contact_id,deal_id,project_id,due_local,owner_label,status,priority,duration,recurrence,attributes,updated_by)
    values(d->>'id',d->>'title',nullif(d->>'contactId',''),nullif(d->>'dealId',''),nullif(d->>'projectId',''),(d->>'due')::timestamp,coalesce(d->>'owner','Eu'),d->>'status',coalesce(d->>'priority','normal'),coalesce((d->>'duration')::integer,30),coalesce(d->>'recurrence','none'),d-array['id','title','contactId','dealId','projectId','due','owner','status','priority','duration','recurrence','version','updated_at','updated_by'],p_actor)
    on conflict(id) do update set title=excluded.title,contact_id=excluded.contact_id,deal_id=excluded.deal_id,project_id=excluded.project_id,due_local=excluded.due_local,owner_label=excluded.owner_label,status=excluded.status,priority=excluded.priority,duration=excluded.duration,recurrence=excluded.recurrence,attributes=excluded.attributes,version=activities.version+1,updated_at=clock_timestamp(),updated_by=p_actor where activities.version=expected returning to_jsonb(activities.*) into row_data;
`;
const functionNames=['crm_records.apply_changes','crm_records.page','public.crm_records_history','public.crm_records_get'];
const functions=functionNames.map(name=>{
 const start=source.indexOf(`create function ${name}(`);const end=source.indexOf('end $$;',start)+7;
 if(start<0||end<7)throw Error(`Função não localizada: ${name}`);
 let sql=source.slice(start,end).replace('create function','create or replace function').replaceAll("('contacts','pipelines','stages','deals')","('contacts','pipelines','stages','deals','projects','activities')");
 if(name==='crm_records.apply_changes')sql=sql.replace("   else\n    if jsonb_array_length",()=>branch+"   else\n    if jsonb_array_length");
 if(name==='crm_records.page')sql=sql.replace("when p_entity='deals' then", "when p_entity in ('deals','activities') then");
 return sql;
});
// The import wrapper remains core-only. Work modules require their own cutover.
const target=new URL('../supabase/records/002_work.sql',import.meta.url);
const output='-- Generated by scripts/extend-record-work.mjs. Homologation only.\nbegin;\n'+tables+functions.join('\n\n')+'\ncommit;\n';
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==output)throw Error('002_work.sql difere do gerador.');}
else await writeFile(target,output);
