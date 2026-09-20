(() => {
  'use strict';

  const META_VERSION = 1;
  const COURSE_TYPES = ['dafaa','personal','teaching','language'];
  const LANGUAGE_ROUTES = ['language-home','language-letters','language-voice','language-grammar','language-review','language-examine'];
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
      home:'Home',letters:'Letters & sounds',voice:'Voice lab',grammar:'Grammar',review:'Revision',examine:'Examine',
      complete:'Mark section complete',completed:'Completed',locked:'Locked',listen:'Play voice',check:'Check answer',
      speak:'Speak this sentence',start:'Start recognition',notes:'My notes',save:'Save notes',level:'Level',step:'Step',box:'Box',
      pass:'Pass mark: 80%',takeExam:'Take exam',submitExam:'Submit exam',welcome:'Welcome',resume:'Resume learning',
      changeLevel:'Change level',progress:'Course progress',current:'Current',available:'Available',passed:'Passed',
      lettersIntro:'Sound, letter-shape and writing practice',voiceIntro:'Dictation and reverse speaking practice',
      grammarIntro:'Grammar, naming, spelling and typing rules',reviewIntro:'Retrieval, learning tricks and durable notes',
      examIntro:'Box, step and level assessments are always available. Passing a later assessment credits prerequisite content.'
    },
    ar:{
      home:'الرئيسية',letters:'الحروف والأصوات',voice:'مختبر الصوت',grammar:'القواعد',review:'المراجعة',examine:'الاختبار',
      complete:'إكمال هذا الجزء',completed:'مكتمل',locked:'مغلق',listen:'تشغيل الصوت',check:'تحقق من الإجابة',
      speak:'انطق هذه الجملة',start:'ابدأ التعرّف على الصوت',notes:'ملاحظاتي',save:'حفظ الملاحظات',level:'المستوى',step:'الخطوة',box:'الصندوق',
      pass:'درجة النجاح: 80٪',takeExam:'ابدأ الاختبار',submitExam:'إرسال الاختبار',welcome:'مرحباً',resume:'متابعة التعلّم',
      changeLevel:'تغيير المستوى',progress:'تقدم الدورة',current:'الحالي',available:'متاح',passed:'مجتاز',
      lettersIntro:'تدريب الأصوات وأشكال الحروف والكتابة',voiceIntro:'إملاء صوتي وتدريب عكسي على النطق',
      grammarIntro:'القواعد والتسمية والإملاء والكتابة',reviewIntro:'استرجاع ومهارات تعلّم وملاحظات ثابتة',
      examIntro:'اختبارات الصندوق والخطوة والمستوى متاحة دائماً. النجاح في اختبار متقدم يحتسب المحتوى السابق.'
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

  function defaultLanguageLearning(){
    return {
      version:META_VERSION,targetLanguage:'English',selectedLevel:0,selectedStep:1,selectedBox:1,
      passedLevels:[],passedSteps:[],passedBoxes:[],modules:{},notes:{},examHistory:[]
    };
  }
  const progressKey=()=> 'dafatii:language-progress:'+String(window.DafatiiCourses.active().id||'none')+':v1';
  function languageState(){
    const stored=window.DafatiiData.readJSON(progressKey(),null);
    const value=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:defaultLanguageLearning();
    value.passedLevels=Array.isArray(value.passedLevels)?value.passedLevels:[];
    value.passedSteps=Array.isArray(value.passedSteps)?value.passedSteps:[];
    value.passedBoxes=Array.isArray(value.passedBoxes)?value.passedBoxes:[];
    value.modules=value.modules&&typeof value.modules==='object'?value.modules:{};
    value.notes=value.notes&&typeof value.notes==='object'?value.notes:{};
    value.examHistory=Array.isArray(value.examHistory)?value.examHistory:[];
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
      const course=await originalCreate(input);
      const suite=readSuite();
      suite.courseMeta={
        version:META_VERSION,courseType:type,targetLanguage:type==='language'?(input.targetLanguage||'English'):'',
        studyType:type==='language'?'language':(input.studyType||'courses')
      };
      if(type==='language'){
        const initialProgress=defaultLanguageLearning();
        initialProgress.targetLanguage=input.targetLanguage||'English';
        window.DafatiiData.writeJSON('dafatii:language-progress:'+String(course.id)+':v1',initialProgress);
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
    ];
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
    const isLang=type==='language',isPersonal=type==='personal';
    const defaultName=isLang?'English Learning':isPersonal?'My Personal Course':'';
    const personalSecret=isPersonal
      ? (crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,20):(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).slice(0,20))
      : '';
    const templateField=isLang?'<input type="hidden" name="templateName" value="Computer Science">':'<div class="field"><label>Content template</label><select name="templateName">'+templates.map(name=>'<option>'+esc(name)+'</option>').join('')+'</select></div>';
    const studyField=isLang?'<input type="hidden" name="studyType" value="courses"><div class="field"><label>Target language</label><select name="targetLanguage"><option value="English" selected>English · الإنجليزية</option></select><p class="auth-note">Five levels: A1, A2, B1, B2 and C1 · 5 steps per level · 26 boxes per step.</p></div>':'<div class="field"><label>Study structure</label><select name="studyType">'+studyTypeOptions()+'</select></div>';
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

  function levelIndex(id){ return Math.max(0,CEFR.findIndex(level=>level.id===id)); }
  function isLevelPassed(state,li){ return state.passedLevels.includes(CEFR[li].id); }
  function isStepPassed(state,li,step){ return state.passedSteps.includes(keyStep(CEFR[li].id,step)); }
  function isBoxPassed(state,li,step,box){ return state.passedBoxes.includes(keyBox(CEFR[li].id,step,box)); }
  function levelUnlocked(state,li){ return li===0 || isLevelPassed(state,li-1); }
  function stepUnlocked(state,li,step){ return levelUnlocked(state,li) && (step===1 || isStepPassed(state,li,step-1)); }
  function boxUnlocked(state,li,step,box){ return stepUnlocked(state,li,step) && (box===1 || isBoxPassed(state,li,step,box-1)); }

  function clampSelection(state){
    let li=Math.min(4,Math.max(0,Number(state.selectedLevel)||0));
    if(!levelUnlocked(state,li)) li=Math.max(0,CEFR.findIndex((_,index)=>!levelUnlocked(state,index))-1);
    let step=Math.min(5,Math.max(1,Number(state.selectedStep)||1));
    while(step>1&&!stepUnlocked(state,li,step))step--;
    let box=Math.min(26,Math.max(1,Number(state.selectedBox)||1));
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
    const level=CEFR[li],seed=(step-1)*25+Math.max(0,box-2);
    const topic=level.topics[seed%level.topics.length];
    const grammar=level.grammar[seed%level.grammar.length];
    const words=pickWrapped(level.words,(seed*3)%level.words.length,7);
    const frames=[
      ['I practice '+topic+' with '+words[0]+' and '+words[1]+'.','Please say: '+words[2]+' is important for my '+topic+'.'],
      ['Yesterday I used '+words[0]+' while working on '+topic+', and today I am improving '+words[1]+'.','Explain why '+words[2]+' is useful when discussing '+topic+'.'],
      ['Although '+topic+' can be challenging, '+words[0]+' helps me make a better '+words[1]+'.','Give a connected explanation of '+topic+' using '+words[2]+' and '+words[3]+'.'],
      ['A credible discussion of '+topic+' should evaluate '+words[0]+' as well as its '+words[1]+'.','Summarize a balanced position on '+topic+' and justify one '+words[2]+'.'],
      ['A nuanced account of '+topic+' should distinguish the central '+words[0]+' from a merely '+words[1]+' consideration.','Articulate a defensible position on '+topic+', qualify its main '+words[2]+', and acknowledge one counterargument.']
    ][li];
    return {
      level:level.id,step,box,topic,title:'Box '+box+' · '+topic,
      goal:box===1?'Sound and writing control for this step':'Integrate listening, speaking, grammar, vocabulary and revision around '+topic+'.',
      voicePrompt:frames[0],reversePrompt:frames[1],grammarTitle:grammar[0],grammarRule:grammar[1],grammarExample1:grammar[2],grammarExample2:grammar[3],
      naming:'Naming rule: prefer a clear concrete noun first, then add only the modifiers needed to identify it in context.',
      typing:li<2?'Writing rule: start sentences with a capital letter, separate words with one space, and close complete statements with punctuation.':'Writing rule: use punctuation and paragraph boundaries to expose syntax, information structure and logical relations rather than merely marking pauses.',
      words, trick:['Say it, cover it, retrieve it, then check it.','Alternate recognition with production instead of rereading.','Compress the idea into one sentence, then expand it from memory.','Contrast a correct example with a near-miss and explain the difference.','Rephrase the idea twice: once plainly and once in formal C1 register.'][li],
      recall:'Without looking back, explain '+grammar[0]+' and use '+words[0]+', '+words[1]+' and '+words[2]+' in one coherent response.'
    };
  }

  function creditBox(state,id){
    state.passedBoxes.push(id);
    state.modules[id]={...(state.modules[id]||{}),letters:true,voice:true,grammar:true,review:true,exam:true};
  }
  function markPriorLevels(state,li){
    for(let l=0;l<li;l++){
      const id=CEFR[l].id;
      state.passedLevels.push(id);
      for(let s=1;s<=5;s++){
        state.passedSteps.push(keyStep(id,s));
        for(let b=1;b<=26;b++)creditBox(state,keyBox(id,s,b));
      }
    }
  }
  function markPass(scope,li,step,box){
    updateLanguage(state=>{
      state.passedLevels=Array.isArray(state.passedLevels)?state.passedLevels:[];
      state.passedSteps=Array.isArray(state.passedSteps)?state.passedSteps:[];
      state.passedBoxes=Array.isArray(state.passedBoxes)?state.passedBoxes:[];
      state.modules=state.modules&&typeof state.modules==='object'?state.modules:{};
      markPriorLevels(state,li);
      const id=CEFR[li].id;
      for(let s=1;s<step;s++){
        state.passedSteps.push(keyStep(id,s));
        for(let b=1;b<=26;b++)creditBox(state,keyBox(id,s,b));
      }
      if(scope==='box'){
        for(let b=1;b<=box;b++)creditBox(state,keyBox(id,step,b));
        state.selectedLevel=li;state.selectedStep=step;state.selectedBox=Math.min(26,box+1);
      }else if(scope==='step'){
        for(let b=1;b<=26;b++)creditBox(state,keyBox(id,step,b));
        state.passedSteps.push(keyStep(id,step));
        state.selectedLevel=li;state.selectedStep=Math.min(5,step+1);state.selectedBox=1;
      }else{
        for(let s=1;s<=5;s++){
          state.passedSteps.push(keyStep(id,s));
          for(let b=1;b<=26;b++)creditBox(state,keyBox(id,s,b));
        }
        state.passedLevels.push(id);
        state.selectedLevel=Math.min(4,li+1);state.selectedStep=1;state.selectedBox=1;
      }
      state.passedLevels=arrayUnique(state.passedLevels);
      state.passedSteps=arrayUnique(state.passedSteps);
      state.passedBoxes=arrayUnique(state.passedBoxes);
    });
  }

  function markModule(module){
    updateLanguage(state=>{
      const pos=clampSelection(state),id=keyBox(CEFR[pos.li].id,pos.step,pos.box);
      state.modules[id]=state.modules[id]||{};
      state.modules[id][module]=true;
    });
    render();
  }

  function languageHeader(state,pos,kicker,title,description){
    const level=CEFR[pos.li];
    return '<header class="language-page-head"><div><small>'+esc(kicker)+'</small><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></div><div class="language-context"><button type="button" data-language-ui-switch>'+(lang()==='ar'?'EN':'ع')+'</button><span>'+level.id+'</span><span>'+t('step')+' '+pos.step+'</span><span>'+t('box')+' '+pos.box+'</span></div></header>';
  }

  function progressPercent(state){
    const passed=state.passedBoxes.length;
    return Math.min(100,Math.round((passed/(5*5*26))*100));
  }

  function homePage(){
    const state=languageState(),pos=clampSelection(state),level=CEFR[pos.li],name=window.DafatiiAuth.user && window.DafatiiAuth.user.displayName || 'Student';
    const levels=CEFR.map((item,index)=>{
      const unlocked=levelUnlocked(state,index),passed=isLevelPassed(state,index),selected=index===pos.li;
      return '<button class="language-level-card '+(selected?'selected ':'')+(passed?'passed ':'')+(!unlocked?'locked':'')+'" data-language-level="'+index+'" '+(unlocked?'':'disabled')+'><span>'+item.id+'</span><div><strong>'+esc(lang()==='ar'?item.ar:item.title)+'</strong><p>'+esc(item.description)+'</p></div><b>'+(passed?'✓':unlocked?'→':'🔒')+'</b></button>';
    }).join('');
    return '<section class="language-course-page language-home">'+languageHeader(state,pos,t('welcome')+', '+name,level.id+' · '+(lang()==='ar'?level.ar:level.title),level.description)+
      '<div class="language-hero-grid"><article class="language-progress-hero"><div><small>'+t('progress')+'</small><strong>'+progressPercent(state)+'%</strong><p>650 structured learning boxes · '+state.passedBoxes.length+' passed</p></div><div class="language-ring" style="--value:'+progressPercent(state)+'"><span>'+progressPercent(state)+'%</span></div></article>'+
      '<article class="language-resume-card"><small>'+t('current')+'</small><h2>'+level.id+' · '+t('step')+' '+pos.step+' · '+t('box')+' '+pos.box+'</h2><p>'+esc(boxData(pos.li,pos.step,pos.box).goal)+'</p><a href="#'+(pos.box===1?'language-letters':'language-voice')+'">'+t('resume')+' →</a></article></div>'+
      '<section class="language-levels"><div class="language-section-title"><div><small>CEFR pathway</small><h2>'+t('changeLevel')+'</h2></div><span>A1 → C1</span></div>'+levels+'</section></section>';
  }

  function alphabetMarkup(){
    const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return '<div class="language-alphabet">'+letters.map(letter=>'<button type="button" data-speak="'+letter+'" aria-label="Hear '+letter+'"><strong>'+letter+'</strong><span>'+letter.toLowerCase()+'</span></button>').join('')+'</div>';
  }

  function boxSelector(state,pos){
    let html='<div class="language-box-strip">';
    for(let box=1;box<=26;box++){
      const unlocked=boxUnlocked(state,pos.li,pos.step,box),passed=isBoxPassed(state,pos.li,pos.step,box);
      html+='<button type="button" data-language-box="'+box+'" '+(unlocked?'':'disabled')+' class="'+(box===pos.box?'active ':'')+(passed?'passed':'')+'">'+box+'</button>';
    }
    return html+'</div>';
  }

  function lettersPage(){
    const state=languageState(),pos=clampSelection(state),level=CEFR[pos.li],sound=level.sounds[(pos.step-1)%level.sounds.length],passed=isBoxPassed(state,pos.li,pos.step,1);
    const special=pos.li===0&&pos.step===1;
    return '<section class="language-course-page">'+languageHeader(state,pos,t('letters'),t('letters'),t('lettersIntro'))+
      '<div class="language-step-switch">'+[1,2,3,4,5].map(step=>'<button data-language-step="'+step+'" '+(stepUnlocked(state,pos.li,step)?'':'disabled')+' class="'+(step===pos.step?'active':'')+'">'+t('step')+' '+step+'</button>').join('')+'</div>'+
      '<article class="language-sound-hero"><div><small>Box 1 · '+CEFR[pos.li].id+'</small><h2>'+esc(sound)+'</h2><p>'+(special?'Learn all 26 English letters, hear their names, trace their shapes and write them independently.':'Train sound-to-spelling control, handwriting/typing accuracy and pronunciation patterns appropriate to this CEFR stage.')+'</p></div><button class="btn btn-primary" type="button" data-speak="'+esc(special?'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z':boxData(pos.li,pos.step,1).voicePrompt)+'">'+t('listen')+'</button></article>'+
      (special?alphabetMarkup():'<div class="language-pronunciation-grid">'+pickWrapped(level.words,pos.step*4,8).map(word=>'<button type="button" data-speak="'+esc(word)+'"><strong>'+esc(word)+'</strong><span>▶</span></button>').join('')+'</div>')+
      '<div class="language-writing-lab"><div><small>Writing lab</small><h2>'+(special?'Trace a letter, then reproduce it without the guide.':'Copy the phrase, then rewrite it from memory.')+'</h2><p>'+esc(special?'Use slow controlled strokes. Accuracy comes before speed.':boxData(pos.li,pos.step,1).reversePrompt)+'</p></div><canvas id="language-trace-canvas" width="720" height="280" aria-label="Letter tracing canvas"></canvas><div class="language-canvas-actions"><button type="button" data-canvas-clear>Clear</button><button type="button" data-language-module="letters">'+(passed?t('completed'):t('complete'))+'</button></div></div>'+
      '<a class="language-exam-cta" href="#language-examine"><span>✓</span><div><strong>Box 1 examination</strong><p>Pass the Box 1 exam to unlock Box 2.</p></div><b>→</b></a></section>';
  }

  function currentLearningBox(state,pos){
    return pos.box<2?null:boxData(pos.li,pos.step,pos.box);
  }
  function boxOneGate(state,pos,title,intro){
    return '<section class="language-course-page">'+languageHeader(state,pos,title,title,intro)+'<article class="language-box-one-gate"><span>1</span><div><small>Box 1 prerequisite</small><h2>Finish the sound & writing box first.</h2><p>Box 2–26 stay locked until you pass the Box 1 examination. You can take that assessment at any time from Examine.</p></div><div><a href="#language-letters">Open Box 1</a><a href="#language-examine">Examine</a></div></article></section>';
  }

  function voicePage(){
    const state=languageState(),pos=clampSelection(state),data=currentLearningBox(state,pos);
    if(!data)return boxOneGate(state,pos,t('voice'),t('voiceIntro'));
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,data.box)]||{};
    return '<section class="language-course-page">'+languageHeader(state,{li:pos.li,step:pos.step,box:data.box},t('voice'),data.title,t('voiceIntro'))+boxSelector(state,{li:pos.li,step:pos.step,box:data.box})+
      '<div class="language-practice-grid"><article class="language-practice-card dictation"><small>Voice → text</small><h2>Listen, then write exactly what you hear.</h2><button class="language-audio-button" type="button" data-speak="'+esc(data.voicePrompt)+'">▶ '+t('listen')+'</button><textarea id="language-dictation" rows="4" placeholder="Type the sentence you hear"></textarea><button type="button" data-check-dictation="'+esc(data.voicePrompt)+'">'+t('check')+'</button><p class="language-feedback" data-dictation-feedback></p></article>'+
      '<article class="language-practice-card reverse"><small>Text → voice</small><h2>'+t('speak')+'</h2><blockquote>'+esc(data.reversePrompt)+'</blockquote><button class="language-audio-button secondary" type="button" data-recognize="'+esc(data.reversePrompt)+'">🎙 '+t('start')+'</button><textarea id="language-reverse-fallback" rows="3" placeholder="Recognition transcript or type your spoken sentence here"></textarea><button type="button" data-check-reverse="'+esc(data.reversePrompt)+'">'+t('check')+'</button><p class="language-feedback" data-reverse-feedback></p></article></div>'+
      '<button class="language-complete-bar '+(module.voice?'done':'')+'" type="button" data-language-module="voice">'+(module.voice?'✓ '+t('completed'):t('complete'))+'</button></section>';
  }

  function grammarPage(){
    const state=languageState(),pos=clampSelection(state),data=currentLearningBox(state,pos);if(!data)return boxOneGate(state,pos,t('grammar'),t('grammarIntro'));const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,data.box)]||{};
    return '<section class="language-course-page">'+languageHeader(state,{li:pos.li,step:pos.step,box:data.box},t('grammar'),data.grammarTitle,t('grammarIntro'))+boxSelector(state,{li:pos.li,step:pos.step,box:data.box})+
      '<div class="language-rule-layout"><article class="language-rule-card primary"><span>01</span><small>Grammar rule</small><h2>'+esc(data.grammarTitle)+'</h2><p>'+esc(data.grammarRule)+'</p><div class="language-examples"><code>'+esc(data.grammarExample1)+'</code><code>'+esc(data.grammarExample2)+'</code></div></article>'+
      '<article class="language-rule-card"><span>02</span><small>Naming</small><h2>Clear noun choices</h2><p>'+esc(data.naming)+'</p><div class="language-word-row">'+data.words.slice(0,4).map(word=>'<b>'+esc(word)+'</b>').join('')+'</div></article>'+
      '<article class="language-rule-card"><span>03</span><small>Typing & spelling</small><h2>Write for the reader</h2><p>'+esc(data.typing)+'</p><textarea rows="5" placeholder="Write two examples that follow these rules."></textarea></article></div>'+
      '<button class="language-complete-bar '+(module.grammar?'done':'')+'" type="button" data-language-module="grammar">'+(module.grammar?'✓ '+t('completed'):t('complete'))+'</button></section>';
  }

  function reviewPage(){
    const state=languageState(),pos=clampSelection(state),data=currentLearningBox(state,pos);if(!data)return boxOneGate(state,pos,t('review'),t('reviewIntro'));const id=keyBox(CEFR[pos.li].id,pos.step,data.box),module=state.modules[id]||{},notes=state.notes[id]||'';
    return '<section class="language-course-page">'+languageHeader(state,{li:pos.li,step:pos.step,box:data.box},t('review'),data.title,t('reviewIntro'))+boxSelector(state,{li:pos.li,step:pos.step,box:data.box})+
      '<div class="language-review-grid"><article class="language-memory-card"><small>Active vocabulary</small><h2>Retrieve before you reveal</h2><div class="language-vocab-grid">'+data.words.map(word=>'<button type="button" data-speak="'+esc(word)+'"><span>'+esc(word)+'</span><b>▶</b></button>').join('')+'</div></article>'+
      '<article class="language-memory-card"><small>Learning trick</small><h2>'+esc(data.trick)+'</h2><p>'+esc(data.recall)+'</p><ol><li>Attempt from memory.</li><li>Check only after the attempt.</li><li>Correct the smallest specific error.</li><li>Repeat after a short delay.</li></ol></article>'+
      '<article class="language-memory-card notes"><small>'+t('notes')+'</small><h2>Keep only what will help future recall.</h2><textarea id="language-box-notes" rows="8" placeholder="Examples, mistakes, mnemonics, Arabic explanation…">'+esc(notes)+'</textarea><button type="button" data-save-language-notes="'+esc(id)+'">'+t('save')+'</button></article></div>'+
      '<button class="language-complete-bar '+(module.review?'done':'')+'" type="button" data-language-module="review">'+(module.review?'✓ '+t('completed'):t('complete'))+'</button></section>';
  }

  function examQuestions(scope,li,step,box){
    const level=CEFR[li],targets=[];
    if(scope==='box')targets.push(boxData(li,step,box));
    else if(scope==='step') [2,7,12,18,24].forEach(b=>targets.push(boxData(li,step,b)));
    else [1,2,3,4,5].forEach((s,index)=>targets.push(boxData(li,s,[4,9,14,19,24][index])));
    while(targets.length<5)targets.push(targets[0]);
    return targets.slice(0,5).map((data,index)=>{
      const grammarIndex=Math.max(0,level.grammar.findIndex(rule=>rule[0]===data.grammarTitle));
      const otherRule=level.grammar[(grammarIndex+3)%level.grammar.length];
      const adjacent=boxData(li,data.step,data.box===26?25:data.box+1);
      const unpunctuated=data.grammarExample1.charAt(0).toLowerCase()+data.grammarExample1.slice(1).replace(/[.!?]$/,'');
      const tests=[
        {prompt:'Which sentence best demonstrates the target grammar accurately?',correct:data.grammarExample1,options:[data.grammarExample1,unpunctuated+'  '+data.words[0],data.words.slice(0,4).join(' '),adjacent.reversePrompt]},
        {prompt:'Which statement correctly describes the grammar focus?',correct:data.grammarRule,options:[data.grammarRule,otherRule[1],'Word order never affects meaning.','Punctuation replaces grammar.']},
        {prompt:'Which sentence is the listening model for this box?',correct:data.voicePrompt,options:[data.voicePrompt,adjacent.voicePrompt,data.reversePrompt,data.words.slice(0,5).join(' ')]},
        {prompt:'Which item belongs to the active vocabulary set for this box?',correct:data.words[0],options:[data.words[0],pickWrapped(CEFR[(li+1)%CEFR.length].words,index*2,1)[0],otherRule[0],adjacent.topic]},
        {prompt:'Which option is a complete, reader-ready model?',correct:data.grammarExample2,options:[data.grammarExample2,data.grammarExample2.toLowerCase().replace(/[.!?]$/,''),'because '+data.words[0],data.words[1]+' '+data.words[2]]}
      ];
      const test=tests[index%tests.length];
      return {prompt:test.prompt,options:arrayUnique(test.options),correct:test.correct};
    });
  }

  function examinePage(){
    const state=languageState(),pos=clampSelection(state);
    const scope=state.examScope||'box',eli=Number.isInteger(state.examLevel)?state.examLevel:pos.li,estep=state.examStep||pos.step,ebox=state.examBox||pos.box;
    const questions=examQuestions(scope,eli,estep,ebox);
    return '<section class="language-course-page">'+languageHeader(state,pos,t('examine'),t('examine'),t('examIntro'))+
      '<div class="language-exam-builder"><label>Scope<select id="language-exam-scope"><option value="box" '+(scope==='box'?'selected':'')+'>Box</option><option value="step" '+(scope==='step'?'selected':'')+'>Step</option><option value="level" '+(scope==='level'?'selected':'')+'>Level</option></select></label>'+
      '<label>'+t('level')+'<select id="language-exam-level">'+CEFR.map((level,index)=>'<option value="'+index+'" '+(index===eli?'selected':'')+'>'+level.id+' · '+esc(level.title)+'</option>').join('')+'</select></label>'+
      '<label>'+t('step')+'<select id="language-exam-step">'+[1,2,3,4,5].map(s=>'<option '+(s===estep?'selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
      '<label>'+t('box')+'<select id="language-exam-box">'+Array.from({length:26},(_,i)=>i+1).map(b=>'<option '+(b===ebox?'selected':'')+'>'+b+'</option>').join('')+'</select></label><div class="language-pass-pill">'+t('pass')+'</div></div>'+
      '<form id="language-exam-form" class="language-exam-form">'+questions.map((q,index)=>'<fieldset><legend><span>'+(index+1)+'</span>'+esc(q.prompt)+'</legend>'+q.options.map(option=>'<label><input type="radio" name="q'+index+'" value="'+esc(option)+'" required><span>'+esc(option)+'</span></label>').join('')+'</fieldset>').join('')+'<button class="btn btn-primary" type="submit">'+t('submitExam')+'</button><div class="language-exam-result" id="language-exam-result"></div></form></section>';
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
      if(type==='language' && window.DafatiiCourses.active().id && !LANGUAGE_ROUTES.includes(page) && !['change-course','profile','settings','representer','admin'].includes(page)){
        setHash('language-home');return;
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
  function sideLanguageNav(current){
    return navSpec.map(item=>'<a href="#'+item[0]+'" class="quiet-link '+(current===item[0]?'selected':'')+'" '+(current===item[0]?'aria-current="page"':'')+'>'+icon(item[1])+'<span>'+esc(t(item[2]))+'</span></a>').join('');
  }
  function bottomLanguageNav(current){
    return navSpec.map(item=>'<a href="#'+item[0]+'" class="bottom-nav-item language-bottom-item '+(current===item[0]?'is-active':'')+'" '+(current===item[0]?'aria-current="page"':'')+'><span class="bottom-nav-icon">'+icon(item[1])+'</span><span class="bottom-nav-label">'+esc(t(item[2]))+'</span></a>').join('');
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
  function bindCanvas(){
    const canvas=document.getElementById('language-trace-canvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
    let drawing=false;
    const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)};};
    canvas.onpointerdown=e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);};
    canvas.onpointermove=e=>{if(!drawing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();};
    canvas.onpointerup=canvas.onpointercancel=()=>{drawing=false;};
    document.querySelector('[data-canvas-clear]')?.addEventListener('click',()=>ctx.clearRect(0,0,canvas.width,canvas.height));
  }

  function bindLanguagePage(){
    document.querySelectorAll('[data-speak]').forEach(button=>button.onclick=()=>speak(button.dataset.speak));
    document.querySelector('[data-language-ui-switch]')?.addEventListener('click',()=>{applyInterfaceLanguage(lang()==='ar'?'en':'ar');render();});
    document.querySelectorAll('[data-language-level]').forEach(button=>button.onclick=()=>{const li=Number(button.dataset.languageLevel);updateLanguage(state=>{if(levelUnlocked(state,li)){state.selectedLevel=li;state.selectedStep=1;state.selectedBox=1;}});render();});
    document.querySelectorAll('[data-language-step]').forEach(button=>button.onclick=()=>{const step=Number(button.dataset.languageStep);updateLanguage(state=>{const pos=clampSelection(state);if(stepUnlocked(state,pos.li,step)){state.selectedStep=step;state.selectedBox=1;}});render();});
    document.querySelectorAll('[data-language-box]').forEach(button=>button.onclick=()=>{const box=Number(button.dataset.languageBox);updateLanguage(state=>{const pos=clampSelection(state);if(boxUnlocked(state,pos.li,pos.step,box))state.selectedBox=box;});render();});
    document.querySelectorAll('[data-language-module]').forEach(button=>button.onclick=()=>markModule(button.dataset.languageModule));
    document.querySelector('[data-check-dictation]')?.addEventListener('click',event=>{const score=similarity(document.getElementById('language-dictation').value,event.currentTarget.dataset.checkDictation);document.querySelector('[data-dictation-feedback]').textContent=score>=.92?'Excellent match.':'Try again. Focus on every content word and ending.';});
    document.querySelector('[data-check-reverse]')?.addEventListener('click',event=>{const score=similarity(document.getElementById('language-reverse-fallback').value,event.currentTarget.dataset.checkReverse);document.querySelector('[data-reverse-feedback]').textContent=score>=.86?'Clear match.':'Try again and keep the same meaning and key wording.';});
    document.querySelector('[data-recognize]')?.addEventListener('click',event=>{
      const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      const field=document.getElementById('language-reverse-fallback'),feedback=document.querySelector('[data-reverse-feedback]');
      if(!Recognition){feedback.textContent='Speech recognition is not available in this browser. Type what you said, then check it.';field.focus();return;}
      const recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
      recognition.onresult=e=>{field.value=e.results[0][0].transcript;feedback.textContent='Captured. Check the result.';};
      recognition.onerror=()=>{feedback.textContent='Recognition failed. You can type the spoken sentence instead.';};
      recognition.start();
    });
    document.querySelector('[data-save-language-notes]')?.addEventListener('click',event=>{const id=event.currentTarget.dataset.saveLanguageNotes,value=document.getElementById('language-box-notes').value;updateLanguage(state=>{state.notes[id]=value;});event.currentTarget.textContent='✓ '+t('save');});
    ['scope','level','step','box'].forEach(name=>document.getElementById('language-exam-'+name)?.addEventListener('change',()=>{
      updateLanguage(state=>{
        state.examScope=document.getElementById('language-exam-scope').value;
        state.examLevel=Number(document.getElementById('language-exam-level').value);
        state.examStep=Number(document.getElementById('language-exam-step').value);
        state.examBox=Number(document.getElementById('language-exam-box').value);
      });render();
    }));
    const exam=document.getElementById('language-exam-form');
    if(exam)exam.onsubmit=event=>{
      event.preventDefault();
      const state=languageState(),scope=state.examScope||'box',li=Number.isInteger(state.examLevel)?state.examLevel:state.selectedLevel,step=state.examStep||state.selectedStep,box=state.examBox||state.selectedBox;
      const questions=examQuestions(scope,li,step,box),form=new FormData(exam);
      let correct=0;questions.forEach((q,index)=>{if(form.get('q'+index)===q.correct)correct++;});
      const score=Math.round((correct/questions.length)*100),passed=score>=80,result=document.getElementById('language-exam-result');
      updateLanguage(value=>{value.examHistory.push({scope,level:CEFR[li].id,step,box,score,passed,at:Date.now()});});
      if(passed){markPass(scope,li,step,box);result.className='language-exam-result passed';result.textContent='Passed · '+score+'%. Progression credit has been applied.';setTimeout(()=>render(),900);}
      else{result.className='language-exam-result failed';result.textContent='Score '+score+'%. Review the target box and try again.';}
    };
    bindCanvas();
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
  window.DafatiiCourseModes=Object.freeze({courseType,isLanguage,levels:CEFR,boxData,openTypeChooser});
})();