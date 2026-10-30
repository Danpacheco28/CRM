import {activityPipelineId,metricValue} from './operations-model.mjs?v=20261030-4';
export const dashboardPresets=[
 {id:'default',name:'Atividades',kind:'activities',widgets:['taskCreated','taskScheduled','taskOverdue','taskCompleted'],groupBy:'pipeline'},
 {id:'preset-commercial',name:'Funil comercial',kind:'commercial',widgets:['dealCount','activeDealCount','activeDealValue'],groupBy:'pipeline'},
 {id:'preset-results',name:'Resultados',kind:'results',widgets:['wonValue','wonCount','lostCount','conversion'],groupBy:'pipeline'}
];
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function dashboardDate(value){if(!value)return '';if(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?$/.test(value))return value.replace(' ','T');const d=new Date(value);if(Number.isNaN(+d))return '';const p=Object.fromEntries(formatter.formatToParts(d).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export function activityIsOverdue(a,now=new Date().toISOString()){return a.status==='pendente'&&dashboardDate(a.due)&&dashboardDate(a.due)<dashboardDate(now);}
const range=(value,f)=>{const day=dashboardDate(value).slice(0,10);return !!day&&(!f.from||day>=f.from)&&(!f.to||day<=f.to);};
const sum=rows=>Math.round(rows.reduce((n,d)=>n+d.value,0)*100)/100;
export const dashboardActivityTypes=['Email','Ligação','WhatsApp','Proposta','Reunião','Solicitação de documentos','Análise da operadora','Pagamento pendente'];
const normalizeLabel=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^\s*\d+[\s.\-]*/,'').replace(/[^a-z0-9]/g,'');
const activityLabel=a=>{const raw=String(a.type||'').trim();if(!raw)return 'Sem tipo';const aliases={email:'Email',ligacao:'Ligação',whatsapp:'WhatsApp',proposta:'Proposta',reuniao:'Reunião',solicitacaodedocumentos:'Solicitação de documentos',analisedaoperadora:'Análise da operadora',pgpendente:'Pagamento pendente',pagamentopendente:'Pagamento pendente',assuntosdop:'Assuntos DOP'};return aliases[normalizeLabel(raw)]||raw;};
function productivity(activities,f,now){return {created:activities.filter(a=>range(a.created,f)).length,scheduled:activities.filter(a=>a.status==='pendente'&&range(a.due,f)&&!activityIsOverdue(a,now)).length,overdue:activities.filter(a=>activityIsOverdue(a,now)&&range(a.due,f)).length,completed:activities.filter(a=>a.status==='concluida'&&range(a.completedAt||a.updated,f)).length};}
function clientMetrics(activities,created,p,f,now){
 const labels=[...new Set([...dashboardActivityTypes,...activities.map(activityLabel)])];
 const byType=labels.map(name=>({name,...productivity(activities.filter(a=>activityLabel(a)===name),f,now)}));
 const originMap=new Map();for(const d of created){const name=String(d.origin||'').trim()||'Não informada',key=normalizeLabel(name);const row=originMap.get(key)||{name,count:0};row.count++;originMap.set(key,row);}
 const origins=[...originMap.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pt-BR')).map(r=>({...r,percent:created.length?Math.round(r.count/created.length*1000)/10:0}));
 const visited=(d,stageId)=>d.stageId===stageId||(d.stageVisits||[]).some(v=>v.pipelineId===p?.id&&v.stageId===stageId);
 const incomplete=created.filter(d=>d.stageTrackingComplete!==true).length;
 const stages=(p?.stages||[]).map((stage,i)=>{const entered=created.filter(d=>visited(d,stage.id)),retained=created.filter(d=>d.status==='ativo'&&d.stageId===stage.id),lost=created.filter(d=>d.status==='perdido'&&d.stageId===stage.id),next=p.stages[i+1];const progressed=next?entered.filter(d=>{const visits=(d.stageVisits||[]).filter(v=>v.pipelineId===p.id),first=visits.findIndex(v=>v.stageId===stage.id);return first>=0&&visits.slice(first+1).some(v=>v.stageId===next.id);}).length:null;return {id:stage.id,name:stage.name,entered:entered.length,retained:retained.length,lost:lost.length,forecast:Math.round(sum(retained)*stage.probability)/100,probability:stage.probability,nextConversion:!incomplete&&next&&entered.length?Math.round(progressed/entered.length*1000)/10:null};});
 const won=created.filter(d=>d.status==='ganho'),lost=created.filter(d=>d.status==='perdido');
 return {productivity:productivity(activities,f,now),byType,origins,originTotal:created.length,funnel:{stages,incomplete,won:won.length,lost:lost.length,lostValue:sum(lost),forecast:Math.round(stages.reduce((n,s)=>n+s.forecast,0)*100)/100,entryConversion:created.length?Math.round(won.length/created.length*1000)/10:0}};
}
function chartData(activities,created,active,won,lost,f,now){
 const due=activities.filter(a=>range(a.due,f));
 const status={completed:due.filter(a=>a.status==='concluida').length,overdue:due.filter(a=>activityIsOverdue(a,now)).length,upcoming:due.filter(a=>a.status==='pendente'&&!activityIsOverdue(a,now)).length,canceled:due.filter(a=>a.status==='cancelada').length};
 const end=(f.to||dashboardDate(now)).slice(0,7),[year,month]=end.split('-').map(Number);
 const months=Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(year,month-6+i,1));return d.toISOString().slice(0,7);});
 const trend=months.map(month=>({month,created:activities.filter(a=>range(a.created,f)&&dashboardDate(a.created).startsWith(month)).length,completed:activities.filter(a=>a.status==='concluida'&&range(a.completedAt||a.updated,f)&&dashboardDate(a.completedAt||a.updated).startsWith(month)).length,deals:created.filter(d=>dashboardDate(d.created).startsWith(month)).length,wonValue:sum(won.filter(d=>dashboardDate(d.wonAt||d.closedAt||d.updated||d.created).startsWith(month)))}));
 const ranking=rows=>{const names=[...new Set(rows.map(d=>d.owner||'Sem responsável'))];return names.map(name=>{const own=rows.filter(d=>(d.owner||'Sem responsável')===name);return {name,value:sum(own),count:own.length};}).sort((a,b)=>b.value-a.value||b.count-a.count||a.name.localeCompare(b.name,'pt-BR')).slice(0,5);};
 return {status,trend,activeRanking:ranking(active),wonRanking:ranking(won),averageTicket:won.length?Math.round(sum(won)/won.length*100)/100:0,closedCount:won.length+lost.length};
}
export function pipelineDashboard(s,f={},now=new Date().toISOString()){
 const ids=f.pipelineId?[f.pipelineId==='__none__'?'':f.pipelineId]:[...s.pipelines.map(p=>p.id),...(s.activities.some(a=>!activityPipelineId(s,a))?['']:[])];
 return ids.map(id=>{
  const p=s.pipelines.find(p=>p.id===id);if(id&&!p)return null;
  const activities=s.activities.filter(a=>activityPipelineId(s,a)===id&&(!f.owner||a.owner===f.owner));
  const tasks={created:activities.filter(a=>range(a.created,f)),completed:activities.filter(a=>a.status==='concluida'&&range(a.completedAt||a.updated,f)),overdue:activities.filter(a=>activityIsOverdue(a,now)&&range(a.due,f)),pending:activities.filter(a=>a.status==='pendente'&&range(a.due,f))};
  const deals=s.deals.filter(d=>d.pipelineId===id&&(!f.owner||d.owner===f.owner));const created=deals.filter(d=>range(d.created,f)),active=created.filter(d=>d.status==='ativo'),won=deals.filter(d=>d.status==='ganho'&&range(d.wonAt||d.closedAt||d.updated||d.created,f)),lost=deals.filter(d=>d.status==='perdido'&&range(d.closedAt||d.updated||d.created,f));
  const stages=(p?.stages||[]).map(st=>({id:st.id,name:st.name,count:active.filter(d=>d.stageId===st.id).length,value:sum(active.filter(d=>d.stageId===st.id))}));
  return {client:clientMetrics(activities,created,p,f,now),visual:chartData(activities,created,active,won,lost,f,now),id,name:p?.name||'Sem pipeline',type:p?.type||'',tasks:{created:tasks.created.length,completed:tasks.completed.length,overdue:tasks.overdue.length,pending:tasks.pending.length,unknownCreated:activities.filter(a=>!a.created).length,estimatedCompleted:tasks.completed.filter(a=>!a.completedAt).length},createdDeals:created.length,activeDeals:active.length,activeValue:sum(active),wonCount:won.length,wonValue:sum(won),lostCount:lost.length,lostValue:sum(lost),conversion:won.length+lost.length?Math.round(won.length/(won.length+lost.length)*1000)/10:0,stages,attention:tasks.overdue.sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5).map(a=>({id:a.id,title:a.title,due:a.due,owner:a.owner})),next:tasks.pending.filter(a=>!activityIsOverdue(a,now)).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5).map(a=>({id:a.id,title:a.title,due:a.due,owner:a.owner}))};
 }).filter(Boolean);
}
export function dashboardMetric(s,metric,f={},now=new Date().toISOString()){
 const rows=pipelineDashboard(s,f,now);
 if(metric==='taskScheduled')return rows.reduce((n,p)=>n+p.client.productivity.scheduled,0);
 const key={taskCreated:'created',taskCompleted:'completed',taskOverdue:'overdue',taskPending:'pending'}[metric];if(key)return rows.reduce((n,p)=>n+p.tasks[key],0);
 if(metric==='activeDealCount')return rows.reduce((n,p)=>n+p.activeDeals,0);if(metric==='activeDealValue')return rows.reduce((n,p)=>n+p.activeValue,0);if(metric==='lostCount')return rows.reduce((n,p)=>n+p.lostCount,0);
 if(metric==='dealCount')return rows.reduce((n,p)=>n+p.createdDeals,0);if(metric==='wonCount')return rows.reduce((n,p)=>n+p.wonCount,0);if(metric==='wonValue')return rows.reduce((n,p)=>n+p.wonValue,0);
 if(metric==='conversion'){const won=rows.reduce((n,p)=>n+p.wonCount,0),lost=rows.reduce((n,p)=>n+p.lostCount,0);return won+lost?Math.round(won/(won+lost)*1000)/10:0;}
 return metricValue(s,metric,f,now);
}
