import test from 'node:test';
import assert from 'node:assert/strict';
import {createSandbox,actors} from './sandbox.mjs';
import {RecordRepository,fromRow} from './core.mjs';
import {recordService} from './service.mjs';
const put=(entity,data,expectedVersion=0)=>({entity,op:'put',id:data.id,expectedVersion,data});
test('projetos e tarefas: vínculo, horário de Brasília, versão e rollback no banco',async()=>{
 const sandbox=await createSandbox();try{
 const repo=new RecordRepository((action,values)=>recordService(sandbox.rpc,actors[0].id,{action,...values}));
 const project={id:'project-test',name:'Projeto fictício',status:'ativo',due:'2026-11-01'};
 const task={id:'task-test',title:'Contato de teste',projectId:project.id,contactId:'',dealId:'',due:'2026-10-30T10:30',owner:'Equipe de teste',status:'pendente',priority:'alta',duration:30,recurrence:'none',checklist:[{id:'item-a',name:'Conferir',done:false}]};
 await repo.apply([put('projects',project),put('activities',task)],'work-create');
 const row=await repo.get('activities',task.id);assert.equal(row.due_at,'2026-10-30T13:30:00+00:00');assert.equal(fromRow('activities',row).record.due,task.due);assert.deepEqual(row.attributes.checklist,task.checklist);
 await assert.rejects(()=>repo.apply([{entity:'projects',op:'delete',id:project.id,expectedVersion:1}]),/foreign key/);
 await repo.apply([put('activities',{...task,status:'concluida'},1)],'complete');assert.equal((await repo.get('activities',task.id)).version,2);
 await assert.rejects(()=>repo.apply([put('activities',{...task,title:'Edição antiga'},1)]),/CONFLICT/);
 await assert.rejects(()=>repo.apply([put('projects',{...project,id:'rolled-back'}),put('activities',{...task,id:'bad',projectId:'missing'})]),/foreign key/);
 assert.equal(await repo.get('projects','rolled-back'),null);
 }finally{await sandbox.close();}
});
test('tarefas: recorrência pendente de migração é recusada, permissões e filtros não regridem',async()=>{
 const sandbox=await createSandbox();try{
 const repo=new RecordRepository((action,values)=>recordService(sandbox.rpc,actors[1].id,{action,...values}));
 await assert.rejects(()=>repo.apply([put('activities',{id:'recurring',title:'Teste',due:'2026-10-30T10:30',owner:'Eu',status:'pendente',priority:'normal',duration:30,recurrence:'daily'})]),/check constraint/);
 await assert.rejects(()=>repo.apply([put('activities',{id:'bad-date',title:'Teste',due:'2026-10-30T10:30Z',owner:'Eu',status:'pendente'})]),/Prazo local inválido/);
 await sandbox.db.exec('set role authenticated');await assert.rejects(()=>sandbox.db.query('select * from crm_records.activities'),/permission denied/);await sandbox.db.exec('reset role');
 const p=await repo.page('pipelines',{limit:1});assert.equal(p.rows.length,1);assert.equal(p.hasMore,true);
 await sandbox.db.query('update public.crm_members set active=false where id=$1',[actors[1].id]);await assert.rejects(()=>repo.page('activities'),/autorizado/);
 }finally{await sandbox.close();}
});
test('migration de trabalho é gerada de forma determinística',async()=>{
 const {readFile}=await import('node:fs/promises');const {spawnSync}=await import('node:child_process');const {fileURLToPath}=await import('node:url');
 const target=new URL('../supabase/records/002_work.sql',import.meta.url),before=await readFile(target,'utf8');
 const run=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/extend-record-work.mjs',import.meta.url)),'--check']);assert.equal(run.status,0);assert.equal(await readFile(target,'utf8'),before);
});
