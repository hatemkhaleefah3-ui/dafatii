(() => {
  'use strict';

  const COURSE_TYPES = ['dafaa','personal','teaching','language'];
  const LANGUAGE_ROUTES = ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine'];
  const LANGUAGE_CHOICES = Object.freeze([
    ['English','English'],['Arabic','العربية'],['Spanish','Español'],['French','Français'],
    ['German','Deutsch'],['Turkish','Türkçe'],['Persian','فارسی'],['Kurdish','کوردی'],
    ['Italian','Italiano'],['Portuguese','Português'],['Russian','Русский'],['Chinese','中文'],
    ['Japanese','日本語'],['Korean','한국어'],['Hindi','हिन्दी'],['Urdu','اردو']
  ]);
  const COPY = {
    en:{home:'Home',letters:'Vocabulary & writing',voice:'Listening & speaking',grammar:'Grammar & rules',video:'Watching & reading',examine:'Examining'},
    ar:{home:'الرئيسية',letters:'المفردات والكتابة',voice:'الاستماع والتحدث',grammar:'القواعد والأحكام',video:'المشاهدة والقراءة',examine:'الاختبارات'}
  };

  const LANGUAGE_LEARNING_KEY = 'dafatii:language-learning:v1';
  const LANGUAGE_ITEM_TYPES = Object.freeze({
    'language-letters':[
      {id:'vocabulary-card',label:'Vocabulary flashcard',description:'Context-rich recall card with SRS review.'},
      {id:'guided-writing',label:'Guided writing',description:'Prompt, helpful vocabulary, writing space, and live progress.'}
    ],
    'language-voice':[
      {id:'minimal-pair',label:'Minimal pair',description:'Discriminate two similar sounds before production.'},
      {id:'shadowing',label:'Shadowing',description:'Listen, immediately repeat, record, and compare.'},
      {id:'pronunciation',label:'Pronunciation practice',description:'Focused spoken production with recording and recognition feedback.'}
    ],
    'language-grammar':[
      {id:'sentence-builder',label:'Sentence builder',description:'Discover syntax by assembling a sentence.'},
      {id:'grammar-rule',label:'Grammar rule',description:'Compact rule, example, exception, and contextual help.'},
      {id:'grammar-practice',label:'Grammar practice',description:'Immediate application after the pattern is introduced.'}
    ],
    'language-video':[
      {id:'youtube-lesson',label:'YouTube lesson',description:'Video, synchronized transcript, subtitles, and tap-to-learn words.'},
      {id:'graded-story',label:'Graded story',description:'CEFR reading, tap-to-translate vocabulary, narration, and checkpoints.'}
    ],
    'language-examine':[
      {id:'cloze',label:'Cloze test',description:'Fill the missing language in context.'},
      {id:'matching-grid',label:'Matching grid',description:'Match related language forms or meanings.'},
      {id:'adaptive-choice',label:'Adaptive multiple choice',description:'Difficulty-aware single-question assessment.'},
      {id:'dialogue-scenario',label:'Dialogue scenario',description:'Timed contextual production task.'}
    ]
  });
  const LANGUAGE_SPEECH_LOCALES = Object.freeze({
    English:'en-US',Arabic:'ar-SA',Spanish:'es-ES',French:'fr-FR',German:'de-DE',Turkish:'tr-TR',
    Persian:'fa-IR',Kurdish:'ku',Italian:'it-IT',Portuguese:'pt-PT',Russian:'ru-RU',Chinese:'zh-CN',
    Japanese:'ja-JP',Korean:'ko-KR',Hindi:'hi-IN',Urdu:'ur-PK'
  });

  const LANGUAGE_SEED_VERSION = 1;
  const LANGUAGE_SEED_ITEMS = Object.freeze([
    {
      id:'seed-v1-vocabulary-card',page:'language-letters',type:'vocabulary-card',createdAt:1,
      title:'Library — learn it in context',target:'library',partOfSpeech:'noun',native:'مكتبة',
      sentence:'I study at the library after class because it is quiet.',
      imageUrl:'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=82',audioUrl:''
    },
    {
      id:'seed-v1-guided-writing',page:'language-letters',type:'guided-writing',createdAt:2,
      title:'Describe your morning routine',
      prompt:'Write 80–120 words about a normal morning. Say when you wake up, what you do first, what you eat or drink, and how you prepare for the day. Connect your ideas with sequence words.',
      helperWords:['usually','first','then','after that','before','because','finally'],minWords:80,
      modelAnswer:'I usually wake up at seven o’clock. First, I open the curtains and drink a glass of water. Then I wash my face and make coffee. After that, I eat a simple breakfast while I check my schedule. Before I leave home, I pack my notebook and headphones because I like to study on the way. Finally, I walk to the bus stop and review a few English words.'
    },
    {
      id:'seed-v1-minimal-pair',page:'language-voice',type:'minimal-pair',createdAt:3,
      title:'Hear /ɪ/ and /iː/: ship or sheep?',prompt:'Listen to both words. Which word contains the long /iː/ vowel sound?',
      optionA:'ship',optionB:'sheep',answer:'sheep',audioUrlA:'',audioUrlB:''
    },
    {
      id:'seed-v1-shadowing',page:'language-voice',type:'shadowing',createdAt:4,
      title:'Shadow a natural morning sentence',
      text:'I usually wake up at seven, make coffee, and check my schedule before I leave home.',
      native:'عادةً أستيقظ في السابعة، وأعد القهوة، وأراجع جدولي قبل أن أغادر المنزل.',audioUrl:''
    },
    {
      id:'seed-v1-pronunciation',page:'language-voice',type:'pronunciation',createdAt:5,
      title:'Practice the /θ/ sound clearly',
      text:'Three thoughtful students walked through the library.',
      native:'مرّ ثلاثة طلاب متأنّين عبر المكتبة.',audioUrl:''
    },
    {
      id:'seed-v1-sentence-builder',page:'language-grammar',type:'sentence-builder',createdAt:6,
      title:'Build a present-simple habit',
      prompt:'Build a natural sentence about a regular study habit.',
      tokens:[
        {text:'I',role:'subject'},{text:'usually',role:'modifier'},{text:'study',role:'verb'},
        {text:'English',role:'object'},{text:'after dinner',role:'modifier'}
      ],
      answer:'I usually study English after dinner',
      pattern:'Subject + frequency adverb + verb + object + time expression',
      rule:'Frequency adverbs such as usually normally come before the main verb: I usually study. With the verb be, they normally come after be: I am usually early.'
    },
    {
      id:'seed-v1-grammar-rule',page:'language-grammar',type:'grammar-rule',createdAt:7,
      title:'Present simple with he, she, and it',
      rule:'In affirmative present-simple sentences, add -s or -es to the base verb when the subject is he, she, or it.',
      example:'She studies English every evening.',
      exception:'Some common forms change spelling: have → has, do → does, go → goes. Verbs ending in consonant + y usually change y to ies: study → studies.'
    },
    {
      id:'seed-v1-grammar-practice',page:'language-grammar',type:'grammar-practice',createdAt:8,
      title:'Choose the correct present-simple form',
      prompt:'Omar has an English lesson every day. Which sentence is grammatically correct?',
      choices:['Omar study English every day.','Omar studies English every day.','Omar studying English every day.'],
      answer:'Omar studies English every day.',
      explanation:'Omar is third-person singular, so the present-simple affirmative verb needs -s: studies.'
    },
    {
      id:'seed-v1-youtube-lesson',page:'language-video',type:'youtube-lesson',createdAt:9,
      title:'Daily routine — listen for present-simple verbs',
      youtubeUrl:'https://www.youtube.com/watch?v=bq6GBbh3uhU',
      transcript:[
        {start:0,target:'What do you do every day?',native:'ماذا تفعل كل يوم؟'},
        {start:18,target:'I get up, get ready, and have breakfast.',native:'أستيقظ، وأستعد، وأتناول الإفطار.'},
        {start:38,target:'Then I start work and follow my daily routine.',native:'ثم أبدأ العمل وأتبع روتيني اليومي.'},
        {start:58,target:'Simple verbs help us describe habits clearly.',native:'تساعدنا الأفعال البسيطة على وصف العادات بوضوح.'}
      ],
      glossary:{
        routine:'a usual sequence of actions',breakfast:'the first meal of the day',
        ready:'prepared for what comes next',habit:'something you do regularly',daily:'happening every day'
      }
    },
    {
      id:'seed-v1-graded-story',page:'language-video',type:'graded-story',createdAt:10,
      title:'The Early Library',level:'A2',narrationUrl:'',
      text:'Maya has an important English test on Friday. On Thursday morning, she wakes up earlier than usual and takes the first bus to the city library. The streets are quiet, and the library has only a few visitors. Maya finds a table near a large window. First, she reviews ten vocabulary cards. Then she reads a short story and writes three sentences about it. At ten o’clock, her friend Lina arrives. They practise a dialogue together and correct each other’s mistakes. Maya does not study all day. At noon, she closes her notebook and walks outside for lunch. She feels calm because she has followed a simple plan. On Friday, the test is challenging, but the words and sentence patterns feel familiar.',
      glossary:{
        earlier:'before the usual time',visitors:'people who come to a place',reviews:'studies again',
        dialogue:'a conversation between people',correct:'identify and fix an error',calm:'relaxed and not worried',
        challenging:'difficult in an interesting way',familiar:'known because you have seen or experienced it before'
      },
      checkpoints:[
        {question:'Why does Maya go to the library early?',answer:'She has an important English test on Friday.'},
        {question:'What does Maya do after reviewing vocabulary cards?',answer:'She reads a short story and writes three sentences about it.'},
        {question:'Why does Maya feel calm at lunchtime?',answer:'She has followed a simple plan.'}
      ]
    },
    {
      id:'seed-v1-cloze',page:'language-examine',type:'cloze',createdAt:11,
      title:'Present-simple cloze',skill:'Grammar',difficulty:2,
      prompt:'Every morning, Lina ___ the bus to university.',answer:'takes',audioUrl:''
    },
    {
      id:'seed-v1-matching-grid',page:'language-examine',type:'matching-grid',createdAt:12,
      title:'Match routine verbs with their meanings',skill:'Vocabulary',difficulty:2,
      pairs:[
        {left:'wake up',right:'stop sleeping'},
        {left:'get dressed',right:'put on clothes'},
        {left:'have breakfast',right:'eat the first meal of the day'},
        {left:'leave home',right:'go out from where you live'}
      ]
    },
    {
      id:'seed-v1-adaptive-choice',page:'language-examine',type:'adaptive-choice',createdAt:13,
      title:'Read for a specific detail',skill:'Reading',difficulty:2,audioUrl:'',
      question:'Maya leaves home at 7:20. Her bus arrives at 7:30, and the journey takes twenty minutes. What time does she arrive?',
      choices:['7:30','7:40','7:50','8:00'],answer:'7:50'
    },
    {
      id:'seed-v1-dialogue-scenario',page:'language-examine',type:'dialogue-scenario',createdAt:14,
      title:'Order politely at a café',skill:'Speaking',difficulty:3,timerSeconds:60,
      scenario:'You are at a café before class. The server asks, “What would you like?”',
      prompt:'Respond with one polite sentence to order a coffee.',
      expected:'Could I have a coffee, please?'
    }
  ]);



  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lang = () => (typeof interfaceLanguage === 'function' ? interfaceLanguage() : document.documentElement.lang) === 'ar' ? 'ar' : 'en';
  const t = key => COPY[lang()][key] || COPY.en[key] || key;

  function readSuite(){
    const value=window.DafatiiCourses.readJSON('dafatii:studentSuite:v1',{});
    return value && typeof value==='object' && !Array.isArray(value) ? value : {};
  }
  function writeSuite(value){ window.DafatiiCourses.writeJSON('dafatii:studentSuite:v1',value); return value; }
  function courseMeta(){ return readSuite().courseMeta || {}; }
  function courseType(){ return String(courseMeta().courseType || 'dafaa'); }
  function isLanguage(){ return courseType()==='language'; }
  function normalizeTargetLanguage(value){
    const name=String(value||'').trim();
    return LANGUAGE_CHOICES.some(item=>item[0]===name)?name:'';
  }
  function targetLanguage(){ return normalizeTargetLanguage(courseMeta().targetLanguage)||'Language'; }
  function isAdminActor(){
    const actor=window.DafatiiCourses?.actor||window.DafatiiAuth?.user;
    return actor?.platformRole==='admin';
  }

  function purgeLegacyLanguageBrowserState(){
    if(!isLanguage())return;
    const activeId=String(window.DafatiiCourses.active().id||'');
    for(let i=localStorage.length-1;i>=0;i--){
      const key=localStorage.key(i)||'';
      if(
        key.startsWith('dafatii:language-learner:') ||
        key.startsWith('dafatii:language-progress:') ||
        key.startsWith('dafatii:paragraph-translate:') ||
        key.startsWith('dafatii:language-watch-read:') ||
        (activeId && key==='__dafatii:course-cache:'+activeId+':dafatii:language-content:v1') ||
        (activeId && key==='__dafatii:course-cache:'+activeId+':dafatii:language-authoring:v1')
      ) localStorage.removeItem(key);
    }
    try{ window.DafatiiData?.remove?.('dafatii:language-authoring:v1'); }catch{}
  }

  function wrapCourseCreation(){
    if(!window.DafatiiCourses || window.DafatiiCourses.__courseModesWrapped) return;
    const api=window.DafatiiCourses;
    const originalCreate=api.createCourse.bind(api);
    const originalRoomSeeds=api.roomSeeds.bind(api);
    api.createCourse=async input => {
      const type=COURSE_TYPES.includes(input.courseType)?input.courseType:'dafaa';
      if(type==='language'&&!isAdminActor())throw new Error('Administrator access is required for Language Course creation.');
      const selectedLanguage=type==='language'?normalizeTargetLanguage(input.targetLanguage):'';
      if(type==='language'&&!selectedLanguage)throw new Error('Select a language before creating the course.');
      const course=await originalCreate(input);
      const suite=readSuite();
      suite.courseMeta={version:1,courseType:type,targetLanguage:selectedLanguage,studyType:type==='language'?'courses':(input.studyType||'courses')};
      writeSuite(suite);
      if(type==='language')writeLanguageLearning(defaultLanguageLearning());
      if(type==='personal')window.DafatiiCourses.writeJSON('dafatii:chatState:v1',{conversations:[],selected:{private:'',group:'',unknown:''},reported:[],blocked:[]});
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
      ['language','Aa','Create Language course','Create a structured language course with one complete starter item for every learning type.','إنشاء دورة لغة','أنشئ دورة لغة منظمة مع عنصر نموذجي مكتمل لكل نوع من أنواع التعلم.']
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

  function openLanguageCourseForm(){
    const actor=window.DafatiiCourses.actor||window.DafatiiAuth.user;
    if(!actor||actor.platformRole!=='admin')return;
    const arabic=lang()==='ar';
    const choices=LANGUAGE_CHOICES.map(([value,native])=>'<button class="language-choice" type="button" data-language-choice="'+esc(value)+'" aria-pressed="false"><strong dir="auto">'+esc(native)+'</strong><span>'+esc(value)+'</span></button>').join('');
    const close=sheet(arabic?'إنشاء دورة لغة':'Create Language course','<form id="course-mode-form" class="language-course-create"><input type="hidden" name="courseType" value="language"><input type="hidden" name="targetLanguage" value=""><input type="hidden" name="name" value=""><input type="hidden" name="templateName" value="Computer Science"><input type="hidden" name="studyType" value="courses"><input type="hidden" name="institution" value=""><input type="hidden" name="stage" value="university"><input type="hidden" name="pricing" value="free"><input type="hidden" name="priceMinor" value="0"><input type="hidden" name="visibility" value="public"><input type="hidden" name="joinPolicy" value="direct"><input type="hidden" name="learningField" value="Languages"><input type="hidden" name="difficultyLevel" value="beginner"><div class="language-create-intro"><small>'+(arabic?'دورة لغة':'Language course')+'</small><h3>'+(arabic?'اختر اللغة':'Select a language')+'</h3><p>'+(arabic?'ستتضمن الدورة عنصراً نموذجياً مكتمل المحتوى لكل نوع من عناصر التعلم، ويمكنك تعديله أو حذفه لاحقاً.':'The course will include one fully populated starter item for every learning type. You can edit or delete any starter item.')+'</p></div><div class="language-picker" role="radiogroup" aria-label="'+(arabic?'لغة الدورة':'Course language')+'">'+choices+'</div><button class="btn btn-primary auth-submit language-create-submit" id="language-course-create" type="submit" disabled>'+(arabic?'إنشاء الدورة':'Create course')+'</button><p class="auth-note" id="course-mode-status">'+(arabic?'اختر لغة للمتابعة.':'Select a language to continue.')+'</p></form>');
    const form=document.getElementById('course-mode-form');
    const target=form.querySelector('input[name="targetLanguage"]'),name=form.querySelector('input[name="name"]'),submit=document.getElementById('language-course-create'),status=document.getElementById('course-mode-status');
    form.querySelectorAll('[data-language-choice]').forEach(button=>button.addEventListener('click',()=>{
      const selected=normalizeTargetLanguage(button.dataset.languageChoice);
      form.querySelectorAll('[data-language-choice]').forEach(choice=>{choice.classList.remove('is-selected');choice.setAttribute('aria-pressed','false');});
      button.classList.add('is-selected');button.setAttribute('aria-pressed','true');
      target.value=selected;name.value=selected+' Language Course';submit.disabled=!selected;status.textContent='';
    }));
    form.onsubmit=async event=>{
      event.preventDefault();
      const data=Object.fromEntries(new FormData(form));
      const selected=normalizeTargetLanguage(data.targetLanguage);
      if(!selected){status.textContent=arabic?'اختر لغة للمتابعة.':'Select a language to continue.';submit.disabled=true;return;}
      data.targetLanguage=selected;data.name=selected+' Language Course';data.priceMinor=0;
      submit.disabled=true;status.textContent=(arabic?'جارٍ إنشاء دورة ':'Creating ')+selected+(arabic?'…':' course…');
      try{
        await window.DafatiiCourses.createCourse(data);
        close();setHash('language-home');
      }catch(error){status.textContent=error.message;submit.disabled=false;}
    };
  }

  function openCourseForm(type){
    if(type==='language'){openLanguageCourseForm();return;}
    const templates=window.DafatiiCourses.templates();
    const actor=window.DafatiiCourses.actor||window.DafatiiAuth.user;
    const isAdmin=actor && actor.platformRole==='admin';
    const isPersonal=type==='personal';
    const defaultName=isPersonal?'My Personal Course':'';
    const personalSecret=isPersonal
      ? (crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,20):(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).slice(0,20))
      : '';
    const templateField='<div class="field"><label>Content template</label><select name="templateName">'+templates.map(name=>'<option>'+esc(name)+'</option>').join('')+'</select></div>';
    const studyField='<div class="field"><label>Study structure</label><select name="studyType">'+studyTypeOptions()+'</select></div>';
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
    const adminMetadata=isAdmin?'<div class="field"><label>Learning field</label><input name="learningField" maxlength="80"></div><div class="field"><label>Difficulty</label><select name="difficultyLevel"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>':'';
    const title={dafaa:'Create Dafaa',personal:'Create Personal course',teaching:'Create Teaching course'}[type]||'Create course';
    const close=sheet(title,'<form id="course-mode-form"><input type="hidden" name="courseType" value="'+esc(type)+'"><div class="field"><label>Course name</label><input name="name" maxlength="120" value="'+esc(defaultName)+'" required></div>'+templateField+studyField+'<div class="suite-form-grid"><div class="field"><label>Institution</label><input name="institution" maxlength="160"></div>'+(isAdmin?'<div class="field"><label>Stage</label><select name="stage"><option value="university" selected>Higher education</option><option value="independent">Independent</option></select></div>':'<input type="hidden" name="stage" value="university">')+pricing+visibility+joinPolicy+adminMetadata+'</div>'+access+'<button class="btn btn-primary auth-submit" type="submit">Create course</button><p class="auth-note" id="course-mode-status"></p></form>');
    const form=document.getElementById('course-mode-form');
    form.onsubmit=async event=>{
      event.preventDefault();
      const data=Object.fromEntries(new FormData(form));
      data.priceMinor=Number(data.priceMinor||0);
      const status=document.getElementById('course-mode-status'),submit=form.querySelector('button[type=submit]');
      submit.disabled=true;status.textContent='Creating secure course workspace…';
      try{
        await window.DafatiiCourses.createCourse(data);
        close();setHash('dashboard/overview');
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

  let personalTimer=null;
  const personalRoomKey=()=> 'dafatii:personal-focus-room:'+String(window.DafatiiCourses.active().id||'none')+':v1';

  function personalRoomPage(){
    const room=window.DafatiiData.readJSON(personalRoomKey(),{goal:'',notes:'',minutes:50,sessions:0})||{goal:'',notes:'',minutes:50,sessions:0};
    return '<section class="personal-focus-page"><header class="personal-focus-hero"><div><small>Personal course · one private room</small><h1>My Focus Room</h1><p>A single distraction-controlled studio for deliberate study, session timing, working notes and materials.</p></div><div class="personal-focus-stat"><strong>'+Number(room.sessions||0)+'</strong><span>focus sessions</span></div></header><div class="personal-focus-grid"><article class="personal-focus-timer"><small>Focus block</small><div id="personal-focus-clock">'+String(Number(room.minutes||50)).padStart(2,'0')+':00</div><div><button type="button" data-personal-timer="start">Start</button><button type="button" data-personal-timer="reset">Reset</button></div><label>Minutes<input id="personal-focus-minutes" type="number" min="5" max="180" value="'+Number(room.minutes||50)+'"></label></article><article class="personal-focus-card"><small>One outcome</small><h2>What must be true when this block ends?</h2><textarea id="personal-focus-goal" rows="4" placeholder="Define one observable outcome…">'+esc(room.goal||'')+'</textarea><button type="button" data-personal-save>Save room</button></article><article class="personal-focus-card wide"><small>Working notes</small><h2>Keep the room quiet; capture only useful thinking.</h2><textarea id="personal-focus-notes" rows="10" placeholder="Notes, questions, formulas, links…">'+esc(room.notes||'')+'</textarea></article></div></section>';
  }

  function savePersonalRoom(extra={}){
    const previous=window.DafatiiData.readJSON(personalRoomKey(),{})||{};
    window.DafatiiData.writeJSON(personalRoomKey(),{...previous,...extra});
  }

  function bindPersonalRoom(){
    document.querySelector('[data-personal-save]')?.addEventListener('click',()=>{savePersonalRoom({goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});});
    document.querySelector('[data-personal-timer="reset"]')?.addEventListener('click',()=>{if(personalTimer){clearInterval(personalTimer);personalTimer=null;}const m=Number(document.getElementById('personal-focus-minutes').value)||50;document.getElementById('personal-focus-clock').textContent=String(m).padStart(2,'0')+':00';});
    document.querySelector('[data-personal-timer="start"]')?.addEventListener('click',()=>{if(personalTimer)return;let remaining=(Number(document.getElementById('personal-focus-minutes').value)||50)*60;const clock=document.getElementById('personal-focus-clock');personalTimer=setInterval(()=>{remaining--;clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');if(remaining<=0){clearInterval(personalTimer);personalTimer=null;const room=window.DafatiiData.readJSON(personalRoomKey(),{})||{};savePersonalRoom({sessions:Number(room.sessions||0)+1,goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});}},1000);});
  }

  const navSpec=[
    ['language-home','nav-home','home'],['language-letters','file','letters'],['language-voice','nav-messages','voice'],
    ['language-grammar','star','grammar'],['language-video','play','video'],['language-examine','check','examine']
  ];
  const LANGUAGE_PAGE_COPY=Object.freeze({
    'language-letters':{eyebrow:'Vocabulary & writing',title:'Build language you can retrieve',description:'Learn in context, recall at the right time, then produce the language yourself.'},
    'language-voice':{eyebrow:'Listening & pronouncing',title:'Hear precisely. Speak deliberately.',description:'Train discrimination first, then shadow and record with immediate playback.'},
    'language-grammar':{eyebrow:'Grammar & rules',title:'Discover the pattern, then name it',description:'Build sentences before opening the rule so form follows meaning.'},
    'language-video':{eyebrow:'Watching & reading',title:'Understand language in context',description:'Use synchronized video and graded stories without separating meaning from the source.'},
    'language-examine':{eyebrow:'Examining',title:'One question. One decision.',description:'Focused formative assessment adapts difficulty while keeping progress visible.'}
  });

  const learningUid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const cleanUrl=value=>{const raw=String(value||'').trim();if(!raw)return'';try{const url=new URL(raw);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return'';}};
  const stringLines=value=>Array.isArray(value)?value.map(String).map(v=>v.trim()).filter(Boolean):String(value||'').split(/\n+/).map(v=>v.trim()).filter(Boolean);
  const stringList=value=>Array.isArray(value)?value.map(String).map(v=>v.trim()).filter(Boolean):String(value||'').split(/\n+|\s*\|\s*/).map(v=>v.trim()).filter(Boolean);
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||min));
  function itemTypes(page){return LANGUAGE_ITEM_TYPES[page]||[];}
  function itemType(page,type){return itemTypes(page).find(entry=>entry.id===type)||null;}
  function canManageLanguageLearning(){
    return isAdminActor()||['add_content','edit_content','remove_content'].some(permission=>window.DafatiiCourses?.editable?.(permission));
  }
  function parsePairs(value){
    if(Array.isArray(value))return value.map(pair=>({left:String(pair?.left||'').trim(),right:String(pair?.right||'').trim()})).filter(pair=>pair.left&&pair.right);
    return stringLines(value).map(line=>{const parts=line.split('|');return{left:String(parts[0]||'').trim(),right:String(parts.slice(1).join('|')||'').trim()};}).filter(pair=>pair.left&&pair.right);
  }
  function parseGlossary(value){
    if(value&&typeof value==='object'&&!Array.isArray(value))return Object.fromEntries(Object.entries(value).map(([key,val])=>[String(key).trim().toLowerCase(),String(val||'').trim()]).filter(([key,val])=>key&&val));
    return Object.fromEntries(stringLines(value).map(line=>{const parts=line.split('|');return[String(parts[0]||'').trim().toLowerCase(),String(parts.slice(1).join('|')||'').trim()]}).filter(([key,val])=>key&&val));
  }
  function parseTranscript(value){
    if(Array.isArray(value))return value.map(segment=>({start:Math.max(0,Number(segment?.start)||0),target:String(segment?.target||'').trim(),native:String(segment?.native||'').trim()})).filter(segment=>segment.target).sort((a,b)=>a.start-b.start);
    return stringLines(value).map(line=>{const parts=line.split('|');return{start:Math.max(0,Number(parts.shift())||0),target:String(parts.shift()||'').trim(),native:String(parts.join('|')||'').trim()};}).filter(segment=>segment.target).sort((a,b)=>a.start-b.start);
  }
  function parseTokens(value){
    if(Array.isArray(value))return value.map(token=>typeof token==='string'?{text:token,role:''}:{text:String(token?.text||'').trim(),role:String(token?.role||'').trim().toLowerCase()}).filter(token=>token.text);
    return stringLines(value).map(line=>{const parts=line.split('|');return{text:String(parts[0]||'').trim(),role:String(parts[1]||'').trim().toLowerCase()};}).filter(token=>token.text);
  }
  function parseCheckpoints(value){
    if(Array.isArray(value))return value.map(item=>({question:String(item?.question||'').trim(),answer:String(item?.answer||'').trim()})).filter(item=>item.question&&item.answer);
    return stringLines(value).map(line=>{const parts=line.split('|');return{question:String(parts[0]||'').trim(),answer:String(parts.slice(1).join('|')||'').trim()};}).filter(item=>item.question&&item.answer);
  }
  function normalizeLearningItem(source,page){
    const raw=source&&typeof source==='object'?source:{},meta=itemType(page,raw.type)||itemTypes(page)[0];
    if(!meta)return null;
    const base={id:String(raw.id||learningUid('learn')),page,type:meta.id,title:String(raw.title||meta.label).trim(),createdAt:Number(raw.createdAt)||Date.now()};
    switch(meta.id){
      case 'vocabulary-card':return{...base,target:String(raw.target||'').trim(),partOfSpeech:String(raw.partOfSpeech||'').trim(),native:String(raw.native||'').trim(),sentence:String(raw.sentence||'').trim(),imageUrl:cleanUrl(raw.imageUrl),audioUrl:cleanUrl(raw.audioUrl)};
      case 'guided-writing':return{...base,prompt:String(raw.prompt||'').trim(),helperWords:stringList(raw.helperWords),minWords:clamp(raw.minWords||60,1,5000),modelAnswer:String(raw.modelAnswer||'').trim()};
      case 'minimal-pair':return{...base,prompt:String(raw.prompt||'Choose the sound you hear.').trim(),optionA:String(raw.optionA||'').trim(),optionB:String(raw.optionB||'').trim(),answer:String(raw.answer||raw.optionA||'').trim(),audioUrlA:cleanUrl(raw.audioUrlA),audioUrlB:cleanUrl(raw.audioUrlB)};
      case 'shadowing':case 'pronunciation':return{...base,text:String(raw.text||'').trim(),native:String(raw.native||'').trim(),audioUrl:cleanUrl(raw.audioUrl)};
      case 'sentence-builder':return{...base,prompt:String(raw.prompt||'Build the sentence.').trim(),tokens:parseTokens(raw.tokens),answer:String(raw.answer||'').trim(),rule:String(raw.rule||'').trim(),pattern:String(raw.pattern||'').trim()};
      case 'grammar-rule':return{...base,rule:String(raw.rule||'').trim(),example:String(raw.example||'').trim(),exception:String(raw.exception||'').trim()};
      case 'grammar-practice':return{...base,prompt:String(raw.prompt||'').trim(),choices:stringList(raw.choices),answer:String(raw.answer||'').trim(),explanation:String(raw.explanation||'').trim()};
      case 'youtube-lesson':return{...base,youtubeUrl:cleanUrl(raw.youtubeUrl),transcript:parseTranscript(raw.transcript),glossary:parseGlossary(raw.glossary)};
      case 'graded-story':return{...base,level:['A1','A2','B1','B2','C1','C2'].includes(String(raw.level))?String(raw.level):'A1',text:String(raw.text||'').trim(),narrationUrl:cleanUrl(raw.narrationUrl),glossary:parseGlossary(raw.glossary),checkpoints:parseCheckpoints(raw.checkpoints)};
      case 'cloze':return{...base,prompt:String(raw.prompt||'').trim(),answer:String(raw.answer||'').trim(),difficulty:clamp(raw.difficulty||1,1,5),skill:String(raw.skill||'Grammar').trim(),audioUrl:cleanUrl(raw.audioUrl)};
      case 'matching-grid':return{...base,pairs:parsePairs(raw.pairs),difficulty:clamp(raw.difficulty||2,1,5),skill:String(raw.skill||'Vocabulary').trim()};
      case 'adaptive-choice':return{...base,question:String(raw.question||'').trim(),choices:stringList(raw.choices),answer:String(raw.answer||'').trim(),difficulty:clamp(raw.difficulty||2,1,5),skill:String(raw.skill||'Reading').trim(),audioUrl:cleanUrl(raw.audioUrl)};
      case 'dialogue-scenario':return{...base,scenario:String(raw.scenario||'').trim(),prompt:String(raw.prompt||'').trim(),expected:String(raw.expected||'').trim(),timerSeconds:clamp(raw.timerSeconds||60,15,600),difficulty:clamp(raw.difficulty||3,1,5),skill:String(raw.skill||'Speaking').trim()};
      default:return base;
    }
  }
  function normalizeLanguageLearning(value){
    const raw=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    const items=Array.isArray(raw.items)?raw.items.map(item=>normalizeLearningItem(item,String(item?.page||''))).filter(Boolean):[];
    return{version:1,seedVersion:Math.max(0,Number(raw.seedVersion)||0),items};
  }
  function defaultLanguageLearning(){
    return{version:1,seedVersion:LANGUAGE_SEED_VERSION,items:LANGUAGE_SEED_ITEMS.map(item=>normalizeLearningItem(item,item.page)).filter(Boolean)};
  }
  function ensureLanguageLearningSeed(value){
    const normalized=normalizeLanguageLearning(value);
    if(normalized.seedVersion>=LANGUAGE_SEED_VERSION)return normalized;
    const present=new Set(normalized.items.map(item=>item.page+':'+item.type));
    const missing=LANGUAGE_SEED_ITEMS.filter(item=>!present.has(item.page+':'+item.type)).map(item=>normalizeLearningItem(item,item.page)).filter(Boolean);
    return{version:1,seedVersion:LANGUAGE_SEED_VERSION,items:[...normalized.items,...missing]};
  }
  function readLanguageLearning(){
    const raw=window.DafatiiCourses.readJSON(LANGUAGE_LEARNING_KEY,null);
    const next=ensureLanguageLearningSeed(raw);
    if((Number(raw?.seedVersion)||0)<LANGUAGE_SEED_VERSION&&canManageLanguageLearning())window.DafatiiCourses.writeJSON(LANGUAGE_LEARNING_KEY,next);
    return next;
  }
  function writeLanguageLearning(value){const next=normalizeLanguageLearning(value);window.DafatiiCourses.writeJSON(LANGUAGE_LEARNING_KEY,next);return next;}
  function itemsForPage(page){return readLanguageLearning().items.filter(item=>item.page===page);}
  function icon(name){return window.DafatiiIcons&&window.DafatiiIcons.icon?window.DafatiiIcons.icon(name):'<span>•</span>';}
  function languageNavLabel(item){return t(item[2]);}
  function sideLanguageNav(current){return navSpec.map(item=>'<a href="#'+item[0]+'" class="quiet-link '+(current===item[0]?'selected':'')+'" '+(current===item[0]?'aria-current="page"':'')+'>'+icon(item[1])+'<span>'+esc(languageNavLabel(item))+'</span></a>').join('');}
  function bottomLanguageNav(current){return navSpec.map(item=>'<a href="#'+item[0]+'" class="bottom-nav-item language-bottom-item '+(current===item[0]?'is-active':'')+'" '+(current===item[0]?'aria-current="page"':'')+'><span class="bottom-nav-icon">'+icon(item[1])+'</span><span class="bottom-nav-label">'+esc(languageNavLabel(item))+'</span></a>').join('');}

  const languageSessionKey=()=> 'dafatii:language-learning-session:'+String(window.DafatiiCourses.active().id||'none')+':v1';
  const languageReviewKey=()=> 'dafatii:language-learning-review:'+String(window.DafatiiCourses.active().id||'none')+':v1';
  const languageExamKey=()=> 'dafatii:language-learning-exam:'+String(window.DafatiiCourses.active().id||'none')+':v1';
  function readLocal(key,fallback={}){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?value:fallback;}catch{return fallback;}}
  function writeLocal(key,value){localStorage.setItem(key,JSON.stringify(value));return value;}
  function currentItemIndex(page,items){const state=readLocal(languageSessionKey(),{}),index=Math.max(0,Number(state[page])||0);return Math.min(index,Math.max(items.length-1,0));}
  function setCurrentItemIndex(page,index){const state=readLocal(languageSessionKey(),{});state[page]=Math.max(0,Number(index)||0);writeLocal(languageSessionKey(),state);}
  function reviewState(){return readLocal(languageReviewKey(),{});}
  function scheduleReview(itemId,rating){
    const all=reviewState(),previous=all[itemId]||{},oldInterval=Math.max(1,Number(previous.intervalDays)||1);
    const intervalDays=rating==='hard'?1:rating==='easy'?Math.max(7,Math.round(oldInterval*4)):Math.max(3,Math.round(oldInterval*2.5));
    all[itemId]={rating,intervalDays,repetitions:(Number(previous.repetitions)||0)+1,lastReviewed:Date.now(),dueAt:Date.now()+intervalDays*86400000};
    writeLocal(languageReviewKey(),all);return all[itemId];
  }
  function dueVocabularyCount(){
    const now=Date.now(),reviews=reviewState();
    return itemsForPage('language-letters').filter(item=>item.type==='vocabulary-card'&&(!reviews[item.id]||Number(reviews[item.id].dueAt)<=now)).length;
  }
  function pageManageButton(page){return canManageLanguageLearning()?'<button class="btn btn-ghost language-manage-button" type="button" data-language-manage="'+esc(page)+'">Manage content</button>':'';}
  function languagePageHeader(page){
    const copy=LANGUAGE_PAGE_COPY[page]||{eyebrow:'Language course',title:languageNavLabel(navSpec.find(item=>item[0]===page)||navSpec[0]),description:''};
    return '<header class="language-learning-head"><div><small>'+esc(copy.eyebrow)+' · '+esc(targetLanguage())+'</small><h1>'+esc(copy.title)+'</h1><p>'+esc(copy.description)+'</p></div>'+pageManageButton(page)+'</header>';
  }
  function itemKicker(item){const meta=itemType(item.page,item.type);return '<div class="language-item-kicker"><span>'+esc(meta?.label||'Learning item')+'</span><small>Keep meaning, media, and action together.</small></div>';}
  function emptyState(page){
    return '<section class="language-empty-state"><span aria-hidden="true">＋</span><h2>No learning items yet</h2><p>This pillar is ready for its first carefully designed item.</p>'+(canManageLanguageLearning()?'<button class="btn btn-primary" type="button" data-language-manage="'+esc(page)+'">Add the first item</button>':'')+'</section>';
  }
  function audioControls(text,url,compact=false){
    return '<div class="language-audio-controls '+(compact?'compact':'')+'"><button type="button" class="language-audio-button" data-language-audio data-audio-url="'+esc(url||'')+'" data-speech-text="'+esc(text||'')+'" data-rate="1" aria-label="Play at normal speed"><span aria-hidden="true">▶</span><strong>Play</strong></button><button type="button" class="language-speed-button" data-language-audio data-audio-url="'+esc(url||'')+'" data-speech-text="'+esc(text||'')+'" data-rate=".5" aria-label="Play slowly"><span aria-hidden="true">🐢</span><strong>0.5×</strong></button></div>';
  }
  function renderVocabularyCard(item){
    return '<article class="language-item-shell" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-flashcard" data-flashcard><button class="language-flashcard-toggle" type="button" data-language-flip aria-label="Flip vocabulary card"><span class="language-flashcard-face front">'+(item.imageUrl?'<img src="'+esc(item.imageUrl)+'" alt="" loading="lazy">':'')+'<small>'+esc(item.partOfSpeech||'Vocabulary')+'</small><strong dir="auto">'+esc(item.target||'Add a target word')+'</strong><p dir="auto">'+esc(item.sentence||'Add a contextual example sentence.')+'</p><em>Tap to reveal meaning</em></span><span class="language-flashcard-face back"><small>Meaning</small><strong dir="auto">'+esc(item.native||'Add the native-language meaning')+'</strong><p dir="auto">'+esc(item.sentence||'')+'</p><em>Tap to return</em></span></button></div>'+audioControls(item.target,item.audioUrl,true)+'<div class="language-srs-row" aria-label="Rate recall"><span>How did recall feel?</span><div><button type="button" data-srs-rating="hard" data-item-id="'+esc(item.id)+'">Hard</button><button type="button" data-srs-rating="good" data-item-id="'+esc(item.id)+'">Good</button><button type="button" data-srs-rating="easy" data-item-id="'+esc(item.id)+'">Easy</button></div></div><p class="language-inline-feedback" data-item-feedback aria-live="polite"></p></article>';
  }
  function renderGuidedWriting(item){
    return '<article class="language-item-shell language-writing-item" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-writing-split"><section class="language-writing-prompt"><small>Prompt</small><h2 dir="auto">'+esc(item.title)+'</h2><p dir="auto">'+esc(item.prompt||'Add a writing prompt.')+'</p><div class="language-helper-chips">'+item.helperWords.map(word=>'<button type="button" data-writing-chip="'+esc(word)+'">'+esc(word)+'</button>').join('')+'</div></section><section class="language-writing-editor"><label for="writing-'+esc(item.id)+'">Your response</label><textarea id="writing-'+esc(item.id)+'" rows="12" data-writing-input data-min-words="'+item.minWords+'" placeholder="Write here…"></textarea><footer><span data-writing-counter>0 words · target '+item.minWords+'</span><span data-writing-quality>Start with one complete idea.</span></footer></section></div></article>';
  }
  function renderMinimalPair(item){
    const option=(value,url,label)=>'<button type="button" class="language-pair-option" data-pair-choice="'+esc(value)+'" data-pair-answer="'+esc(item.answer)+'"><strong dir="auto">'+esc(value||label)+'</strong>'+audioControls(value,url,true)+'</button>';
    return '<article class="language-item-shell" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-voice-focus"><small>Listen first</small><h2 dir="auto">'+esc(item.prompt)+'</h2><div class="language-minimal-grid">'+option(item.optionA,item.audioUrlA,'Sound A')+option(item.optionB,item.audioUrlB,'Sound B')+'</div><p class="language-inline-feedback" data-item-feedback aria-live="polite"></p></div></article>';
  }
  function renderVoiceProduction(item){
    return '<article class="language-item-shell" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-voice-focus"><small>'+(item.type==='shadowing'?'Shadowing · listen then repeat':'Pronunciation · listen then produce')+'</small><h2 dir="auto">'+esc(item.text||item.title)+'</h2>'+(item.native?'<p dir="auto">'+esc(item.native)+'</p>':'')+audioControls(item.text,item.audioUrl,false)+'<section class="language-record-module"><div class="language-wave-labels"><span>Native</span><span>You</span></div><canvas class="language-native-wave" width="640" height="72" data-native-wave="'+esc(item.text)+'" aria-hidden="true"></canvas><canvas class="language-user-wave" width="640" height="72" data-user-wave aria-label="Microphone input visualizer"></canvas><button type="button" class="language-mic-button" data-language-record data-expected="'+esc(item.text)+'"><span aria-hidden="true">●</span><strong>Record</strong></button><div class="language-record-result" data-record-result aria-live="polite"><span>Press record, speak, then press again to stop.</span></div></section></div></article>';
  }
  function renderSentenceBuilder(item){
    const chips=item.tokens.map((token,index)=>'<button type="button" draggable="true" data-builder-token="'+esc(token.text)+'" data-builder-role="'+esc(token.role)+'" data-builder-index="'+index+'" class="role-'+esc(token.role||'word')+'">'+esc(token.text)+'</button>').join('');
    return '<article class="language-item-shell" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-grammar-sandbox"><header><small>Discover the pattern</small><h2 dir="auto">'+esc(item.prompt)+'</h2>'+(item.pattern?'<p>'+esc(item.pattern)+'</p>':'')+'</header><div class="language-builder-output" data-builder-output data-answer="'+esc(item.answer)+'" aria-label="Sentence construction area"><span>Build the sentence here</span></div><div class="language-builder-bank" data-builder-bank>'+chips+'</div><div class="language-builder-actions"><button type="button" class="btn btn-primary" data-builder-check>Check sentence</button>'+(item.rule?'<button type="button" class="btn btn-ghost" data-rule-toggle>ⓘ Rule</button>':'')+'</div>'+(item.rule?'<div class="language-rule-popover" data-rule-popover hidden>'+esc(item.rule)+'</div>':'')+'<p class="language-inline-feedback" data-item-feedback aria-live="polite"></p></div></article>';
  }
  function renderGrammarRule(item){
    return '<article class="language-item-shell" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-rule-card"><small>Pattern in context</small><h2 dir="auto">'+esc(item.title)+'</h2><blockquote dir="auto">'+esc(item.example||'Add a clear example.')+'</blockquote><button type="button" class="language-info-button" data-rule-toggle>ⓘ Show the rule</button><div class="language-rule-popover" data-rule-popover hidden><strong>Rule</strong><p dir="auto">'+esc(item.rule||'Add the concise rule.')+'</p>'+(item.exception?'<aside><strong>Exception</strong><p dir="auto">'+esc(item.exception)+'</p></aside>':'')+'</div></div></article>';
  }
  function renderGrammarPractice(item){
    return '<article class="language-item-shell" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-practice-card"><h2 dir="auto">'+esc(item.prompt||item.title)+'</h2><div class="language-practice-choices">'+item.choices.map(choice=>'<button type="button" data-grammar-choice="'+esc(choice)+'" data-grammar-answer="'+esc(item.answer)+'">'+esc(choice)+'</button>').join('')+'</div><p class="language-inline-feedback" data-item-feedback aria-live="polite"></p><p class="language-explanation" data-grammar-explanation hidden>'+esc(item.explanation||'')+'</p></div></article>';
  }
  function youtubeId(value){
    const raw=String(value||'');if(!raw)return'';
    try{const url=new URL(raw);if(url.hostname.includes('youtu.be'))return url.pathname.slice(1).split('/')[0];if(url.hostname.includes('youtube.com'))return url.searchParams.get('v')||url.pathname.split('/').filter(Boolean).pop()||'';}catch{}
    return /^[A-Za-z0-9_-]{6,20}$/.test(raw)?raw:'';
  }
  function wordButtons(text,glossary,segmentIndex){
    return String(text||'').split(/(\s+|[.,!?;:()[\]{}"“”'’]+)/).map(part=>{
      const key=part.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
      if(!key||/^\s+$/.test(part))return esc(part);
      return '<button type="button" class="language-transcript-word" data-video-word="'+esc(part)+'" data-definition="'+esc(glossary[key]||'')+'" data-segment="'+segmentIndex+'">'+esc(part)+'</button>';
    }).join('');
  }
  function renderYoutubeLesson(item){
    const id=youtubeId(item.youtubeUrl);
    const transcript=item.transcript.map((segment,index)=>'<article class="language-transcript-segment" data-transcript-segment="'+index+'" data-start="'+segment.start+'"><small>'+Math.floor(segment.start/60)+':'+String(Math.floor(segment.start%60)).padStart(2,'0')+'</small><p dir="auto">'+wordButtons(segment.target,item.glossary,index)+'</p>'+(segment.native?'<p class="language-native-subtitle" dir="auto">'+esc(segment.native)+'</p>':'')+'</article>').join('');
    return '<article class="language-item-shell language-video-item" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-video-layout"><section class="language-video-pane">'+(id?'<div class="language-youtube-player" id="language-youtube-player" data-youtube-id="'+esc(id)+'"></div>':'<div class="language-media-placeholder"><strong>Add a YouTube URL</strong><span>The synchronized transcript will stay beside the video.</span></div>')+'<div class="language-video-tools"><button type="button" data-native-subtitles aria-pressed="true">Native subtitles: on</button></div></section><section class="language-transcript-pane"><header><small>Interactive transcript</small><strong>Tap a word to inspect it</strong></header><div class="language-transcript-list" data-transcript-list>'+transcript+'</div></section><aside class="language-vocab-panel" data-vocab-panel hidden><button type="button" data-vocab-close aria-label="Close word panel">×</button><small>Word in context</small><strong data-vocab-word></strong><p data-vocab-definition></p><button type="button" class="btn btn-primary" data-add-flashcard>Add to flashcards</button></aside></div></article>';
  }
  function renderStoryText(item){
    const glossary=item.glossary||{};
    return String(item.text||'').split(/(\s+|[.,!?;:()[\]{}"“”'’]+)/).map(part=>{
      const key=part.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
      if(!key||/^\s+$/.test(part))return esc(part);
      if(!glossary[key])return esc(part);
      return '<span class="language-story-word-wrap"><button type="button" class="language-story-word" data-story-word>'+esc(part)+'</button><span class="language-story-translation" hidden>'+esc(glossary[key])+'</span></span>';
    }).join('');
  }
  function renderGradedStory(item){
    return '<article class="language-item-shell language-story-item" data-language-item="'+esc(item.id)+'">'+itemKicker(item)+'<div class="language-reading-progress" aria-label="Reading progress"><span data-reading-progress></span></div><header class="language-story-head"><div><small>'+esc(item.level)+' graded reader</small><h2 dir="auto">'+esc(item.title)+'</h2></div>'+audioControls(item.text,item.narrationUrl,true)+'</header><div class="language-story-reader" data-story-reader><div class="language-story-text" dir="auto">'+renderStoryText(item)+'</div>'+(item.checkpoints.length?'<section class="language-story-checkpoints"><small>Comprehension checkpoints</small>'+item.checkpoints.map((checkpoint,index)=>'<label><span>'+esc(checkpoint.question)+'</span><div><input type="text" data-story-answer="'+index+'" data-answer="'+esc(checkpoint.answer)+'"><button type="button" data-story-check="'+index+'">Check</button></div><em data-story-feedback="'+index+'"></em></label>').join('')+'</section>':'')+'</div></article>';
  }
  function renderLearningItem(item){
    switch(item.type){
      case 'vocabulary-card':return renderVocabularyCard(item);
      case 'guided-writing':return renderGuidedWriting(item);
      case 'minimal-pair':return renderMinimalPair(item);
      case 'shadowing':case 'pronunciation':return renderVoiceProduction(item);
      case 'sentence-builder':return renderSentenceBuilder(item);
      case 'grammar-rule':return renderGrammarRule(item);
      case 'grammar-practice':return renderGrammarPractice(item);
      case 'youtube-lesson':return renderYoutubeLesson(item);
      case 'graded-story':return renderGradedStory(item);
      default:return '';
    }
  }
  function sessionPage(page){
    const items=itemsForPage(page);
    if(!items.length)return '<section class="language-learning-page" data-language-learning-page="'+esc(page)+'">'+languagePageHeader(page)+emptyState(page)+'</section>';
    const index=currentItemIndex(page,items),item=items[index];
    return '<section class="language-learning-page" data-language-learning-page="'+esc(page)+'">'+languagePageHeader(page)+'<div class="language-session-meta"><span>Item <strong>'+(index+1)+'</strong> of '+items.length+'</span><div class="language-session-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round((index+1)/items.length*100)+'"><span style="width:'+((index+1)/items.length*100)+'%"></span></div></div><div class="language-learning-stage">'+renderLearningItem(item)+'</div><nav class="language-session-nav" aria-label="Learning item navigation"><button type="button" class="btn btn-ghost" data-session-move="-1" '+(index===0?'disabled':'')+'>Previous</button><button type="button" class="btn btn-primary" data-session-move="1" '+(index===items.length-1?'disabled':'')+'>Next</button></nav></section>';
  }
  function languageHomePage(){
    const model=readLanguageLearning(),due=dueVocabularyCount();
    const count=(page,type)=>model.items.filter(item=>item.page===page&&(!type||item.type===type)).length;
    const cards=[
      ['Vocabulary & writing','Recall → produce','language-letters',count('language-letters')],
      ['Listening & pronouncing','Discriminate → shadow','language-voice',count('language-voice')],
      ['Grammar & rules','Build → discover','language-grammar',count('language-grammar')],
      ['Watching','Comprehensible video','language-video',count('language-video','youtube-lesson')],
      ['Reading','Graded stories','language-video',count('language-video','graded-story')],
      ['Examining','Adaptive formative checks','language-examine',count('language-examine')]
    ];
    const first=cards.find(card=>card[3]>0)?.[2]||'language-letters';
    return '<section class="language-learning-page language-learning-home" data-language-learning-page="language-home"><header class="language-learning-head"><div><small>'+esc(targetLanguage())+' · language learning</small><h1>Learn through retrieval and context</h1><p>Related text, sound, image, and action stay together so attention remains on the language—not the interface.</p></div></header><section class="language-home-focus"><div><small>Review queue</small><strong>'+due+'</strong><span>'+(due===1?'word is':'words are')+' ready for retrieval practice.</span></div><a class="btn btn-primary" href="#'+first+'">'+(model.items.length?'Continue learning':'Open the first pillar')+'</a></section><div class="language-pillar-grid">'+cards.map(card=>'<a href="#'+card[2]+'" class="language-pillar-card"><small>'+card[1]+'</small><strong>'+card[0]+'</strong><span>'+card[3]+' '+(card[3]===1?'item':'items')+'</span></a>').join('')+'</div></section>';
  }

  function examItems(){return itemsForPage('language-examine');}
  function readExam(){return readLocal(languageExamKey(),{});}
  function writeExam(value){return writeLocal(languageExamKey(),value);}
  function examNormalize(value){return String(value||'').trim().toLocaleLowerCase().replace(/[.,!?;:'"“”‘’]/g,'').replace(/\s+/g,' ');}
  function editDistance(a,b){const x=examNormalize(a),y=examNormalize(b),row=Array.from({length:y.length+1},(_,i)=>i);for(let i=1;i<=x.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=y.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(x[i-1]===y[j-1]?0:1));prev=old;}}return row[y.length];}
  function textSimilarity(a,b){const x=examNormalize(a),y=examNormalize(b),max=Math.max(x.length,y.length);return max?Math.max(0,1-editDistance(x,y)/max):0;}
  function selectAdaptiveExamItem(items,state){
    const attempted=new Set((state.records||[]).map(record=>record.id).concat(state.skipped||[]));
    return items.filter(item=>!attempted.has(item.id)).sort((a,b)=>Math.abs((a.difficulty||1)-(state.difficulty||2))-Math.abs((b.difficulty||1)-(state.difficulty||2))||a.createdAt-b.createdAt)[0]||null;
  }
  function startExam(){
    const items=examItems(),state={startedAt:Date.now(),difficulty:2,records:[],skipped:[],flagged:[],complete:false,currentId:''};
    state.currentId=selectAdaptiveExamItem(items,state)?.id||'';writeExam(state);return state;
  }
  function evaluateExam(item,response){
    if(item.type==='matching-grid'){
      return item.pairs.length>0&&item.pairs.every((pair,index)=>examNormalize(response?.[index])===examNormalize(pair.right));
    }
    if(item.type==='dialogue-scenario')return textSimilarity(response,item.expected)>=.65;
    return examNormalize(response)===examNormalize(item.answer);
  }
  function submitExamResponse(item,response,{skip=false}={}){
    const items=examItems(),state=readExam();
    if(skip)state.skipped=[...(state.skipped||[]),item.id];
    else{
      const correct=evaluateExam(item,response);
      state.records=[...(state.records||[]),{id:item.id,correct,skill:item.skill||'Language',difficulty:item.difficulty||1,response}];
      state.difficulty=correct?Math.min(5,(state.difficulty||2)+1):Math.max(1,(state.difficulty||2)-1);
    }
    const next=selectAdaptiveExamItem(items,state);
    state.currentId=next?.id||'';
    state.complete=!next||((state.records?.length||0)+(state.skipped?.length||0)>=Math.min(20,items.length));
    if(state.complete)state.currentId='';
    writeExam(state);return state;
  }
  function examQuestionMarkup(item,state,total){
    const answered=(state.records?.length||0)+(state.skipped?.length||0),position=Math.min(total,answered+1);
    const progress=total?Math.round(answered/Math.min(total,20)*100):0;
    let control='';
    if(item.audioUrl)control+=audioControls(item.prompt||item.question||'',item.audioUrl,true);
    if(item.type==='cloze')control+='<div class="language-exam-response"><input type="text" data-exam-text placeholder="Type the missing language…" autocomplete="off"></div>';
    if(item.type==='adaptive-choice')control+='<div class="language-exam-choices">'+item.choices.map(choice=>'<button type="button" data-exam-choice="'+esc(choice)+'">'+esc(choice)+'</button>').join('')+'</div>';
    if(item.type==='matching-grid'){
      const rights=item.pairs.map(pair=>pair.right);
      control+='<div class="language-matching-grid">'+item.pairs.map((pair,index)=>'<label><span>'+esc(pair.left)+'</span><select data-match-index="'+index+'"><option value="">Choose…</option>'+rights.map(right=>'<option value="'+esc(right)+'">'+esc(right)+'</option>').join('')+'</select></label>').join('')+'</div>';
    }
    if(item.type==='dialogue-scenario')control+='<div class="language-dialogue-scenario"><p dir="auto">'+esc(item.scenario)+'</p><textarea rows="5" data-exam-text placeholder="Respond in context…"></textarea><span data-exam-timer data-seconds="'+item.timerSeconds+'">'+item.timerSeconds+'s</span></div>';
    return '<section class="language-exam-focus" data-exam-item="'+esc(item.id)+'"><header><div><small>Question '+position+' of '+Math.min(total,20)+' · difficulty '+(item.difficulty||1)+'/5</small><div class="language-session-progress"><span style="width:'+progress+'%"></span></div></div><button type="button" data-exam-flag class="'+((state.flagged||[]).includes(item.id)?'is-flagged':'')+'">⚑ '+((state.flagged||[]).includes(item.id)?'Flagged':'Flag')+'</button></header><article><small>'+esc(item.skill||'Language')+'</small><h2 dir="auto">'+esc(item.question||item.prompt||item.title)+'</h2>'+control+'<p class="language-inline-feedback" data-item-feedback aria-live="polite"></p></article><footer><button type="button" class="btn btn-ghost" data-exam-skip>Skip</button>'+(item.type==='adaptive-choice'?'':'<button type="button" class="btn btn-primary" data-exam-submit>Submit answer</button>')+'</footer></section>';
  }
  function examResultsMarkup(state){
    const records=state.records||[],groups={};
    records.forEach(record=>{const key=record.skill||'Language';groups[key]=groups[key]||{correct:0,total:0};groups[key].total++;if(record.correct)groups[key].correct++;});
    const correct=records.filter(record=>record.correct).length,total=records.length,percent=total?Math.round(correct/total*100):0;
    return '<section class="language-exam-results"><header><small>Assessment complete</small><h2>'+percent+'%</h2><p>'+correct+' correct of '+total+' answered · '+(state.skipped?.length||0)+' skipped</p></header><div class="language-skill-results">'+Object.entries(groups).map(([skill,value])=>{const score=Math.round(value.correct/value.total*100);return '<div><span><strong>'+esc(skill)+'</strong><em>'+score+'%</em></span><div><i style="width:'+score+'%"></i></div></div>';}).join('')+'</div><button type="button" class="btn btn-primary" data-exam-restart>Start a new assessment</button></section>';
  }
  function examPage(){
    const items=examItems(),state=readExam();
    if(!items.length)return '<section class="language-learning-page" data-language-learning-page="language-examine">'+languagePageHeader('language-examine')+emptyState('language-examine')+'</section>';
    if(state.complete)return '<section class="language-learning-page" data-language-learning-page="language-examine">'+languagePageHeader('language-examine')+examResultsMarkup(state)+'</section>';
    if(!state.currentId){
      return '<section class="language-learning-page" data-language-learning-page="language-examine">'+languagePageHeader('language-examine')+'<section class="language-exam-intro"><small>Adaptive formative assessment</small><h2>'+items.length+' available questions</h2><p>Difficulty moves up after correct answers and down after errors. Only one question is shown at a time.</p><button type="button" class="btn btn-primary" data-exam-start>Start assessment</button></section></section>';
    }
    const item=items.find(entry=>entry.id===state.currentId)||selectAdaptiveExamItem(items,state);
    return '<section class="language-learning-page" data-language-learning-page="language-examine">'+languagePageHeader('language-examine')+(item?examQuestionMarkup(item,state,items.length):examResultsMarkup({...state,complete:true}))+'</section>';
  }
  function languageLearningPage(page){
    if(page==='language-home')return languageHomePage();
    if(page==='language-examine')return examPage();
    return sessionPage(page);
  }

  function managerRows(page,items){
    if(!items.length)return '<p class="language-manager-empty">No items in this pillar yet.</p>';
    return '<div class="language-manager-list">'+items.map((item,index)=>'<article><span><small>'+(index+1)+' · '+esc(itemType(page,item.type)?.label||item.type)+'</small><strong>'+esc(item.title||'Untitled')+'</strong></span><div><button type="button" data-edit-learning-item="'+esc(item.id)+'">Edit</button><button type="button" data-delete-learning-item="'+esc(item.id)+'">Delete</button></div></article>').join('')+'</div>';
  }
  function openLanguageManager(page){
    if(!canManageLanguageLearning())return;
    const items=itemsForPage(page),types=itemTypes(page);
    const close=sheet('Manage '+(LANGUAGE_PAGE_COPY[page]?.eyebrow||'language content'),'<div class="language-manager"><section><small>Add learning item</small><div class="language-type-grid">'+types.map(type=>'<button type="button" data-add-learning-type="'+esc(type.id)+'"><strong>'+esc(type.label)+'</strong><span>'+esc(type.description)+'</span></button>').join('')+'</div></section><section><small>Current items</small>'+managerRows(page,items)+'</section></div>');
    document.querySelectorAll('[data-add-learning-type]').forEach(button=>button.onclick=()=>{close();openLanguageItemEditor(page,{type:button.dataset.addLearningType});});
    document.querySelectorAll('[data-edit-learning-item]').forEach(button=>button.onclick=()=>{const item=items.find(entry=>entry.id===button.dataset.editLearningItem);if(item){close();openLanguageItemEditor(page,item);}});
    document.querySelectorAll('[data-delete-learning-item]').forEach(button=>button.onclick=()=>{const id=button.dataset.deleteLearningItem;if(!confirm('Delete this learning item?'))return;const model=readLanguageLearning();model.items=model.items.filter(item=>item.id!==id);writeLanguageLearning(model);close();refreshLanguagePage(page);});
  }
  const editorField=(label,name,value='',type='text',extra='')=>'<label class="field"><span>'+esc(label)+'</span><input type="'+type+'" name="'+name+'" value="'+esc(value)+'" '+extra+'></label>';
  const editorArea=(label,name,value='',rows=4,help='')=>'<label class="field"><span>'+esc(label)+'</span><textarea name="'+name+'" rows="'+rows+'">'+esc(value)+'</textarea>'+(help?'<small>'+esc(help)+'</small>':'')+'</label>';
  function learningEditorFields(page,item){
    const type=item.type||itemTypes(page)[0]?.id;
    let html=editorField('Title','title',item.title||itemType(page,type)?.label||'');
    if(type==='vocabulary-card')html+=editorField('Target word','target',item.target)+editorField('Part of speech','partOfSpeech',item.partOfSpeech)+editorField('Native translation','native',item.native)+editorArea('Example sentence','sentence',item.sentence,3)+editorField('Context image URL','imageUrl',item.imageUrl,'url')+editorField('Native-speaker audio URL','audioUrl',item.audioUrl,'url');
    if(type==='guided-writing')html+=editorArea('Writing prompt','prompt',item.prompt,5)+editorArea('Helpful vocabulary','helperWords',(item.helperWords||[]).join('\n'),5,'One word or phrase per line.')+editorField('Minimum words','minWords',item.minWords||60,'number','min="1" max="5000"')+editorArea('Model answer (optional)','modelAnswer',item.modelAnswer,6);
    if(type==='minimal-pair')html+=editorArea('Instruction','prompt',item.prompt,3)+editorField('Option A','optionA',item.optionA)+editorField('Option A audio URL','audioUrlA',item.audioUrlA,'url')+editorField('Option B','optionB',item.optionB)+editorField('Option B audio URL','audioUrlB',item.audioUrlB,'url')+editorField('Correct option text','answer',item.answer);
    if(type==='shadowing'||type==='pronunciation')html+=editorArea('Target text','text',item.text,4)+editorArea('Native meaning','native',item.native,3)+editorField('Native-speaker audio URL','audioUrl',item.audioUrl,'url');
    if(type==='sentence-builder')html+=editorArea('Prompt','prompt',item.prompt,3)+editorArea('Word chips','tokens',(item.tokens||[]).map(token=>token.text+'|'+(token.role||'')).join('\n'),7,'One per line: word|role. Roles can be subject, verb, object, modifier.')+editorArea('Correct sentence','answer',item.answer,3)+editorField('Slot pattern','pattern',item.pattern)+editorArea('Rule tooltip','rule',item.rule,4);
    if(type==='grammar-rule')html+=editorArea('Rule','rule',item.rule,5)+editorArea('Example','example',item.example,4)+editorArea('Exception alert','exception',item.exception,4);
    if(type==='grammar-practice')html+=editorArea('Practice prompt','prompt',item.prompt,4)+editorArea('Choices','choices',(item.choices||[]).join('\n'),6,'One choice per line.')+editorField('Correct answer','answer',item.answer)+editorArea('Feedback explanation','explanation',item.explanation,4);
    if(type==='youtube-lesson')html+=editorField('YouTube URL','youtubeUrl',item.youtubeUrl,'url')+editorArea('Synchronized transcript','transcript',(item.transcript||[]).map(segment=>segment.start+'|'+segment.target+'|'+segment.native).join('\n'),10,'One line per segment: seconds|target subtitle|native subtitle.')+editorArea('Vocabulary glossary','glossary',Object.entries(item.glossary||{}).map(([word,definition])=>word+'|'+definition).join('\n'),8,'One line per word: word|definition.');
    if(type==='graded-story')html+='<label class="field"><span>CEFR level</span><select name="level">'+['A1','A2','B1','B2','C1','C2'].map(level=>'<option '+(level===(item.level||'A1')?'selected':'')+'>'+level+'</option>').join('')+'</select></label>'+editorArea('Story text','text',item.text,14)+editorField('Narration audio URL','narrationUrl',item.narrationUrl,'url')+editorArea('Difficult-word glossary','glossary',Object.entries(item.glossary||{}).map(([word,definition])=>word+'|'+definition).join('\n'),8,'One line per word: word|translation.')+editorArea('Comprehension checkpoints','checkpoints',(item.checkpoints||[]).map(point=>point.question+'|'+point.answer).join('\n'),7,'One line per checkpoint: question|answer.');
    if(['cloze','adaptive-choice','matching-grid','dialogue-scenario'].includes(type))html+=editorField('Difficulty 1–5','difficulty',item.difficulty||2,'number','min="1" max="5"')+editorField('Skill label','skill',item.skill||'Language');
    if(type==='cloze')html+=editorArea('Sentence / prompt','prompt',item.prompt,4,'Use ___ to show the blank.')+editorField('Correct answer','answer',item.answer)+editorField('Optional audio URL','audioUrl',item.audioUrl,'url');
    if(type==='matching-grid')html+=editorArea('Matching pairs','pairs',(item.pairs||[]).map(pair=>pair.left+'|'+pair.right).join('\n'),8,'One pair per line: left|right.');
    if(type==='adaptive-choice')html+=editorArea('Question','question',item.question,4)+editorArea('Choices','choices',(item.choices||[]).join('\n'),6,'One choice per line.')+editorField('Correct answer','answer',item.answer)+editorField('Optional audio URL','audioUrl',item.audioUrl,'url');
    if(type==='dialogue-scenario')html+=editorArea('Scenario','scenario',item.scenario,5)+editorArea('Prompt','prompt',item.prompt,4)+editorArea('Expected response','expected',item.expected,4)+editorField('Timer seconds','timerSeconds',item.timerSeconds||60,'number','min="15" max="600"');
    return html;
  }
  function readLearningEditor(form,page,base){
    const data=Object.fromEntries(new FormData(form)),type=base.type;
    const raw={...base,...data,page,type,id:base.id||learningUid('learn'),createdAt:base.createdAt||Date.now()};
    if(data.helperWords!==undefined)raw.helperWords=stringLines(data.helperWords);
    if(data.choices!==undefined)raw.choices=stringLines(data.choices);
    if(data.tokens!==undefined)raw.tokens=parseTokens(data.tokens);
    if(data.transcript!==undefined)raw.transcript=parseTranscript(data.transcript);
    if(data.glossary!==undefined)raw.glossary=parseGlossary(data.glossary);
    if(data.checkpoints!==undefined)raw.checkpoints=parseCheckpoints(data.checkpoints);
    if(data.pairs!==undefined)raw.pairs=parsePairs(data.pairs);
    return normalizeLearningItem(raw,page);
  }
  function openLanguageItemEditor(page,item){
    if(!canManageLanguageLearning())return;
    const type=item.type||itemTypes(page)[0]?.id;if(!type)return;
    const meta=itemType(page,type),base={...item,type};
    const close=sheet((item.id?'Edit ':'Add ')+(meta?.label||'learning item'),'<form class="language-item-editor" data-learning-editor><input type="hidden" name="type" value="'+esc(type)+'"><div class="language-editor-context"><small>'+esc(LANGUAGE_PAGE_COPY[page]?.eyebrow||'Language')+'</small><strong>'+esc(meta?.label||type)+'</strong><p>'+esc(meta?.description||'')+'</p></div>'+learningEditorFields(page,base)+'<button type="submit" class="btn btn-primary">Save learning item</button><p class="auth-note">Content stays in the course record; learner review and assessment state remain personal.</p></form>');
    document.querySelector('[data-learning-editor]').onsubmit=event=>{event.preventDefault();const model=readLanguageLearning(),next=readLearningEditor(event.currentTarget,page,base);const index=model.items.findIndex(entry=>entry.id===next.id);if(index>=0)model.items[index]=next;else model.items.push(next);writeLanguageLearning(model);close();refreshLanguagePage(page);};
  }

  let activeRecorder=null;
  let activeYoutubePlayer=null;
  let transcriptTimer=null;
  let examTimer=null;
  function playLearningAudio(button){
    const url=button.dataset.audioUrl||'',text=button.dataset.speechText||'',rate=Number(button.dataset.rate)||1;
    if(url){const audio=new Audio(url);audio.playbackRate=rate;audio.play().catch(()=>{});return;}
    if(!text||!('speechSynthesis'in window))return;
    speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=LANGUAGE_SPEECH_LOCALES[targetLanguage()]||'en-US';utterance.rate=rate;speechSynthesis.speak(utterance);
  }
  function drawNativeWaves(){
    document.querySelectorAll('[data-native-wave]').forEach(canvas=>{
      const ctx=canvas.getContext('2d'),text=canvas.dataset.nativeWave||'';ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#2563eb';ctx.lineWidth=2;ctx.beginPath();
      for(let x=0;x<canvas.width;x+=6){const code=text.charCodeAt(Math.floor(x/6)%Math.max(1,text.length))||65,amp=8+(code%23),y=canvas.height/2+Math.sin(x*.09)*(amp*.55);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
    });
  }
  function recognizedSimilarity(transcript,expected){return Math.round(textSimilarity(transcript,expected)*100);}
  async function toggleRecording(button){
    if(activeRecorder){
      activeRecorder.recorder.stop();button.disabled=true;return;
    }
    const module=button.closest('.language-record-module'),result=module.querySelector('[data-record-result]'),canvas=module.querySelector('[data-user-wave]');
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){result.textContent='Recording is not supported in this browser.';return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}),recorder=new MediaRecorder(stream),chunks=[],audioContext=new (window.AudioContext||window.webkitAudioContext)(),source=audioContext.createMediaStreamSource(stream),analyser=audioContext.createAnalyser(),ctx=canvas.getContext('2d');
      analyser.fftSize=256;source.connect(analyser);let transcript='',raf=0;
      const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;let recognition=null;
      if(Recognition){recognition=new Recognition();recognition.lang=LANGUAGE_SPEECH_LOCALES[targetLanguage()]||'en-US';recognition.interimResults=true;recognition.onresult=event=>{transcript=Array.from(event.results).map(row=>row[0]?.transcript||'').join(' ');};try{recognition.start();}catch{}}
      const draw=()=>{const data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteTimeDomainData(data);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#2563eb';ctx.lineWidth=2;ctx.beginPath();data.forEach((value,index)=>{const x=index/(data.length-1)*canvas.width,y=value/255*canvas.height;index?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();raf=requestAnimationFrame(draw);};draw();
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onstop=()=>{cancelAnimationFrame(raf);recognition&&(()=>{try{recognition.stop();}catch{}})();stream.getTracks().forEach(track=>track.stop());audioContext.close();const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'}),url=URL.createObjectURL(blob),expected=button.dataset.expected||'',score=transcript?recognizedSimilarity(transcript,expected):null;result.innerHTML='<audio class="language-recorded-audio" controls src="'+esc(url)+'"></audio><div><strong>'+(score===null?'Playback ready':score+'% recognition match')+'</strong><span>'+(transcript?'Recognized: '+esc(transcript):'Speech recognition was unavailable; compare your playback directly with the native model.')+'</span></div>';button.disabled=false;button.innerHTML='<span aria-hidden="true">●</span><strong>Record again</strong>';activeRecorder=null;};
      recorder.start();activeRecorder={recorder};button.innerHTML='<span aria-hidden="true">■</span><strong>Stop</strong>';result.textContent='Recording…';
    }catch(error){result.textContent='Microphone access was not available.';activeRecorder=null;}
  }
  function ensureYoutubeApi(callback){
    if(window.YT?.Player){callback();return;}
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{if(typeof previous==='function')previous();callback();};
    if(!document.querySelector('script[data-dafatii-youtube-api]')){const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.dataset.dafatiiYoutubeApi='1';document.head.appendChild(script);}
  }
  function bindYoutube(){
    clearInterval(transcriptTimer);transcriptTimer=null;
    if(activeYoutubePlayer?.destroy){try{activeYoutubePlayer.destroy();}catch{}}activeYoutubePlayer=null;
    const host=document.getElementById('language-youtube-player');if(!host)return;
    const videoId=host.dataset.youtubeId;if(!videoId)return;
    ensureYoutubeApi(()=>{if(!document.getElementById('language-youtube-player'))return;activeYoutubePlayer=new YT.Player('language-youtube-player',{videoId,playerVars:{rel:0,modestbranding:1},events:{onReady:()=>{transcriptTimer=setInterval(()=>{if(!activeYoutubePlayer?.getCurrentTime)return;const time=activeYoutubePlayer.getCurrentTime(),segments=[...document.querySelectorAll('[data-transcript-segment]')];let current=null;segments.forEach(segment=>{if(Number(segment.dataset.start)<=time)current=segment;});segments.forEach(segment=>segment.classList.toggle('is-current',segment===current));current?.scrollIntoView?.({block:'nearest',behavior:'smooth'});},400);}}});});
  }
  function personalFlashcards(){
    return readLocal('dafatii:language-learning-personal-flashcards:'+String(window.DafatiiCourses.active().id||'none')+':v1',[]);
  }
  function addPersonalFlashcard(word,definition){
    const key='dafatii:language-learning-personal-flashcards:'+String(window.DafatiiCourses.active().id||'none')+':v1',cards=personalFlashcards();
    if(!cards.some(card=>examNormalize(card.word)===examNormalize(word)))cards.push({id:learningUid('card'),word,definition,addedAt:Date.now()});
    writeLocal(key,cards);return cards;
  }
  function refreshLanguagePage(page){
    const current=document.querySelector('[data-language-learning-page]');if(!current)return;
    current.outerHTML=languageLearningPage(page);bindLanguageLearningPage(page);
  }
  function bindSessionNavigation(page){
    document.querySelectorAll('[data-session-move]').forEach(button=>button.onclick=()=>{const items=itemsForPage(page),index=currentItemIndex(page,items),next=Math.min(items.length-1,Math.max(0,index+Number(button.dataset.sessionMove)));setCurrentItemIndex(page,next);refreshLanguagePage(page);});
  }
  function bindWriting(){
    document.querySelectorAll('[data-writing-input]').forEach(input=>{
      const update=()=>{const words=input.value.trim()?input.value.trim().split(/\s+/).length:0,min=Number(input.dataset.minWords)||0,counter=input.closest('.language-writing-editor').querySelector('[data-writing-counter]'),quality=input.closest('.language-writing-editor').querySelector('[data-writing-quality]');counter.textContent=words+' words · target '+min;quality.textContent=words===0?'Start with one complete idea.':words<min?'Keep developing the idea; '+(min-words)+' words remain.':'Length target reached. Review clarity, grammar, and vocabulary.';};
      input.addEventListener('input',update);update();
    });
    document.querySelectorAll('[data-writing-chip]').forEach(button=>button.onclick=()=>{const input=button.closest('.language-writing-split').querySelector('[data-writing-input]');input.value+=(input.value&& !/\s$/.test(input.value)?' ':'')+button.dataset.writingChip+' ';input.dispatchEvent(new Event('input'));input.focus();});
  }
  function bindGrammar(){
    document.querySelectorAll('[data-rule-toggle]').forEach(button=>button.onclick=()=>{const root=button.closest('.language-item-shell'),popover=root.querySelector('[data-rule-popover]');popover.hidden=!popover.hidden;button.setAttribute('aria-expanded',String(!popover.hidden));});
    document.querySelectorAll('[data-builder-token]').forEach(button=>{
      button.ondragstart=event=>event.dataTransfer.setData('text/plain',button.dataset.builderIndex);
      button.onclick=()=>addBuilderToken(button);
    });
    document.querySelectorAll('[data-builder-output]').forEach(output=>{
      output.ondragover=event=>event.preventDefault();
      output.ondrop=event=>{event.preventDefault();const index=event.dataTransfer.getData('text/plain'),button=document.querySelector('[data-builder-index="'+CSS.escape(index)+'"]');if(button)addBuilderToken(button);};
    });
    document.querySelectorAll('[data-builder-check]').forEach(button=>button.onclick=()=>{const root=button.closest('.language-item-shell'),output=root.querySelector('[data-builder-output]'),built=[...output.querySelectorAll('[data-built-token]')].map(node=>node.dataset.builtToken).join(' '),answer=output.dataset.answer||'',feedback=root.querySelector('[data-item-feedback]');feedback.textContent=examNormalize(built)===examNormalize(answer)?'Correct pattern.':'Not yet. Inspect the order and try again.';feedback.className='language-inline-feedback '+(examNormalize(built)===examNormalize(answer)?'is-correct':'is-wrong');});
    document.querySelectorAll('[data-grammar-choice]').forEach(button=>button.onclick=()=>{const root=button.closest('.language-item-shell'),correct=examNormalize(button.dataset.grammarChoice)===examNormalize(button.dataset.grammarAnswer),feedback=root.querySelector('[data-item-feedback]'),explanation=root.querySelector('[data-grammar-explanation]');root.querySelectorAll('[data-grammar-choice]').forEach(choice=>choice.classList.remove('is-selected'));button.classList.add('is-selected');feedback.textContent=correct?'Correct. Apply the same pattern again.':'Try again, then open the explanation if needed.';feedback.className='language-inline-feedback '+(correct?'is-correct':'is-wrong');if(explanation)explanation.hidden=correct||!explanation.textContent.trim();});
  }
  function addBuilderToken(button){
    const root=button.closest('.language-item-shell'),output=root.querySelector('[data-builder-output]');output.querySelector('span')?.remove();const token=document.createElement('button');token.type='button';token.dataset.builtToken=button.dataset.builderToken;token.className=button.className;token.textContent=button.dataset.builderToken;token.onclick=()=>token.remove();output.appendChild(token);
  }
  function bindMediaLearning(){
    document.querySelectorAll('[data-language-audio]').forEach(button=>button.onclick=event=>{event.stopPropagation();playLearningAudio(button);});
    document.querySelectorAll('[data-language-record]').forEach(button=>button.onclick=()=>toggleRecording(button));
    drawNativeWaves();
    document.querySelectorAll('[data-pair-choice]').forEach(button=>button.onclick=()=>{const root=button.closest('.language-item-shell'),correct=examNormalize(button.dataset.pairChoice)===examNormalize(button.dataset.pairAnswer),feedback=root.querySelector('[data-item-feedback]');root.querySelectorAll('[data-pair-choice]').forEach(choice=>choice.classList.remove('is-selected'));button.classList.add('is-selected');feedback.textContent=correct?'Correct discrimination. Now say it aloud.':'Listen again at normal and slow speed.';feedback.className='language-inline-feedback '+(correct?'is-correct':'is-wrong');});
  }
  function bindVideoAndReading(){
    bindYoutube();
    document.querySelectorAll('[data-native-subtitles]').forEach(button=>button.onclick=()=>{const hidden=button.getAttribute('aria-pressed')==='true';button.setAttribute('aria-pressed',String(!hidden));button.textContent='Native subtitles: '+(hidden?'off':'on');document.querySelectorAll('.language-native-subtitle').forEach(node=>node.hidden=hidden);});
    document.querySelectorAll('[data-video-word]').forEach(button=>button.onclick=()=>{activeYoutubePlayer?.pauseVideo?.();const panel=document.querySelector('[data-vocab-panel]');panel.hidden=false;panel.querySelector('[data-vocab-word]').textContent=button.dataset.videoWord;panel.querySelector('[data-vocab-definition]').textContent=button.dataset.definition||'No saved definition for this word yet.';panel.querySelector('[data-add-flashcard]').dataset.word=button.dataset.videoWord;panel.querySelector('[data-add-flashcard]').dataset.definition=button.dataset.definition||'';});
    document.querySelector('[data-vocab-close]')?.addEventListener('click',()=>{document.querySelector('[data-vocab-panel]').hidden=true;});
    document.querySelector('[data-add-flashcard]')?.addEventListener('click',event=>{addPersonalFlashcard(event.currentTarget.dataset.word,event.currentTarget.dataset.definition);event.currentTarget.textContent='Added';});
    document.querySelectorAll('[data-story-word]').forEach(button=>button.onclick=()=>{const bubble=button.parentElement.querySelector('.language-story-translation');bubble.hidden=!bubble.hidden;});
    document.querySelectorAll('[data-story-reader]').forEach(reader=>{const update=()=>{const max=Math.max(1,reader.scrollHeight-reader.clientHeight),progress=Math.min(100,Math.round(reader.scrollTop/max*100));reader.closest('.language-story-item').querySelector('[data-reading-progress]').style.width=progress+'%';};reader.addEventListener('scroll',update,{passive:true});update();});
    document.querySelectorAll('[data-story-check]').forEach(button=>button.onclick=()=>{const index=button.dataset.storyCheck,root=button.closest('.language-story-checkpoints'),input=root.querySelector('[data-story-answer="'+CSS.escape(index)+'"]'),feedback=root.querySelector('[data-story-feedback="'+CSS.escape(index)+'"]'),correct=textSimilarity(input.value,input.dataset.answer)>=.85;feedback.textContent=correct?'Correct.':'Check the story context and try again.';feedback.className=correct?'is-correct':'is-wrong';});
  }
  function bindReview(){
    document.querySelectorAll('[data-language-flip]').forEach(button=>button.onclick=()=>{button.closest('[data-flashcard]').classList.toggle('is-flipped');});
    document.querySelectorAll('[data-srs-rating]').forEach(button=>button.onclick=()=>{const review=scheduleReview(button.dataset.itemId,button.dataset.srsRating),root=button.closest('.language-item-shell'),feedback=root.querySelector('[data-item-feedback]');feedback.textContent='Scheduled in '+review.intervalDays+' '+(review.intervalDays===1?'day':'days')+'.';feedback.className='language-inline-feedback is-correct';});
  }
  function currentExamItem(){
    const state=readExam();return examItems().find(item=>item.id===state.currentId)||null;
  }
  function bindExam(){
    document.querySelector('[data-exam-start]')?.addEventListener('click',()=>{startExam();refreshLanguagePage('language-examine');});
    document.querySelector('[data-exam-restart]')?.addEventListener('click',()=>{writeExam({});refreshLanguagePage('language-examine');});
    document.querySelector('[data-exam-flag]')?.addEventListener('click',event=>{const item=currentExamItem(),state=readExam();if(!item)return;const set=new Set(state.flagged||[]);set.has(item.id)?set.delete(item.id):set.add(item.id);state.flagged=[...set];writeExam(state);event.currentTarget.classList.toggle('is-flagged',set.has(item.id));event.currentTarget.textContent=(set.has(item.id)?'⚑ Flagged':'⚑ Flag');});
    document.querySelector('[data-exam-skip]')?.addEventListener('click',()=>{const item=currentExamItem();if(!item)return;submitExamResponse(item,'',{skip:true});refreshLanguagePage('language-examine');});
    document.querySelectorAll('[data-exam-choice]').forEach(button=>button.onclick=()=>{const item=currentExamItem();if(!item)return;submitExamResponse(item,button.dataset.examChoice);refreshLanguagePage('language-examine');});
    document.querySelector('[data-exam-submit]')?.addEventListener('click',()=>{const item=currentExamItem();if(!item)return;let response='';if(item.type==='matching-grid')response=[...document.querySelectorAll('[data-match-index]')].map(select=>select.value);else response=document.querySelector('[data-exam-text]')?.value||'';submitExamResponse(item,response);refreshLanguagePage('language-examine');});
    clearInterval(examTimer);examTimer=null;const timer=document.querySelector('[data-exam-timer]');if(timer){let remaining=Number(timer.dataset.seconds)||60;examTimer=setInterval(()=>{remaining--;timer.textContent=Math.max(0,remaining)+'s';if(remaining<=0){clearInterval(examTimer);examTimer=null;const item=currentExamItem();if(item){submitExamResponse(item,'',{skip:true});refreshLanguagePage('language-examine');}}},1000);}
  }
  function bindLanguageLearningPage(page){
    document.querySelectorAll('[data-language-manage]').forEach(button=>button.onclick=()=>openLanguageManager(button.dataset.languageManage||page));
    bindSessionNavigation(page);bindReview();bindWriting();bindMediaLearning();bindGrammar();bindVideoAndReading();if(page==='language-examine')bindExam();
  }

  function installWorkspaceRoutes(){
    const previousContent=workspaceContent;
    workspaceContent=function(page,parts,title){
      if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return languageLearningPage(page);
      if(courseType()==='personal'&&page==='study-rooms')return personalRoomPage();
      return previousContent(page,parts,title);
    };
    const previousWorkspace=workspace;
    workspace=function(current){
      const type=courseType(),page=String(current||'').split('/')[0];
      if(type==='language'&&window.DafatiiCourses.active().id){
        purgeLegacyLanguageBrowserState();
        if(!LANGUAGE_ROUTES.includes(page)&&!['change-course','profile','settings','representer','admin'].includes(page)){setHash('language-home');return;}
      }
      if(type==='personal'&&page==='chat'){setHash('study-rooms');return;}
      previousWorkspace(current);
      adaptNavigation();
      if(type==='personal'&&page==='study-rooms')bindPersonalRoom();
      if(type==='language'&&LANGUAGE_ROUTES.includes(page))bindLanguageLearningPage(page);
    };
  }

  function adaptNavigation(){
    const type=courseType(),current=(location.hash||'#language-home').replace(/^#\/?/,'').split('/')[0];
    if(type==='personal'){
      document.querySelectorAll('a[href^="#chat"],[data-page="chat"],[data-bottom-nav-item="chat"]').forEach(node=>node.remove());
      if(current==='study-rooms')document.querySelector('.quiet-workspace>.sub-nav')?.remove();
      return;
    }
    if(type!=='language')return;
    document.querySelector('.quiet-workspace>.sub-nav')?.remove();
    document.querySelector('.quiet-return-button')?.remove();
    document.querySelector('.quiet-workspace')?.classList.add('language-course-shell');
    const activeNav=navSpec.find(item=>item[0]===current)||navSpec[0];
    const toolbarTitle=document.querySelector('.quiet-toolbar-title strong'),toolbarKicker=document.querySelector('.quiet-toolbar-title small');
    if(toolbarTitle)toolbarTitle.textContent=languageNavLabel(activeNav);
    if(toolbarKicker)toolbarKicker.textContent=targetLanguage()+' course';
    const side=document.querySelector('.quiet-sidebar > nav'),desktop=document.querySelector('.quiet-desktop-tabs'),bottom=document.querySelector('.bottom-nav');
    if(side)side.innerHTML=sideLanguageNav(current);
    if(desktop)desktop.innerHTML=sideLanguageNav(current);
    if(bottom)bottom.innerHTML=bottomLanguageNav(current);
  }

  function routeAfterCourseSwitch(){return courseType()==='language'?'language-home':'dashboard/overview';}
  function installCourseChangeRouting(){
    window.addEventListener('dafatii:coursechanged',()=>{
      const current=(location.hash||'').replace(/^#\/?/,'').split('/')[0];
      if(current!=='change-course')return;
      setTimeout(()=>setHash(routeAfterCourseSwitch()),0);
    });
  }

  wrapCourseCreation();
  installCreateInterceptor();
  installWorkspaceRoutes();
  installCourseChangeRouting();
  window.DafatiiCourseModes=Object.freeze({
    courseType,isLanguage,targetLanguage,openTypeChooser,
    languageRoutes:[...LANGUAGE_ROUTES],
    languageChoices:LANGUAGE_CHOICES.map(item=>item[0]),
    learningKey:LANGUAGE_LEARNING_KEY,
    languageItemTypes:LANGUAGE_ITEM_TYPES,
    seedVersion:LANGUAGE_SEED_VERSION,
    seedItemCount:LANGUAGE_SEED_ITEMS.length
  });
})();
