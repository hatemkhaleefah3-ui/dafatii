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
  assert.ok(js.includes(route), 'missing language route '+route);
}

assert.match(js,/TOTAL_LANGUAGE_BOXES = 5\*26 \+ 4\*5\*25/,'course must keep the corrected 630-box structure');
assert.match(js,/function boxCount\(li\)\{ return li===0 \? 26 : 25; \}/,'A1 must have 26 boxes and later levels 25');
assert.match(js,/passedSteps:\[\],passedLevels:\[\],languagePassed:false/,'formal step, level and language completion state must exist');
assert.match(js,/function currentAssessment\(state,pos\)/,'examine scope must derive from learner position');
assert.match(js,/if\(pos\.box<last\)return \{scope:'box'/,'ordinary boxes must use box exams');
assert.match(js,/if\(pos\.step<5\)return \{scope:'step'/,'last box of steps 1-4 must use a whole-step exam');
assert.match(js,/if\(pos\.li<4\)return \{scope:'level'/,'last box of Step 5 must use a whole-level exam');
assert.match(js,/return \{scope:'language',li:4,step:5,box:last\}/,'final C1 boundary must use a whole-language exam');
assert.match(js,/state\.passedSteps=arrayUnique\(\[\.\.\.state\.passedSteps,keyStep\(id,ctx\.step\)\]\)/,'passing a step exam must explicitly complete the step');
assert.match(js,/state\.passedLevels=arrayUnique\(\[\.\.\.state\.passedLevels,id\]\)/,'passing a natural level exam must explicitly complete the level');
assert.match(js,/state\.languagePassed=true/,'whole-language pass state must be recorded');

assert.match(js,/function applyLevelChallengePass\(state,li\)/,'independent level challenges must exist');
assert.match(js,/state\.passedLevels=arrayUnique\(\[\.\.\.state\.passedLevels,CEFR\[li\]\.id\]\)/,'level challenge must mark only the selected level');
assert.doesNotMatch(js,/function applyLevelChallengePass\(state,li\)[\s\S]{0,250}passedBoxes/,'level challenge must not credit underlying boxes');
assert.match(js,/mode==='challenge'\?score>80:score>=80/,'level challenge must require greater than 80 while natural exams keep 80');
assert.match(js,/for\(let level=entry;level<li;level\+\+\) if\(!isLevelPassed\(state,level\)\)return false/,'higher-level study must require every prior level in the enrolled pathway');
assert.match(js,/if\(li===entry\)return true/,'placement entry must be allowed without falsely completing lower levels');

assert.match(js,/data-language-start-zero/,'new learners must be offered Start from zero');
assert.match(js,/data-language-placement-start/,'new learners must be offered Examine my level');
assert.match(js,/function placementExamPage\(\)/,'placement exam page must exist');
for (const mode of ["type:'tts-mcq'","type:'listen-fill'","type:'image-fill'","type:'translate-fill'"]) {
  assert.ok(js.includes(mode),'placement exam missing multimodal mode '+mode);
}
assert.match(js,/placementRecommendedLevel\(score\)/,'placement score must determine the starting level');
assert.match(js,/state\.entryLevel=li;state\.selectedLevel=li;state\.selectedStep=1;state\.selectedBox=1/,'placement must start at the selected level, Step 1, first box');
assert.match(js,/Skipped lower levels were not marked complete/,'placement result must not claim lower levels are completed');
assert.match(js,/state\.placementPending&&page!=='language-examine'/,'placement route must be guarded');
assert.match(js,/!state\.onboardingComplete&&!state\.placementPending&&page!=='language-home'/,'first enrollment choice must not be bypassable');

assert.match(js,/function videoUnderstandingPage\(state,pos\)/,'post-A1 Video Understanding page must exist');
assert.match(js,/if\(pos\.li>0\)return videoUnderstandingPage\(state,pos\)/,'Letters route must become Video Understanding after A1');
assert.match(js,/responseLanguage:li<=2\?'Arabic':'English'/,'A2/B1 responses must be Arabic and B2/C1 responses English');
assert.match(js,/const required=li===0\?\['pronunciation','voice','grammar','review'\]:\['video','voice','grammar','review'\]/,'post-A1 boxes must require Video Understanding instead of pronunciation page');
assert.match(js,/function videoResponseValid\(li,value\)/,'video response language/length validation must exist');
assert.match(js,/value\.watchedVideos\[id\]=true/,'video must be fully watched before completion can unlock');
assert.match(js,/function languageNavLabel\(item\)/,'dynamic second navigation label must exist');
assert.match(js,/dafatii:language-authoring:v1/,'language authored content must use a course-scoped content store');
assert.match(js,/function defaultLanguageContentItems\(li,step,box,page\)/,'every learning page must resolve itemized default content');
assert.match(js,/data-language-content-item/,'learner-facing language information must render as selectable item boxes');
assert.match(js,/function languageItemSchemas\(page,li\)/,'language items must expose page-specific edit/add form schemas');
assert.match(js,/function saveLanguageItem\(selection,item\)/,'language item edits must persist');
assert.match(js,/function deleteLanguageItem\(selection,id\)/,'language items must support deletion');
assert.match(js,/function emptyLanguagePage\(selection\)/,'language pages must support removing all items');
assert.match(js,/pages:\['letters','voice','grammar','review','examine'\]/,'content authoring must include every language page except Home');
assert.match(js,/getExamQuestions:selection=>examQuestionsFor/,'exam control must expose the resolved assessment question set');
assert.match(js,/saveExamQuestion/,'exam questions must support editing and adding');
assert.match(js,/emptyExamQuestions/,'exam controls must support removing all questions');
assert.match(js,/if\(!questions\.length\)return '<div class="language-exam-prereqs"/,'an emptied exam must become unavailable rather than auto-scoring');
assert.match(js,/return li>0\?t\('video'\):t\('letters'\)/,'navigation must switch from Letters to Video Understanding after A1');

assert.match(js,/const LETTER_SPEECH = \{A:'ay',B:'bee'/,'letter audio must use spoken names');
assert.match(js,/function speakLetter\(letter\)/,'dedicated letter speech must remain');
assert.match(js,/function scoreLetterCanvas\(canvas,letter,kind\)/,'validated letter drawing must remain');
assert.match(js,/coverage>=\.60&&precision>=\.58&&score>=\.64/,'letter tracing must reject poor shapes');
assert.match(js,/getCoalescedEvents/,'finger drawing smoothing must remain');
assert.match(js,/quadraticCurveTo/,'finger drawing must use smoothed strokes');
assert.match(js,/itemDone\|\|item===firstMissing/,'future letters must remain sequentially locked');

assert.match(js,/name="studyType" value="courses"/,'language course creation must submit a supported backend study structure');
assert.doesNotMatch(js,/name="studyType" value="language"/,'language mode must not be sent as backend studyType');
assert.match(js,/dafatii:language-progress:/,'language progress must remain per course/user');
assert.match(js,/:v3/,'new assessment architecture must use v3 progress state');
assert.match(js,/legacyProgressKey/,'v2 learner progress must be migrated rather than discarded');

assert.match(js,/SpeechSynthesisUtterance/,'speech synthesis must remain functional');
assert.match(js,/SpeechRecognition\|\|window\.webkitSpeechRecognition/,'speech recognition must remain functional');
assert.match(js,/data-language-ui-switch/,'Arabic-English UI switch must remain');

assert.match(js,/isPersonal=type==='personal'/,'personal course setup must remain intact');
assert.match(js,/name="pricing" value="free"/,'personal courses must remain free-only');
assert.match(js,/personal-focus-room/,'personal focus room must remain intact');
assert.match(js,/page==='study-rooms'\)return personalRoomPage/,'personal study-room override must remain');

for (const selector of [
  '.language-course-page','.language-onboarding-hero','.language-entry-grid',
  '.language-video-player','.language-video-response','.placement-question',
  '.language-level-challenges','.letter-draw-feedback'
]) {
  assert.ok(css.includes(selector),'missing course-mode style '+selector);
}
assert.match(css,/@media\(max-width:820px\)\{[\s\S]*\.language-course-shell \.language-video-screen/,'new assessment/video surfaces must have mobile styling');
assert.match(css,/touch-action:none!important/,'validated letter canvases must remain touch-safe');

assert.ok(index.includes('course-modes.css?v=20260920-5'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260920-6'),'course JS must be cache-busted');
assert.ok(index.indexOf('course-modes.js?v=20260920-6') > index.indexOf('content-controls.js'),'course modes must load after workspace wrappers');

console.log('course modes v4 tests passed');
