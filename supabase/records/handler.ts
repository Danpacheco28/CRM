// Homologation endpoint. Not deployed or referenced by the published CRM.
import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
import {recordService} from '../../records/service.mjs';
const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const origins=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
Deno.serve(async request=>{
 const origin=request.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(Deno.env.get('CRM_RECORDS_HOMOLOGATION')!=='enabled')return reply({error:'Endpoint de homologação desativado.'},503);
 if(origin&&!origins.includes(origin))return reply({error:'Origem não autorizada.'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'Método não permitido.'},405);
 const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return reply({error:'Entre na sua conta.'},401);
 const {data,error}=await client.auth.getUser(token);if(error||!data.user)return reply({error:'Sessão inválida.'},401);
 try{
  const chunks:Uint8Array[]=[];let size=0;const reader=request.body?.getReader();
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>5*1024*1024){await reader.cancel();return reply({error:'Solicitação maior que 5 MB.'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const input=JSON.parse(new TextDecoder().decode(bytes));
  return reply(await recordService((name:string,args:Record<string,unknown>)=>client.rpc(name,args),data.user.id,input));
 }catch(error){const message=error instanceof Error?error.message:'Operação inválida.';return reply({error:message},message.includes('CONFLICT:')?409:message.includes('autorizado')||message.includes('administradores')?403:400);}
});
