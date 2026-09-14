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
assert.match(index, /quiet-design\.css\?v=16/, 'the consolidated presentation layer must be loaded');
assert.match(index, /device-layout\.js\?v=2/, 'device-aware navigation classification must load before rendering');
assert.match(index, /icon-system\.js\?v=2/, 'the unified icon system must load before the interface');
assert.match(index, /card-swipe\.js\?v=1/, 'the safe card gesture controller must be loaded');
assert.match(index, /quiet-shell\.js\?v=6/, 'the consolidated responsive shell must be loaded');
assert.match(index, /translation-client\.js\?v=1/, 'the authenticated interface translator must be loaded');
assert.doesNotMatch(index, /premium-theme\.css|premium-shell\.js|navigation-layout(?:-fix)?\.css/, 'retired presentation layers must not be loaded');
const quietShell = fs.readFileSync('quiet-shell.js', 'utf8');
const quietDesign = fs.readFileSync('quiet-design.css', 'utf8');
assert.doesNotMatch(quietDesign, /Unified interaction system v8/, 'late override layers must not be appended to the canonical stylesheet');
assert.match(quietDesign, /@media\(max-width:767px\).*\.landing-nav-tabs\{position:fixed;inset:auto 10px/s, 'mobile landing navigation must be fixed to the bottom');
assert.match(quietDesign, /@media\(min-width:768px\) and \(max-width:1199px\).*\.landing-nav\{position:fixed;inset-block:0;inset-inline-start:0/s, 'tablet landing navigation must use a side rail');
assert.match(quietDesign, /\.landing-nav\{position:sticky;top:0/s, 'desktop landing navigation must remain above the page');
assert.match(quietDesign, /html\[data-device=mobile\] \.landing-nav-tabs\{position:fixed;inset:auto 10px/s, 'phone user agents must force the bottom landing navigation');
assert.match(quietDesign, /html\[data-device=tablet\] \.landing-nav\{position:fixed;inset-block:0/s, 'tablet user agents must force the side landing navigation');
assert.match(quietDesign, /@media\(max-width:1100px\) and \(max-aspect-ratio:5\/8\).*\.landing-nav-tabs\{position:fixed;inset:auto 10px/s, 'tall privacy-restricted phone containers need a CSS-only bottom-nav fallback');
assert.ok(
  quietDesign.lastIndexOf('@media(max-width:1100px) and (max-aspect-ratio:5/8)') > quietDesign.indexOf('.landing-nav{position:sticky;top:0'),
  'the phone-shaped viewport fallback must come after the desktop navigation rule'
);
assert.match(quietDesign, /html\[data-device=mobile\] \.landing-nav\{[^}]*backdrop-filter:none;[^}]*contain:none\}/, 'mobile landing header must not create a fixed-position containing block');
assert.match(quietShell, /data-quiet-menu/, 'the responsive sidebar needs an access button');
assert.match(quietShell, /class="quiet-brand"/, 'the Dafatii logo must remain in the sidebar');
assert.doesNotMatch(quietShell, /quiet-toolbar-brand/, 'the main navigation header must not contain a website logo');
assert.doesNotMatch(quietDesign, /quiet-toolbar-brand/, 'retired top-bar logo styling must stay removed');
assert.doesNotMatch(quietDesign, /\.quiet-tabs/, 'the inherited bottom navigation implementation must be removed');
assert.match(quietShell, /const bottomNavItem =/, 'the bottom navigation must use dedicated markup');
assert.match(quietShell, /class="bottom-nav-item/, 'the bottom navigation must not reuse sidebar links');
assert.match(quietDesign, /\.quiet-toolbar\{position:fixed;top:10px;[^}]*border-radius:20px/, 'desktop main navigation must use a rounded fixed surface');
assert.match(quietDesign, /\.bottom-nav\{position:fixed;left:50%;[^}]*width:min\(calc\(100% - 24px\),440px\);height:64px/, 'authenticated mobile navigation must use the replacement floating dock');
assert.match(quietDesign, /@keyframes bottom-nav-arrive/, 'the replacement bottom navigation needs deliberate selection motion');
assert.match(quietDesign, /\.bottom-nav-item\.is-active \.bottom-nav-icon/, 'the active state must be scoped to the replacement component');
assert.match(quietDesign, /body \.quiet-workspace>\.sub-nav\{position:relative!important;top:auto!important;[^}]*margin:82px 0 0 232px!important/, 'desktop and tablet sub-navigation must remain at the top of the page flow');
assert.match(quietDesign, /body \.quiet-workspace>\.sub-nav\{margin:72px 10px 0!important;position:relative!important;top:auto!important/, 'mobile sub-navigation must scroll away with the page');
assert.doesNotMatch(quietDesign, /\.sub-nav \+ \.workspace-main/, 'flow-positioned sub-navigation must not leave fixed-bar compensation space');
assert.match(quietDesign, /\.quiet-toolbar\{position:fixed;top:10px;/, 'desktop main navigation must be fixed to the viewport');
assert.match(quietDesign, /\.quiet-toolbar\{position:fixed;top:8px;inset-inline:10px;/, 'mobile main navigation must be fixed to the viewport');
assert.match(quietDesign, /\.bottom-nav-item:not\(\.is-active\):hover \.bottom-nav-icon/, 'replacement navigation icons need an interactive hover state');
const iconSystem = fs.readFileSync('icon-system.js', 'utf8');
for (const icon of ['nav-home','nav-library','nav-calendar','nav-community','nav-messages']) assert.match(iconSystem, new RegExp(`['"]${icon}['"]`), `${icon} must exist`);
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
