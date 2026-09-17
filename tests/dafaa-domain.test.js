const fs = require('node:fs');
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
assert.ok(context.includes('/dafat'), 'client API must use /dafat');
assert.ok(ui.includes('Dafati'), 'personal Dafaa collection must be called Dafati');
assert.ok(ui.includes('Create a Dafaa') && ui.includes('Dafat'), 'Dafaa/Dafat user-facing terminology missing');
assert.ok(backend.includes('dafaa_memberships') && routes.includes('FROM dafat'), 'backend model must use Dafaa/Dafat schema names');
assert.ok(routes.includes("path === 'dafat'") || routes.includes("path.startsWith('dafat')"), 'backend router must use /dafat');
assert.ok(schema.includes('ALTER TABLE courses RENAME TO dafat') && migration.includes('ALTER TABLE courses RENAME TO dafat'), 'legacy data must migrate in place');
assert.ok(migration.includes('ALTER TABLE files RENAME COLUMN course_id TO dafaa_id'), 'file ownership must migrate to dafaa_id');

for (const file of ['dafaa-context.js','dafaa-ui.js','functions/_lib/dafat.mjs','functions/_lib/dafaa-routes.mjs','functions/_lib/dafaa-gate.mjs']) {
  const value = fs.readFileSync(file,'utf8').replace(/OpenCourseWare/g,'').replace(/https?:[/][/][^\s]+/g,'');
  assert.ok(!/\bcourse(s)?\b/i.test(value), file + ' still contains active Course/Courses terminology');
}
console.log('Dafaa domain rename regression tests passed');
