import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const recovery = readFileSync('functions/_lib/password-recovery.mjs','utf8');
const routes = readFileSync('functions/api/v1/[[path]].js','utf8');
const migration = readFileSync('migrations/0004_password_recovery.sql','utf8');
const app = readFileSync('app.js','utf8');
const index = readFileSync('index.html','utf8');
const { validateStrongPassword } = await import('../functions/_lib/auth.mjs');

assert.throws(()=>validateStrongPassword('short',true),error=>error.code==='INVALID_CREDENTIALS');
assert.throws(()=>validateStrongPassword('abcdefghijkl',true),error=>error.code==='WEAK_PASSWORD');
assert.doesNotThrow(()=>validateStrongPassword('Correct-Horse-42',true));
assert.match(recovery,/RESET_LIFETIME_MS = 30 \* 60 \* 1000/,'reset links must expire after 30 minutes');
assert.match(recovery,/tokenHash = await sha256\(token\)/,'raw reset tokens must never be stored');
assert.match(recovery,/used_at IS NULL AND expires_at > \?/,'reset tokens must be unused and unexpired');
assert.match(recovery,/UPDATE sessions SET revoked_at/,'password reset must revoke existing sessions');
assert.match(recovery,/Number\(recent\?\.count \|\| 0\) >= 3/,'recovery email requests must be capped per account');
assert.match(recovery,/https:\/\/api\.resend\.com\/emails/,'email delivery must use the configured provider API');
assert.doesNotMatch(recovery,/['"]2005['"]|ADMIN_ACCESS_PIN/,'recovery must not embed an administrator credential');
assert.match(routes,/auth\/password-recovery\/request/);
assert.match(routes,/auth\/password-recovery\/reset/);
assert.match(migration,/token_hash TEXT NOT NULL UNIQUE/);
assert.match(app,/id="password-recovery-toggle"/);
assert.match(app,/r\.startsWith\('reset-password\/'\)/);
assert.match(index,/styles\.css\?v=20260920-6/);
assert.match(index,/app\.js\?v=20260920-6/);

console.log('password recovery tests passed');
