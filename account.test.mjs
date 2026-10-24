import test from 'node:test';
import assert from 'node:assert/strict';
import {publicConnection,userInput,InternalAccess} from './account-client.mjs';
test('configuração vazia mantém modo local e chave secreta é recusada',()=>{
  assert.equal(publicConnection({supabaseUrl:'',publishableKey:''}),false);
  assert.throws(()=>publicConnection({supabaseUrl:'https://project.supabase.co',publishableKey:'sb_secret_example'}),/secreta/);
  const token='eyJ.'+btoa(JSON.stringify({role:'service_role'}))+'.signature';
  assert.throws(()=>publicConnection({supabaseUrl:'https://project.supabase.co',publishableKey:token}),/anon pública/);
  assert.equal(publicConnection({supabaseUrl:'https://project.supabase.co',publishableKey:'sb_publishable_example'}),true);
  assert.throws(()=>publicConnection({supabaseUrl:'https://elsewhere.test',publishableKey:'sb_publishable_example'}),/URL HTTPS/);
});
test('cadastro normaliza email e valida perfil, nome e senha sem persistir credenciais',()=>{
  const valid={name:' Ana ',email:' ANA@example.test ',role:'member',password:'Synthetic-password-123'};
  assert.deepEqual(userInput(valid,true),{name:'Ana',email:'ana@example.test',role:'member',password:valid.password});
  for(const change of [{role:'superadmin'},{name:''},{email:'invalid'},{password:'short'}])assert.throws(()=>userInput({...valid,...change},true));
  assert.equal(Object.hasOwn(userInput(valid),'password'),false);
});
test('erros de autorização do servidor chegam à interface sem sucesso fictício',async()=>{
  const access=new InternalAccess({functions:{invoke:async()=>({error:{context:{json:async()=>({error:'Somente administradores.'})}}})}});
  await assert.rejects(()=>access.create({name:'Ana',email:'ana@example.test',role:'member',password:'Synthetic-password-123'}),/Somente administradores/);
  assert.deepEqual(access.users,[]);
});
test('criação e exclusão só atualizam lista depois de confirmação remota',async()=>{
  const calls=[],users=[{id:'one',name:'Ana',email:'ana@example.test',role:'member',active:true}];
  const access=new InternalAccess({functions:{invoke:async(_name,request)=>{calls.push(request.body.action);return {data:request.body.action==='listUsers'?{users}:{ok:true}};}}});
  await access.create({name:'Ana',email:'ana@example.test',role:'member',password:'Synthetic-password-123'});await access.remove('one');
  assert.deepEqual(calls,['createUser','listUsers','deleteUser','listUsers']);assert.deepEqual(access.users,users);
});
