const fs = require('node:fs');
const assert = require('node:assert/strict');

const ui = fs.readFileSync('onboarding-flow.js','utf8');
const css = fs.readFileSync('onboarding-flow.css','utf8');
const app = fs.readFileSync('app.js','utf8');
const student = fs.readFileSync('student-account-flow.js','utf8');
const routes = fs.readFileSync('functions/_lib/course-routes.mjs','utf8');
const courses = fs.readFileSync('functions/_lib/courses.mjs','utf8');
const auth = fs.readFileSync('functions/_lib/auth.mjs','utf8');
const index = fs.readFileSync('index.html','utf8');

assert.ok(ui.includes("KEY='dafatii:onboarding:v1'") && auth.includes("'dafatii:onboarding:v1'"), 'new-account onboarding must be durable on client and server');
assert.ok(student.includes("location.hash = 'onboarding'"), 'signup must enter onboarding instead of the old pre-course/profile website');
assert.ok(ui.includes("isSchool()") && ui.includes("loadTeachers") && ui.includes("data-onboarding-teacher-next"), 'school onboarding must choose teachers first, one subject at a time');
assert.ok(ui.includes("if(isHigher()&&(record?.legacyRecovery||record?.primaryComplete))await withDeadline") && !ui.includes("try{await window.DafatiiCourses?.refresh?.();await determineView();}"), 'new school and higher-education Process 1 screens must not wait for the Courses API');
assert.ok(ui.includes("apiWithDeadline('/school/teachers'") && ui.includes("timeoutError"), 'onboarding network steps must fail visibly instead of leaving the loader indefinitely');
assert.ok(ui.includes("resolving=null") && ui.includes("if(resolving)return true") && ui.includes("finally{") && ui.includes("resolving=null;"), 'onboarding state resolution must be single-flight so repeated app events cannot restart the loader');
assert.ok(app.includes("event.detail.user?.accountType!=='student'") && app.includes("!window.DafatiiOnboarding?.blocks?.()"), 'student auth/focus/background events must not start Course refresh while onboarding owns the session');
assert.ok(ui.includes("foundationChoice") && ui.includes("data-foundation-create") && ui.includes("data-foundation-join"), 'higher-education onboarding must begin with create-or-join');
assert.ok(ui.includes('Do you want to learn new things?') && ui.includes('What do you want to learn?') && ui.includes('What is your current level in'), 'public-course recommendation must implement Q1, Q2 and Q3');
assert.ok(ui.includes("course.visibility==='public'") && ui.includes("course.learningField") && ui.includes("course.difficultyLevel===chosenLevel"), 'recommendations must be derived from admin public-course fields and chosen learner level');
assert.ok(ui.includes("LEVELS=['beginner','intermediate','advanced','expert']"), 'Q3 must expose explicit current-learning levels');
assert.ok(routes.includes("value.visibility !== 'private'") && routes.includes('PUBLIC_COURSE_ADMIN_REQUIRED'), 'non-admin students must not create public Courses');
assert.ok(routes.includes('studentAcademicIdentity') && routes.includes("value.stage = 'university'"), 'student-created private Courses must derive academic identity from signup data');
assert.ok(routes.includes("currentActor.accountType === 'student' && currentActor.studentStage === 'university'"), 'school students and representers must not create Courses');
assert.ok(courses.includes('academic_level') && courses.includes('academic_stage') && courses.includes('academic_field') && courses.includes('learning_field') && courses.includes('difficulty_level'), 'Course DTO/schema must expose academic and recommendation dimensions');
assert.ok(!app.includes('preCourseWorkspace') && !app.includes('PRE_COURSE_ROUTES'), 'old pre-course website must be absent from the active renderer');
assert.ok(index.includes('onboarding-flow.js?v=20260918-4') && index.includes('onboarding-flow.css?v=20260918-1') && !index.includes('pre-course.css'), 'only the new full-screen onboarding assets should be active');
assert.ok(css.includes('.onboarding-page') && css.includes('.onboarding-card'), 'onboarding must use a dedicated full-screen process UI');

console.log('sequential onboarding regression tests passed');
