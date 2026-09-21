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

assert.match(js,/const LANGUAGE_ITEM_TYPES=Object\.freeze/,'interactive language item catalog must exist');
const itemPages=['language-letters','language-voice','language-grammar','language-examine'];
for(let i=0;i<itemPages.length;i++){
  const page=itemPages[i];
  const start=js.indexOf("'"+page+"':[",js.indexOf('LANGUAGE_ITEM_TYPES'));
  const end=i<itemPages.length-1?js.indexOf("'"+itemPages[i+1]+"':[",start):js.indexOf('\n  });',start);
  assert.ok(start>=0&&end>start,'missing item catalog for '+page);
  const count=(js.slice(start,end).match(/\{id:'/g)||[]).length;
  assert.equal(count,10,page+' must expose exactly 10 content item types');
}
for(const type of ['word-reveal','flip-card','spelling-check','missing-letter','meaning-choice','sentence-builder','writing-prompt','word-sequence','word-compare','usage-self-check']) assert.ok(js.includes("id:'"+type+"'"),'letters type missing '+type);
for(const type of ['audio-focus','listen-choice','shadow-steps','speaking-timer','dialogue-turn','stress-compare','sound-selection','listening-order','speaking-note','listen-self-check']) assert.ok(js.includes("id:'"+type+"'"),'voice type missing '+type);
for(const type of ['rule-reveal','grammar-choice','grammar-gap','error-fix','grammar-order','rule-multi','form-compare','grammar-write','rule-sequence','grammar-self-check']) assert.ok(js.includes("id:'"+type+"'"),'grammar type missing '+type);
for(const type of ['exam-choice','exam-multi','exam-true-false','exam-short','exam-gap','exam-order','exam-match','exam-sequence','exam-error','exam-response']) assert.ok(js.includes("id:'"+type+"'"),'exam type missing '+type);

assert.match(js,/function renderLanguageLearningItem\(/,'interactive item renderer must exist');
assert.match(js,/data-language-item-prev[\s\S]*data-language-item-next/,'item-driven pages need previous and next controls');
assert.match(js,/function bindLanguageItemInteractions\(/,'interactive item behavior must be bound');
for(const feature of ['data-language-check','data-language-choice-value','data-language-multi-check','data-language-order-token','data-language-write-save','data-language-sequence-next','data-language-timer']) assert.ok(js.includes(feature),'missing interaction '+feature);

assert.match(js,/pages\[loc\+'language-video'\]=\[\]/,'video page must not seed content items');
assert.match(js,/function languageVideoPage\(\)/,'video page must have a dedicated renderer');
assert.match(js,/function youtubeVideoId\(url\)/,'video page must accept a YouTube URL');
assert.match(js,/youtube-nocookie\.com\/embed/,'video player must use a YouTube embed');
assert.match(js,/data-language-video-note/,'video page must include the learner understanding field');
assert.match(js,/function openLanguageVideoEditor\(/,'Content Control must edit the video link and prompt');

assert.match(js,/function languageHomePage\(\)/,'language home page must exist');
assert.match(js,/function languageContentPage\(page\)/,'main language pages must have content routing');
assert.match(js,/LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v1'/,'language content must use the shared course record');
assert.match(js,/version:2/,'language content schema must be upgraded');

assert.match(js,/function openLanguageControl\(page\)/,'language Content Control wizard must exist');
for (const action of ['access','add','edit']) assert.ok(js.includes('data-language-control-action="'+action+'"'),'missing Content Control action '+action);
assert.ok(!js.includes('data-language-control-action="delete"'),'delete must not be a top-level Content Control action');
assert.match(js,/data-language-delete-item/,'edit form must contain the delete item button');
assert.match(js,/Delete item/,'delete action must be labeled inside edit form');
assert.match(js,/function languageEditorFields\(page,item=\{\}\)/,'add/edit forms must support item-specific fields');
assert.match(js,/Item type[\s\S]*Answer \/ model response[\s\S]*Options — one per line[\s\S]*Audio URL — optional/,'editor must expose interactive item configuration');
assert.match(js,/Step 2 of 3/,'Content Control must include location selection');
assert.match(js,/Add language content[\s\S]*Add level[\s\S]*Add step of a level[\s\S]*Add box of a step/,'Add must preserve requested hierarchy');
assert.match(js,/accept="\.xlsx,\.xls,\.csv,\.zip"/,'Add must accept Excel and ZIP');
assert.match(js,/window\.XLSX[\s\S]*window\.JSZip/,'imports must use existing Excel and ZIP libraries');
assert.match(js,/hideLanguageControl\(originPage\)/,'successful edit/access flows must hide Content Control');
assert.match(js,/page==='language-home'/,'home must exclude Content Control');

assert.doesNotMatch(js,/TOTAL_LANGUAGE_BOXES|LEVEL_LEARNING_SYSTEMS|ARABIC_VOCABULARY|ARABIC_GRAMMAR|letterGate|placementExam|defaultAssessmentQuestions|MediaRecorder|SpeechRecognition|speechSynthesis|video-understanding|pronunciation/,'retired complex language engine must stay deleted');
assert.match(js,/personal-focus-room/,'personal course behavior must remain');

for(const selector of ['.language-learning-card','.language-choice-grid','.language-token-bank','.language-video-player','.language-video-notes','.language-editor-actions']) assert.ok(css.includes(selector),'missing language styling '+selector);
assert.ok(index.includes('course-modes.css?v=20260921-10'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-10'),'course JS must be cache-busted');

console.log('interactive language content tests passed');
