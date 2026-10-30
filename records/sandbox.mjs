// Synthetic, disposable local DB. This module never opens a production connection.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {emptyState} from '../model.mjs';
import {importPlan} from './core.mjs';
export const actors=[{id:'00000000-0000-0000-0000-000000000001',name:'Administrador de teste',role:'admin'},{id:'00000000-0000-0000-0000-000000000002',name:'Colaborador de teste',role:'member'}];
export async function createSandbox({seed=true}={}){
 if(!process.env.CRM_PGLITE_MODULE)throw Error('Configure CRM_PGLITE_MODULE antes de iniciar a homologação local.');
 const {PGlite}=await import(pathToFileURL(process.env.CRM_PGLITE_MODULE).href);const db=new PGlite();
 try{
 await db.exec('create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,encrypted_password text);');
 await db.exec(await readFile(new URL('../supabase/migrations/202610230001_internal_users.sql',import.meta.url),'utf8'));
 for(const actor of actors){await db.query('insert into auth.users(id) values($1)',[actor.id]);await db.query('insert into public.crm_members(id,name,email,role,must_change_password) values($1,$2,$3,$4,false)',[actor.id,actor.name,`${actor.role}@example.test`,actor.role]);}
 for(const file of ['001_core.sql','002_work.sql'])await db.exec(await readFile(new URL('../supabase/records/'+file,import.meta.url),'utf8'));
 const rpc=async(name,args)=>{
  const allowed=['crm_records_apply','crm_records_import','crm_records_page','crm_records_get','crm_records_history'];if(!allowed.includes(name))throw Error('RPC indisponível.');
  const entries=Object.values(args),placeholders=entries.map((v,i)=>`$${i+1}${v!==null&&typeof v==='object'?'::jsonb':''}`);
  try{const result=await db.query(`select public.${name}(${placeholders.join(',')}) value`,entries.map(v=>v!==null&&typeof v==='object'?JSON.stringify(v):v));return {data:result.rows[0].value};}catch(error){return {error};}
 };
 if(seed){const plan=importPlan(emptyState());const {error}=await rpc('crm_records_import',{p_actor:actors[0].id,p_request:'synthetic-seed',p_changes:plan.changes,p_history:[]});if(error)throw error;}
 return {db,rpc,close:()=>db.close()};
 }catch(error){await db.close();throw error;}
}
