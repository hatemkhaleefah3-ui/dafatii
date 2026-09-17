const fs = require('node:fs');
const assert = require('node:assert/strict');

const admin = fs.readFileSync('admin-console.js','utf8');
const adminCss = fs.readFileSync('admin-console.css','utf8');
const backend = fs.readFileSync('functions/_lib/admin-console.mjs','utf8');
const courseRoutes = fs.readFileSync('functions/_lib/course-routes.mjs','utf8');
const courseUi = fs.readFileSync('course-ui.js','utf8');
const courseContext = fs.readFileSync('course-context.js','utf8');
const social = fs.readFileSync('student-social.js','utf8');
const app = fs.readFileSync('app.js','utf8');
const roles = fs.readFileSync('role-panels.js','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const tab of ["['overview'","['students'","['teachers'","['courses'","['study-rooms'"]) {
  assert.ok(admin.includes(tab), `missing Admin Console tab: ${tab}`);
}
assert.ok(adminCss.includes('grid-template-columns:repeat(5,1fr)'), 'Admin Console needs its own five-item bottom nav');
assert.ok(adminCss.includes('.admin-console-active .main-nav') && adminCss.includes('display:none!important'), 'normal main nav must be hidden while Admin Console is open');
assert.ok(admin.includes('data-student-access') && admin.includes('data-student-status') && admin.includes('data-student-delete'), 'students need account access, remove/restore, and delete controls');
assert.ok(admin.includes("id=\"admin-add-student\"") && backend.includes("path==='admin/users'") && backend.includes("method==='POST'"), 'admins need a real add-student path');
assert.ok(admin.includes('Passwords and PINs remain secret') || admin.includes('كلمات المرور وPIN تبقى سرية'), 'Admin Console must not expose reusable credentials');

for (const marker of ['school_teacher_profiles','content_json','subjects','chapters','lectures','image_url']) {
  assert.ok(backend.includes(marker), `teacher backend missing ${marker}`);
}
for (const marker of ['teacher-editor-subjects','teacher-editor-chapters','teacher-editor-lectures','data-add-chapter','data-add-lecture']) {
  assert.ok(admin.includes(marker), `teacher editor missing ${marker}`);
}
assert.ok(backend.includes("path==='admin/teachers'") && backend.includes("path==='admin/study-rooms'"), 'teacher and Study Room admin APIs must be server-backed');

assert.ok(courseRoutes.includes("currentActor.accountType === 'student' && currentActor.studentStage === 'university'"), 'only higher-education students may create Courses');
assert.ok(courseUi.includes("actor?.accountType==='student'&&actor?.studentStage==='university'"), 'Course creation UI must match server permission');
assert.ok(!courseUi.includes('<option value="school">School</option>'), 'Course creation must not offer a school stage');

assert.ok(courseContext.includes("GLOBAL_USER_KEYS") && courseContext.includes("'dafatii:studyRoomState:v1'") && courseContext.includes("'dafatii:studyRoomWorkspace:v1'"), 'Study Rooms must be user-scoped rather than Course-scoped');
assert.ok(social.includes('window.DafatiiStudyRooms = Object.freeze'), 'Study Room UI must be reusable by students without an active Course');
assert.ok(app.includes("'study-rooms'") && app.includes('window.DafatiiStudyRooms.view'), 'pre-Course/school shell must expose Study Rooms');
assert.ok(roles.includes("page==='admin'&&!window.__dafatiiAdminConsoleInstalled"), 'legacy Admin renderer must stay disabled when the new console owns the route');

assert.ok(index.includes('admin-console.css?v=20260918-1'), 'Admin Console stylesheet must be loaded');
assert.ok(index.includes('admin-console.js?v=20260918-1'), 'Admin Console script must be loaded');
assert.ok(index.indexOf('admin-console.js?v=20260918-1') > index.indexOf('premium-workspace.js'), 'Admin Console must load after the premium workspace enhancer');

console.log('admin console and student creation regression tests passed');
