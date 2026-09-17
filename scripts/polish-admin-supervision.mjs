import fs from 'node:fs';
const rep=(f,a,b)=>{const v=fs.readFileSync(f,'utf8');if(!v.includes(a))throw new Error(`missing ${a} in ${f}`);fs.writeFileSync(f,v.replace(a,b));};
rep('admin-supervision.js',"  'use strict';","  'use strict';\n  window.DafatiiAdminSupervision=true;");
rep('role-panels.js',"if(page==='admin')bindAdmin();","if(page==='admin'&&!window.DafatiiAdminSupervision)bindAdmin();");
let test=fs.readFileSync('tests/admin-supervision.test.js','utf8');
const marker="console.log('admin supervision regression tests passed');";
if(!test.includes('DafatiiAdminSupervision')) test=test.replace(marker,"const roles=fs.readFileSync('role-panels.js','utf8');\nassert.ok(ui.includes('DafatiiAdminSupervision')&&roles.includes(\"page==='admin'&&!window.DafatiiAdminSupervision\"),'legacy admin loader must not race the supervision page');\n"+marker);
fs.writeFileSync('tests/admin-supervision.test.js',test);
for(const f of ['scripts/polish-admin-supervision.mjs','.github/workflows/admin-supervision-polish.yml'])try{fs.rmSync(f,{force:true});}catch{}
try{fs.rmdirSync('scripts');}catch{}
