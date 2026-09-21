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
const languages=['English','Arabic','Spanish','French','German','Turkish','Persian','Kurdish','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Hindi','Urdu'];
for (const language of languages) assert.ok(js.includes("['"+language+"'"),'language picker missing '+language);
assert.match(js,/function openLanguageCourseForm\(\)/,'language creation needs its dedicated selection flow');
assert.match(js,/data-language-choice=/,'language creation must render language toggle buttons');
assert.match(js,/id="language-course-create" type="submit" disabled/,'Create must stay disabled until a language is chosen');
assert.match(js,/target\.value=selected;name\.value=selected\+' Language Course';submit\.disabled=!selected/,'language selection must unlock creation and derive the course identity');
assert.match(js,/Select a language before creating the course/,'course creation wrapper must reject missing target language');
assert.doesNotMatch(js,/targetLanguage:'English'|name="targetLanguage" value="English"/,'target language must never be hard-coded to English');
assert.match(js,/toolbarKicker\.textContent=targetLanguage\(\)\+' course'/,'language shell must show the selected language');
for (const route of routes) assert.ok(navSpecText.includes("'"+route+"'"),'language nav missing '+route);
assert.equal((navSpecText.match(/\['language-/g)||[]).length,6,'language course must expose exactly six navigation destinations');

assert.match(js,/function languageContent\(page\)\{[\s\S]{0,240}language-empty-page/,'language routes must render the empty page shell');
assert.doesNotMatch(js,/TOTAL_LANGUAGE_BOXES|LEVEL_LEARNING_SYSTEMS|ARABIC_VOCABULARY|ARABIC_GRAMMAR|letterGate|placementExam|defaultAssessmentQuestions|languageAuthoring|MediaRecorder|SpeechRecognition|speechSynthesis|video-understanding|pronunciation/,'retired language learning implementation must stay deleted');
assert.doesNotMatch(js,/language-letter-learn|language-letter-exam|language-review/,'retired language subroutes must stay deleted');
assert.match(js,/function purgeLegacyLanguageBrowserState\(\)/,'legacy browser language state should be actively removed');

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

assert.ok(index.includes('course-modes.css?v=20260921-8'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-8'),'course JS must be cache-busted');
assert.ok(index.indexOf('course-modes.js?v=20260921-8') > index.indexOf('content-controls.js'),'course modes must load after content controls');

console.log('empty language course shell tests passed');
