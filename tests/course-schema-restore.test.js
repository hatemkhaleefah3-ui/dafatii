const fs = require('node:fs');
const assert = require('node:assert/strict');

const helper = fs.readFileSync('functions/_lib/course-schema-restore.mjs', 'utf8');
const middleware = fs.readFileSync('functions/_middleware.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.ok(helper.includes("restore_pre_dafaa_course_schema_20260917"), 'rollback migration marker missing');
assert.ok(helper.includes('CREATE TABLE IF NOT EXISTS courses'), 'legacy courses table must be restored');
assert.ok(helper.includes('CREATE TABLE IF NOT EXISTS course_memberships'), 'legacy course memberships must be restored');
assert.ok(helper.includes("'dafatii:courses:v1'"), 'legacy course record key must be restored');
assert.ok(helper.includes('SELECT dafaa_id,user_id') && helper.includes('SELECT id,enrollment_code,name'), 'Dafaa-era rows must be preserved during rollback');
assert.ok(helper.includes('course_id = dafaa_id'), 'file ownership links must be mapped back to course_id');
assert.ok(middleware.includes('ensurePreDafaaCourseSchema') && middleware.includes("pathname.startsWith('/api/v1/')"), 'API middleware must run the compatibility restore');
assert.ok(!index.includes('dafaa-context.js') && !index.includes('dafaa-ui.js') && !index.includes('pre-dafaa.css'), 'active Dafaa UI assets must not remain after rollback');
assert.ok(index.includes('course-context.js') && index.includes('course-ui.js') && index.includes('pre-course.css'), 'pre-request Course UI assets must be restored');

console.log('course schema rollback compatibility tests passed');
