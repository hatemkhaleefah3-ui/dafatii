const fs = require('node:fs');
const assert = require('node:assert/strict');

const ui = fs.readFileSync('school-teacher-flow.js', 'utf8');
const css = fs.readFileSync('school-teacher-flow.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('functions/_lib/school-teachers.mjs', 'utf8');
const signupProfile = fs.readFileSync('functions/_lib/school-signup-profile.mjs', 'utf8');
const auth = fs.readFileSync('functions/_lib/auth.mjs', 'utf8');
const gate = fs.readFileSync('functions/_lib/course-gate.mjs', 'utf8');
const migration = fs.readFileSync('migrations/0005_school_teacher_system.sql', 'utf8');
const enrollmentMigration = fs.readFileSync('migrations/0006_school_students_can_join_courses.sql', 'utf8');
const courseContext = fs.readFileSync('course-context.js','utf8');
const quietShell = fs.readFileSync('quiet-shell.js','utf8');
const rootRoute = fs.readFileSync('functions/api/v1/courses.js', 'utf8');
const nestedRoute = fs.readFileSync('functions/api/v1/courses/[[path]].js', 'utf8');
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
assert.ok(index.includes('school-teacher-flow.css?v=20260918-2') && index.includes('school-teacher-flow.js?v=20260918-6'), 'school teacher behavior must be cache-busted for the school-course integration');
assert.ok(ui.includes("value === 'school-teachers'") && !ui.includes("value === 'change-course' ||"), 'teacher selection must have its own route and must not replace the real Courses page');
assert.ok(ui.includes('if(!ALLOWED.has(current) || !teacherRoute(current))return;'), 'teacher renderer must stay out of unrelated routes');
assert.ok(ui.includes("if(!teacherRoute(route()))return;"), 'teacher enhancement must be inert outside dashboard and teacher picker once the catalog is registered');
assert.ok(ui.includes("if(route()==='onboarding')return;"), 'legacy school workspace enhancer must stay inert while full-screen onboarding owns teacher selection');
assert.ok(ui.includes("if(!catalog){") && ui.includes("void load(false).then") && ui.includes("current==='change-course'") && ui.includes("active?.()?.isSchoolProgram"), 'school catalog must register the prepared course in the background even when a normal joined course is active');
assert.ok(ui.includes(".observe(appRoot,{childList:true});"), 'teacher observer must watch only top-level workspace replacements');
assert.ok(!ui.includes('subtree:true'), 'teacher observer must not watch every profile descendant mutation');
assert.ok(!ui.includes("if(!ALLOWED.has(current)){location.hash='dashboard';return;}"), 'teacher flow must not tear down the signup route after auth changes');

assert.ok(server.includes('ORDER BY a.fame_score DESC, selection_count DESC'), 'teacher directory must sort by fame and student selections');
assert.ok(server.includes('school_teacher_profiles') && server.includes('image_url') && server.includes('chapters'), 'teacher catalog must expose managed profile images and subject chapters');
assert.ok(ui.includes('teacher?.imageUrl') && ui.includes('<img src='), 'school teacher picker must render managed teacher profile images');
assert.ok(ui.includes('window.DafatiiSchoolWorkspaceReady=ready') && ui.includes('setSchoolCourse') && ui.includes('content:{subjects:nextSubjects,lectures:nextLectures}'), 'completed teacher selection must register a prepared seven-subject course');
assert.ok(ui.includes("location.hash=catalog.complete?'dashboard/Overview':'dashboard'"), 'finishing teacher selection must open the same full dashboard used by normal courses');
assert.ok(ui.includes('schoolCourseName(catalog.identity)') && ui.includes('academicField'), 'prepared school course must be named from academic level, stage and field');
const app = fs.readFileSync('app.js','utf8');
assert.ok(app.includes('schoolManagedWorkspace()') && app.includes('active?.()?.isSchoolProgram'), 'teacher-managed read-only behavior must apply only while the prepared school course is active');
assert.ok(courseContext.includes("SCHOOL_COURSE_ID = 'school-program'") && courseContext.includes('setSchoolCourse') && courseContext.includes('switchCourse'), 'prepared school course must live in the shared course switcher');
assert.ok(quietShell.includes("user?.studentStage==='school'?'school-teachers':null"), 'full workspace account navigation must retain a teacher-management entry');
assert.ok(app.includes('school-managed-card') && app.includes("managed?'':"), 'teacher-owned school subjects and lectures must be read-only in the normal workspace');
assert.ok(server.includes('academic_level = ?') && server.includes('academic_stage = ?') && server.includes('academic_field = ?'), 'teacher directory must filter academic identity');
assert.ok(server.includes('school_teacher_selections') && server.includes('PRIMARY KEY (student_user_id, subject)'), 'one teacher selection per subject must be enforced');
assert.ok(schoolRoute.includes("method === 'GET' && path === 'teachers'") && schoolRoute.includes("method === 'PUT'"), 'teacher catalog/select API routes missing');

assert.ok(signupProfile.includes('student_academic_profiles') && signupProfile.includes('prepareStudentAcademicProfileInsert'), 'signup must persist academic identity for school and higher-education students');
assert.ok(auth.includes('prepareStudentAcademicProfileInsert') && !auth.includes("studentStage === 'school' ? await prepareSchoolAcademicProfileInsert"), 'academic identity persistence must no longer be school-only');
assert.ok(auth.includes('academicProfileInsert ? [academicProfileInsert]'), 'academic identity must be part of the signup transaction');
assert.ok(ui.includes('window.DafatiiSchoolTeachers=Object.freeze'), 'onboarding must be able to refresh and register the prepared school course after teacher selection');

assert.ok(!gate.includes("mode:'school-teachers'") && !gate.includes("if (schoolStudent)"), 'school students must be allowed through the normal course list and enrollment routes');
assert.ok(gate.includes("input?.stage === 'school'"), 'creating shared school-stage courses must remain blocked because the prepared school course is student-specific');
assert.ok(rootRoute.includes('assertSameOrigin') && nestedRoute.includes('assertSameOrigin'), 'course gate routes must preserve same-origin mutation protection');
assert.ok(enrollmentMigration.includes('DROP TRIGGER IF EXISTS block_school_student_course_insert') && enrollmentMigration.includes('DROP TRIGGER IF EXISTS block_school_student_course_update'), 'database migration must allow school students to join normal courses');
assert.ok(server.includes("DROP TRIGGER IF EXISTS block_school_student_course_insert") && !server.includes("UPDATE course_memberships SET status = 'removed'"), 'runtime schema repair must stop removing school memberships');
assert.ok(migration.includes('block_new_school_courses') && migration.includes("WHERE stage = 'school' AND status = 'active'"), 'legacy shared school courses must remain retired');

console.log('school teacher flow regression tests passed');
