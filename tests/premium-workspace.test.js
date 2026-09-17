const fs = require('node:fs');
const assert = require('node:assert/strict');

const js = fs.readFileSync('premium-workspace.js','utf8');
const css = fs.readFileSync('premium-workspace.css','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const marker of ['premium-subject-card','premium-subject-detail','premium-role-panel','premium-management-summary','premium-select-field']) {
  assert.ok(js.includes(marker), `premium enhancer missing ${marker}`);
}
for (const marker of ['.subject-page-hero','.premium-subject-card','.premium-lecture-card','.premium-panel-hero','.premium-panel-card','.premium-admin-user']) {
  assert.ok(css.includes(marker), `premium stylesheet missing ${marker}`);
}
assert.ok(js.includes('previousWorkspace(current);') && js.includes('queueMicrotask(enhance)'), 'premium layer must enhance after the existing workspace renders and binds');
assert.ok(!js.includes('app.innerHTML'), 'premium layer must not replace the application shell or destroy existing event bindings');
assert.ok(js.includes("location.hash.replace(/^#\\/?/, '').split('/')"), 'premium panel enhancement must remain route-scoped');
assert.ok(index.includes('premium-workspace.css?v=20260917-1'), 'premium workspace stylesheet must be loaded');
assert.ok(index.includes('premium-workspace.js?v=20260917-1'), 'premium workspace enhancer must be loaded');
assert.ok(index.indexOf('premium-workspace.css?v=20260917-1') > index.indexOf('study-structure.css'), 'premium subject styles must load after study structure styles');
assert.ok(index.indexOf('premium-workspace.js?v=20260917-1') > index.indexOf('study-structure.js'), 'premium enhancer must load after study structure behavior');

console.log('premium workspace redesign tests passed');
