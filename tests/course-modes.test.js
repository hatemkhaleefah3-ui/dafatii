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

assert.doesNotMatch(js,/LANGUAGE_ITEM_TYPES|languageTypeList|languageTypeDef|Item type|word-reveal|flip-card|spelling-check|grammar-choice|exam-choice|audio-focus/,'language pages must not contain predefined item types');
for(const removed of ['data-language-check','data-language-choice-value','data-language-multi-check','data-language-order-token','data-language-write-save','data-language-sequence-next','data-language-timer']) assert.ok(!js.includes(removed),'typed interaction must be removed: '+removed);
assert.match(js,/function languageContentPage\(page\)/,'main language pages must have content routing');
assert.match(js,/data-language-item-prev[\s\S]*data-language-item-next/,'content pages need previous and next controls');
assert.match(js,/Plain editable course content/,'home should describe generic content');

assert.match(js,/pages\[loc\+'language-video'\]=\[\]/,'video page must not seed content items');
assert.match(js,/function languageVideoPage\(\)/,'video page must have a dedicated renderer');
assert.match(js,/function youtubeVideoId\(url\)/,'video page must accept a YouTube URL');
assert.match(js,/youtube-nocookie\.com\/embed/,'video player must use a YouTube embed');
assert.match(js,/data-language-video-note/,'video page must include the learner understanding field');
assert.match(js,/function openLanguageVideoEditor\(/,'Content Control must edit the video link and prompt');

assert.match(js,/LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v1'/,'language content must use the shared course record');
assert.match(js,/version:2/,'language content schema must stay versioned');
assert.match(js,/delete next\.type;delete next\.feature;delete next\.answer;delete next\.options;delete next\.hint;delete next\.mediaUrl;delete next\.label/,'edit path must strip old type metadata');

assert.match(js,/function openLanguageControl\(page\)/,'language Content Control wizard must exist');
for (const action of ['access','add','edit']) assert.ok(js.includes('data-language-control-action="'+action+'"'),'missing Content Control action '+action);
assert.ok(!js.includes('data-language-control-action="delete"'),'delete must not be a top-level Content Control action');
assert.match(js,/data-language-delete-item/,'edit form must contain the delete item button');
assert.match(js,/Delete item/,'delete action must be labeled inside edit form');
assert.doesNotMatch(js,/Answer \/ model response|Options — one per line|Audio URL — optional/,'generic editor must not expose type-specific fields');
assert.match(js,/Step 2 of 3/,'Content Control must include location selection');
assert.match(js,/Add language content[\s\S]*Add level[\s\S]*Add step of a level[\s\S]*Add box of a step/,'Add must preserve requested hierarchy');
assert.match(js,/accept="\.xlsx,\.xls,\.csv,\.zip"/,'Add must accept Excel and ZIP');
assert.match(js,/window\.XLSX[\s\S]*window\.JSZip/,'imports must use existing Excel and ZIP libraries');
assert.match(js,/Imports create plain title-and-text content items/,'imports must create generic items');
assert.match(js,/page==='language-home'/,'home must exclude Content Control');

assert.doesNotMatch(js,/TOTAL_LANGUAGE_BOXES|LEVEL_LEARNING_SYSTEMS|ARABIC_VOCABULARY|ARABIC_GRAMMAR|letterGate|placementExam|defaultAssessmentQuestions|MediaRecorder|SpeechRecognition|speechSynthesis|video-understanding|pronunciation/,'retired complex language engine must stay deleted');
assert.match(js,/personal-focus-room/,'personal course behavior must remain');

for(const selector of ['.language-learning-card','.language-item-navigation','.language-video-player','.language-video-notes','.language-editor-actions']) assert.ok(css.includes(selector),'missing language styling '+selector);
for(const selector of ['.language-choice-grid','.language-token-bank','.language-flip-card','.language-speaking-timer','.language-variant-10']) assert.ok(!css.includes(selector),'typed item styling must be removed '+selector);
assert.ok(index.includes('course-modes.css?v=20260921-11'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-11'),'course JS must be cache-busted');

console.log('generic language content tests passed');
