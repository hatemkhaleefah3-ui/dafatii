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
assert.ok(index.includes('student-account-flow.css?v=20260917-1') && index.includes('student-account-flow.js?v=20260919-1'), 'account flow assets must be loaded');
assert.ok(ui.includes("ONBOARDING_KEY = 'dafatii:onboarding:v1'") && ui.includes("location.hash = 'onboarding'"), 'new signups must enter the sequential onboarding flow before the workspace');
assert.ok(server.includes('student_credentials') && server.includes('validateStudentSignup') && server.includes('verifyStudentPin'), 'student identity server module incomplete');
assert.ok(!ui.includes("field('birthDate'"), 'student signup must not ask for birth date');
assert.ok(server.includes("if (!text) return '';"), 'server must accept omitted birth date for the revised signup flow');
assert.ok(migration.includes('student_id TEXT NOT NULL UNIQUE') && migration.includes('pin_hash TEXT NOT NULL'), 'credential migration must keep ID unique and PIN hashed');

console.log('student account flow regression tests passed');
