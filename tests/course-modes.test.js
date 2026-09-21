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

assert.match(js,/const LANGUAGE_PAGE_ITEM_TYPES=Object\.freeze/,'focused page item types must exist');
for(const type of ['vocabulary','sentence-vocabulary','image-vocabulary']) assert.ok(js.includes("id:'"+type+"'"),'vocabulary type missing '+type);
for(const type of ['hearing-word','speaking-word','hearing-sentence','speaking-sentence']) assert.ok(js.includes("id:'"+type+"'"),'voice type missing '+type);
for(const type of ['grammar-law','grammar-note','grammar-example','grammar-training']) assert.ok(js.includes("id:'"+type+"'"),'grammar type missing '+type);
for(const type of ['exam-single-choice','exam-multiple-choice','exam-true-false','exam-fill-blank','exam-short-answer']) assert.ok(js.includes("id:'"+type+"'"),'exam type missing '+type);

assert.match(js,/function nativeMeaning\(item\)/,'vocabulary must choose a meaning from learner native language');
assert.match(js,/meaningEnglish[\s\S]*meaningArabic/,'vocabulary items must store both English and Arabic meanings');
assert.match(js,/function renderVocabularyItem\(/,'vocabulary needs a dedicated renderer');

assert.match(js,/function renderVoiceItem\(/,'listening and speaking need a dedicated renderer');
assert.match(js,/voice-practice-actions/,'every voice card needs a shared practice action area');
assert.match(js,/Open microphone/,'voice cards must visibly expose an open microphone action');
assert.match(js,/const hear=[\s\S]*const mic=[\s\S]*speaking\?mic\+hear:hear\+mic/,'hearing and speaking items must both contain hearing and microphone actions');
assert.match(js,/SpeechSynthesisUtterance/,'hearing must use browser speech playback');
assert.match(js,/navigator\.mediaDevices\?\.getUserMedia/,'microphone must open only after explicit action');
assert.match(js,/new MediaRecorder\(stream\)/,'microphone practice must record audio');
assert.match(js,/data-language-record-playback/,'microphone practice must provide playback');
assert.doesNotMatch(js,/SpeechRecognition|webkitSpeechRecognition/,'no pronunciation recognition or scoring engine should be added');

assert.match(js,/function languageGrammarPage\(\)/,'grammar must have its own page renderer');
assert.match(js,/grammar-law-stack[\s\S]*grammar-connection[\s\S]*grammar-thread/,'grammar page must connect law and supporting content');

assert.match(js,/function renderExamItem\(item,index\)/,'exam page needs a dedicated renderer');
assert.match(js,/exam-single-card/,'single-choice question needs its own design');
assert.match(js,/exam-multiple-card/,'multiple-choice question needs its own design');
assert.match(js,/exam-truefalse-card/,'true-false question needs its own design');
assert.match(js,/exam-fill-card/,'fill-in-the-blank question needs its own design');
assert.match(js,/exam-short-card/,'short-answer question needs its own design');
assert.match(js,/data-exam-multiple-check/,'multiple choice must be interactive');
assert.match(js,/data-exam-text-check/,'fill blank must be interactive');
assert.match(js,/data-exam-short-review/,'short answer must support model-answer review');
assert.match(js,/page==='language-examine'\?renderExamItem/,'exam page must use the exam renderer in its item-by-item flow');

assert.match(js,/function languageTypeSelect\(page,selected=''\)/,'Content Control must expose page-specific types');
assert.ok(js.includes('data-language-control-action="import"'),'Content Control must expose Import content');
assert.ok(js.includes('data-language-control-action="import-voice"'),'Content Control must expose Import voice files');
assert.match(js,/function renderLanguageVoiceImport\(/,'voice ZIP import must have its own bottom-sheet flow');
assert.match(js,/data-language-voice-zip type="file" accept="\.zip,application\/zip"/,'voice import must accept ZIP only');
assert.match(js,/window\.JSZip\.loadAsync/,'voice import must unzip files in the browser');
assert.match(js,/function languageVoiceTargets\(content\)/,'voice import must scan hearing items across the course');
assert.match(js,/purpose:'language-hearing-audio'/,'matched audio must use the course file upload path');
assert.match(js,/target\.item\.voiceFileId=fileId/,'matched hearing items must store an uploaded file ID');
assert.match(js,/window\.DafatiiFiles\.getViewUrl\(fileId\)/,'hearing playback must resolve stored course audio');
assert.match(js,/new Audio\(url\)/,'hearing playback must use the imported voice file');
assert.match(js,/if\(!fileId\)\{playLanguageSpeech/,'browser speech must remain a fallback only when no imported audio is associated');
assert.match(js,/function renderLanguageExcelImport\(/,'Excel import must have its own bottom-sheet flow');
assert.match(js,/accept="\.xlsx,\.xls"/,'Import content must accept Excel files only');
assert.doesNotMatch(js,/data-language-excel-file[^>]*\.csv|data-language-excel-file[^>]*\.zip/,'bulk import must not accept CSV or ZIP');
for(const header of ['item type','item level','item step','item box','item page','item turning number','voice file name','correct answer','youtube video link']) assert.ok(js.includes("'"+header+"'"),'Excel schema missing '+header);
assert.match(js,/LANGUAGE_EXCEL_TYPE_PAGE/,'Excel import must validate item-type page destinations');
assert.match(js,/duplicate turning number/,'Excel import must reject duplicate turning positions');
assert.match(js,/index=entry\.turn-1/,'item turning number must map to the exact page position');
assert.match(js,/existing&&existing\.type===incoming\.type/,'matching rows must preserve existing values when Excel feature cells are blank');
assert.match(js,/voiceFileName/,'hearing items must preserve voice file names');
assert.match(js,/imageFileName/,'image vocabulary must preserve image file names');
assert.match(js,/content\.video\[key\]=\{\.\.\.current,\.\.\.entry\.config\}/,'YouTube Excel rows must update the box video configuration');
assert.match(js,/Correct answers — one per line/,'multiple choice editor needs correct-answer fields');
assert.match(js,/Answer \/ model answer/,'exam editor needs answer/model-answer field');
assert.match(js,/data-language-delete-item/,'delete must remain inside edit form');
assert.ok(!js.includes('data-language-control-action="delete"'),'delete must not return as a top-level Content Control action');

assert.match(js,/function languageVideoPage\(\)/,'video page must remain dedicated');
assert.match(js,/video-note-editor/,'video understanding field must use premium editor shell');
assert.match(js,/data-language-video-word-count/,'video editor must show a live word count');
assert.match(js,/Unsaved changes/,'video editor must communicate unsaved state');
assert.match(js,/event\.metaKey\|\|event\.ctrlKey/,'video notes must support keyboard save');
assert.match(js,/youtube-nocookie\.com\/embed/,'video player must keep YouTube embed');

assert.match(js,/LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v1'/,'language content must use shared course record');
assert.match(js,/personal-focus-room/,'personal course behavior must remain');

for(const selector of [
  '.vocab-card','.voice-card','.voice-practice-actions','.mic-action.is-recording',
  '.grammar-law-card','.grammar-thread',
  '.video-note-editor','.video-note-editor:focus-within',
  '.exam-single-card','.exam-multiple-card','.exam-truefalse-card','.exam-fill-card','.exam-short-card'
]) assert.ok(css.includes(selector),'missing premium styling '+selector);

assert.ok(index.includes('course-modes.css?v=20260921-15'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-15'),'course JS must be cache-busted');

console.log('language mic video editor and exam tests passed');
