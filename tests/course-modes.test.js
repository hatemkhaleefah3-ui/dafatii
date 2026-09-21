const fs = require('node:fs');
const assert = require('node:assert/strict');

const js = fs.readFileSync('course-modes.js','utf8');
const css = fs.readFileSync('course-modes.css','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const type of ['dafaa','personal','teaching','language']) assert.ok(js.includes("'"+type+"'"),'missing course type '+type);
for (const route of ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine']) assert.ok(js.includes("'"+route+"'"),'language route missing '+route);
for (const route of ['language-start-zero','language-level-test']) assert.ok(js.includes("'"+route+"'"),'intermediate route missing '+route);
for (const language of ['English','Arabic','Spanish','French','German','Turkish','Persian','Kurdish','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Hindi','Urdu']) assert.ok(js.includes("['"+language+"'"),'language picker missing '+language);

assert.match(js,/name="joinPolicy" value="direct"/,'new language courses must use direct enrollment');
assert.match(js,/function openLanguageEnrollment\(course,prefillAccess=''/,'language enrollment needs its own bottom sheet');
assert.match(js,/data-native-language="Arabic"[\s\S]*data-native-language="English"/,'native language must be Arabic or English');
assert.match(js,/data-language-path="zero"[\s\S]*data-language-path="test"/,'enrollment must choose start from zero or level test');
assert.match(js,/setHash\(entryMode==='zero'\?'language-start-zero':'language-level-test'\)/,'enrollment must enter the selected intermediate process');
assert.match(js,/form\.id!=='course-enroll-form'/,'join-by-code must also detect language courses');

assert.match(css,/\.language-intermediate-shell \.quiet-sidebar>nav,[\s\S]*\.bottom-nav\{display:none!important\}/,'intermediate process must hide main nav surfaces');
assert.match(js,/Start Level 1 · Step 1/,'start-from-zero process must end at Level 1 Step 1');
assert.match(js,/Determine your starting level/,'level determining exam must exist');

assert.match(js,/function languageHomePage\(\)/,'language home page must exist');
assert.match(js,/function languageContentPage\(page\)/,'main language pages must have simple content');
assert.match(js,/LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v1'/,'simple content must use a shared course record');

assert.match(js,/function openLanguageControl\(page\)/,'language Content Control wizard must exist');
for (const action of ['access','add','delete']) assert.ok(js.includes('data-language-control-action="'+action+'"'),'missing Content Control action '+action);
assert.match(js,/Step 2 of 3/,'Content Control must include location selection');
assert.match(js,/Add language content[\s\S]*Add level[\s\S]*Add step of a level[\s\S]*Add box of a step/,'Add must expose requested hierarchy');
assert.match(js,/accept="\.xlsx,\.xls,\.csv,\.zip"/,'Add must accept Excel and ZIP');
assert.match(js,/window\.XLSX[\s\S]*window\.JSZip/,'imports must use existing Excel and ZIP libraries');
assert.match(js,/hideLanguageControl\(page\);close\(\);render\(\)/,'delete success must hide Content Control on the current page');
assert.match(js,/hideLanguageControl\(originPage\);close\(\);render\(\)/,'access/edit success must hide Content Control on the current page');
assert.match(js,/page==='language-home'/,'home must exclude Content Control');

assert.doesNotMatch(js,/TOTAL_LANGUAGE_BOXES|LEVEL_LEARNING_SYSTEMS|ARABIC_VOCABULARY|ARABIC_GRAMMAR|letterGate|placementExam|defaultAssessmentQuestions|MediaRecorder|SpeechRecognition|speechSynthesis|video-understanding|pronunciation/,'old complex language engine must stay deleted');
assert.match(js,/personal-focus-room/,'personal course behavior must remain');

assert.ok(css.includes('.language-home-page')&&css.includes('.language-intermediate-page')&&css.includes('.language-content-control-trigger'),'new language surfaces need styling');
assert.ok(index.includes('course-modes.css?v=20260921-9'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-9'),'course JS must be cache-busted');

console.log('language onboarding and simple content tests passed');
