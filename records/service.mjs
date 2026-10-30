import {entities,validateBatch} from './core.mjs';
// Actor comes exclusively from verified Auth, never from the request body.
export async function recordService(rpc,actor,input){
  let name,args;
  if(input.action==='apply'||input.action==='import'){
    validateBatch(input.changes);
    if(typeof input.requestId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(input.requestId))throw Error('Identificador de requisição inválido.');
    name=input.action==='apply'?'crm_records_apply':'crm_records_import';
    args={p_actor:actor,p_request:input.requestId,p_changes:input.changes};
    if(input.action==='import'){if(!Array.isArray(input.history))throw Error('Histórico inválido.');args.p_history=input.history;}
  }else if(input.action==='get'){
    if(!entities.includes(input.entity)||typeof input.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(input.id))throw Error('Consulta inválida.');
    name='crm_records_get';args={p_actor:actor,p_entity:input.entity,p_id:input.id};
  }else if(input.action==='history'){
    const {entity,id,limit=25,before=null}=input;
    if(!entities.includes(entity)||typeof id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(id)||!Number.isInteger(limit)||limit<1||limit>100||(before!==null&&(!Number.isSafeInteger(before)||before<1)))throw Error('Consulta inválida.');
    name='crm_records_history';args={p_actor:actor,p_entity:entity,p_id:id,p_limit:limit,p_before:before};
  }else if(input.action==='page'){
    const {entity,limit=25,offset=0,search='',pipelineId=''}=input;
    if(!entities.includes(entity)||!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||typeof search!=='string'||search.length>200||typeof pipelineId!=='string')throw Error('Consulta inválida.');
    name='crm_records_page';args={p_actor:actor,p_entity:entity,p_limit:limit,p_offset:offset,p_search:search,p_pipeline:pipelineId};
  }else throw Error('Operação inválida.');
  const {data,error}=await rpc(name,args);if(error)throw Error(error.message);return data;
}
