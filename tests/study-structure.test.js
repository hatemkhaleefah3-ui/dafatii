const fs = require('node:fs');
const assert = require('node:assert/strict');

const js = fs.readFileSync('study-structure.js','utf8');
const css = fs.readFileSync('study-structure.css','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const type of ['chapters','systems','blocks','dafat']) {
  assert.ok(js.includes(`${type}:`) || js.includes(`'${type}'`) || js.includes(`\"${type}\"`), `missing study type: ${type}`);
}
assert.ok(js.includes("SCHOOL_LEVELS") && js.includes("value=\"chapters\""), 'school accounts must be fixed to chapters');
assert.ok(js.includes('select name="studyType" required'), 'higher-education signup must require study type selection');
assert.ok(js.includes("return STUDY_TYPES[profile.studyType] ? profile.studyType : 'dafat';"), 'existing higher-education accounts must retain a dafat fallback');
assert.ok(js.includes('studyUnits') && js.includes('activeStudyUnitId'), 'subjects must carry study units and an active unit');
assert.ok(js.includes('lecture.studyUnitId') && js.includes('lectures.filter'), 'subject content must be scoped to the selected study unit');
assert.ok(js.includes('data-study-unit-select') && js.includes('data-study-unit-detail-select'), 'subject cards and subject detail need unit selectors');
assert.ok(js.includes('study-unit-rows') && js.includes('data-remove-study-unit') && js.includes('study-unit-add'), 'add/edit subject must manage study units');
assert.ok(js.includes('if (!validIds.has(lecture.studyUnitId)) lecture.studyUnitId = firstId;'), 'removing a unit must preserve content by moving it to a remaining unit');
assert.ok(js.includes('authFormObserver.observe(form,{childList:true});'), 'signup observation must stay scoped to direct form changes');
assert.ok(!js.includes('authFormObserver.observe(form,{childList:true,subtree:true})'), 'signup helper must not broadly observe the form subtree');
assert.ok(css.includes('.study-unit-card-switcher') && css.includes('.study-unit-editor'), 'study structure styles missing');
assert.ok(index.includes('study-structure.css?v=20260917-1') && index.includes('study-structure.js?v=20260917-1'), 'study structure assets must be loaded');

console.log('study structure regression tests passed');
