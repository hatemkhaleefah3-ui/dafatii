const fs = require('node:fs');
const assert = require('node:assert/strict');

const js = fs.readFileSync('course-modes.js','utf8');
const css = fs.readFileSync('course-modes.css','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const type of ['dafaa','personal','teaching','language']) {
  assert.ok(js.includes("'"+type+"'"), 'missing course type '+type);
}
for (const level of ['A1','A2','B1','B2','C1']) {
  assert.ok(js.includes("id:'"+level+"'"), 'missing CEFR level '+level);
}
for (const route of ['language-home','language-letters','language-voice','language-grammar','language-review','language-examine']) {
  assert.ok(js.includes(route), 'missing language navigation route '+route);
}

assert.match(js,/TOTAL_LANGUAGE_BOXES = 5\*26 \+ 4\*5\*25/,'course must contain 630 boxes: A1 has 26 per step; A2-C1 have 25');
assert.match(js,/function boxCount\(li\)\{ return li===0 \? 26 : 25; \}/,'box count must differ between A1 and later levels');
assert.match(js,/for\(let step=1;step<=5;step\+\+\) if\(!isStepPassed/,'a level must require all five steps');
assert.match(js,/for\(let box=1;box<=boxCount\(li\);box\+\+\) if\(!isBoxPassed/,'a step must require all of its boxes');
assert.match(js,/boxStudyComplete\(state,li,step,box\)&&boxExamPassed\(state,li,step,box\)/,'a box must require both learning content and its dedicated exam');
assert.match(js,/\['pronunciation','voice','grammar','review'\]\.every/,'normal boxes must require all learning pages');
assert.match(js,/LETTERS\.every\(letter=>practiced\.includes\(letter\)\)/,'the A1 letters box must require all 26 letters');
assert.match(js,/LANGUAGE_FUNCTIONS = \[/,'normal boxes must have explicit per-box communication functions');
assert.match(js,/languageFunction,phase,title:/,'box content must carry its own learning function and step phase');
assert.match(js,/function examQuestions\(li,step,box\)/,'each box must have a dedicated exam generator');
assert.doesNotMatch(js,/scope==='step'/,'step exams must not bypass box completion');
assert.doesNotMatch(js,/scope==='level'/,'level exams must not bypass step completion');
assert.doesNotMatch(js,/function markPass\(/,'exams must not bulk-credit unfinished prerequisite content');
assert.match(js,/score>=80/,'box exam pass threshold must be enforced');

assert.match(js,/data-speak-letter=/,'letters must have individual pronunciation controls');

assert.match(js,/const LETTER_SPEECH = \{A:'ay',B:'bee'/,'letter playback must use spoken letter names instead of raw capital characters');
assert.match(js,/function speakLetter\(letter\)/,'letters must use a dedicated pronunciation function');
assert.match(js,/speak\(LETTER_SPEECH\[key\]\|\|key\)/,'letter speech must route through the spoken-name map');
assert.match(js,/function scoreLetterCanvas\(canvas,letter,kind\)/,'letter drawings must be shape-scored');
assert.match(js,/coverage>=\.60&&precision>=\.58&&score>=\.64/,'letter validation must reject low-coverage or off-guide drawings');
assert.match(js,/getCoalescedEvents/,'finger drawing must use coalesced pointer events when available');
assert.match(js,/quadraticCurveTo/,'finger strokes must be smoothed');
assert.match(js,/data-letter-next '\+\(done\?'':'disabled'\)/,'next letter must stay disabled until the current letter is completed');
assert.match(js,/itemDone\|\|item===firstMissing/,'future unpracticed letters must remain locked in sequence');
assert.match(js,/data-letter-feedback/,'letter tracing must expose validation feedback');

assert.match(js,/id="letter-upper-canvas"/,'each letter must have a separate uppercase drawing canvas');
assert.match(js,/id="letter-lower-canvas"/,'each letter must have a separate lowercase drawing canvas');
assert.match(js,/data-letter-complete=/,'letters must be completed individually');
assert.match(js,/activeLetterByStep/,'the selected letter must persist per A1 step');
assert.match(js,/letterProgress/,'per-letter practice progress must be persisted');

assert.match(js,/name="studyType" value="courses"/,'language course creation must submit a backend-supported study structure');
assert.doesNotMatch(js,/name="studyType" value="language"/,'language mode must not be submitted as an invalid backend study structure');
assert.match(js,/dafatii:language-progress:/,'language learner progress must remain per user/course');
assert.match(js,/:v2/,'redesigned progression must use the v2 progress state');

assert.match(js,/SpeechSynthesisUtterance/,'pronunciation playback must remain functional');
assert.match(js,/SpeechRecognition\|\|window\.webkitSpeechRecognition/,'voice-to-text practice must use speech recognition where available');
assert.match(js,/data-language-ui-switch/,'language workspace must expose the Arabic-English switcher');

assert.match(js,/isPersonal=type==='personal'/,'personal course creation must retain its solo setup path');
assert.match(js,/name="pricing" value="free"/,'personal courses must remain free-only');
assert.match(js,/personal-focus-room/,'personal courses must retain one focus room');
assert.match(js,/page==='study-rooms'\)return personalRoomPage/,'personal Study Rooms must remain the single focus studio');

for (const selector of ['.language-course-page','.course-type-grid','.language-home-steps','.letter-index-grid','.letter-trace-grid','.language-exam-summary','.letter-draw-feedback']) {
  assert.ok(css.includes(selector),'missing redesigned language style '+selector);
}
assert.ok(index.includes('course-modes.css?v=20260920-3'),'mobile English CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260920-4'),'mobile English JS must be cache-busted');
assert.ok(index.indexOf('course-modes.js?v=20260920-4') > index.indexOf('content-controls.js'),'course modes must load after existing workspace wrappers');
assert.match(css,/@media\(max-width:820px\)\{[\s\S]*\.language-course-shell \.language-page-head/,'English mobile redesign must be scoped to mobile language-course pages');
assert.match(css,/touch-action:none!important/,'letter canvases must suppress touch scrolling while finger drawing');
assert.match(css,/bottom:calc\(72px \+ env\(safe-area-inset-bottom\)\)/,'letter actions must stay thumb-accessible above the mobile navigation');

console.log('course modes v2 tests passed');
