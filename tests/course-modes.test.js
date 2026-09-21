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

assert.match(js,/const LANGUAGE_PAGE_ITEM_TYPES=Object\.freeze/,'focused page item types must exist');
for(const type of ['vocabulary','sentence-vocabulary','image-vocabulary']) assert.ok(js.includes("id:'"+type+"'"),'vocabulary type missing '+type);
for(const type of ['hearing-word','speaking-word','hearing-sentence','speaking-sentence']) assert.ok(js.includes("id:'"+type+"'"),'voice type missing '+type);
for(const type of ['grammar-law','grammar-note','grammar-example','grammar-training']) assert.ok(js.includes("id:'"+type+"'"),'grammar type missing '+type);
assert.ok(!/['"]language-examine['"]\s*:\s*\[/.test(js.slice(js.indexOf('LANGUAGE_PAGE_ITEM_TYPES'),js.indexOf('LANGUAGE_SPEECH_LOCALES'))),'examining page must not receive predefined item types');

assert.match(js,/function nativeMeaning\(item\)/,'vocabulary must choose a meaning from learner native language');
assert.match(js,/meaningEnglish[\s\S]*meaningArabic/,'vocabulary items must store both English and Arabic meanings');
assert.match(js,/nativeLanguage\(\)==='Arabic'|'Arabic'\?'Arabic':'English'/,'native language must resolve to Arabic or English');
assert.match(js,/function renderVocabularyItem\(/,'vocabulary needs a dedicated renderer');
for(const selector of ['vocab-main-word','vocab-meaning-panel','sentence-vocab-card','vocab-image-frame']) assert.ok(js.includes(selector),'vocabulary renderer missing '+selector);

assert.match(js,/function renderVoiceItem\(/,'listening and speaking need a dedicated renderer');
assert.match(js,/SpeechSynthesisUtterance/,'hearing must use browser speech playback');
assert.match(js,/window\.speechSynthesis\.speak/,'hearing must speak the word or sentence');
assert.match(js,/navigator\.mediaDevices\?\.getUserMedia/,'speaking must request microphone only on explicit action');
assert.match(js,/new MediaRecorder\(stream\)/,'speaking must record microphone audio');
assert.match(js,/data-language-record-playback/,'speaking must provide playback');
assert.doesNotMatch(js,/SpeechRecognition|webkitSpeechRecognition/,'speaking must not add speech-recognition or grading rules');

assert.match(js,/function languageGrammarPage\(\)/,'grammar must have its own page renderer');
assert.match(js,/grammar-law-stack[\s\S]*grammar-connection[\s\S]*grammar-thread/,'grammar page must connect law and supporting content');
assert.match(js,/grammar-note-card/,'grammar notes must render uniquely');
assert.match(js,/grammar-example-card/,'grammar examples must render uniquely');
assert.match(js,/grammar-training-card/,'grammar training must render uniquely');
assert.match(js,/data-grammar-training-check/,'grammar training must be interactive');
assert.match(js,/if\(page==='language-grammar'\)return languageGrammarPage\(\)/,'grammar must not use the item-by-item generic renderer');

assert.match(js,/data-language-item-prev[\s\S]*data-language-item-next/,'vocabulary, voice and generic item pages need previous and next');
assert.match(js,/if\(page==='language-voice'\)[\s\S]*data-language-speak[\s\S]*data-language-record/,'voice interactions must bind on the item page');

assert.match(js,/function languageTypeSelect\(page,selected=''\)/,'Content Control must expose page-specific types');
assert.match(js,/Content item type/,'add and edit forms must include the item type selector');
assert.match(js,/Meaning in English[\s\S]*Meaning in Arabic/,'vocabulary edit form must capture both native-language meanings');
assert.match(js,/Image URL/,'image vocabulary edit form must capture an image');
assert.match(js,/Word or sentence/,'voice edit form must capture pronunciation text');
assert.match(js,/Training answer/,'grammar training editor must capture an answer');
assert.match(js,/data-language-delete-item/,'delete must remain inside edit form');
assert.ok(!js.includes('data-language-control-action="delete"'),'delete must not return as a top-level Content Control action');
assert.match(js,/accept="\.xlsx,\.xls,\.csv,\.zip"/,'Add must keep Excel and ZIP import');

assert.match(js,/pages\[loc\+'language-video'\]=\[\]/,'video page must not seed content items');
assert.match(js,/function languageVideoPage\(\)/,'video page must remain dedicated');
assert.match(js,/youtube-nocookie\.com\/embed/,'video player must keep YouTube embed');
assert.match(js,/data-language-video-note/,'video page must keep learner understanding field');

assert.match(js,/LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v1'/,'language content must use shared course record');
assert.match(js,/version:3/,'language content schema must be upgraded');
assert.match(js,/personal-focus-room/,'personal course behavior must remain');

for(const selector of ['.vocab-card','.vocab-meaning-panel','.vocab-image-frame','.voice-card','.voice-action','.mic-action.is-recording','.grammar-law-card','.grammar-thread','.grammar-example-card','.grammar-training-card','.language-video-player']) assert.ok(css.includes(selector),'missing premium styling '+selector);
assert.ok(index.includes('course-modes.css?v=20260921-12'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-12'),'course JS must be cache-busted');

console.log('focused language vocabulary voice and grammar tests passed');
