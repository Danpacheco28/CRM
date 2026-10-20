import {normalizeOperations,validateOperations,guardOperationsDelete,processOperations} from './operations-model.mjs?v=20261020-3';
export const STORAGE_KEY = 'crm-workspace-v2';
export const LEGACY_KEY = 'crm-funil-v1';
export const uid = () => crypto.randomUUID();
export const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const originalStages=['Apresentação','Envio de proposta comercial','Reunião de fechamento','Assinatura de proposta','Pedido emitido'];
export function newPipeline(name,type,names=['Entrada','Em andamento','Conclusão']) { return {id:uid(),name,type,stages:names.map((name,i)=>({id:uid(),name,probability:Math.round((i+1)/names.length*100)}))}; }
export function emptyState() {
  return normalizeOperations({schema:2,revision:0,savedAt:'',pipelines:[newPipeline('Pipeline de Vendas','opportunity',originalStages),newPipeline('Qualificação de Leads','lead',['Novo lead','Contato inicial','Qualificação']),newPipeline('Pós-venda','aftersale',['Boas-vindas','Acompanhamento','Renovação'])],contacts:[],deals:[],activities:[],products:[],priceLists:[],quotes:[],orders:[],history:[],settings:{origins:['Indicação','Site','Prospecção','Redes sociais'],lossReasons:['Sem orçamento','Sem retorno','Concorrência','Sem interesse'],tags:[],customFields:[]},templates:[{id:uid(),name:'Proposta comercial',type:'Proposta',body:'Olá, {{cliente}}.\n\nApresentamos nossa proposta para {{negocio}}.\n\n{{itens}}\n\nTotal: {{total}}\nValidade: {{validade}}\n\nCondições e observações:\n{{observacoes}}'}]});
}
export function migrateLegacy(raw) {
  const state=emptyState(); if(!Array.isArray(raw)) throw Error('Formato antigo inválido. Exporte os dados antes de continuar.');
  const contact=(name,type)=>{ if(!name)return ''; const found=state.contacts.find(c=>c.name===name&&c.type===type);if(found)return found.id;const c={id:uid(),type,name,organizationId:'',email:'',phone:'',taxId:'',address:'',category:'',owner:'Eu',tags:[],client:false,active:true,notes:''};state.contacts.push(c);return c.id; };
  state.deals=raw.map(d=>{if(!d||typeof d.title!=='string'||!Number.isInteger(d.stage)||d.stage<0||d.stage>=5||!Number.isFinite(d.value)||!Array.isArray(d.tags))throw Error('Há um negócio antigo inválido. Os dados originais foram preservados.');return {id:d.id||uid(),title:d.title,pipelineId:state.pipelines[0].id,stageId:state.pipelines[0].stages[d.stage].id,organizationId:contact(d.organization,'organization'),personId:contact(d.person,'person'),owner:d.owner||'Eu',origin:d.origin||'',group:d.group||'Matriz',status:d.status||'ativo',tags:d.tags,value:d.value,closing:d.closing||'',temperature:d.temperature||'Sem temperatura',lossReason:d.status==='perdido'?'Não informado (versão anterior)':'',notes:d.notes||'',custom:{},created:d.created||new Date().toISOString(),updated:new Date().toISOString()};});
  validateState(state);return state;
}
export function loadState(storage) { const current=storage.getItem(STORAGE_KEY);if(current){const data=JSON.parse(current);validateState(data);return data;}const legacy=storage.getItem(LEGACY_KEY);return legacy?migrateLegacy(JSON.parse(legacy)):emptyState(); }
const requireValue=(condition,message)=>{if(!condition)throw Error(message);};
const text=(v,max=10000)=>typeof v==='string'&&v.length<=max;
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const number=(v,max=1e12)=>Number.isFinite(v)&&v>=0&&v<=max;
export function quoteTotal(q) {
  const subtotal=q.items.reduce((sum,i)=>sum+Math.round(i.quantity*i.unitPrice*(1-i.discount/100)*100),0);
  return Math.max(0,subtotal-Math.round(q.discount*100)+Math.round(q.freight*100))/100;
}
export function validateState(s) {
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
export function audit(s,entityId,message,kind='deal') {s.history.push({id:uid(),entityId,kind,message,at:new Date().toISOString()});}
export function saveEntity(s,collection,record) {
  const old=s[collection].find(r=>r.id===record.id),now=new Date().toISOString();const row={...record,id:record.id||uid(),created:old?.created||now,updated:now};
  if(old)s[collection]=s[collection].map(r=>r.id===row.id?row:r);else s[collection].push(row);
  audit(s,row.id,`${old?'Atualizado':'Criado'}: ${row.title||row.name||row.number||collection}`,collection);
  return row;
}
export function configurePipeline(s,pipeline,mapping={}) {
  const old=s.pipelines.find(p=>p.id===pipeline.id);
  if(old){const removed=old.stages.filter(st=>!pipeline.stages.some(next=>next.id===st.id)).map(st=>st.id);requireValue(!s.journeys.some(j=>j.pipelineId===old.id&&removed.includes(j.stageId)||j.steps.some(st=>st.type==='move'&&st.pipelineId===old.id&&removed.includes(st.stageId))),'Esta etapa é usada em uma jornada. Atualize o gatilho ou a ação da jornada antes de removê-la.');}
  if(old){for(const d of s.deals.filter(d=>d.pipelineId===old.id)){if(!pipeline.stages.some(st=>st.id===d.stageId)){const target=mapping[d.stageId];requireValue(pipeline.stages.some(st=>st.id===target),'Escolha a etapa de destino para os negócios das etapas removidas.');d.stageId=target;audit(s,d.id,'Etapa transferida após configuração do pipeline.','deals');}}s.pipelines=s.pipelines.map(p=>p.id===pipeline.id?pipeline:pipeline.id===p.id?pipeline:p);}else s.pipelines.push(pipeline);
  audit(s,pipeline.id,`Pipeline configurado: ${pipeline.name}`,'pipelines');
}
export function deletePipeline(s,id,targetId) {
  requireValue(!s.journeys.some(j=>j.pipelineId===id||j.steps.some(st=>st.type==='move'&&st.pipelineId===id))&&!s.goals.some(g=>g.pipelineId===id),'Este pipeline está vinculado a jornadas ou metas. Atualize esses vínculos antes de excluí-lo.');
  requireValue(s.pipelines.length>1,'Não é possível excluir o último pipeline.');const target=s.pipelines.find(p=>p.id===targetId&&p.id!==id);const linked=s.deals.filter(d=>d.pipelineId===id);
  requireValue(!linked.length||target,'Selecione outro pipeline para receber os negócios.');
  for(const d of linked){d.pipelineId=target.id;d.stageId=target.stages[0].id;audit(s,d.id,`Transferido para ${target.name} após exclusão de pipeline.`,'deals');}s.pipelines=s.pipelines.filter(p=>p.id!==id);
}
export function deleteEntity(s,collection,id) {
  guardOperationsDelete(s,collection,id);
  const used=(list,key)=>s[list].some(r=>r[key]===id);
  if(collection==='contacts')requireValue(!['organizationId','personId'].some(k=>used('deals',k))&&!used('contacts','organizationId')&&!used('activities','contactId')&&!used('quotes','contactId')&&!used('orders','contactId'),'Este contato está vinculado a outros registros. Remova os vínculos ou marque-o como inativo.');
  if(collection==='deals')requireValue(!used('activities','dealId')&&!used('quotes','dealId')&&!used('orders','dealId'),'Este negócio possui atividades, orçamentos ou pedidos. Remova os vínculos antes de excluir.');
  if(collection==='products')requireValue(!s.quotes.some(q=>q.items.some(i=>i.productId===id)),'Produto utilizado em orçamento. Marque-o como inativo para preservar o histórico.');
  if(collection==='quotes')requireValue(!used('orders','quoteId'),'Orçamento vinculado a pedido. Cancele o pedido antes de gerenciar seus vínculos.');
  s[collection]=s[collection].filter(r=>r.id!==id);audit(s,id,'Registro excluído.',collection);
}
export function convertQuoteToOrder(s,id) {
  const q=s.quotes.find(q=>q.id===id);requireValue(q&&q.status==='aprovado','Aprove o orçamento antes de gerar o pedido.');requireValue(!s.orders.some(o=>o.quoteId===id),'Já existe um pedido vinculado a este orçamento.');
  return saveEntity(s,'orders',{id:uid(),number:`PED-${String(s.orders.length+1).padStart(4,'0')}-${Date.now().toString().slice(-4)}`,quoteId:q.id,dealId:q.dealId,contactId:q.contactId,title:q.title,total:quoteTotal(q),items:structuredClone(q.items),discount:q.discount,freight:q.freight,status:'aberto',delivery:'',carrier:'',notes:q.notes||''});
}
export function commit(storage,previous,mutate) {
  const current=storage.getItem(STORAGE_KEY);if(current&&JSON.parse(current).revision!==previous.revision)throw Error('Os dados mudaram em outra aba. Recarregue antes de salvar.');
  const next=structuredClone(previous);const result=mutate(next);next.revision=previous.revision+1;next.savedAt=new Date().toISOString();processOperations(next,previous,next.savedAt);validateState(next);storage.setItem(STORAGE_KEY,JSON.stringify(next));return {state:next,result};
}
export function parseCsv(input){
  const source=input.replace(/^\uFEFF/,'');const first=source.split(/\r?\n/)[0];const delimiter=first.includes(';')?';':',';const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell){throw Error('Aspas inválidas no CSV.');}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
  if(quoted)throw Error('CSV com aspas não fechadas.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);if(rows.length<2||rows.length>5001)throw Error('O CSV precisa ter cabeçalho e entre 1 e 5.000 registros.');const headers=rows.shift().map(h=>h.trim().toLowerCase());if(new Set(headers).size!==headers.length)throw Error('Cabeçalhos repetidos no CSV.');return rows.map((r,index)=>{if(r.length!==headers.length)throw Error(`Linha ${index+2}: quantidade de colunas diferente do cabeçalho.`);return Object.fromEntries(headers.map((h,i)=>[h,r[i].trim()]));});
}
export function importCsvRows(s,collection,rows,type='organization'){
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

