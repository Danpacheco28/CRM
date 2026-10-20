// Run against the local application only; never against the reference account.
async (page) => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  await page.evaluate(()=>{const k='crm-funil-v1';const items=JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify(items.filter(d=>d.title!=='Teste de verificação')));});
  await page.reload();
  await page.getByRole('button',{name:'＋ Negócio',exact:true}).click();
  await page.locator('[name=title]').fill('Teste de verificação');
  await page.getByRole('button',{name:'Salvar',exact:true}).click();
  assert(await page.locator('#formError').textContent()==='Informe uma organização ou uma pessoa.','Organization validation');
  await page.locator('[name=organization]').fill('Empresa de teste');
  await page.locator('[name=value]').fill('1250');
  await page.locator('[name=tags]').fill('Verificação');
  await page.getByRole('button',{name:'Salvar',exact:true}).click();
  assert(await page.locator('.deal').count()===1,'Create deal');
  await page.locator('.move').selectOption('2');
  assert(await page.locator('.column:nth-child(3) .deal').count()===1,'Move stage');
  await page.reload();
  assert(await page.locator('.column:nth-child(3) .deal').count()===1,'Persist on reload');
  await page.locator('#search').fill('inexistente');
  assert(await page.locator('.deal').count()===0,'Search');
  await page.locator('#search').fill('');
  await page.locator('#filterToggle').click();
  await page.locator('#filters [name=owner]').fill('inexistente');
  await page.getByRole('button',{name:'Aplicar filtros'}).click();
  assert(await page.locator('.deal').count()===0,'Owner filter');
  await page.locator('#clearFilters').click();
  assert(await page.locator('.deal').count()===1,'Reset filters');
  await page.locator('#filterToggle').click();
  await page.locator('.cardopen').click();
  await page.locator('[name=status]').selectOption('ganho');
  await page.getByRole('button',{name:'Salvar',exact:true}).click();
  assert(await page.locator('.deal').count()===0,'Won excluded from active');
  await page.locator('#status').selectOption('ganho');
  assert(await page.locator('.deal').count()===1,'Won filter');
  await page.locator('#listView').click();
  assert(await page.locator('tbody tr').count()===1,'List view');
  await page.locator('#boardView').click();
  await page.locator('#status').selectOption('todos');
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:'output/playwright/crm-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile body overflow');
  await page.screenshot({path:'output/playwright/crm-mobile.png'});
  await page.locator('.cardopen').click();
  await page.screenshot({path:'output/playwright/crm-mobile-form.png'});
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#deleteDeal').click();
  assert(await page.locator('.deal').count()===0,'Delete');
  await page.locator('#status').selectOption('ativo');
  await page.setViewportSize({width:1440,height:900});
  return 'PASS: validation, create, move, reload, search, filters, edit status, list, mobile overflow, delete. Test record removed.';
}


