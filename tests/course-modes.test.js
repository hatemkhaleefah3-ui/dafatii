const fs=require('node:fs');
const assert=require('node:assert/strict');
const js=fs.readFileSync('course-modes.js','utf8');
const css=fs.readFileSync('course-modes.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const headersFile=fs.readFileSync('_headers','utf8');

for(const route of ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine']) assert.ok(js.includes("'"+route+"'"),'missing route '+route);
for(const language of ['English','Arabic','Spanish','French','German','Turkish','Persian','Kurdish','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Hindi','Urdu']) assert.ok(js.includes("['"+language+"'"),'missing language '+language);

const page1=['word_to_native','image_to_word','sentence_to_native','match_pairs','word_builder','fill_blank','trace_letter_word','spelling_write','sentence_builder','category_sort','paragraph_translate_write'];
const page2=['listen_voice_to_text','listen_voice_to_image','listen_voice_to_native_voice','listen_dictation','listen_missing_word','speak_voice_to_voice','speak_text_to_voice','speak_image_to_voice','speak_answer_question','speak_dialogue_roleplay'];
for(const type of page1) assert.ok(js.includes("id:'"+type+"'"),'Page 1 type missing '+type);
for(const type of page2) assert.ok(js.includes("id:'"+type+"'"),'Page 2 type missing '+type);
for(const legacy of ['vocabulary','sentence-vocabulary','image-vocabulary','hearing-word','hearing-sentence','speaking-word','speaking-sentence']) assert.ok(!js.includes("id:'"+legacy+"'"),'legacy type is still selectable '+legacy);
assert.match(js,/content\.version=6/,'schema version 6 required');
assert.match(js,/vocabulary:'word_to_native'/,'old vocabulary must migrate');
assert.match(js,/'hearing-word':'listen_voice_to_text'/,'old hearing content must migrate');

assert.match(js,/function renderVocabularyItem\(item,index\)/,'Page 1 renderer missing');
for(const marker of ['word-flip-card','paper-polaroid','torn-sentence','pair-board','letterpress-tiles','highlighter-blank','data-trace-canvas','data-spelling-input','sentence-build-output','filing-drawers','paragraph-translate-exercise']) assert.ok(js.includes(marker),'Page 1 UI missing '+marker);
assert.match(js,/function setupInkPaperExercises\(\)/,'Page 1 bindings missing');
assert.match(js,/function setupTraceCanvas\(card\)/,'trace canvas missing');
assert.match(js,/getImageData/,'trace accuracy calculation missing');
assert.match(js,/function similarity\(a,b\)/,'fuzzy paragraph scoring missing');
assert.match(js,/data-paragraph-mode="sentences"/,'sentence mode missing');
assert.match(js,/data-paragraph-mode="full"/,'full paragraph mode missing');
assert.match(js,/data-keyword-meter/,'keyword meter missing');
assert.match(js,/localStorage\.setItem\(key,JSON\.stringify/,'paragraph autosave missing');
assert.match(js,/word-diff/,'word diff missing');

assert.match(js,/function renderVoiceItem\(item,index\)/,'Page 2 renderer missing');
assert.ok(js.includes("voice:'Listening & speaking'"),'Page 2 navigation label must be Listening & speaking');
assert.match(js,/data-native-audio="1"/,'native-audio option fallback must use the learner native-language voice');
for(const marker of ['studio-listen-control','studio-image-grid','mixer-console','glass-terminal','karaoke-line','dual-waveforms','teleprompter-text','studio-aperture-frame','studio-chat-bubble','podcast-stage']) assert.ok(js.includes(marker),'Page 2 UI missing '+marker);
assert.match(js,/function setupStudioExercises\(\)/,'Page 2 bindings missing');
assert.match(js,/data-studio-speed="0\.75"/,'0.75x speed missing');
assert.match(js,/data-studio-speed="1"/,'1x speed missing');
assert.match(js,/data-studio-play-count/,'play count missing');
assert.match(js,/SpeechSynthesisUtterance/,'speech playback missing');
assert.match(js,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/,'speech recognition fallback missing');
assert.match(js,/navigator\.mediaDevices\?\.getUserMedia/,'modern microphone permission flow missing');
assert.match(js,/navigator\.getUserMedia\|\|navigator\.webkitGetUserMedia\|\|navigator\.mozGetUserMedia/,'legacy microphone fallback missing');
assert.match(js,/function requestLanguageMicrophone\(\)/,'microphone request helper missing');
assert.match(js,/navigator\.permissions\.query\(\{name:'microphone'\}\)/,'microphone permission-state diagnostics missing');
assert.match(js,/dataset\.micState=state/,'mic button state machine missing');
assert.match(js,/studioRoot\?\.addEventListener\('click'/,'Page 2 microphone must use delegated click handling');
assert.match(js,/Microphone access is blocked for this site/,'denied microphone permission must show actionable status');
assert.match(headersFile,/Permissions-Policy:.*microphone=\(self\)/,'deployment headers must allow same-origin microphone access');
assert.match(js,/new MediaRecorder\(stream\)/,'recording missing');
assert.match(js,/data-mic-countdown/,'mic countdown missing');
assert.match(js,/data-mic-level/,'mic level meter missing');
assert.match(js,/data-language-record-playback/,'recording playback missing');
assert.doesNotMatch(js,/autoplay\s*=\s*true/i,'exercise audio must not autoplay');

assert.match(js,/function languageVoiceTargets\(content\)/,'voice ZIP target scan missing');
assert.match(js,/Array\.isArray\(item\?\.audioChoices\)/,'native audio ZIP targets missing');
assert.match(js,/target\.holder\.voiceFileId=fileId/,'voice ZIP target persistence missing');
assert.match(js,/purpose:'language-hearing-audio'/,'protected audio upload path missing');
assert.match(js,/window\.DafatiiFiles\.getViewUrl\(fileId\)/,'protected audio view URL missing');
assert.match(js,/new Audio\(url\)/,'stored audio playback missing');
assert.match(js,/if\(!fileId\)\{playLanguageSpeech/,'TTS fallback missing');

assert.match(js,/function languageEditorFields\(page,item=\{\}\)/,'Content Control editor missing');
for(const label of ['Pairs — one per line','Word tooltips','Categories — Category','Model translation','Accepted variants','Image choices — one direct URL per line','Native audio options','Learner role','Dialogue — one per line']) assert.ok(js.includes(label),'Content Control field missing '+label);
assert.match(js,/function readLanguageEditorData\(form,page,base=\{\}\)/,'Content Control parser missing');
assert.match(js,/LANGUAGE_EXCEL_TYPE_PAGE/,'Excel type map missing');
const excelHeaders=['question','source English','source Arabic','accepted variants','keywords','pairs','word glosses','categories','learner role','dialogue','image choice 1','image choice 4','native audio label 1','native audio voice file name 1','native audio label 6','native audio voice file name 6','story text','story understanding prompt'];
for(const header of excelHeaders) assert.ok(js.includes("'"+header+"'"),'new Excel schema missing '+header);
assert.match(js,/function languageExcelValidateItem\(row,type,item,rowNumber\)/,'Excel import must validate required fields by item type');
assert.match(js,/listen_voice_to_image correct answer must be the 1-based image choice number/,'image-listening answer convention must be explicit');
assert.match(js,/story-reading requires story text/,'story-reading Excel row must require story text');
assert.match(js,/youtube video link is not a recognized YouTube URL/,'YouTube Excel links must be validated');

for(const type of page1.concat(page2)) assert.ok(js.includes(type),'new type missing from source '+type);
assert.match(js,/duplicate turning number/,'Excel duplicate protection missing');
assert.match(js,/index=entry\.turn-1/,'turning number placement missing');

assert.match(js,/function directImageUrl\(value\)/,'direct image sanitization missing');
assert.match(js,/data-language-direct-image/,'direct image rendering missing');
assert.match(js,/class="language-auto-text" dir="auto"/,'automatic bidi text missing');
assert.match(css,/unicode-bidi:plaintext/,'bidi CSS missing');

for(const type of ['grammar-law','grammar-note','grammar-example','grammar-training']) assert.ok(js.includes("id:'"+type+"'"),'grammar type missing '+type);
for(const type of ['exam-single-choice','exam-multiple-choice','exam-true-false','exam-fill-blank','exam-short-answer']) assert.ok(js.includes("id:'"+type+"'"),'exam type missing '+type);
assert.match(js,/function languageVideoUnderstandingPage\(/,'Watching page missing');
assert.match(js,/function languageStoryReadingPage\(/,'Story page missing');
assert.match(js,/story-book-shell/,'old-book story renderer missing');

assert.match(css,/Language Page 1 — Ink & Paper v18/,'Ink & Paper marker missing');
for(const token of ['#FBF6EC','#1B2A41','#C8553D','#C9A227','#7A9E7E']) assert.ok(css.includes(token),'Ink palette missing '+token);
for(const selector of ['.word-flip-card','.paper-polaroid','.envelope-options','.pinned-note','.letterpress-tiles','.journal-sheet','.copybook-sheet','.typewriter-sheet','.corkboard-strip','.filing-drawer','.writing-desk-spread','.wax-submit']) assert.ok(css.includes(selector),'Ink styling missing '+selector);
assert.match(css,/Language Page 2 — Midnight Studio v18/,'Midnight Studio marker missing');
for(const token of ['#0B1020','#7C5CFF','#2DE2E6','#FF4FA3']) assert.ok(css.includes(token),'Studio palette missing '+token);
for(const selector of ['.studio-listen-button','.studio-wave','.studio-image-grid','.mixer-console','.glass-terminal','.karaoke-line','.studio-mic-button','.dual-waveforms','.teleprompter-text','.studio-aperture-frame','.studio-chat-bubble','.podcast-stage']) assert.ok(css.includes(selector),'Studio styling missing '+selector);

for(const font of ['Fraunces','Playfair+Display','Inter','Caveat','Amiri','Noto+Naskh+Arabic','Sora','Space+Grotesk','Tajawal']) assert.ok(index.includes(font),'font missing '+font);
assert.ok(index.includes('course-modes.css?v=20260921-21'),'CSS cache version missing');
assert.ok(index.includes('course-modes.js?v=20260921-21'),'JS cache version missing');

assert.match(js,/LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v1'/,'shared language record changed');
assert.match(js,/personal-focus-room/,'personal course behavior changed');

console.log('language Ink & Paper and Midnight Studio tests passed');
