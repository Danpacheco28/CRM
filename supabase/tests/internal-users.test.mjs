// Run with a disposable PGlite dependency. No production connection is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.CRM_PGLITE_MODULE;
test('PostgreSQL: gestão de usuários, bloqueios de acesso e conflitos de gravação',{skip:!modulePath},async()=>{
  const {PGlite}=await import(pathToFileURL(modulePath).href);const db=new PGlite();
  try{
    await db.exec('create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,encrypted_password text);');
    await db.exec(await readFile(new URL('../migrations/202610230001_internal_users.sql',import.meta.url),'utf8'));
    const admin='00000000-0000-0000-0000-000000000001',member='00000000-0000-0000-0000-000000000002',second='00000000-0000-0000-0000-000000000003';
    await db.query('insert into auth.users(id,encrypted_password) values($1,\'initial-a\'),($2,\'initial-b\'),($3,\'initial-c\')',[admin,member,second]);
    await db.query('insert into public.crm_members(id,name,email,role,must_change_password) values($1,\'Admin\',\'admin@example.test\',\'admin\',false)',[admin]);
    const act=(actor,action,target,values={})=>db.query('select public.crm_member_action($1,$2,$3,$4::jsonb)',[actor,action,target,JSON.stringify(values)]);
    await act(admin,'create',member,{name:'Colaborador',email:'member@example.test',role:'member'});
    await assert.rejects(()=>act(member,'create',second,{name:'Outro',email:'other@example.test',role:'admin'}),/senha inicial/);
    await assert.rejects(()=>act(member,'passwordChanged',null),/senha inicial/);
    await db.query('update auth.users set encrypted_password=\'changed-b\' where id=$1',[member]);await act(member,'passwordChanged',null);
    await assert.rejects(()=>act(member,'create',second,{name:'Outro',email:'other@example.test',role:'admin'}),/administradores/);
    await assert.rejects(()=>act(admin,'delete',admin),/próprio acesso/);
    await act(admin,'create',second,{name:'Segundo admin',email:'second@example.test',role:'admin'});
    await db.query('update auth.users set encrypted_password=\'changed-c\' where id=$1',[second]);await act(second,'passwordChanged',null);
    await act(admin,'update',second,{name:'Segundo admin',role:'member',active:true});
    await assert.rejects(()=>act(second,'delete',admin),/administradores/);
    const save=(actor,expected,init=false)=>db.query('select public.crm_save_workspace($1,$2,$3::jsonb,$4)',[actor,expected,JSON.stringify({schema:2,revision:expected+1}),init]);
    await assert.rejects(()=>save(member,0,true),/inicialização/);await save(admin,0,true);await save(member,1);
    await assert.rejects(()=>save(admin,1),/CONFLICT/);
    await act(admin,'update',member,{name:'Colaborador',role:'member',active:false});
    await assert.rejects(()=>save(member,2),/não autorizado/);
    await act(admin,'delete',member);assert.equal((await db.query('select deleting from public.crm_members where id=$1',[member])).rows[0].deleting,true);
    await db.query('delete from auth.users where id=$1',[member]);assert.equal((await db.query('select count(*)::int as count from public.crm_members where id=$1',[member])).rows[0].count,0);
    assert.equal((await db.query('select revision from public.crm_workspace')).rows[0].revision,2);
    await db.exec('set role authenticated');await assert.rejects(()=>db.query('select * from public.crm_members'),/permission denied/);await assert.rejects(()=>db.query('select * from public.crm_workspace'),/permission denied/);await assert.rejects(()=>act(admin,'delete',second),/permission denied/);await db.exec('reset role');
  }finally{await db.close();}
});
