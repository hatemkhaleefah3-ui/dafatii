(() => {
  'use strict';

  const META_VERSION = 3;
  const COURSE_TYPES = ['dafaa','personal','teaching','language'];
  const LANGUAGE_ROUTES = ['language-home','language-letters','language-voice','language-grammar','language-review','language-examine'];
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const LETTER_WORDS = {A:'apple',B:'book',C:'cat',D:'door',E:'egg',F:'fish',G:'green',H:'home',I:'ice',J:'juice',K:'key',L:'lamp',M:'moon',N:'name',O:'orange',P:'pen',Q:'queen',R:'room',S:'sun',T:'table',U:'umbrella',V:'voice',W:'water',X:'x-ray',Y:'yellow',Z:'zebra'};
  const LETTER_SPEECH = {A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'ef',G:'jee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'ar',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zee'};
  const TOTAL_LANGUAGE_BOXES = 5*26 + 4*5*25;
  const LANGUAGE_FUNCTIONS = ['introducing','identifying','describing','asking for information','answering precisely','comparing','sequencing','locating','expressing time','expressing quantity','stating preferences','expressing ability','expressing obligation','giving reasons','explaining results','expressing conditions','contrasting ideas','describing experience','making plans','giving instructions','stating opinions','supporting with evidence','correcting meaning','summarizing','reflecting'];
  const CEFR = [
    {
      id:'A1', title:'Foundation', ar:'الأساسيات', description:'Build a reliable base for everyday English: sounds, survival vocabulary, simple clauses and controlled writing.',
      topics:['introductions','family','numbers and time','home','food and drinks','daily routines','school','places in town','weather','clothes','health basics','transport'],
      grammar:[
        ['Be: am / is / are','Use be to identify, describe and locate people or things.','I am ready. She is at home.','Are they students?'],
        ['Subject pronouns','Use I, you, he, she, it, we, they before a finite verb.','She studies English.','They live nearby.'],
        ['Articles: a / an / the','Use a/an for one nonspecific countable noun and the for a specific known noun.','I need a pen. The pen is blue.','She ate an apple.'],
        ['Present simple','Use the base verb for habits; add -s/-es with he, she, it.','I study every evening.','He studies after dinner.'],
        ['Have / has','Use have/has for possession, family and features.','We have two lessons.','She has a new book.'],
        ['There is / there are','Use there is with singular and there are with plural nouns.','There is a library here.','There are three windows.'],
        ['Can / cannot','Use can + base verb for ability, permission and simple possibility.','I can read this.','Can you help me?'],
        ['This / that / these / those','Match the demonstrative with distance and number.','This book is mine.','Those shoes are new.'],
        ['Basic prepositions','Use in, on, at, under, next to and between to show place or time.','The keys are on the desk.','Class starts at nine.'],
        ['Question words','Use who, what, where, when, why and how to ask for specific information.','Where do you live?','How are you?']
      ],
      sounds:['alphabet names and shapes','short vowels /æ e ɪ ɒ ʌ/','long vowels and final e','common consonant pairs sh/ch/th','word stress in two-syllable words'],
      words:['hello','name','friend','family','morning','evening','school','teacher','student','book','house','room','water','bread','market','street','bus','today','tomorrow','happy','tired','small','large','near','far','help','learn','write','listen','speak']
    },
    {
      id:'A2', title:'Everyday Independence', ar:'الاستقلال اليومي', description:'Handle routine situations, describe past and future events, and write connected everyday messages.',
      topics:['shopping','travel plans','appointments','work and study','hobbies','restaurants','technology','neighborhoods','holidays','fitness','services','personal goals'],
      grammar:[
        ['Past simple','Use the past form for completed events at a finished time.','We visited the museum yesterday.','Did you call the office?'],
        ['Present continuous','Use be + -ing for actions happening now or temporary situations.','I am waiting for the bus.','They are studying this week.'],
        ['Going to','Use be going to for plans and evidence-based predictions.','I am going to practice tonight.','It is going to rain.'],
        ['Comparatives','Use -er or more to compare two things.','This route is faster.','The second task is more difficult.'],
        ['Superlatives','Use the -est or most form for the extreme member of a group.','It is the cheapest option.','She is the most experienced person here.'],
        ['Countable and uncountable nouns','Use many/few with countable nouns and much/little with uncountable nouns.','We have a few questions.','There is little time.'],
        ['Present perfect basics','Use have/has + past participle for life experience and recent results.','I have finished the task.','Have you ever flown abroad?'],
        ['Should / must / have to','Use modals and have to to express advice, obligation and rules.','You should rest.','We have to arrive early.'],
        ['First conditional','Use if + present, will + base verb for realistic future conditions.','If it rains, we will take a taxi.','I will call if I am late.'],
        ['Adverbs of frequency','Place usually, often, sometimes and never around the main verb correctly.','I usually walk to work.','She is often busy.']
      ],
      sounds:['past -ed endings','plural and third-person -s endings','sentence stress','weak forms of function words','linking consonants to vowels'],
      words:['receipt','reservation','journey','platform','schedule','appointment','borrow','return','recommend','prefer','enough','several','usually','recently','already','yet','healthy','exercise','service','repair','message','website','plan','decide','compare','expensive','comfortable','available','probably','experience']
    },
    {
      id:'B1', title:'Connected Communication', ar:'التواصل المترابط', description:'Explain experiences, opinions and reasons with connected speech, paragraph control and broader grammar.',
      topics:['education choices','workplace communication','media','environment','relationships','culture','problem solving','travel experiences','health decisions','money','public services','personal development'],
      grammar:[
        ['Present perfect vs past simple','Use present perfect for unfinished relevance and past simple for a finished past time.','I have worked here for two years.','I started in 2024.'],
        ['Past continuous','Use was/were + -ing for background actions and interrupted events.','I was studying when you called.','They were driving at midnight.'],
        ['Relative clauses','Use who, which, that, where and whose to identify or add information.','The teacher who helped me was patient.','This is the place where we met.'],
        ['Second conditional','Use if + past, would + base verb for hypothetical present/future situations.','If I had more time, I would read more.','What would you do if you moved abroad?'],
        ['Passive voice basics','Use be + past participle when the action or result matters more than the agent.','The form is sent by email.','The road was closed yesterday.'],
        ['Gerunds and infinitives','Learn verb patterns such as enjoy doing, decide to do and want to do.','I enjoy learning languages.','We decided to leave early.'],
        ['Reported speech basics','Shift tense and reference when reporting what someone said.','She said that she was tired.','He told me to wait.'],
        ['Modal deduction','Use must, might, may and cannot to express degrees of certainty.','They must be busy.','It might arrive today.'],
        ['Linking clauses','Use although, however, because, so, while and therefore to show logical relationships.','Although it was late, we continued.','The train was delayed, so we called.'],
        ['Future forms','Choose will, going to and present continuous according to prediction, plan and arrangement.','I will probably stay home.','I am meeting Sam at six.']
      ],
      sounds:['contrastive sentence stress','thought groups and pausing','connected speech reductions','intonation for certainty and politeness','consonant clusters'],
      words:['evidence','opinion','advantage','disadvantage','solution','responsibility','community','environment','resource','budget','deadline','feedback','improve','manage','avoid','achieve','although','however','therefore','likely','issue','benefit','challenge','decision','behavior','culture','policy','relationship','career','confidence']
    },
    {
      id:'B2', title:'Fluent Independence', ar:'الاستقلال بطلاقة', description:'Discuss abstract issues, evaluate evidence, adapt register and produce coherent detailed spoken and written English.',
      topics:['higher education','professional projects','science and society','digital privacy','globalization','leadership','ethics','innovation','public policy','research','art and criticism','career strategy'],
      grammar:[
        ['Third and mixed conditionals','Use third conditionals for unreal past results and mixed forms for cross-time consequences.','If I had prepared, I would have passed.','If I had accepted the job, I would live there now.'],
        ['Advanced passive structures','Use passive reporting and modal passives to manage information focus.','The results are expected to improve.','The proposal should have been reviewed.'],
        ['Participle clauses','Reduce clauses with present or past participles when the subject is clear.','Having finished the report, we left.','Designed for students, the app is easy to use.'],
        ['Cleft sentences','Use it-clefts and wh-clefts to focus information.','It was the timing that caused the problem.','What we need is a clearer plan.'],
        ['Modal perfects','Use must/might/could/should + have + participle for past deduction and evaluation.','She must have missed the message.','We should have checked earlier.'],
        ['Inversion after negative adverbials','Invert auxiliary and subject after restrictive negative expressions for formal emphasis.','Rarely have I seen such a result.','Not only did it fail, but it also caused delays.'],
        ['Complex noun phrases','Pack information with premodifiers, postmodifiers and embedded clauses while preserving clarity.','The recently published university funding report raised concerns.','The strategy proposed by the committee needs revision.'],
        ['Discourse markers','Use nevertheless, moreover, whereas, consequently and in contrast to organize arguments.','The evidence is limited; nevertheless, the trend is useful.','Costs fell, whereas demand increased.'],
        ['Future in the past','Use would, was going to and was about to for future events viewed from a past point.','I knew the meeting would be difficult.','We were about to leave when it rang.'],
        ['Subjunctive and formal recommendation','Use base forms after formal recommendations and demands.','They recommended that he attend.','It is essential that the data be checked.']
      ],
      sounds:['intonation across long clauses','prominence and information focus','assimilation and elision','register-sensitive rhythm','stress shifts in word families'],
      words:['evaluate','assumption','implication','constraint','framework','sustainable','controversial','perspective','justify','interpret','reliable','significant','approximate','nevertheless','consequently','whereas','criterion','strategy','implementation','stakeholder','privacy','regulation','innovation','bias','methodology','outcome','priority','complexity','efficient','credible']
    },
    {
      id:'C1', title:'Advanced Precision', ar:'الدقة المتقدمة', description:'Operate with C1-level precision: nuanced argument, rhetorical control, idiomatic flexibility and sophisticated academic/professional language.',
      topics:['argumentation','academic research','systems thinking','economic trade-offs','law and institutions','technology governance','literary analysis','negotiation','risk communication','organizational design','public discourse','advanced writing'],
      grammar:[
        ['Information structure and fronting','Reorder clauses to control theme, focus and rhetorical progression without losing grammatical clarity.','What the analysis overlooks is implementation risk.','Only after the review did the weakness become obvious.'],
        ['Hedging and epistemic stance','Calibrate claims with seem, appear, arguably, may, tends to and evidence-sensitive qualifiers.','The findings appear to support a cautious interpretation.','This may partly reflect sampling bias.'],
        ['Nominalization and academic density','Convert processes into nouns selectively to build formal cohesion while avoiding opaque prose.','The committee evaluated the policy. / The committee’s evaluation of the policy...','Excessive nominalization can obscure agency.'],
        ['Advanced complementation','Control reporting verbs with that-clauses, infinitives, gerunds and prepositional complements.','The authors acknowledge having underestimated the cost.','They contend that the model remains valid.'],
        ['Concessive and adversative architecture','Build nuanced contrast with albeit, notwithstanding, much as, while and for all.','Much as I agree with the aim, the mechanism is weak.','The approach is useful, albeit expensive.'],
        ['Ellipsis and substitution','Avoid repetition through controlled omission and substitutes such as so, do so and one/ones.','Some expected growth; others did not.','The team promised to revise the plan and did so.'],
        ['Advanced relative and supplementary clauses','Use sentential relatives, preposition + which/whom and reduced relatives precisely.','The deadline was extended, which relieved the team.','The framework within which we work is changing.'],
        ['Register and modality','Choose modal distance, politeness and obligation forms to match authority, risk and interpersonal stance.','You may wish to reconsider the assumption.','The procedure is to be followed exactly.'],
        ['Rhetorical conditionals','Use inversion, provided that, assuming that and but for to compress sophisticated conditions.','Had the evidence been stronger, the conclusion would differ.','But for the delay, the project would be complete.'],
        ['Punctuation as syntax','Use colons, semicolons, dashes and parenthetical punctuation to expose logical structure rather than decorate prose.','The result was clear: the model needed revision.','Two constraints remained—time and data quality.']
      ],
      sounds:['rhetorical prominence and deaccenting','intonation for stance and implication','advanced connected-speech parsing','stress in Latinate academic vocabulary','presentation pacing and chunking'],
      words:['nuance','premise','inference','counterargument','corroborate','qualify','ambiguous','coherent','salient','robust','tentative','discourse','rhetoric','paradigm','trade-off','mechanism','causality','marginal','institutional','normative','empirical','substantiate','synthesize','reconcile','articulate','concede','contingent','plausible','distinction','precision']
    }
  ];

  const COPY = {
    en:{
      home:'Home',letters:'Letters & writing',video:'Video understanding',voice:'Voice lab',grammar:'Grammar',review:'Revision',examine:'Examine',
      complete:'Mark section complete',completed:'Completed',locked:'Locked',listen:'Play voice',check:'Check answer',
      speak:'Speak this sentence',start:'Start recognition',notes:'My notes',save:'Save notes',level:'Level',step:'Step',box:'Box',
      pass:'Pass mark: 80%',takeExam:'Take exam',submitExam:'Submit exam',welcome:'Welcome',resume:'Resume learning',
      changeLevel:'Change level',progress:'Course progress',current:'Current',available:'Available',passed:'Passed',
      lettersIntro:'Letter, pronunciation, spelling and writing practice',voiceIntro:'Dictation and reverse speaking practice',
      grammarIntro:'Grammar, naming, spelling and typing rules',reviewIntro:'Retrieval, learning tricks and durable notes',
      examIntro:'Examine adapts to your position: box exam, step exam, level exam, or the final whole-language exam. Level challenges are always available.'
    },
    ar:{
      home:'الرئيسية',letters:'الحروف والكتابة',video:'فهم الفيديو',voice:'مختبر الصوت',grammar:'القواعد',review:'المراجعة',examine:'الاختبار',
      complete:'إكمال هذا الجزء',completed:'مكتمل',locked:'مغلق',listen:'تشغيل الصوت',check:'تحقق من الإجابة',
      speak:'انطق هذه الجملة',start:'ابدأ التعرّف على الصوت',notes:'ملاحظاتي',save:'حفظ الملاحظات',level:'المستوى',step:'الخطوة',box:'الصندوق',
      pass:'درجة النجاح: 80٪',takeExam:'ابدأ الاختبار',submitExam:'إرسال الاختبار',welcome:'مرحباً',resume:'متابعة التعلّم',
      changeLevel:'تغيير المستوى',progress:'تقدم الدورة',current:'الحالي',available:'متاح',passed:'مجتاز',
      lettersIntro:'تدريب الحروف والنطق والإملاء والكتابة',voiceIntro:'إملاء صوتي وتدريب عكسي على النطق',
      grammarIntro:'القواعد والتسمية والإملاء والكتابة',reviewIntro:'استرجاع ومهارات تعلّم وملاحظات ثابتة',
      examIntro:'تتغير صفحة الاختبار حسب موقعك: اختبار صندوق أو خطوة أو مستوى أو اختبار اللغة الكامل. ويمكن تحدي أي مستوى في أي وقت.'
    }
  };

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lang = () => (typeof interfaceLanguage === 'function' ? interfaceLanguage() : document.documentElement.lang) === 'ar' ? 'ar' : 'en';
  const t = key => COPY[lang()][key] || COPY.en[key] || key;
  const keyBox = (level,step,box) => level + ':' + step + ':' + box;
  const keyStep = (level,step) => level + ':' + step;
  const arrayUnique = values => [...new Set(values)];

  function readSuite(){
    const value=window.DafatiiCourses.readJSON('dafatii:studentSuite:v1',{});
    return value && typeof value==='object' && !Array.isArray(value) ? value : {};
  }
  function writeSuite(value){ window.DafatiiCourses.writeJSON('dafatii:studentSuite:v1',value); return value; }
  function courseMeta(){ return readSuite().courseMeta || {}; }
  function courseType(){ return String(courseMeta().courseType || 'dafaa'); }
  function isLanguage(){ return courseType()==='language'; }
  function isAdminActor(){
    const actor=window.DafatiiCourses?.actor||window.DafatiiAuth?.user;
    return actor?.platformRole==='admin';
  }

  function defaultLanguageLearning(){
    return {
      version:META_VERSION,targetLanguage:'English',selectedLevel:0,selectedStep:1,selectedBox:1,
      passedBoxes:[],passedSteps:[],passedLevels:[],languagePassed:false,
      modules:{},letterProgress:{},activeLetterByStep:{},videoResponses:{},watchedVideos:{},notes:{},examHistory:[],
      onboardingComplete:false,placementPending:false,placementResult:null,entryLevel:0,challengeLevel:null
    };
  }
  const progressKey=()=> 'dafatii:language-progress:'+String(window.DafatiiCourses.active().id||'none')+':v3';
  const legacyProgressKey=()=> 'dafatii:language-progress:'+String(window.DafatiiCourses.active().id||'none')+':v2';
  function migrateLegacyLanguage(value){
    value.version=META_VERSION;
    value.passedSteps=[];
    value.passedLevels=[];
    for(let li=0;li<CEFR.length;li++){
      const count=li===0?26:25;
      for(let step=1;step<=5;step++){
        let complete=true;
        for(let box=1;box<=count;box++) if(!value.passedBoxes.includes(keyBox(CEFR[li].id,step,box))){complete=false;break;}
        if(complete)value.passedSteps.push(keyStep(CEFR[li].id,step));
      }
      if([1,2,3,4,5].every(step=>value.passedSteps.includes(keyStep(CEFR[li].id,step))))value.passedLevels.push(CEFR[li].id);
    }
    value.languagePassed=value.passedLevels.includes('C1');
    value.videoResponses={};value.watchedVideos={};
    value.onboardingComplete=true;value.placementPending=false;value.placementResult=null;value.entryLevel=0;value.challengeLevel=null;
    return value;
  }
  function languageState(){
    let stored=window.DafatiiData.readJSON(progressKey(),null);
    if(!stored){
      const legacy=window.DafatiiData.readJSON(legacyProgressKey(),null);
      if(legacy&&typeof legacy==='object'&&!Array.isArray(legacy)){
        stored=migrateLegacyLanguage(legacy);
        window.DafatiiData.writeJSON(progressKey(),stored);
      }
    }
    const value=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:defaultLanguageLearning();
    value.version=META_VERSION;
    value.passedBoxes=Array.isArray(value.passedBoxes)?value.passedBoxes:[];
    value.passedSteps=Array.isArray(value.passedSteps)?value.passedSteps:[];
    value.passedLevels=Array.isArray(value.passedLevels)?value.passedLevels:[];
    value.languagePassed=Boolean(value.languagePassed);
    value.modules=value.modules&&typeof value.modules==='object'?value.modules:{};
    value.letterProgress=value.letterProgress&&typeof value.letterProgress==='object'?value.letterProgress:{};
    value.activeLetterByStep=value.activeLetterByStep&&typeof value.activeLetterByStep==='object'?value.activeLetterByStep:{};
    value.videoResponses=value.videoResponses&&typeof value.videoResponses==='object'?value.videoResponses:{};
    value.watchedVideos=value.watchedVideos&&typeof value.watchedVideos==='object'?value.watchedVideos:{};
    value.notes=value.notes&&typeof value.notes==='object'?value.notes:{};
    value.examHistory=Array.isArray(value.examHistory)?value.examHistory:[];
    value.onboardingComplete=Boolean(value.onboardingComplete);
    value.placementPending=Boolean(value.placementPending);
    value.entryLevel=Math.min(4,Math.max(0,Number(value.entryLevel)||0));
    value.challengeLevel=Number.isInteger(value.challengeLevel)?value.challengeLevel:null;
    return value;
  }
  function updateLanguage(mutator){
    const state=languageState();
    mutator(state);
    window.DafatiiData.writeJSON(progressKey(),state);
    return state;
  }

  function wrapCourseCreation(){
    if(!window.DafatiiCourses || window.DafatiiCourses.__courseModesWrapped) return;
    const api=window.DafatiiCourses;
    const originalCreate=api.createCourse.bind(api);
    const originalRoomSeeds=api.roomSeeds.bind(api);
    api.createCourse=async input => {
      const type=COURSE_TYPES.includes(input.courseType)?input.courseType:'dafaa';
      if(type==='language'&&!isAdminActor())throw new Error('Administrator access is required for Language Course creation.');
      const course=await originalCreate(input);
      const suite=readSuite();
      suite.courseMeta={
        version:META_VERSION,courseType:type,targetLanguage:type==='language'?(input.targetLanguage||'English'):'',
        studyType:type==='language'?'courses':(input.studyType||'courses')
      };
      if(type==='language'){
        const initialProgress=defaultLanguageLearning();
        initialProgress.targetLanguage=input.targetLanguage||'English';
        window.DafatiiData.writeJSON('dafatii:language-progress:'+String(course.id)+':v3',initialProgress);
        window.DafatiiCourses.writeJSON('dafatii:subjects',[]);
        window.DafatiiCourses.writeJSON('dafatii:lectures',{});
        window.DafatiiCourses.writeJSON('dafatii:chatState:v1',{conversations:[],selected:{private:'',group:'',unknown:''},reported:[],blocked:[]});
      }
      if(type==='personal'){
        window.DafatiiCourses.writeJSON('dafatii:chatState:v1',{conversations:[],selected:{private:'',group:'',unknown:''},reported:[],blocked:[]});
      }
      writeSuite(suite);
      return course;
    };
    api.roomSeeds=() => courseType()==='personal' ? [{
      id:'personal-focus-room',name:'My Focus Room',subject:'Personal course',visibility:'private',pin:'',
      description:'A private single-room study studio for deep work, notes, materials and focused sessions.',
      vibe:'Deep focus',members:1,online:1,capacity:1,streak:0,accent:'✦',tags:['Private','Personal','Focus']
    }] : originalRoomSeeds();
    api.__courseModesWrapped=true;
  }

  function sheet(title,body){
    const root=document.getElementById('overlay-root');
    if(!root) return () => {};
    root.innerHTML='<div class="entity-sheet-overlay suite-overlay course-mode-overlay" id="course-mode-overlay"><section class="entity-sheet suite-sheet course-sheet course-mode-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle" aria-hidden="true"></div><div class="entity-sheet-head"><div><small>Course setup</small><h2>'+esc(title)+'</h2></div><button class="icon-btn" id="course-mode-close" type="button" aria-label="Close">×</button></div>'+body+'</section></div>';
    const close=()=>{root.innerHTML='';};
    document.getElementById('course-mode-close').onclick=close;
    document.getElementById('course-mode-overlay').onclick=e=>{if(e.target.id==='course-mode-overlay')close();};
    return close;
  }

  function openTypeChooser(){
    const cards=[
      ['dafaa','◇','Create Dafaa','Full Dafatii course with subjects, calendar, study rooms and chat.','إنشاء دفعة','دورة دفاتري كاملة بالمواد والتقويم وغرف الدراسة والمحادثة.'],
      ['personal','◎','Create Personal course','Private solo course. No Chat app; Study Rooms becomes one focused personal room.','إنشاء دورة شخصية','دورة فردية بلا تطبيق المحادثة ومع غرفة دراسة شخصية واحدة.'],
      ['teaching','▣','Create Teaching course','The existing course workspace prepared for teaching and course management.','إنشاء دورة تدريس','مساحة الدورة الحالية مع أدوات التدريس والإدارة.'],
      ['language','Aa','Create Language course','A dedicated language-learning system with gated CEFR progression and six specialized pages.','إنشاء دورة لغة','نظام مستقل لتعلم اللغة مع تقدم CEFR وست صفحات متخصصة.']
    ].filter(card=>card[0]!=='language'||isAdminActor());
    sheet(lang()==='ar'?'إنشاء دورة':'Create a course','<div class="course-type-grid">'+cards.map(card=>{
      const title=lang()==='ar'?card[4]:card[2],desc=lang()==='ar'?card[5]:card[3];
      return '<button class="course-type-card '+card[0]+'" type="button" data-course-type="'+card[0]+'"><span>'+card[1]+'</span><div><strong>'+esc(title)+'</strong><p>'+esc(desc)+'</p></div><b>›</b></button>';
    }).join('')+'</div>');
    document.querySelectorAll('[data-course-type]').forEach(button=>button.onclick=()=>openCourseForm(button.dataset.courseType));
  }

  function studyTypeOptions(){
    return [['courses','Courses'],['chapters','Chapters'],['systems','Systems'],['blocks','Blocks']].map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');
  }

  function openCourseForm(type){
    const templates=window.DafatiiCourses.templates();
    const actor=window.DafatiiCourses.actor||window.DafatiiAuth.user;
    const isAdmin=actor && actor.platformRole==='admin';
    if(type==='language'&&!isAdmin)return;
    const isLang=type==='language',isPersonal=type==='personal';
    const defaultName=isLang?'English Learning':isPersonal?'My Personal Course':'';
    const personalSecret=isPersonal
      ? (crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,20):(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).slice(0,20))
      : '';
    const templateField=isLang?'<input type="hidden" name="templateName" value="Computer Science">':'<div class="field"><label>Content template</label><select name="templateName">'+templates.map(name=>'<option>'+esc(name)+'</option>').join('')+'</select></div>';
    const studyField=isLang?'<input type="hidden" name="studyType" value="courses"><div class="field"><label>Target language</label><select name="targetLanguage"><option value="English" selected>English · الإنجليزية</option></select><p class="auth-note">Five levels · 5 steps per level · A1 has 26 boxes per step (Letters + 25 lessons) · A2–C1 have 25 boxes per step · 630 boxes total.</p></div>':'<div class="field"><label>Study structure</label><select name="studyType">'+studyTypeOptions()+'</select></div>';
    const visibility=isPersonal
      ? '<input type="hidden" name="visibility" value="private"><div class="field"><label>Visibility</label><div class="course-private-lock">Personal · only this account uses the workspace</div></div>'
      : isAdmin
        ? '<div class="field"><label>Visibility</label><select name="visibility"><option value="public">Public</option><option value="private">Private by code</option></select></div>'
        : '<input type="hidden" name="visibility" value="private"><div class="field"><label>Visibility</label><div class="course-private-lock">Private · your academic profile remains protected</div></div>';
    const pricing=isPersonal
      ? '<input type="hidden" name="pricing" value="free"><input type="hidden" name="priceMinor" value="0">'
      : '<div class="field"><label>Pricing</label><select name="pricing"><option value="free">Free</option><option value="paid">Paid</option></select></div><div class="field"><label>Price (minor units)</label><input name="priceMinor" type="number" min="0" value="0"></div>';
    const joinPolicy=isPersonal
      ? '<input type="hidden" name="joinPolicy" value="approval">'
      : '<div class="field"><label>Join policy</label><select name="joinPolicy"><option value="approval">Needs acceptance</option><option value="direct">Direct join</option></select></div>';
    const access=isPersonal
      ? '<input type="hidden" name="accessCode" value="'+esc(personalSecret)+'"><div class="course-private-lock">Solo mode: Chat is disabled and Study Rooms is replaced by one private Focus Room.</div>'
      : '<div class="field"><label>Private access code</label><input name="accessCode" type="password" minlength="6" maxlength="64" '+(isAdmin?'':'required')+'></div>';
    const adminMetadata=isAdmin?'<div class="field"><label>Learning field</label><input name="learningField" maxlength="80" value="'+(isLang?'Languages':'')+'"></div><div class="field"><label>Difficulty</label><select name="difficultyLevel"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>':'';
    const title={dafaa:'Create Dafaa',personal:'Create Personal course',teaching:'Create Teaching course',language:'Create Language course'}[type]||'Create course';
    const close=sheet(title,'<form id="course-mode-form"><input type="hidden" name="courseType" value="'+esc(type)+'"><div class="field"><label>Course name</label><input name="name" maxlength="120" value="'+esc(defaultName)+'" required></div>'+templateField+studyField+'<div class="suite-form-grid"><div class="field"><label>Institution</label><input name="institution" maxlength="160"></div>'+(isAdmin?'<div class="field"><label>Stage</label><select name="stage"><option value="university" selected>Higher education</option><option value="independent">Independent</option></select></div>':'<input type="hidden" name="stage" value="university">')+pricing+visibility+joinPolicy+adminMetadata+'</div>'+access+'<button class="btn btn-primary auth-submit" type="submit">Create course</button><p class="auth-note" id="course-mode-status"></p></form>');
    const form=document.getElementById('course-mode-form');
    form.onsubmit=async event=>{
      event.preventDefault();
      const data=Object.fromEntries(new FormData(form));
      data.priceMinor=Number(data.priceMinor||0);
      const status=document.getElementById('course-mode-status'),submit=form.querySelector('button[type=submit]');
      submit.disabled=true;status.textContent=isLang?'Building the English curriculum…':'Creating secure course workspace…';
      try{
        await window.DafatiiCourses.createCourse(data);
        close();
        setHash(type==='language'?'language-home':'dashboard/overview');
      }catch(error){status.textContent=error.message;submit.disabled=false;}
    };
  }

  function installCreateInterceptor(){
    document.addEventListener('click',event=>{
      const button=event.target.closest && event.target.closest('#course-add');
      if(!button)return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openTypeChooser();
    },true);
  }

  function boxCount(li){ return li===0 ? 26 : 25; }
  function firstLearningBox(li){ return li===0 ? 2 : 1; }
  function isLetterBox(li,box){ return li===0 && box===1; }
  function letterProgressKey(li,step){ return keyStep(CEFR[li].id,step); }
  function isBoxPassed(state,li,step,box){ return state.passedBoxes.includes(keyBox(CEFR[li].id,step,box)); }
  function isStepPassed(state,li,step){ return state.passedSteps.includes(keyStep(CEFR[li].id,step)); }
  function isLevelPassed(state,li){ return state.passedLevels.includes(CEFR[li].id); }
  function levelUnlocked(state,li){
    const entry=Math.min(4,Math.max(0,Number(state.entryLevel)||0));
    if(li<entry)return false;
    if(li===entry)return true;
    for(let level=entry;level<li;level++) if(!isLevelPassed(state,level))return false;
    return true;
  }
  function stepUnlocked(state,li,step){ return levelUnlocked(state,li) && (step===1 || isStepPassed(state,li,step-1)); }
  function boxUnlocked(state,li,step,box){ return stepUnlocked(state,li,step) && (box===1 || isBoxPassed(state,li,step,box-1)); }

  function clampSelection(state){
    const entry=Math.min(4,Math.max(0,Number(state.entryLevel)||0));
    let li=Math.min(4,Math.max(0,Number(state.selectedLevel)||entry));
    if(!levelUnlocked(state,li))li=entry;
    let step=Math.min(5,Math.max(1,Number(state.selectedStep)||1));
    while(step>1&&!stepUnlocked(state,li,step))step--;
    let box=Math.min(boxCount(li),Math.max(1,Number(state.selectedBox)||1));
    while(box>1&&!boxUnlocked(state,li,step,box))box--;
    state.selectedLevel=li;state.selectedStep=step;state.selectedBox=box;
    return {li,step,box};
  }

  function pickWrapped(array,start,count){
    const out=[];
    for(let i=0;i<count;i++) out.push(array[(start+i)%array.length]);
    return out;
  }
  function boxData(li,step,box){
    const level=CEFR[li],normalIndex=Math.max(0,box-firstLearningBox(li)),seed=(step-1)*25+normalIndex;
    const topic=level.topics[seed%level.topics.length];
    const grammar=level.grammar[seed%level.grammar.length];
    const languageFunction=LANGUAGE_FUNCTIONS[normalIndex%LANGUAGE_FUNCTIONS.length];
    const phase=['recognition','controlled production','connected use','independent use','transfer'][step-1];
    const words=pickWrapped(level.words,(seed*3+step)%level.words.length,7);
    const sound=level.sounds[seed%level.sounds.length];
    const frames=[
      ['I practice '+topic+' with '+words[0]+' and '+words[1]+'.','Please say: '+words[2]+' is important for my '+topic+'.'],
      ['Yesterday I used '+words[0]+' while working on '+topic+', and today I am improving '+words[1]+'.','Explain why '+words[2]+' is useful when discussing '+topic+'.'],
      ['Although '+topic+' can be challenging, '+words[0]+' helps me make a better '+words[1]+'.','Give a connected explanation of '+topic+' using '+words[2]+' and '+words[3]+'.'],
      ['A credible discussion of '+topic+' should evaluate '+words[0]+' as well as its '+words[1]+'.','Summarize a balanced position on '+topic+' and justify one '+words[2]+'.'],
      ['A nuanced account of '+topic+' should distinguish the central '+words[0]+' from a merely '+words[1]+' consideration.','Articulate a defensible position on '+topic+', qualify its main '+words[2]+', and acknowledge one counterargument.']
    ][li];
    return {
      level:level.id,step,box,topic,languageFunction,phase,title:'Box '+box+' · '+topic+' · '+languageFunction,
      goal:'Complete this '+phase+' lesson for '+languageFunction+': pronunciation & writing, voice, grammar, revision and the dedicated exam.',
      pronunciationFocus:sound+' · '+languageFunction,pronunciationWords:words.slice(0,6),
      writingPrompt:'For '+phase+', practice '+languageFunction+': write two clear sentences about '+topic+' using '+words[0]+' and '+words[1]+'. Apply '+grammar[0]+'.',
      voicePrompt:frames[0]+' The communication focus is '+languageFunction+'.',reversePrompt:frames[1]+' Use it for '+languageFunction+'.',grammarTitle:grammar[0],grammarRule:grammar[1],grammarExample1:grammar[2],grammarExample2:grammar[3],
      naming:'Naming rule: prefer a clear concrete noun first, then add only the modifiers needed to identify it in context.',
      typing:li<2?'Writing rule: start sentences with a capital letter, separate words with one space, and close complete statements with punctuation.':'Writing rule: use punctuation and paragraph boundaries to expose syntax, information structure and logical relations rather than merely marking pauses.',
      words, trick:['Say it, cover it, retrieve it, then check it.','Alternate recognition with production instead of rereading.','Compress the idea into one sentence, then expand it from memory.','Contrast a correct example with a near-miss and explain the difference.','Rephrase the idea twice: once plainly and once in formal C1 register.'][li],
      recall:'Without looking back, explain '+grammar[0]+' and use '+words[0]+', '+words[1]+' and '+words[2]+' to perform '+languageFunction+' during '+phase+'.'
    };
  }

  function videoLessonData(li,step,box){
    const data=boxData(li,step,box);
    const query=['English',CEFR[li].id,data.topic,data.grammarTitle,'listening lesson'].join(' ');
    return {
      id:keyBox(CEFR[li].id,step,box),
      title:data.title,
      youtubeUrl:'https://www.youtube.com/results?search_query='+encodeURIComponent(query),
      responseLanguage:li<=2?'Arabic':'English'
    };
  }

  const LANGUAGE_CONTENT_PAGE_ROUTES = {
    letters:'language-letters',voice:'language-voice',grammar:'language-grammar',review:'language-review',examine:'language-examine'
  };
  const languageContentStoreKey=()=> 'dafatii:language-authoring:v1';
  let languageAuthoringTarget=null;
  function languageContentStore(){
    const raw=window.DafatiiCourses.readJSON(languageContentStoreKey(),{})||{};
    return {
      pages:raw.pages&&typeof raw.pages==='object'?raw.pages:{},
      exams:raw.exams&&typeof raw.exams==='object'?raw.exams:{}
    };
  }
  function writeLanguageContentStore(store){
    if(!isAdminActor())throw new Error('Administrator access is required for Language Course authoring.');
    window.DafatiiCourses.writeJSON(languageContentStoreKey(),store);
    return store;
  }
  function contentPageKey(li,step,box,page){return CEFR[li].id+':'+step+':'+box+':'+page;}
  function examStoreKey(ctx){return ctx.scope+':'+CEFR[ctx.li].id+':'+ctx.step+':'+ctx.box;}
  function contentItemId(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}
  function adminLanguageAuthoring(){return isAdminActor()&&Boolean(languageAuthoringTarget);}
  function normalizeAuthoringTarget(selection={}){
    const li=Math.min(4,Math.max(0,Number(selection.li)||0));
    const step=Math.min(5,Math.max(1,Number(selection.step)||1));
    const box=Math.min(boxCount(li),Math.max(1,Number(selection.box)||1));
    return {li,step,box};
  }
  function setLanguageAuthoringTarget(selection={}){
    if(!isAdminActor())return false;
    languageAuthoringTarget=normalizeAuthoringTarget({...languageAuthoringTarget,...selection});
    window.dispatchEvent(new CustomEvent('dafatii:languageauthoringtarget',{detail:{...languageAuthoringTarget}}));
    return true;
  }
  function activeLanguagePosition(state){return adminLanguageAuthoring()?{...languageAuthoringTarget}:clampSelection(state);}
  function languagePageName(page,li){
    if(page==='letters')return li===0?'Letters & writing':'Video understanding';
    return {voice:'Voice lab',grammar:'Grammar',review:'Revision',examine:'Examine'}[page]||page;
  }
  function defaultLanguageContentItems(li,step,box,page){
    const data=isLetterBox(li,box)?null:boxData(li,step,box);
    if(page==='letters'&&li===0&&isLetterBox(li,box)){
      return [
        {id:'letter-purpose',type:'info',eyebrow:'Letters box',title:'Learn each English letter separately',body:'Hear the letter name, study uppercase and lowercase forms, then trace both accurately before moving forward.'},
        {id:'letter-method',type:'info',eyebrow:'Learning method',title:'Listen · Look · Draw · Check',body:'Hear the isolated letter name, inspect both forms, draw uppercase and lowercase separately, and repeat any weak form before continuing.'},
        {id:'letter-phonics',type:'info',eyebrow:'Phonics',title:'Connect names, shapes and sounds',body:'Letter names identify symbols; example words help connect each symbol to a common English sound. Complete A–Z in every A1 step.'}
      ];
    }
    if(!data&&page!=='examine')return [];
    if(page==='letters'&&li===0){
      return [
        {id:'sound-focus',type:'sound',eyebrow:'Pronunciation focus',title:data.pronunciationFocus,body:'Hear the target sound inside meaningful English, repeat slowly, then repeat at natural speed.',audioText:data.voicePrompt},
        {id:'pronunciation-words',type:'words',eyebrow:'Target words',title:'Sound set for this box',body:'Listen to every target word, then say it without looking at the written model.',words:data.pronunciationWords},
        {id:'micro-dialogue',type:'info',eyebrow:'Micro dialogue',title:'Use pronunciation inside meaning',body:'Speaker A: '+data.grammarExample1+' Speaker B: '+data.grammarExample2},
        {id:'writing-task',type:'writing',eyebrow:'Writing',title:'Write, then read it aloud',body:data.writingPrompt,placeholder:'Write 3–5 complete sentences here.'},
        {id:'pronunciation-recall',type:'info',eyebrow:'Quick recall',title:'Retrieve before moving on',body:'Without looking back, say the target sound, two active words and one complete sentence that performs '+data.languageFunction+'.'}
      ];
    }
    if(page==='letters'&&li>0){
      const video=videoLessonData(li,step,box),arabic=video.responseLanguage==='Arabic';
      return [
        {id:'video-lesson',type:'video',eyebrow:'YouTube video',title:video.title,youtubeUrl:video.youtubeUrl,responseLanguage:video.responseLanguage},
        {id:'video-guide',type:'info',eyebrow:'Before you watch',title:'Watch for meaning, detail and language',body:'Identify the main idea, two supporting details, one example of '+data.grammarTitle+', and at least two target words: '+data.words.slice(0,4).join(', ')+'.'},
        {id:'video-response',type:'response',eyebrow:'Understanding response',title:arabic?'اشرح ما فهمته':'Explain what you understood',body:arabic?'اكتب بالعربية الفكرة الرئيسية وتفصيلين على الأقل، ثم اذكر كلمة أو تركيباً إنجليزياً مهماً.':'Write the main idea, at least two supporting details, and one important English expression from the video.',placeholder:arabic?'اكتب فهمك هنا…':'Write your understanding here…'},
        {id:'video-vocabulary',type:'words',eyebrow:'Video vocabulary',title:'Key expressions to notice',body:'Use these expressions to confirm meaning after watching.',words:data.words}
      ];
    }
    if(page==='voice'){
      return [
        {id:'listen-repeat',type:'info',eyebrow:'Listen & repeat',title:'Build a clean spoken model',body:'Topic: '+data.topic+'. Pronunciation focus: '+data.pronunciationFocus+'. Repeat the model slowly, then at natural speed.'},
        {id:'dictation',type:'dictation',eyebrow:'Voice → text',title:'Listen, then write exactly what you hear',audioText:data.voicePrompt,placeholder:'Type the complete sentence you hear.'},
        {id:'speaking',type:'speaking',eyebrow:'Text → voice',title:'Speak the target meaning',body:data.reversePrompt,placeholder:'Recognition transcript or type your spoken sentence here.'},
        {id:'voice-rubric',type:'info',eyebrow:'Self-check',title:'Meaning · grammar · stress · rhythm',body:'Your response should be understandable, use '+data.grammarTitle+', include at least two target words, and keep pauses aligned with meaning.'}
      ];
    }
    if(page==='grammar'){
      return [
        {id:'grammar-rule',type:'rule',eyebrow:'Grammar rule',title:data.grammarTitle,body:data.grammarRule,example1:data.grammarExample1,example2:data.grammarExample2},
        {id:'grammar-examples',type:'info',eyebrow:'Examples',title:'See the form inside meaning',body:'Model 1: '+data.grammarExample1+' Model 2: '+data.grammarExample2},
        {id:'grammar-error',type:'info',eyebrow:'Common error',title:'Correct the smallest specific mistake',body:'A common failure is using the right vocabulary with the wrong form. Rewrite one sentence so it accurately demonstrates '+data.grammarTitle+'.'},
        {id:'naming',type:'info',eyebrow:'Naming & register',title:'Choose precise words',body:data.naming,words:data.words.slice(0,5)},
        {id:'typing',type:'writing',eyebrow:'Production',title:'Write for the reader',body:data.typing+' '+data.writingPrompt,placeholder:'Write two examples that follow the rule.'}
      ];
    }
    if(page==='review'){
      return [
        {id:'review-vocab',type:'words',eyebrow:'Active vocabulary',title:'Retrieve before you reveal',body:'Try to define or use each word before listening or looking back.',words:data.words},
        {id:'review-trick',type:'steps',eyebrow:'Learning method',title:'Four-pass retrieval cycle',body:data.recall,steps:['Attempt from memory.','Check only after the attempt.','Correct the smallest specific error.','Repeat after a short delay.']},
        {id:'review-memory',type:'info',eyebrow:'Memory trick',title:'Compress · contrast · reconstruct',body:'Compress '+data.grammarTitle+' into one sentence, contrast a correct example with a near-miss, then reconstruct the rule from memory.'},
        {id:'review-recall',type:'info',eyebrow:'Free recall',title:'Explain without looking',body:data.recall},
        {id:'review-notes',type:'notes',eyebrow:'Notes',title:'Keep only what will help future recall',body:'Save difficult examples, corrections, mnemonics or a short Arabic explanation if useful.',placeholder:'Examples, mistakes, mnemonics, Arabic explanation…'}
      ];
    }
    if(page==='examine'){
      return [
        {id:'exam-guidance',type:'info',eyebrow:'Assessment',title:'Complete the learning before you test it',body:'The Examine page automatically resolves to the correct box, step, level or whole-language assessment for this position.'},
        {id:'exam-pass-rule',type:'info',eyebrow:'Pass rule',title:'Accuracy matters',body:'Natural course assessments require at least 80%. Independent level challenges require a score greater than 80%.'},
        {id:'exam-scope',type:'info',eyebrow:'Coverage',title:'Questions sample the whole required scope',body:'Step exams draw from boxes across the step, level exams draw from all five steps, and the whole-language exam draws from A1 through C1.'},
        {id:'exam-revision',type:'info',eyebrow:'Before submitting',title:'Grammar · vocabulary · listening · meaning',body:'Review weak items, then answer without returning to the lesson pages during the attempt.'}
      ];
    }
    return [];
  }

  function languagePageItems(li,step,box,page){
    const store=languageContentStore(),key=contentPageKey(li,step,box,page);
    return Object.prototype.hasOwnProperty.call(store.pages,key)
      ? (Array.isArray(store.pages[key])?store.pages[key]:[])
      : defaultLanguageContentItems(li,step,box,page);
  }
  function mutateLanguagePageItems(selection,mutator){
    const store=languageContentStore(),key=contentPageKey(selection.li,selection.step,selection.box,selection.page);
    const items=Object.prototype.hasOwnProperty.call(store.pages,key)
      ? (Array.isArray(store.pages[key])?[...store.pages[key]]:[])
      : defaultLanguageContentItems(selection.li,selection.step,selection.box,selection.page).map(item=>({...item}));
    store.pages[key]=mutator(items)||items;
    writeLanguageContentStore(store);
    return store.pages[key];
  }
  function languageItemSchemas(page,li){
    const commonInfo={type:'info',label:'Information',fields:[
      {name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Body',kind:'textarea'}
    ]};
    const schemas={
      letters: li>0 ? [
        {type:'video',label:'YouTube video',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'youtubeUrl',label:'YouTube URL',kind:'text'},{name:'responseLanguage',label:'Response language',kind:'select',options:['Arabic','English']}]},
        {type:'response',label:'Understanding response',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Instructions',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]},
        commonInfo
      ] : [
        {type:'sound',label:'Pronunciation focus',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Instructions',kind:'textarea'},{name:'audioText',label:'Audio text',kind:'textarea'}]},
        {type:'words',label:'Word set',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'words',label:'Words (one per line)',kind:'lines'}]},
        {type:'writing',label:'Writing task',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Prompt',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]},
        commonInfo
      ],
      voice:[
        {type:'dictation',label:'Voice to text',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'audioText',label:'Audio text',kind:'textarea'},{name:'placeholder',label:'Input placeholder',kind:'text'}]},
        {type:'speaking',label:'Text to voice',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Text to speak',kind:'textarea'},{name:'placeholder',label:'Transcript placeholder',kind:'text'}]},
        commonInfo
      ],
      grammar:[
        {type:'rule',label:'Grammar rule',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Rule title',kind:'text'},{name:'body',label:'Rule explanation',kind:'textarea'},{name:'example1',label:'Example 1',kind:'text'},{name:'example2',label:'Example 2',kind:'text'}]},
        {type:'writing',label:'Writing task',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Instructions',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]},
        commonInfo
      ],
      review:[
        {type:'words',label:'Vocabulary set',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'words',label:'Words (one per line)',kind:'lines'}]},
        {type:'steps',label:'Learning method',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Recall prompt',kind:'textarea'},{name:'steps',label:'Steps (one per line)',kind:'lines'}]},
        {type:'notes',label:'Notes box',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Instructions',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]},
        commonInfo
      ],
      examine:[commonInfo]
    };
    return schemas[page]||[commonInfo];
  }
  function createLanguageItem(selection,type){
    const schema=(languageItemSchemas(selection.page,selection.li).find(item=>item.type===type)||languageItemSchemas(selection.page,selection.li)[0]);
    const item={id:contentItemId(type),type:schema.type};
    schema.fields.forEach(field=>{item[field.name]=field.kind==='lines'?[]:(field.kind==='select'?(field.options?.[0]||''):'');});
    return item;
  }
  function saveLanguageItem(selection,item){
    const normalized={...item,id:item.id||contentItemId(item.type||'item')};
    return mutateLanguagePageItems(selection,items=>{
      const index=items.findIndex(candidate=>candidate.id===normalized.id);
      if(index>=0)items[index]=normalized;else items.push(normalized);
      return items;
    });
  }
  function deleteLanguageItem(selection,id){return mutateLanguagePageItems(selection,items=>items.filter(item=>item.id!==id));}
  function emptyLanguagePage(selection){return mutateLanguagePageItems(selection,()=>[]);}
  function resetLanguagePage(selection){
    const store=languageContentStore(),key=contentPageKey(selection.li,selection.step,selection.box,selection.page);
    delete store.pages[key];writeLanguageContentStore(store);
    return languagePageItems(selection.li,selection.step,selection.box,selection.page);
  }
  function naturalExamContext(li,step,box){
    const last=boxCount(li);
    if(box<last)return {scope:'box',li,step,box};
    if(step<5)return {scope:'step',li,step,box:last};
    if(li<4)return {scope:'level',li,step:5,box:last};
    return {scope:'language',li:4,step:5,box:last};
  }
  function defaultExamQuestions(ctx){return defaultAssessmentQuestions(ctx);}
  function defaultExamQuestionItems(ctx){
    const suffix=ctx.scope+'-'+CEFR[ctx.li].id+'-'+ctx.step+'-'+ctx.box;
    return defaultExamQuestions(ctx).map((q,index)=>({...q,id:q.id||('q-'+index+'-'+suffix)}));
  }
  function examQuestionsFor(ctx){
    const store=languageContentStore(),key=examStoreKey(ctx);
    return Object.prototype.hasOwnProperty.call(store.exams,key)
      ? (Array.isArray(store.exams[key])?store.exams[key]:[])
      : defaultExamQuestionItems(ctx);
  }
  function mutateExamQuestions(selection,mutator){
    const ctx=naturalExamContext(selection.li,selection.step,selection.box),store=languageContentStore(),key=examStoreKey(ctx);
    const questions=Object.prototype.hasOwnProperty.call(store.exams,key)
      ? (Array.isArray(store.exams[key])?[...store.exams[key]]:[])
      : defaultExamQuestionItems(ctx).map(q=>({...q}));
    store.exams[key]=mutator(questions)||questions;writeLanguageContentStore(store);return store.exams[key];
  }
  function saveExamQuestion(selection,question){
    const q={...question,id:question.id||contentItemId('question'),options:Array.isArray(question.options)?question.options:[]};
    return mutateExamQuestions(selection,items=>{const index=items.findIndex(item=>item.id===q.id);if(index>=0)items[index]=q;else items.push(q);return items;});
  }
  function deleteExamQuestion(selection,id){return mutateExamQuestions(selection,items=>items.filter(item=>(item.id||'')!==id));}
  function emptyExamQuestions(selection){return mutateExamQuestions(selection,()=>[]);}
  function beginLanguageAuthoring(selection){
    if(!isAdminActor())return false;
    setLanguageAuthoringTarget(selection);
    const route=LANGUAGE_CONTENT_PAGE_ROUTES[selection.page]||'language-letters';
    if((location.hash||'').replace(/^#\/?/,'').split('/')[0]===route)render();else setHash(route);
    return true;
  }
  function endLanguageAuthoring(){languageAuthoringTarget=null;render();}

  function boxStudyComplete(state,li,step,box){
    const id=keyBox(CEFR[li].id,step,box),module=state.modules[id]||{};
    if(isLetterBox(li,box)){
      const practiced=state.letterProgress[letterProgressKey(li,step)]||[];
      return LETTERS.every(letter=>practiced.includes(letter));
    }
    const required=li===0?['pronunciation','voice','grammar','review']:['video','voice','grammar','review'];
    return required.every(name=>module[name]===true);
  }
  function boxExamPassed(state,li,step,box){
    return Boolean((state.modules[keyBox(CEFR[li].id,step,box)]||{}).exam);
  }
  function syncBoxCompletion(state,li,step,box){
    const id=keyBox(CEFR[li].id,step,box);
    const complete=boxStudyComplete(state,li,step,box)&&boxExamPassed(state,li,step,box);
    if(complete&&!state.passedBoxes.includes(id))state.passedBoxes.push(id);
    if(!complete)state.passedBoxes=state.passedBoxes.filter(item=>item!==id);
    state.passedBoxes=arrayUnique(state.passedBoxes);
    return complete;
  }
  function markModule(module){
    updateLanguage(state=>{
      const pos=clampSelection(state);
      if(isLetterBox(pos.li,pos.box))return;
      const id=keyBox(CEFR[pos.li].id,pos.step,pos.box);
      state.modules[id]=state.modules[id]||{};
      state.modules[id][module]=true;
      syncBoxCompletion(state,pos.li,pos.step,pos.box);
    });
    render();
  }
  function nextBoxRoute(state,pos){
    if(isLetterBox(pos.li,pos.box))return 'language-letters';
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,pos.box)]||{};
    if(pos.li===0&&!module.pronunciation)return 'language-letters';
    if(pos.li>0&&!module.video)return 'language-letters';
    if(!module.voice)return 'language-voice';
    if(!module.grammar)return 'language-grammar';
    if(!module.review)return 'language-review';
    return 'language-examine';
  }
  function missingRequirements(state,pos){
    if(isLetterBox(pos.li,pos.box)){
      const practiced=state.letterProgress[letterProgressKey(pos.li,pos.step)]||[];
      const missing=LETTERS.filter(letter=>!practiced.includes(letter));
      return missing.length?['Practice and draw '+missing.length+' remaining letter'+(missing.length===1?'':'s')]:[];
    }
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,pos.box)]||{};
    const required=pos.li===0?['pronunciation','voice','grammar','review']:['video','voice','grammar','review'];
    const labels={pronunciation:'Pronunciation & writing',video:'Video understanding',voice:'Voice lab',grammar:'Grammar',review:'Revision'};
    return required.filter(name=>!module[name]).map(name=>labels[name]);
  }
  function boundaryReady(state,li,step){
    const last=boxCount(li);
    for(let box=1;box<last;box++) if(!isBoxPassed(state,li,step,box))return false;
    return boxStudyComplete(state,li,step,last);
  }
  function currentAssessment(state,pos){
    const last=boxCount(pos.li);
    if(pos.box<last)return {scope:'box',li:pos.li,step:pos.step,box:pos.box};
    if(pos.step<5)return {scope:'step',li:pos.li,step:pos.step,box:last};
    if(pos.li<4)return {scope:'level',li:pos.li,step:5,box:last};
    return {scope:'language',li:4,step:5,box:last};
  }
  function assessmentMissing(state,ctx){
    if(ctx.scope==='box')return missingRequirements(state,{li:ctx.li,step:ctx.step,box:ctx.box});
    if(ctx.scope==='step'){
      if(!boundaryReady(state,ctx.li,ctx.step))return ['Finish every earlier box in this step and complete the last box learning pages'];
      return [];
    }
    if(ctx.scope==='level'){
      for(let step=1;step<5;step++)if(!isStepPassed(state,ctx.li,step))return ['Pass Steps 1–4 before the level examination'];
      if(!boundaryReady(state,ctx.li,5))return ['Finish every box in Step 5 before the level examination'];
      return [];
    }
    if(ctx.scope==='language'){
      const entry=Math.min(4,Math.max(0,Number(state.entryLevel)||0));
      for(let li=entry;li<4;li++)if(!isLevelPassed(state,li))return ['Finish each level in your enrolled pathway before the whole-language examination'];
      for(let step=1;step<5;step++)if(!isStepPassed(state,4,step))return ['Pass C1 Steps 1–4 before the whole-language examination'];
      if(!boundaryReady(state,4,5))return ['Finish every box in the final C1 step before the whole-language examination'];
      return [];
    }
    return [];
  }
  function assessmentPassed(state,ctx){
    if(ctx.scope==='box')return boxExamPassed(state,ctx.li,ctx.step,ctx.box);
    if(ctx.scope==='step')return isStepPassed(state,ctx.li,ctx.step);
    if(ctx.scope==='level')return isLevelPassed(state,ctx.li);
    if(ctx.scope==='language')return state.languagePassed;
    return false;
  }
  function applyAssessmentPass(state,ctx){
    const id=CEFR[ctx.li].id,last=boxCount(ctx.li),finalId=keyBox(id,ctx.step,last);
    if(ctx.scope==='box'){
      const boxId=keyBox(id,ctx.step,ctx.box);
      state.modules[boxId]=state.modules[boxId]||{};
      state.modules[boxId].exam=true;
      if(syncBoxCompletion(state,ctx.li,ctx.step,ctx.box)){
        state.selectedLevel=ctx.li;state.selectedStep=ctx.step;state.selectedBox=Math.min(last,ctx.box+1);
      }
      return;
    }
    state.modules[finalId]=state.modules[finalId]||{};
    state.modules[finalId].exam=true;
    syncBoxCompletion(state,ctx.li,ctx.step,last);
    if(ctx.scope==='step'){
      state.passedSteps=arrayUnique([...state.passedSteps,keyStep(id,ctx.step)]);
      state.selectedLevel=ctx.li;state.selectedStep=ctx.step+1;state.selectedBox=1;
      return;
    }
    state.passedSteps=arrayUnique([...state.passedSteps,keyStep(id,5)]);
    state.passedLevels=arrayUnique([...state.passedLevels,id]);
    if(ctx.scope==='level'){
      state.selectedLevel=Math.min(4,ctx.li+1);state.selectedStep=1;state.selectedBox=1;
      return;
    }
    state.languagePassed=true;
  }
  function applyLevelChallengePass(state,li){
    state.passedLevels=arrayUnique([...state.passedLevels,CEFR[li].id]);
    state.challengeLevel=null;
  }

  function languageHeader(state,pos,kicker,title,description){
    const level=CEFR[pos.li];
    return '<header class="language-page-head"><div><small>'+esc(kicker)+'</small><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></div><div class="language-context"><button type="button" data-language-ui-switch>'+(lang()==='ar'?'EN':'ع')+'</button><span>'+level.id+'</span><span>'+t('step')+' '+pos.step+'</span><span>'+t('box')+' '+pos.box+'</span></div></header>';
  }

  function progressPercent(state){
    let completed=0;
    for(let li=0;li<CEFR.length;li++){
      const total=boxCount(li)*5;
      if(isLevelPassed(state,li)){completed+=total;continue;}
      const prefix=CEFR[li].id+':';
      completed+=state.passedBoxes.filter(id=>id.startsWith(prefix)).length;
    }
    return Math.min(100,Math.round((completed/TOTAL_LANGUAGE_BOXES)*100));
  }
  function onboardingPage(){
    return '<section class="language-course-page language-onboarding">'+
      '<header class="language-onboarding-hero"><small>English learning · first setup</small><h1>Where should your course begin?</h1><p>Choose the full pathway from A1, or take a demanding placement examination to start at the level that matches your current English.</p></header>'+
      '<div class="language-entry-grid">'+
        '<button type="button" data-language-start-zero><span>01</span><small>Full pathway</small><h2>Start from zero</h2><p>Begin at A1 · Step 1 · Letters and build every prerequisite in order.</p><b>Start A1 →</b></button>'+
        '<button type="button" data-language-placement-start><span>02</span><small>Placement</small><h2>Examine my level</h2><p>Take a hard multimodal exam with listening, dictation, image description, advanced grammar and complex translation.</p><b>Start placement exam →</b></button>'+
      '</div><p class="language-entry-note">Placement chooses your starting level only. It does not mark skipped lower levels as completed.</p></section>';
  }

  function homePage(){
    const state=languageState();
    if(!state.onboardingComplete&&!state.placementPending)return onboardingPage();
    const pos=clampSelection(state),level=CEFR[pos.li],name=window.DafatiiAuth.user && window.DafatiiAuth.user.displayName || 'Student';
    const levels=CEFR.map((item,index)=>{
      const unlocked=levelUnlocked(state,index),passed=isLevelPassed(state,index),selected=index===pos.li;
      const placement=index===state.entryLevel&&state.placementResult;
      return '<button class="language-level-card '+(selected?'selected ':'')+(passed?'passed ':'')+(!unlocked?'locked':'')+'" data-language-level="'+index+'" '+(unlocked?'':'disabled')+'><span>'+item.id+'</span><div><strong>'+esc(lang()==='ar'?item.ar:item.title)+'</strong><p>'+esc(item.description)+(placement?' · Placement start':'')+'</p></div><b>'+(passed?'✓':unlocked?'→':'🔒')+'</b></button>';
    }).join('');
    const steps=[1,2,3,4,5].map(step=>{
      const unlocked=stepUnlocked(state,pos.li,step),passed=isStepPassed(state,pos.li,step);
      const completed=Array.from({length:boxCount(pos.li)},(_,i)=>i+1).filter(box=>isBoxPassed(state,pos.li,step,box)).length;
      return '<button type="button" data-language-step="'+step+'" '+(unlocked?'':'disabled')+' class="language-home-step '+(step===pos.step?'active ':'')+(passed?'passed':'')+'"><small>'+t('step')+' '+step+'</small><strong>'+completed+' / '+boxCount(pos.li)+'</strong><span>'+(passed?'Exam passed':unlocked?'Continue':'Locked')+'</span></button>';
    }).join('');
    const goal=isLetterBox(pos.li,pos.box)?'Hear, see and draw all 26 English letters one at a time, then continue through the A1 pathway.':boxData(pos.li,pos.step,pos.box).goal;
    return '<section class="language-course-page language-home">'+languageHeader(state,pos,t('welcome')+', '+name,level.id+' · '+(lang()==='ar'?level.ar:level.title),level.description)+
      '<div class="language-hero-grid"><article class="language-progress-hero"><div><small>'+t('progress')+'</small><strong>'+progressPercent(state)+'%</strong><p>'+TOTAL_LANGUAGE_BOXES+' structured boxes · formal step and level assessments required</p></div><div class="language-ring" style="--value:'+progressPercent(state)+'"><span>'+progressPercent(state)+'%</span></div></article>'+
      '<article class="language-resume-card"><small>'+t('current')+'</small><h2>'+level.id+' · '+t('step')+' '+pos.step+' · '+t('box')+' '+pos.box+'</h2><p>'+esc(goal)+'</p><a href="#'+nextBoxRoute(state,pos)+'">'+t('resume')+' →</a></article></div>'+
      '<section class="language-step-overview"><div class="language-section-title"><div><small>Current level</small><h2>Five-step completion path</h2></div><span>'+boxCount(pos.li)+' boxes / step</span></div><div class="language-home-steps">'+steps+'</div></section>'+
      '<section class="language-levels"><div class="language-section-title"><div><small>CEFR pathway</small><h2>'+t('changeLevel')+'</h2></div><span>A1 → C1</span></div>'+levels+'</section></section>';
  }

  function boxSelector(state,pos){
    let html='<div class="language-box-strip">';
    for(let box=1;box<=boxCount(pos.li);box++){
      const unlocked=adminLanguageAuthoring()||boxUnlocked(state,pos.li,pos.step,box),passed=isBoxPassed(state,pos.li,pos.step,box),letter=isLetterBox(pos.li,box);
      html+='<button type="button" data-language-box="'+box+'" '+(unlocked?'':'disabled')+' class="'+(box===pos.box?'active ':'')+(passed?'passed ':'')+(letter?'letter-box':'')+'">'+(letter?'Aa':box)+'</button>';
    }
    return html+'</div>';
  }

  function contentItemAttrs(item){return ' data-language-content-item="'+esc(item.id)+'" data-language-content-type="'+esc(item.type||'info')+'"';}
  function infoItemCard(item,extraClass=''){
    return '<article class="language-content-item '+extraClass+'"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Information')+'</small><h2>'+esc(item.title||'Untitled item')+'</h2>'+(item.body?'<p>'+esc(item.body)+'</p>':'')+'</article>';
  }
  function itemWords(item){return Array.isArray(item.words)?item.words:String(item.words||'').split(/\n|,/).map(value=>value.trim()).filter(Boolean);}
  function itemLines(item,name){const value=item[name];return Array.isArray(value)?value:String(value||'').split(/\n/).map(line=>line.trim()).filter(Boolean);}

  function letterBoxPage(state,pos){
    const pkey=letterProgressKey(pos.li,pos.step),practiced=state.letterProgress[pkey]||[];
    const items=languagePageItems(pos.li,pos.step,pos.box,'letters');
    const firstMissing=LETTERS.find(letter=>!practiced.includes(letter))||'A';
    const stored=state.activeLetterByStep[pkey];
    const storedAllowed=practiced.includes(stored)||stored===firstMissing;
    const letter=storedAllowed?stored:firstMissing,lower=letter.toLowerCase(),word=LETTER_WORDS[letter],done=practiced.includes(letter),allDone=LETTERS.every(item=>practiced.includes(item));
    const selectors=LETTERS.map(item=>{
      const itemDone=practiced.includes(item),allowed=itemDone||item===firstMissing;
      return '<button type="button" data-letter-select="'+item+'" '+(allowed?'':'disabled')+' class="'+(item===letter?'active ':'')+(itemDone?'done':'')+'"><strong>'+item+'</strong><span>'+item.toLowerCase()+'</span><b>'+(itemDone?'✓':allowed?'':'🔒')+'</b></button>';
    }).join('');
    return '<section class="language-course-page language-letters-mobile">'+languageHeader(state,pos,t('letters'),'Letters box · '+CEFR[pos.li].id+' Step '+pos.step,'Learn A–Z in order. Hear the letter name by itself, then trace its uppercase and lowercase shapes accurately before continuing.')+
      '<div class="language-step-switch">'+[1,2,3,4,5].map(step=>'<button data-language-step="'+step+'" '+((adminLanguageAuthoring()||stepUnlocked(state,pos.li,step))?'':'disabled')+' class="'+(step===pos.step?'active':'')+'">'+t('step')+' '+step+'</button>').join('')+'</div>'+
      boxSelector(state,pos)+
      '<div class="language-content-item-grid">'+items.map(item=>infoItemCard(item,'letter-information-item')).join('')+'</div>'+
      '<div class="letter-sequence-head"><div><small>Letters completed</small><strong>'+practiced.length+' / 26</strong></div><div class="letter-sequence-meter"><i style="width:'+Math.round(practiced.length/26*100)+'%"></i></div></div>'+
      '<div class="letter-learning-shell"><aside class="letter-index-grid">'+selectors+'</aside><article class="letter-focus-card"><small>Current letter</small><div class="letter-glyph-pair"><strong>'+letter+'</strong><span>'+lower+'</span></div><button class="letter-hear-button" type="button" data-speak-letter="'+letter+'" aria-label="Hear letter '+letter+'">▶ Hear '+letter+'</button><div class="letter-example-word"><span>Example word</span><strong>'+esc(word)+'</strong><button type="button" data-speak="'+esc(word)+'">Hear word</button></div><p>Audio says the letter name only. Follow the guide with your finger and complete both shapes before moving forward.</p></article></div>'+
      '<div class="letter-trace-grid"><article><div><small>Uppercase</small><h2>'+letter+'</h2></div><div class="letter-trace-stage"><span aria-hidden="true">'+letter+'</span><canvas id="letter-upper-canvas" data-letter-canvas="upper" width="720" height="280" aria-label="Draw uppercase '+letter+'"></canvas></div><button type="button" data-canvas-clear="letter-upper-canvas">Clear uppercase</button></article><article><div><small>Lowercase</small><h2>'+lower+'</h2></div><div class="letter-trace-stage"><span aria-hidden="true">'+lower+'</span><canvas id="letter-lower-canvas" data-letter-canvas="lower" width="720" height="280" aria-label="Draw lowercase '+lower+'"></canvas></div><button type="button" data-canvas-clear="letter-lower-canvas">Clear lowercase</button></article></div>'+
      '<div class="letter-draw-feedback" data-letter-feedback aria-live="polite">'+(done?'This letter is already completed. You can review it or continue.':'Trace both forms. The app checks shape coverage and off-guide strokes before allowing completion.')+'</div>'+
      '<div class="letter-complete-row"><button type="button" data-letter-complete="'+letter+'" data-letter-done="'+(done?'true':'false')+'" disabled>'+(done?'✓ '+letter+' completed':'Complete '+letter)+'</button><button type="button" data-letter-next '+(done?'':'disabled')+'>Next letter →</button></div>'+
      (allDone?'<a class="language-exam-cta" href="#language-examine"><span>✓</span><div><strong>Letters box examination</strong><p>All 26 letters are complete. Pass the dedicated exam to complete this box.</p></div><b>→</b></a>':'<div class="language-exam-cta locked"><span>26</span><div><strong>Letters exam locked</strong><p>Complete every letter correctly first. '+(26-practiced.length)+' remain.</p></div><b>🔒</b></div>')+
      '</section>';
  }

  function pronunciationPage(state,pos){
    const data=boxData(pos.li,pos.step,pos.box),id=keyBox(CEFR[pos.li].id,pos.step,pos.box),module=state.modules[id]||{},items=languagePageItems(pos.li,pos.step,pos.box,'letters');
    const body=items.map(item=>{
      if(item.type==='sound')return '<article class="language-sound-hero language-content-item"'+contentItemAttrs(item)+'><div><small>'+esc(item.eyebrow||'Pronunciation focus')+'</small><h2>'+esc(item.title||'Sound focus')+'</h2><p>'+esc(item.body||'')+'</p></div>'+(item.audioText?'<button class="btn btn-primary" type="button" data-speak="'+esc(item.audioText)+'">'+t('listen')+'</button>':'')+'</article>';
      if(item.type==='words')return '<article class="language-content-item language-word-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Target words')+'</small><h2>'+esc(item.title||'Word set')+'</h2><div class="language-pronunciation-grid">'+itemWords(item).map(word=>'<button type="button" data-speak="'+esc(word)+'"><strong>'+esc(word)+'</strong><span>▶</span></button>').join('')+'</div></article>';
      if(item.type==='writing')return '<article class="language-writing-task language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Writing')+'</small><h2>'+esc(item.title||'Writing task')+'</h2><p>'+esc(item.body||'')+'</p><textarea id="language-pronunciation-writing" rows="6" placeholder="'+esc(item.placeholder||'Write here…')+'"></textarea></article>';
      return infoItemCard(item);
    }).join('');
    const hasWriting=items.some(item=>item.type==='writing');
    return '<section class="language-course-page">'+languageHeader(state,pos,t('letters'),data.title,t('lettersIntro'))+boxSelector(state,pos)+
      '<div class="language-pronunciation-lesson">'+body+'</div>'+
      '<button class="language-complete-bar '+(module.pronunciation?'done':'')+'" type="button" data-language-module="pronunciation" '+(module.pronunciation||hasWriting?'':'disabled')+'>'+(module.pronunciation?'✓ '+t('completed'):(hasWriting?'Complete the writing task first':'Add a writing item before completion'))+'</button></section>';
  }

  function videoUnderstandingPage(state,pos){
    const data=boxData(pos.li,pos.step,pos.box),id=keyBox(CEFR[pos.li].id,pos.step,pos.box),module=state.modules[id]||{};
    const items=languagePageItems(pos.li,pos.step,pos.box,'letters'),videoItem=items.find(item=>item.type==='video'),responseItem=items.find(item=>item.type==='response');
    const watched=Boolean(state.watchedVideos[id]),saved=state.videoResponses[id]||'',responseLanguage=videoItem?.responseLanguage||'English',arabic=responseLanguage==='Arabic';
    const youtubeUrl=String(videoItem?.youtubeUrl||'').trim(),validYouTube=/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(youtubeUrl);
    const videoMarkup=videoItem?'<article class="language-youtube-card language-content-item"'+contentItemAttrs(videoItem)+'><div><small>'+esc(videoItem.eyebrow||'YouTube video')+'</small><h2>'+esc(videoItem.title||data.title)+'</h2><p>This lesson uses a YouTube link only. Open it in YouTube, watch it, then return to complete the understanding response.</p></div><div class="language-youtube-actions">'+
      (validYouTube?'<a href="'+esc(youtubeUrl)+'" target="_blank" rel="noopener noreferrer" data-youtube-video>▶ Open YouTube video</a>':'<span class="language-youtube-missing">Add a valid YouTube link from Content Control.</span>')+
      '<button type="button" data-video-watched '+(validYouTube?'':'disabled')+'>'+(watched?'✓ Watched':'I finished watching')+'</button></div></article>':'';
    const responseMarkup=responseItem?'<article class="language-video-response language-content-item"'+contentItemAttrs(responseItem)+'><small>'+esc(responseItem.eyebrow||'Understanding response')+' · '+esc(responseLanguage)+'</small><h2>'+esc(responseItem.title||'Explain what you understood')+'</h2><p>'+esc(responseItem.body||'')+'</p><textarea id="language-video-response" rows="8" dir="'+(arabic?'rtl':'ltr')+'" placeholder="'+esc(responseItem.placeholder||'Write here…')+'">'+esc(saved)+'</textarea><p class="language-feedback" data-video-response-feedback></p></article>':'';
    const extraMarkup=items.filter(item=>!['video','response'].includes(item.type)).map(item=>{
      if(item.type==='words')return '<article class="language-content-item language-word-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Vocabulary')+'</small><h2>'+esc(item.title||'Key expressions')+'</h2><p>'+esc(item.body||'')+'</p><div class="language-vocab-grid">'+itemWords(item).map(word=>'<button type="button" data-speak="'+esc(word)+'"><span>'+esc(word)+'</span><b>▶</b></button>').join('')+'</div></article>';
      return infoItemCard(item,'video-information-item');
    }).join('');
    return '<section class="language-course-page language-video-page">'+languageHeader(state,pos,t('video'),data.title,'Open the YouTube lesson, watch it, then explain what you understood in the required language.')+boxSelector(state,pos)+
      videoMarkup+extraMarkup+responseMarkup+
      '<button class="language-complete-bar '+(module.video?'done':'')+'" type="button" data-language-module="video" '+(module.video||videoItem&&responseItem&&validYouTube?'':'disabled')+'>'+(module.video?'✓ '+t('completed'):(videoItem&&responseItem&&validYouTube?'Watch the YouTube video and complete your response':'Add a valid YouTube video link and response item first'))+'</button></section>';
  }

  function lettersPage(){
    const state=languageState(),pos=activeLanguagePosition(state);
    if(pos.li>0)return videoUnderstandingPage(state,pos);
    return isLetterBox(pos.li,pos.box)?letterBoxPage(state,pos):pronunciationPage(state,pos);
  }

  function currentLearningBox(state,pos){
    if(!isLetterBox(pos.li,pos.box))return boxData(pos.li,pos.step,pos.box);
    if(adminLanguageAuthoring())return {box:pos.box,title:CEFR[pos.li].id+' · Step '+pos.step+' · Letters box',grammarTitle:'Letters box'};
    return null;
  }
  function boxOneGate(state,pos,title,intro){
    const practiced=state.letterProgress[letterProgressKey(pos.li,pos.step)]||[];
    return '<section class="language-course-page">'+languageHeader(state,pos,title,title,intro)+'<article class="language-box-one-gate"><span>Aa</span><div><small>Letters box prerequisite</small><h2>Finish the complete A–Z Letters box first.</h2><p>Each letter must be heard and drawn separately in uppercase and lowercase. Then pass the Letters box exam. '+practiced.length+' / 26 letters are practiced.</p></div><div><a href="#language-letters">Open Letters box</a><a href="#language-examine">Examine</a></div></article></section>';
  }

  function voicePage(){
    const state=languageState(),pos=activeLanguagePosition(state),data=currentLearningBox(state,pos);
    if(!data)return boxOneGate(state,pos,t('voice'),t('voiceIntro'));
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,data.box)]||{},items=languagePageItems(pos.li,pos.step,pos.box,'voice');
    const body=items.map(item=>{
      if(item.type==='dictation')return '<article class="language-practice-card dictation language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Voice → text')+'</small><h2>'+esc(item.title||'Listen and write')+'</h2><button class="language-audio-button" type="button" data-speak="'+esc(item.audioText||'')+'">▶ '+t('listen')+'</button><textarea id="language-dictation" rows="4" placeholder="'+esc(item.placeholder||'Type what you hear')+'"></textarea><button type="button" data-check-dictation="'+esc(item.audioText||'')+'">'+t('check')+'</button><p class="language-feedback" data-dictation-feedback></p></article>';
      if(item.type==='speaking')return '<article class="language-practice-card reverse language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Text → voice')+'</small><h2>'+esc(item.title||t('speak'))+'</h2><blockquote>'+esc(item.body||'')+'</blockquote><button class="language-audio-button secondary" type="button" data-recognize="'+esc(item.body||'')+'">🎙 '+t('start')+'</button><textarea id="language-reverse-fallback" rows="3" placeholder="'+esc(item.placeholder||'Recognition transcript')+'"></textarea><button type="button" data-check-reverse="'+esc(item.body||'')+'">'+t('check')+'</button><p class="language-feedback" data-reverse-feedback></p></article>';
      return infoItemCard(item);
    }).join('');
    const completeReady=items.some(item=>item.type==='dictation')&&items.some(item=>item.type==='speaking');
    return '<section class="language-course-page">'+languageHeader(state,{li:pos.li,step:pos.step,box:data.box},t('voice'),data.title,t('voiceIntro'))+boxSelector(state,{li:pos.li,step:pos.step,box:data.box})+
      '<div class="language-practice-grid">'+body+'</div>'+
      '<button class="language-complete-bar '+(module.voice?'done':'')+'" type="button" data-language-module="voice" '+(module.voice||completeReady?'':'disabled')+'>'+(module.voice?'✓ '+t('completed'):(completeReady?'Complete both voice exercises first':'Add both voice exercise items before completion'))+'</button></section>';
  }

  function grammarPage(){
    const state=languageState(),pos=activeLanguagePosition(state),data=currentLearningBox(state,pos);if(!data)return boxOneGate(state,pos,t('grammar'),t('grammarIntro'));
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,data.box)]||{},items=languagePageItems(pos.li,pos.step,pos.box,'grammar');
    const body=items.map((item,index)=>{
      if(item.type==='rule')return '<article class="language-rule-card primary language-content-item"'+contentItemAttrs(item)+'><span>'+String(index+1).padStart(2,'0')+'</span><small>'+esc(item.eyebrow||'Grammar rule')+'</small><h2>'+esc(item.title||'Grammar rule')+'</h2><p>'+esc(item.body||'')+'</p><div class="language-examples">'+(item.example1?'<code>'+esc(item.example1)+'</code>':'')+(item.example2?'<code>'+esc(item.example2)+'</code>':'')+'</div></article>';
      if(item.type==='writing')return '<article class="language-rule-card language-content-item"'+contentItemAttrs(item)+'><span>'+String(index+1).padStart(2,'0')+'</span><small>'+esc(item.eyebrow||'Writing')+'</small><h2>'+esc(item.title||'Write for the reader')+'</h2><p>'+esc(item.body||'')+'</p><textarea id="language-grammar-writing" rows="5" placeholder="'+esc(item.placeholder||'Write here…')+'"></textarea></article>';
      if(item.type==='info'){
        const words=itemWords(item);
        return '<article class="language-rule-card language-content-item"'+contentItemAttrs(item)+'><span>'+String(index+1).padStart(2,'0')+'</span><small>'+esc(item.eyebrow||'Information')+'</small><h2>'+esc(item.title||'Information')+'</h2><p>'+esc(item.body||'')+'</p>'+(words.length?'<div class="language-word-row">'+words.map(word=>'<b>'+esc(word)+'</b>').join('')+'</div>':'')+'</article>';
      }
      return infoItemCard(item);
    }).join('');
    const hasWriting=items.some(item=>item.type==='writing');
    return '<section class="language-course-page">'+languageHeader(state,{li:pos.li,step:pos.step,box:data.box},t('grammar'),items.find(item=>item.type==='rule')?.title||data.grammarTitle,t('grammarIntro'))+boxSelector(state,{li:pos.li,step:pos.step,box:data.box})+
      '<div class="language-rule-layout">'+body+'</div>'+
      '<button class="language-complete-bar '+(module.grammar?'done':'')+'" type="button" data-language-module="grammar" '+(module.grammar||hasWriting?'':'disabled')+'>'+(module.grammar?'✓ '+t('completed'):(hasWriting?'Write your examples first':'Add a writing item before completion'))+'</button></section>';
  }

  function reviewPage(){
    const state=languageState(),pos=activeLanguagePosition(state),data=currentLearningBox(state,pos);if(!data)return boxOneGate(state,pos,t('review'),t('reviewIntro'));
    const id=keyBox(CEFR[pos.li].id,pos.step,data.box),module=state.modules[id]||{},notes=state.notes[id]||'',items=languagePageItems(pos.li,pos.step,pos.box,'review');
    const body=items.map(item=>{
      if(item.type==='words')return '<article class="language-memory-card language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Active vocabulary')+'</small><h2>'+esc(item.title||'Vocabulary')+'</h2><div class="language-vocab-grid">'+itemWords(item).map(word=>'<button type="button" data-speak="'+esc(word)+'"><span>'+esc(word)+'</span><b>▶</b></button>').join('')+'</div></article>';
      if(item.type==='steps')return '<article class="language-memory-card language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Learning trick')+'</small><h2>'+esc(item.title||'Learning method')+'</h2><p>'+esc(item.body||'')+'</p><ol>'+itemLines(item,'steps').map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol></article>';
      if(item.type==='notes')return '<article class="language-memory-card notes language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||t('notes'))+'</small><h2>'+esc(item.title||'Notes')+'</h2><p>'+esc(item.body||'')+'</p><textarea id="language-box-notes" rows="8" placeholder="'+esc(item.placeholder||'Notes…')+'">'+esc(notes)+'</textarea><button type="button" data-save-language-notes="'+esc(id)+'">'+t('save')+'</button></article>';
      return infoItemCard(item);
    }).join('');
    return '<section class="language-course-page">'+languageHeader(state,{li:pos.li,step:pos.step,box:data.box},t('review'),data.title,t('reviewIntro'))+boxSelector(state,{li:pos.li,step:pos.step,box:data.box})+
      '<div class="language-review-grid">'+body+'</div>'+
      '<button class="language-complete-bar '+(module.review?'done':'')+'" type="button" data-language-module="review" '+(items.length?'':'disabled')+'>'+(module.review?'✓ '+t('completed'):(items.length?t('complete'):'Add at least one review item'))+'</button></section>';
  }

  function letterExamQuestions(step){
    const offset=(step-1)*5;
    const letters=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    const pick=index=>letters[(offset+index)%letters.length];
    const a=pick(0),b=pick(1),c=pick(2),d=pick(3),e=pick(4);
    return [
      {prompt:'Which uppercase letter matches lowercase '+a.toLowerCase()+'?',correct:a,options:[a,b,c,d]},
      {prompt:'Which lowercase letter matches uppercase '+b+'?',correct:b.toLowerCase(),options:[b.toLowerCase(),c.toLowerCase(),d.toLowerCase(),e.toLowerCase()]},
      {prompt:'Which letter comes immediately after '+c+'?',correct:letters[(letters.indexOf(c)+1)%26],options:[letters[(letters.indexOf(c)+1)%26],b,d,e]},
      {prompt:'Which letter comes immediately before '+e+'?',correct:letters[(letters.indexOf(e)+25)%26],options:[letters[(letters.indexOf(e)+25)%26],a,b,c]},
      {prompt:'Which pair shows the same letter?',correct:d+' / '+d.toLowerCase(),options:[d+' / '+d.toLowerCase(),d+' / '+e.toLowerCase(),c+' / '+d.toLowerCase(),a+' / '+b.toLowerCase()]},
      {prompt:'Which option contains the uppercase form of '+a.toLowerCase()+'?',correct:a,options:[a,b,d,e]},
      {prompt:'Which option contains the lowercase form of '+c+'?',correct:c.toLowerCase(),options:[c.toLowerCase(),a.toLowerCase(),d.toLowerCase(),e.toLowerCase()]},
      {prompt:'Which letter is two places after '+a+'?',correct:letters[(letters.indexOf(a)+2)%26],options:[letters[(letters.indexOf(a)+2)%26],b,d,e]},
      {prompt:'Which pair is NOT the same letter?',correct:b+' / '+c.toLowerCase(),options:[a+' / '+a.toLowerCase(),d+' / '+d.toLowerCase(),e+' / '+e.toLowerCase(),b+' / '+c.toLowerCase()]},
      {prompt:'Which sequence is in correct alphabetical order?',correct:a+', '+b+', '+c,options:[a+', '+b+', '+c,c+', '+b+', '+a,b+', '+a+', '+c,a+', '+c+', '+b]}
    ].map(q=>({...q,options:arrayUnique(q.options)}));
  }
  function boxQuestionSet(li,step,box){
    if(isLetterBox(li,box))return letterExamQuestions(step);
    const level=CEFR[li],data=boxData(li,step,box);
    const grammarIndex=Math.max(0,level.grammar.findIndex(rule=>rule[0]===data.grammarTitle));
    const otherRule=level.grammar[(grammarIndex+3)%level.grammar.length];
    const nextBox=box===boxCount(li)?Math.max(firstLearningBox(li),box-1):box+1;
    const adjacent=boxData(li,step,nextBox);
    const unpunctuated=data.grammarExample1.charAt(0).toLowerCase()+data.grammarExample1.slice(1).replace(/[.!?]$/,'');
    const questions=[
      {prompt:'Which sentence best demonstrates this box’s target grammar?',correct:data.grammarExample1,options:[data.grammarExample1,unpunctuated+' '+data.words[0],data.words.slice(0,4).join(' '),adjacent.reversePrompt]},
      {prompt:'Which statement correctly describes this box’s grammar focus?',correct:data.grammarRule,options:[data.grammarRule,otherRule[1],'Word order never affects meaning.','Punctuation replaces grammar.']},
      {prompt:'Which sentence is the listening model for this box?',correct:data.voicePrompt,options:[data.voicePrompt,adjacent.voicePrompt,data.reversePrompt,data.words.slice(0,5).join(' ')]},
      {prompt:'Which word belongs to this box’s active vocabulary?',correct:data.words[0],options:[data.words[0],adjacent.words[0],otherRule[0],adjacent.topic]},
      {prompt:'Which option is a complete reader-ready model from this box?',correct:data.grammarExample2,options:[data.grammarExample2,data.grammarExample2.toLowerCase().replace(/[.!?]$/,''),'because '+data.words[0],data.words[1]+' '+data.words[2]]},
      {prompt:'What is the communicative function of this box?',correct:data.languageFunction,options:[data.languageFunction,adjacent.languageFunction,'spelling isolated letters','avoiding communication']},
      {prompt:'Which pronunciation focus belongs to this box?',correct:data.pronunciationFocus,options:[data.pronunciationFocus,adjacent.pronunciationFocus,otherRule[0],adjacent.topic]},
      {prompt:'Which instruction best matches the writing task?',correct:data.writingPrompt,options:[data.writingPrompt,adjacent.writingPrompt,'Copy the vocabulary list without sentences.','Do not use the target grammar.']},
      {prompt:'Which statement best matches the writing/typing rule for this level?',correct:data.typing,options:[data.typing,adjacent.naming,'Punctuation is never needed.','Use random capitalization to show emphasis.']},
      {prompt:'Which prompt best tests free recall for this box?',correct:data.recall,options:[data.recall,adjacent.recall,'Repeat one word ten times without context.','Skip the grammar and guess the topic.']}
    ];
    return questions.map(q=>({...q,options:arrayUnique(q.options)}));
  }
  function representativeBoxes(li){
    const last=boxCount(li),first=firstLearningBox(li);
    return arrayUnique([1,first,Math.max(first,Math.round(last*.2)),Math.round(last*.4),Math.round(last*.6),Math.round(last*.8),last]);
  }
  function defaultAssessmentQuestions(ctx){
    if(ctx.scope==='box')return boxQuestionSet(ctx.li,ctx.step,ctx.box);
    const out=[];
    if(ctx.scope==='step'){
      representativeBoxes(ctx.li).forEach((box,index)=>{
        const set=boxQuestionSet(ctx.li,ctx.step,box);
        out.push(set[index%set.length],set[(index+3)%set.length],set[(index+6)%set.length]);
      });
      return out.slice(0,15);
    }
    if(ctx.scope==='level'){
      for(let step=1;step<=5;step++){
        const reps=representativeBoxes(ctx.li);
        [reps[1],reps[2],reps[3],reps[4],reps[reps.length-1]].forEach((box,index)=>{
          const set=boxQuestionSet(ctx.li,step,box);
          out.push(set[(step+index*2)%set.length]);
        });
      }
      return out.slice(0,25);
    }
    for(let li=0;li<CEFR.length;li++){
      const reps=representativeBoxes(li);
      [1,2,3,4,5].forEach((step,index)=>{
        [reps[1],reps[3],reps[reps.length-1]].forEach((box,offset)=>{
          const set=boxQuestionSet(li,step,box);
          out.push(set[(li+index+offset*3)%set.length]);
        });
      });
    }
    return out.slice(0,40);
  }

  function assessmentQuestions(ctx){return examQuestionsFor(ctx);}

  function placementScene(kind){
    if(kind==='station')return '<svg viewBox="0 0 420 220" role="img" aria-label="A train platform scene"><rect width="420" height="220" rx="20" fill="#eaf2ff"/><rect y="154" width="420" height="66" fill="#cbd5e1"/><rect x="40" y="72" width="250" height="82" rx="12" fill="#2563eb"/><rect x="61" y="88" width="54" height="36" rx="4" fill="#dbeafe"/><rect x="129" y="88" width="54" height="36" rx="4" fill="#dbeafe"/><circle cx="92" cy="161" r="18" fill="#334155"/><circle cx="240" cy="161" r="18" fill="#334155"/><circle cx="337" cy="90" r="16" fill="#f59e0b"/><path d="M337 106v45M337 120l-23 25M337 121l25 18" stroke="#475569" stroke-width="8" stroke-linecap="round"/><rect x="311" y="150" width="55" height="8" rx="4" fill="#64748b"/></svg>';
    return '<svg viewBox="0 0 420 220" role="img" aria-label="A meeting and presentation scene"><rect width="420" height="220" rx="20" fill="#f8fafc"/><rect x="24" y="24" width="210" height="115" rx="12" fill="#dbeafe"/><path d="M52 111L98 73l42 18 55-44" fill="none" stroke="#2563eb" stroke-width="7" stroke-linecap="round"/><rect x="72" y="166" width="276" height="18" rx="9" fill="#94a3b8"/><circle cx="285" cy="75" r="18" fill="#f59e0b"/><path d="M285 94v58M285 112l-30 24M285 112l34 20" stroke="#475569" stroke-width="9" stroke-linecap="round"/><circle cx="363" cy="120" r="14" fill="#fb7185"/><path d="M363 134v35" stroke="#475569" stroke-width="8" stroke-linecap="round"/></svg>';
  }
  function placementQuestions(){
    return [
      {type:'mcq',prompt:'Choose the grammatically correct sentence.',correct:'She has been working here since 2022.',options:['She has been working here since 2022.','She works here since 2022.','She has working here since 2022.','She is work here since 2022.']},
      {type:'listen-fill',prompt:'Voice → text: write exactly what you hear.',audio:'Had I known about the delay, I would have taken an earlier train.',correct:'Had I known about the delay, I would have taken an earlier train.'},
      {type:'tts-mcq',prompt:'Text → voice: listen to the sentence, then choose its closest meaning.',audio:'The proposal is unlikely to be approved unless the committee revises its underlying assumptions.',correct:'Approval probably requires the committee to change its basic assumptions.',options:['Approval probably requires the committee to change its basic assumptions.','The proposal has already been approved without changes.','The committee rejected every assumption before reading the proposal.','Approval is certain even if the assumptions remain unchanged.']},
      {type:'image-fill',prompt:'Image → text: describe what is happening in one precise English sentence.',scene:'station',keywords:['train','platform','person'],correct:'A person is waiting on a platform beside a train.'},
      {type:'translate-fill',prompt:'Translate into precise English: لو كنت قد راجعت البيانات بعناية أكبر، لما توصلت إلى ذلك الاستنتاج.',correct:'If I had reviewed the data more carefully, I would not have reached that conclusion.'},
      {type:'mcq',prompt:'Which sentence uses hedging appropriately in formal analysis?',correct:'The findings appear to suggest that the policy may have had a limited effect.',options:['The findings appear to suggest that the policy may have had a limited effect.','The findings absolutely prove everything forever.','The findings maybe are effecting policy definitely.','The findings proved perhaps certainly a limited effect.']},
      {type:'listen-fill',prompt:'Voice → text: transcribe the sentence exactly.',audio:'Not only did the intervention fail to reduce costs, but it also introduced additional administrative complexity.',correct:'Not only did the intervention fail to reduce costs, but it also introduced additional administrative complexity.'},
      {type:'image-fill',prompt:'Image → text: explain the scene in a complete English sentence.',scene:'presentation',keywords:['presentation','chart','people'],correct:'A presenter is explaining a chart to another person.'},
      {type:'translate-fill',prompt:'Translate into English: على الرغم من أن الأدلة تبدو مقنعة للوهلة الأولى، فإنها لا تبرر استنتاجاً قاطعاً.',correct:'Although the evidence appears convincing at first glance, it does not justify a definitive conclusion.'},
      {type:'tts-mcq',prompt:'Listen and choose the implication.',audio:'Much as I appreciate the ambition of the project, its implementation remains financially unsustainable.',correct:'The speaker respects the ambition but considers the implementation too costly to sustain.',options:['The speaker respects the ambition but considers the implementation too costly to sustain.','The speaker believes the project has no ambition.','The project has already become financially sustainable.','The speaker refuses to discuss implementation.']},
      {type:'mcq',prompt:'Choose the sentence with correct inversion.',correct:'Rarely have we encountered such a persistent discrepancy.',options:['Rarely have we encountered such a persistent discrepancy.','Rarely we have encountered such a persistent discrepancy.','Rarely did encountered we such discrepancy.','Rarely have encountered we such a discrepancy.']},
      {type:'translate-fill',prompt:'Translate into English: لولا القيود الزمنية، لكان من الممكن إجراء تحليل أكثر شمولاً للنتائج المتعارضة.',correct:'But for the time constraints, a more comprehensive analysis of the conflicting results could have been conducted.'},
      {type:'mcq',prompt:'Which option is the most precise C1-style reformulation?',correct:'The apparent correlation should not be interpreted as evidence of causality without further analysis.',options:['The apparent correlation should not be interpreted as evidence of causality without further analysis.','Correlation means causation and no more work is needed.','The things are related so one surely causes the other.','The apparent correlation is causal because it appears so.']},
      {type:'listen-fill',prompt:'Voice → text: transcribe this advanced sentence.',audio:'Were the underlying assumptions to change, the model would require substantial recalibration.',correct:'Were the underlying assumptions to change, the model would require substantial recalibration.'},
      {type:'translate-fill',prompt:'Translate into English: من المرجح أن يكون التباين ناتجاً جزئياً عن اختلاف طرق أخذ العينات، لا عن تغير حقيقي في الظاهرة نفسها.',correct:'The variation is likely to result partly from differences in sampling methods rather than from a genuine change in the phenomenon itself.'}
    ];
  }
  function answerSimilarity(value,correct){return similarity(value,correct);}
  function placementQuestionCorrect(question,value){
    const answer=String(value||'').trim();
    if(question.type==='mcq'||question.type==='tts-mcq')return answer===question.correct;
    if(question.keywords){
      const normalized=normalizeText(answer);
      const hits=question.keywords.filter(word=>normalized.includes(normalizeText(word))).length;
      return hits>=2&&normalized.split(' ').length>=5;
    }
    return answerSimilarity(answer,question.correct)>=.72;
  }
  function placementRecommendedLevel(score){
    if(score<30)return 0;
    if(score<45)return 1;
    if(score<62)return 2;
    if(score<80)return 3;
    return 4;
  }
  function renderPlacementQuestion(question,index){
    const name='placement-q'+index;
    if(question.type==='mcq'||question.type==='tts-mcq'){
      return '<fieldset class="placement-question"><legend><span>'+(index+1)+'</span>'+esc(question.prompt)+'</legend>'+
        (question.type==='tts-mcq'?'<button type="button" class="placement-listen" data-placement-listen="'+esc(question.audio)+'">▶ Play voice</button>':'')+
        question.options.map(option=>'<label><input type="radio" name="'+name+'" value="'+esc(option)+'" required><span>'+esc(option)+'</span></label>').join('')+'</fieldset>';
    }
    const visual=question.type==='image-fill'?'<div class="placement-scene">'+placementScene(question.scene)+'</div>':'';
    const listen=question.type==='listen-fill'?'<button type="button" class="placement-listen" data-placement-listen="'+esc(question.audio)+'">▶ Play voice</button>':'';
    return '<fieldset class="placement-question fill"><legend><span>'+(index+1)+'</span>'+esc(question.prompt)+'</legend>'+visual+listen+'<input type="text" name="'+name+'" autocomplete="off" required placeholder="Type your answer"></fieldset>';
  }
  function placementExamPage(){
    const questions=placementQuestions();
    return '<section class="language-course-page language-placement-page"><header class="language-page-head placement"><div><small>Placement examination</small><h1>Find my English level</h1><p>This is intentionally difficult. It combines text-to-voice, voice-to-text, image-to-text, advanced grammar and complex translation. It chooses a starting level; it does not complete skipped levels.</p></div><div class="language-context"><span>15 tasks</span><span>Multimodal</span><span>A1–C1</span></div></header>'+
      '<div class="placement-warning"><strong>Do not use translation tools.</strong><span>Your result starts you at Level · Step 1 · first box.</span></div>'+
      '<form id="language-placement-form" class="language-exam-form placement-form">'+questions.map(renderPlacementQuestion).join('')+'<button class="btn btn-primary" type="submit">Evaluate my level</button><div class="language-exam-result" id="language-placement-result"></div></form></section>';
  }
  function levelChallengePanel(state){
    return '<section class="language-level-challenges"><div><small>Independent level challenges</small><h2>Examine any level</h2><p>Score greater than 80% to mark only that level complete. Lower levels are not credited, and a gap still blocks studying higher levels.</p></div><div class="language-challenge-grid">'+CEFR.map((level,index)=>'<button type="button" data-challenge-level="'+index+'" class="'+(isLevelPassed(state,index)?'passed':'')+'"><span>'+level.id+'</span><strong>'+(isLevelPassed(state,index)?'✓ Completed':'Challenge level')+'</strong></button>').join('')+'</div></section>';
  }
  function assessmentTitle(ctx){
    if(ctx.scope==='box')return 'Box '+ctx.box+' examination';
    if(ctx.scope==='step')return 'Step '+ctx.step+' examination';
    if(ctx.scope==='level')return CEFR[ctx.li].id+' level examination';
    return 'Whole English language examination';
  }
  function assessmentDescription(ctx){
    if(ctx.scope==='box')return 'Pass at 80% or higher to finish this box.';
    if(ctx.scope==='step')return 'The last box has no separate box exam. This assessment covers the entire step and completes its last box when passed.';
    if(ctx.scope==='level')return 'The final step ends with one whole-level examination instead of a separate Step 5 final-box exam.';
    return 'The final C1 boundary is one comprehensive examination across the complete English pathway.';
  }
  function examFormMarkup(questions,mode,passed){
    if(!questions.length)return '<div class="language-exam-prereqs"><strong>Exam unavailable</strong><span>Add at least one exam question from Content Control → Control the exam.</span></div>';
    return '<form id="language-exam-form" data-exam-mode="'+mode+'" class="language-exam-form">'+questions.map((q,index)=>{
      const qid=q.id||('question-'+index);
      return '<fieldset class="language-exam-question-item" data-language-exam-item="'+esc(qid)+'"><legend><span>'+(index+1)+'</span>'+esc(q.prompt)+'</legend>'+q.options.map(option=>'<label><input type="radio" name="q'+index+'" value="'+esc(option)+'" required><span>'+esc(option)+'</span></label>').join('')+'</fieldset>';
    }).join('')+'<button class="btn btn-primary" type="submit" '+(passed?'disabled':'')+'>'+(passed?'✓ Exam passed':t('submitExam'))+'</button><div class="language-exam-result" id="language-exam-result"></div></form>';
  }

  function examinePage(){
    const state=languageState();
    if(state.placementPending)return placementExamPage();
    const pos=activeLanguagePosition(state),infoItems=languagePageItems(pos.li,pos.step,pos.box,'examine');
    const infoMarkup='<div class="language-content-item-grid language-exam-content-items">'+infoItems.map(item=>infoItemCard(item,'exam-information-item')).join('')+'</div>';
    if(Number.isInteger(state.challengeLevel)&&!languageAuthoringTarget){
      const li=state.challengeLevel,ctx={scope:'level',li,step:5,box:boxCount(li)},questions=assessmentQuestions(ctx),passed=isLevelPassed(state,li);
      return '<section class="language-course-page">'+languageHeader(state,pos,t('examine'),CEFR[li].id+' challenge examination','This challenge is independent of normal progression. Passing it completes only '+CEFR[li].id+'.')+
        infoMarkup+
        '<div class="language-exam-summary challenge"><div><small>Level challenge · '+CEFR[li].id+'</small><h2>Score greater than 80%</h2><p>Lower levels stay unchanged. You still need every earlier required level before studying a higher locked level.</p></div><span class="ready">'+(passed?'Completed':'Challenge')+'</span></div>'+
        '<button type="button" class="language-cancel-challenge" data-cancel-level-challenge>← Return to current exam</button>'+
        examFormMarkup(questions,'challenge',passed)+'</section>';
    }
    const ctx=naturalExamContext(pos.li,pos.step,pos.box),missing=languageAuthoringTarget?[]:assessmentMissing(state,ctx),ready=languageAuthoringTarget||missing.length===0,passed=assessmentPassed(state,ctx);
    const questions=ready?assessmentQuestions(ctx):[];
    return '<section class="language-course-page">'+languageHeader(state,pos,t('examine'),assessmentTitle(ctx),t('examIntro'))+
      boxSelector(state,pos)+infoMarkup+
      '<div class="language-exam-summary"><div><small>'+CEFR[pos.li].id+' · '+t('step')+' '+pos.step+'</small><h2>'+assessmentTitle(ctx)+'</h2><p>'+assessmentDescription(ctx)+'</p></div><span class="'+(ready?'ready':'locked')+'">'+(passed?'Passed':ready?'Ready':'Locked')+'</span></div>'+
      (!ready?'<div class="language-exam-prereqs"><strong>Still required</strong>'+missing.map(item=>'<span>'+esc(item)+'</span>').join('')+'</div>':examFormMarkup(questions,'natural',passed))+
      (languageAuthoringTarget?'':levelChallengePanel(state))+'</section>';
  }

  let personalTimer=null;
  const personalRoomKey=()=> 'dafatii:personal-focus-room:'+String(window.DafatiiCourses.active().id||'none')+':v1';
  function personalRoomPage(){
    const room=window.DafatiiData.readJSON(personalRoomKey(),{goal:'',notes:'',minutes:50,sessions:0})||{goal:'',notes:'',minutes:50,sessions:0};
    return '<section class="language-course-page personal-focus-page"><header class="personal-focus-hero"><div><small>Personal course · one private room</small><h1>My Focus Room</h1><p>A single distraction-controlled studio for deliberate study, session timing, working notes and materials.</p></div><div class="personal-focus-stat"><strong>'+Number(room.sessions||0)+'</strong><span>focus sessions</span></div></header><div class="personal-focus-grid"><article class="personal-focus-timer"><small>Focus block</small><div id="personal-focus-clock">'+String(Number(room.minutes||50)).padStart(2,'0')+':00</div><div><button type="button" data-personal-timer="start">Start</button><button type="button" data-personal-timer="reset">Reset</button></div><label>Minutes<input id="personal-focus-minutes" type="number" min="5" max="180" value="'+Number(room.minutes||50)+'"></label></article><article class="personal-focus-card"><small>One outcome</small><h2>What must be true when this block ends?</h2><textarea id="personal-focus-goal" rows="4" placeholder="Define one observable outcome…">'+esc(room.goal||'')+'</textarea><button type="button" data-personal-save>Save room</button></article><article class="personal-focus-card wide"><small>Working notes</small><h2>Keep the room quiet; capture only useful thinking.</h2><textarea id="personal-focus-notes" rows="10" placeholder="Notes, questions, formulas, links…">'+esc(room.notes||'')+'</textarea></article></div></section>';
  }
  function savePersonalRoom(extra={}){const previous=window.DafatiiData.readJSON(personalRoomKey(),{})||{};window.DafatiiData.writeJSON(personalRoomKey(),{...previous,...extra});}
  function bindPersonalRoom(){
    document.querySelector('[data-personal-save]')?.addEventListener('click',()=>{savePersonalRoom({goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});});
    document.querySelector('[data-personal-timer="reset"]')?.addEventListener('click',()=>{if(personalTimer){clearInterval(personalTimer);personalTimer=null;}const m=Number(document.getElementById('personal-focus-minutes').value)||50;document.getElementById('personal-focus-clock').textContent=String(m).padStart(2,'0')+':00';});
    document.querySelector('[data-personal-timer="start"]')?.addEventListener('click',()=>{if(personalTimer)return;let remaining=(Number(document.getElementById('personal-focus-minutes').value)||50)*60;const clock=document.getElementById('personal-focus-clock');personalTimer=setInterval(()=>{remaining--;clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');if(remaining<=0){clearInterval(personalTimer);personalTimer=null;const room=window.DafatiiData.readJSON(personalRoomKey(),{})||{};savePersonalRoom({sessions:Number(room.sessions||0)+1,goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});}},1000);});
  }

  function languageContent(page){
    if(page==='language-home')return homePage();
    if(page==='language-letters')return lettersPage();
    if(page==='language-voice')return voicePage();
    if(page==='language-grammar')return grammarPage();
    if(page==='language-review')return reviewPage();
    if(page==='language-examine')return examinePage();
    return homePage();
  }

  function installWorkspaceRoutes(){
    const previousContent=workspaceContent;
    workspaceContent=function(page,parts,title){
      if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return languageContent(page);
      if(courseType()==='personal'&&page==='study-rooms')return personalRoomPage();
      return previousContent(page,parts,title);
    };
    const previousWorkspace=workspace;
    workspace=function(current){
      const type=courseType(),page=String(current||'').split('/')[0];
      if(type==='language' && window.DafatiiCourses.active().id){
        const state=languageState();
        if(!languageAuthoringTarget&&state.placementPending&&page!=='language-examine'){setHash('language-examine');return;}
        if(!languageAuthoringTarget&&!state.onboardingComplete&&!state.placementPending&&page!=='language-home'){setHash('language-home');return;}
        if(!LANGUAGE_ROUTES.includes(page) && !['change-course','profile','settings','representer','admin'].includes(page)){setHash('language-home');return;}
      }
      if(type==='personal'&&page==='chat'){setHash('study-rooms');return;}
      previousWorkspace(current);
      adaptNavigation();
      if(type==='language')bindLanguagePage();
      if(type==='personal'&&page==='study-rooms')bindPersonalRoom();
    };
  }

  const navSpec=[
    ['language-home','nav-home','home'],['language-letters','nav-library','letters'],['language-voice','nav-messages','voice'],
    ['language-grammar','file','grammar'],['language-review','star','review'],['language-examine','check','examine']
  ];
  function icon(name){return window.DafatiiIcons && window.DafatiiIcons.icon ? window.DafatiiIcons.icon(name) : '<span>•</span>';}
  function languageNavLabel(item){
    if(item[0]!=='language-letters')return t(item[2]);
    const state=languageState(),li=Math.min(4,Math.max(0,Number(state.selectedLevel)||Number(state.entryLevel)||0));
    return li>0?t('video'):t('letters');
  }
  function sideLanguageNav(current){
    return navSpec.map(item=>'<a href="#'+item[0]+'" class="quiet-link '+(current===item[0]?'selected':'')+'" '+(current===item[0]?'aria-current="page"':'')+'>'+icon(item[1])+'<span>'+esc(languageNavLabel(item))+'</span></a>').join('');
  }
  function bottomLanguageNav(current){
    return navSpec.map(item=>'<a href="#'+item[0]+'" class="bottom-nav-item language-bottom-item '+(current===item[0]?'is-active':'')+'" '+(current===item[0]?'aria-current="page"':'')+'><span class="bottom-nav-icon">'+icon(item[1])+'</span><span class="bottom-nav-label">'+esc(languageNavLabel(item))+'</span></a>').join('');
  }
  function adaptNavigation(){
    const type=courseType(),current=(location.hash||'#language-home').replace(/^#\/?/,'').split('/')[0];
    if(type==='personal'){
      document.querySelectorAll('a[href^="#chat"],[data-page="chat"],[data-bottom-nav-item="chat"]').forEach(node=>node.remove());
      if(current==='study-rooms')document.querySelector('.quiet-workspace>.sub-nav')?.remove();
      return;
    }
    if(type!=='language')return;
    const side=document.querySelector('.quiet-sidebar > nav');
    if(side)side.innerHTML=sideLanguageNav(current);
    const desktop=document.querySelector('.quiet-desktop-tabs');
    if(desktop)desktop.innerHTML=sideLanguageNav(current);
    const bottom=document.querySelector('.bottom-nav');
    if(bottom)bottom.innerHTML=bottomLanguageNav(current);
    document.querySelector('.quiet-workspace')?.classList.add('language-course-shell');
  }

  function normalizeText(value){
    return String(value||'').toLowerCase().replace(/[^\p{L}\p{N}\s']/gu,' ').replace(/\s+/g,' ').trim();
  }
  function similarity(a,b){
    const x=normalizeText(a).split(' '),y=normalizeText(b).split(' ');
    if(!x.length||!y.length)return 0;
    const ys=new Map();y.forEach(word=>ys.set(word,(ys.get(word)||0)+1));
    let match=0;x.forEach(word=>{if(ys.get(word)>0){match++;ys.set(word,ys.get(word)-1);}});
    return (2*match)/(x.length+y.length);
  }
  function speak(text){
    if(!('speechSynthesis' in window))return;
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(String(text||''));utterance.lang='en-US';utterance.rate=.88;speechSynthesis.speak(utterance);
  }
  function speakLetter(letter){
    const key=String(letter||'').toUpperCase();
    speak(LETTER_SPEECH[key]||key);
  }
  function rasterGrid(data,width,height,cols=30,rows=18){
    const grid=new Uint8Array(cols*rows);
    for(let row=0;row<rows;row++){
      const y0=Math.floor(row*height/rows),y1=Math.max(y0+1,Math.floor((row+1)*height/rows));
      for(let col=0;col<cols;col++){
        const x0=Math.floor(col*width/cols),x1=Math.max(x0+1,Math.floor((col+1)*width/cols));
        let hits=0,samples=0;
        for(let y=y0;y<y1;y+=2){
          for(let x=x0;x<x1;x+=2){
            samples++;
            if(data[(y*width+x)*4+3]>24)hits++;
          }
        }
        if(samples&&hits/samples>=.035)grid[row*cols+col]=1;
      }
    }
    return {grid,cols,rows};
  }
  function glyphGuideGrid(canvas,letter,kind){
    const guide=document.createElement('canvas');guide.width=canvas.width;guide.height=canvas.height;
    const ctx=guide.getContext('2d',{willReadFrequently:true});
    const glyph=kind==='lower'?String(letter).toLowerCase():String(letter).toUpperCase();
    ctx.clearRect(0,0,guide.width,guide.height);
    ctx.fillStyle='#000';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='900 '+Math.round(guide.height*.72)+'px Manrope, "DM Sans", sans-serif';
    ctx.fillText(glyph,guide.width/2,guide.height/2+guide.height*.035);
    return rasterGrid(ctx.getImageData(0,0,guide.width,guide.height).data,guide.width,guide.height);
  }
  function hasNeighbor(grid,col,row,cols,rows,radius=1){
    for(let y=Math.max(0,row-radius);y<=Math.min(rows-1,row+radius);y++){
      for(let x=Math.max(0,col-radius);x<=Math.min(cols-1,col+radius);x++){
        if(grid[y*cols+x])return true;
      }
    }
    return false;
  }
  function scoreLetterCanvas(canvas,letter,kind){
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const user=rasterGrid(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
    const guide=glyphGuideGrid(canvas,letter,kind);
    let guideCount=0,userCount=0,covered=0,onGuide=0;
    for(let row=0;row<guide.rows;row++){
      for(let col=0;col<guide.cols;col++){
        const index=row*guide.cols+col;
        if(guide.grid[index]){
          guideCount++;
          if(hasNeighbor(user.grid,col,row,user.cols,user.rows,1))covered++;
        }
        if(user.grid[index]){
          userCount++;
          if(hasNeighbor(guide.grid,col,row,guide.cols,guide.rows,1))onGuide++;
        }
      }
    }
    if(!guideCount||!userCount)return {valid:false,score:0,coverage:0,precision:0};
    const coverage=covered/guideCount,precision=onGuide/userCount;
    const score=coverage*.58+precision*.42;
    const enoughInk=userCount>=Math.max(5,guideCount*.36);
    return {valid:enoughInk&&coverage>=.60&&precision>=.58&&score>=.64,score,coverage,precision};
  }
  function bindValidatedLetterCanvas(canvas,letter,kind,onScore){
    if(!canvas)return;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.lineWidth=Math.max(10,Math.round(canvas.width/62));ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#111827';
    let drawing=false,last=null;
    const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)};};
    const drawEvent=e=>{
      const events=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[e];
      for(const item of events){
        const p=point(item);
        if(!last){ctx.beginPath();ctx.moveTo(p.x,p.y);last=p;continue;}
        const mid={x:(last.x+p.x)/2,y:(last.y+p.y)/2};
        ctx.quadraticCurveTo(last.x,last.y,mid.x,mid.y);ctx.stroke();last=p;
      }
    };
    const evaluate=()=>{const result=scoreLetterCanvas(canvas,letter,kind);canvas.dataset.valid=String(result.valid);canvas.dataset.score=String(result.score);onScore(result);};
    canvas.onpointerdown=e=>{if(e.cancelable)e.preventDefault();drawing=true;canvas.setPointerCapture(e.pointerId);last=null;drawEvent(e);};
    canvas.onpointermove=e=>{if(!drawing)return;if(e.cancelable)e.preventDefault();drawEvent(e);};
    canvas.onpointerup=e=>{if(!drawing)return;if(e.cancelable)e.preventDefault();drawEvent(e);drawing=false;last=null;evaluate();};
    canvas.onpointercancel=()=>{drawing=false;last=null;evaluate();};
    canvas.__letterClear=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);canvas.dataset.valid='false';canvas.dataset.score='0';onScore({valid:false,score:0,coverage:0,precision:0});};
  }
  function bindLetterDrawing(){
    const upper=document.getElementById('letter-upper-canvas'),lower=document.getElementById('letter-lower-canvas');
    const complete=document.querySelector('[data-letter-complete]'),next=document.querySelector('[data-letter-next]'),feedback=document.querySelector('[data-letter-feedback]');
    if(!upper||!lower||!complete)return;
    const letter=complete.dataset.letterComplete||'A',alreadyDone=complete.dataset.letterDone==='true';
    let upperResult={valid:false,score:0},lowerResult={valid:false,score:0};
    const update=()=>{
      if(alreadyDone){
        complete.disabled=true;if(next)next.disabled=false;
        if(feedback)feedback.textContent='✓ '+letter+' is already completed. You can retrace it for practice or continue.';
        return;
      }
      const valid=upperResult.valid&&lowerResult.valid;
      complete.disabled=!valid;if(next)next.disabled=true;
      const upperPct=Math.round((upperResult.score||0)*100),lowerPct=Math.round((lowerResult.score||0)*100);
      if(feedback)feedback.textContent=valid
        ? '✓ Both shapes match the guide closely enough. Complete '+letter+' to continue.'
        : 'Keep tracing the gray guide · uppercase '+upperPct+'% · lowercase '+lowerPct+'%.';
    };
    bindValidatedLetterCanvas(upper,letter,'upper',result=>{upperResult=result;update();});
    bindValidatedLetterCanvas(lower,letter,'lower',result=>{lowerResult=result;update();});
    document.querySelectorAll('[data-canvas-clear]').forEach(button=>button.onclick=()=>{
      const canvas=document.getElementById(button.dataset.canvasClear);canvas?.__letterClear?.();
    });
    update();
  }

  function videoResponseValid(li,value){
    const text=String(value||'').trim();
    if(li<=2){
      const arabic=(text.match(/[\u0600-\u06FF]/g)||[]).length;
      return arabic>=30&&text.split(/\s+/).length>=8;
    }
    const latin=(text.match(/[A-Za-z]/g)||[]).length;
    const arabic=(text.match(/[\u0600-\u06FF]/g)||[]).length;
    return latin>=50&&arabic<8&&text.split(/\s+/).length>=12;
  }
  function bindVideoUnderstanding(){
    const watchedButton=document.querySelector('[data-video-watched]'),field=document.getElementById('language-video-response');
    const complete=document.querySelector('[data-language-module="video"]'),feedback=document.querySelector('[data-video-response-feedback]');
    if(!field||!complete)return;
    const state=languageState(),pos=activeLanguagePosition(state),id=keyBox(CEFR[pos.li].id,pos.step,pos.box);
    const items=languagePageItems(pos.li,pos.step,pos.box,'letters'),videoItem=items.find(item=>item.type==='video'),responseItem=items.find(item=>item.type==='response');
    if(!videoItem||!responseItem)return;
    const youtubeUrl=String(videoItem.youtubeUrl||'').trim(),validYouTube=/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(youtubeUrl);
    const responseLanguage=videoItem.responseLanguage||'English';
    let watched=Boolean(state.watchedVideos[id]);
    const updateGate=()=>{
      const valid=videoResponseValid(pos.li,field.value);
      complete.disabled=complete.classList.contains('done')?false:!(validYouTube&&watched&&valid);
      if(!complete.classList.contains('done'))complete.textContent=!validYouTube?'Add a valid YouTube video link first':!watched?'Watch the YouTube video first':(valid?t('complete'):'Write a fuller response in '+responseLanguage);
      if(feedback)feedback.textContent=valid?'Response length and language are ready.':(responseLanguage==='Arabic'?'اكتب شرحاً عربياً أطول يتضمن الفكرة الرئيسية وتفصيلين.':'Write a fuller English explanation with the main idea and supporting details.');
    };
    watchedButton?.addEventListener('click',()=>{
      if(!validYouTube)return;
      watched=true;
      watchedButton.textContent='✓ Watched';
      updateLanguage(value=>{value.watchedVideos[id]=true;});
      updateGate();
    });
    field.addEventListener('input',updateGate);
    field.addEventListener('blur',()=>updateLanguage(value=>{value.videoResponses[id]=field.value;}));
    complete.onclick=()=>{
      if(complete.disabled)return;
      updateLanguage(value=>{value.videoResponses[id]=field.value;});
      markModule('video');
    };
    updateGate();
  }

  function bindPlacementExam(){
    document.querySelectorAll('[data-placement-listen]').forEach(button=>button.onclick=()=>speak(button.dataset.placementListen));
    const form=document.getElementById('language-placement-form');
    if(!form)return;
    form.onsubmit=event=>{
      event.preventDefault();
      const questions=placementQuestions(),data=new FormData(form);
      let correct=0;
      questions.forEach((question,index)=>{if(placementQuestionCorrect(question,data.get('placement-q'+index)))correct++;});
      const score=Math.round(correct/questions.length*100),li=placementRecommendedLevel(score),result=document.getElementById('language-placement-result');
      updateLanguage(state=>{
        state.onboardingComplete=true;state.placementPending=false;state.placementResult={score,level:CEFR[li].id,at:Date.now()};
        state.entryLevel=li;state.selectedLevel=li;state.selectedStep=1;state.selectedBox=1;state.challengeLevel=null;
        state.examHistory.push({scope:'placement',score,level:CEFR[li].id,at:Date.now()});
      });
      result.className='language-exam-result passed';
      result.textContent='Placement result · '+score+'% · Start at '+CEFR[li].id+' · Step 1 · first box. Skipped lower levels were not marked complete.';
      setTimeout(()=>setHash('language-home'),1200);
    };
  }
  function bindLanguagePage(){
    const authoring=adminLanguageAuthoring();
    document.querySelectorAll('[data-speak]').forEach(button=>button.onclick=()=>speak(button.dataset.speak));
    document.querySelectorAll('[data-speak-letter]').forEach(button=>button.onclick=()=>speakLetter(button.dataset.speakLetter));
    document.querySelector('[data-language-ui-switch]')?.addEventListener('click',()=>{applyInterfaceLanguage(lang()==='ar'?'en':'ar');render();});

    document.querySelector('[data-language-start-zero]')?.addEventListener('click',()=>{
      updateLanguage(state=>{state.onboardingComplete=true;state.placementPending=false;state.placementResult=null;state.entryLevel=0;state.selectedLevel=0;state.selectedStep=1;state.selectedBox=1;});
      render();
    });
    document.querySelector('[data-language-placement-start]')?.addEventListener('click',()=>{
      updateLanguage(state=>{state.placementPending=true;state.challengeLevel=null;});
      setHash('language-examine');
    });

    document.querySelectorAll('[data-language-level]').forEach(button=>button.onclick=()=>{const li=Number(button.dataset.languageLevel);if(authoring){setLanguageAuthoringTarget({li,step:1,box:1});render();return;}updateLanguage(state=>{if(levelUnlocked(state,li)){state.selectedLevel=li;state.selectedStep=1;state.selectedBox=1;}});render();});
    document.querySelectorAll('[data-language-step]').forEach(button=>button.onclick=()=>{const step=Number(button.dataset.languageStep);if(authoring){setLanguageAuthoringTarget({step,box:1});render();return;}updateLanguage(state=>{const pos=clampSelection(state);if(stepUnlocked(state,pos.li,step)){state.selectedStep=step;state.selectedBox=1;}});render();});
    document.querySelectorAll('[data-language-box]').forEach(button=>button.onclick=()=>{const box=Number(button.dataset.languageBox);if(authoring){setLanguageAuthoringTarget({box});render();return;}updateLanguage(state=>{const pos=clampSelection(state);if(boxUnlocked(state,pos.li,pos.step,box))state.selectedBox=box;});render();});

    if(authoring){bindLetterDrawing();return;}

    document.querySelectorAll('[data-letter-select]').forEach(button=>button.onclick=()=>{const letter=button.dataset.letterSelect;updateLanguage(state=>{const pos=clampSelection(state);state.activeLetterByStep[letterProgressKey(pos.li,pos.step)]=letter;});render();});
    document.querySelector('[data-letter-next]')?.addEventListener('click',event=>{if(event.currentTarget.disabled)return;updateLanguage(state=>{const pos=clampSelection(state),pkey=letterProgressKey(pos.li,pos.step),current=state.activeLetterByStep[pkey]||LETTERS.find(letter=>!(state.letterProgress[pkey]||[]).includes(letter))||'A';const index=LETTERS.indexOf(current);state.activeLetterByStep[pkey]=LETTERS[(index+1)%LETTERS.length];});render();});
    document.querySelector('[data-letter-complete]')?.addEventListener('click',event=>{
      if(event.currentTarget.disabled)return;
      const letter=event.currentTarget.dataset.letterComplete;
      updateLanguage(state=>{const pos=clampSelection(state),pkey=letterProgressKey(pos.li,pos.step),list=state.letterProgress[pkey]||[];state.letterProgress[pkey]=arrayUnique([...list,letter]);const next=LETTERS.find(item=>!state.letterProgress[pkey].includes(item));if(next)state.activeLetterByStep[pkey]=next;syncBoxCompletion(state,pos.li,pos.step,pos.box);});
      render();
    });

    const pronunciationWriting=document.getElementById('language-pronunciation-writing'),pronunciationComplete=document.querySelector('[data-language-module="pronunciation"]');
    if(pronunciationWriting&&pronunciationComplete&&!pronunciationComplete.classList.contains('done')){
      const update=()=>{pronunciationComplete.disabled=normalizeText(pronunciationWriting.value).length<20;pronunciationComplete.textContent=pronunciationComplete.disabled?'Complete the writing task first':t('complete');};
      pronunciationWriting.addEventListener('input',update);update();
    }
    const grammarWriting=document.getElementById('language-grammar-writing'),grammarComplete=document.querySelector('[data-language-module="grammar"]');
    if(grammarWriting&&grammarComplete&&!grammarComplete.classList.contains('done')){
      const update=()=>{grammarComplete.disabled=normalizeText(grammarWriting.value).length<20;grammarComplete.textContent=grammarComplete.disabled?'Write your examples first':t('complete');};
      grammarWriting.addEventListener('input',update);update();
    }

    document.querySelectorAll('[data-language-module]').forEach(button=>{
      if(button.dataset.languageModule==='video')return;
      button.onclick=()=>{if(!button.disabled)markModule(button.dataset.languageModule);};
    });

    const voiceComplete=document.querySelector('[data-language-module="voice"]');
    let dictationPassed=false,reversePassed=false;
    const updateVoice=()=>{if(voiceComplete&&!voiceComplete.classList.contains('done')){voiceComplete.disabled=!(dictationPassed&&reversePassed);voiceComplete.textContent=voiceComplete.disabled?'Complete both voice exercises first':t('complete');}};
    document.querySelector('[data-check-dictation]')?.addEventListener('click',event=>{
      const score=similarity(document.getElementById('language-dictation').value,event.currentTarget.dataset.checkDictation);
      dictationPassed=score>=.92;document.querySelector('[data-dictation-feedback]').textContent=dictationPassed?'Excellent match.':'Try again. Focus on every content word and ending.';updateVoice();
    });
    document.querySelector('[data-check-reverse]')?.addEventListener('click',event=>{
      const score=similarity(document.getElementById('language-reverse-fallback').value,event.currentTarget.dataset.checkReverse);
      reversePassed=score>=.86;document.querySelector('[data-reverse-feedback]').textContent=reversePassed?'Clear match.':'Try again and keep the same meaning and key wording.';updateVoice();
    });
    document.querySelector('[data-recognize]')?.addEventListener('click',()=>{
      const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      const field=document.getElementById('language-reverse-fallback'),feedback=document.querySelector('[data-reverse-feedback]');
      if(!Recognition){feedback.textContent='Speech recognition is not available in this browser. Type what you said, then check it.';field.focus();return;}
      const recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
      recognition.onresult=e=>{field.value=e.results[0][0].transcript;feedback.textContent='Captured. Check the result.';};
      recognition.onerror=()=>{feedback.textContent='Recognition failed. You can type the spoken sentence instead.';};recognition.start();
    });

    document.querySelector('[data-save-language-notes]')?.addEventListener('click',event=>{const id=event.currentTarget.dataset.saveLanguageNotes,value=document.getElementById('language-box-notes').value;updateLanguage(state=>{state.notes[id]=value;});event.currentTarget.textContent='✓ '+t('save');});

    document.querySelectorAll('[data-challenge-level]').forEach(button=>button.onclick=()=>{
      updateLanguage(state=>{state.challengeLevel=Number(button.dataset.challengeLevel);state.placementPending=false;});
      render();
    });
    document.querySelector('[data-cancel-level-challenge]')?.addEventListener('click',()=>{updateLanguage(state=>{state.challengeLevel=null;});render();});

    const exam=document.getElementById('language-exam-form');
    if(exam)exam.onsubmit=event=>{
      event.preventDefault();
      const state=languageState(),mode=exam.dataset.examMode||'natural';
      let ctx;
      if(mode==='challenge'){
        const li=state.challengeLevel;if(!Number.isInteger(li))return;
        ctx={scope:'level',li,step:5,box:boxCount(li)};
      }else{
        const pos=clampSelection(state);ctx=currentAssessment(state,pos);
        if(assessmentMissing(state,ctx).length)return;
      }
      const questions=assessmentQuestions(ctx),form=new FormData(exam);
      let correct=0;questions.forEach((q,index)=>{if(form.get('q'+index)===q.correct)correct++;});
      const score=Math.round((correct/questions.length)*100),passed=mode==='challenge'?score>80:score>=80,result=document.getElementById('language-exam-result');
      updateLanguage(value=>{
        value.examHistory.push({scope:mode==='challenge'?'level-challenge':ctx.scope,level:CEFR[ctx.li].id,step:ctx.step,box:ctx.box,score,passed,at:Date.now()});
        if(passed){
          if(mode==='challenge')applyLevelChallengePass(value,ctx.li);
          else applyAssessmentPass(value,ctx);
        }
      });
      if(passed){
        result.className='language-exam-result passed';
        result.textContent=mode==='challenge'
          ? 'Passed · '+score+'%. '+CEFR[ctx.li].id+' is complete. Lower levels were not changed.'
          : 'Passed · '+score+'%. '+assessmentTitle(ctx)+' is complete.';
        setTimeout(()=>render(),1000);
      }else{
        result.className='language-exam-result failed';
        result.textContent='Score '+score+'%. '+(mode==='challenge'?'A level challenge requires greater than 80%.':'Pass mark is 80%. Review and retry.');
      }
    };

    bindPlacementExam();
    bindVideoUnderstanding();
    bindLetterDrawing();
  }

  function installCourseChangeRouting(){
    window.addEventListener('dafatii:coursechanged',()=>{
      const current=(location.hash||'').replace(/^#\/?/,'').split('/')[0];
      if(current!=='change-course')return;
      setTimeout(()=>setHash(courseType()==='language'?'language-home':'dashboard/overview'),0);
    });
  }

  wrapCourseCreation();
  installCreateInterceptor();
  installWorkspaceRoutes();
  installCourseChangeRouting();
  window.DafatiiCourseModes=Object.freeze({
    courseType,isLanguage,levels:CEFR,boxData,boxCount,totalBoxes:TOTAL_LANGUAGE_BOXES,openTypeChooser,
    languageAuthoring:Object.freeze({
      pages:['letters','voice','grammar','review','examine'],
      pageName:languagePageName,
      getItems:selection=>languagePageItems(selection.li,selection.step,selection.box,selection.page).map(item=>({...item})),
      getSchemas:(page,li)=>languageItemSchemas(page,li),
      createItem:createLanguageItem,
      saveItem:saveLanguageItem,
      deleteItem:deleteLanguageItem,
      emptyPage:emptyLanguagePage,
      resetPage:resetLanguagePage,
      begin:beginLanguageAuthoring,
      end:endLanguageAuthoring,
      current:()=>languageAuthoringTarget?{...languageAuthoringTarget}:null,
      examContext:selection=>naturalExamContext(selection.li,selection.step,selection.box),
      getExamQuestions:selection=>examQuestionsFor(naturalExamContext(selection.li,selection.step,selection.box)).map((q,index)=>({...q,id:q.id||('q-'+index)})),
      saveExamQuestion,
      deleteExamQuestion,
      emptyExamQuestions
    })
  });
})();