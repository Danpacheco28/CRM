import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
test('HTTP local: isolamento, origem, CRUD e dois editores sem snapshot',{timeout:30000},async()=>{
 const reserve=net.createServer();reserve.listen(0,'127.0.0.1');await once(reserve,'listening');const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
 const child=spawn(process.execPath,[fileURLToPath(new URL('../homologacao/server.mjs',import.meta.url))],{env:{...process.env,CRM_PORT:String(port),CRM_RECORDS_HOMOLOGATION:'local'},stdio:['ignore','pipe','pipe']});
 try{
 await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Servidor não iniciou.');}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Servidor não iniciou em 15s.')),15000).unref())]);
 const base=`http://127.0.0.1:${port}`;const context=await fetch(base+'/api/context').then(r=>r.json());assert.equal(context.mode,'synthetic-local');assert.equal(context.persistent,false);
 const html=await fetch(base+'/homologacao/');assert.equal(html.status,200);assert.match(html.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal((await fetch(base+'/connection.mjs')).status,404);
 const headers={'Content-Type':'application/json',Origin:base,'X-Sandbox-Actor':context.actors[0].id};
 const post=(body,extra={})=>fetch(base+'/api/records',{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
 assert.equal((await post({action:'page',entity:'contacts'},{Origin:'https://outside.example'})).status,403);
 assert.equal((await post({action:'page',entity:'contacts'},{'X-Sandbox-Actor':'unknown'})).status,401);
 const change=(id,name,expectedVersion=0)=>({entity:'contacts',op:'put',id,expectedVersion,data:{id,name,type:'organization',organizationId:'',email:'synthetic@example.test'}});
 const write=(changes,id=crypto.randomUUID(),actor=context.actors[0].id)=>post({action:'apply',requestId:id,changes},{'X-Sandbox-Actor':actor});
 assert.equal((await write([change('a','Pessoa A'),change('b','Pessoa B')])).status,200);
 const results=await Promise.all([write([change('a','Editado A',1)]),write([change('b','Editado B',1)],crypto.randomUUID(),context.actors[1].id)]);assert.deepEqual(results.map(r=>r.status),[200,200]);
 const conflict=await Promise.all([write([change('a','Edição 1',2)]),write([change('a','Edição 2',2)],crypto.randomUUID(),context.actors[1].id)]);assert.deepEqual(conflict.map(r=>r.status).sort(),[200,409]);
 const requestId='same-http',changes=[change('idempotent','Uma operação')];const first=await write(changes,requestId).then(r=>r.json());const second=await write(changes,requestId).then(r=>r.json());assert.deepEqual(second,first);
 const history=await post({action:'history',entity:'contacts',id:'idempotent'}).then(r=>r.json());assert.equal(history.length,1);
 const list=await post({action:'page',entity:'contacts',limit:1}).then(r=>r.json());assert.equal(list.rows.length,1);assert.equal(list.hasMore,true);
 }finally{child.kill();await once(child,'exit');}
});
