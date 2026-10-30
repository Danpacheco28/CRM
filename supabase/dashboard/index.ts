// @ts-nocheck
// Generated dashboard deployment. Canonical sources remain unchanged.
import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
const crmOperations=(()=>{
// Work management and local automation. No network or delivery provider calls.
const operationCollections=['projects','bookingTypes','bookings','journeys','enrollments','campaigns','deliveries','goals','dashboards','reportPresets'];
const id=()=>crypto.randomUUID();
const ensure=(ok,message)=>{if(!ok)throw Error(message);};
const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const str=(v,max=30000)=>typeof v==='string'&&v.length<=max;
const num=(v,max=1e12)=>Number.isFinite(v)&&v>=0&&v<=max;
const metricNames={wonValue:'Valor ganho',wonCount:'Negócios ganhos',dealCount:'Negócios criados',conversion:'Conversão de encerrados (%)',taskCreated:'Atividades criadas',taskPending:'Atividades pendentes',activeDealCount:'Negócios ativos',activeDealValue:'Valor em negociação (R$)',lostCount:'Negócios perdidos',taskCompleted:'Atividades concluídas',taskOverdue:'Atividades em atraso',quoteApprovedValue:'Orçamentos aprovados (R$)',orderValue:'Valor de pedidos',campaignManualSent:'Envios registrados manualmente'};
const metricMoney=new Set(['wonValue','quoteApprovedValue','orderValue','activeDealValue']);
function normalizeOperations(s){
  for(const name of operationCollections)if(s[name]===undefined)s[name]=[];
  if(s.operationSettings===undefined)s.operationSettings={suppressedEmails:[]};
  return s;
}
function activityPipelineId(s,a){return s.deals.find(d=>d.id===a.dealId)?.pipelineId||(s.pipelines.some(p=>p.id===a.pipelineId)?a.pipelineId:'');}
function dateOnly(value){const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function localDateTime(value){const d=new Date(value);return `${dateOnly(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function validDay(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;const d=new Date(v+'T12:00');return !Number.isNaN(+d)&&dateOnly(d)===v;}
function validLocal(v){return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v||'')&&validDay(v.slice(0,10))&&!Number.isNaN(Date.parse(v));}
function log(s,entityId,message,kind='operations',now=new Date().toISOString()){s.history.push({id:id(),entityId,kind,message,at:now});}
function put(s,collection,record,now=new Date().toISOString()){
  const previous=s[collection].find(r=>r.id===record.id);
  const saved={...record,id:record.id||id(),created:previous?.created||now,updated:now};
  if(previous)s[collection]=s[collection].map(r=>r.id===saved.id?saved:r);else s[collection].push(saved);
  log(s,saved.id,`${previous?'Atualizado':'Criado'}: ${saved.name||saved.title||collection}`,collection,now);
  return saved;
}
function validateOperations(s){
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
function guardOperationsDelete(s,collection,key){
  if(collection==='contacts')ensure(!s.bookings.some(b=>b.contactId===key),'Contato vinculado a agendamento. Preserve o histórico e marque o contato como inativo.');
  if(collection==='deals')ensure(!s.bookings.some(b=>b.dealId===key)&&!s.enrollments.some(r=>r.dealId===key),'Negócio vinculado a agendamento ou jornada. Preserve o registro para manter o histórico.');
  if(collection==='activities')ensure(!s.bookings.some(b=>b.activityId===key),'Atividade vinculada a agendamento. Gerencie-a pelo agendamento.');
}
function addMonth(date){const d=new Date(date),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d;}
function completeTask(s,key,now=new Date().toISOString()){
  const task=s.activities.find(a=>a.id===key);ensure(task,'Atividade não encontrada.');if(task.status==='concluida')return;
  task.status='concluida';task.completedAt=now;task.updated=now;
  const booking=s.bookings.find(b=>b.activityId===key);if(booking)booking.status='concluido';
  log(s,task.dealId||key,`Atividade concluída: ${task.title}.`,task.dealId?'deals':'activities',now);
  if(task.recurrence&&task.recurrence!=='none'&&!s.activities.some(a=>a.recurrenceParent===key)){
    let due=new Date(task.due);let count=0;do{if(task.recurrence==='monthly')due=addMonth(due);else due.setDate(due.getDate()+(task.recurrence==='weekly'?7:1));}while(+due<=Date.parse(now)&&++count<5000);
    put(s,'activities',{...task,id:undefined,due:localDateTime(due),status:'pendente',completedAt:'',checklist:(task.checklist||[]).map(c=>({...c,done:false})),recurrenceParent:key},now);
  }
}
function bookAppointment(s,record,now=new Date().toISOString()){
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
function campaignAudience(s,c){
  const seen=new Set(),suppressed=new Set(s.operationSettings.suppressedEmails.map(v=>v.trim().toLowerCase()));const audience=[];
  for(const person of s.contacts){const email=String(person.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||seen.has(email)||suppressed.has(email)||person.active===false||person.optOut)continue;
    if(c.segment.type!=='all'&&person.type!==c.segment.type||c.segment.tag&&!person.tags.includes(c.segment.tag)||c.segment.owner&&person.owner!==c.segment.owner||c.segment.clientsOnly&&!person.client)continue;
    seen.add(email);audience.push({contactId:person.id,email,name:person.name});
  }return audience;
}
function personalize(text,values){return String(text).replace(/\{\{(nome|email|empresa)\}\}/g,(full,key)=>values[key]??'');}
function queueRecipient(s,c,recipient,now=new Date().toISOString()){
  if(s.deliveries.some(d=>d.campaignId===c.id&&d.email===recipient.email))return false;
  const values={nome:recipient.name,email:recipient.email,empresa:recipient.name};
  s.deliveries.push({id:id(),campaignId:c.id,contactId:recipient.contactId,email:recipient.email,name:recipient.name,subject:personalize(c.subject,values),body:personalize(c.body,values),status:'pendente',preparedAt:now});return true;
}
function prepareCampaign(s,key,now=new Date().toISOString()){
  const campaign=s.campaigns.find(c=>c.id===key);ensure(campaign,'Campanha não encontrada.');ensure(campaign.status!=='cancelada','A campanha foi cancelada.');
  const audience=campaignAudience(s,campaign);ensure(audience.length,'Nenhum email válido neste segmento. Confira também os descadastros.');
  for(const recipient of audience)queueRecipient(s,campaign,recipient,now);campaign.status='preparada';campaign.preparedAt=now;log(s,key,`${audience.length} destinatários preparados; nenhum email enviado.`, 'campaigns',now);
}
function qualifies(j,d){return (!j.pipelineId||j.pipelineId===d.pipelineId)&&(!j.owner||j.owner===d.owner)&&(!j.origin||j.origin===d.origin)&&(!j.tag||d.tags.includes(j.tag));}
function enroll(s,journeyId,dealId,eventKey,now=new Date().toISOString()){
  const j=s.journeys.find(j=>j.id===journeyId),d=s.deals.find(d=>d.id===dealId);ensure(j&&d,'Selecione jornada e negócio existentes.');ensure(j.status==='ativa','Ative a jornada antes de iniciar.');
  if(!qualifies(j,d))return false;if(s.enrollments.some(r=>r.journeyId===journeyId&&r.dealId===dealId&&(r.eventKey===eventKey||['executando','aguardando'].includes(r.status))))return false;
  s.enrollments.push({id:id(),journeyId,dealId,eventKey,steps:structuredClone(j.steps),cursor:0,status:'executando',nextAt:now,created:now,logs:[{at:now,message:'Negócio inscrito. As ações serão executadas localmente.'}]});return true;
}
function processOperations(s,previous,now=new Date().toISOString()){
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
function operationsDue(s,now=new Date().toISOString()){return s.enrollments.some(r=>['executando','aguardando'].includes(r.status)&&Date.parse(r.nextAt)<=Date.parse(now)&&s.journeys.find(j=>j.id===r.journeyId)?.status==='ativa')||s.campaigns.some(c=>c.status==='programada'&&Date.parse(c.scheduledAt)<=Date.parse(now));}
function inRange(value,f){if(!value)return false;const day=value.slice(0,10);return (!f.from||day>=f.from)&&(!f.to||day<=f.to);}
function dealMatches(d,f){return (!f.owner||d.owner===f.owner)&&(!f.pipelineId||d.pipelineId===f.pipelineId)&&(!f.status||d.status===f.status);}
function metricValue(s,metric,f={},now=new Date().toISOString()){
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
function goalProgress(s,g,now=new Date().toISOString()){
  let from=g.start,to=g.end;const current=dateOnly(now);
  if(g.frequency!=='total'){let pivot=current<g.start?g.start:current>g.end?g.end:current;const d=new Date(pivot+'T12:00');if(g.frequency==='monthly'){from=pivot.slice(0,7)+'-01';to=dateOnly(new Date(d.getFullYear(),d.getMonth()+1,0,12));}else{d.setDate(d.getDate()-((d.getDay()+6)%7));from=dateOnly(d);d.setDate(d.getDate()+6);to=dateOnly(d);}from=from<g.start?g.start:from;to=to>g.end?g.end:to;}
  const actual=metricValue(s,g.metric,{from,to,owner:g.owner,pipelineId:g.pipelineId},now);return {actual,percent:Math.round(actual/g.target*1000)/10,from,to,status:current<g.start?'Futura':current>g.end?'Encerrada':'Vigente'};
}
function reportRows(s,metric,groupBy,filters={},now=new Date().toISOString()){
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

return {operationCollections,metricNames,metricMoney,normalizeOperations,activityPipelineId,dateOnly,localDateTime,validDay,validLocal,put,validateOperations,guardOperationsDelete,completeTask,bookAppointment,campaignAudience,personalize,queueRecipient,prepareCampaign,enroll,processOperations,operationsDue,metricValue,goalProgress,reportRows};})();
const crmModel=(()=>{
const {normalizeOperations,validateOperations,guardOperationsDelete,processOperations}=crmOperations;
const STORAGE_KEY = 'crm-workspace-v2';
const LEGACY_KEY = 'crm-funil-v1';
const uid = () => crypto.randomUUID();
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const originalStages=['Apresentação','Envio de proposta comercial','Reunião de fechamento','Assinatura de proposta','Pedido emitido'];
function newPipeline(name,type,names=['Entrada','Em andamento','Conclusão']) { return {id:uid(),name,type,stages:names.map((name,i)=>({id:uid(),name,probability:Math.round((i+1)/names.length*100)}))}; }
function emptyState() {
  return normalizeOperations({schema:2,revision:0,savedAt:'',pipelines:[newPipeline('Pipeline de Vendas','opportunity',originalStages),newPipeline('Qualificação de Leads','lead',['Novo lead','Contato inicial','Qualificação']),newPipeline('Pós-venda','aftersale',['Boas-vindas','Acompanhamento','Renovação'])],contacts:[],deals:[],activities:[],products:[],priceLists:[],quotes:[],orders:[],history:[],settings:{origins:['Indicação','Site','Prospecção','Redes sociais'],lossReasons:['Sem orçamento','Sem retorno','Concorrência','Sem interesse'],tags:[],customFields:[]},templates:[{id:uid(),name:'Proposta comercial',type:'Proposta',body:'Olá, {{cliente}}.\n\nApresentamos nossa proposta para {{negocio}}.\n\n{{itens}}\n\nTotal: {{total}}\nValidade: {{validade}}\n\nCondições e observações:\n{{observacoes}}'}]});
}
function migrateLegacy(raw) {
  const state=emptyState(); if(!Array.isArray(raw)) throw Error('Formato antigo inválido. Exporte os dados antes de continuar.');
  const contact=(name,type)=>{ if(!name)return ''; const found=state.contacts.find(c=>c.name===name&&c.type===type);if(found)return found.id;const c={id:uid(),type,name,organizationId:'',email:'',phone:'',taxId:'',address:'',category:'',owner:'Eu',tags:[],client:false,active:true,notes:''};state.contacts.push(c);return c.id; };
  state.deals=raw.map(d=>{if(!d||typeof d.title!=='string'||!Number.isInteger(d.stage)||d.stage<0||d.stage>=5||!Number.isFinite(d.value)||!Array.isArray(d.tags))throw Error('Há um negócio antigo inválido. Os dados originais foram preservados.');return {id:d.id||uid(),title:d.title,pipelineId:state.pipelines[0].id,stageId:state.pipelines[0].stages[d.stage].id,organizationId:contact(d.organization,'organization'),personId:contact(d.person,'person'),owner:d.owner||'Eu',origin:d.origin||'',group:d.group||'Matriz',status:d.status||'ativo',tags:d.tags,value:d.value,closing:d.closing||'',temperature:d.temperature||'Sem temperatura',lossReason:d.status==='perdido'?'Não informado (versão anterior)':'',notes:d.notes||'',custom:{},created:d.created||new Date().toISOString(),updated:new Date().toISOString()};});
  validateState(state);return state;
}
function loadState(storage) { const current=storage.getItem(STORAGE_KEY);if(current){const data=JSON.parse(current);validateState(data);return data;}const legacy=storage.getItem(LEGACY_KEY);return legacy?migrateLegacy(JSON.parse(legacy)):emptyState(); }
const requireValue=(condition,message)=>{if(!condition)throw Error(message);};
const text=(v,max=10000)=>typeof v==='string'&&v.length<=max;
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const number=(v,max=1e12)=>Number.isFinite(v)&&v>=0&&v<=max;
function quoteTotal(q) {
  const subtotal=q.items.reduce((sum,i)=>sum+Math.round(i.quantity*i.unitPrice*(1-i.discount/100)*100),0);
  return Math.max(0,subtotal-Math.round(q.discount*100)+Math.round(q.freight*100))/100;
}
function validateState(s) {
  requireValue(s&&s.schema===2&&Number.isInteger(s.revision)&&s.revision>=0,'Backup incompatível: versão ou revisão inválida.');
  normalizeOperations(s);
  for(const key of ['pipelines','contacts','deals','activities','products','priceLists','quotes','orders','history','templates']) {
    requireValue(Array.isArray(s[key])&&s[key].length<=50000,`Coleção inválida: ${key}.`);
    const ids=new Set(); for(const row of s[key]){requireValue(row&&identifier(row.id)&&!ids.has(row.id),`Identificador inválido ou duplicado em ${key}.`);ids.add(row.id);}
  }
  requireValue(s.pipelines.length>0,'Mantenha ao menos um pipeline.');
  const ref=(list,id)=>!id||s[list].some(r=>r.id===id);
  for(const p of s.pipelines) {
    requireValue(text(p.name,120)&&p.name.trim()&&['lead','opportunity','aftersale'].includes(p.type),'Informe nome e tipo válidos para o pipeline.');
    requireValue(Array.isArray(p.stages)&&p.stages.length>0&&p.stages.length<=100,'Cada pipeline precisa de 1 a 100 etapas.');
    const ids=new Set();for(const stage of p.stages){requireValue(identifier(stage.id)&&!ids.has(stage.id)&&text(stage.name,100)&&stage.name.trim()&&number(stage.probability,100),'Etapa inválida: confira nome, identificador e probabilidade (0–100).');ids.add(stage.id);}
  }
  for(const c of s.contacts){requireValue(['organization','person'].includes(c.type)&&text(c.name,200)&&c.name.trim()&&Array.isArray(c.tags),'Contato inválido: informe nome e tipo.');requireValue(ref('contacts',c.organizationId),'A organização vinculada não existe.');if(c.organizationId)requireValue(c.type==='person'&&s.contacts.find(x=>x.id===c.organizationId)?.type==='organization','Vincule a pessoa a uma organização válida.');}
  for(const d of s.deals){const p=s.pipelines.find(p=>p.id===d.pipelineId);requireValue(p&&p.stages.some(st=>st.id===d.stageId),'O negócio precisa de pipeline e etapa existentes.');requireValue(text(d.title,200)&&d.title.trim()&&text(d.owner,150)&&d.owner.trim()&&number(d.value)&&['ativo','ganho','perdido'].includes(d.status)&&Array.isArray(d.tags),'Negócio inválido: confira título, responsável, status e valor.');requireValue(d.organizationId||d.personId,'Vincule uma organização ou pessoa ao negócio.');requireValue(ref('contacts',d.organizationId)&&ref('contacts',d.personId),'Contato do negócio não encontrado.');requireValue(!d.organizationId||s.contacts.find(c=>c.id===d.organizationId)?.type==='organization','Selecione uma organização válida.');requireValue(!d.personId||s.contacts.find(c=>c.id===d.personId)?.type==='person','Selecione uma pessoa válida.');requireValue(d.status!=='perdido'||text(d.lossReason,300)&&d.lossReason.trim(),'Informe o motivo da perda.');}
  for(const a of s.activities)requireValue(text(a.title,200)&&a.title.trim()&&text(a.due,40)&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(a.due)&&!Number.isNaN(Date.parse(a.due))&&['pendente','concluida','cancelada'].includes(a.status)&&ref('deals',a.dealId)&&ref('contacts',a.contactId),'Atividade inválida: confira assunto, data e vínculos.');
  for(const d of s.deals)if(d.attachments){requireValue(Array.isArray(d.attachments)&&d.attachments.length<=10,'Limite de anexos excedido.');for(const a of d.attachments)requireValue(identifier(a.id)&&text(a.name,255)&&number(a.size,1048576)&&text(a.base64,1400000)&&/^[A-Za-z0-9+/]*={0,2}$/.test(a.base64),'Anexo inválido ou maior que 1 MB.');}
  for(const p of s.products)requireValue(text(p.name,200)&&p.name.trim()&&number(p.price)&&number(p.cost)&&number(p.quantity)&&text(p.unit,30),'Produto inválido: confira nome, preços e quantidade.');
  for(const p of s.priceLists)requireValue(text(p.name,150)&&p.name.trim()&&number(p.discount,100),'Tabela de preços inválida: confira nome e desconto.');
  for(const q of s.quotes){requireValue(text(q.title,200)&&q.title.trim()&&ref('deals',q.dealId)&&ref('contacts',q.contactId)&&(q.dealId||q.contactId)&&Array.isArray(q.items)&&q.items.length>0&&q.items.length<=200&&number(q.discount)&&number(q.freight)&&['rascunho','enviado','visualizado','aprovado','recusado'].includes(q.status),'Orçamento inválido: confira cliente, itens, valores e status.');for(const i of q.items)requireValue(ref('products',i.productId)&&text(i.description,500)&&i.description.trim()&&number(i.quantity,1e7)&&i.quantity>0&&number(i.unitPrice)&&number(i.discount,100),'Item inválido: confira descrição, quantidade, preço e desconto.');const subtotal=quoteTotal({...q,discount:0,freight:0});requireValue(q.discount<=subtotal,'O desconto não pode superar o subtotal.');}
  for(const o of s.orders)requireValue(ref('quotes',o.quoteId)&&ref('deals',o.dealId)&&ref('contacts',o.contactId)&&number(o.total)&&Array.isArray(o.items)&&['aberto','processando','enviado','entregue','cancelado'].includes(o.status),'Pedido inválido: confira vínculos, valor e status.');
  requireValue(s.settings&&['origins','lossReasons','tags','customFields'].every(k=>Array.isArray(s.settings[k])),'Configurações inválidas.');
  for(const k of ['origins','lossReasons','tags']) requireValue(s.settings[k].every(v=>text(v,300)),'Cadastro auxiliar inválido.');
  const fields=new Set();for(const f of s.settings.customFields){requireValue(identifier(f.id)&&!fields.has(f.id)&&text(f.name,100)&&f.name.trim()&&['text','number','date'].includes(f.type),'Campo personalizado inválido.');fields.add(f.id);}
  for(const t of s.templates)requireValue(text(t.name,150)&&t.name.trim()&&text(t.body,30000),'Modelo de documento inválido.');
  validateOperations(s); return true;
}
function audit(s,entityId,message,kind='deal') {s.history.push({id:uid(),entityId,kind,message,at:new Date().toISOString()});}
function saveEntity(s,collection,record) {
  const old=s[collection].find(r=>r.id===record.id),now=new Date().toISOString();const row={...record,id:record.id||uid(),created:old?.created||now,updated:now};
  if(old)s[collection]=s[collection].map(r=>r.id===row.id?row:r);else s[collection].push(row);
  audit(s,row.id,`${old?'Atualizado':'Criado'}: ${row.title||row.name||row.number||collection}`,collection);
  return row;
}
function configurePipeline(s,pipeline,mapping={}) {
  const old=s.pipelines.find(p=>p.id===pipeline.id);
  if(old){const removed=old.stages.filter(st=>!pipeline.stages.some(next=>next.id===st.id)).map(st=>st.id);requireValue(!s.journeys.some(j=>j.pipelineId===old.id&&removed.includes(j.stageId)||j.steps.some(st=>st.type==='move'&&st.pipelineId===old.id&&removed.includes(st.stageId))),'Esta etapa é usada em uma jornada. Atualize o gatilho ou a ação da jornada antes de removê-la.');}
  if(old){for(const d of s.deals.filter(d=>d.pipelineId===old.id)){if(!pipeline.stages.some(st=>st.id===d.stageId)){const target=mapping[d.stageId];requireValue(pipeline.stages.some(st=>st.id===target),'Escolha a etapa de destino para os negócios das etapas removidas.');d.stageId=target;audit(s,d.id,'Etapa transferida após configuração do pipeline.','deals');}}s.pipelines=s.pipelines.map(p=>p.id===pipeline.id?pipeline:pipeline.id===p.id?pipeline:p);}else s.pipelines.push(pipeline);
  audit(s,pipeline.id,`Pipeline configurado: ${pipeline.name}`,'pipelines');
}
function deletePipeline(s,id,targetId) {
  requireValue(!s.journeys.some(j=>j.pipelineId===id||j.steps.some(st=>st.type==='move'&&st.pipelineId===id))&&!s.goals.some(g=>g.pipelineId===id),'Este pipeline está vinculado a jornadas ou metas. Atualize esses vínculos antes de excluí-lo.');
  requireValue(s.pipelines.length>1,'Não é possível excluir o último pipeline.');const target=s.pipelines.find(p=>p.id===targetId&&p.id!==id);const linked=s.deals.filter(d=>d.pipelineId===id);
  requireValue(!linked.length||target,'Selecione outro pipeline para receber os negócios.');
  for(const d of linked){d.pipelineId=target.id;d.stageId=target.stages[0].id;audit(s,d.id,`Transferido para ${target.name} após exclusão de pipeline.`,'deals');}s.pipelines=s.pipelines.filter(p=>p.id!==id);
}
function deleteEntity(s,collection,id) {
  guardOperationsDelete(s,collection,id);
  const used=(list,key)=>s[list].some(r=>r[key]===id);
  if(collection==='contacts')requireValue(!['organizationId','personId'].some(k=>used('deals',k))&&!used('contacts','organizationId')&&!used('activities','contactId')&&!used('quotes','contactId')&&!used('orders','contactId'),'Este contato está vinculado a outros registros. Remova os vínculos ou marque-o como inativo.');
  if(collection==='deals')requireValue(!used('activities','dealId')&&!used('quotes','dealId')&&!used('orders','dealId'),'Este negócio possui atividades, orçamentos ou pedidos. Remova os vínculos antes de excluir.');
  if(collection==='products')requireValue(!s.quotes.some(q=>q.items.some(i=>i.productId===id)),'Produto utilizado em orçamento. Marque-o como inativo para preservar o histórico.');
  if(collection==='quotes')requireValue(!used('orders','quoteId'),'Orçamento vinculado a pedido. Cancele o pedido antes de gerenciar seus vínculos.');
  s[collection]=s[collection].filter(r=>r.id!==id);audit(s,id,'Registro excluído.',collection);
}
function convertQuoteToOrder(s,id) {
  const q=s.quotes.find(q=>q.id===id);requireValue(q&&q.status==='aprovado','Aprove o orçamento antes de gerar o pedido.');requireValue(!s.orders.some(o=>o.quoteId===id),'Já existe um pedido vinculado a este orçamento.');
  return saveEntity(s,'orders',{id:uid(),number:`PED-${String(s.orders.length+1).padStart(4,'0')}-${Date.now().toString().slice(-4)}`,quoteId:q.id,dealId:q.dealId,contactId:q.contactId,title:q.title,total:quoteTotal(q),items:structuredClone(q.items),discount:q.discount,freight:q.freight,status:'aberto',delivery:'',carrier:'',notes:q.notes||''});
}
function commit(storage,previous,mutate) {
  const current=storage.getItem(STORAGE_KEY);if(current&&JSON.parse(current).revision!==previous.revision)throw Error('Os dados mudaram em outra aba. Recarregue antes de salvar.');
  const next=structuredClone(previous);const result=mutate(next);next.revision=previous.revision+1;next.savedAt=new Date().toISOString();processOperations(next,previous,next.savedAt);validateState(next);storage.setItem(STORAGE_KEY,JSON.stringify(next));return {state:next,result};
}
function parseCsv(input){
  const source=input.replace(/^\uFEFF/,'');const first=source.split(/\r?\n/)[0];const delimiter=first.includes(';')?';':',';const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell){throw Error('Aspas inválidas no CSV.');}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
  if(quoted)throw Error('CSV com aspas não fechadas.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);if(rows.length<2||rows.length>5001)throw Error('O CSV precisa ter cabeçalho e entre 1 e 5.000 registros.');const headers=rows.shift().map(h=>h.trim().toLowerCase());if(new Set(headers).size!==headers.length)throw Error('Cabeçalhos repetidos no CSV.');return rows.map((r,index)=>{if(r.length!==headers.length)throw Error(`Linha ${index+2}: quantidade de colunas diferente do cabeçalho.`);return Object.fromEntries(headers.map((h,i)=>[h,r[i].trim()]));});
}
function importCsvRows(s,collection,rows,type='organization'){
  const val=(r,...keys)=>keys.map(k=>r[k]).find(v=>v!==undefined);
  const numeric=(value,fallback=0)=>{if(value===undefined||value==='')return fallback;const normalized=value.includes(',')?value.replaceAll('.','').replace(',','.'):value;const n=Number(normalized);if(!number(n))throw Error(`Número inválido no CSV: ${value}`);return n;};
  const bool=(value,fallback)=>{if(value===undefined||value==='')return fallback;const v=value.toLowerCase();if(['sim','true','1','ativo'].includes(v))return true;if(['não','nao','false','0','inativo'].includes(v))return false;throw Error(`Valor de sim/não inválido: ${value}`);};
  for(const [index,r] of rows.entries()){
    const name=val(r,'name','nome','razão social','razao social');if(!name)throw Error(`Linha ${index+2}: nome obrigatório.`);
    if(collection==='contacts'){
      const taxId=val(r,'taxid','cnpj','cpf','documento'),email=val(r,'email','e-mail'),documentDigits=taxId?.replace(/\D/g,'');const sameType=s.contacts.filter(c=>c.type===type);const old=sameType.find(c=>r.id&&c.id===r.id)||(documentDigits?sameType.find(c=>c.taxId?.replace(/\D/g,'')===documentDigits):!taxId&&email?sameType.find(c=>c.email?.toLowerCase()===email.toLowerCase()):undefined);
      saveEntity(s,'contacts',{...old,id:old?.id,type,name,tradeName:val(r,'tradename','nome fantasia')??old?.tradeName??'',organizationId:old?.organizationId||'',taxId:taxId??old?.taxId??'',email:email??old?.email??'',phone:val(r,'phone','telefone')??old?.phone??'',address:val(r,'address','endereço','endereco')??old?.address??'',owner:val(r,'owner','responsável','responsavel')??old?.owner??'Eu',category:val(r,'category','categoria')??old?.category??'',tags:val(r,'tags')?.split(/[|,]/).map(v=>v.trim()).filter(Boolean)??old?.tags??[],active:bool(val(r,'active','ativo'),old?.active??true),client:bool(val(r,'client','cliente'),old?.client??false),notes:val(r,'notes','observações','observacoes')??old?.notes??''});
    }else if(collection==='products'){
      const sku=val(r,'sku','código','codigo');const old=s.products.find(p=>r.id&&p.id===r.id||sku&&p.sku===sku);
      saveEntity(s,'products',{...old,id:old?.id,name,sku:sku??old?.sku??'',price:numeric(val(r,'price','preço','preco'),old?.price||0),cost:numeric(val(r,'cost','custo'),old?.cost||0),quantity:numeric(val(r,'quantity','quantidade'),old?.quantity||0),unit:val(r,'unit','unidade')||old?.unit||'un',category:val(r,'category','categoria')??old?.category??'',active:bool(val(r,'active','ativo'),old?.active??true),description:val(r,'description','descrição','descricao')??old?.description??'',fractional:old?.fractional||false,editablePrice:old?.editablePrice!==false});
    }else throw Error('Importação indisponível para este módulo.');
  }
}


return {validateState};})();
const crmAccounts=(()=>{
const ROLES={admin:'Administrador',member:'Colaborador'};
function publicConnection(config){
  if(!config.supabaseUrl&&!config.publishableKey)return false;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl||''))throw Error('Configure a URL HTTPS do projeto Supabase.');
  const key=config.publishableKey||'';
  if(key.startsWith('sb_secret_'))throw Error('A chave secreta não pode ser usada no navegador. Use a chave publicável.');
  if(key.startsWith('eyJ')){let payload;try{payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{throw Error('Chave pública inválida.');}if(payload.role!=='anon')throw Error('Use somente a chave anon pública ou publicável.');}
  else if(!key.startsWith('sb_publishable_'))throw Error('Informe a chave publicável do projeto.');
  return true;
}
function userInput(input,creating=false){
  const name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase(),role=input.role;
  if(name.length<2||name.length>100)throw Error('Informe um nome de 2 a 100 caracteres.');
  if(!Object.hasOwn(ROLES,role))throw Error('Perfil inválido.');
  if(creating&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Informe um email válido.');
  if(creating&&(typeof input.password!=='string'||input.password.length<12||input.password.length>128))throw Error('Use uma senha inicial com 12 a 128 caracteres.');
  return {name,email,role,...(creating?{password:input.password}:{})};
}

return {userInput};})();
const crmSync=(()=>{
// Production compatibility layer: one authoritative row per commercial record.
// Keeps existing modules intact; typed normalization/paged reads are separate work.
const recordCollections=['pipelines','contacts','deals','activities','products','priceLists','quotes','orders','history','templates','projects','bookingTypes','bookings','journeys','enrollments','campaigns','deliveries','goals','dashboards','reportPresets'];
const rootFields=['settings','operationSettings'];
function flattenRecords(state){
 const entries={};
 for(const collection of recordCollections){for(const [position,data] of (state[collection]||[]).entries()){if(!data?.id||entries[collection+':'+data.id])throw Error('Identificador duplicado.');entries[collection+':'+data.id]={collection,id:data.id,data,position};}}
 for(const collection of rootFields)entries[collection+':singleton']={collection,id:'singleton',data:state[collection]};
 const extra=Object.fromEntries(Object.entries(state).filter(([k])=>![...recordCollections,...rootFields,'schema','revision','savedAt'].includes(k)));
 entries['extra:singleton']={collection:'extra',id:'singleton',data:extra};return entries;
}
function assembleRecords(entries,revision,savedAt){
 const state={schema:2,revision,savedAt,...Object.fromEntries(recordCollections.map(k=>[k,[]]))};
 for(const entry of entries){if(recordCollections.includes(entry.collection))state[entry.collection].push(entry.data);else if(rootFields.includes(entry.collection))state[entry.collection]=entry.data;else if(entry.collection==='extra')Object.assign(state,entry.data);}
 return state;
}
function recordChanges(previous,next,versions){
 const before=flattenRecords(previous),after=flattenRecords(next),changes=[];
 for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
  if(JSON.stringify(before[key]?.data)===JSON.stringify(after[key]?.data))continue;
  const entry=after[key]||before[key],expected=versions[key]??0;
  if(!Number.isSafeInteger(expected)||expected<0)throw Error('Versão do registro inválida.');
  changes.push({...entry,expected,deleted:!after[key],data:after[key]?.data??null});
 }
 return changes;
}
function recordGuards(previous,changes,versions){
 const dependencies=changes.some(c=>['deals','activities','bookings','enrollments','campaigns','deliveries'].includes(c.collection))?['journeys','bookingTypes','campaigns','settings','operationSettings']:[];
 return Object.values(flattenRecords(previous)).filter(e=>dependencies.includes(e.collection)&&!changes.some(c=>c.collection===e.collection&&c.id===e.id)).map(e=>({collection:e.collection,id:e.id,expected:versions[e.collection+':'+e.id]??0}));
}
function validateRecordInvariants(state){
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
function mergeRecordChanges(context,changes){
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
async function saveRecordChanges(rpc,actor,input,validateState){
 if(typeof input.requestId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(input.requestId))throw Error('Requisição inválida.');
 for(let attempt=0;attempt<4;attempt++){
  const {data:context,error}=await rpc('crm_record_read',{p_actor:actor});if(error)throw Error(error.message);
  if(context.mode!=='records')throw Error('Atualize a base antes de usar a gravação por registro.');
  // Replay is checked by SQL before comparing versions. No duplicate mutation.
  const {data:receipt,error:receiptError}=await rpc('crm_record_receipt',{p_actor:actor,p_request:input.requestId,p_changes:input.changes});if(receiptError)throw Error(receiptError.message);
  if(receipt){const {data:confirmed,error:readError}=await rpc('crm_record_read',{p_actor:actor});if(readError)throw Error(readError.message);return {state:confirmed.payload,versions:confirmed.versions,mode:'records'};}
  if(input.requireRevision!==undefined&&input.requireRevision!==context.revision)throw Error('CONFLICT: a base mudou desde a prévia de importação. Atualize e valide a planilha novamente.');
  for(const guard of input.guards||[]){if((context.versions[guard.collection+':'+guard.id]??0)!==guard.expected)throw Error('CONFLICT: uma configuração usada nesta alteração mudou. Atualize a base.');}
  const next=mergeRecordChanges(context,input.changes);validateState(next);validateRecordInvariants(next);
  const {error:saveError}=await rpc('crm_record_apply',{p_actor:actor,p_request:input.requestId,p_expected:context.revision,p_changes:input.changes,p_saved_at:next.savedAt});
  if(saveError){if(saveError.message.includes('REBASE:'))continue;throw Error(saveError.message);}
  const {data:confirmed,error:readError}=await rpc('crm_record_read',{p_actor:actor});if(readError)throw Error(readError.message);
  return {state:confirmed.payload,versions:confirmed.versions,mode:'records'};
 }
 throw Error('CONFLICT: a base recebeu várias atualizações. Atualize antes de tentar novamente.');
}

return {recordCollections,flattenRecords,assembleRecords,recordChanges,recordGuards,validateRecordInvariants,mergeRecordChanges,saveRecordChanges};})();
const {flattenRecords,saveRecordChanges,assembleRecords}=crmSync;
const {validateState}=crmModel;const {userInput}=crmAccounts;

const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
Deno.serve(async request=>{
  const origin=request.headers.get('origin')||'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!allowed.includes(origin))return response({error:'Origem não autorizada.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return response({error:'Método não permitido.'},405);
  try{
    const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
    if(!token)return response({error:'Entre na sua conta.'},401);
    const {data:auth,error:authError}=await admin.auth.getUser(token);
    if(authError||!auth.user)return response({error:'Sessão expirada. Entre novamente.'},401);
    const {data:member,error:memberError}=await admin.from('crm_members').select('*').eq('id',auth.user.id).maybeSingle();
    if(memberError)throw Error('Estrutura de usuários indisponível. Confira a configuração do projeto.');
    if(!member?.active||member.deleting)return response({error:'Seu acesso está desativado ou ainda não foi autorizado.'},403);
    // Limit the streamed request before JSON parsing.
    const reader=request.body?.getReader();let length=0;const chunks:Uint8Array[]=[];
    if(reader)while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>16*1024*1024){await reader.cancel();return response({error:'Solicitação maior que 16 MB.'},413);}chunks.push(value);}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return response({error:'Solicitação inválida.'},400);}
    const action=input.action;
    if(action==='me')return response({profile:member});
    if(action==='passwordChanged'){
      // SQL compares the Auth password hash; editable user metadata grants no access.
      const {error}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'passwordChanged'});if(error)throw error;return response({ok:true});
    }
    if(member.must_change_password)return response({error:'Altere sua senha inicial antes de acessar o CRM.'},403);
    if(action==='loadState'){const {data,error}=await admin.rpc('crm_record_read',{p_actor:member.id});if(error)throw error;return response(data);}
    if(action==='applyRecords')return response(await saveRecordChanges((name:string,args:Record<string,unknown>)=>admin.rpc(name,args),member.id,input,validateState));
    if(action==='migrateRecords'){
      if(member.role!=='admin')throw Error('Somente administradores podem migrar.');
      const {data:current,error:readError}=await admin.rpc('crm_record_read',{p_actor:member.id});if(readError)throw readError;
      if(current.mode==='records')return response({alreadyActive:true});
      if(current.revision!==input.expected)throw Error('CONFLICT: atualize o backup antes de migrar.');
      const original=structuredClone(current.payload);validateState(current.payload);const entries=flattenRecords(current.payload);
      validateState(assembleRecords(Object.values(entries),current.revision,current.payload.savedAt));
      const {data,error}=await admin.rpc('crm_record_activate',{p_actor:member.id,p_expected:current.revision,p_snapshot:original,p_entries:entries});if(error)throw error;return response(data);
    }
    if(action==='saveState'||action==='initState'){
      if(action==='initState'&&member.role!=='admin')return response({error:'Somente administradores inicializam a base.'},403);
      if(!Number.isSafeInteger(input.expected)||input.expected<0)throw Error('Revisão inválida.');
      validateState(input.state);
      if(action==='saveState'&&input.state.revision!==input.expected+1)throw Error('Revisão inválida. Atualize a base.');
      const {data,error}=await admin.rpc('crm_save_workspace',{p_actor:member.id,p_expected:input.expected,p_payload:input.state,p_initialize:action==='initState'});if(error)throw error;return response({state:data});
    }
    if(member.role!=='admin')return response({error:'Somente administradores podem gerenciar usuários.'},403);
    if(action==='listUsers'){const {data,error}=await admin.from('crm_members').select('*').order('name');if(error)throw error;return response({users:data});}
    if(action==='createUser'){
      const values=userInput(input,true);
      const {data,error}=await admin.auth.admin.createUser({email:values.email,password:values.password,email_confirm:true,user_metadata:{crm_password_issued_at:new Date().toISOString()}});
      if(error)return response({error:'Não foi possível criar a conta. Verifique se o email já existe e se a senha atende à política do projeto.'},400);
      const {error:profileError}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'create',p_target:data.user!.id,p_values:{name:values.name,email:values.email,role:values.role}});
      if(profileError){await admin.auth.admin.deleteUser(data.user!.id);throw profileError;}
      return response({ok:true});
    }
    if(!/^[0-9a-f-]{36}$/i.test(input.id||''))throw Error('Usuário inválido.');
    if(action==='updateUser'){
      const values=userInput(input);if(typeof input.active!=='boolean')throw Error('Situação inválida.');
      const {error}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'update',p_target:input.id,p_values:{name:values.name,role:values.role,active:input.active}});if(error)throw error;return response({ok:true});
    }
    if(action==='deleteUser'){
      // Revoke database access first. Failure deleting Auth leaves an inactive retryable account.
      const {error}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'delete',p_target:input.id});if(error)throw error;
      const {error:deleteError}=await admin.auth.admin.deleteUser(input.id);
      if(deleteError)return response({error:'Acesso bloqueado, mas a conta não pôde ser excluída. Tente excluir novamente.'},409);
      return response({ok:true});
    }
    return response({error:'Operação inválida.'},400);
  }catch(error){const message=error instanceof Error?error.message:String((error as {message?:string})?.message||'Falha na operação.');return response({error:message},message.includes('CONFLICT:')?409:400);}
});
