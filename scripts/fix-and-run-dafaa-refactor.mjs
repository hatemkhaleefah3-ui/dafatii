import fs from 'node:fs';

const scriptPath = 'scripts/dafaa-domain-refactor.mjs';
let source = fs.readFileSync(scriptPath, 'utf8');

const badValueLine = /  const value = fs\.readFileSync\(file,'utf8'\)\.replace\(\/OpenCourseWare\/g,''\)\.replace\([^\n]+\);/;
if (!badValueLine.test(source)) throw new Error('Expected generated-test value line was not found.');
source = source.replace(
  badValueLine,
  "  const value = fs.readFileSync(file,'utf8').replace(/OpenCourseWare/g,'').replace(/https?:[/][/][^\\\\s]+/g,'');"
);

const badAssertLine = /  assert\.ok\(!\/\\\\bcourse\(s\)\?\\\\b\/i\.test\(value\), `\$\{file\} still contains active Course\/Courses terminology`\);/;
if (!badAssertLine.test(source)) throw new Error('Expected generated-test assertion line was not found.');
source = source.replace(
  badAssertLine,
  "  assert.ok(!/\\\\bcourse(s)?\\\\b/i.test(value), file + ' still contains active Course/Courses terminology');"
);

const insertionPoint = 'const schemaHelper = `';
if (!source.includes(insertionPoint)) throw new Error('Schema-helper insertion point was not found.');
source = source.replace(insertionPoint, `const rbacTestFile = absolute('tests/dafaa-rbac.test.mjs');
let rbacTest = fs.readFileSync(rbacTestFile, 'utf8');
rbacTest = rbacTest
  .replace('../migrations/0002_course_rbac.sql', '../migrations/0006_dafaa_domain.sql')
  .replace('/CREATE TABLE dafaa_memberships/', '/ALTER TABLE course_memberships RENAME TO dafaa_memberships/')
  .replace("assert.match(migration,/can_manage_representers/);", "assert.match(readFileSync(new URL('../functions/_lib/dafat.mjs',import.meta.url),'utf8'),/can_manage_representers/);")
  .replace('/ALTER TABLE files ADD COLUMN dafaa_id/', '/ALTER TABLE files RENAME COLUMN course_id TO dafaa_id/');
fs.writeFileSync(rbacTestFile, rbacTest);

${insertionPoint}`);

fs.writeFileSync(scriptPath, source);
await import(`./dafaa-domain-refactor.mjs?fixed=${Date.now()}`);
fs.rmSync('scripts/fix-and-run-dafaa-refactor.mjs', { force: true });
try { fs.rmdirSync('scripts'); } catch {}
