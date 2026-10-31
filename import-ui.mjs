import {importSchemas,importTemplate,planImport,applyImport} from './import-model.mjs?v=20261030-5';
export function createImportUI(api){
 const {esc,button,field,formDialog,closeDialog,change,download,getState}=api;
 const label=(collection,type)=>collection==='products'?'produtos':type==='person'?'pessoas':'organizações';
 return {open(collection,type='organization'){
  const kind=label(collection,type),schema=importSchemas[collection];let plan=null,revision=-1,generation=0;
  formDialog(`Importar ${kind}`,`<p class="notice">Baixe o modelo, preencha uma linha por cadastro e salve como <strong>CSV UTF-8</strong> no Excel ou Google Planilhas. Arquivos XLSX devem ser salvos como CSV antes de selecionar.</p><div class="importguide"><ol><li>Use os cabeçalhos do modelo, sem renomear as colunas.</li><li>Nome é obrigatório. Produtos novos precisam de SKU e preço.</li><li>Campos vazios preservam os valores de cadastros existentes. Nenhum registro será excluído.</li></ol><div class="actions">${button('↓ Baixar modelo CSV','importModel')}${button('↓ Backup da base atual','backup')}</div></div><details class="importfields"><summary>Ver os campos aceitos e como preencher</summary><div class="tablewrap"><table><thead><tr><th>Coluna</th><th>Campo no CRM</th><th>Preenchimento</th></tr></thead><tbody>${schema.map(([key,,name,hint])=>`<tr><td><code>${key}</code></td><td>${name}</td><td>${hint}</td></tr>`).join('')}</tbody></table></div></details><p class="muted">Contatos são identificados por ID, documento ou email único; produtos, por ID ou SKU. Emails compartilhados precisam de ID ou documento. Tags usam |. Valores monetários: 1234,56, sem separador de milhar.</p><label class="importfile">Selecionar planilha CSV<input id="standardCsvFile" type="file" accept=".csv,text/csv"></label><p class="muted">Até 400 linhas e 2 MB por arquivo. Preserve documentos, telefones e códigos como texto na planilha.</p><div id="importPreview" aria-live="polite"><p>Selecione um arquivo para conferir a prévia antes de importar.</p></div>${field('confirmed','Conferi a prévia e confirmo estas criações e atualizações',false,{type:'checkbox',required:true})}`,()=>{
   if(!plan||plan.issues.length)throw Error('Selecione um arquivo válido e confira a prévia.');
   if(getState().revision!==revision)throw Error('A base mudou desde a prévia. Feche esta janela, atualize a base e valide o arquivo novamente.');
   if(change(s=>applyImport(s,plan),'Importação confirmada.',{strictRevision:true}))closeDialog();
  },'',true);
  const form=document.querySelector('#recordForm'),submit=form.querySelector('button[type=submit]');submit.textContent='Importar cadastros';submit.disabled=true;
  form.querySelector('[data-action=importModel]').onclick=()=>download(`modelo-${kind}-poliniza.csv`,importTemplate(collection),'text/csv;charset=utf-8');
  form.querySelector('#standardCsvFile').onchange=async event=>{
   const token=++generation;submit.disabled=true;plan=null;form.elements.confirmed.checked=false;form.querySelector('#formError').textContent='';const file=event.target.files[0];if(!file)return;
   const preview=form.querySelector('#importPreview');preview.innerHTML='<p>Validando arquivo…</p>';
   try{
    if(!/\.csv$/i.test(file.name))throw Error('Salve sua planilha como CSV UTF-8 antes de importar.');if(file.size>2*1024*1024)throw Error('Use um arquivo de até 2 MB.');
    let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());}catch{throw Error('O arquivo não está em UTF-8. Salve como CSV UTF-8 e tente novamente.');}
    if(token!==generation)return;plan=planImport(getState(),collection,text,type);revision=getState().revision;
    if(plan.issues.length){preview.innerHTML=`<div class="alert"><strong>${plan.issues.length} problema(s). Nada será importado até corrigir o arquivo.</strong><p>Corrija as linhas indicadas e selecione o arquivo novamente.</p>${button('↓ Baixar relatório de erros','importErrors')}</div><div class="tablewrap"><table><thead><tr><th>Linha</th><th>Coluna</th><th>Correção necessária</th></tr></thead><tbody>${plan.issues.slice(0,100).map(i=>`<tr><td>${i.line}</td><td>${esc(i.column)}</td><td>${esc(i.message)}</td></tr>`).join('')}</tbody></table></div>${plan.issues.length>100?'<p>Mostrando os primeiros 100 problemas. O relatório contém todos.</p>':''}`;
     preview.querySelector('[data-action=importErrors]').onclick=()=>{const cell=v=>'"'+String(/^[=+@-]/.test(String(v))?"'"+v:v).replaceAll('"','""')+'"';download('erros-importacao-poliniza.csv','\uFEFFlinha;coluna;correcao\r\n'+plan.issues.map(i=>[i.line,i.column,i.message].map(cell).join(';')).join('\r\n'),'text/csv;charset=utf-8');};
    }else{
     preview.innerHTML=`<div class="importsummary"><strong>${plan.rows} linhas validadas</strong><span>${plan.creates} novos cadastros</span><span>${plan.updates} atualizações</span></div><p>Confira o nome, a identificação e a ação prevista. ID desconhecido nunca cria um cadastro silenciosamente.</p><div class="tablewrap"><table><thead><tr><th>Linha</th><th>Ação</th><th>Nome</th><th>Identificação</th></tr></thead><tbody>${plan.preview.slice(0,100).map(r=>`<tr><td>${r.line}</td><td><span class="badge ${r.action==='Criar'?'won':'neutral'}">${r.action}</span></td><td>${esc(r.name)}</td><td>${esc(r.reference)}</td></tr>`).join('')}</tbody></table></div>${plan.preview.length>100?`<p>Prévia das primeiras 100 de ${plan.preview.length} linhas. Todas foram validadas.</p>`:''}`;submit.disabled=false;
    }
   }catch(error){if(token!==generation)return;preview.innerHTML=`<p class="alert" role="alert">${esc(error.message)}</p>`;}
  };
 }};
}
