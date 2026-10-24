// Playwright CLI expression. Uses a simulated service only in localhost:4176.
async(page)=>{
  if(!page.url().startsWith('http://127.0.0.1:4176'))throw Error('Use o perfil local descartável na porta 4176.');
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/connection.mjs*',route=>route.fulfill({contentType:'text/javascript',body:`export const connection={supabaseUrl:'https://fixture.supabase.co',publishableKey:'sb_publishable_fixture'};`}));
  const sdk=`
  export function createClient(){
    const fixture=window.__crmFixture={users:[{id:'00000000-0000-0000-0000-000000000001',name:'Administrador QA',email:'admin@example.test',role:'admin',active:true,must_change_password:false}],session:null,state:null,failNextSave:false,calls:[]};
    const current=()=>fixture.users.find(u=>u.id===fixture.session?.user.id);
    return {auth:{getSession:async()=>({data:{session:fixture.session}}),signInWithPassword:async({email,password})=>{const u=fixture.users.find(u=>u.email===email&&u.active);if(!u||password==='bad')return {error:{message:'Invalid'}};fixture.session={user:{id:u.id}};return {data:{session:fixture.session}};},signOut:async()=>{fixture.session=null;return {};},updateUser:async()=>({})},functions:{invoke:async(_name,{body})=>{
      fixture.calls.push(body.action);const actor=current();if(!actor?.active)return {data:{error:'Acesso desativado.'}};
      if(body.action==='me')return {data:{profile:structuredClone(actor)}};
      if(body.action==='passwordChanged'){actor.must_change_password=false;return {data:{ok:true}};}
      if(actor.must_change_password)return {data:{error:'Altere sua senha inicial.'}};
      if(body.action==='loadState')return {data:{payload:structuredClone(fixture.state),revision:fixture.state?.revision||0}};
      if(body.action==='initState'){fixture.state={...structuredClone(body.state),revision:1};return {data:{state:structuredClone(fixture.state)}};}
      if(body.action==='saveState'){if(fixture.failNextSave){fixture.failNextSave=false;return {data:{error:'CONFLICT: outra pessoa gravou.'}};}fixture.state=structuredClone(body.state);return {data:{state:structuredClone(fixture.state)}};}
      if(actor.role!=='admin')return {data:{error:'Somente administradores.'}};
      if(body.action==='listUsers')return {data:{users:structuredClone(fixture.users)}};
      if(body.action==='createUser'){if(fixture.users.some(u=>u.email===body.email))return {data:{error:'Email já cadastrado.'}};fixture.users.push({id:crypto.randomUUID(),name:body.name,email:body.email,role:body.role,active:true,must_change_password:true});return {data:{ok:true}};}
      const u=fixture.users.find(u=>u.id===body.id);if(body.action==='updateUser')Object.assign(u,{name:body.name,role:body.role,active:body.active});if(body.action==='deleteUser')fixture.users=fixture.users.filter(u=>u.id!==body.id);return {data:{ok:true}};
    }}};
  }`;
  await page.route('https://esm.sh/@supabase/supabase-js@2.57.4?bundle',route=>route.fulfill({contentType:'text/javascript',body:sdk}));
  await page.reload();await page.getByRole('heading',{name:'Bem-vindo de volta'}).waitFor();
  const check=(ok,msg)=>{if(!ok)throw Error(msg);};
  const scope=async()=>await page.locator('#editor[open]').count()?page.locator('#editor'):page;
  const click=async name=>(await scope()).getByRole('button',{name,exact:true}).click();
  const field=(name,value)=>page.locator('#field-'+name+':visible').fill(value);
  const nav=async route=>{await page.evaluate(route=>location.hash=route,route);await page.waitForTimeout(120);};
  const login=async(email,password)=>{await field('email',email);await field('password',password);await click('Entrar');await page.waitForTimeout(200);};
  await login('admin@example.test','bad');check((await page.locator('#accountError').innerText()).includes('inválidos'),'Login inválido');check(await page.locator('.column').count()===0,'Base escondida antes do login');
  await login('admin@example.test','Synthetic-password-123');await nav('pipelines');await click('Começar com base vazia');await page.locator('#field-confirmed').check();await click('Salvar');await page.waitForTimeout(180);
  await click('＋ Negócio');await field('title','Negócio preservado QA');await field('quickContact','Contato QA');await click('Salvar');await page.waitForTimeout(200);
  await nav('users');await click('＋ Usuário');await field('name','Colaborador QA');await field('email','member@example.test');await field('password','Synthetic-password-123');await click('Salvar');await page.waitForTimeout(180);check(await page.getByRole('cell',{name:'member@example.test',exact:true}).count()===1,'Usuário criado');
  await click('＋ Usuário');await field('name','Duplicado QA');await field('email','member@example.test');await field('password','Synthetic-password-123');await click('Salvar');await page.waitForTimeout(120);check((await page.locator('#formError').innerText()).includes('já cadastrado'),'Duplicidade retornada');await click('Cancelar');
  const row=()=>page.locator('tr').filter({hasText:'member@example.test'});
  await row().getByRole('button',{name:'Editar',exact:true}).click();await page.locator('#field-active').uncheck();await click('Salvar');await page.waitForTimeout(120);check((await row().innerText()).includes('Desativado'),'Desativação');
  await row().getByRole('button',{name:'Editar',exact:true}).click();await page.locator('#field-active').check();await click('Salvar');await page.waitForTimeout(120);
  await page.setViewportSize({width:1440,height:980});await page.screenshot({path:'C:/Users/Administrador/Documents/Codex/output/playwright/crm-users-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await row().getByRole('button',{name:'Editar',exact:true}).click();await page.screenshot({path:'C:/Users/Administrador/Documents/Codex/output/playwright/crm-users-edit-mobile.png',fullPage:true});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sem vazamento móvel');await click('Cancelar');await page.setViewportSize({width:1440,height:980});
  await click('Sair');await login('member@example.test','Synthetic-password-123');check(await page.getByRole('heading',{name:'Crie sua senha pessoal'}).count()===1,'Troca inicial obrigatória');check(await page.locator('.column').count()===0,'Dados indisponíveis na troca inicial');await field('current','Synthetic-password-123');await field('password','New-synthetic-password-456');await field('confirmation','New-synthetic-password-456');await click('Salvar senha e continuar');await page.waitForTimeout(150);await nav('users');check(await page.getByRole('button',{name:'＋ Usuário',exact:true}).count()===0,'Colaborador sem gestão de usuários');await click('Sair');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'C:/Users/Administrador/Documents/Codex/output/playwright/crm-users-login-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:980});
  await login('admin@example.test','Synthetic-password-123');await nav('users');await row().getByRole('button',{name:'Excluir',exact:true}).click();await field('confirmation','wrong@example.test');await click('Salvar');check((await page.locator('#formError').innerText()).includes('exatamente'),'Confirmação de exclusão');await field('confirmation','member@example.test');await click('Salvar');await page.waitForTimeout(150);check(await row().count()===0,'Conta excluída');check(await page.evaluate(()=>window.__crmFixture.state.deals.length)===1,'Negócio preservado após exclusão');
  await nav('pipelines');await page.evaluate(()=>window.__crmFixture.failNextSave=true);await click('＋ Negócio');await field('title','Tentativa com conflito QA');await field('quickContact','Contato conflito QA');await click('Salvar');await page.waitForTimeout(160);check(await page.getByRole('button',{name:'Exportar tentativa não salva',exact:true}).count()===1,'Tentativa exportável');check(await page.locator('.deal').count()===1,'Conflito preserva base anterior');await click('Atualizar base');await page.waitForTimeout(160);check(await page.locator('#alert').isHidden(),'Atualização libera base');
  check(errors.length===0,'Erros JavaScript: '+errors.join(';'));
  return 'PASS (simulação local): login, criação, edição, desativação, troca inicial, colaborador, exclusão com confirmação e preservação, conflito de gravação e layout móvel.';
}
