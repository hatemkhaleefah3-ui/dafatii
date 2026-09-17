import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,v)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),v);};
const move=(from,to)=>{const a=path.join(root,from),b=path.join(root,to);if(fs.existsSync(a)){fs.mkdirSync(path.dirname(b),{recursive:true});if(fs.existsSync(b))fs.rmSync(b,{force:true});fs.renameSync(a,b);}};

const renames=[
 ['course-context.js','dafaa-context.js'],
 ['course-ui.js','dafaa-ui.js'],
 ['course-ui.css','dafaa-ui.css'],
 ['pre-course.css','pre-dafaa.css'],
 ['functions/_lib/courses.mjs','functions/_lib/dafat.mjs'],
 ['functions/_lib/course-routes.mjs','functions/_lib/dafaa-routes.mjs'],
 ['functions/_lib/course-gate.mjs','functions/_lib/dafaa-gate.mjs'],
 ['functions/api/v1/courses.js','functions/api/v1/dafat.js'],
 ['functions/api/v1/courses/[[path]].js','functions/api/v1/dafat/[[path]].js'],
 ['tests/course-context.test.js','tests/dafaa-context.test.js'],
 ['tests/course-rbac.test.mjs','tests/dafaa-rbac.test.mjs']
];
for(const pair of renames)move(...pair);

const skipBroad=new Set([
 'study-structure.js','study-structure.css','student-account-flow.js','student-account-flow.css',
 'tests/study-structure.test.js','tests/student-account-flow.test.js',
 'scripts/dafaa-domain-rename.mjs','.github/workflows/dafaa-domain-rename.yml'
]);
const legacyMigration=/^migrations\/000[1-5]_/;
const textExtensions=new Set(['.js','.mjs','.css','.html','.md','.json','.jsonc']);
function walk(dir='.'){
 const out=[];
 for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  if(entry.name==='.git'||entry.name==='node_modules')continue;
  const rel=path.posix.join(dir==='.'?'':dir,entry.name);
  if(entry.isDirectory())out.push(...walk(rel));else out.push(rel);
 }
 return out;
}
function renameDomainText(value){
 return value
  .replaceAll('change-course','dafati')
  .replaceAll('DafatiiCourses','DafatiiDafat')
  .replaceAll('COURSES','DAFAT')
  .replaceAll('Courses','Dafat')
  .replaceAll('courses','dafat')
  .replaceAll('COURSE','DAFAA')
  .replaceAll('Course','Dafaa')
  .replaceAll('course','dafaa');
}
function technicalOnly(value){
 return value
  .replaceAll('change-course','dafati')
  .replaceAll('DafatiiCourses','DafatiiDafat')
  .replaceAll('dafatii:courses:v1','dafatii:dafat:v1')
  .replaceAll('__dafatii:active-course','__dafatii:active-dafaa')
  .replaceAll('courseId','dafaaId')
  .replaceAll('course_id','dafaa_id')
  .replaceAll('courseCount','dafaaCount')
  .replaceAll('course_count','dafaa_count')
  .replaceAll('/courses','/dafat');
}
for(const rel of walk()){
 if(legacyMigration.test(rel))continue;
 if(!textExtensions.has(path.extname(rel))&&path.basename(rel)!=='package.json')continue;
 let value=read(rel),next;
 if(skipBroad.has(rel))next=technicalOnly(value);else next=renameDomainText(value);
 if(next!==value)write(rel,next);
}

// Public/personal terminology: Dafati is the personal Dafaa area; Dafat is plural.
if(exists('dafaa-ui.js')){
 let v=read('dafaa-ui.js');
 v=v.replace("LABELS['dafati']='Dafat';","LABELS['dafati']='Dafati';")
    .replaceAll('Your Dafat','Dafati')
    .replaceAll('Dafat and enrollment','Dafati and enrollment')
    .replaceAll('Discover Dafat','Discover Dafat')
    .replaceAll('Enrolled Dafat','My Dafat');
 write('dafaa-ui.js',v);
}

const schema=`import { HttpError } from './http.mjs';

let schemaReady = false;
const tableExists = async (db,name) => Boolean(await db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first());
const columnExists = async (db,table,name) => {
  const rows = await db.prepare(\`PRAGMA table_info(\${table})\`).all();
  return (rows.results || []).some(row => row.name === name);
};
const run = (db,sql) => db.prepare(sql).run();

async function ensureColumns(db) {
  const pairs = [
    ['dafaa_memberships','course_id','dafaa_id'],
    ['dafaa_content_records','course_id','dafaa_id'],
    ['dafaa_content_mutations','course_id','dafaa_id'],
    ['dafaa_audit_log','course_id','dafaa_id'],
    ['files','course_id','dafaa_id']
  ];
  for (const [table,legacy,current] of pairs) {
    if (await columnExists(db,table,current)) continue;
    if (await columnExists(db,table,legacy)) await run(db,\`ALTER TABLE \${table} RENAME COLUMN \${legacy} TO \${current}\`);
  }
}

async function ensureIndexesAndTriggers(db) {
  for (const name of ['courses_owner_status_idx','courses_discovery_idx','course_memberships_user_idx','course_memberships_course_idx','course_content_updated_idx','course_content_mutations_created_idx','course_audit_course_idx','course_audit_actor_idx','files_course_status_idx','block_school_student_course_insert','block_school_student_course_update','block_new_school_courses','block_course_stage_to_school']) {
    await run(db, \`DROP INDEX IF EXISTS \${name}\`).catch(()=>{});
    await run(db, \`DROP TRIGGER IF EXISTS \${name}\`).catch(()=>{});
  }
  const statements = [
    'CREATE INDEX IF NOT EXISTS dafat_owner_status_idx ON dafat(owner_user_id,status,updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS dafat_discovery_idx ON dafat(status,visibility,stage,updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS dafaa_memberships_user_idx ON dafaa_memberships(user_id,status,updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS dafaa_memberships_dafaa_idx ON dafaa_memberships(dafaa_id,status,role,updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS dafaa_content_updated_idx ON dafaa_content_records(dafaa_id,updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS dafaa_content_mutations_created_idx ON dafaa_content_mutations(created_at)',
    'CREATE INDEX IF NOT EXISTS dafaa_audit_dafaa_idx ON dafaa_audit_log(dafaa_id,created_at DESC)',
    'CREATE INDEX IF NOT EXISTS dafaa_audit_actor_idx ON dafaa_audit_log(actor_user_id,created_at DESC)',
    'CREATE INDEX IF NOT EXISTS files_dafaa_status_idx ON files(dafaa_id,status,created_at DESC)',
    `CREATE TRIGGER IF NOT EXISTS block_school_student_dafaa_insert BEFORE INSERT ON dafaa_memberships
      WHEN NEW.role='student' AND NEW.status<>'removed' AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id=NEW.user_id AND p.account_type='student' AND p.student_stage='school')
      BEGIN SELECT RAISE(ABORT,'SCHOOL_STUDENT_DAFAT_DISABLED'); END`,
    `CREATE TRIGGER IF NOT EXISTS block_school_student_dafaa_update BEFORE UPDATE OF role,status ON dafaa_memberships
      WHEN NEW.role='student' AND NEW.status<>'removed' AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id=NEW.user_id AND p.account_type='student' AND p.student_stage='school')
      BEGIN SELECT RAISE(ABORT,'SCHOOL_STUDENT_DAFAT_DISABLED'); END`,
    `CREATE TRIGGER IF NOT EXISTS block_new_school_dafat BEFORE INSERT ON dafat WHEN NEW.stage='school'
      BEGIN SELECT RAISE(ABORT,'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END`,
    `CREATE TRIGGER IF NOT EXISTS block_dafaa_stage_to_school BEFORE UPDATE OF stage ON dafat WHEN NEW.stage='school'
      BEGIN SELECT RAISE(ABORT,'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END`
  ];
  for (const statement of statements) await run(db,statement);
}

export async function ensureDafaaSchema(db) {
  if (schemaReady) return;
  if (!await tableExists(db,'dafat')) {
    if (!await tableExists(db,'courses')) throw new HttpError(503,'DAFAA_SCHEMA_UNAVAILABLE','Dafaa storage is unavailable.');
    const statements = [
      'DROP TRIGGER IF EXISTS block_school_student_course_insert',
      'DROP TRIGGER IF EXISTS block_school_student_course_update',
      'DROP TRIGGER IF EXISTS block_new_school_courses',
      'DROP TRIGGER IF EXISTS block_course_stage_to_school',
      'ALTER TABLE courses RENAME TO dafat',
      'ALTER TABLE course_memberships RENAME TO dafaa_memberships',
      'ALTER TABLE course_content_records RENAME TO dafaa_content_records',
      'ALTER TABLE course_content_mutations RENAME TO dafaa_content_mutations',
      'ALTER TABLE course_audit_log RENAME TO dafaa_audit_log'
    ];
    try { await db.batch(statements.map(sql=>db.prepare(sql))); }
    catch (error) { if (!await tableExists(db,'dafat')) throw error; }
  }
  await ensureColumns(db);
  await ensureIndexesAndTriggers(db);
  schemaReady = true;
}
`;
write('functions/_lib/dafaa-schema.mjs',schema);

const migration=`PRAGMA foreign_keys = ON;

DROP TRIGGER IF EXISTS block_school_student_course_insert;
DROP TRIGGER IF EXISTS block_school_student_course_update;
DROP TRIGGER IF EXISTS block_new_school_courses;
DROP TRIGGER IF EXISTS block_course_stage_to_school;

ALTER TABLE courses RENAME TO dafat;
ALTER TABLE course_memberships RENAME TO dafaa_memberships;
ALTER TABLE course_content_records RENAME TO dafaa_content_records;
ALTER TABLE course_content_mutations RENAME TO dafaa_content_mutations;
ALTER TABLE course_audit_log RENAME TO dafaa_audit_log;
ALTER TABLE dafaa_memberships RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE dafaa_content_records RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE dafaa_content_mutations RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE dafaa_audit_log RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE files RENAME COLUMN course_id TO dafaa_id;

DROP INDEX IF EXISTS courses_owner_status_idx;
DROP INDEX IF EXISTS courses_discovery_idx;
DROP INDEX IF EXISTS course_memberships_user_idx;
DROP INDEX IF EXISTS course_memberships_course_idx;
DROP INDEX IF EXISTS course_content_updated_idx;
DROP INDEX IF EXISTS course_content_mutations_created_idx;
DROP INDEX IF EXISTS course_audit_course_idx;
DROP INDEX IF EXISTS course_audit_actor_idx;
DROP INDEX IF EXISTS files_course_status_idx;

CREATE INDEX dafat_owner_status_idx ON dafat(owner_user_id,status,updated_at DESC);
CREATE INDEX dafat_discovery_idx ON dafat(status,visibility,stage,updated_at DESC);
CREATE INDEX dafaa_memberships_user_idx ON dafaa_memberships(user_id,status,updated_at DESC);
CREATE INDEX dafaa_memberships_dafaa_idx ON dafaa_memberships(dafaa_id,status,role,updated_at DESC);
CREATE INDEX dafaa_content_updated_idx ON dafaa_content_records(dafaa_id,updated_at DESC);
CREATE INDEX dafaa_content_mutations_created_idx ON dafaa_content_mutations(created_at);
CREATE INDEX dafaa_audit_dafaa_idx ON dafaa_audit_log(dafaa_id,created_at DESC);
CREATE INDEX dafaa_audit_actor_idx ON dafaa_audit_log(actor_user_id,created_at DESC);
CREATE INDEX files_dafaa_status_idx ON files(dafaa_id,status,created_at DESC);

CREATE TRIGGER block_school_student_dafaa_insert BEFORE INSERT ON dafaa_memberships
WHEN NEW.role='student' AND NEW.status<>'removed' AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id=NEW.user_id AND p.account_type='student' AND p.student_stage='school')
BEGIN SELECT RAISE(ABORT,'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
CREATE TRIGGER block_school_student_dafaa_update BEFORE UPDATE OF role,status ON dafaa_memberships
WHEN NEW.role='student' AND NEW.status<>'removed' AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id=NEW.user_id AND p.account_type='student' AND p.student_stage='school')
BEGIN SELECT RAISE(ABORT,'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
CREATE TRIGGER block_new_school_dafat BEFORE INSERT ON dafat WHEN NEW.stage='school'
BEGIN SELECT RAISE(ABORT,'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;
CREATE TRIGGER block_dafaa_stage_to_school BEFORE UPDATE OF stage ON dafat WHEN NEW.stage='school'
BEGIN SELECT RAISE(ABORT,'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;

PRAGMA optimize;
`;
write('migrations/0006_dafaa_domain_rename.sql',migration);

// Ensure every API surface migrates legacy production schema before using canonical Dafaa tables.
if(exists('functions/api/v1/[[path]].js')){
 let v=read('functions/api/v1/[[path]].js');
 if(!v.includes("./../../_lib/dafaa-schema.mjs")&&!v.includes("../../_lib/dafaa-schema.mjs")) v=v.replace("import { assertSameOrigin", "import { ensureDafaaSchema } from '../../_lib/dafaa-schema.mjs';\nimport { assertSameOrigin");
 v=v.replace('requireDb(context.env);\n  assertSameOrigin', 'requireDb(context.env);\n  await ensureDafaaSchema(context.env.DB);\n  assertSameOrigin');
 write('functions/api/v1/[[path]].js',v);
}
if(exists('functions/_lib/dafaa-gate.mjs')){
 let v=read('functions/_lib/dafaa-gate.mjs');
 if(!v.includes("'./dafaa-schema.mjs'")) v=`import { ensureDafaaSchema } from './dafaa-schema.mjs';\n${v}`;
 v=v.replace('if (!context.env.DB)', 'await ensureDafaaSchema(context.env.DB);\n  if (!context.env.DB)');
 // Correct order if the migration was inserted before the DB availability guard.
 v=v.replace('await ensureDafaaSchema(context.env.DB);\n  if (!context.env.DB) throw', 'if (!context.env.DB) throw');
 v=v.replace("if (!context.env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');", "if (!context.env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');\n  await ensureDafaaSchema(context.env.DB);");
 write('functions/_lib/dafaa-gate.mjs',v);
}
if(exists('functions/_lib/school-teachers.mjs')){
 let v=read('functions/_lib/school-teachers.mjs');
 if(!v.includes("'./dafaa-schema.mjs'")) v=`import { ensureDafaaSchema } from './dafaa-schema.mjs';\n${v}`;
 v=v.replace('export async function ensureSchoolTeacherSchema(db) {\n  if (schemaReady) return;', 'export async function ensureSchoolTeacherSchema(db) {\n  await ensureDafaaSchema(db);\n  if (schemaReady) return;');
 write('functions/_lib/school-teachers.mjs',v);
}

// Keep the study-structure meaning of Courses intact, while still switching any collaboration runtime identifiers.
for(const rel of ['study-structure.js','student-account-flow.js','tests/study-structure.test.js','tests/student-account-flow.test.js'])if(exists(rel))write(rel,technicalOnly(read(rel)));

// Cache-bust renamed browser assets.
if(exists('index.html')){
 let v=read('index.html');
 v=v.replace(/dafaa-context\.js(?:\?v=[^"']+)?/g,'dafaa-context.js?v=20260917-1')
    .replace(/dafaa-ui\.js(?:\?v=[^"']+)?/g,'dafaa-ui.js?v=20260917-1')
    .replace(/dafaa-ui\.css(?:\?v=[^"']+)?/g,'dafaa-ui.css?v=20260917-1')
    .replace(/pre-dafaa\.css(?:\?v=[^"']+)?/g,'pre-dafaa.css?v=20260917-1');
 write('index.html',v);
}

const domainTest=`const fs=require('fs');
const assert=require('assert');
const canonical=['dafaa-context.js','dafaa-ui.js','functions/_lib/dafat.mjs','functions/_lib/dafaa-routes.mjs','functions/_lib/dafaa-gate.mjs','functions/api/v1/dafat.js','functions/api/v1/dafat/[[path]].js'];
for(const file of canonical)assert.ok(fs.existsSync(file),\`missing canonical Dafaa file: \${file}\`);
for(const legacy of ['course-context.js','course-ui.js','functions/_lib/courses.mjs','functions/_lib/course-routes.mjs','functions/_lib/course-gate.mjs','functions/api/v1/courses.js'])assert.ok(!fs.existsSync(legacy),\`legacy runtime path remains: \${legacy}\`);
const activeFiles=['dafaa-context.js','dafaa-ui.js','role-panels.js','functions/_lib/dafat.mjs','functions/_lib/dafaa-routes.mjs','functions/_lib/dafaa-gate.mjs','functions/_lib/access.mjs','functions/_lib/school-teachers.mjs','functions/api/v1/[[path]].js','functions/api/v1/dafat.js','functions/api/v1/dafat/[[path]].js'];
for(const file of activeFiles){const text=fs.readFileSync(file,'utf8');assert.ok(!/DafatiiCourses|\\/courses\\b|\\bcourse_id\\b|\\bcourseId\\b|\\bCourses\\b|\\bCourse\\b/.test(text),\`legacy Dafaa domain terminology remains in \${file}\`);}
const study=fs.readFileSync('study-structure.js','utf8');assert.match(study,/courses:\{singular:'Course',plural:'Courses'/,'study-unit type Courses must remain intact');
const index=fs.readFileSync('index.html','utf8');assert.match(index,/dafaa-context\\.js/);assert.match(index,/dafaa-ui\\.js/);assert.doesNotMatch(index,/course-context\\.js|course-ui\\.js/);
console.log('dafaa-domain.test.js: ok');
`;
write('tests/dafaa-domain.test.js',domainTest);

if(exists('package.json')){
 const pkg=JSON.parse(read('package.json'));
 if(!pkg.scripts.test.includes('tests/dafaa-domain.test.js'))pkg.scripts.test += ' && node tests/dafaa-domain.test.js';
 pkg.scripts.check=pkg.scripts.check.replaceAll('course-context.js','dafaa-context.js').replaceAll('course-ui.js','dafaa-ui.js').replaceAll('course-rbac.test.mjs','dafaa-rbac.test.mjs').replaceAll("functions/api/v1/courses.js","functions/api/v1/dafat.js").replaceAll("functions/api/v1/courses/[[path]].js","functions/api/v1/dafat/[[path]].js");
 write('package.json',JSON.stringify(pkg,null,2)+'\n');
}

// One-shot files must not remain in the final branch.
for(const rel of ['scripts/dafaa-domain-rename.mjs','.github/workflows/dafaa-domain-rename.yml']){const full=path.join(root,rel);if(fs.existsSync(full))fs.rmSync(full,{force:true});}
