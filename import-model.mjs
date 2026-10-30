import {parseCsv,saveEntity,validateState} from './model.mjs?v=20261030-2';
const common=[['id','id','ID existente','Usar apenas para atualizar um cadastro existente.'],['nome','name','Nome','Obrigatório.'],['categoria','category','Categoria','Texto livre.'],['ativo','active','Ativo','sim ou nao; vazio preserva o valor atual.'],['observacoes','notes','Observações','Texto livre.']];
export const importSchemas={
 contacts:[...common,['nome_fantasia','tradeName','Nome fantasia','Para organizações.'],['documento','taxId','CPF / CNPJ','Texto: preserve zeros à esquerda.'],['email','email','Email','Um endereço por linha.'],['telefone','phone','Telefone','Texto com DDD.'],['celular','mobile','Celular','Texto com DDD.'],['responsavel','owner','Responsável','Nome usado no CRM.'],['tags','tags','Tags','Separe com |, por exemplo Cliente|Evento.'],['cliente','client','É cliente','sim ou nao.'],['endereco','address','Endereço','Texto livre.'],['cidade','city','Cidade','Texto livre.'],['estado','region','Estado','Texto livre.'],['condicoes_pagamento','paymentTerms','Condições de pagamento','Texto livre.'],['transportadora','carrier','Transportadora','Texto livre.'],['organizacao_id','organizationId','ID da organização','Somente pessoas; ID existente no CRM.']],
 products:[...common,['sku','sku','Código / SKU','Obrigatório para novos produtos; identifica atualizações.'],['descricao','description','Descrição','Texto livre.'],['preco','price','Preço de venda','Novo produto: obrigatório. Ex.: 1234,56 sem separador de milhar.'],['custo','cost','Custo','Ex.: 500,00.'],['preco_limite','minPrice','Preço limite','Ex.: 900,00.'],['preco_promocional','promotion','Preço promocional','Ex.: 1100,00.'],['quantidade','quantity','Quantidade','Até 6 casas decimais.'],['unidade','unit','Unidade','Ex.: un, hora, kg.'],['ncm','ncm','NCM','Texto, preserve zeros.'],['codigo_barras','barcode','Código de barras','Texto, preserve zeros.'],['fracionario','fractional','Permitir fração','sim ou nao.'],['recorrente','recurring','Recorrente (classificação)','sim ou nao; não cria cobranças.'],['preco_editavel','editablePrice','Preço editável em proposta','sim ou nao.']]
};
const normalize=s=>String(s).trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s-]+/g,'_');
const aliases={cnpj:'documento',cpf:'documento',taxid:'documento','e_mail':'email',owner:'responsavel',tradename:'nome_fantasia',name:'nome',phone:'telefone',address:'endereco',notes:'observacoes',active:'ativo',client:'cliente',price:'preco',cost:'custo',quantity:'quantidade',unit:'unidade',description:'descricao',category:'categoria',codigo:'sku',razao_social:'nome',nome_completo:'nome'};
export function importTemplate(collection){if(!importSchemas[collection])throw Error('Modelo inválido.');return '\uFEFF'+importSchemas[collection].map(f=>f[0]).join(';')+'\r\n';}
function boolean(value){if(['sim','true','1','ativo'].includes(normalize(value)))return true;if(['nao','false','0','inativo'].includes(normalize(value)))return false;throw Error('use sim ou nao');}
function numeric(value,places=2){if(!new RegExp('^\\d+(?:[.,]\\d{1,'+places+'})?$').test(value))throw Error('use número positivo, sem milhar, como 1234,56');const n=Number(value.replace(',','.'));if(!Number.isFinite(n)||n>1e12)throw Error('valor fora do limite');return n;}
const documentKey=s=>String(s||'').replace(/[^a-z0-9]/gi,'').toUpperCase();
export function planImport(state,collection,text,type='organization'){
 if(!importSchemas[collection]||collection==='contacts'&&!['organization','person'].includes(type))throw Error('Tipo de importação inválido.');
 const rows=parseCsv(text);if(rows.length>400)throw Error('Use até 400 linhas por arquivo. Divida planilhas maiores para manter a gravação em um lote seguro.');
 const schema=importSchemas[collection],allowed=new Set(schema.map(f=>f[0])),headers=Object.keys(rows[0]),mapped=new Map(),issues=[],preview=[],operations=[],targets=new Set(),identities=new Map();
 for(const header of headers){const key=aliases[normalize(header)]||normalize(header);if(!allowed.has(key))issues.push({line:1,column:header,message:'Coluna desconhecida. Use o modelo desta tela.'});else if([...mapped.values()].includes(key))issues.push({line:1,column:header,message:'Duas colunas representam o mesmo campo.'});else mapped.set(header,key);}
 if(![...mapped.values()].includes('nome'))issues.push({line:1,column:'nome',message:'Coluna obrigatória ausente.'});
 if(issues.length)return {collection,type,rows:rows.length,issues,preview,operations,creates:0,updates:0};
 const draft=structuredClone(state);
 for(const [index,raw]of rows.entries()){
  const line=index+2,r=Object.fromEntries(Object.entries(raw).map(([k,v])=>[mapped.get(k),v.trim()])),previousRecords=draft[collection].slice();let old,record;
  try{
   if(!r.nome)throw {column:'nome',message:'Nome obrigatório.'};
   if(r.id){old=draft[collection].find(x=>x.id===r.id);if(!old)throw {column:'id',message:'ID não encontrado. Deixe vazio para criar.'};if(collection==='contacts'&&old.type!==type)throw {column:'id',message:'O ID pertence a outro tipo de contato.'};}
   if(collection==='products'){
    if(!old&&!r.sku)throw {column:'sku',message:'SKU obrigatório para criar produto.'};
    const matches=r.sku?draft.products.filter(p=>normalize(p.sku||'')===normalize(r.sku)):[];if(matches.length>1)throw {column:'sku',message:'SKU duplicado no CRM. Corrija os cadastros antes de importar.'};
    if(old&&matches.length&&matches[0].id!==old.id)throw {column:'sku',message:'O SKU aponta para outro produto.'};old||=matches[0];
    if(!old&&!r.preco)throw {column:'preco',message:'Preço obrigatório para produto novo.'};
    record={price:0,cost:0,quantity:0,unit:'un',active:true,fractional:false,editablePrice:true,...old,id:old?.id||crypto.randomUUID()};
   }else{
    const candidates=draft.contacts.filter(c=>c.type===type),doc=documentKey(r.documento),email=r.email?.toLowerCase();
    if(!old&&doc){const matches=candidates.filter(c=>documentKey(c.taxId)===doc);if(matches.length>1)throw {column:'documento',message:'Documento corresponde a mais de um contato.'};old=matches[0];}
    if(!old&&!doc&&email){const matches=candidates.filter(c=>c.email?.toLowerCase()===email);if(matches.length>1)throw {column:'email',message:'Email compartilhado. Informe o ID ou documento para identificar o contato.'};old=matches[0];}
    if(old&&doc&&documentKey(old.taxId)&&documentKey(old.taxId)!==doc)throw {column:'documento',message:'Documento diferente do cadastro identificado. Confira o ID.'};
    record={type,organizationId:'',tags:[],active:true,client:false,owner:'Eu',...old,id:old?.id||crypto.randomUUID()};
   }
   if(targets.has(record.id))throw {column:'id',message:'O mesmo cadastro aparece em mais de uma linha do arquivo.'};
   const identity=r.id?'id:'+r.id:collection==='products'?'sku:'+normalize(r.sku||old?.sku||record.id):r.documento?'doc:'+documentKey(r.documento):r.email?'email:'+r.email.toLowerCase():'name:'+normalize(r.nome)+':'+(r.telefone||r.celular||'');
   if(identities.has(identity))throw {column:collection==='products'?'sku':'nome',message:`Identificação repetida no arquivo (linha ${identities.get(identity)}).`};
   for(const [header,field]of schema){if(r[header]===undefined||r[header]==='')continue;try{
    if(['active','client','fractional','recurring','editablePrice'].includes(field))record[field]=boolean(r[header]);
    else if(['price','cost','quantity','minPrice','promotion'].includes(field))record[field]=numeric(r[header],field==='quantity'?6:2);
    else if(field==='tags')record.tags=[...new Set(r[header].split('|').map(v=>v.trim()).filter(Boolean))];
    else if(field!=='id')record[field]=r[header];
   }catch(error){throw {column:header,message:error.message};}}
   if(record.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))throw {column:'email',message:'Email inválido.'};
   if(collection==='contacts'&&record.organizationId&&(type!=='person'||!draft.contacts.some(c=>c.id===record.organizationId&&c.type==='organization')))throw {column:'organizacao_id',message:'Informe o ID de uma organização existente, somente para pessoas.'};
   if(collection==='contacts'&&type==='organization')record.organizationId='';
   if(collection==='products'&&!record.fractional&&!Number.isInteger(record.quantity))throw {column:'quantidade',message:'Ative fracionario=sim para uma quantidade decimal.'};
   const prior=draft[collection].findIndex(x=>x.id===record.id);if(prior<0)draft[collection].push(record);else draft[collection][prior]=record;validateState(draft);
   targets.add(record.id);identities.set(identity,line);operations.push({record,oldId:old?.id||null});preview.push({line,action:old?'Atualizar':'Criar',name:record.name,reference:collection==='products'?record.sku:record.taxId||record.email||'Sem identificador',changed:old?Object.keys(record).filter(k=>JSON.stringify(record[k])!==JSON.stringify(old[k])).join(', '):'Novo cadastro'});
  }catch(error){draft[collection]=previousRecords;issues.push({line,column:error.column||'registro',message:error.message||String(error)});}
 }
 return {collection,type,rows:rows.length,issues,preview,operations,creates:operations.filter(o=>!o.oldId).length,updates:operations.filter(o=>o.oldId).length};
}
export function applyImport(state,plan){
 if(plan.issues.length||!plan.operations.length)throw Error('Corrija a planilha antes de importar.');
 const draft=structuredClone(state);for(const op of plan.operations)saveEntity(draft,plan.collection,structuredClone(op.record));validateState(draft);
 state[plan.collection]=draft[plan.collection];state.history=draft.history;
}
