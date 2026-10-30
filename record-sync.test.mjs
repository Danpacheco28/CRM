import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {emptyState,saveEntity,validateState} from './model.mjs';
import {createSandbox,actors} from './records/sandbox.mjs';
import {flattenRecords,recordChanges,saveRecordChanges,assembleRecords,recordGuards,validateRecordInvariants} from './record-sync.mjs';
const admin=actors[0].id,member=actors[1].id;
function sample(){const s=emptyState();for(const id of ['contact-a','contact-b'])saveEntity(s,'contacts',{id,type:'organization',name:id,organizationId:'',email:id+'@example.test',tags:[],active:true});s.extension={preserved:true};return s;}
test('codec preserva todas as coleções, configurações, anexos e extensões sem enviar a base inteira',()=>{
 const state=sample();state.deals.push({id:'attachment-deal',title:'Anexo de teste',pipelineId:state.pipelines[0].id,stageId:state.pipelines[0].stages[0].id,organizationId:'contact-a',owner:'Eu',value:10,status:'ativo',tags:[],attachments:[{id:'file-test',name:'teste.txt',size:1,base64:'YQ=='}]});validateState(state);assert.deepEqual(assembleRecords(Object.values(flattenRecords(state)),state.revision,state.savedAt),state);
 const next=structuredClone(state);next.contacts[0].name='Atualizado';const changes=recordChanges(state,next,{});assert.equal(changes.length,1);assert.equal(changes[0].collection,'contacts');assert.ok(!JSON.stringify(changes).includes('Pipeline de Vendas'));
});
test('SQL de produção: migração, gravações independentes, conflitos, rebase e retorno ao navegador',async t=>{
 const env=await createSandbox({seed:false});try{
  await env.db.exec(await readFile(new URL('supabase/migrations/202610300001_record_compat.sql',import.meta.url),'utf8'));
  const state=sample();await env.db.query('select public.crm_save_workspace($1,0,$2::jsonb,true)',[admin,JSON.stringify(state)]);
  const rpc=async(name,args)=>{assert.ok(['crm_record_read','crm_record_activate','crm_record_receipt','crm_record_apply'].includes(name));const vals=Object.values(args),placeholders=vals.map((v,i)=>`$${i+1}${typeof v==='object'&&v!==null?'::jsonb':''}`);try{const result=await env.db.query(`select public.${name}(${placeholders}) data`,vals.map(v=>typeof v==='object'&&v!==null?JSON.stringify(v):v));return {data:result.rows[0].data};}catch(error){return {error};}};
  const load=async actor=>{const r=await rpc('crm_record_read',{p_actor:actor||admin});if(r.error)throw r.error;return r.data;};
  const legacy=await load();assert.equal(legacy.mode,'snapshot');validateState(legacy.payload);
  const activated=await rpc('crm_record_activate',{p_actor:admin,p_expected:legacy.revision,p_snapshot:legacy.payload,p_entries:flattenRecords(legacy.payload)});if(activated.error)throw activated.error;
  const initial=await load();assert.equal(initial.mode,'records');assert.deepEqual(initial.payload,legacy.payload);
  await t.test('backup congelado e versão antiga bloqueada',async()=>{
   assert.deepEqual((await env.db.query('select payload from crm_store.backups')).rows[0].payload,legacy.payload);
   await assert.rejects(()=>env.db.query('select public.crm_save_workspace($1,$2,$3::jsonb)',[admin,legacy.revision,JSON.stringify({...legacy.payload,revision:legacy.revision+1})]),/aplicativo antigo/);
  });
  const save=(base,next,id,actor=admin,custom=rpc)=>saveRecordChanges(custom,actor,{requestId:id,changes:recordChanges(base.payload,next,base.versions),guards:recordGuards(base.payload,recordChanges(base.payload,next,base.versions),base.versions)},validateState);
  await t.test('duas pessoas em registros diferentes, mesma leitura inicial',async()=>{
   const a=structuredClone(initial.payload),b=structuredClone(initial.payload);a.contacts[0].name='Editado A';b.contacts[1].name='Editado B';await save(initial,a,'editor-a');await save(initial,b,'editor-b',member);
   assert.deepEqual((await load()).payload.contacts.map(c=>c.name),['Editado A','Editado B']);
   await assert.rejects(()=>save(initial,a,'stale'),/CONFLICT/);
  });
  await t.test('repetição confirma uma única operação, rejeita chave divergente',async()=>{
   const base=await load(),next=structuredClone(base.payload);next.contacts[0].phone='123';await save(base,next,'idempotent');await save(base,next,'idempotent');assert.equal((await load()).versions['contacts:contact-a'],3);
   next.contacts[0].phone='456';await assert.rejects(()=>save(base,next,'idempotent'),/conteúdo diferente/);
  });
  await t.test('corrida durante validação é reprocessada sem perder outro registro',async()=>{
   const base=await load(),a=structuredClone(base.payload),b=structuredClone(base.payload);a.contacts[0].phone='A';b.contacts[1].phone='B';let raced=false;
   const racing=async(name,args)=>{if(name==='crm_record_apply'&&!raced){raced=true;await save(base,b,'race-b',member);}return rpc(name,args);};await save(base,a,'race-a',admin,racing);
   assert.deepEqual((await load()).payload.contacts.map(c=>c.phone),['A','B']);
  });
  await t.test('vínculos inválidos e configurações usadas não atravessam o merge',async()=>{
   const base=await load(),next=structuredClone(base.payload);next.deals.push({id:'bad',title:'Inválido',pipelineId:'missing',stageId:'missing',organizationId:'contact-a',owner:'Eu',value:0,status:'ativo',tags:[]});await assert.rejects(()=>save(base,next,'bad'),/pipeline/);
   assert.equal((await load()).payload.deals.length,0);
   const settings=structuredClone(base.payload);settings.settings.tags.push('Atualização de teste');await save(base,settings,'config-update');
   await assert.rejects(()=>saveRecordChanges(rpc,admin,{requestId:'stale-config',changes:[{collection:'contacts',id:'contact-a',expected:base.versions['contacts:contact-a'],deleted:false,data:{...base.payload.contacts[0],phone:'Não confirmar'}}],guards:[{collection:'settings',id:'singleton',expected:base.versions['settings:singleton']}]},validateState),/configuração/);
  });
  await t.test('importação exige a revisão da prévia mesmo quando outro registro mudou',async()=>{
   const base=await load(),next=structuredClone(base.payload);next.contacts[0].name='Importação não confirmada';
   const other=structuredClone(base.payload);other.contacts[1].phone='Outra edição';await save(base,other,'before-import',member);
   const changes=recordChanges(base.payload,next,base.versions);
   await assert.rejects(()=>saveRecordChanges(rpc,admin,{requestId:'import-stale',requireRevision:base.revision,changes},validateState),/prévia de importação/);
   assert.notEqual((await load()).payload.contacts[0].name,'Importação não confirmada');
  });
  await t.test('transação inválida não escreve parcialmente e usuário revogado não lê',async()=>{
   const base=await load(),changes=[{collection:'contacts',id:'contact-a',expected:base.versions['contacts:contact-a'],deleted:false,data:{...base.payload.contacts[0],name:'Não confirmar'}},{collection:'contacts',id:'contact-b',expected:0,deleted:true,data:null}];
   const r=await rpc('crm_record_apply',{p_actor:admin,p_request:'atomic',p_expected:base.revision,p_changes:changes,p_saved_at:new Date().toISOString()});assert.match(r.error.message,/CONFLICT/);assert.notEqual((await load()).payload.contacts[0].name,'Não confirmar');
   await env.db.query('update public.crm_members set active=false where id=$1',[member]);await assert.rejects(()=>load(member),/autorizado/);
   await env.db.exec('set role authenticated');await assert.rejects(()=>env.db.query('select * from crm_store.entries'),/permission denied/);await assert.rejects(()=>env.db.query('select public.crm_record_read($1)',[admin]),/permission denied/);await env.db.exec('reset role');
  });
 }finally{await env.close();}
});
test('invariantes entre módulos impedem pedidos e recorrências duplicadas',()=>{
 const state=emptyState();state.orders=[{quoteId:'q'},{quoteId:'q'}];assert.throws(()=>validateRecordInvariants(state),/pedido/);state.orders=[];state.activities=[{recurrenceParent:'task-a'},{recurrenceParent:'task-a'}];assert.throws(()=>validateRecordInvariants(state),/recorrência/);
});
