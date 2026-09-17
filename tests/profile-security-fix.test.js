const fs = require('node:fs');
const assert = require('node:assert/strict');

const ui = fs.readFileSync('profile-security-fix.js', 'utf8');
const css = fs.readFileSync('profile-security-fix.css', 'utf8');
const route = fs.readFileSync('functions/api/v1/auth/reveal-pin.js', 'utf8');
const secret = fs.readFileSync('functions/_lib/student-pin-secret.mjs', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.ok(css.includes('.student-profile-v2{padding-top:30px!important}'), 'mobile profile must clear the sticky top bar');
assert.ok(ui.includes("'/auth/reveal-pin'") && ui.includes("body:{ password:input.value }"), 'PIN reveal must require a password-confirmation request');
assert.ok(ui.includes("sessionStorage.removeItem(INITIAL_PIN_KEY)"), 'legacy plaintext session PIN must be removed');
assert.ok(ui.includes('setTimeout(() => maskPin(root), 30000)'), 'revealed PIN must auto-hide');
assert.ok(route.includes('requireUser(context)') && route.includes('enforceAuthRateLimit'), 'PIN reveal endpoint must require a session and rate limiting');
assert.ok(secret.includes("verifyPassword") && secret.includes("AES-GCM"), 'PIN reveal must verify password and keep the recoverable PIN encrypted server-side');
assert.ok(secret.includes("UPDATE student_credentials SET pin_hash"), 'legacy hash-only PINs must rotate securely on first reveal');
assert.ok(index.includes('profile-security-fix.css?v=20260917-1') && index.includes('profile-security-fix.js?v=20260917-1'), 'profile security assets must be loaded');

console.log('profile security regression tests passed');
