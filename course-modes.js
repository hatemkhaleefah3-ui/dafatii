(() => {
  'use strict';

  const COURSE_TYPES = ['dafaa','personal','teaching','language'];
  const LANGUAGE_ROUTES = ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine'];

  const LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v2';
  const LANGUAGE_PAGE_ITEM_TYPES = Object.freeze({
    'language-home': { eyebrow:'Course library', title:'Learning items', theme:'home', types:['lesson-note','learning-goal'] },
    'language-letters': { eyebrow:'Vocabulary & writing', title:'Build words with meaning', theme:'vocabulary', types:['letter','word-translation','image-word','sentence-pair','spelling-write','handwriting'] },
    'language-voice': { eyebrow:'Listening & speaking', title:'Hear it. Say it.', theme:'voice', types:['pronunciation','text-to-voice','image-to-voice','voice-to-text','voice-to-image','voice-pair'] },
    'language-grammar': { eyebrow:'Grammar & rules', title:'Patterns that make sense', theme:'grammar', types:['grammar-topic','grammar-rule','grammar-example','grammar-training'] },
    'language-video': { eyebrow:'Watching & reading', title:'Learn in context', theme:'reading', types:['youtube-video','story','reading','note'] },
    'language-examine': { eyebrow:'Examining', title:'Practice with purpose', theme:'exam', types:['single-choice','multiple-choice','true-false','fill-blank','ordering','short-answer'] }
  });
  const LANGUAGE_ITEM_TYPES = Object.freeze({
    'lesson-note':{label:'Lesson note',icon:'✦',hint:'A short introduction or learning guide.'},
    'learning-goal':{label:'Learning goal',icon:'◎',hint:'A goal learners can keep visible.'},
    letter:{label:'Letter',icon:'Aa',hint:'A letter, its sound, and its native-language cue.'},
    'word-translation':{label:'Word & translation',icon:'↔',hint:'A target word paired with its native meaning.'},
    'image-word':{label:'Image to word',icon:'▧',hint:'An image prompt with a target-language word.'},
    'sentence-pair':{label:'Sentence pair',icon:'❝',hint:'A target-language sentence with its translation.'},
    'spelling-write':{label:'Spelling & write',icon:'⌨',hint:'A typed spelling practice item.'},
    handwriting:{label:'Handwriting',icon:'✎',hint:'A writing prompt for a letter, word, or sentence.'},
    pronunciation:{label:'Pronunciation',icon:'◌',hint:'Hear and repeat a word or phrase.'},
    'text-to-voice':{label:'Text to voice',icon:'☊',hint:'Speak the displayed text aloud.'},
    'image-to-voice':{label:'Image to voice',icon:'◉',hint:'Name what you see aloud.'},
    'voice-to-text':{label:'Voice to text',icon:'♫',hint:'Listen, then type what you heard.'},
    'voice-to-image':{label:'Voice to image',icon:'◈',hint:'Listen, then choose or describe the image.'},
    'voice-pair':{label:'Language voice pair',icon:'⇄',hint:'Compare target and native audio.'},
    'grammar-topic':{label:'Grammar',icon:'⌘',hint:'Introduce a grammar point such as present simple.'},
    'grammar-rule':{label:'Grammar rule',icon:'≡',hint:'Normal, question, or negative rule.'},
    'grammar-example':{label:'Grammar example',icon:'⟡',hint:'An example with a clear explanation.'},
    'grammar-training':{label:'Grammar training',icon:'✓',hint:'A short grammar practice prompt.'},
    'youtube-video':{label:'YouTube video',icon:'▶',hint:'A watched lesson or contextual clip.'},
    story:{label:'Story',icon:'▤',hint:'A short story in the target language.'},
    reading:{label:'Reading',icon:'¶',hint:'A reading passage with a translation cue.'},
    note:{label:'Note',icon:'✦',hint:'A connected reading or teacher note.'},
    'single-choice':{label:'Single choice',icon:'◉',hint:'One correct answer.'},
    'multiple-choice':{label:'Multiple choice',icon:'☷',hint:'More than one correct answer.'},
    'true-false':{label:'True / false',icon:'◐',hint:'A quick statement check.'},
    'fill-blank':{label:'Fill the blank',icon:'＿',hint:'Type the missing word or phrase.'},
    ordering:{label:'Order the sentence',icon:'↦',hint:'Put words or steps in order.'},
    'short-answer':{label:'Short answer',icon:'✎',hint:'Respond in your own words.'}
  });
  const LANGUAGE_CHOICES = Object.freeze([
    ['English','English'],['Arabic','العربية'],['Spanish','Español'],['French','Français'],
    ['German','Deutsch'],['Turkish','Türkçe'],['Persian','فارسی'],['Kurdish','کوردی'],
    ['Italian','Italiano'],['Portuguese','Português'],['Russian','Русский'],['Chinese','中文'],
    ['Japanese','日本語'],['Korean','한국어'],['Hindi','हिन्दी'],['Urdu','اردو']
  ]);

  const LANGUAGE_ITEM_EXAMPLES = Object.freeze({
    'lesson-note':{title:'How to use this lesson',note:'Start with the cards in order. Listen, repeat, then write one answer before moving on.'},
    'learning-goal':{title:'Today’s goal',note:'By the end of this lesson, introduce yourself with one clear sentence.'},
    letter:{title:'Letter A',target:'A a',native:'صوت قريب من «أَ»',pronunciation:'ay',note:'Use the capital form at the beginning of a sentence.'},
    'word-translation':{title:'A useful greeting',target:'Hello',native:'مرحباً',pronunciation:'heh-LOW'},
    'image-word':{title:'Name the image',target:'Cat',native:'قطة'},
    'sentence-pair':{title:'A simple sentence',target:'I have a book.',native:'لدي كتاب.'},
    'spelling-write':{title:'Spell the word',target:'friend',prompt:'Write the word: friend',answer:'friend'},
    handwriting:{title:'Write a sentence',target:'My name is Sara.',prompt:'Copy the sentence with clear spacing.',answer:'My name is Sara.'},
    pronunciation:{title:'Say it clearly',target:'Good morning',native:'صباح الخير',pronunciation:'good MOR-ning'},
    'text-to-voice':{title:'Read aloud',target:'How are you today?',prompt:'Press Listen, then repeat with the same rhythm.'},
    'image-to-voice':{title:'Describe the image',target:'This is a red apple.',prompt:'Look at the image and say the sentence aloud.'},
    'voice-to-text':{title:'Listen and type',target:'Welcome to our class.',prompt:'Listen to the phrase, then type it.',answer:'Welcome to our class.'},
    'voice-to-image':{title:'Listen and identify',target:'The blue bicycle is near the tree.',prompt:'Listen and identify the correct image.'},
    'voice-pair':{title:'Compare the phrase',target:'Thank you',native:'شكراً'},
    'grammar-topic':{title:'Present simple',target:'Present simple',note:'Use it for habits, routines, and facts: I study every day.'},
    'grammar-rule':{title:'Normal rule',target:'Subject + base verb',rule:'Normal rule',note:'With he, she, or it, add -s or -es to the verb.'},
    'grammar-example':{title:'Present simple example',target:'She reads every night.',native:'هي تقرأ كل ليلة.',example:'reads has -s because the subject is she.'},
    'grammar-training':{title:'Choose the correct form',prompt:'He ___ English every day.',choices:'study\nstudies\nstudying',answer:'studies'},
    'youtube-video':{title:'Watch a short lesson',videoUrl:'https://www.youtube.com/watch?v=ysz5S6PUM-U',note:'Watch once for the main idea, then watch again and note three useful words.'},
    story:{title:'A short story',target:'Maya opens the window. The morning is sunny, and she smiles at her new neighbour.',native:'تفتح مايا النافذة. الصباح مشمس، وتبتسم لجارتها الجديدة.'},
    reading:{title:'Read for meaning',target:'Our class meets on Monday and Wednesday. We practise speaking together for thirty minutes.',native:'يلتقي صفنا يومي الاثنين والأربعاء. نتدرب على التحدث معاً لمدة ثلاثين دقيقة.'},
    note:{title:'Reader note',note:'Look for familiar words first. Use the sentence around an unknown word to infer its meaning.'},
    'single-choice':{title:'Choose one answer',prompt:'Which word means «كتاب»?',choices:'Book\nTable\nWindow',answer:'Book'},
    'multiple-choice':{title:'Choose the best answers',prompt:'Which are greetings?',choices:'Hello\nGoodbye\nBook\nThank you',answer:'Hello'},
    'true-false':{title:'True or false',prompt:'“She go to school” is correct.',answer:'False'},
    'fill-blank':{title:'Complete the sentence',prompt:'I ___ a student.',answer:'am'},
    ordering:{title:'Put the words in order',prompt:'morning / good / everyone',answer:'Good morning everyone'},
    'short-answer':{title:'Write your answer',prompt:'Write one sentence introducing yourself.',answer:''}
  });
  function itemExample(type){return {...(LANGUAGE_ITEM_EXAMPLES[type]||{})};}

  const COPY = {
    en:{home:'Home',letters:'Vocabulary & writing',voice:'Listening & speaking',grammar:'Grammar & rules',video:'Watching & reading',examine:'Examining'},
    ar:{home:'الرئيسية',letters:'المفردات والكتابة',voice:'الاستماع والتحدث',grammar:'القواعد والأحكام',video:'المشاهدة والقراءة',examine:'الاختبارات'}
  };

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
        key === 'dafatii:language-content:v1' ||
        key.startsWith('dafatii:paragraph-translate:') ||
        (activeId && key.startsWith('__dafatii:course-cache:'+activeId+':dafatii:language-content:v1'))
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
      ['language','Aa','Create Language course','Create a language course with page-specific learning item types.','إنشاء دورة لغة','أنشئ مساحة دورة لغة فارغة للبناء من الصفر.']
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
    const close=sheet(arabic?'إنشاء دورة لغة':'Create Language course','<form id="course-mode-form" class="language-course-create"><input type="hidden" name="courseType" value="language"><input type="hidden" name="targetLanguage" value=""><input type="hidden" name="name" value=""><input type="hidden" name="templateName" value="Computer Science"><input type="hidden" name="studyType" value="courses"><input type="hidden" name="institution" value=""><input type="hidden" name="stage" value="university"><input type="hidden" name="pricing" value="free"><input type="hidden" name="priceMinor" value="0"><input type="hidden" name="visibility" value="public"><input type="hidden" name="joinPolicy" value="direct"><input type="hidden" name="learningField" value="Languages"><input type="hidden" name="difficultyLevel" value="beginner"><div class="language-create-intro"><small>'+(arabic?'دورة لغة':'Language course')+'</small><h3>'+(arabic?'اختر اللغة':'Select a language')+'</h3><p>'+(arabic?'سيتم إنشاء دورة فارغة بالكامل دون محتوى أو عناصر تعلم مسبقة.':'The course starts empty, ready for page-specific learning items you can add and manage.')+'</p></div><div class="language-picker" role="radiogroup" aria-label="'+(arabic?'لغة الدورة':'Course language')+'">'+choices+'</div><button class="btn btn-primary auth-submit language-create-submit" id="language-course-create" type="submit" disabled>'+(arabic?'إنشاء الدورة':'Create course')+'</button><p class="auth-note" id="course-mode-status">'+(arabic?'اختر لغة للمتابعة.':'Select a language to continue.')+'</p></form>');
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
  function icon(name){return window.DafatiiIcons&&window.DafatiiIcons.icon?window.DafatiiIcons.icon(name):'<span>•</span>';}
  function languageNavLabel(item){return t(item[2]);}
  function sideLanguageNav(current){return navSpec.map(item=>'<a href="#'+item[0]+'" class="quiet-link '+(current===item[0]?'selected':'')+'" '+(current===item[0]?'aria-current="page"':'')+'>'+icon(item[1])+'<span>'+esc(languageNavLabel(item))+'</span></a>').join('');}
  function bottomLanguageNav(current){return navSpec.map(item=>'<a href="#'+item[0]+'" class="bottom-nav-item language-bottom-item '+(current===item[0]?'is-active':'')+'" '+(current===item[0]?'aria-current="page"':'')+'><span class="bottom-nav-icon">'+icon(item[1])+'</span><span class="bottom-nav-label">'+esc(languageNavLabel(item))+'</span></a>').join('');}
  function languageItems(){
    const saved=window.DafatiiCourses.readJSON(LANGUAGE_CONTENT_KEY,{version:2,items:[]});
    const items=Array.isArray(saved?.items)?saved.items:[];
    return items.filter(item=>item&&LANGUAGE_ITEM_TYPES[item.type]&&LANGUAGE_PAGE_ITEM_TYPES[item.page]);
  }
  function canManageLanguageItems(){
    try{return Boolean(window.DafatiiCourses.editable('add_content')||window.DafatiiCourses.editable('edit_content')||window.DafatiiCourses.editable('remove_content'));}catch{return false;}
  }
  function persistLanguageItems(items){
    window.DafatiiCourses.writeJSON(LANGUAGE_CONTENT_KEY,{version:2,updatedAt:Date.now(),items});
  }
  function itemById(id){return languageItems().find(item=>item.id===id)||null;}
  function typeMeta(type){return LANGUAGE_ITEM_TYPES[type]||LANGUAGE_ITEM_TYPES.note;}
  function pageMeta(page){return LANGUAGE_PAGE_ITEM_TYPES[page]||LANGUAGE_PAGE_ITEM_TYPES['language-home'];}
  function itemText(item,key){return String(item[key]||'').trim();}
  function itemChoices(item){return itemText(item,'choices').split(/\r?\n|\|/).map(value=>value.trim()).filter(Boolean).slice(0,8);}
  function safeVideo(url){
    const value=itemText({url},'url');
    const match=value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);
    return match?match[1]:'';
  }
  function mediaImage(item){const url=itemText(item,'imageUrl');return url?'<img class="language-item-image" src="'+esc(url)+'" alt="'+esc(itemText(item,'target')||itemText(item,'title'))+'">':'';}
  function audioPlayer(item,key='audioUrl'){const url=itemText(item,key);return url?'<audio class="language-item-audio" controls preload="metadata" src="'+esc(url)+'"></audio>':'';}
  function renderChoices(item){
    const choices=itemChoices(item);
    if(!choices.length)return '<p class="language-item-muted">Add choices in the editor, one per line.</p>';
    return '<div class="language-choice-row" data-language-question="'+esc(item.id)+'">'+choices.map(choice=>'<button type="button" data-language-answer-choice="'+esc(choice)+'">'+esc(choice)+'</button>').join('')+'</div>';
  }
  function languageItemFeature(item){
    const target=itemText(item,'target'),native=itemText(item,'native'),prompt=itemText(item,'prompt'),answer=itemText(item,'answer'),rule=itemText(item,'rule'),example=itemText(item,'example'),note=itemText(item,'note');
    const image=mediaImage(item),audio=audioPlayer(item),speaker=target?'<button class="language-utility-button" type="button" data-language-speak="'+esc(target)+'">Listen</button>':'';
    switch(item.type){
      case 'letter':return '<div class="language-letter-glyph" dir="auto">'+esc(target||'A')+'</div><div><strong>'+esc(itemText(item,'pronunciation')||'Sound')+'</strong><p>'+esc(native||note||'Add the sound and a native-language cue.')+'</p></div>'+speaker;
      case 'word-translation':return '<div class="language-pair"><strong dir="auto">'+esc(target||'Target word')+'</strong><button type="button" data-language-reveal="'+esc(item.id)+'">Reveal meaning</button><span hidden data-language-revealed="'+esc(item.id)+'" dir="auto">'+esc(native||'Native meaning')+'</span></div>'+speaker;
      case 'image-word':return '<div class="language-image-word">'+image+'<strong dir="auto">'+esc(target||'Target word')+'</strong></div>'+speaker;
      case 'sentence-pair':return '<blockquote dir="auto">'+esc(target||'Target-language sentence.')+'</blockquote><p class="language-translation" dir="auto">'+esc(native||'Native-language sentence.')+'</p>'+speaker;
      case 'spelling-write':case 'handwriting':return '<p class="language-prompt" dir="auto">'+esc(prompt||target||'Write the target language answer.')+'</p><div class="language-answer-line"><input data-language-input="'+esc(item.id)+'" placeholder="Write your answer"><button type="button" data-language-check="'+esc(item.id)+'" data-language-expected="'+esc(answer||target)+'">Check</button></div><p class="language-item-feedback" data-language-feedback="'+esc(item.id)+'"></p>';
      case 'pronunciation':case 'text-to-voice':case 'image-to-voice':return image+'<p class="language-prompt" dir="auto">'+esc(prompt||target||'Say this aloud.')+'</p>'+speaker;
      case 'voice-to-text':return audio+'<p class="language-prompt">'+esc(prompt||'Listen, then write what you hear.')+'</p><div class="language-answer-line"><input data-language-input="'+esc(item.id)+'" placeholder="Type what you heard"><button type="button" data-language-check="'+esc(item.id)+'" data-language-expected="'+esc(answer||target)+'">Check</button></div><p class="language-item-feedback" data-language-feedback="'+esc(item.id)+'"></p>';
      case 'voice-to-image':return audio+image+'<p class="language-prompt">'+esc(prompt||'Listen and identify the image.')+'</p>';
      case 'voice-pair':return '<div class="language-voice-pair"><div><small>Target language</small>'+audio+'</div><div><small>Native language</small>'+audioPlayer(item,'nativeAudioUrl')+'</div></div>';
      case 'grammar-topic':return '<div class="language-grammar-topic"><strong>'+esc(target||itemText(item,'title')||'Grammar topic')+'</strong><p>'+esc(note||prompt||'Explain the grammar point in a concise way.')+'</p></div>';
      case 'grammar-rule':return '<div class="language-rule"><small>'+esc(rule||'Rule')+'</small><strong>'+esc(target||'Normal rule')+'</strong><p>'+esc(note||prompt||'Describe when this pattern is used.')+'</p></div>';
      case 'grammar-example':return '<div class="language-example"><blockquote dir="auto">'+esc(target||'Example sentence.')+'</blockquote><p dir="auto">'+esc(native||example||'Explanation or translation.')+'</p></div>';
      case 'grammar-training':return '<p class="language-prompt">'+esc(prompt||'Complete the grammar practice.')+'</p>'+renderChoices(item);
      case 'youtube-video':{
        const id=safeVideo(itemText(item,'videoUrl'));return id?'<div class="language-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/'+esc(id)+'" title="'+esc(itemText(item,'title')||'Language video')+'" loading="lazy" allowfullscreen></iframe></div>':'<p class="language-item-muted">Add a YouTube URL in the editor.</p>';
      }
      case 'story':return '<article class="language-story" dir="auto"><h4>'+esc(itemText(item,'title')||'Story')+'</h4><p>'+esc(target||prompt||'Add the story text.')+'</p><footer>'+esc(native||note||'Add a translation or reader note.')+'</footer></article>';
      case 'reading':return '<article class="language-reading" dir="auto"><p>'+esc(target||prompt||'Add a reading passage.')+'</p><details><summary>Translation / note</summary><p>'+esc(native||note||'Add a translation or note.')+'</p></details></article>';
      case 'note':case 'lesson-note':case 'learning-goal':return '<p class="language-note-copy">'+esc(note||prompt||target||'Add your content in the editor.')+'</p>';
      case 'true-false':return '<p class="language-prompt">'+esc(prompt||target||'Read the statement.')+'</p><div class="language-choice-row" data-language-question="'+esc(item.id)+'"><button type="button" data-language-answer-choice="True">True</button><button type="button" data-language-answer-choice="False">False</button></div>';
      case 'fill-blank':case 'short-answer':case 'ordering':return '<p class="language-prompt">'+esc(prompt||target||'Answer the question.')+'</p><div class="language-answer-line"><input data-language-input="'+esc(item.id)+'" placeholder="Your answer"><button type="button" data-language-check="'+esc(item.id)+'" data-language-expected="'+esc(answer)+'">Check</button></div><p class="language-item-feedback" data-language-feedback="'+esc(item.id)+'"></p>';
      case 'single-choice':case 'multiple-choice':return '<p class="language-prompt">'+esc(prompt||target||'Choose the best answer.')+'</p>'+renderChoices(item);
      default:return '<p class="language-item-muted">This item is ready to edit.</p>';
    }
  }
  function languageItemCard(item,editable){
    const meta=typeMeta(item.type);
    const controls=editable?'<div class="language-item-controls"><button type="button" data-language-edit="'+esc(item.id)+'">Edit</button><button type="button" data-language-delete="'+esc(item.id)+'">Delete</button><button type="button" data-language-share="'+esc(item.id)+'">Share</button></div>':'<div class="language-item-controls"><button type="button" data-language-share="'+esc(item.id)+'">Share</button></div>';
    return '<article class="language-item-card type-'+esc(item.type)+'"><header><span class="language-item-icon">'+esc(meta.icon)+'</span><div><small>'+esc(meta.label)+'</small><h3>'+esc(itemText(item,'title')||meta.label)+'</h3></div></header><div class="language-item-body">'+languageItemFeature(item)+'</div>'+controls+'</article>';
  }
  function languageItemsPage(page){
    const meta=pageMeta(page),editable=canManageLanguageItems(),items=languageItems().filter(item=>item.page===page);
    const add=editable?'<button class="btn btn-primary language-add-item" type="button" data-language-add="'+esc(page)+'">Add content item</button>':'';
    const examples=editable?'<button class="language-add-examples" type="button" data-language-add-examples="'+esc(page)+'">Add page examples</button>':'';
    const empty='<div class="language-item-empty"><span>✦</span><h2>No items yet</h2><p>Add a '+esc(meta.title.toLowerCase())+' item to start building this page.</p>'+add+examples+'</div>';
    return '<section class="language-items-page theme-'+esc(meta.theme)+'" data-language-items-page="'+esc(page)+'"><header class="language-items-hero"><div><small>'+esc(meta.eyebrow)+'</small><h1>'+esc(meta.title)+'</h1><p>Each card has its own learning interaction and shared management controls.</p></div><div class="language-hero-actions">'+examples+add+'</div></header><div class="language-item-grid">'+(items.length?items.map(item=>languageItemCard(item,editable)).join(''):empty)+'</div></section>';
  }
  function refreshLanguageItemsPage(){
    const page=(location.hash||'#language-home').replace(/^#\/?/,'').split('/')[0];
    const current=document.querySelector('[data-language-items-page]');
    if(current&&LANGUAGE_ROUTES.includes(page)){current.outerHTML=languageItemsPage(page);bindLanguageItems();}
  }
  const editorFields=[
    ['title','Title','text'],['target','Target-language text','text'],['native','Native-language text','text'],['prompt','Prompt / instructions','textarea'],['answer','Correct answer','text'],
    ['imageUrl','Image URL','url'],['audioUrl','Target audio URL','url'],['nativeAudioUrl','Native audio URL','url'],['videoUrl','YouTube URL','url'],
    ['rule','Rule label','text'],['example','Example / explanation','textarea'],['choices','Choices — one per line','textarea'],['note','Teaching note','textarea'],['pronunciation','Pronunciation cue','text']
  ];
  function editorControl(field,value){
    const [key,label,kind]=field;
    const content=esc(value||'');
    return '<label class="language-editor-field"><span>'+esc(label)+'</span>'+(kind==='textarea'?'<textarea name="'+esc(key)+'" rows="3">'+content+'</textarea>':'<input name="'+esc(key)+'" type="'+esc(kind)+'" value="'+content+'">')+'</label>';
  }
  function openLanguageItemEditor(page,id=''){
    if(!canManageLanguageItems())return;
    const existing=id?itemById(id):null,meta=pageMeta(page),initialType=existing?.type||meta.types[0],initialExample=itemExample(initialType),initialValues={...initialExample,...(existing||{})};
    const typeOptions=meta.types.map(type=>'<option value="'+esc(type)+'" '+(type===initialType?'selected':'')+'>'+esc(typeMeta(type).label)+'</option>').join('');
    const exampleButton='<button class="language-use-example" type="button" data-language-use-example>Use this type’s example</button>';
    const close=sheet(existing?'Edit content item':'Add content item','<form class="language-item-editor" id="language-item-editor"><input type="hidden" name="id" value="'+esc(existing?.id||'')+'"><input type="hidden" name="page" value="'+esc(page)+'"><label class="language-editor-field"><span>Item type</span><select name="type">'+typeOptions+'</select><small id="language-type-hint">'+esc(typeMeta(initialType).hint)+'</small></label>'+exampleButton+editorFields.map(field=>editorControl(field,initialValues[field[0]])).join('')+'<button class="btn btn-primary" type="submit">'+(existing?'Save item':'Add item')+'</button><p class="auth-note" id="language-item-status"></p></form>');
    const form=document.getElementById('language-item-editor'),type=form.elements.type,status=document.getElementById('language-item-status');
    const applyExample=()=>{const sample=itemExample(type.value);editorFields.forEach(([key])=>{if(Object.hasOwn(sample,key)&&form.elements[key])form.elements[key].value=sample[key];});document.getElementById('language-type-hint').textContent=typeMeta(type.value).hint;};
    type.onchange=()=>{document.getElementById('language-type-hint').textContent=typeMeta(type.value).hint;};
    form.querySelector('[data-language-use-example]').onclick=applyExample;
    form.onsubmit=event=>{
      event.preventDefault();
      const values=Object.fromEntries(new FormData(form)),typeName=String(values.type||'');
      if(!LANGUAGE_ITEM_TYPES[typeName]){status.textContent='Choose a valid item type.';return;}
      const item={...existing,...values,id:existing?.id||crypto.randomUUID(),page,type:typeName,updatedAt:Date.now()};
      const next=languageItems().filter(entry=>entry.id!==item.id);next.push(item);
      try{persistLanguageItems(next);close();refreshLanguageItemsPage();}catch(error){status.textContent=error.message||'Unable to save this item.';}
    };
  }
  async function shareLanguageItem(id){
    const item=itemById(id);if(!item)return;
    const text=[itemText(item,'title')||typeMeta(item.type).label,itemText(item,'target'),itemText(item,'native')].filter(Boolean).join('\n');
    const url=location.href;
    try{if(navigator.share){await navigator.share({title:itemText(item,'title')||typeMeta(item.type).label,text,url});return;}await navigator.clipboard.writeText(text+'\n'+url);const button=document.querySelector('[data-language-share="'+CSS.escape(id)+'"]');if(button){button.textContent='Copied';setTimeout(()=>button.textContent='Share',1500);}}catch{}
  }
  function addPageExamples(page){
    if(!canManageLanguageItems())return;
    const existing=languageItems(),existingTypes=new Set(existing.filter(item=>item.page===page).map(item=>item.type));
    const samples=pageMeta(page).types.filter(type=>!existingTypes.has(type)).map(type=>({id:crypto.randomUUID(),page,type,updatedAt:Date.now(),...itemExample(type)}));
    if(samples.length){persistLanguageItems([...existing,...samples]);refreshLanguageItemsPage();}
  }
  function bindLanguageItems(){
    document.querySelectorAll('[data-language-add]').forEach(button=>button.onclick=()=>openLanguageItemEditor(button.dataset.languageAdd));
    document.querySelectorAll('[data-language-add-examples]').forEach(button=>button.onclick=()=>addPageExamples(button.dataset.languageAddExamples));
    document.querySelectorAll('[data-language-edit]').forEach(button=>button.onclick=()=>{const item=itemById(button.dataset.languageEdit);if(item)openLanguageItemEditor(item.page,item.id);});
    document.querySelectorAll('[data-language-delete]').forEach(button=>button.onclick=()=>{const item=itemById(button.dataset.languageDelete);if(!item||!confirm('Delete this content item?'))return;persistLanguageItems(languageItems().filter(entry=>entry.id!==item.id));refreshLanguageItemsPage();});
    document.querySelectorAll('[data-language-share]').forEach(button=>button.onclick=()=>shareLanguageItem(button.dataset.languageShare));
    document.querySelectorAll('[data-language-reveal]').forEach(button=>button.onclick=()=>{const value=document.querySelector('[data-language-revealed="'+CSS.escape(button.dataset.languageReveal)+'"]');if(value){value.hidden=false;button.hidden=true;}});
    document.querySelectorAll('[data-language-speak]').forEach(button=>button.onclick=()=>{if(!('speechSynthesis' in window))return;const utterance=new SpeechSynthesisUtterance(button.dataset.languageSpeak);utterance.lang=targetLanguage()==='Arabic'?'ar-SA':'en-US';window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);});
    document.querySelectorAll('[data-language-check]').forEach(button=>button.onclick=()=>{const id=button.dataset.languageCheck,input=document.querySelector('[data-language-input="'+CSS.escape(id)+'"]'),feedback=document.querySelector('[data-language-feedback="'+CSS.escape(id)+'"]'),actual=String(input?.value||'').trim().toLocaleLowerCase(),expected=String(button.dataset.languageExpected||'').trim().toLocaleLowerCase();if(feedback)feedback.textContent=expected&&actual===expected?'Correct — great work.':expected?'Try again.':'Saved your response.';});
    document.querySelectorAll('[data-language-answer-choice]').forEach(button=>button.onclick=()=>{const group=button.closest('[data-language-question]');group?.querySelectorAll('button').forEach(choice=>choice.classList.remove('is-selected'));button.classList.add('is-selected');});
  }

  function installWorkspaceRoutes(){
    const previousContent=workspaceContent;
    workspaceContent=function(page,parts,title){
      if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return languageItemsPage(page);
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
      if(type==='language'&&LANGUAGE_ROUTES.includes(page))bindLanguageItems();
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
    languageItemTypes:LANGUAGE_ITEM_TYPES,
    languageContentKey:LANGUAGE_CONTENT_KEY,
    languageItemExamples:LANGUAGE_ITEM_EXAMPLES
  });
})();
