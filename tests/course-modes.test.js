const fs = require('node:fs');
const assert = require('node:assert/strict');

const js = fs.readFileSync('course-modes.js','utf8');
const css = fs.readFileSync('course-modes.css','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const type of ['dafaa','personal','teaching','language']) {
  assert.ok(js.includes("'"+type+"'"), 'missing course type '+type);
}

const navSpecStart=js.indexOf('const navSpec=['),navSpecEnd=js.indexOf('function icon(',navSpecStart);
assert.ok(navSpecStart>=0&&navSpecEnd>navSpecStart,'language navSpec must exist');
const navSpecText=js.slice(navSpecStart,navSpecEnd);
const routes=['language-home','language-letters','language-voice','language-grammar','language-video','language-examine'];
for (const route of routes) assert.ok(navSpecText.includes("'"+route+"'"),'language nav missing '+route);
assert.equal((navSpecText.match(/\['language-/g)||[]).length,6,'language course must expose exactly six navigation destinations');

assert.match(js,/function languageContent\(page\)\{[\s\S]{0,240}language-empty-page/,'language routes must render the empty page shell');
assert.doesNotMatch(js,/TOTAL_LANGUAGE_BOXES|LEVEL_LEARNING_SYSTEMS|ARABIC_VOCABULARY|ARABIC_GRAMMAR|letterGate|placementExam|defaultAssessmentQuestions|languageAuthoring|language-progress:|MediaRecorder|SpeechRecognition|speechSynthesis|video-understanding|pronunciation/,'retired language learning implementation must stay deleted');
assert.doesNotMatch(js,/language-letter-learn|language-letter-exam|language-review/,'retired language subroutes must stay deleted');

assert.match(js,/querySelector\('\.quiet-workspace>\.sub-nav'\)\?\.remove\(\)/,'language shell must remove the redundant workspace capsule');
assert.match(js,/querySelector\('\.quiet-return-button'\)\?\.remove\(\)/,'language shell must remove the floating return control');
assert.match(js,/if\(side\)side\.innerHTML=sideLanguageNav\(current\)/,'language shell must keep sidebar navigation');
assert.match(js,/if\(desktop\)desktop\.innerHTML=sideLanguageNav\(current\)/,'language shell must keep desktop navigation');
assert.match(js,/if\(bottom\)bottom\.innerHTML=bottomLanguageNav\(current\)/,'language shell must keep mobile navigation');

assert.ok(css.includes('.language-empty-page'),'empty language page needs a dedicated designed surface');
assert.ok(css.includes('.language-course-shell .workspace-main'),'empty language shell needs workspace styling');
for (const retired of ['.language-onboarding-hero','.language-video-player','.language-exam-form','.letter-gate-page','.language-pronunciation-judge','.language-learning-analytics']) {
  assert.ok(!css.includes(retired),'retired language content style must stay deleted: '+retired);
}

assert.match(js,/isPersonal=type==='personal'/,'personal course setup must remain intact');
assert.match(js,/name="pricing" value="free"/,'personal courses must remain free-only');
assert.match(js,/personal-focus-room/,'personal focus room must remain intact');
assert.match(js,/page==='study-rooms'\)return personalRoomPage/,'personal study-room override must remain');

assert.ok(index.includes('course-modes.css?v=20260921-7'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-7'),'course JS must be cache-busted');
assert.ok(index.indexOf('course-modes.js?v=20260921-7') > index.indexOf('content-controls.js'),'course modes must load after content controls');

console.log('empty language course shell tests passed');
