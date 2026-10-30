// Homologation only: independent from the published snapshot application.
import {validateState} from '../model.mjs';
export const entities=['contacts','pipelines','stages','deals','projects','activities'];
const key=/^[A-Za-z0-9_-]{1,100}$/;
// Keep SQL metadata separate; callers can round-trip model records explicitly.
export function fromRow(entity,row){
  const record={...row.attributes,id:row.id};
  if(entity==='contacts')Object.assign(record,{type:row.kind,name:row.name,organizationId:row.organization_id||'',email:row.email,phone:row.phone,active:row.active});
  else if(entity==='pipelines')Object.assign(record,{name:row.name,type:row.kind});
  else if(entity==='stages')Object.assign(record,{name:row.name,pipelineId:row.pipeline_id,position:row.position,probability:Number(row.probability)});
  else if(entity==='deals')Object.assign(record,{title:row.title,pipelineId:row.pipeline_id,stageId:row.stage_id,organizationId:row.organization_id||'',personId:row.person_id||'',owner:row.owner_label,value:Number(row.value),status:row.status,lossReason:row.loss_reason});
  else if(entity==='projects')Object.assign(record,{name:row.name,status:row.status,due:row.due||''});
  else if(entity==='activities')Object.assign(record,{title:row.title,contactId:row.contact_id||'',dealId:row.deal_id||'',projectId:row.project_id||'',due:row.due_local.slice(0,16),owner:row.owner_label,status:row.status,priority:row.priority,duration:row.duration,recurrence:row.recurrence});
  else throw Error('Entidade inválida.');
  return {record,version:Number(row.version),updatedAt:row.updated_at,updatedBy:row.updated_by};
}
export function validateBatch(changes){
  if(!Array.isArray(changes)||!changes.length||changes.length>500)throw Error('Envie de 1 a 500 alterações.');
  const seen=new Set();
  for(const c of changes){
    if(!entities.includes(c.entity)||!['put','delete'].includes(c.op)||!key.test(c.id||'')||!Number.isSafeInteger(c.expectedVersion)||c.expectedVersion<0)throw Error('Alteração inválida.');
    const identity=`${c.entity}:${c.id}`;if(seen.has(identity))throw Error('Registro repetido na transação.');seen.add(identity);
    if(c.op==='put'&&(!c.data||typeof c.data!=='object'||Array.isArray(c.data)||c.data.id!==c.id))throw Error('Dados do registro inválidos.');
    if(c.entity==='deals'&&c.data?.attachments?.length)throw Error('Migre os anexos para Storage antes de importar.');
  }
  return changes;
}
export function importPlan(snapshot){
  const s=structuredClone(snapshot);validateState(s);
  const changes=[],blockers=[],stageIds=new Set();
  const put=(entity,data)=>changes.push({entity,op:'put',id:data.id,expectedVersion:0,data});
  // Organizations must precede people for clients that inspect the plan.
  for(const c of [...s.contacts].sort((a,b)=>Number(!!a.organizationId)-Number(!!b.organizationId)))put('contacts',c);
  for(const p of s.pipelines){const {stages,...parent}=p;put('pipelines',parent);for(const st of stages){if(stageIds.has(st.id))blockers.push(`ID de etapa repetido entre pipelines: ${st.id}`);stageIds.add(st.id);put('stages',{...st,pipelineId:p.id,position:stages.indexOf(st)});}}
  for(const d of s.deals){if(d.attachments?.length)blockers.push(`Negócio ${d.id} possui anexos pendentes de Storage.`);put('deals',d);}
  const retained=Object.keys(s).filter(k=>Array.isArray(s[k])&&!['contacts','pipelines','deals','history'].includes(k)&&s[k].length).map(collection=>({collection,count:s[collection].length}));
  if(changes.length>500)blockers.push('Importação inicial desta etapa limitada a 500 registros; implementar carga em lotes antes de migrar esta base.');
  return {changes,history:structuredClone(s.history),blockers,retained,counts:{contacts:s.contacts.length,pipelines:s.pipelines.length,stages:stageIds.size,deals:s.deals.length,history:s.history.length},cutoverReady:false};
}
export class RecordRepository{
  constructor(call){this.call=call;}
  async apply(changes,requestId=crypto.randomUUID()){validateBatch(changes);return this.call('apply',{changes,requestId});}
  async get(entity,id){return this.call('get',{entity,id});}
  async page(entity,{limit=25,offset=0,search='',pipelineId=''}={}){if(!entities.includes(entity)||!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||search.length>200)throw Error('Consulta inválida.');return this.call('page',{entity,limit,offset,search,pipelineId});}
  async history(entity,id,{limit=25,before=null}={}){return this.call('history',{entity,id,limit,before});}
  async import(snapshot,requestId=crypto.randomUUID()){const plan=importPlan(snapshot);if(plan.blockers.length)throw Error(plan.blockers.join('\n'));validateBatch(plan.changes);return this.call('import',{changes:plan.changes,history:plan.history,requestId});}
}
