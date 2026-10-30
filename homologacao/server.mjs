import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createSandbox,actors} from '../records/sandbox.mjs';
import {recordService} from '../records/service.mjs';
if(process.env.CRM_RECORDS_HOMOLOGATION!=='local')throw Error('Servidor exclusivo de testes. Defina CRM_RECORDS_HOMOLOGATION=local.');
const port=Number(process.env.CRM_PORT||4180),sandbox=await createSandbox();
const files={'/':'homologacao/index.html','/homologacao/':'homologacao/index.html','/homologacao/app.mjs':'homologacao/app.mjs','/homologacao/style.css':'homologacao/style.css','/styles.css':'styles.css','/poliniza-emblema.png':'poliniza-emblema.png','/records/core.mjs':'records/core.mjs','/model.mjs':'model.mjs','/operations-model.mjs':'operations-model.mjs'};
const types={html:'text/html; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',png:'image/png'};
const server=http.createServer(async(req,res)=>{
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const expectedHost=`127.0.0.1:${port}`;
 if(req.headers.host!==expectedHost)return json({error:'Host não autorizado.'},403);
 const pathname=new URL(req.url,`http://${expectedHost}`).pathname;
 if(req.method==='GET'&&pathname==='/api/context')return json({actors,mode:'synthetic-local',persistent:false});
 if(req.method==='POST'&&pathname==='/api/records'){
  if(req.headers.origin!==`http://${expectedHost}`||!req.headers['content-type']?.startsWith('application/json'))return json({error:'Origem não autorizada.'},403);
  // Actor selector is a test fixture, not an authentication mechanism.
  const actor=actors.find(a=>a.id===req.headers['x-sandbox-actor']);if(!actor)return json({error:'Selecione uma pessoa de teste.'},401);
  try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024)return json({error:'Solicitação maior que 5 MB.'},413);chunks.push(chunk);}const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));return json(await recordService(sandbox.rpc,actor.id,input));}
  catch(error){const message=error.message;return json({error:message},message.includes('CONFLICT:')?409:message.includes('autorizado')||message.includes('administradores')?403:400);}
 }
 if(req.method!=='GET'||!files[pathname])return json({error:'Não encontrado.'},404);
 try{const file=files[pathname],body=await readFile(new URL('../'+file,import.meta.url));res.writeHead(200,{'Content-Type':types[file.split('.').at(-1)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});res.end(body);}catch{json({error:'Arquivo indisponível.'},404);}
});
server.listen(port,'127.0.0.1',()=>console.log(`Homologação sintética: http://127.0.0.1:${port}/homologacao/ (dados em memória, sem login real)`));
async function close(){server.close();await sandbox.close();process.exit(0);}process.on('SIGINT',close);process.on('SIGTERM',close);
