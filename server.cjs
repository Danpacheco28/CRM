const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const files={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/model.mjs':'model.mjs','/operations-model.mjs':'operations-model.mjs','/operations-ui.mjs':'operations-ui.mjs','/account-client.mjs':'account-client.mjs','/accounts-ui.mjs':'accounts-ui.mjs','/connection.mjs':'connection.mjs'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const port=Number(process.env.CRM_PORT||4173);
http.createServer((req,res)=>{const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});fs.createReadStream(path.join(__dirname,file)).pipe(res);}).listen(port,'127.0.0.1',()=>console.log(`CRM local: http://127.0.0.1:${port}`));
