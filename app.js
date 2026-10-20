const stages = ['Apresentação','Envio de proposta comercial','Reunião de fechamento','Assinatura de proposta','Pedido emitido'];
const key = 'crm-funil-v1';
const $ = selector => document.querySelector(selector);
const form = $('#dealForm');
const editor = $('#editor');
const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let deals = [], editing = null, view = 'board', filters = {}, toastTimer;
function toast(message) { $('#toast').textContent=message; $('#toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').hidden=true,4500); }
try { const saved=JSON.parse(localStorage.getItem(key)||'[]'); if(!Array.isArray(saved)) throw Error(); deals=saved.filter(d=>d && typeof d.id==='string' && typeof d.title==='string' && Number.isInteger(d.stage) && d.stage>=0 && d.stage<stages.length && Number.isFinite(d.value) && Array.isArray(d.tags)); } catch { toast('Não foi possível ler os dados salvos. O armazenamento não será substituído até você salvar um negócio.'); }
function persist(next) { try { localStorage.setItem(key,JSON.stringify(next)); deals=next; render(); return true; } catch { toast('Não foi possível salvar. Verifique o espaço disponível e as permissões do navegador.'); return false; } }
const includes = (value,query) => String(value||'').toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'));
function filtered() { const status=$('#status').value, query=$('#search').value.trim(); return deals.filter(d=>(status==='todos'||d.status===status)&&(!query||includes([d.title,d.organization,d.person,d.owner,...d.tags].join(' '),query))&&(!filters.owner||includes(d.owner,filters.owner))&&(!filters.origin||includes(d.origin,filters.origin))&&(!filters.tag||d.tags.some(t=>includes(t,filters.tag)))&&(!filters.temperature||d.temperature===filters.temperature)); }
function stageOptions(selected) { return stages.map((s,i)=>`<option value="${i}" ${i===selected?'selected':''}>${escapeHtml(s)}</option>`).join(''); }
function card(d) { return `<article class="deal" draggable="true" data-id="${escapeHtml(d.id)}"><button class="cardopen" data-edit="${escapeHtml(d.id)}">${escapeHtml(d.title)}</button><p class="company">${escapeHtml(d.organization||d.person)}</p><div class="cardmeta"><span class="money">${money(d.value)}</span><span class="owner">${escapeHtml(d.owner)}</span></div>${d.tags.length?`<div class="tags">${d.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}<label class="sr" for="move-${escapeHtml(d.id)}">Mover ${escapeHtml(d.title)} para etapa</label><select class="move" id="move-${escapeHtml(d.id)}" data-move="${escapeHtml(d.id)}">${stageOptions(d.stage)}</select></article>`; }
function render() {
  const shown=filtered(); $('#count').textContent=`(${shown.length})`;
  $('#board').hidden=view!=='board'; $('#list').hidden=view!=='list';
  $('#board').innerHTML=stages.map((name,i)=>{ const group=shown.filter(d=>d.stage===i); return `<section class="column" data-stage="${i}" aria-label="${escapeHtml(name)}"><div class="stagehead"><div><h2>${escapeHtml(name)}</h2><p>${group.length} ${group.length===1?'negócio':'negócios'}</p></div><button class="iconbutton" data-add="${i}" aria-label="Adicionar negócio em ${escapeHtml(name)}">＋</button></div><div class="total"><span>Total</span><span>${money(group.reduce((sum,d)=>sum+d.value,0))}</span></div><div class="cards">${group.length?group.map(card).join(''):`<div class="empty"><span aria-hidden="true">○</span><p>Nenhum negócio encontrado na etapa</p><button data-add="${i}">＋ Adicionar negócio</button></div>`}</div></section>`; }).join('');
  $('#list').innerHTML=shown.length?`<table><thead><tr><th>Negócio</th><th>Organização / Pessoa</th><th>Etapa</th><th>Responsável</th><th>Valor</th><th>Status</th></tr></thead><tbody>${shown.map(d=>`<tr><td><button data-edit="${escapeHtml(d.id)}">${escapeHtml(d.title)}</button></td><td>${escapeHtml(d.organization||d.person)}</td><td>${escapeHtml(stages[d.stage])}</td><td>${escapeHtml(d.owner)}</td><td>${money(d.value)}</td><td>${{ativo:'Ativo',ganho:'Ganho',perdido:'Perdido'}[d.status]||''}</td></tr>`).join('')}</tbody></table>`:'<div class="empty"><p>Nenhum negócio encontrado. Crie um negócio ou ajuste seus filtros.</p></div>';
  const total=status=>deals.filter(d=>d.status===status).reduce((sum,d)=>sum+d.value,0);
  $('#metrics').innerHTML=`<span>Ativos <strong>${deals.filter(d=>d.status==='ativo').length} · ${money(total('ativo'))}</strong></span><span class="won">Ganhos <strong>${money(total('ganho'))}</strong></span><span class="lost">Perdidos <strong>${money(total('perdido'))}</strong></span>`;
  const entries=Object.values(filters).filter(Boolean); $('#filterSummary').hidden=!entries.length; $('#filterSummary').textContent=entries.length?`Filtros aplicados: ${entries.join(' · ')}`:'';
}
function openEditor(id=null,stage=0) {
  editing=id; form.reset(); $('#formError').textContent=''; form.elements.stage.innerHTML=stageOptions(stage);
  const d=deals.find(item=>item.id===id);
  if(d) for(const [name,value] of Object.entries(d)) if(form.elements.namedItem(name)) form.elements.namedItem(name).value=name==='tags'?value.join(', '):value;
  $('#editorTitle').textContent=d?'Editar negócio':'Novo negócio'; $('#deleteDeal').hidden=!d; $('#saveAnother').hidden=!!d;
  editor.showModal(); form.elements.organization.focus();
}
function move(id,stage) { const d=deals.find(item=>item.id===id); if(d&&stage>=0&&stage<stages.length&&persist(deals.map(item=>item.id===id?{...item,stage}:item))) toast(`Negócio movido para ${stages[stage]}.`); }
form.addEventListener('submit',event=>{
  event.preventDefault(); const data=Object.fromEntries(new FormData(form));
  for(const name of ['organization','person','title','owner','origin','group','notes']) data[name]=(data[name]||'').trim();
  if(!data.organization&&!data.person) { $('#formError').textContent='Informe uma organização ou uma pessoa.'; form.elements.organization.focus(); return; }
  if(!data.title||!data.owner) { $('#formError').textContent='Preencha o título e o responsável.'; return; }
  data.tags=data.tags.split(',').map(t=>t.trim()).filter(Boolean); data.stage=Number(data.stage); data.value=Number(data.value||0);
  if(!Number.isFinite(data.value)||data.value<0) { $('#formError').textContent='Informe um valor válido, maior ou igual a zero.'; return; }
  const previous=deals.find(d=>d.id===editing); data.id=editing||crypto.randomUUID(); data.created=previous?.created||new Date().toISOString();
  const next=editing?deals.map(d=>d.id===editing?data:d):[...deals,data];
  if(persist(next)) { editor.close(); toast('Negócio salvo neste navegador.'); if(event.submitter?.name==='another') openEditor(null,data.stage); }
});
$('#newDeal').onclick=()=>openEditor();
for(const id of ['closeEditor','cancelEditor']) $('#'+id).onclick=()=>editor.close();
$('#deleteDeal').onclick=()=>{ if(confirm('Excluir este negócio desta versão local? Esta ação não pode ser desfeita.')) if(persist(deals.filter(d=>d.id!==editing))) { editor.close(); toast('Negócio excluído.'); } };
$('#status').onchange=render; $('#search').oninput=render;
$('#filterToggle').onclick=()=>{ const hidden=!$('#filters').hidden; $('#filters').hidden=hidden; $('#filterToggle').setAttribute('aria-expanded',String(!hidden)); };
$('#filters').onsubmit=event=>{ event.preventDefault(); filters=Object.fromEntries(new FormData(event.currentTarget)); render(); };
$('#clearFilters').onclick=()=>{ $('#filters').reset(); filters={}; render(); };
for(const mode of ['board','list']) $('#'+mode+'View').onclick=()=>{ view=mode; for(const other of ['board','list']) { $('#'+other+'View').classList.toggle('selected',other===mode); $('#'+other+'View').setAttribute('aria-pressed',String(other===mode)); } render(); };
document.addEventListener('click',event=>{ const edit=event.target.closest('[data-edit]'); const add=event.target.closest('[data-add]'); if(edit) openEditor(edit.dataset.edit); if(add) openEditor(null,Number(add.dataset.add)); });
document.addEventListener('change',event=>{ if(event.target.matches('[data-move]')) move(event.target.dataset.move,Number(event.target.value)); });
let dragged=null;
$('#board').addEventListener('dragstart',event=>{ const card=event.target.closest('[data-id]'); if(!card)return; dragged=card.dataset.id; event.dataTransfer.setData('text/plain',dragged); event.dataTransfer.effectAllowed='move'; });
$('#board').addEventListener('dragover',event=>{ const column=event.target.closest('[data-stage]'); if(column&&dragged) {event.preventDefault();column.classList.add('over');} });
$('#board').addEventListener('dragleave',event=>{ const column=event.target.closest('[data-stage]'); if(column&&!column.contains(event.relatedTarget)) column.classList.remove('over'); });
$('#board').addEventListener('drop',event=>{ const column=event.target.closest('[data-stage]'); if(column&&dragged) {event.preventDefault();move(dragged,Number(column.dataset.stage));} dragged=null; document.querySelectorAll('.over').forEach(el=>el.classList.remove('over')); });
$('#board').addEventListener('dragend',()=>{dragged=null;document.querySelectorAll('.over').forEach(el=>el.classList.remove('over'));});
$('#help').onclick=()=>$('#about').showModal(); $('#closeAbout').onclick=()=>$('#about').close();
$('#metricsToggle').onclick=()=>{ $('#metrics').hidden=!$('#metrics').hidden; $('#metricsToggle').setAttribute('aria-expanded',String(!$('#metrics').hidden)); };
render();
