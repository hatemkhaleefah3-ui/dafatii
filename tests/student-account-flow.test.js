const fs = require('node:fs');
const assert = require('node:assert/strict');

const ui = fs.readFileSync('student-account-flow.js', 'utf8');
const css = fs.readFileSync('student-account-flow.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('functions/_lib/student-identity.mjs', 'utf8');
const migration = fs.readFileSync('migrations/0003_student_credentials.sql', 'utf8');

for (const token of ['primary_school','middle_school','preparatory_school','institute','college','primary_studies','postgraduate_studies']) assert.ok(ui.includes(token), `missing level ${token}`);
for (const token of ['scientific','literary','medical','technical','mechanical','electrical','chemical','petroleum','engineering','sciences','education']) assert.ok(ui.includes(token), `missing field ${token}`);
assert.ok(ui.includes('signupStep = 1') && ui.includes('signupStep += 1') && ui.includes('signupStep - 1'), 'signup must be a forward/backward stepper');
assert.ok(ui.includes("const profile = { ...signupDraft, studentId, accountType:'student', createdAt:Date.now() };"), 'synced profile must exclude the PIN');
assert.ok(ui.includes('sessionStorage.setItem(INITIAL_PIN_KEY, pin)'), 'initial PIN must stay session-scoped');
assert.ok(ui.includes("card.classList.toggle('flipped')"), 'student card must flip on click');
assert.ok(css.includes('.student-id-card.flipped .student-card-inner') && css.includes('rotateY(180deg)'), 'card flip styles missing');
assert.ok(css.includes('.student-flow-field input[type="date"]') && css.includes('min-width:0') && css.includes('-webkit-min-logical-width:0'), 'birth date input must allow WebKit to shrink to the field width');
assert.ok(css.includes('@supports (-webkit-touch-callout:none)') && css.includes('width:calc(100% - 28px)') && css.includes('max-width:calc(100% - 28px)'), 'iOS date input must compensate for WebKit adding the 14px horizontal padding outside width:100%');
assert.ok(index.includes('student-account-flow.css?v=20260919-3') && index.includes('student-account-flow.js?v=20260919-2'), 'account flow assets must be loaded');
assert.ok(ui.includes("ONBOARDING_KEY = 'dafatii:onboarding:v1'") && ui.includes("location.hash = 'onboarding'"), 'new signups must enter the sequential onboarding flow before the workspace');
assert.ok(server.includes('student_credentials') && server.includes('validateStudentSignup') && server.includes('verifyStudentPin'), 'student identity server module incomplete');
assert.ok(ui.includes("field('birthDate'") && ui.includes('autocomplete="bday"'), 'step 1 must collect birth date below the full name');
assert.ok(ui.includes("field('country'") && ui.includes("field('city'") && ui.includes("field('town'"), 'step 2 must collect country, city and town');
assert.ok(ui.includes('/ 5') && ui.includes('[1,2,3,4,5]') && ui.includes('signupStep < 5'), 'signup must use five steps after adding the location step');
assert.ok(ui.includes('if (signupStep === 3)') && ui.includes('signupDraft.academicLevel'), 'academic identity must move to step 3');
assert.ok(server.includes("INVALID_LOCATION") && server.includes('country, city, town'), 'server must validate the required signup location');
assert.ok(!server.includes("if (!text) return '';"), 'birth date must remain required at the server boundary');
assert.ok(migration.includes('student_id TEXT NOT NULL UNIQUE') && migration.includes('pin_hash TEXT NOT NULL'), 'credential migration must keep ID unique and PIN hashed');

console.log('student account flow regression tests passed');
