const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const featureFiles = ['app.js', 'academic.js', 'calendar.js', 'student-suite.js', 'advanced-chat.js', 'study-room-workspace.js'];
for (const file of featureFiles) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /fetch\s*\(\s*['"`]\/api\//, `${file} must not call backend endpoints directly`);
  assert.doesNotMatch(source, /GCS_|storage\.googleapis\.com|cloudflare/i, `${file} must stay provider-independent`);
}
for (const file of fs.readdirSync('.').filter(name => name.endsWith('.js'))) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /-----BEGIN PRIVATE KEY-----|private_key_id|GCS_PRIVATE_KEY\s*=/, `${file} contains a secret-like value`);
}
const adapter = fs.readFileSync('backend-adapter.js', 'utf8');
assert.match(adapter, /baseRevision/);
assert.match(adapter, /mutationId/);
assert.match(adapter, /status === 409/);
const router = fs.readFileSync(path.join('functions', 'api', 'v1', '[[path]].js'), 'utf8');
assert.match(router, /WHERE id = \? AND user_id = \?/);
assert.match(router, /INSERT OR IGNORE INTO records/);
assert.match(router, /status = 'available'/);
console.log('static boundary tests passed');

