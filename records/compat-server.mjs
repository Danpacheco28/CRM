// Local regression of the published UI against the production record bridge.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createSandbox,actors} from './sandbox.mjs';
import {emptyState,validateState} from '../model.mjs';
import {flattenRecords,saveRecordChanges} from '../record-sync.mjs';
if(process.env.CRM_RECORDS_HOMOLOGATION!=='local')throw Error('Somente teste local.');
const env=await createSandbox({seed:false}),port=Number(process.env.CRM_PORT||4182),actor=actors[0].id;
await env.db.exec(await readFile(new URL('../supabase/migrations/202610300001_record_compat.sql',import.meta.url),'utf8'));
await env.db.query('select public.crm_save_workspace($1,0,$2::jsonb,true)',[actor,JSON.stringify(emptyState())]);
const rpc=async(name,args)=>{const allowed=['crm_record_read','crm_record_apply','crm_record_receipt','crm_record_activate'];if(!allowed.includes(name))throw Error('RPC inválida.');const values=Object.values(args);try{const r=await env.db.query(`select public.${name}(${values.map((v,i)=>`$${i+1}${v!==null&&typeof v==='object'?'::jsonb':''}`)}) value`,values.map(v=>v!==null&&typeof v==='object'?JSON.stringify(v):v));return {data:r.rows[0].value};}catch(error){return {error};}};
const current=(await rpc('crm_record_read',{p_actor:actor})).data;
const activation=await rpc('crm_record_activate',{p_actor:actor,p_expected:current.revision,p_snapshot:current.payload,p_entries:flattenRecords(current.payload)});if(activation.error)throw activation.error;
const files=['import-ui.mjs','import-model.mjs','dashboard-model.mjs','index.html','styles.css','app.js','model.mjs','operations-model.mjs','operations-ui.mjs','accounts-ui.mjs','account-client.mjs','record-sync.mjs','poliniza-emblema.png'];
http.createServer(async(req,res)=>{
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const host=`127.0.0.1:${port}`,path=new URL(req.url,`http://${host}`).pathname;
 if(req.headers.host!==host)return json({error:'Host inválido.'},403);
 if(path==='/fixture'&&req.method==='POST'){
  if(req.headers.origin!==`http://${host}`)return json({error:'Origem inválida.'},403);
  try{let text='';for await(const chunk of req){text+=chunk;if(text.length>16*1024*1024)return json({error:'Limite excedido.'},413);}const input=JSON.parse(text);
   if(input.action==='me')return json({profile:{id:actor,name:'Administrador fictício',email:'admin@example.test',role:'admin',active:true,must_change_password:false}});
   if(input.action==='loadState'){const r=await rpc('crm_record_read',{p_actor:actor});if(r.error)throw r.error;return json(r.data);}
   if(input.action==='applyRecords')return json(await saveRecordChanges(rpc,actor,input,validateState));
   if(input.action==='listUsers')return json({users:[]});
   return json({error:'Ação indisponível no teste.'},400);
  }catch(error){return json({error:error.message},error.message.includes('CONFLICT:')?409:400);}
 }
 if(path==='/connection.mjs'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end("export const connection={supabaseUrl:'https://fixture.supabase.co',publishableKey:'sb_publishable_fixture'};");}
 const file=path==='/'?'index.html':path.slice(1);if(!files.includes(file))return json({error:'Not found'},404);
 res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/javascript','Cache-Control':'no-store'});res.end(await readFile(new URL('../'+file,import.meta.url)));
}).listen(port,'127.0.0.1',()=>console.log(`Regressão da ponte: http://127.0.0.1:${port}`));
