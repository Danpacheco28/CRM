// Production compatibility layer: one authoritative row per commercial record.
// Keeps existing modules intact; typed normalization/paged reads are separate work.
export const recordCollections=['pipelines','contacts','deals','activities','products','priceLists','quotes','orders','history','templates','projects','bookingTypes','bookings','journeys','enrollments','campaigns','deliveries','goals','dashboards','reportPresets'];
const rootFields=['settings','operationSettings'];
export function flattenRecords(state){
 const entries={};
 for(const collection of recordCollections){for(const [position,data] of (state[collection]||[]).entries()){if(!data?.id||entries[collection+':'+data.id])throw Error('Identificador duplicado.');entries[collection+':'+data.id]={collection,id:data.id,data,position};}}
 for(const collection of rootFields)entries[collection+':singleton']={collection,id:'singleton',data:state[collection]};
 const extra=Object.fromEntries(Object.entries(state).filter(([k])=>![...recordCollections,...rootFields,'schema','revision','savedAt'].includes(k)));
 entries['extra:singleton']={collection:'extra',id:'singleton',data:extra};return entries;
}
export function assembleRecords(entries,revision,savedAt){
 const state={schema:2,revision,savedAt,...Object.fromEntries(recordCollections.map(k=>[k,[]]))};
 for(const entry of entries){if(recordCollections.includes(entry.collection))state[entry.collection].push(entry.data);else if(rootFields.includes(entry.collection))state[entry.collection]=entry.data;else if(entry.collection==='extra')Object.assign(state,entry.data);}
 return state;
}
export function recordChanges(previous,next,versions){
 const before=flattenRecords(previous),after=flattenRecords(next),changes=[];
 for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
  if(JSON.stringify(before[key]?.data)===JSON.stringify(after[key]?.data))continue;
  const entry=after[key]||before[key],expected=versions[key]??0;
  if(!Number.isSafeInteger(expected)||expected<0)throw Error('Versão do registro inválida.');
  changes.push({...entry,expected,deleted:!after[key],data:after[key]?.data??null});
 }
 return changes;
}
export function recordGuards(previous,changes,versions){
 const dependencies=changes.some(c=>['deals','activities','bookings','enrollments','campaigns','deliveries'].includes(c.collection))?['journeys','bookingTypes','campaigns','settings','operationSettings']:[];
 return Object.values(flattenRecords(previous)).filter(e=>dependencies.includes(e.collection)&&!changes.some(c=>c.collection===e.collection&&c.id===e.id)).map(e=>({collection:e.collection,id:e.id,expected:versions[e.collection+':'+e.id]??0}));
}
export function validateRecordInvariants(state){
 const unique=(rows,key,message)=>{const seen=new Set();for(const row of rows){const value=key(row);if(!value)continue;if(seen.has(value))throw Error('CONFLICT: '+message);seen.add(value);}};
 unique(state.orders,o=>o.quoteId,'Já existe um pedido para este orçamento.');
 unique(state.activities,a=>a.recurrenceParent,'A próxima recorrência já foi criada.');
 unique(state.bookings,b=>b.activityId,'Atividade vinculada a dois agendamentos.');
 unique(state.enrollments,r=>['executando','aguardando'].includes(r.status)?r.journeyId+':'+r.dealId:'','Já existe uma execução ativa desta jornada.');
 for(const booking of state.bookings.filter(b=>b.status==='confirmado')){
  const type=state.bookingTypes.find(t=>t.id===booking.typeId);if(!type)continue;
  const from=Date.parse(booking.start)-type.buffer*60000,to=Date.parse(booking.end)+type.buffer*60000;
  if(state.activities.some(a=>a.id!==booking.activityId&&a.owner===type.owner&&a.status!=='cancelada'&&Date.parse(a.due)<to&&Date.parse(a.due)+(a.duration||30)*60000>from))throw Error('CONFLICT: horário ocupado para este responsável.');
 }
 const suppressed=new Set(state.operationSettings.suppressedEmails.map(e=>e.toLowerCase()));
 for(const d of state.deliveries.filter(d=>d.status==='pendente')){const contact=state.contacts.find(c=>c.id===d.contactId);if(suppressed.has(d.email.toLowerCase())||contact?.optOut||contact?.active===false)throw Error('CONFLICT: destinatário descadastrado ou inativo. Atualize a base.');}
}
export function mergeRecordChanges(context,changes){
 if(!Array.isArray(changes)||!changes.length||changes.length>2000)throw Error('Envie de 1 a 2.000 registros por operação.');
 const entries=flattenRecords(context.payload),seen=new Set();
 for(const change of changes){
  const key=change.collection+':'+change.id;
  if(![...recordCollections,...rootFields,'extra'].includes(change.collection)||typeof change.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(change.id)||seen.has(key)||typeof change.deleted!=='boolean'||!Number.isSafeInteger(change.expected)||change.expected<0)throw Error('Alteração de registro inválida.');
  seen.add(key);if((context.versions[key]??0)!==change.expected)throw Error('CONFLICT: este registro foi alterado. Atualize a base antes de refazer a edição.');
  if(change.deleted){if(!entries[key])throw Error('CONFLICT: registro já removido.');delete entries[key];}
  else{if(!change.data||typeof change.data!=='object'||Array.isArray(change.data)||recordCollections.includes(change.collection)&&change.data.id!==change.id||!recordCollections.includes(change.collection)&&change.id!=='singleton'||change.collection==='extra'&&Object.keys(change.data).some(k=>[...recordCollections,...rootFields,'schema','revision','savedAt','__proto__','constructor','prototype'].includes(k)))throw Error('Dados do registro inválidos.');entries[key]={collection:change.collection,id:change.id,data:change.data};}
 }
 return assembleRecords(Object.values(entries),context.revision+1,new Date().toISOString());
}
export async function saveRecordChanges(rpc,actor,input,validateState){
 if(typeof input.requestId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(input.requestId))throw Error('Requisição inválida.');
 for(let attempt=0;attempt<4;attempt++){
  const {data:context,error}=await rpc('crm_record_read',{p_actor:actor});if(error)throw Error(error.message);
  if(context.mode!=='records')throw Error('Atualize a base antes de usar a gravação por registro.');
  // Replay is checked by SQL before comparing versions. No duplicate mutation.
  const {data:receipt,error:receiptError}=await rpc('crm_record_receipt',{p_actor:actor,p_request:input.requestId,p_changes:input.changes});if(receiptError)throw Error(receiptError.message);
  if(receipt){const {data:confirmed,error:readError}=await rpc('crm_record_read',{p_actor:actor});if(readError)throw Error(readError.message);return {state:confirmed.payload,versions:confirmed.versions,mode:'records'};}
  for(const guard of input.guards||[]){if((context.versions[guard.collection+':'+guard.id]??0)!==guard.expected)throw Error('CONFLICT: uma configuração usada nesta alteração mudou. Atualize a base.');}
  const next=mergeRecordChanges(context,input.changes);validateState(next);validateRecordInvariants(next);
  const {error:saveError}=await rpc('crm_record_apply',{p_actor:actor,p_request:input.requestId,p_expected:context.revision,p_changes:input.changes,p_saved_at:next.savedAt});
  if(saveError){if(saveError.message.includes('REBASE:'))continue;throw Error(saveError.message);}
  const {data:confirmed,error:readError}=await rpc('crm_record_read',{p_actor:actor});if(readError)throw Error(readError.message);
  return {state:confirmed.payload,versions:confirmed.versions,mode:'records'};
 }
 throw Error('CONFLICT: a base recebeu várias atualizações. Atualize antes de tentar novamente.');
}
