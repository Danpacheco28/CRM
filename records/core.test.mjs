import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {emptyState,saveEntity} from '../model.mjs';
import {importPlan,RecordRepository,fromRow} from './core.mjs';
import {recordService} from './service.mjs';
const modulePath=process.env.CRM_PGLITE_MODULE;
const admin='00000000-0000-0000-0000-000000000001',member='00000000-0000-0000-0000-000000000002';
const org=(id,name=id)=>({id,type:'organization',name,organizationId:'',email:'same@example.test',phone:'',tags:[],active:true});
const pipe={id:'pipe-legacy',name:'Vendas',type:'opportunity'};
const stage=(id='stage-a',pipelineId=pipe.id,position=0)=>({id,name:id,pipelineId,position,probability:20});
const deal=(id='deal-a',stageId='stage-a')=>({id,title:id,pipelineId:pipe.id,stageId,organizationId:'org-a',personId:'',owner:'Eu',value:100.25,status:'ativo',tags:['Teste'],custom:{origem:'legado'},lossReason:''});
const put=(entity,data,expectedVersion=0)=>({entity,op:'put',id:data.id,expectedVersion,data});
const del=(entity,id,expectedVersion=1)=>({entity,op:'delete',id,expectedVersion});
let sequence=0;
async function database(){
 const {PGlite}=await import(pathToFileURL(modulePath).href);const db=new PGlite();
 await db.exec('create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,encrypted_password text);');
 await db.exec(await readFile(new URL('../supabase/migrations/202610230001_internal_users.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users(id) values($1),($2)',[admin,member]);
 await db.query("insert into public.crm_members(id,name,email,role,must_change_password) values($1,'Admin','admin@example.test','admin',false),($2,'Colaborador','member@example.test','member',false)",[admin,member]);
 await db.exec(await readFile(new URL('../supabase/records/001_core.sql',import.meta.url),'utf8'));
 const rpc=async(name,args)=>{try{let r;if(name==='crm_records_get')r=await db.query('select public.crm_records_get($1,$2,$3) value',Object.values(args));else if(name==='crm_records_history')r=await db.query('select public.crm_records_history($1,$2,$3,$4,$5) value',Object.values(args));else if(name==='crm_records_page')r=await db.query('select public.crm_records_page($1,$2,$3,$4,$5,$6) value',Object.values(args));else if(name==='crm_records_import')r=await db.query('select public.crm_records_import($1,$2,$3::jsonb,$4::jsonb) value',[args.p_actor,args.p_request,JSON.stringify(args.p_changes),JSON.stringify(args.p_history)]);else r=await db.query('select public.crm_records_apply($1,$2,$3::jsonb) value',[args.p_actor,args.p_request,JSON.stringify(args.p_changes)]);return {data:r.rows[0].value};}catch(error){return {error};}};
 const apply=(changes,actor=admin,id=`request-${++sequence}`)=>recordService(rpc,actor,{action:'apply',changes,requestId:id});
 return {db,rpc,apply};
}
async function withDatabase(fn){const env=await database();try{await fn(env);}finally{await env.db.close();}}
test('plano preserva IDs e vínculos; bloqueia anexos e não promete corte completo',()=>{
 const s=emptyState();const c=saveEntity(s,'contacts',org('legacy-contact'));const p=s.pipelines[0];saveEntity(s,'deals',{...deal('legacy-deal',p.stages[0].id),pipelineId:p.id,organizationId:c.id});
 const plan=importPlan(s);assert.equal(plan.cutoverReady,false);assert.equal(plan.blockers.length,0);assert.ok(plan.changes.some(c=>c.id==='legacy-contact'));assert.equal(plan.history.length,s.history.length);
 s.deals[0].attachments=[{id:'attachment-a',name:'teste.txt',size:1,base64:'YQ=='}];assert.match(importPlan(s).blockers.join(),/Storage/);
});
test('serviço usa ator autenticado e rejeita metadados de consulta/injeção',async()=>{
 let args;await recordService(async(_n,a)=>{args=a;return {data:[]};},admin,{action:'apply',actor:member,p_actor:member,requestId:'x',changes:[put('contacts',org('a'))]});assert.equal(args.p_actor,admin);
 await assert.rejects(()=>recordService(()=>{},admin,{action:'page',entity:'contacts;drop table x'}),/Consulta/);
 const repo=new RecordRepository(()=>{throw Error('não deve chamar');});await assert.rejects(()=>repo.apply([put('contacts',org('a')),put('contacts',org('a'))]),/repetido/);
});
test('SQL: registros independentes aceitam versões lidas antes de outra gravação; mesmo registro conflita',{skip:!modulePath},()=>withDatabase(async({apply,db})=>{
 await apply([put('contacts',org('org-a')),put('contacts',org('org-b'))]);
 // Both editors loaded version 1. No global revision is sent.
 await apply([put('contacts',org('org-a','Editado A'),1)],admin);
 await apply([put('contacts',org('org-b','Editado B'),1)],member);
 await assert.rejects(()=>apply([put('contacts',org('org-a','Sobrescrever'),1)],member),/CONFLICT/);
 assert.deepEqual((await db.query('select name,version from crm_records.contacts order by id')).rows.map(x=>[x.name,Number(x.version)]),[['Editado A',2],['Editado B',2]]);
 assert.equal((await db.query('select revision from public.crm_workspace')).rows[0].revision,0);
}));
test('SQL: requisição repetida retorna resultado sem repetir histórico, mas conteúdo divergente falha',{skip:!modulePath},()=>withDatabase(async({apply,db,rpc})=>{
 const changes=[put('contacts',org('org-a'))];const a=await apply(changes,admin,'same');assert.deepEqual(await apply(changes,admin,'same'),a);
 assert.equal((await db.query('select count(*)::int n from crm_records.history')).rows[0].n,1);
 const events=await recordService(rpc,member,{action:'history',entity:'contacts',id:'org-a',limit:1});assert.equal(events.length,1);assert.equal(events[0].actor_id,admin);
 assert.equal((await recordService(rpc,member,{action:'history',entity:'contacts',id:'org-a',before:Number(events[0].id)})).length,0);
 await assert.rejects(()=>apply([put('contacts',org('org-b'))],admin,'same'),/conteúdo diferente/);
}));
test('SQL: transação contato + pipeline + etapa + negócio é atômica, com FK de etapa e tipo de contato',{skip:!modulePath},()=>withDatabase(async({apply,db})=>{
 const seed=[put('contacts',org('org-a')),put('pipelines',pipe),put('stages',stage()),put('deals',deal())];await apply(seed);
 const row=(await db.query('select * from crm_records.deals')).rows[0];assert.equal(Number(row.value),100.25);assert.deepEqual(row.attributes.custom,{origem:'legado'});
 const decoded=fromRow('deals',row);assert.equal(decoded.record.owner,'Eu');assert.equal(decoded.version,1);assert.deepEqual(decoded.record.custom,{origem:'legado'});
 await assert.rejects(()=>apply([put('contacts',org('rollback')),put('deals',deal('bad','missing'))]),/foreign key/);
 assert.equal((await db.query("select count(*)::int n from crm_records.contacts where id='rollback'")).rows[0].n,0);
 await apply([put('pipelines',{...pipe,id:'other'}),put('stages',stage('other-stage','other'))]);
 await assert.rejects(()=>apply([put('deals',deal('wrong-pipeline','other-stage'))]),/foreign key/);
 await assert.rejects(()=>apply([put('contacts',{...org('org-a'),type:'person'},1)]),/foreign key/);
}));
test('SQL: remoção vinculada falha; transferência e exclusão em lote preservam negócio',{skip:!modulePath},()=>withDatabase(async({apply,db})=>{
 await apply([put('contacts',org('org-a')),put('pipelines',pipe),put('stages',stage()),put('stages',stage('stage-b',pipe.id,1)),put('deals',deal())]);
 await assert.rejects(()=>apply([del('contacts','org-a')]),/foreign key/);
 await assert.rejects(()=>apply([del('stages','stage-a')]),/foreign key/);
 await apply([put('deals',deal('deal-a','stage-b'),1),del('stages','stage-a')]);
 assert.equal((await db.query('select stage_id from crm_records.deals')).rows[0].stage_id,'stage-b');
 await apply([put('contacts',org('retired'))]);await apply([del('contacts','retired')]);
 await assert.rejects(()=>apply([put('contacts',org('retired'))]),/reutilizado/);
 await assert.rejects(()=>apply([del('stages','stage-b')]),/etapa/);
}));
test('SQL: permissões, revogação e senha inicial conferidas em cada comando',{skip:!modulePath},()=>withDatabase(async({apply,db,rpc})=>{
 await db.exec('set role service_role');await apply([put('contacts',org('org-a'))],member);await db.exec('reset role');
 await db.query('update public.crm_members set active=false where id=$1',[member]);await assert.rejects(()=>apply([put('contacts',org('blocked'))],member),/autorizado/);
 await db.query('update public.crm_members set active=true,must_change_password=true where id=$1',[member]);await assert.rejects(()=>recordService(rpc,member,{action:'page',entity:'contacts'}),/autorizado/);
 for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(()=>db.query('select * from crm_records.contacts'),/permission denied/);await assert.rejects(()=>db.query('select public.crm_records_apply($1,$2,$3::jsonb)',[admin,'forged','[]']),/permission denied/);await db.exec('reset role');}
}));
test('SQL: paginação é limitada no servidor, busca literal e filtro pipeline',{skip:!modulePath},()=>withDatabase(async({apply,rpc})=>{
 await apply([put('contacts',org('a','Mesmo email A')),put('contacts',org('b','Mesmo email B')),put('contacts',org('c','Outro'))]);
 const repo=new RecordRepository((action,args)=>recordService(rpc,member,{action,...args}));
 const first=await repo.page('contacts',{limit:1,search:'Mesmo'});assert.equal(first.rows.length,1);assert.equal(first.hasMore,true);
 assert.equal((await repo.get('contacts','a')).name,'Mesmo email A');assert.equal(await repo.get('contacts','missing'),null);
 const second=await repo.page('contacts',{limit:1,offset:1,search:'Mesmo'});assert.equal(second.hasMore,false);assert.notEqual(first.rows[0].id,second.rows[0].id);
 assert.equal((await repo.page('contacts',{search:'%'})).rows.length,0);
 await apply([put('pipelines',pipe),put('stages',stage()),put('pipelines',{...pipe,id:'other'}),put('stages',stage('other-stage','other'))]);
 assert.deepEqual((await repo.page('stages',{pipelineId:'other'})).rows.map(r=>r.id),['other-stage']);
}));
test('SQL: falha não consome chave de requisição nem falsifica versão/autor; rejeita payload inválido',{skip:!modulePath},()=>withDatabase(async({apply,db})=>{
 await assert.rejects(()=>apply([put('contacts',{...org('a'),name:''})],admin,'retry'),/check constraint/);
 const result=await apply([put('contacts',{...org('a'),version:999,updated_by:member})],admin,'retry');
 assert.equal(result[0].record.version,1);assert.equal(result[0].record.updated_by,admin);assert.ok(!Object.hasOwn(result[0].record.attributes,'version'));
 await assert.rejects(()=>db.query('select public.crm_records_apply($1,$2,null)',[admin,'invalid']),/Lote inválido/);
 await assert.rejects(()=>db.query('select public.crm_records_apply($1,$2,$3::jsonb)',[admin,'injection',JSON.stringify([{entity:'contacts;drop table x',op:'delete',id:'a',expectedVersion:1}])]),/Alteração inválida/);
 await assert.rejects(()=>apply([put('pipelines',pipe)]),/ao menos uma etapa/);
 await apply([put('pipelines',pipe),put('stages',stage())]);
 await assert.rejects(()=>apply([del('pipelines',pipe.id),del('stages','stage-a')]),/Mantenha ao menos/);
}));
test('SQL: importação vazia preserva IDs/histórico, é idempotente e exige administrador',{skip:!modulePath},()=>withDatabase(async({db,rpc})=>{
 const s=emptyState();saveEntity(s,'contacts',org('legacy'));const repo=new RecordRepository((action,args)=>recordService(rpc,admin,{action,...args}));
 const p=importPlan(s);await assert.rejects(()=>recordService(rpc,member,{action:'import',changes:p.changes,history:p.history,requestId:'import'}),/administradores/);
 const result=await repo.import(s,'import');assert.deepEqual(await repo.import(s,'import'),result);
 assert.equal((await db.query('select id from crm_records.contacts')).rows[0].id,'legacy');
 assert.equal((await db.query('select source_event from crm_records.history where source_id=$1',[s.history[0].id])).rows[0].source_event.message,s.history[0].message);
 await assert.rejects(()=>repo.import(s,'different'),/já realizada/);
}));
