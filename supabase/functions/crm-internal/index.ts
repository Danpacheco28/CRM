import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { validateState } from '../../../model.mjs';
import { userInput } from '../../../account-client.mjs';
import {flattenRecords,saveRecordChanges,assembleRecords} from '../../../record-sync.mjs';

const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
Deno.serve(async request=>{
  const origin=request.headers.get('origin')||'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!allowed.includes(origin))return response({error:'Origem não autorizada.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return response({error:'Método não permitido.'},405);
  try{
    const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
    if(!token)return response({error:'Entre na sua conta.'},401);
    const {data:auth,error:authError}=await admin.auth.getUser(token);
    if(authError||!auth.user)return response({error:'Sessão expirada. Entre novamente.'},401);
    const {data:member,error:memberError}=await admin.from('crm_members').select('*').eq('id',auth.user.id).maybeSingle();
    if(memberError)throw Error('Estrutura de usuários indisponível. Confira a configuração do projeto.');
    if(!member?.active||member.deleting)return response({error:'Seu acesso está desativado ou ainda não foi autorizado.'},403);
    // Limit the streamed request before JSON parsing.
    const reader=request.body?.getReader();let length=0;const chunks:Uint8Array[]=[];
    if(reader)while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>16*1024*1024){await reader.cancel();return response({error:'Solicitação maior que 16 MB.'},413);}chunks.push(value);}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return response({error:'Solicitação inválida.'},400);}
    const action=input.action;
    if(action==='me')return response({profile:member});
    if(action==='passwordChanged'){
      // SQL compares the Auth password hash; editable user metadata grants no access.
      const {error}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'passwordChanged'});if(error)throw error;return response({ok:true});
    }
    if(member.must_change_password)return response({error:'Altere sua senha inicial antes de acessar o CRM.'},403);
    if(action==='loadState'){const {data,error}=await admin.rpc('crm_record_read',{p_actor:member.id});if(error)throw error;return response(data);}
    if(action==='applyRecords')return response(await saveRecordChanges((name:string,args:Record<string,unknown>)=>admin.rpc(name,args),member.id,input,validateState));
    if(action==='migrateRecords'){
      if(member.role!=='admin')throw Error('Somente administradores podem migrar.');
      const {data:current,error:readError}=await admin.rpc('crm_record_read',{p_actor:member.id});if(readError)throw readError;
      if(current.mode==='records')return response({alreadyActive:true});
      if(current.revision!==input.expected)throw Error('CONFLICT: atualize o backup antes de migrar.');
      const original=structuredClone(current.payload);validateState(current.payload);const entries=flattenRecords(current.payload);
      validateState(assembleRecords(Object.values(entries),current.revision,current.payload.savedAt));
      const {data,error}=await admin.rpc('crm_record_activate',{p_actor:member.id,p_expected:current.revision,p_snapshot:original,p_entries:entries});if(error)throw error;return response(data);
    }
    if(action==='saveState'||action==='initState'){
      if(action==='initState'&&member.role!=='admin')return response({error:'Somente administradores inicializam a base.'},403);
      if(!Number.isSafeInteger(input.expected)||input.expected<0)throw Error('Revisão inválida.');
      validateState(input.state);
      if(action==='saveState'&&input.state.revision!==input.expected+1)throw Error('Revisão inválida. Atualize a base.');
      const {data,error}=await admin.rpc('crm_save_workspace',{p_actor:member.id,p_expected:input.expected,p_payload:input.state,p_initialize:action==='initState'});if(error)throw error;return response({state:data});
    }
    if(member.role!=='admin')return response({error:'Somente administradores podem gerenciar usuários.'},403);
    if(action==='listUsers'){const {data,error}=await admin.from('crm_members').select('*').order('name');if(error)throw error;return response({users:data});}
    if(action==='createUser'){
      const values=userInput(input,true);
      const {data,error}=await admin.auth.admin.createUser({email:values.email,password:values.password,email_confirm:true,user_metadata:{crm_password_issued_at:new Date().toISOString()}});
      if(error)return response({error:'Não foi possível criar a conta. Verifique se o email já existe e se a senha atende à política do projeto.'},400);
      const {error:profileError}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'create',p_target:data.user!.id,p_values:{name:values.name,email:values.email,role:values.role}});
      if(profileError){await admin.auth.admin.deleteUser(data.user!.id);throw profileError;}
      return response({ok:true});
    }
    if(!/^[0-9a-f-]{36}$/i.test(input.id||''))throw Error('Usuário inválido.');
    if(action==='updateUser'){
      const values=userInput(input);if(typeof input.active!=='boolean')throw Error('Situação inválida.');
      const {error}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'update',p_target:input.id,p_values:{name:values.name,role:values.role,active:input.active}});if(error)throw error;return response({ok:true});
    }
    if(action==='deleteUser'){
      // Revoke database access first. Failure deleting Auth leaves an inactive retryable account.
      const {error}=await admin.rpc('crm_member_action',{p_actor:member.id,p_action:'delete',p_target:input.id});if(error)throw error;
      const {error:deleteError}=await admin.auth.admin.deleteUser(input.id);
      if(deleteError)return response({error:'Acesso bloqueado, mas a conta não pôde ser excluída. Tente excluir novamente.'},409);
      return response({ok:true});
    }
    return response({error:'Operação inválida.'},400);
  }catch(error){const message=error instanceof Error?error.message:String((error as {message?:string})?.message||'Falha na operação.');return response({error:message},message.includes('CONFLICT:')?409:400);}
});
