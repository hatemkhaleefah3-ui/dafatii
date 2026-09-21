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
for (const route of ['language-home','language-letter-learn','language-letter-exam','language-letters','language-voice','language-grammar','language-review','language-examine']) {
  assert.ok(js.includes(route), 'missing language route '+route);
}

assert.match(js,/TOTAL_LANGUAGE_BOXES = 5\*5\*25/,'all CEFR levels must use 25 learning boxes per step after letters move outside A1');
assert.match(js,/function boxCount\(\)\{ return 25; \}/,'A1 letter prerequisite must not consume a learning box');
assert.match(js,/function firstLearningBox\(\)\{ return 1; \}/,'A1 learning content must start at Box 1');
assert.match(js,/function isLetterBox\(\)\{ return false; \}/,'legacy in-level letter boxes must be disabled');
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
assert.match(js,/letterGateProgress:\[\],activeGateLetter:'D',letterGatePassed:false/,'letter prerequisite progress must have explicit durable state');
assert.match(js,/\{letter:'D',arabic:'د',sound:'\/d\/'\}/,'Arabic د must bridge to English D by pronunciation');
assert.match(js,/\{letter:'P',arabic:'',sound:'\/p\/',special:true/,'English-only sounds must be represented as special letters');
assert.match(js,/function letterGateRequired\(state\)/,'English courses must have a one-time letters prerequisite gate');
assert.match(js,/if\(letterGateRequired\(state\)\)return letterGatePage\(state\)/,'letter prerequisite must occur before onboarding/course pages');
assert.match(js,/data-letter-gate-learn/,'letter prerequisite must offer learning first');
assert.match(js,/data-letter-gate-exam/,'letter prerequisite must allow direct examination');
assert.match(js,/Array\.from\(\{length:10\}/,'letter exam must contain exactly ten generated drawing questions');
assert.match(js,/correct>=8/,'letter drawing exam must require at least 8 of 10 recognized drawings');
assert.match(js,/state\.letterGatePassed=true/,'passing the letter exam must unlock the course');
assert.match(js,/letterGateRequired\(state\)&&!LETTER_GATE_ROUTES\.includes\(page\)/,'normal course routes must remain blocked until the letter exam is passed');
assert.match(js,/migrateEnglishLetterGateV6/,'existing A1 progress must migrate when the legacy letter box is removed');

assert.match(js,/function placementExamPage\(\)/,'placement exam page must exist');
for (const mode of ["type:'tts-mcq'","type:'listen-fill'","type:'image-fill'","type:'translate-fill'"]) {
  assert.ok(js.includes(mode),'placement exam missing multimodal mode '+mode);
}
assert.match(js,/placementRecommendedLevel\(score\)/,'placement score must determine the starting level');
assert.match(js,/state\.entryLevel=li;state\.selectedLevel=li;state\.selectedStep=1;state\.selectedBox=1/,'placement must start at the selected level, Step 1, first box');
assert.match(js,/Skipped lower levels were not marked complete/,'placement result must not claim lower levels are completed');
assert.match(js,/!letterGateRequired\(state\)&&state\.placementPending&&page!=='language-examine'/,'placement route must be guarded after the letter prerequisite');
assert.match(js,/!letterGateRequired\(state\)&&!state\.onboardingComplete&&!state\.placementPending&&page!=='language-home'/,'first enrollment choice must not be bypassable after the letter prerequisite');

assert.match(js,/function videoUnderstandingPage\(state,pos\)/,'post-A1 Video Understanding page must exist');
assert.match(js,/youtubeUrl:'https:\/\/www\.youtube\.com\/results\?search_query='/,'every generated Video Understanding lesson must be represented by a YouTube link');
assert.match(js,/name:'youtubeUrl',label:'YouTube URL'/,'admin video item forms must edit a YouTube URL field');
assert.match(js,/data-youtube-video/,'learner Video Understanding must render an external YouTube link');
assert.match(js,/data-video-watched/,'learner must explicitly confirm the YouTube video was watched');
assert.doesNotMatch(js,/data-play-language-video/,'Video Understanding must not use the old simulated video player');
assert.doesNotMatch(js,/name:'scenes'/,'video items must not contain narrated scene fields');
assert.match(js,/return out\.slice\(0,15\)/,'step exams must include a 15-question generated bank');
assert.match(js,/return out\.slice\(0,25\)/,'level exams must include a 25-question generated bank');
assert.match(js,/return out\.slice\(0,40\)/,'whole-language exam must include a 40-question generated bank');
for (const type of ['mcq','true-false','multi-select','fill','short-answer','listen-choice','listen-fill','ordering']) {
  assert.ok(js.includes("type:'"+type+"'"),'natural exams missing question type '+type);
}
assert.match(js,/function examAnswerCorrect\(question,form,index\)/,'mixed exam types must use a shared scorer');
assert.match(js,/data-ordering=/,'sentence-order questions must render an interactive builder');
assert.match(js,/examTypeLabel/,'exam question types must be visibly labeled');
assert.match(js,/id:'voice-rubric'/,'normal boxes must include a dedicated voice self-check item');
assert.match(js,/id:'grammar-error'/,'normal boxes must include a grammar error-analysis item');
assert.match(js,/id:'review-memory'/,'normal boxes must include a memory/retrieval item');
assert.match(js,/id:'exam-scope'/,'Examine pages must include explicit assessment-scope content');
assert.match(js,/if\(pos\.li>0\)return videoUnderstandingPage\(state,pos\)/,'Letters route must become Video Understanding after A1');
assert.match(js,/responseLanguage:String\(courseMeta\(\)\.targetLanguage\|\|'English'\)/,'video responses must use the target course language');
assert.match(js,/const required=li===0\?\['pronunciation','voice','grammar','review'\]:\['video','voice','grammar','review'\]/,'post-A1 boxes must require Video Understanding instead of pronunciation page');
assert.match(js,/function videoResponseValid\(language,value\)/,'video response language/length validation must exist');
assert.match(js,/value\.watchedVideos\[id\]=true/,'video must be fully watched before completion can unlock');
assert.match(js,/const navSpec=\[[\s\S]*\['language-home','nav-home','home'\],[\s\S]*\['language-voice','nav-messages','voice'\]/,'normal language navigation must start with Home then Voice after removing the letters tab');
const navSpecStart=js.indexOf('const navSpec=['),navSpecEnd=js.indexOf('function icon(',navSpecStart);
assert.ok(navSpecStart>=0&&navSpecEnd>navSpecStart,'language navSpec must exist');
assert.ok(!js.slice(navSpecStart,navSpecEnd).includes("'language-letters'"),'letters route must not be a persistent course navigation item');
assert.match(js,/dafatii:language-authoring:v1/,'language authored content must use a course-scoped content store');
assert.match(js,/function isAdminActor\(\)/,'language controls must resolve the platform admin role');
assert.match(js,/if\(type==='language'&&!isAdminActor\(\)\)throw new Error/,'client course creation must reject non-admin Language Course creation');
assert.match(js,/\.filter\(card=>card\[0\]!=='language'\|\|isAdminActor\(\)\)/,'non-admin course chooser must not expose Language Course creation');
assert.match(js,/if\(type==='language'&&!isAdmin\)return/,'direct Language Course form access must be blocked for non-admin users');
assert.match(js,/function adminLanguageAuthoring\(\)/,'admin language authoring mode must be explicit');
assert.match(js,/function beginLanguageAuthoring\(selection\)\{[\s\S]{0,160}if\(!isAdminActor\(\)\)return false/,'only an admin may enter language authoring mode');
assert.match(js,/const unlocked=adminLanguageAuthoring\(\)\|\|boxUnlocked/,'admin authoring must bypass learner box locks');
assert.match(js,/if\(authoring\)\{setLanguageAuthoringTarget\(\{li,step:1,box:1\}\);render\(\);return;\}/,'admin level browsing must not write learner progress');
assert.equal((js.match(/function lettersPage\(\)/g)||[]).length,1,'Letters/Video route must have exactly one implementation so admin authoring bypass is not shadowed');
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
assert.match(js,/label:pos\.li>0\?t\('video'\):t\('pronunciation'\)/,'A1 learning flow must expose pronunciation/writing rather than a letters page');

assert.match(js,/const LETTER_SPEECH = \{A:'ay',B:'bee'/,'letter audio must use spoken names');
assert.match(js,/function speakLetter\(letter\)/,'dedicated letter speech must remain');
assert.match(js,/function scoreLetterCanvas\(canvas,letter,kind,normalized=false\)/,'validated letter drawing must support guide tracing and unguided exam scoring');
assert.match(js,/coverage>=\.60&&precision>=\.58&&score>=\.64/,'letter tracing must reject poor shapes');
assert.match(js,/getCoalescedEvents/,'finger drawing smoothing must remain');
assert.match(js,/quadraticCurveTo/,'finger drawing must use smoothed strokes');
assert.match(js,/const LETTER_LEARNING_ORDER = \['D','B','F'/,'letter learning must begin with Arabic-English pronunciation correspondences');
assert.match(js,/const selectors=ordered\.map\(item=>/,'letter learning UI must follow pronunciation correspondence order');

assert.match(js,/name="studyType" value="courses"/,'language course creation must submit a supported backend study structure');
assert.doesNotMatch(js,/name="studyType" value="language"/,'language mode must not be sent as backend studyType');
assert.match(js,/dafatii:language-progress:/,'language progress must remain per course/user');
assert.match(js,/:v3/,'new assessment architecture must use v3 progress state');
assert.match(js,/legacyProgressKey/,'v2 learner progress must be migrated rather than discarded');

assert.match(js,/SpeechSynthesisUtterance/,'speech synthesis must remain functional');
assert.match(js,/SpeechRecognition\|\|window\.webkitSpeechRecognition/,'speech recognition must remain functional');
assert.match(js,/data-language-ui-switch/,'Arabic-English UI switch must remain');
assert.match(js,/targetLanguage:'English',baseLanguage:''/,'language learning must require an explicit main language');
assert.match(js,/function allowedBaseLanguages\(target\)/,'main-language eligibility must derive from the target language');
assert.match(js,/filter\(language=>languageIdentity\(language\)!==targetId\)/,'the main language must never equal the target language');
assert.match(js,/allowedBaseLanguages\(value\.targetLanguage\)\.includes\(value\.baseLanguage\)/,'stored same-language selections must be invalidated');
assert.match(js,/function learningLanguage\(state,li\)/,'course language bridge must resolve per level');
assert.match(js,/instruction:li>=4\?target:base/,'Level 5 must use the target course language');
assert.match(js,/data-language-base="Arabic"/,'Arabic must be available as a main learning language');
assert.match(js,/data-language-base="English"/,'English must be available as a main learning language');
assert.match(js,/!state\.baseLanguage&&page!=='language-home'/,'language selection must guard every learning route');
assert.match(js,/data-language-process-stage/,'learning content must render as a focused box process');
assert.match(js,/function bindLearningProcess\(\)/,'focused learning steps must be interactive');
assert.match(js,/data-exam-stepper/,'exams must use the focused question process');
assert.match(js,/function bindExamStepper\(\)/,'exam questions must advance one at a time');
assert.match(js,/const ARABIC_VOCABULARY =/,'English vocabulary must include Arabic meaning bridges');
assert.match(js,/const ARABIC_GRAMMAR =/,'English grammar must include Arabic explanations');
assert.match(js,/function vocabularyPairs\(state,pos,words\)/,'vocabulary must resolve source-to-target pairs');
assert.match(js,/function grammarBridge\(state,pos,data\)/,'grammar must resolve through the selected main language');
assert.match(js,/page==='pronunciation'\|\|page==='video'/,'pronunciation and video must remain target-language-only');
assert.match(js,/const responseLanguage=learningLanguage\(state,pos\.li\)\.target/,'video completion must validate the target language');

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
for (const selector of ['.letter-gate-page','.letter-gate-actions','.letter-sound-bridge','.letter-gate-exam-question','.letter-exam-draw-stage']) {
  assert.ok(css.includes(selector),'missing letter-prerequisite style '+selector);
}
assert.match(css,/@media\(max-width:820px\)\{[\s\S]*\.language-course-shell \.language-video-screen/,'new assessment/video surfaces must have mobile styling');
assert.match(css,/touch-action:none!important/,'validated letter canvases must remain touch-safe');

assert.match(js,/querySelector\('\.quiet-workspace>\.sub-nav'\)\?\.remove\(\)/,'language routes must remove the redundant workspace capsule');
assert.match(js,/toolbarTitle\.textContent=activeNav\?languageNavLabel/,'language routes must replace raw route names with clear labels');
assert.match(js,/querySelector\('\.quiet-return-button'\)\?\.remove\(\)/,'language routes must remove the floating return control');
assert.match(js,/shell\.dataset\.languagePage=current\.replace/,'language routes must expose a page identity for mobile themes');
assert.ok(css.includes('English course v11 · native mobile learning app'),'native mobile course layout must be present');
assert.ok(css.includes('Language course v12 · focused box process'),'focused box-process layout must be present');
assert.ok(css.includes('Language course v13 · contrastive source-to-target learning'),'contrastive language-learning layout must be present');
assert.ok(css.includes('.language-process-stage[hidden]'),'inactive learning stages must stay hidden');
assert.ok(index.includes('course-modes.css?v=20260921-3'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-3'),'course JS must be cache-busted');
assert.ok(index.indexOf('course-modes.js?v=20260921-3') > index.indexOf('content-controls.js'),'course modes must load after workspace wrappers');

console.log('course modes v6 tests passed');
