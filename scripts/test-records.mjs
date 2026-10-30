import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
const dependency=process.env.CRM_PGLITE_MODULE;
if(!dependency||!existsSync(dependency)){
  console.error('Defina CRM_PGLITE_MODULE com o caminho absoluto do dist/index.js de @electric-sql/pglite@0.3.14. Os testes SQL não podem ser omitidos nesta verificação.');
  process.exit(1);
}
const root=fileURLToPath(new URL('../',import.meta.url));
const result=spawnSync(process.execPath,['--test','record-sync.test.mjs','records/core.test.mjs','records/work.test.mjs','records/http.test.mjs','model.test.mjs','operations.test.mjs','account.test.mjs','supabase/tests/internal-users.test.mjs'],{cwd:root,env:process.env,stdio:'inherit'});
process.exit(result.status??1);
