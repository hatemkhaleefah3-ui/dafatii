const fs = require('node:fs');
const assert = require('node:assert/strict');

const admin = fs.readFileSync('admin-console.js','utf8');
const adminCss = fs.readFileSync('admin-console.css','utf8');
const backend = fs.readFileSync('functions/_lib/admin-console.mjs','utf8');
const schoolTeachers = fs.readFileSync('functions/_lib/school-teachers.mjs','utf8');
const courseRoutes = fs.readFileSync('functions/_lib/course-routes.mjs','utf8');
const courseUi = fs.readFileSync('course-ui.js','utf8');
const courseContext = fs.readFileSync('course-context.js','utf8');
const social = fs.readFileSync('student-social.js','utf8');
const app = fs.readFileSync('app.js','utf8');
const roles = fs.readFileSync('role-panels.js','utf8');
const index = fs.readFileSync('index.html','utf8');
const api = fs.readFileSync('functions/api/v1/[[path]].js','utf8');
const schoolRoute = fs.readFileSync('functions/api/v1/school/[[path]].js','utf8');
const fileClient = fs.readFileSync('file-client.js','utf8');

for (const tab of ["['overview'","['students'","['teachers'","['courses'","['study-rooms'"]) {
  assert.ok(admin.includes(tab), `missing Admin Console tab: ${tab}`);
}
assert.ok(adminCss.includes('grid-template-columns:repeat(5,1fr)') && adminCss.includes('border-top:1px solid var(--line)') && adminCss.includes('inset 0 3px 0 var(--accent)'), 'Admin Console bottom nav must mirror the main product navigation style');
assert.ok(adminCss.includes('.admin-console-active .main-nav') && adminCss.includes('.admin-console-active .bottom-nav') && adminCss.includes('display:none!important'), 'all normal website navigation bars must be hidden while Admin Console is open');
assert.ok(adminCss.includes('width:min(calc(100% - 24px),440px)') && adminCss.includes('border-radius:30px') && adminCss.includes('background:var(--nav-cover)'), 'Admin bottom nav must use the same floating dock geometry and material as the website main nav');
assert.ok(admin.includes('data-student-access') && admin.includes('data-student-status') && admin.includes('data-student-delete'), 'students need account access, remove/restore, and delete controls');
assert.ok(admin.includes('data-teacher-status') && admin.includes('data-teacher-delete'), 'teachers need distinct remove/restore and permanent delete controls');
assert.ok(schoolTeachers.includes("status TEXT NOT NULL DEFAULT 'active'") && backend.includes("['active','removed']"), 'teacher removal must preserve the profile as an unpublished state');
assert.ok(admin.includes("id=\"admin-add-student\"") && backend.includes("path==='admin/users'") && backend.includes("method==='POST'"), 'admins need a real add-student path');
const addStudentFlow = admin.slice(admin.indexOf('function openAddStudent'), admin.indexOf('function emptyTeacherDraft'));
assert.ok(addStudentFlow.includes("e.currentTarget.querySelector('button[type=\"submit\"]').disabled=true") && addStudentFlow.includes('data.loaded=false;') && !addStudentFlow.includes('await load(true)'), 'one-time Student ID/PIN must remain visible after admin account creation');
assert.ok(admin.includes('Passwords and PINs remain secret') || admin.includes('كلمات المرور وPIN تبقى سرية'), 'Admin Console must not expose reusable credentials');

for (const marker of ['school_teacher_profiles','content_json','subjects','chapters','lectures','image_url']) {
  assert.ok(backend.includes(marker), `teacher backend missing ${marker}`);
}
assert.ok(backend.includes("subjects.length!==1"), 'backend must enforce exactly one subject per teacher');
assert.ok(admin.includes('id="admin-teacher-subject"') && !admin.includes('teacher-add-subject'), 'teacher profile form must select exactly one subject');
assert.ok(admin.includes('admin-teacher-image-file') && admin.includes('validateTeacherPicture'), 'teacher profile form must accept a profile picture');
assert.ok(!admin.includes('220*1024') && !admin.includes('FileReader'), 'teacher profile pictures must not have the old client-side size cap or be encoded into D1 payloads');
assert.ok(admin.includes("purpose:'teacher-profile'") && admin.includes('DafatiiFiles.upload'), 'teacher profile pictures must use the file upload pipeline');
assert.ok(fileClient.includes('purpose: options.purpose || null'), 'file client must forward upload purpose');
assert.ok(api.includes("teacherProfile ? validateTeacherProfileUpload(raw) : validateUpload(raw, context.env)") && api.includes('const driveUpload = teacherProfile || chatAttachment || usesDrive(context.env)'), 'teacher profile uploads must bypass Dafatii byte quota checks and force Google Drive storage');
assert.ok(api.includes('ADMIN_REQUIRED') && api.includes('TEACHER_IMAGE_TYPES'), 'teacher profile upload path must stay admin-only and image-only');
assert.ok(backend.includes('imageFileId') && backend.includes('/api/v1/school/teacher-images/'), 'teacher profiles must store a website image route backed by an uploaded file');
assert.ok(schoolRoute.includes('teacher-images') && schoolRoute.includes('streamDriveFile'), 'website must stream teacher profile pictures from Google Drive');
for (const marker of ['data-content-add-chapter','data-content-add-lecture','data-content-import','XLSX.read','sheet_to_json','YouTube video link']) {
  assert.ok(admin.includes(marker), `teacher content page missing ${marker}`);
}
assert.ok(admin.includes("location.hash=`admin/teachers/${encodeURIComponent(button.dataset.teacherOpen)}`"), 'clicking a teacher card must open the teacher content page');
assert.ok(backend.includes('@internal.dafatii.invalid') && backend.includes('managedPasswordHash'), 'admin-created teachers must not require a registered teacher login');
assert.ok(backend.includes("path==='admin/teachers'") && backend.includes("path==='admin/study-rooms'"), 'teacher and Study Room admin APIs must be server-backed');

assert.ok(courseRoutes.includes("currentActor.accountType === 'student' && currentActor.studentStage === 'university'"), 'only higher-education students may create Courses');
assert.ok(courseRoutes.includes("SCHOOL_STUDENT_COURSES_DISABLED") && courseRoutes.includes("School student accounts cannot own Courses."), 'admins must not be able to assign Course ownership to school students');
assert.ok(courseUi.includes("actor?.accountType==='student'&&actor?.studentStage==='university'"), 'Course creation UI must match server permission');
assert.ok(!courseUi.includes("actor?.accountType==='representer'"), 'representers must not be able to create Courses');
assert.ok(courseUi.includes("value=\"private\"") && courseUi.includes('academic level, stage and field are locked'), 'higher-education student Course creation must be private and identity-locked');
assert.ok(courseRoutes.includes('PUBLIC_COURSE_ADMIN_REQUIRED') && courseRoutes.includes("value.visibility !== 'private'"), 'only administrators may create public Courses');
assert.ok(!courseUi.includes('<option value="school">School</option>'), 'Course creation must not offer a school stage');

assert.ok(courseContext.includes("GLOBAL_USER_KEYS") && courseContext.includes("'dafatii:studyRoomState:v1'") && courseContext.includes("'dafatii:studyRoomWorkspace:v1'"), 'Study Rooms must be user-scoped rather than Course-scoped');
assert.ok(social.includes('window.DafatiiStudyRooms = Object.freeze'), 'Study Room UI must be reusable by students without an active Course');
assert.ok(!app.includes('preCourseWorkspace') && app.includes('DafatiiOnboarding?.blocks'), 'the obsolete pre-Course website must be replaced by the sequential onboarding gate');
assert.ok(roles.includes("page==='admin'&&!window.__dafatiiAdminConsoleInstalled"), 'legacy Admin renderer must stay disabled when the new console owns the route');

assert.ok(index.includes('admin-console.css?v=20260918-3'), 'Admin Console stylesheet must be loaded');
assert.ok(index.includes('admin-console.js?v=20260918-4'), 'Admin Console script must be loaded');
assert.ok(index.indexOf('admin-console.js?v=20260918-4') > index.indexOf('premium-workspace.js'), 'Admin Console must load after the premium workspace enhancer');
assert.ok(index.includes('file-client.js?v=20260918-3'), 'Drive-backed teacher image upload client must be cache-busted');

console.log('admin console and student creation regression tests passed');
