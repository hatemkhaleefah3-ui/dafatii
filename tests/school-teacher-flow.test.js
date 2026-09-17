const fs = require('node:fs');
const assert = require('node:assert/strict');

const ui = fs.readFileSync('school-teacher-flow.js', 'utf8');
const css = fs.readFileSync('school-teacher-flow.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('functions/_lib/school-teachers.mjs', 'utf8');
const signupProfile = fs.readFileSync('functions/_lib/school-signup-profile.mjs', 'utf8');
const auth = fs.readFileSync('functions/_lib/auth.mjs', 'utf8');
const gate = fs.readFileSync('functions/_lib/dafaa-gate.mjs', 'utf8');
const migration = fs.readFileSync('migrations/0006_dafaa_domain.sql', 'utf8');
const rootRoute = fs.readFileSync('functions/api/v1/dafat.js', 'utf8');
const nestedRoute = fs.readFileSync('functions/api/v1/dafat/[[path]].js', 'utf8');
const schoolRoute = fs.readFileSync('functions/api/v1/school/[[path]].js', 'utf8');

const subjects = ['arabic','english','math','chemistry','physics','biology','islamic_book'];
for (const subject of subjects) {
  assert.ok(server.includes(`'${subject}'`), `server subject missing: ${subject}`);
  assert.ok(ui.includes(subject), `UI subject missing: ${subject}`);
}
assert.equal(subjects.length, 7, 'school teacher flow must contain seven subjects');
assert.ok(ui.includes('data-school-previous') && ui.includes('data-school-next'), 'seven-step flow needs previous and next controls');
assert.ok(ui.includes('step>=catalog.subjects.length-1') || ui.includes('step >= catalog.subjects.length - 1'), 'final step must finish the flow');
assert.ok(ui.includes('teacher.fameScore') && ui.includes('teacher.selectionCount'), 'teacher cards must expose popularity ordering signals');
assert.ok(css.includes('.school-stepper') && css.includes('.school-teacher-card'), 'school teacher UI styles missing');
assert.ok(index.includes('school-teacher-flow.css?v=20260917-dafaa1') && index.includes('school-teacher-flow.js?v=20260917-dafaa1'), 'school teacher assets must be loaded with the interaction-fix cache version');
assert.ok(ui.includes('if(!ALLOWED.has(current) || !teacherRoute(current))return;'), 'teacher renderer must stay out of profile/settings/signup routes');
assert.ok(ui.includes("if(!teacherRoute(route()))return;"), 'teacher enhancement must be inert outside dashboard and teacher picker');
assert.ok(ui.includes(".observe(appRoot,{childList:true});"), 'teacher observer must watch only top-level workspace replacements');
assert.ok(!ui.includes('subtree:true'), 'teacher observer must not watch every profile descendant mutation');
assert.ok(!ui.includes("if(!ALLOWED.has(current)){location.hash='dashboard';return;}"), 'teacher flow must not tear down the signup route after auth changes');

assert.ok(server.includes('ORDER BY a.fame_score DESC, selection_count DESC'), 'teacher directory must sort by fame and student selections');
assert.ok(server.includes('academic_level = ?') && server.includes('academic_stage = ?') && server.includes('academic_field = ?'), 'teacher directory must filter academic identity');
assert.ok(server.includes('school_teacher_selections') && server.includes('PRIMARY KEY (student_user_id, subject)'), 'one teacher selection per subject must be enforced');
assert.ok(schoolRoute.includes("method === 'GET' && path === 'teachers'") && schoolRoute.includes("method === 'PUT'"), 'teacher catalog/select API routes missing');

assert.ok(signupProfile.includes('student_academic_profiles') && signupProfile.includes('prepareSchoolAcademicProfileInsert'), 'school signup must prepare its academic profile directly');
assert.ok(auth.includes("studentStage === 'school'") && auth.includes('prepareSchoolAcademicProfileInsert'), 'school signup must persist academic identity before the first teacher-directory request');
assert.ok(auth.includes('academicProfileInsert ? [academicProfileInsert]'), 'school academic identity must be part of the signup transaction');

assert.ok(gate.includes("mode:'school-teachers'") && gate.includes('SCHOOL_DAFAT_DISABLED'), 'school accounts must be routed away from dafat');
assert.ok(gate.includes("input?.stage === 'school'"), 'new school-stage dafat must be blocked');
assert.ok(rootRoute.includes('assertSameOrigin') && nestedRoute.includes('assertSameOrigin'), 'dafaa gate routes must preserve same-origin mutation protection');
assert.ok(migration.includes('block_school_student_dafaa_insert') && migration.includes('block_school_student_dafaa_update'), 'database must block school student dafaa memberships');
assert.ok(migration.includes('block_new_school_dafat') && migration.includes('block_dafaa_stage_to_school'), 'school dafat must be retired and blocked');

console.log('school teacher flow regression tests passed');
