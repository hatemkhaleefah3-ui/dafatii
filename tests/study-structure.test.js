const fs = require('node:fs');
const assert = require('node:assert/strict');

const js = fs.readFileSync('study-structure.js','utf8');
const css = fs.readFileSync('study-structure.css','utf8');
const courseUi = fs.readFileSync('course-study-type-ui.js','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const type of ['chapters','systems','blocks','courses']) {
  assert.ok(js.includes(`${type}:`) || js.includes(`'${type}'`) || js.includes(`\"${type}\"`), `missing study type: ${type}`);
}
assert.ok(js.includes("if (user.studentStage === 'school') return 'chapters';"), 'school accounts must remain chapter-based');
assert.ok(js.includes('window.DafatiiCourses?.active?.()') && js.includes('activeCourse.studyType'), 'higher-education study type must come from the active course');
assert.ok(!js.includes('auth-form') && !js.includes('studyTypeField') && !js.includes('injectStudyTypeField'), 'study type must not be injected into signup');
assert.ok(js.includes('studyUnits') && js.includes('activeStudyUnitId'), 'subjects must carry study units and an active unit');
assert.ok(js.includes('lecture.studyUnitId') && js.includes('lectures.filter'), 'subject content must be scoped to the selected study unit');
assert.ok(!js.includes('data-study-unit-select'), 'subject cards must not contain study-unit selectors');
assert.ok(js.includes('data-study-unit-detail-select'), 'the opened subject page must contain the study-unit selector');
assert.ok(!js.includes('study-unit-card-switcher'), 'the chapter/system switcher must not be rendered inside subject cards');
assert.ok(js.includes('study-unit-rows') && js.includes('data-remove-study-unit') && js.includes('study-unit-add'), 'add/edit subject must manage study units');
assert.ok(js.includes('if (!validIds.has(lecture.studyUnitId)) lecture.studyUnitId = firstId;'), 'removing a unit must preserve content by moving it to a remaining unit');
assert.ok(js.includes("window.addEventListener('dafatii:coursesloaded'"), 'study structure must react when course metadata loads');
assert.ok(courseUi.includes("document.getElementById('course-form')") && courseUi.includes("document.getElementById('course-settings')"), 'create and edit course forms must receive the study type field');
assert.ok(courseUi.includes('name="studyType" required'), 'course study type field must be required');
assert.ok(!css.includes('.study-unit-card-switcher') && css.includes('.study-unit-detail-bar') && css.includes('.study-unit-editor'), 'study structure styles must keep the switcher in subject detail only');
assert.ok(index.includes('course-study-type-ui.js?v=20260917-1'), 'course study type form enhancer must be loaded');
assert.ok(index.includes('study-structure.css?v=20260919-1') && index.includes('study-structure.js?v=20260919-1'), 'study structure assets must be loaded with the new cache version');

console.log('study structure regression tests passed');
