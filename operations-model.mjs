// Work management and local automation. No network or delivery provider calls.
export const operationCollections=['projects','bookingTypes','bookings','journeys','enrollments','campaigns','deliveries','goals','dashboards','reportPresets'];
const id=()=>crypto.randomUUID();
const ensure=(ok,message)=>{if(!ok)throw Error(message);};
const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const str=(v,max=30000)=>typeof v==='string'&&v.length<=max;
const num=(v,max=1e12)=>Number.isFinite(v)&&v>=0&&v<=max;
export const metricNames={wonValue:'Valor ganho',wonCount:'Negócios ganhos',dealCount:'Negócios criados',conversion:'Conversão de encerrados (%)',taskCreated:'Atividades criadas',taskPending:'Atividades pendentes',activeDealCount:'Negócios ativos',activeDealValue:'Valor em negociação (R$)',lostCount:'Negócios perdidos',taskCompleted:'Atividades concluídas',taskOverdue:'Atividades em atraso',quoteApprovedValue:'Orçamentos aprovados (R$)',orderValue:'Valor de pedidos',campaignManualSent:'Envios registrados manualmente'};
export const metricMoney=new Set(['wonValue','quoteApprovedValue','orderValue','activeDealValue']);
export function normalizeOperations(s){
  for(const name of operationCollections)if(s[name]===undefined)s[name]=[];
  if(s.operationSettings===undefined)s.operationSettings={suppressedEmails:[]};
  return s;
}
export function activityPipelineId(s,a){return s.deals.find(d=>d.id===a.dealId)?.pipelineId||(s.pipelines.some(p=>p.id===a.pipelineId)?a.pipelineId:'');}
export function dateOnly(value){const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function localDateTime(value){const d=new Date(value);return `${dateOnly(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
export function validDay(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;const d=new Date(v+'T12:00');return !Number.isNaN(+d)&&dateOnly(d)===v;}
export function validLocal(v){return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v||'')&&validDay(v.slice(0,10))&&!Number.isNaN(Date.parse(v));}
function log(s,entityId,message,kind='operations',now=new Date().toISOString()){s.history.push({id:id(),entityId,kind,message,at:now});}
export function put(s,collection,record,now=new Date().toISOString()){
  const previous=s[collection].find(r=>r.id===record.id);
  const saved={...record,id:record.id||id(),created:previous?.created||now,updated:now};
  if(previous)s[collection]=s[collection].map(r=>r.id===saved.id?saved:r);else s[collection].push(saved);
  log(s,saved.id,`${previous?'Atualizado':'Criado'}: ${saved.name||saved.title||collection}`,collection,now);
  return saved;
}
export function validateOperations(s){
  for(const name of operationCollections){ensure(Array.isArray(s[name])&&s[name].length<=50000,`Coleção inválida: ${name}.`);const seen=new Set();for(const r of s[name]){ensure(r&&validId(r.id)&&!seen.has(r.id),`Identificador inválido em ${name}.`);seen.add(r.id);}}
  const ref=(name,value)=>!value||s[name].some(r=>r.id===value);
  const title=r=>str(r.name,200)&&r.name.trim();
  for(const p of s.projects)ensure(title(p)&&['ativo','concluido','arquivado'].includes(p.status)&&(!p.due||validDay(p.due)),'Projeto inválido: confira nome, status e prazo.');
  for(const a of s.activities){ensure(ref('projects',a.projectId),'O projeto da atividade não existe.');ensure(ref('pipelines',a.pipelineId),'O pipeline da atividade não existe.');if(a.duration!==undefined)ensure(num(a.duration,1440)&&a.duration>=5,'A duração deve ser de 5 a 1.440 minutos.');if(a.priority!==undefined)ensure(['baixa','normal','alta','urgente'].includes(a.priority),'Prioridade inválida.');if(a.recurrence!==undefined)ensure(['none','daily','weekly','monthly'].includes(a.recurrence),'Recorrência inválida.');}
  for(const t of s.bookingTypes)ensure(title(t)&&str(t.owner,150)&&t.owner.trim()&&num(t.duration,480)&&t.duration>=5&&num(t.buffer,120)&&Array.isArray(t.days)&&t.days.length&&t.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&/^\d{2}:\d{2}$/.test(t.start)&&/^\d{2}:\d{2}$/.test(t.end)&&t.start<t.end,'Tipo de agendamento inválido: confira responsável, duração e disponibilidade.');
  for(const b of s.bookings)ensure(str(b.title,200)&&b.title.trim()&&ref('bookingTypes',b.typeId)&&b.typeId&&ref('contacts',b.contactId)&&b.contactId&&ref('deals',b.dealId)&&ref('activities',b.activityId)&&b.activityId&&validLocal(b.start)&&validLocal(b.end)&&b.start<b.end&&['confirmado','concluido','cancelado'].includes(b.status),'Agendamento inválido: confira contato, horário e vínculos.');
  for(const j of s.journeys){ensure(title(j)&&['rascunho','ativa','pausada','arquivada'].includes(j.status)&&['manual','dealCreated','dealWon','stageEntered'].includes(j.trigger)&&ref('pipelines',j.pipelineId)&&Array.isArray(j.steps)&&j.steps.length>0&&j.steps.length<=30,'Jornada inválida: confira nome, gatilho e etapas.');const stepIds=new Set();for(const st of j.steps){ensure(validId(st.id)&&!stepIds.has(st.id)&&['task','wait','tag','move','condition','campaign'].includes(st.type),'Passo de jornada inválido.');stepIds.add(st.id);if(st.type==='wait')ensure(num(st.minutes,525600),'Espera inválida (máximo 365 dias).');if(st.type==='task')ensure(str(st.title,200)&&st.title.trim()&&num(st.minutes,525600),'Informe o assunto e prazo da atividade.');if(st.type==='tag')ensure(str(st.tag,150)&&st.tag.trim(),'Informe a tag da ação.');if(st.type==='move')ensure(s.pipelines.some(p=>p.id===st.pipelineId&&p.stages.some(t=>t.id===st.stageId)),'A etapa de destino da jornada não existe.');if(st.type==='condition')ensure(['ativo','ganho','perdido'].includes(st.status),'Status da condição inválido.');if(st.type==='campaign')ensure(ref('campaigns',st.campaignId)&&st.campaignId,'Selecione uma campanha existente.');}if(j.trigger==='stageEntered')ensure(s.pipelines.some(p=>p.id===j.pipelineId&&p.stages.some(st=>st.id===j.stageId)),'Selecione a etapa do gatilho.');}
  for(const run of s.enrollments)ensure(ref('journeys',run.journeyId)&&run.journeyId&&ref('deals',run.dealId)&&run.dealId&&['executando','aguardando','concluida','ignorada','erro','cancelada'].includes(run.status)&&Array.isArray(run.steps)&&Array.isArray(run.logs)&&Number.isInteger(run.cursor)&&run.cursor>=0&&run.cursor<=run.steps.length,'Execução de jornada inválida.');
  for(const c of s.campaigns)ensure(title(c)&&str(c.subject,300)&&c.subject.trim()&&str(c.body,30000)&&c.body.trim()&&['rascunho','programada','preparada','cancelada'].includes(c.status)&&(!c.scheduledAt||validLocal(c.scheduledAt))&&str(c.senderName,150)&&str(c.senderEmail,250)&&c.segment&&['all','organization','person'].includes(c.segment.type),'Campanha inválida: confira conteúdo, segmento e programação.');
  const recipients=new Set();for(const d of s.deliveries){const key=d.campaignId+':'+d.email.toLowerCase();ensure(ref('campaigns',d.campaignId)&&d.campaignId&&str(d.email,250)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)&&!recipients.has(key)&&['pendente','manual','cancelada'].includes(d.status)&&str(d.subject,300)&&str(d.body,30000),'Destinatário de campanha inválido ou duplicado.');recipients.add(key);}
  for(const g of s.goals)ensure(title(g)&&Object.hasOwn(metricNames,g.metric)&&Number.isFinite(g.target)&&g.target>0&&(g.metric!=='conversion'||g.target<=100)&&validDay(g.start)&&validDay(g.end)&&g.start<=g.end&&['total','weekly','monthly'].includes(g.frequency)&&ref('pipelines',g.pipelineId),'Meta inválida: confira métrica, valor, percentual e vigência.');
  for(const d of s.dashboards)ensure(title(d)&&Array.isArray(d.widgets)&&d.widgets.length>0&&d.widgets.length<=12&&d.widgets.every(w=>Object.hasOwn(metricNames,w)),'Dashboard inválido: selecione de 1 a 12 indicadores.');
  for(const r of s.reportPresets)ensure(title(r)&&Object.hasOwn(metricNames,r.metric)&&['owner','pipeline','month','status','origin'].includes(r.groupBy),'Relatório salvo inválido.');
  ensure(s.operationSettings&&Array.isArray(s.operationSettings.suppressedEmails)&&s.operationSettings.suppressedEmails.every(e=>str(e,250)),'Lista de descadastros inválida.');
}
export function guardOperationsDelete(s,collection,key){
  if(collection==='contacts')ensure(!s.bookings.some(b=>b.contactId===key),'Contato vinculado a agendamento. Preserve o histórico e marque o contato como inativo.');
  if(collection==='deals')ensure(!s.bookings.some(b=>b.dealId===key)&&!s.enrollments.some(r=>r.dealId===key),'Negócio vinculado a agendamento ou jornada. Preserve o registro para manter o histórico.');
  if(collection==='activities')ensure(!s.bookings.some(b=>b.activityId===key),'Atividade vinculada a agendamento. Gerencie-a pelo agendamento.');
}
function addMonth(date){const d=new Date(date),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d;}
export function completeTask(s,key,now=new Date().toISOString()){
  const task=s.activities.find(a=>a.id===key);ensure(task,'Atividade não encontrada.');if(task.status==='concluida')return;
  task.status='concluida';task.completedAt=now;task.updated=now;
  const booking=s.bookings.find(b=>b.activityId===key);if(booking)booking.status='concluido';
  log(s,task.dealId||key,`Atividade concluída: ${task.title}.`,task.dealId?'deals':'activities',now);
  if(task.recurrence&&task.recurrence!=='none'&&!s.activities.some(a=>a.recurrenceParent===key)){
    let due=new Date(task.due);let count=0;do{if(task.recurrence==='monthly')due=addMonth(due);else due.setDate(due.getDate()+(task.recurrence==='weekly'?7:1));}while(+due<=Date.parse(now)&&++count<5000);
    put(s,'activities',{...task,id:undefined,due:localDateTime(due),status:'pendente',completedAt:'',checklist:(task.checklist||[]).map(c=>({...c,done:false})),recurrenceParent:key},now);
  }
}
export function bookAppointment(s,record,now=new Date().toISOString()){
  const type=s.bookingTypes.find(t=>t.id===record.typeId);ensure(type,'Selecione um tipo de agendamento.');ensure(validLocal(record.start),'Informe data e horário válidos.');
  const start=new Date(record.start),end=new Date(+start+type.duration*60000);const existing=s.bookings.find(b=>b.id===record.id);
  const status=record.status||'confirmado';
  if(status==='confirmado'){
    ensure(+start>Date.parse(now),'O agendamento deve começar no futuro.');ensure(type.active!==false,'Este tipo de agendamento está inativo.');
    ensure(type.days.includes(start.getDay()),'Este dia não está disponível para o responsável.');
    ensure(record.start.slice(11)>=type.start&&dateOnly(start)===dateOnly(end)&&localDateTime(end).slice(11)<=type.end,'Horário fora da disponibilidade configurada.');
    const from=+start-type.buffer*60000,to=+end+type.buffer*60000;
    ensure(!s.activities.some(a=>a.id!==existing?.activityId&&a.owner===type.owner&&a.status!=='cancelada'&&Number.isFinite(Date.parse(a.due))&&Date.parse(a.due)<to&&Date.parse(a.due)+(a.duration||30)*60000>from),'Há outra atividade neste horário para o responsável, incluindo o intervalo de segurança.');
  }
  const activity=put(s,'activities',{...(s.activities.find(a=>a.id===existing?.activityId)||{}),id:existing?.activityId,title:record.title,due:record.start,duration:type.duration,owner:type.owner,type:'Reunião',status:status==='cancelado'?'cancelada':status==='concluido'?'concluida':'pendente',contactId:record.contactId,dealId:record.dealId||'',notes:record.notes||'',priority:'normal',recurrence:'none'},now);
  return put(s,'bookings',{...record,owner:type.owner,end:localDateTime(end),activityId:activity.id,status,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone},now);
}
export function campaignAudience(s,c){
  const seen=new Set(),suppressed=new Set(s.operationSettings.suppressedEmails.map(v=>v.trim().toLowerCase()));const audience=[];
  for(const person of s.contacts){const email=String(person.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||seen.has(email)||suppressed.has(email)||person.active===false||person.optOut)continue;
    if(c.segment.type!=='all'&&person.type!==c.segment.type||c.segment.tag&&!person.tags.includes(c.segment.tag)||c.segment.owner&&person.owner!==c.segment.owner||c.segment.clientsOnly&&!person.client)continue;
    seen.add(email);audience.push({contactId:person.id,email,name:person.name});
  }return audience;
}
export function personalize(text,values){return String(text).replace(/\{\{(nome|email|empresa)\}\}/g,(full,key)=>values[key]??'');}
export function queueRecipient(s,c,recipient,now=new Date().toISOString()){
  if(s.deliveries.some(d=>d.campaignId===c.id&&d.email===recipient.email))return false;
  const values={nome:recipient.name,email:recipient.email,empresa:recipient.name};
  s.deliveries.push({id:id(),campaignId:c.id,contactId:recipient.contactId,email:recipient.email,name:recipient.name,subject:personalize(c.subject,values),body:personalize(c.body,values),status:'pendente',preparedAt:now});return true;
}
export function prepareCampaign(s,key,now=new Date().toISOString()){
  const campaign=s.campaigns.find(c=>c.id===key);ensure(campaign,'Campanha não encontrada.');ensure(campaign.status!=='cancelada','A campanha foi cancelada.');
  const audience=campaignAudience(s,campaign);ensure(audience.length,'Nenhum email válido neste segmento. Confira também os descadastros.');
  for(const recipient of audience)queueRecipient(s,campaign,recipient,now);campaign.status='preparada';campaign.preparedAt=now;log(s,key,`${audience.length} destinatários preparados; nenhum email enviado.`, 'campaigns',now);
}
function qualifies(j,d){return (!j.pipelineId||j.pipelineId===d.pipelineId)&&(!j.owner||j.owner===d.owner)&&(!j.origin||j.origin===d.origin)&&(!j.tag||d.tags.includes(j.tag));}
export function enroll(s,journeyId,dealId,eventKey,now=new Date().toISOString()){
  const j=s.journeys.find(j=>j.id===journeyId),d=s.deals.find(d=>d.id===dealId);ensure(j&&d,'Selecione jornada e negócio existentes.');ensure(j.status==='ativa','Ative a jornada antes de iniciar.');
  if(!qualifies(j,d))return false;if(s.enrollments.some(r=>r.journeyId===journeyId&&r.dealId===dealId&&(r.eventKey===eventKey||['executando','aguardando'].includes(r.status))))return false;
  s.enrollments.push({id:id(),journeyId,dealId,eventKey,steps:structuredClone(j.steps),cursor:0,status:'executando',nextAt:now,created:now,logs:[{at:now,message:'Negócio inscrito. As ações serão executadas localmente.'}]});return true;
}
export function processOperations(s,previous,now=new Date().toISOString()){
  normalizeOperations(s);let changed=false;
  const suppressed=new Set(s.operationSettings.suppressedEmails.map(e=>e.trim().toLowerCase()));for(const delivery of s.deliveries){const contact=s.contacts.find(c=>c.id===delivery.contactId);if(delivery.status==='pendente'&&(suppressed.has(delivery.email.toLowerCase())||contact?.optOut||contact?.active===false)){delivery.status='cancelada';delivery.cancelReason='Descadastro ou contato inativo';changed=true;}}
  for(const d of s.deals){const old=previous?.deals.find(v=>v.id===d.id);if(old&&old.status!==d.status){d.closedAt=d.status==='ativo'?'':now;if(d.status==='ganho')d.wonAt=now;}
    for(const j of s.journeys.filter(j=>j.status==='ativa'&&j.trigger!=='manual')){
      const match=j.trigger==='dealCreated'&&!old||j.trigger==='dealWon'&&d.status==='ganho'&&old?.status!=='ganho'||j.trigger==='stageEntered'&&d.stageId===j.stageId&&(old?.stageId!==d.stageId||old?.pipelineId!==d.pipelineId);
      if(match)changed=enroll(s,j.id,d.id,`${previous?.revision??0}:${d.id}:${j.trigger}`,now)||changed;
    }
  }
  let budget=500;
  for(const run of s.enrollments){if(!['executando','aguardando'].includes(run.status)||Date.parse(run.nextAt)>Date.parse(now)||s.journeys.find(j=>j.id===run.journeyId)?.status!=='ativa')continue;
    const d=s.deals.find(d=>d.id===run.dealId);if(!d){run.status='erro';continue;}
    while(run.cursor<run.steps.length&&budget-->0){const st=run.steps[run.cursor];changed=true;try{
      if(st.type==='wait'){run.cursor++;run.nextAt=new Date(Date.parse(now)+st.minutes*60000).toISOString();run.status='aguardando';run.logs.push({at:now,message:`Espera iniciada: ${st.minutes} minutos.`});if(st.minutes>0)break;}
      else{if(st.type==='condition'&&d.status!==st.status){run.status='ignorada';run.logs.push({at:now,message:'Condição não atendida; execução encerrada.'});break;}
        if(st.type==='task')put(s,'activities',{title:st.title,owner:st.owner||d.owner,due:localDateTime(new Date(Date.parse(now)+st.minutes*60000)),duration:30,type:'Tarefa',status:'pendente',dealId:d.id,contactId:d.personId||d.organizationId,priority:'normal',recurrence:'none',journeyRunId:run.id},now);
        if(st.type==='tag'&&!d.tags.includes(st.tag))d.tags.push(st.tag);
        if(st.type==='move'){ensure(s.pipelines.some(p=>p.id===st.pipelineId&&p.stages.some(t=>t.id===st.stageId)),'A etapa de destino foi removida.');d.pipelineId=st.pipelineId;d.stageId=st.stageId;}
        if(st.type==='campaign'){const c=s.campaigns.find(c=>c.id===st.campaignId);ensure(c&&c.status!=='cancelada','Campanha indisponível.');const contact=s.contacts.find(c=>c.id===(d.personId||d.organizationId));const recipient=campaignAudience(s,{...c,segment:{type:'all'}}).find(r=>r.contactId===contact?.id);ensure(recipient,'Contato sem email válido ou descadastrado.');queueRecipient(s,c,recipient,now);}
        run.logs.push({at:now,message:{task:'Atividade criada.',tag:'Tag aplicada.',move:'Negócio transferido.',condition:'Condição atendida.',campaign:'Destinatário preparado; envio pendente.'}[st.type]});run.cursor++;run.status='executando';
      }
    }catch(error){run.status='erro';run.logs.push({at:now,message:error.message});break;}}
    if(run.cursor===run.steps.length&&run.status!=='erro'&&run.status!=='ignorada'&&(run.status!=='aguardando'||Date.parse(run.nextAt)<=Date.parse(now))){changed=true;run.status='concluida';run.logs.push({at:now,message:'Jornada concluída.'});}
  }
  for(const c of s.campaigns.filter(c=>c.status==='programada'&&validLocal(c.scheduledAt)&&Date.parse(c.scheduledAt)<=Date.parse(now))){try{prepareCampaign(s,c.id,now);}catch(error){c.status='rascunho';c.lastError=error.message;}changed=true;}
  return changed;
}
export function operationsDue(s,now=new Date().toISOString()){return s.enrollments.some(r=>['executando','aguardando'].includes(r.status)&&Date.parse(r.nextAt)<=Date.parse(now)&&s.journeys.find(j=>j.id===r.journeyId)?.status==='ativa')||s.campaigns.some(c=>c.status==='programada'&&Date.parse(c.scheduledAt)<=Date.parse(now));}
function inRange(value,f){if(!value)return false;const day=value.slice(0,10);return (!f.from||day>=f.from)&&(!f.to||day<=f.to);}
function dealMatches(d,f){return (!f.owner||d.owner===f.owner)&&(!f.pipelineId||d.pipelineId===f.pipelineId)&&(!f.status||d.status===f.status);}
export function metricValue(s,metric,f={},now=new Date().toISOString()){
  const deals=s.deals.filter(d=>dealMatches(d,f));
  const sum=rows=>Math.round(rows.reduce((n,d)=>n+d.value,0)*100)/100;
  if(metric==='activeDealCount')return deals.filter(d=>d.status==='ativo'&&inRange(d.created,f)).length;
  if(metric==='activeDealValue')return sum(deals.filter(d=>d.status==='ativo'&&inRange(d.created,f)));
  if(metric==='lostCount')return deals.filter(d=>d.status==='perdido'&&inRange(d.closedAt||d.updated||d.created,f)).length;
  if(metric==='dealCount')return deals.filter(d=>inRange(d.created,f)).length;
  const won=deals.filter(d=>d.status==='ganho'&&inRange(d.wonAt||d.closedAt||d.updated||d.created,f));
  if(metric==='wonValue')return sum(won);if(metric==='wonCount')return won.length;
  if(metric==='conversion'){const closed=deals.filter(d=>d.status!=='ativo'&&inRange(d.closedAt||d.updated||d.created,f));return closed.length?Math.round(won.length/closed.length*10000)/100:0;}
  if(['taskCreated','taskPending','taskCompleted','taskOverdue'].includes(metric))return s.activities.filter(a=>(!f.owner||a.owner===f.owner)&&(!f.pipelineId||activityPipelineId(s,a)===(f.pipelineId==='__none__'?'':f.pipelineId))&&(metric==='taskCreated'?inRange(a.created,f):metric==='taskPending'?a.status==='pendente'&&inRange(a.due,f):metric==='taskCompleted'?a.status==='concluida'&&inRange(a.completedAt||a.updated||a.due,f):a.status==='pendente'&&Date.parse(a.due)<Date.parse(now)&&inRange(a.due,f))).length;
  if(metric==='quoteApprovedValue')return Math.round(s.quotes.filter(q=>q.status==='aprovado'&&inRange(q.updated||q.created,f)&&(!f.owner||s.deals.find(d=>d.id===q.dealId)?.owner===f.owner)&&(!f.pipelineId||s.deals.find(d=>d.id===q.dealId)?.pipelineId===f.pipelineId)).reduce((n,q)=>n+Math.max(0,q.items.reduce((v,i)=>v+Math.round(i.quantity*i.unitPrice*(1-i.discount/100)*100),0)-Math.round(q.discount*100)+Math.round(q.freight*100))/100,0)*100)/100;
  if(metric==='orderValue')return Math.round(s.orders.filter(o=>o.status!=='cancelado'&&inRange(o.created,f)&&(!f.owner||s.deals.find(d=>d.id===o.dealId)?.owner===f.owner)&&(!f.pipelineId||s.deals.find(d=>d.id===o.dealId)?.pipelineId===f.pipelineId)).reduce((n,o)=>n+o.total,0)*100)/100;
  if(metric==='campaignManualSent')return s.deliveries.filter(d=>d.status==='manual'&&inRange(d.sentAt,f)&&(!f.owner||s.contacts.find(c=>c.id===d.contactId)?.owner===f.owner)&&!f.pipelineId).length;
  return 0;
}
export function goalProgress(s,g,now=new Date().toISOString()){
  let from=g.start,to=g.end;const current=dateOnly(now);
  if(g.frequency!=='total'){let pivot=current<g.start?g.start:current>g.end?g.end:current;const d=new Date(pivot+'T12:00');if(g.frequency==='monthly'){from=pivot.slice(0,7)+'-01';to=dateOnly(new Date(d.getFullYear(),d.getMonth()+1,0,12));}else{d.setDate(d.getDate()-((d.getDay()+6)%7));from=dateOnly(d);d.setDate(d.getDate()+6);to=dateOnly(d);}from=from<g.start?g.start:from;to=to>g.end?g.end:to;}
  const actual=metricValue(s,g.metric,{from,to,owner:g.owner,pipelineId:g.pipelineId},now);return {actual,percent:Math.round(actual/g.target*1000)/10,from,to,status:current<g.start?'Futura':current>g.end?'Encerrada':'Vigente'};
}
export function reportRows(s,metric,groupBy,filters={},now=new Date().toISOString()){
  let facts=[];
  const dealFact=(d,at,value)=>({at,value,owner:d?.owner||'',pipelineId:d?.pipelineId||'',origin:d?.origin||'',status:d?.status||''});
  if(['wonValue','wonCount','dealCount','conversion','activeDealCount','activeDealValue','lostCount'].includes(metric))facts=s.deals.filter(d=>metric==='dealCount'||['activeDealCount','activeDealValue'].includes(metric)&&d.status==='ativo'||metric==='lostCount'&&d.status==='perdido'||metric==='conversion'&&d.status!=='ativo'||['wonValue','wonCount'].includes(metric)&&d.status==='ganho').map(d=>dealFact(d,['dealCount','activeDealCount','activeDealValue'].includes(metric)?d.created:metric==='conversion'||metric==='lostCount'?d.closedAt||d.updated||d.created:d.wonAt||d.closedAt||d.updated||d.created,['wonValue','activeDealValue'].includes(metric)?d.value:metric==='conversion'?(d.status==='ganho'?1:0):1));
  if(['taskCreated','taskPending','taskCompleted','taskOverdue'].includes(metric))facts=s.activities.filter(a=>metric==='taskCreated'||metric==='taskPending'&&a.status==='pendente'||metric==='taskCompleted'&&a.status==='concluida'||metric==='taskOverdue'&&a.status==='pendente'&&Date.parse(a.due)<Date.parse(now)).map(a=>({...dealFact(s.deals.find(d=>d.id===a.dealId),metric==='taskCreated'?a.created:metric==='taskCompleted'?a.completedAt||a.updated||a.due:a.due,1),pipelineId:activityPipelineId(s,a),owner:a.owner||'',status:a.status}));
  if(metric==='quoteApprovedValue')facts=s.quotes.filter(q=>q.status==='aprovado').map(q=>({...dealFact(s.deals.find(d=>d.id===q.dealId),q.updated||q.created,Math.max(0,q.items.reduce((n,i)=>n+Math.round(i.quantity*i.unitPrice*(1-i.discount/100)*100),0)-Math.round(q.discount*100)+Math.round(q.freight*100))/100),status:q.status}));
  if(metric==='orderValue')facts=s.orders.filter(o=>o.status!=='cancelado').map(o=>({...dealFact(s.deals.find(d=>d.id===o.dealId),o.created,o.total),status:o.status}));
  if(metric==='campaignManualSent')facts=s.deliveries.filter(d=>d.status==='manual').map(d=>({at:d.sentAt,value:1,owner:s.contacts.find(c=>c.id===d.contactId)?.owner||'',pipelineId:'',origin:'',status:'manual'}));
  const groups=new Map();for(const f of facts){if(!inRange(f.at,filters)||filters.owner&&f.owner!==filters.owner||filters.pipelineId&&f.pipelineId!==(filters.pipelineId==='__none__'?'':filters.pipelineId)||filters.status&&f.status!==filters.status||filters.origin&&f.origin!==filters.origin)continue;
    const key=groupBy==='month'?f.at.slice(0,7):groupBy==='pipeline'?f.pipelineId||'__none__':f[groupBy]||'Não informado';const prev=groups.get(key)||{group:groupBy==='pipeline'?(s.pipelines.find(p=>p.id===f.pipelineId)?.name||'Sem pipeline'):key,...(groupBy==='pipeline'?{pipelineId:f.pipelineId}:{}),value:0,count:0};prev.value+=f.value;prev.count++;groups.set(key,prev);
  }
  return [...groups.values()].map(r=>({...r,value:metric==='conversion'?Math.round(r.value/r.count*10000)/100:Math.round(r.value*100)/100})).sort((a,b)=>groupBy==='month'?a.group.localeCompare(b.group):b.value-a.value);
}
