const fs = require('node:fs');
const assert = require('node:assert/strict');

const ui = fs.readFileSync('student-account-flow.js', 'utf8');
const css = fs.readFileSync('student-account-flow.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const server = fs.readFileSync('functions/_lib/student-identity.mjs', 'utf8');
const migration = fs.readFileSync('migrations/0003_student_credentials.sql', 'utf8');

for (const token of ['primary_school','middle_school','preparatory_school','institute','college','primary_studies','postgraduate_studies']) assert.ok(ui.includes(token), `missing level ${token}`);
for (const token of ['scientific','literary','medical','technical','mechanical','electrical','chemical','petroleum','engineering','sciences','education']) assert.ok(ui.includes(token), `missing field ${token}`);
assert.ok(ui.includes('signupStep = 1') && ui.includes('signupStep += 1') && ui.includes('signupStep - 1'), 'signup must be a forward/backward stepper');
assert.ok(ui.includes("const profile = { ...signupDraft, studentId, accountType:'student', createdAt:Date.now() };"), 'synced profile must exclude the PIN');
assert.ok(ui.includes('sessionStorage.setItem(INITIAL_PIN_KEY, pin)'), 'initial PIN must stay session-scoped');
assert.ok(ui.includes("card.classList.toggle('flipped')"), 'student card must flip on click');
assert.ok(css.includes('.student-id-card.flipped .student-card-inner') && css.includes('rotateY(180deg)'), 'card flip styles missing');
assert.ok(index.includes('student-account-flow.css?v=20260917-1') && index.includes('student-account-flow.js?v=20260918-1'), 'account flow assets must be loaded');
assert.match(app, /name="\$\{isSignup\?'email':'identifier'\}"/, 'sign-in must accept email, phone, or student ID');
assert.match(app, /minlength="\$\{isSignup\?12:4\}"/, 'four-digit PIN sign-in must not be blocked by native validation');
assert.match(app, /DafatiiAuth\.login\(\{identifier,credential\}\)/, 'the browser must pass the generic identifier to the auth client');
assert.doesNotMatch(app, /admin-pin-panel|admin-access-toggle|ADMIN_ACCESS_EMAIL/, 'the fallback form must not render an administrator PIN section');
assert.ok(ui.includes("ONBOARDING_KEY = 'dafatii:onboarding:v1'") && ui.includes("location.hash = 'onboarding'"), 'new signups must enter the sequential onboarding flow before the workspace');
assert.ok(server.includes('student_credentials') && server.includes('validateStudentSignup') && server.includes('verifyStudentPin'), 'student identity server module incomplete');
assert.doesNotMatch(ui, /administratorEmail|adminSignInHint/, 'the active sign-in flow must not redirect administrators to a PIN section');
assert.ok(ui.includes("DafatiiAuth.login({ identifier, credential })"), 'student sign-in must preserve generic identifier support');
assert.ok(migration.includes('student_id TEXT NOT NULL UNIQUE') && migration.includes('pin_hash TEXT NOT NULL'), 'credential migration must keep ID unique and PIN hashed');

console.log('student account flow regression tests passed');
