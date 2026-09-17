import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exists = value => fs.existsSync(path.join(root, value));
const absolute = value => path.join(root, value);

function move(from, to) {
  if (!exists(from)) return;
  if (exists(to)) throw new Error(`Destination already exists: ${to}`);
  fs.mkdirSync(path.dirname(absolute(to)), { recursive: true });
  fs.renameSync(absolute(from), absolute(to));
}

move('course-context.js', 'dafaa-context.js');
move('course-ui.js', 'dafaa-ui.js');
move('course-ui.css', 'dafaa-ui.css');
move('pre-course.css', 'pre-dafaa.css');
move('functions/_lib/courses.mjs', 'functions/_lib/dafat.mjs');
move('functions/_lib/course-routes.mjs', 'functions/_lib/dafaa-routes.mjs');
move('functions/_lib/course-gate.mjs', 'functions/_lib/dafaa-gate.mjs');
move('functions/api/v1/courses.js', 'functions/api/v1/dafat.js');
move('functions/api/v1/courses', 'functions/api/v1/dafat');
move('tests/course-context.test.js', 'tests/dafaa-context.test.js');
move('tests/course-rbac.test.mjs', 'tests/dafaa-rbac.test.mjs');

const historicalMigrations = new Set([
  'migrations/0001_production_backend.sql',
  'migrations/0002_course_rbac.sql',
  'migrations/0003_student_credentials.sql',
  'migrations/0004_student_pin_secrets.sql',
  'migrations/0005_school_teacher_system.sql'
]);
const ignored = new Set([
  '.git', 'node_modules', 'scripts/dafaa-domain-refactor.mjs', '.github/workflows/dafaa-domain-refactor.yml'
]);
const textExtensions = new Set(['.js','.mjs','.css','.html','.md','.json','.jsonc','.yml','.yaml']);

function walk(directory = '.') {
  const result = [];
  for (const entry of fs.readdirSync(absolute(directory), { withFileTypes: true })) {
    const rel = path.posix.join(directory === '.' ? '' : directory, entry.name);
    if (ignored.has(rel) || ignored.has(entry.name)) continue;
    if (entry.isDirectory()) result.push(...walk(rel));
    else result.push(rel);
  }
  return result;
}

function protect(text) {
  const values = [];
  const stash = value => {
    const token = `__DAFATII_PROTECTED_${values.length}__`;
    values.push(value);
    return token;
  };
  text = text.replace(/https?:\/\/[^\s"'`<>)}\]]+/g, stash);
  text = text.replace(/OpenCourseWare/g, stash);
  text = text.replace(/0002_course_rbac\.sql/g, stash);
  return { text, restore: value => values.reduce((out, item, index) => out.replaceAll(`__DAFATII_PROTECTED_${index}__`, item), value) };
}

function transform(source, rel) {
  const protectedText = protect(source);
  let text = protectedText.text;
  text = text
    .replaceAll('COURSES', 'DAFAT')
    .replaceAll('Courses', 'Dafat')
    .replaceAll('courses', 'dafat')
    .replaceAll('COURSE', 'DAFAA')
    .replaceAll('Course', 'Dafaa')
    .replaceAll('course', 'dafaa');

  // Arabic product terminology.
  text = text
    .replaceAll('الدورات', 'الدفعات')
    .replaceAll('دورات', 'دفعات')
    .replaceAll('دورة', 'دفعة');

  // Product grammar: personal collection is Dafati.
  text = text
    .replaceAll('Your dafat', 'Dafati')
    .replaceAll('My dafat', 'Dafati')
    .replaceAll('your dafat', 'Dafati')
    .replaceAll('my dafat', 'Dafati')
    .replaceAll('Your Dafat', 'Dafati')
    .replaceAll('My Dafat', 'Dafati')
    .replaceAll('Create dafaa', 'Create a Dafaa')
    .replaceAll('Create Dafaa', 'Create a Dafaa')
    .replaceAll('create dafaa', 'create a Dafaa')
    .replaceAll('Join dafaa', 'Join a Dafaa')
    .replaceAll('Join Dafaa', 'Join a Dafaa')
    .replaceAll('join dafaa', 'join a Dafaa');

  // API/DTO conventions use plural dafat and singular dafaa.
  text = text
    .replaceAll('dafatId', 'dafaaId')
    .replaceAll('dafat_id', 'dafaa_id')
    .replaceAll('dafatCount', 'dafaaCount')
    .replaceAll('dafat_count', 'dafaa_count');

  // Avoid double articles introduced by string replacement.
  text = text.replaceAll('Create a a Dafaa', 'Create a Dafaa').replaceAll('Join a a Dafaa', 'Join a Dafaa');
  return protectedText.restore(text);
}

for (const rel of walk()) {
  if (historicalMigrations.has(rel)) continue;
  if (!textExtensions.has(path.extname(rel))) continue;
  const filename = absolute(rel);
  const before = fs.readFileSync(filename, 'utf8');
  const after = transform(before, rel);
  if (after !== before) fs.writeFileSync(filename, after);
}

const schemaHelper = `import { HttpError } from './http.mjs';

const tableExists = async (db, name) => Boolean(await db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?").bind(name).first());
const columnExists = async (db, table, column) => {
  const result = await db.prepare(\`PRAGMA table_info(\${table})\`).all();
  return result.results.some(item => item.name === column);
};
const exec = (db, sql) => db.exec(sql);

export async function ensureDafaaSchema(db) {
  if (!db) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');

  // Rename the legacy production schema in-place. Each step is independently
  // guarded so concurrent first requests can safely converge on the new model.
  if (await tableExists(db, 'courses') && !await tableExists(db, 'dafat')) {
    try { await exec(db, 'ALTER TABLE courses RENAME TO dafat;'); }
    catch (error) { if (!await tableExists(db, 'dafat')) throw error; }
  }
  if (await tableExists(db, 'course_memberships') && !await tableExists(db, 'dafaa_memberships')) {
    try { await exec(db, 'ALTER TABLE course_memberships RENAME TO dafaa_memberships;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_memberships')) throw error; }
  }
  if (await tableExists(db, 'course_content_records') && !await tableExists(db, 'dafaa_content_records')) {
    try { await exec(db, 'ALTER TABLE course_content_records RENAME TO dafaa_content_records;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_content_records')) throw error; }
  }
  if (await tableExists(db, 'course_content_mutations') && !await tableExists(db, 'dafaa_content_mutations')) {
    try { await exec(db, 'ALTER TABLE course_content_mutations RENAME TO dafaa_content_mutations;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_content_mutations')) throw error; }
  }
  if (await tableExists(db, 'course_audit_log') && !await tableExists(db, 'dafaa_audit_log')) {
    try { await exec(db, 'ALTER TABLE course_audit_log RENAME TO dafaa_audit_log;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_audit_log')) throw error; }
  }

  for (const table of ['dafaa_memberships','dafaa_content_records','dafaa_content_mutations','dafaa_audit_log']) {
    if (await tableExists(db, table) && await columnExists(db, table, 'course_id') && !await columnExists(db, table, 'dafaa_id')) {
      try { await exec(db, \`ALTER TABLE \${table} RENAME COLUMN course_id TO dafaa_id;\`); }
      catch (error) { if (!await columnExists(db, table, 'dafaa_id')) throw error; }
    }
  }
  if (await tableExists(db, 'files') && await columnExists(db, 'files', 'course_id') && !await columnExists(db, 'files', 'dafaa_id')) {
    try { await exec(db, 'ALTER TABLE files RENAME COLUMN course_id TO dafaa_id;'); }
    catch (error) { if (!await columnExists(db, 'files', 'dafaa_id')) throw error; }
  }

  await exec(db, \`
    DROP TRIGGER IF EXISTS block_school_student_course_insert;
    DROP TRIGGER IF EXISTS block_school_student_course_update;
    DROP TRIGGER IF EXISTS block_new_school_courses;
    DROP TRIGGER IF EXISTS block_course_stage_to_school;
    DROP INDEX IF EXISTS courses_owner_status_idx;
    DROP INDEX IF EXISTS courses_discovery_idx;
    DROP INDEX IF EXISTS course_memberships_user_idx;
    DROP INDEX IF EXISTS course_memberships_course_idx;
    DROP INDEX IF EXISTS course_content_updated_idx;
    DROP INDEX IF EXISTS course_content_mutations_created_idx;
    DROP INDEX IF EXISTS course_audit_course_idx;
    DROP INDEX IF EXISTS course_audit_actor_idx;
    DROP INDEX IF EXISTS files_course_status_idx;
    CREATE INDEX IF NOT EXISTS dafat_owner_status_idx ON dafat(owner_user_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafat_discovery_idx ON dafat(status, visibility, stage, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_memberships_user_idx ON dafaa_memberships(user_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_memberships_dafaa_idx ON dafaa_memberships(dafaa_id, status, role, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_content_updated_idx ON dafaa_content_records(dafaa_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_content_mutations_created_idx ON dafaa_content_mutations(created_at);
    CREATE INDEX IF NOT EXISTS dafaa_audit_dafaa_idx ON dafaa_audit_log(dafaa_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_audit_actor_idx ON dafaa_audit_log(actor_user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS files_dafaa_status_idx ON files(dafaa_id, status, created_at DESC);
    CREATE TRIGGER IF NOT EXISTS block_school_student_dafaa_insert
    BEFORE INSERT ON dafaa_memberships
    WHEN NEW.role = 'student' AND NEW.status <> 'removed'
      AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
    CREATE TRIGGER IF NOT EXISTS block_school_student_dafaa_update
    BEFORE UPDATE OF role, status ON dafaa_memberships
    WHEN NEW.role = 'student' AND NEW.status <> 'removed'
      AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
    CREATE TRIGGER IF NOT EXISTS block_new_school_dafat
    BEFORE INSERT ON dafat WHEN NEW.stage = 'school'
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;
    CREATE TRIGGER IF NOT EXISTS block_dafaa_stage_to_school
    BEFORE UPDATE OF stage ON dafat WHEN NEW.stage = 'school'
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;
  \`);

  await db.prepare("UPDATE records SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();
  await db.prepare("UPDATE record_mutations SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();
  if (await tableExists(db, 'dafaa_audit_log')) {
    await db.prepare("UPDATE dafaa_audit_log SET action = REPLACE(action, 'course.', 'dafaa.') WHERE action LIKE 'course.%'").run();
    await db.prepare("UPDATE dafaa_audit_log SET metadata_json = REPLACE(metadata_json, '\\"courseId\\"', '\\"dafaaId\\"') WHERE metadata_json LIKE '%courseId%'").run();
  }
}
`;
fs.writeFileSync(absolute('functions/_lib/dafaa-schema.mjs'), schemaHelper);

const migration = `PRAGMA foreign_keys = ON;

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
CREATE INDEX dafat_owner_status_idx ON dafat(owner_user_id, status, updated_at DESC);
CREATE INDEX dafat_discovery_idx ON dafat(status, visibility, stage, updated_at DESC);
CREATE INDEX dafaa_memberships_user_idx ON dafaa_memberships(user_id, status, updated_at DESC);
CREATE INDEX dafaa_memberships_dafaa_idx ON dafaa_memberships(dafaa_id, status, role, updated_at DESC);
CREATE INDEX dafaa_content_updated_idx ON dafaa_content_records(dafaa_id, updated_at DESC);
CREATE INDEX dafaa_content_mutations_created_idx ON dafaa_content_mutations(created_at);
CREATE INDEX dafaa_audit_dafaa_idx ON dafaa_audit_log(dafaa_id, created_at DESC);
CREATE INDEX dafaa_audit_actor_idx ON dafaa_audit_log(actor_user_id, created_at DESC);
CREATE INDEX files_dafaa_status_idx ON files(dafaa_id, status, created_at DESC);

UPDATE records SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1';
UPDATE record_mutations SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1';
UPDATE dafaa_audit_log SET action = REPLACE(action, 'course.', 'dafaa.') WHERE action LIKE 'course.%';
UPDATE dafaa_audit_log SET metadata_json = REPLACE(metadata_json, '"courseId"', '"dafaaId"') WHERE metadata_json LIKE '%courseId%';

CREATE TRIGGER block_school_student_dafaa_insert
BEFORE INSERT ON dafaa_memberships
WHEN NEW.role = 'student' AND NEW.status <> 'removed'
  AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
CREATE TRIGGER block_school_student_dafaa_update
BEFORE UPDATE OF role, status ON dafaa_memberships
WHEN NEW.role = 'student' AND NEW.status <> 'removed'
  AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
CREATE TRIGGER block_new_school_dafat
BEFORE INSERT ON dafat WHEN NEW.stage = 'school'
BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;
CREATE TRIGGER block_dafaa_stage_to_school
BEFORE UPDATE OF stage ON dafat WHEN NEW.stage = 'school'
BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;

PRAGMA optimize;
`;
fs.writeFileSync(absolute('migrations/0006_dafaa_domain.sql'), migration);

// ensureAccountProfile is the common authenticated entry point, so it also
// guarantees the in-place schema rename for deployments where migrations are
// not applied separately by the hosting pipeline.
const dafatFile = absolute('functions/_lib/dafat.mjs');
let dafat = fs.readFileSync(dafatFile, 'utf8');
if (!dafat.includes("./dafaa-schema.mjs")) dafat = `import { ensureDafaaSchema } from './dafaa-schema.mjs';\n${dafat}`;
dafat = dafat.replace('export async function ensureAccountProfile(db, user, requested = null, now = Date.now()) {', 'export async function ensureAccountProfile(db, user, requested = null, now = Date.now()) {\n  await ensureDafaaSchema(db);');
fs.writeFileSync(dafatFile, dafat);

// The generic API router also exposes files, whose ownership column is renamed.
// Calling the schema guard before routing prevents a file request from racing the
// first Dafat request after deployment.
const apiFile = absolute('functions/api/v1/[[path]].js');
let api = fs.readFileSync(apiFile, 'utf8');
if (!api.includes("../../_lib/dafaa-schema.mjs")) api = api.replace("import { accessibleFile, ownedFile, publicFileDto } from '../../_lib/access.mjs';", "import { accessibleFile, ownedFile, publicFileDto } from '../../_lib/access.mjs';\nimport { ensureDafaaSchema } from '../../_lib/dafaa-schema.mjs';");
api = api.replace('  requireDb(context.env);\n  assertSameOrigin', '  requireDb(context.env);\n  await ensureDafaaSchema(context.env.DB);\n  assertSameOrigin');
fs.writeFileSync(apiFile, api);

const test = `const fs = require('node:fs');
const assert = require('node:assert/strict');

const index = fs.readFileSync('index.html','utf8');
const context = fs.readFileSync('dafaa-context.js','utf8');
const ui = fs.readFileSync('dafaa-ui.js','utf8');
const backend = fs.readFileSync('functions/_lib/dafat.mjs','utf8');
const routes = fs.readFileSync('functions/_lib/dafaa-routes.mjs','utf8');
const schema = fs.readFileSync('functions/_lib/dafaa-schema.mjs','utf8');
const migration = fs.readFileSync('migrations/0006_dafaa_domain.sql','utf8');

assert.ok(index.includes('dafaa-context.js') && index.includes('dafaa-ui.js') && index.includes('dafaa-ui.css'), 'new Dafaa assets must be loaded');
assert.ok(context.includes('window.DafatiiDafat') && !context.includes('window.DafatiiCourses'), 'canonical client global must be DafatiiDafat');
assert.ok(context.includes('/dafat') && !context.includes('/courses'), 'client API must use /dafat');
assert.ok(ui.includes('Dafati'), 'personal Dafaa collection must be called Dafati');
assert.ok(ui.includes('Create a Dafaa') && ui.includes('Dafat'), 'Dafaa/Dafat user-facing terminology missing');
assert.ok(backend.includes('dafaa_memberships') && routes.includes('FROM dafat'), 'backend model must use Dafaa/Dafat schema names');
assert.ok(routes.includes("path === 'dafat'") && routes.includes('/^dafat\\/'), 'backend router must use /dafat');
assert.ok(schema.includes('ALTER TABLE courses RENAME TO dafat') && migration.includes('ALTER TABLE courses RENAME TO dafat'), 'legacy data must migrate in place');
assert.ok(migration.includes('ALTER TABLE files RENAME COLUMN course_id TO dafaa_id'), 'file ownership must migrate to dafaa_id');

for (const file of ['dafaa-context.js','dafaa-ui.js','functions/_lib/dafat.mjs','functions/_lib/dafaa-routes.mjs','functions/_lib/dafaa-gate.mjs']) {
  const value = fs.readFileSync(file,'utf8').replace(/OpenCourseWare/g,'').replace(/https?:\\/\\/[^\\s"'\\`<>)}\\]]+/g,'');
  assert.ok(!/\\bcourse(s)?\\b/i.test(value), `${file} still contains active Course/Courses terminology`);
}
console.log('Dafaa domain rename regression tests passed');
`;
fs.writeFileSync(absolute('tests/dafaa-domain.test.js'), test);

// Ensure the new regression is part of CI and syntax checks use renamed files.
const packageFile = absolute('package.json');
const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
if (!pkg.scripts.test.includes('tests/dafaa-domain.test.js')) pkg.scripts.test += ' && node tests/dafaa-domain.test.js';
pkg.scripts.check = pkg.scripts.check
  .replaceAll('course-context.js','dafaa-context.js')
  .replaceAll('course-ui.js','dafaa-ui.js')
  .replaceAll('functions/api/v1/courses.js','functions/api/v1/dafat.js')
  .replaceAll("functions/api/v1/courses/[[path]].js","functions/api/v1/dafat/[[path]].js");
if (!pkg.scripts.check.includes('functions/_lib/dafaa-schema.mjs')) pkg.scripts.check += ' && node --check functions/_lib/dafaa-schema.mjs';
fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`);

// One-shot automation cleans itself up after producing the real refactor.
fs.rmSync(absolute('scripts/dafaa-domain-refactor.mjs'), { force: true });
fs.rmSync(absolute('.github/workflows/dafaa-domain-refactor.yml'), { force: true });
try { fs.rmdirSync(absolute('scripts')); } catch {}

console.log('Dafaa domain refactor complete.');
