const fs=require('node:fs');
const assert=require('node:assert/strict');

const js=fs.readFileSync('course-modes.js','utf8');
const css=fs.readFileSync('course-modes.css','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.match(js,/const COURSE_TYPES = \['dafaa','personal','teaching'\]/,'supported course modes changed unexpectedly');
assert.doesNotMatch(js,/COURSE_TYPES[^\n]*language/,'removed language course type must not return');
for(const token of [
  'LANGUAGE_ROUTES','LANGUAGE_CHOICES','LANGUAGE_LEARNING_KEY','LANGUAGE_ITEM_TYPES','LANGUAGE_SEED_ITEMS',
  'language-home','language-letters','language-voice','language-grammar','language-video','language-examine',
  'dafatii:language-learning:v1','Create Language course','openLanguageCourseForm','targetLanguage',
  'languageLearningPage','bindLanguageLearningPage','languageFloatingControl'
]) assert.ok(!js.includes(token),'removed language course frontend token remains: '+token);

assert.match(js,/Create Dafaa/,'Dafaa creation option missing');
assert.match(js,/Create Personal course/,'Personal course creation option missing');
assert.match(js,/Create Teaching course/,'Teaching course creation option missing');
assert.match(js,/function openTypeChooser\(\)/,'course type chooser missing');
assert.match(js,/personal-focus-room/,'personal focus room behavior missing');
assert.match(js,/function personalRoomPage\(\)/,'personal focus page missing');
assert.match(js,/if\(type==='personal'&&page==='chat'\)\{setHash\('study-rooms'\);return;\}/,'personal chat redirect changed');
assert.match(js,/courseType,openTypeChooser/,'course mode public API changed');

assert.doesNotMatch(css,/\.language-|language-course|Language learning|language picker/i,'removed language course CSS must not remain');
for(const selector of ['.course-mode-sheet','.course-type-grid','.course-type-card','.personal-focus-page','.personal-focus-grid']) assert.ok(css.includes(selector),'course mode CSS missing '+selector);

assert.ok(index.includes('course-modes.css?v=20260923-5'),'CSS cache version missing');
assert.ok(index.includes('course-modes.js?v=20260923-6'),'JS cache version missing');

console.log('course modes without language course tests passed');
