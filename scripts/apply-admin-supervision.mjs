import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');const write=(f,v)=>fs.writeFileSync(f,v);const rep=(f,a,b)=>{const v=read(f);if(!v.includes(a))throw new Error(`missing anchor in ${f}: ${a.slice(0,80)}`);write(f,v.replace(a,b));};
rep('functions/_lib/auth.mjs',"import { prepareSchoolAcademicProfileInsert } from './school-signup-profile.mjs';","import { prepareAcademicProfileInsert } from './school-signup-profile.mjs';");
rep('functions/_lib/auth.mjs',"const academicProfileInsert = studentStage === 'school' ? await prepareSchoolAcademicProfileInsert(db, id, validated, now) : null;","const academicProfileInsert = await prepareAcademicProfileInsert(db, id, validated, now);");
let routes=read('functions/_lib/dafaa-routes.mjs');
routes=routes.replace(/async function ensureRepresenterAccount[\s\S]*?\n}\n\nasync function listDafat/, 'async function listDafat');
routes=routes.replace("if (!currentActor.isAdmin && currentActor.accountType !== 'representer') throw new HttpError(403, 'REPRESENTER_ACCOUNT_REQUIRED', 'A representer account is required to create a dafaa.');","if (!currentActor.isAdmin && currentActor.studentStage !== 'university') throw new HttpError(403, 'HIGHER_EDUCATION_REQUIRED', 'Only post-school students can create a dafaa.');");
routes=routes.replace("\n  await ensureRepresenterAccount(context.env.DB, owner.id, now);",'');
write('functions/_lib/dafaa-routes.mjs',routes);
rep('dafaa-ui.js',"const canCreate=actor?.platformRole==='admin'||actor?.accountType==='representer';","const canCreate=actor?.platformRole==='admin'||actor?.studentStage==='university';");
rep('dafaa-ui.js','Join a Dafaa, or create a Dafaa from a representer account.','Join a Dafaa, or create your own Dafaa if you are a post-school student.');
rep('dafaa-ui.js','<option value="school">School</option><option value="university" selected>University</option><option value="independent">Independent</option>','<option value="university" selected>Higher education</option><option value="independent">Independent</option>');
rep('functions/api/v1/[[path]].js',"import { dispatchDafaaRoute } from '../../_lib/dafaa-routes.mjs';","import { dispatchDafaaRoute } from '../../_lib/dafaa-routes.mjs';\nimport { dispatchAdminSupervision } from '../../_lib/admin-supervision.mjs';");
rep('functions/api/v1/[[path]].js',"  if (method === 'POST' && path === 'auth/logout') return logout(context);\n  await ensureDafaaSchema(context.env.DB);","  if (method === 'POST' && path === 'auth/logout') return logout(context);\n  const adminResponse = await dispatchAdminSupervision(context, method, path);\n  if (adminResponse) return adminResponse;\n  await ensureDafaaSchema(context.env.DB);");
rep('index.html','  <link rel="stylesheet" href="file-reader-interactions.css?v=20260917-1" />','  <link rel="stylesheet" href="file-reader-interactions.css?v=20260917-1" />\n  <link rel="stylesheet" href="admin-supervision.css?v=20260917-1" />');
rep('index.html','  <script src="study-structure.js?v=20260917-dafaa1" defer></script>','  <script src="study-structure.js?v=20260917-dafaa1" defer></script>\n  <script src="admin-supervision.js?v=20260917-1" defer></script>');
let pkg=JSON.parse(read('package.json'));
if(!pkg.scripts.test.includes('admin-supervision.test.js')) pkg.scripts.test += ' && node tests/admin-supervision.test.js';
if(!pkg.scripts.check.includes('admin-supervision.js')) pkg.scripts.check = pkg.scripts.check.replace('node --check study-structure.js','node --check study-structure.js && node --check admin-supervision.js');
write('package.json',JSON.stringify(pkg,null,2)+'\n');
for(const f of ['scripts/apply-admin-supervision.mjs','.github/workflows/admin-supervision.yml'])try{fs.rmSync(f,{force:true});}catch{}
try{fs.rmdirSync('scripts');}catch{}
