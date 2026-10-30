async(page)=>{
  if(!page.url().startsWith('http://127.0.0.1:4174'))throw Error('Use somente a versão de testes local.');
  await page.goto('http://127.0.0.1:4174/#pipelines');
  await page.reload();
  // The CLI tracks native file choosers separately. Supply files directly to
  // inputs below and suppress only the native chooser in this test profile.
  await page.evaluate(()=>{window.testOriginalFileClick=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){if(this.type!=='file')return window.testOriginalFileClick.call(this);};});
  const check=(value,message)=>{if(!value)throw Error(message);};
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  await click('Projeto Verificação');
  await page.locator('#attachmentFile').setInputFiles({name:'anexo-teste.txt',mimeType:'text/plain',buffer:Buffer.from('Anexo sintético de verificação.')});
  await page.getByRole('button',{name:'Baixar',exact:true}).waitFor();
  check((await page.locator('#dialogContent').innerText()).includes('anexo-teste.txt'),'Attachment stored');
  await click('Remover');await page.locator('#importPreview .importsummary').waitFor();await page.locator('#field-confirmed').check();await click('Importar cadastros');
  check(await page.getByRole('button',{name:'Baixar',exact:true}).count()===0,'Attachment removed');await click('Fechar');
  await page.locator('nav a[href=\'#contacts\']').click();await click('Importar planilha');
  await page.locator('#standardCsvFile').setInputFiles({name:'contatos.csv',mimeType:'text/csv',buffer:Buffer.from('nome;email;telefone\nOrganização CSV;csv@example.test;11999999999')});
  await page.getByRole('heading',{name:'Importar organizações',exact:true}).waitFor();await page.locator('#field-confirmed').check();await click('Salvar');
  check(await page.getByRole('button',{name:'Organização CSV',exact:true}).count()===1,'CSV imported');
  const raw=await page.evaluate(()=>localStorage.getItem('crm-workspace-v2'));
  const before=JSON.parse(raw);await page.locator('nav a[href=\'#settings\']').click();await click('Restaurar backup');
  await page.locator('#restoreFile').setInputFiles({name:'backup-teste.json',mimeType:'application/json',buffer:Buffer.from(raw)});
  await page.getByRole('heading',{name:'Restaurar backup',exact:true}).waitFor();await page.locator('#field-confirmed').check();await click('Salvar');
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('crm-workspace-v2')));
  check(after.contacts.length===before.contacts.length&&after.deals.length===before.deals.length&&after.orders.length===before.orders.length,'Backup roundtrip');
  await click('Restaurar backup');await page.locator('#restoreFile').setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{}')});
  await page.waitForTimeout(100);check((await page.locator('#toast').innerText()).includes('Backup recusado'),'Invalid backup rejected');
  check(await page.evaluate(()=>JSON.parse(localStorage.getItem('crm-workspace-v2')).deals.length)===before.deals.length,'Rejected backup preserves data');
  const pages=['leads','aftersale','calendar','reports','documents'];for(const route of pages){await page.goto('http://127.0.0.1:4174/#'+route);check((await page.locator('#content').innerText()).length>20,'Module rendered: '+route);}
  await page.evaluate(()=>{HTMLInputElement.prototype.click=window.testOriginalFileClick;delete window.testOriginalFileClick;});
  return 'PASS: attachment add/remove, CSV import preview/commit, JSON restore roundtrip, malformed backup rejection, CRM modules rendered. Test data remains in local isolated browser only.';
}
