const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const featureFiles = ['app.js', 'academic.js', 'calendar.js', 'student-suite.js', 'advanced-chat.js', 'study-room-workspace.js', 'course-context.js', 'course-ui.js'];
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
assert.match(fs.readFileSync('index.html', 'utf8'), /rel="icon" type="image\/svg\+xml"/);
assert.match(fs.readFileSync('index.html', 'utf8'), /course-context\.js/);
assert.match(fs.readFileSync('index.html', 'utf8'), /course-ui\.js/);
const index = fs.readFileSync('index.html', 'utf8');
assert.match(index, /quiet-design\.css\?v=3/, 'the consolidated presentation layer must be loaded');
assert.match(index, /quiet-shell\.js\?v=3/, 'the consolidated responsive shell must be loaded');
assert.match(index, /translation-client\.js\?v=1/, 'the authenticated interface translator must be loaded');
assert.doesNotMatch(index, /premium-theme\.css|premium-shell\.js|navigation-layout(?:-fix)?\.css/, 'retired presentation layers must not be loaded');
const quietShell = fs.readFileSync('quiet-shell.js', 'utf8');
assert.match(quietShell, /data-quiet-menu/, 'the responsive sidebar needs an access button');
assert.match(quietShell, /data-quiet-language/, 'the active shell needs an in-place language switch');
assert.match(quietShell, /applyInterfaceLanguage\(next\)/, 'language switching must use the canonical language preference');
assert.match(quietShell, /data-quiet-courses/, 'the course access button must open a course popover');
assert.match(quietShell, /quiet-profile-popover/, 'the profile button must open a profile summary');
const app = fs.readFileSync('app.js', 'utf8');
assert.doesNotMatch(app, /authOffline \? 'disabled'/, 'a failed startup check must not disable authentication');
assert.match(app, /dataset\.submitting/, 'authentication errors must survive availability events');
assert.match(app, /PRE_COURSE_ROUTES/, 'users without an active course need the limited navigation shell');
assert.match(app, /pending','payment_pending/, 'pending enrollments must remain outside the full course workspace');
assert.match(app, /readString\('dafatii:interface-language'\)==='en'\?'en':'ar'/, 'Arabic must be the default interface language');
assert.match(app, /data-landing-section="about"/, 'the landing navigation must expose About us');
assert.match(app, /data-landing-section="contact"/, 'the landing navigation must expose Contact us');
console.log('static boundary tests passed');
