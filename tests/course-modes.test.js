const fs=require('node:fs');
const assert=require('node:assert/strict');
const js=fs.readFileSync('course-modes.js','utf8');
const css=fs.readFileSync('course-modes.css','utf8');
const index=fs.readFileSync('index.html','utf8');

for(const route of ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine']) assert.ok(js.includes("'"+route+"'"),'missing language route '+route);
for(const language of ['English','Arabic','Spanish','French','German','Turkish','Persian','Kurdish','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Hindi','Urdu']) assert.ok(js.includes("['"+language+"'"),'missing language '+language);

assert.match(js,/LANGUAGE_LEARNING_KEY = 'dafatii:language-learning:v1'/,'new language learning record missing');
assert.doesNotMatch(js,/dafatii:language-content:v1.*readJSON|LANGUAGE_CONTENT_KEY/,'retired language record must not return');
for(const type of ['vocabulary-card','guided-writing','minimal-pair','shadowing','pronunciation','sentence-builder','grammar-rule','grammar-practice','youtube-lesson','graded-story','cloze','matching-grid','adaptive-choice','dialogue-scenario']) assert.ok(js.includes("'"+type+"'"),'missing learning item type '+type);

assert.match(js,/function scheduleReview\(itemId,rating\)/,'SRS scheduling missing');
assert.match(js,/intervalDays=rating==='hard'\?1:rating==='easy'/,'Hard Good Easy review scheduling missing');
assert.match(js,/data-srs-rating="hard"/,'Hard review control missing');
assert.match(js,/data-srs-rating="good"/,'Good review control missing');
assert.match(js,/data-srs-rating="easy"/,'Easy review control missing');
assert.match(js,/data-writing-input/,'guided writing editor missing');
assert.match(js,/data-writing-counter/,'writing counter missing');

assert.match(js,/data-rate="\.5"/,'slow listening control missing');
assert.match(js,/navigator\.mediaDevices\?\.getUserMedia/,'microphone capture missing');
assert.match(js,/new MediaRecorder/,'recording module missing');
assert.match(js,/webkitSpeechRecognition/,'speech recognition fallback missing');
assert.match(js,/recognition match/,'recognition feedback missing');
assert.match(js,/data-native-wave/,'native waveform surface missing');
assert.match(js,/data-user-wave/,'user waveform surface missing');

assert.match(js,/draggable="true"/,'grammar draggable word chips missing');
assert.match(js,/data-builder-output/,'sentence builder slots missing');
assert.match(js,/data-rule-toggle/,'contextual grammar rule tooltip missing');
for(const selector of ['.role-subject','.role-verb','.role-object']) assert.ok(css.includes(selector),'part-of-speech styling hook missing '+selector);

assert.match(js,/youtube\.com\/iframe_api/,'YouTube player API integration missing');
assert.match(js,/getCurrentTime/,'synchronized transcript timing missing');
assert.match(js,/data-video-word/,'tap-to-learn transcript words missing');
assert.match(js,/pauseVideo/,'word lookup must pause video');
assert.match(js,/data-add-flashcard/,'video vocabulary flashcard action missing');
assert.match(js,/data-native-subtitles/,'native subtitle toggle missing');

assert.match(js,/graded-story/,'graded reader missing');
assert.match(js,/\['A1','A2','B1','B2','C1','C2'\]/,'CEFR levels missing');
assert.match(js,/data-story-word/,'tap-to-translate story word missing');
assert.match(js,/data-reading-progress/,'sticky reading progress missing');
assert.match(js,/data-story-check/,'reading comprehension checkpoints missing');

assert.match(js,/function selectAdaptiveExamItem/,'adaptive exam selector missing');
assert.match(js,/state\.difficulty=correct\?Math\.min\(5/,'adaptive difficulty adjustment missing');
assert.match(js,/Question '\+position\+' of/,'one-question progress indicator missing');
assert.match(js,/data-exam-skip/,'exam skip missing');
assert.match(js,/data-exam-flag/,'flag for review missing');
assert.match(js,/language-skill-results/,'skill breakdown results missing');

assert.match(js,/function openLanguageManager\(page\)/,'language content manager missing');
assert.match(js,/function openLanguageItemEditor\(page,item\)/,'language item editor missing');
assert.match(js,/normalizeLearningItem/,'language item schema normalization missing');

assert.doesNotMatch(css,/CANONICAL LANGUAGE COURSE DESIGN|LANGUAGE LEARNING SYSTEM — Precision UI|Ink & Paper|Midnight Studio|Home — Observatory|Grammar — Blueprint Atelier|Cinema & Editorial|Arena Focus/,'retired language-specific themes must stay removed');
assert.match(css,/Language learning v1 — native Dafatii theme/,'native theme marker missing');
for(const token of ['var(--surface)','var(--surface-2)','var(--text)','var(--muted)','var(--border)','var(--accent)']) assert.ok(css.includes(token),'site theme token missing '+token);
for(const selector of ['.language-flashcard','.language-writing-split','.language-record-module','.language-grammar-sandbox','.language-video-layout','.language-story-reader','.language-exam-focus']) assert.ok(css.includes(selector),'learning layout selector missing '+selector);
assert.match(css,/prefers-reduced-motion/,'reduced motion handling missing');

assert.ok(index.includes('course-modes.css?v=20260923-1'),'CSS cache version missing');
assert.ok(index.includes('course-modes.js?v=20260923-1'),'JS cache version missing');
assert.match(js,/personal-focus-room/,'personal course behavior changed');
console.log('language learning v1 tests passed');
