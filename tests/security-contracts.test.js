const assert = require('node:assert/strict');
const fs = require('node:fs');

const route = fs.readFileSync('functions/api/v1/[[path]].js','utf8');
const auth = fs.readFileSync('functions/_lib/auth.js','utf8');
const gcs = fs.readFileSync('functions/_lib/gcs.js','utf8');
const migration = fs.readFileSync('migrations/0001_backend.sql','utf8');
const index = fs.readFileSync('index.html','utf8');
const files = fs.readFileSync('file-client.js','utf8');
const adapter = fs.readFileSync('backend-adapter.js','utf8');

assert.match(auth, /HttpOnly; Secure; SameSite=Strict/);
assert.match(auth, /sha256\(token\)/);
assert.doesNotMatch(auth, /password[^\n]*console|console[^\n]*password/i);
assert.match(route, /getOwnedFile\(env,user\.id,fileId/);
assert.match(route, /users\/\$\{user\.id\}\/\$\{id\}\/object/);
assert.match(route, /file_type_rejected/);
assert.match(route, /file_too_large/);
assert.match(route, /revision_conflict/);
assert.match(route, /mutationId/);
assert.match(route, /object\.fileId !== file\.id/);
assert.match(route, /file\.status === 'available'.*duplicate:true/s);
assert.match(gcs, /MAX_SIGNED_SECONDS = 900/);
assert.match(gcs, /RSASSA-PKCS1-v1_5/);
assert.match(gcs, /encodeURIComponent/);
assert.match(gcs, /split\('\/'\)\.map\(pct\)/);
assert.match(migration, /FOREIGN KEY|REFERENCES users/);
assert.match(migration, /PRIMARY KEY\(user_id, record_key\)/);
assert.match(migration, /UNIQUE\(user_id, mutation_id\)/);
assert.match(index, /backend-adapter\.js/);
assert.match(index, /file-client\.js/);
assert.match(files, /window\.DafatiiFiles/);
assert.match(adapter, /window\.DafatiiDataRemote/);
for (const browserFile of ['app.js','academic.js','calendar.js','student-suite.js','advanced-chat.js']) {
  const source=fs.readFileSync(browserFile,'utf8');
  assert.doesNotMatch(source,/fetch\(\s*['"`]\/api\//,`${browserFile} must not couple directly to API routes`);
}
for (const file of fs.readdirSync('.').filter(name=>name.endsWith('.js'))) {
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(source,/BEGIN PRIVATE KEY-----\\n(?!REPLACE_ME)/,`secret-like key in ${file}`);
}
console.log('security contract tests passed');
