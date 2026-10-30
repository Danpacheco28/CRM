import {activityPipelineId,metricValue} from './operations-model.mjs?v=20261030-2';
export const dashboardPresets=[
 {id:'default',name:'Atividades',kind:'activities',widgets:['taskCreated','taskCompleted','taskOverdue','taskPending'],groupBy:'pipeline'},
 {id:'preset-commercial',name:'Funil comercial',kind:'commercial',widgets:['dealCount','activeDealCount','activeDealValue'],groupBy:'pipeline'},
 {id:'preset-results',name:'Resultados',kind:'results',widgets:['wonValue','wonCount','lostCount','conversion'],groupBy:'pipeline'}
];
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function dashboardDate(value){if(!value)return '';if(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?$/.test(value))return value.replace(' ','T');const d=new Date(value);if(Number.isNaN(+d))return '';const p=Object.fromEntries(formatter.formatToParts(d).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export function activityIsOverdue(a,now=new Date().toISOString()){return a.status==='pendente'&&dashboardDate(a.due)&&dashboardDate(a.due)<dashboardDate(now);}
const range=(value,f)=>{const day=dashboardDate(value).slice(0,10);return !!day&&(!f.from||day>=f.from)&&(!f.to||day<=f.to);};
const sum=rows=>Math.round(rows.reduce((n,d)=>n+d.value,0)*100)/100;
export function pipelineDashboard(s,f={},now=new Date().toISOString()){
 const ids=f.pipelineId?[f.pipelineId==='__none__'?'':f.pipelineId]:[...s.pipelines.map(p=>p.id),...(s.activities.some(a=>!activityPipelineId(s,a))?['']:[])];
 return ids.map(id=>{
  const p=s.pipelines.find(p=>p.id===id);if(id&&!p)return null;
  const activities=s.activities.filter(a=>activityPipelineId(s,a)===id&&(!f.owner||a.owner===f.owner));
  const tasks={created:activities.filter(a=>range(a.created,f)),completed:activities.filter(a=>a.status==='concluida'&&range(a.completedAt||a.updated,f)),overdue:activities.filter(a=>activityIsOverdue(a,now)&&range(a.due,f)),pending:activities.filter(a=>a.status==='pendente'&&range(a.due,f))};
  const deals=s.deals.filter(d=>d.pipelineId===id&&(!f.owner||d.owner===f.owner));const created=deals.filter(d=>range(d.created,f)),active=created.filter(d=>d.status==='ativo'),won=deals.filter(d=>d.status==='ganho'&&range(d.wonAt||d.closedAt||d.updated||d.created,f)),lost=deals.filter(d=>d.status==='perdido'&&range(d.closedAt||d.updated||d.created,f));
  const stages=(p?.stages||[]).map(st=>({id:st.id,name:st.name,count:active.filter(d=>d.stageId===st.id).length,value:sum(active.filter(d=>d.stageId===st.id))}));
  return {id,name:p?.name||'Sem pipeline',type:p?.type||'',tasks:{created:tasks.created.length,completed:tasks.completed.length,overdue:tasks.overdue.length,pending:tasks.pending.length,unknownCreated:activities.filter(a=>!a.created).length,estimatedCompleted:tasks.completed.filter(a=>!a.completedAt).length},createdDeals:created.length,activeDeals:active.length,activeValue:sum(active),wonCount:won.length,wonValue:sum(won),lostCount:lost.length,lostValue:sum(lost),conversion:won.length+lost.length?Math.round(won.length/(won.length+lost.length)*1000)/10:0,stages,attention:tasks.overdue.sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5).map(a=>({id:a.id,title:a.title,due:a.due,owner:a.owner})),next:tasks.pending.filter(a=>!activityIsOverdue(a,now)).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5).map(a=>({id:a.id,title:a.title,due:a.due,owner:a.owner}))};
 }).filter(Boolean);
}
export function dashboardMetric(s,metric,f={},now=new Date().toISOString()){
 const rows=pipelineDashboard(s,f,now);
 const key={taskCreated:'created',taskCompleted:'completed',taskOverdue:'overdue',taskPending:'pending'}[metric];if(key)return rows.reduce((n,p)=>n+p.tasks[key],0);
 if(metric==='activeDealCount')return rows.reduce((n,p)=>n+p.activeDeals,0);if(metric==='activeDealValue')return rows.reduce((n,p)=>n+p.activeValue,0);if(metric==='lostCount')return rows.reduce((n,p)=>n+p.lostCount,0);
 if(metric==='dealCount')return rows.reduce((n,p)=>n+p.createdDeals,0);if(metric==='wonCount')return rows.reduce((n,p)=>n+p.wonCount,0);if(metric==='wonValue')return rows.reduce((n,p)=>n+p.wonValue,0);
 if(metric==='conversion'){const won=rows.reduce((n,p)=>n+p.wonCount,0),lost=rows.reduce((n,p)=>n+p.lostCount,0);return won+lost?Math.round(won/(won+lost)*1000)/10:0;}
 return metricValue(s,metric,f,now);
}
