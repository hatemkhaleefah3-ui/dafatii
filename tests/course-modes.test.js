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
for (const route of ['language-home','language-letter-learn','language-letter-exam','language-letters','language-voice','language-grammar','language-video','language-examine']) {
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

assert.match(js,/function levelUnlocked\(state,li\)\{[\s\S]{0,220}if\(li===0\)return true/,'Level 1 must be the only unconditional course entry');
assert.match(js,/for\(let level=0;level<li;level\+\+\) if\(!isLevelPassed\(state,level\)\)return false/,'every higher level must require every prior level');
assert.match(js,/function stepUnlocked\(state,li,step\).*isStepPassed\(state,li,step-1\)/,'steps must unlock in order');
assert.match(js,/function boxUnlocked\(state,li,step,box\).*isBoxPassed\(state,li,step,box-1\)/,'boxes must unlock in order');
assert.match(js,/value\.entryLevel=0;[\s\S]{0,60}value\.challengeLevel=null/,'v7 migration must remove legacy level skipping and challenge state');
assert.doesNotMatch(js,/class="language-level-challenge-link"/,'Home must not expose a shortcut that can bypass box-by-box study');

assert.match(js,/data-language-start-zero/,'new learners must be offered Start from zero');
assert.match(js,/data-language-placement-start/,'new learners may run a diagnostic benchmark before the driven pathway');
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
assert.match(js,/placementRecommendedLevel\(score\)/,'diagnostic score must still calculate a benchmark level');
assert.match(js,/state\.entryLevel=0;state\.selectedLevel=0;state\.selectedStep=1;state\.selectedBox=1/,'diagnostic must never skip the required Level 1 start');
assert.match(js,/benchmark '\+CEFR\[li\]\.id[\s\S]{0,120}starts at A1/,'diagnostic result must report the benchmark while preserving the A1 start');
assert.match(js,/!letterGateRequired\(state\)&&state\.placementPending&&page!=='language-examine'/,'placement route must be guarded after the letter prerequisite');
assert.match(js,/!letterGateRequired\(state\)&&!state\.onboardingComplete&&!state\.placementPending&&page!=='language-home'/,'first enrollment choice must not be bypassable after the letter prerequisite');

assert.match(js,/function videoUnderstandingPage\(state,pos\)/,'dedicated YouTube Understanding page must exist');
assert.match(js,/youtubeUrl:''/,'default video lessons must wait for an admin-supplied YouTube URL');
assert.match(js,/video:'language-video'/,'Video Understanding must have its own course route and authoring lane');
assert.match(js,/name:'youtubeUrl',label:'YouTube URL'/,'admin video item forms must edit a YouTube URL field');
assert.match(js,/data-youtube-video/,'learner Video Understanding must render an external YouTube link');
assert.match(js,/data-video-watched/,'learner must explicitly confirm the YouTube video was watched');
assert.doesNotMatch(js,/data-play-language-video/,'Video Understanding must not use the old simulated video player');
assert.doesNotMatch(js,/name:'scenes'/,'video items must not contain narrated scene fields');
assert.match(js,/return out\.slice\(0,15\)/,'step exams must include a 15-question generated bank');
assert.match(js,/return out\.slice\(0,25\)/,'level exams must include a 25-question generated bank');
assert.match(js,/return out\.slice\(0,40\)/,'whole-language exam must include a 40-question generated bank');
for (const type of ['mcq','true-false','multi-select','fill','short-answer','speak','listen-choice','listen-fill','ordering']) {
  assert.ok(js.includes("type:'"+type+"'"),'natural exams missing question type '+type);
}
assert.match(js,/function examAnswerCorrect\(question,form,index\)/,'mixed exam types must use a shared scorer');
assert.match(js,/data-ordering=/,'sentence-order questions must render an interactive builder');
assert.match(js,/examTypeLabel/,'exam question types must be visibly labeled');
assert.match(js,/const LANGUAGE_PAGE_ITEM_TYPES = Object\.freeze\(\{[\s\S]*letters:\['words','writing'\][\s\S]*voice:\['pronunciation','dictation','speaking'\][\s\S]*grammar:\['rule','grammar-practice'\][\s\S]*video:\['video','response'\][\s\S]*examine:\[\]/,'every course page must enforce its own item-type boundary');
assert.match(js,/return pagePureItems\(page,items\)/,'stored/admin-authored content must be filtered through the page boundary at render time');
assert.match(js,/store\.pages\[key\]=pagePureItems\(selection\.page/,'admin authoring must not persist cross-lane item types');
assert.match(js,/if\(page==='examine'\)return \[\]/,'Examining must contain exam questions only, not lesson content cards');
assert.doesNotMatch(js,/id:'video-vocabulary'/,'YouTube Understanding must not contain a vocabulary lane item');
assert.doesNotMatch(js,/id:'video-guide'/,'YouTube Understanding must not contain a generic lesson-info item');
assert.match(js,/function lettersPage\(\)[\s\S]{0,180}return pronunciationPage\(state,pos\)/,'Vocabulary & Writing must remain its own lane at every level');
assert.match(js,/function videoPage\(\)[\s\S]{0,180}return videoUnderstandingPage\(state,pos\)/,'YouTube Understanding must remain a separate lane at every level');
assert.match(js,/responseLanguage:String\(courseMeta\(\)\.targetLanguage\|\|'English'\)/,'video responses must use the target course language');
assert.match(js,/const required=\['vocabulary','voice','grammar','video'\]/,'every level must require the same four learning lanes before its exam');
assert.match(js,/function videoResponseValid\(language,value\)[\s\S]{0,120}trim\(\)\.length>=3/,'local video gating must only require a response; Gemini judges understanding correctness');
assert.match(js,/value\.watchedVideos\[id\]=true/,'video must be fully watched before completion can unlock');
const navSpecStart=js.indexOf('const navSpec=['),navSpecEnd=js.indexOf('function icon(',navSpecStart);
assert.ok(navSpecStart>=0&&navSpecEnd>navSpecStart,'language navSpec must exist');
const navSpecText=js.slice(navSpecStart,navSpecEnd);
for (const route of ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine']) {
  assert.ok(navSpecText.includes("'"+route+"'"),'six-lane language nav missing '+route);
}
assert.equal((navSpecText.match(/\['language-/g)||[]).length,6,'language course must expose exactly six main navigation destinations');
const routesDecl=js.slice(js.indexOf('const LANGUAGE_ROUTES ='),js.indexOf('const LETTER_GATE_ROUTES ='));
assert.ok(!routesDecl.includes("'language-review'"),'Revision must not remain an active seventh course page');
assert.ok(navSpecText.indexOf("'language-home'") < navSpecText.indexOf("'language-letters'"),'Home must precede Vocabulary & Writing');
assert.ok(navSpecText.indexOf("'language-letters'") < navSpecText.indexOf("'language-voice'"),'Vocabulary & Writing must precede Listening & Talking');
assert.ok(navSpecText.indexOf("'language-voice'") < navSpecText.indexOf("'language-grammar'"),'Listening & Talking must precede Grammar & Rules');
assert.ok(navSpecText.indexOf("'language-grammar'") < navSpecText.indexOf("'language-video'"),'Grammar & Rules must precede YouTube Understanding');
assert.ok(navSpecText.indexOf("'language-video'") < navSpecText.indexOf("'language-examine'"),'YouTube Understanding must precede Examining');
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
assert.match(js,/pages:\['letters','voice','grammar','video'\]/,'generic content authoring must cover only the four lesson-content lanes; exams use dedicated controls');
assert.match(js,/getExamQuestions:selection=>examQuestionsFor/,'exam control must expose the resolved assessment question set');
assert.match(js,/saveExamQuestion/,'exam questions must support editing and adding');
assert.match(js,/emptyExamQuestions/,'exam controls must support removing all questions');
assert.match(js,/if\(!questions\.length\)return '<div class="language-exam-prereqs"/,'an emptied exam must become unavailable rather than auto-scoring');
assert.match(js,/\{route:'language-letters',label:t\('letters'\),key:'vocabulary'\}/,'box flow must begin with Vocabulary & Writing');
assert.match(js,/\{route:'language-video',label:t\('video'\),key:'video'\}/,'box flow must include YouTube Understanding before Examining');

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
assert.match(js,/page==='pronunciation'\|\|page==='video'/,'YouTube work must remain target-language-only while vocabulary can use the main-language bridge');
assert.match(js,/const responseLanguage=learningLanguage\(state,pos\.li\)\.target/,'video completion must validate the target language');


// Driven language course v8
assert.match(js,/const META_VERSION = 8/,'pure-lane/Gemini course architecture must use language progress metadata v8');
assert.match(js,/const LEVEL_LEARNING_SYSTEMS = \[/,'five level-specific learning systems must be declared');
for (const system of ['Word Builder','Sentence Builder','Connected English','Precision & Pressure','C1 / IELTS Readiness']) {
  assert.ok(js.includes(system),'missing level-specific learning system '+system);
}
for (const design of ['guided-cards','sentence-rails','connection-board','precision-grid','c1-studio']) {
  assert.ok(js.includes("design:'"+design+"'"),'missing unique level design '+design);
}
assert.match(js,/examStyle:'tricky'/,'Level 4 must introduce deliberately tricky assessment behavior');
assert.match(js,/examStyle:'high-discrimination'/,'Level 5 must use high-discrimination C1 assessment behavior');
assert.match(js,/This is preparation, not a guaranteed IELTS result/,'C1 target must not promise a guaranteed IELTS outcome');
assert.match(js,/const tricky=li>=3/,'tricky box exams must begin at Level 4');
assert.match(js,/const hardest=li>=4/,'Level 5 must have an additional C1 difficulty layer');
assert.match(js,/type:'speak'/,'every generated box exam bank must include spoken production');
assert.match(js,/data-exam-speak/,'spoken exam questions must expose a microphone action');
assert.match(js,/if\(type==='speak'\)return answerSimilarity/,'spoken production must be scored from the recognized transcript');
assert.match(js,/Speech recognition is unavailable/,'spoken exams must disclose the fallback limitation when browser recognition is unavailable');
assert.match(js,/Exam analysis/,'Home must show exam performance analysis');
assert.ok(js.includes("average+'% average'"),'Home analysis must calculate an exam-score average');
assert.match(js,/function migrateDrivenCourseV7/,'older learner progress must migrate into the driven lane model');
assert.match(js,/videoResponses:\{\},videoRatings:\{\},watchedVideos:\{\}/,'video understanding ratings must have durable learner state');
assert.match(js,/window\.DafatiiApi\.request\('\/language\/video-understanding'/,'YouTube understanding must be judged through the authenticated backend API');
assert.match(js,/\['bad','moderate','good','very good'\]\.includes\(rating\)/,'client must accept exactly the four requested Gemini rating values');
assert.match(js,/const accepted=rating!=='bad'/,'only bad must be rejected');
assert.match(js,/value\.modules\[id\]\.video=accepted/,'accepted Gemini ratings must unlock YouTube Understanding progression while bad keeps it incomplete');
assert.match(js,/Not accepted\. Rewatch the video, rewrite your understanding/,'bad must require the learner to redo the YouTube understanding response');
assert.doesNotMatch(js,/GEMINI_API_KEY/,'the Gemini API key must never be embedded in course-modes.js');
assert.match(js,/data-pronunciation-record/,'Listening & Talking must include a microphone pronunciation action');
assert.match(js,/data-letter-pronunciation-record/,'letter learning must include microphone pronunciation');
assert.match(js,/pronunciationPassed&&dictationPassed&&reversePassed/,'Listening & Talking completion must require pronunciation, listening and speaking');
assert.match(js,/upperResult\.valid&&lowerResult\.valid&&pronunciationPassed/,'letter learning completion must require drawing plus microphone pronunciation');
const vocabularyPageStart=js.indexOf('function pronunciationPage(state,pos){');
const vocabularyPageEnd=js.indexOf('function videoUnderstandingPage(state,pos){',vocabularyPageStart);
assert.ok(vocabularyPageStart>=0&&vocabularyPageEnd>vocabularyPageStart,'Vocabulary & Writing page renderer must exist');
assert.doesNotMatch(js.slice(vocabularyPageStart,vocabularyPageEnd),/data-speak=/,'Vocabulary & Writing must not contain listening/pronunciation audio controls');

assert.match(js,/const LEARNING_LANE_PREREQUISITES = \{[\s\S]*'language-voice':\['vocabulary'\][\s\S]*'language-grammar':\['vocabulary','voice'\][\s\S]*'language-video':\['vocabulary','voice','grammar'\]/,'learning lanes must unlock strictly in order');
assert.match(js,/learningLaneUnlocked\(state,pos,page\)/,'course routes must enforce learning-lane prerequisites');
assert.match(js,/if\(!learningLaneUnlocked\(state,pos,page\)\)\{setHash\(nextBoxRoute\(state,pos\)\);return;\}/,'out-of-order lane navigation must redirect to the next required lane');
assert.match(js,/let active=0,furthest=0/,'content item process must track the furthest reached item');
assert.match(js,/if\(index<=furthest\)show\(index\)/,'learners must not jump ahead to unseen content items');
assert.match(js,/data-language-module="vocabulary"/,'Vocabulary & Writing completion must have its own durable module state');
assert.match(js,/function learningAnalytics\(state,pos\)/,'Home must include progress/status analytics');
assert.match(js,/language-learning-analytics/,'Home analytics must render a dedicated status surface');
assert.match(js,/level-system-banner/,'learning pages must identify the active level-specific system');
assert.match(js,/state\.entryLevel=0;state\.selectedLevel=0/,'diagnostic benchmark must preserve the Level 1 start');
assert.match(js,/for\(let li=0;li<4;li\+\+\)if\(!isLevelPassed\(state,li\)\)/,'final language exam must require the complete Level 1–4 pathway');

for (const selector of [
  '.language-learning-analytics','.level-system-banner','.language-vocabulary-writing-page',
  '.level-system-1','.level-system-2','.level-system-3','.level-system-4','.level-system-5',
  '.language-nav-locked'
]) {
  assert.ok(css.includes(selector),'missing driven-course style '+selector);
}
assert.ok(css.includes('Language course v14 · driven six-lane progression'),'driven progression stylesheet block must be present');
assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/,'mobile course navigation must fit all six main destinations');
assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/,'desktop Home analytics must expose five status/analysis cells');
assert.ok(css.includes('.language-exam-speak'),'spoken exam controls must be styled');
for (const selector of ['.language-vocabulary-card','.language-pronunciation-target','.language-video-grade','.letter-pronunciation-check']) {
  assert.ok(css.includes(selector),'missing pure-lane/microphone/Gemini style '+selector);
}
assert.ok(css.includes('Language course v15 · pure lanes, microphone pronunciation, Gemini video grading'),'pure-lane Gemini stylesheet block must be present');

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
assert.ok(index.includes('course-modes.css?v=20260921-5'),'course CSS must be cache-busted');
assert.ok(index.includes('course-modes.js?v=20260921-5'),'course JS must be cache-busted');
assert.ok(index.indexOf('course-modes.js?v=20260921-5') > index.indexOf('content-controls.js'),'course modes must load after workspace wrappers');

console.log('course modes v8 pure-lane Gemini grading tests passed');
