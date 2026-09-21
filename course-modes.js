(() => {
  'use strict';

  const COURSE_TYPES = ['dafaa','personal','teaching','language'];
  const LANGUAGE_ROUTES = ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine'];
  const LANGUAGE_INTERMEDIATE_ROUTES = ['language-start-zero','language-level-test'];
  const LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v1';
  const LANGUAGE_CHOICES = Object.freeze([
    ['English','English'],['Arabic','العربية'],['Spanish','Español'],['French','Français'],
    ['German','Deutsch'],['Turkish','Türkçe'],['Persian','فارسی'],['Kurdish','کوردی'],
    ['Italian','Italiano'],['Portuguese','Português'],['Russian','Русский'],['Chinese','中文'],
    ['Japanese','日本語'],['Korean','한국어'],['Hindi','हिन्दी'],['Urdu','اردو']
  ]);
  const COPY = {
    en:{home:'Home',letters:'Vocabulary & writing',voice:'Listening & talking',grammar:'Grammar & rules',video:'YouTube understanding',examine:'Examining'},
    ar:{home:'الرئيسية',letters:'المفردات والكتابة',voice:'الاستماع والتحدث',grammar:'القواعد والأحكام',video:'فهم يوتيوب',examine:'الاختبارات'}
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
  function canManageLanguageContent(){
    return isAdminActor()||['add_content','edit_content','remove_content'].some(permission=>window.DafatiiCourses?.editable?.(permission));
  }
  const languageUid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const learnerKey=courseId=>'dafatii:language-learner:'+String(courseId||window.DafatiiCourses.active().id||'none')+':v1';
  function readLearnerState(courseId){try{const value=JSON.parse(localStorage.getItem(learnerKey(courseId))||'null');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function writeLearnerState(patch,courseId){const next={...readLearnerState(courseId),...patch,updatedAt:Date.now()};localStorage.setItem(learnerKey(courseId),JSON.stringify(next));return next;}
  function defaultLanguageContent(selectedLanguage=targetLanguage()){
    const target=normalizeTargetLanguage(selectedLanguage)||'Language',pages={};
    const pageItems={
      'language-letters':[{id:'seed-letters-1',title:'Hello',body:'A simple starter word for '+target+'.'},{id:'seed-letters-2',title:'Name',body:'A short writing prompt for Level 1 · Step 1.'},{id:'seed-letters-3',title:'Book',body:'A small vocabulary card ready to edit or delete.'}],
      'language-voice':[{id:'seed-voice-1',title:'Listen and repeat',body:'Simple listening and speaking content placeholder.'},{id:'seed-voice-2',title:'Short phrase',body:'Keep this page text-first until the learning system is built.'}],
      'language-grammar':[{id:'seed-grammar-1',title:'Subject + verb',body:'A simple grammar note for the first learning box.'},{id:'seed-grammar-2',title:'Example sentence',body:'This content is intentionally plain and editable.'}],
      'language-video':[{id:'seed-video-1',title:'Video understanding',body:'A simple comprehension prompt. No video tool is connected yet.'}],
      'language-examine':[{id:'seed-examine-1',title:'Checkpoint',body:'A simple question placeholder for Level 1 · Step 1 · Box 1.'}]
    };
    Object.entries(pageItems).forEach(([page,items])=>{pages['level-1|step-1|box-1|'+page]=items;});
    return {version:1,targetLanguage:target,levels:[{id:'level-1',name:'Level 1',steps:[{id:'step-1',name:'Step 1',boxes:[{id:'box-1',name:'Box 1'}]}]}],pages,intermediate:{
      'language-start-zero':[{id:'seed-letter-a',title:'A a',body:'A is the first starter letter.'},{id:'seed-letter-b',title:'B b',body:'B is the next starter letter.'},{id:'seed-letter-c',title:'C c',body:'C is a simple practice letter.'},{id:'seed-letter-d',title:'D d',body:'D completes this starter sample.'}],
      'language-level-test':[{id:'seed-test-1',title:'Question 1',body:'Choose the sentence that looks correct.',choices:['I am a student.','I student am.','I am student a.']},{id:'seed-test-2',title:'Question 2',body:'Choose the best word: I ___ English every day.',choices:['study','studies','studying am']},{id:'seed-test-3',title:'Question 3',body:'Choose the clearest sentence.',choices:['She went home yesterday.','She go home yesterday.','Yesterday she home go.']},{id:'seed-test-4',title:'Question 4',body:'Choose the best completion: If I have time, I ___ read.',choices:['will','am','was']}]
    }};
  }
  function readLanguageContent(){const value=window.DafatiiCourses.readJSON(LANGUAGE_CONTENT_KEY,null);return value&&typeof value==='object'&&!Array.isArray(value)?value:defaultLanguageContent();}
  function writeLanguageContent(value){window.DafatiiCourses.writeJSON(LANGUAGE_CONTENT_KEY,value);return value;}

  function emptyLanguageSeededContent(selectedLanguage){
    const suite=readSuite();
    suite.courseMeta={version:1,courseType:'language',targetLanguage:normalizeTargetLanguage(selectedLanguage),studyType:'courses'};
    for(const key of ['notes','resources','assignments','deadlines','focusLog','applications','scholarships','volunteer','support','activity']) suite[key]=[];
    writeSuite(suite);
    window.DafatiiCourses.writeJSON('dafatii:subjects',[]);
    window.DafatiiCourses.writeJSON('dafatii:lectures',{});
    window.DafatiiCourses.writeJSON('dafatii:weeklySchedule',[]);
    window.DafatiiCourses.writeJSON('dafatii:examSchedule',[]);
    window.DafatiiCourses.writeJSON('dafatii:chatState:v1',{conversations:[],selected:{private:'',group:'',unknown:''},reported:[],blocked:[]});
    window.DafatiiCourses.writeJSON(LANGUAGE_CONTENT_KEY,defaultLanguageContent(selectedLanguage));
  }

  function purgeLegacyLanguageBrowserState(){
    if(!isLanguage())return;
    const activeId=String(window.DafatiiCourses.active().id||'');
    for(let i=localStorage.length-1;i>=0;i--){
      const key=localStorage.key(i)||'';
      if(key.startsWith('dafatii:language-progress:')) localStorage.removeItem(key);
      if(activeId && key==='__dafatii:course-cache:'+activeId+':dafatii:language-authoring:v1') localStorage.removeItem(key);
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
      if(type==='language')emptyLanguageSeededContent(selectedLanguage);
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
      ['language','Aa','Create Language course','Choose a language, then create an empty course shell with six navigation pages.','إنشاء دورة لغة','اختر لغة ثم أنشئ هيكل دورة فارغاً مع ست صفحات تنقل.']
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
    const close=sheet(arabic?'إنشاء دورة لغة':'Create Language course','<form id="course-mode-form" class="language-course-create"><input type="hidden" name="courseType" value="language"><input type="hidden" name="targetLanguage" value=""><input type="hidden" name="name" value=""><input type="hidden" name="templateName" value="Computer Science"><input type="hidden" name="studyType" value="courses"><input type="hidden" name="institution" value=""><input type="hidden" name="stage" value="university"><input type="hidden" name="pricing" value="free"><input type="hidden" name="priceMinor" value="0"><input type="hidden" name="visibility" value="public"><input type="hidden" name="joinPolicy" value="direct"><input type="hidden" name="learningField" value="Languages"><input type="hidden" name="difficultyLevel" value="beginner"><div class="language-create-intro"><small>'+(arabic?'دورة لغة':'Language course')+'</small><h3>'+(arabic?'اختر اللغة':'Select a language')+'</h3><p>'+(arabic?'اختر لغة واحدة. ستُنشأ الدورة كمساحة فارغة مع صفحات التنقل فقط.':'Choose one language. The course will be created as an empty workspace with navigation only.')+'</p></div><div class="language-picker" role="radiogroup" aria-label="'+(arabic?'لغة الدورة':'Course language')+'">'+choices+'</div><button class="btn btn-primary auth-submit language-create-submit" id="language-course-create" type="submit" disabled>'+(arabic?'إنشاء الدورة':'Create course')+'</button><p class="auth-note" id="course-mode-status">'+(arabic?'اختر لغة للمتابعة.':'Select a language to continue.')+'</p></form>');
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
      submit.disabled=true;status.textContent=(arabic?'جارٍ إنشاء دورة ':'Creating empty ')+selected+(arabic?' فارغة…':' course…');
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

  const looksLikeLanguageCourse=course=>String(course?.learningField||'').toLowerCase()==='languages'||/\blanguage course\b/i.test(String(course?.name||''));
  function targetFromCourse(course){const match=/^(.+?)\s+Language Course$/i.exec(String(course?.name||''));return normalizeTargetLanguage(match?.[1])||'English';}
  function openLanguageEnrollment(course,prefillAccess=''){
    const target=targetFromCourse(course),arabic=lang()==='ar',testLabel=target==='English'?'Test my English':'Test my '+target;
    const access=course.visibility==='private'?'<div class="field"><label>Private access code</label><input name="accessCode" type="password" minlength="6" maxlength="64" value="'+esc(prefillAccess)+'" required></div>':'<input type="hidden" name="accessCode" value="">';
    const close=sheet(arabic?'الانضمام إلى دورة اللغة':'Join language course','<form id="language-enroll-form" class="language-enroll-form">'+access+'<div class="language-enroll-section"><small>'+(arabic?'اللغة الأصلية':'Native language')+'</small><h3>'+(arabic?'اختر لغتك الأصلية':'Choose your native language')+'</h3><div class="language-enroll-toggle" role="radiogroup"><button type="button" data-native-language="Arabic">العربية<span>Arabic</span></button><button type="button" data-native-language="English">English<span>English</span></button></div></div><div class="language-enroll-section"><small>'+(arabic?'نقطة البداية':'Starting path')+'</small><h3>'+(arabic?'كيف تريد أن تبدأ؟':'How do you want to start?')+'</h3><div class="language-path-toggle" role="radiogroup"><button type="button" data-language-path="zero"><strong>'+(arabic?'ابدأ من الصفر':'Start from zero')+'</strong><span>'+(arabic?'ابدأ بالحروف ثم المستوى الأول.':'Learn the letters first, then Level 1 · Step 1.')+'</span></button><button type="button" data-language-path="test"><strong>'+esc(testLabel)+'</strong><span>'+(arabic?'اختبار بسيط خطوة بخطوة لتحديد نقطة البداية.':'Use a simple step-by-step level check before the course.')+'</span></button></div></div><button class="btn btn-primary auth-submit" id="language-enroll-submit" type="submit" disabled>'+(arabic?'الانضمام والمتابعة':'Enroll and continue')+'</button><p class="auth-note" id="language-enroll-status">'+(arabic?'اختر اللغة الأصلية وطريقة البداية.':'Choose a native language and a starting path.')+'</p></form>');
    const form=document.getElementById('language-enroll-form'),submit=document.getElementById('language-enroll-submit'),status=document.getElementById('language-enroll-status');let nativeLanguage='',entryMode='';
    const sync=()=>{submit.disabled=!(nativeLanguage&&entryMode);};
    form.querySelectorAll('[data-native-language]').forEach(button=>button.onclick=()=>{nativeLanguage=button.dataset.nativeLanguage;form.querySelectorAll('[data-native-language]').forEach(item=>item.classList.toggle('is-selected',item===button));sync();});
    form.querySelectorAll('[data-language-path]').forEach(button=>button.onclick=()=>{entryMode=button.dataset.languagePath;form.querySelectorAll('[data-language-path]').forEach(item=>item.classList.toggle('is-selected',item===button));sync();});
    form.onsubmit=async event=>{event.preventDefault();if(!nativeLanguage||!entryMode)return;submit.disabled=true;status.textContent=arabic?'جارٍ الانضمام…':'Enrolling…';try{const values=new FormData(form),result=await window.DafatiiCourses.enroll({course:course.enrollmentCode,accessCode:values.get('accessCode')||'',note:'Language onboarding: '+nativeLanguage+' · '+entryMode});writeLearnerState({nativeLanguage,entryMode,onboardingComplete:false,currentLevel:1,currentStep:1,currentBox:1,intermediateIndex:0,targetLanguage:target},result.courseId);if(result.status==='active'){close();await window.DafatiiCourses.switchCourse(result.courseId);setHash(entryMode==='zero'?'language-start-zero':'language-level-test');}else status.textContent=entryMode==='zero'?'Enrollment submitted. Letter learning starts after acceptance.':'Enrollment submitted. The level check starts after acceptance.';}catch(error){status.textContent=error.message;submit.disabled=false;}};
  }
  function installLanguageEnrollInterceptor(){
    document.addEventListener('click',event=>{const button=event.target.closest&&event.target.closest('[data-course-enroll]');if(!button)return;const code=String(button.dataset.courseEnroll||''),course=window.DafatiiCourses?.list?.().find(item=>String(item.enrollmentCode||'')===code);if(!looksLikeLanguageCourse(course))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openLanguageEnrollment(course);},true);
    document.addEventListener('submit',event=>{const form=event.target;if(!form||form.id!=='course-enroll-form')return;const values=new FormData(form),code=String(values.get('course')||'').trim().toUpperCase(),course=window.DafatiiCourses?.list?.().find(item=>String(item.enrollmentCode||'').toUpperCase()===code||String(item.id||'')===String(values.get('course')||''));if(!looksLikeLanguageCourse(course))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();document.getElementById('course-overlay')?.remove();openLanguageEnrollment(course,String(values.get('accessCode')||''));},true);
  }

  let personalTimer=null;
  const personalRoomKey=()=> 'dafatii:personal-focus-room:'+String(window.DafatiiCourses.active().id||'none')+':v1';
  function personalRoomPage(){
    const room=window.DafatiiData.readJSON(personalRoomKey(),{goal:'',notes:'',minutes:50,sessions:0})||{goal:'',notes:'',minutes:50,sessions:0};
    return '<section class="personal-focus-page"><header class="personal-focus-hero"><div><small>Personal course · one private room</small><h1>My Focus Room</h1><p>A single distraction-controlled studio for deliberate study, session timing, working notes and materials.</p></div><div class="personal-focus-stat"><strong>'+Number(room.sessions||0)+'</strong><span>focus sessions</span></div></header><div class="personal-focus-grid"><article class="personal-focus-timer"><small>Focus block</small><div id="personal-focus-clock">'+String(Number(room.minutes||50)).padStart(2,'0')+':00</div><div><button type="button" data-personal-timer="start">Start</button><button type="button" data-personal-timer="reset">Reset</button></div><label>Minutes<input id="personal-focus-minutes" type="number" min="5" max="180" value="'+Number(room.minutes||50)+'"></label></article><article class="personal-focus-card"><small>One outcome</small><h2>What must be true when this block ends?</h2><textarea id="personal-focus-goal" rows="4" placeholder="Define one observable outcome…">'+esc(room.goal||'')+'</textarea><button type="button" data-personal-save>Save room</button></article><article class="personal-focus-card wide"><small>Working notes</small><h2>Keep the room quiet; capture only useful thinking.</h2><textarea id="personal-focus-notes" rows="10" placeholder="Notes, questions, formulas, links…">'+esc(room.notes||'')+'</textarea></article></div></section>';
  }
  function savePersonalRoom(extra={}){const previous=window.DafatiiData.readJSON(personalRoomKey(),{})||{};window.DafatiiData.writeJSON(personalRoomKey(),{...previous,...extra});}
  function bindPersonalRoom(){
    document.querySelector('[data-personal-save]')?.addEventListener('click',()=>{savePersonalRoom({goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});});
    document.querySelector('[data-personal-timer="reset"]')?.addEventListener('click',()=>{if(personalTimer){clearInterval(personalTimer);personalTimer=null;}const m=Number(document.getElementById('personal-focus-minutes').value)||50;document.getElementById('personal-focus-clock').textContent=String(m).padStart(2,'0')+':00';});
    document.querySelector('[data-personal-timer="start"]')?.addEventListener('click',()=>{if(personalTimer)return;let remaining=(Number(document.getElementById('personal-focus-minutes').value)||50)*60;const clock=document.getElementById('personal-focus-clock');personalTimer=setInterval(()=>{remaining--;clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');if(remaining<=0){clearInterval(personalTimer);personalTimer=null;const room=window.DafatiiData.readJSON(personalRoomKey(),{})||{};savePersonalRoom({sessions:Number(room.sessions||0)+1,goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});}},1000);});
  }

  const navSpec=[
    ['language-home','nav-home','home'],['language-letters','file','letters'],['language-voice','nav-messages','voice'],['language-grammar','star','grammar'],['language-video','play','video'],['language-examine','check','examine']
  ];
  function icon(name){return window.DafatiiIcons&&window.DafatiiIcons.icon?window.DafatiiIcons.icon(name):'<span>•</span>';}
  function languageNavLabel(item){return t(item[2]);}
  function routeTitle(page){return languageNavLabel(navSpec.find(item=>item[0]===page)||navSpec[0]);}
  function sideLanguageNav(current){return navSpec.map(item=>'<a href="#'+item[0]+'" class="quiet-link '+(current===item[0]?'selected':'')+'" '+(current===item[0]?'aria-current="page"':'')+'>'+icon(item[1])+'<span>'+esc(languageNavLabel(item))+'</span></a>').join('');}
  function bottomLanguageNav(current){return navSpec.map(item=>'<a href="#'+item[0]+'" class="bottom-nav-item language-bottom-item '+(current===item[0]?'is-active':'')+'" '+(current===item[0]?'aria-current="page"':'')+'><span class="bottom-nav-icon">'+icon(item[1])+'</span><span class="bottom-nav-label">'+esc(languageNavLabel(item))+'</span></a>').join('');}
  function currentLocation(){const learner=readLearnerState();return{level:'level-'+Math.max(1,Number(learner.currentLevel)||1),step:'step-'+Math.max(1,Number(learner.currentStep)||1),box:'box-'+Math.max(1,Number(learner.currentBox)||1)};}
  const pageKey=(page,loc=currentLocation())=>loc.level+'|'+loc.step+'|'+loc.box+'|'+page;
  function itemsFor(content,page,loc=currentLocation()){if(LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return Array.isArray(content.intermediate?.[page])?content.intermediate[page]:[];return Array.isArray(content.pages?.[pageKey(page,loc)])?content.pages[pageKey(page,loc)]:[];}
  function languageHomePage(){const learner=readLearnerState(),target=targetLanguage(),student=window.DafatiiCourses.active().membership?.role==='student',unfinished=student&&learner.entryMode&&!learner.onboardingComplete,continueRoute=unfinished?(learner.entryMode==='zero'?'language-start-zero':'language-level-test'):'language-letters',pathLabel=learner.entryMode==='zero'?'Start from zero':learner.entryMode==='test'?'Level check':'Course workspace';return '<section class="language-home-page"><header class="language-home-hero"><small>'+esc(target)+' course</small><h1>'+esc(target)+'</h1><p>A simple language course workspace. Content and progression can be built one step at a time.</p><button type="button" data-language-continue="'+esc(continueRoute)+'">'+(unfinished?'Continue setup':'Continue learning')+' <span>›</span></button></header><div class="language-home-grid"><article><small>Current position</small><strong>Level '+Math.max(1,Number(learner.currentLevel)||1)+'</strong><span>Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</span></article><article><small>Native language</small><strong>'+esc(learner.nativeLanguage||'Not selected')+'</strong><span>'+esc(pathLabel)+'</span></article><article><small>Course structure</small><strong>6 pages</strong><span>Simple editable content</span></article></div></section>';}
  function languageContentPage(page){const content=readLanguageContent(),loc=currentLocation(),items=itemsFor(content,page,loc),learner=readLearnerState();return '<section class="language-content-page" data-language-content-page="'+esc(page)+'"><header class="language-page-head"><div><small>Level '+Math.max(1,Number(learner.currentLevel)||1)+' · Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</small><h1>'+esc(routeTitle(page))+'</h1><p>'+esc(targetLanguage())+' · simple course content</p></div></header><div class="language-content-list">'+(items.length?items.map(item=>'<article class="language-content-card" data-language-item="'+esc(item.id)+'"><small>Content</small><h2>'+esc(item.title||'Untitled')+'</h2><p>'+esc(item.body||'')+'</p></article>').join(''):'<article class="language-content-card empty"><small>Content</small><h2>No content yet</h2><p>Use Content Control to add simple content.</p></article>')+'</div></section>';}
  function intermediatePage(page){const content=readLanguageContent(),items=itemsFor(content,page),learner=readLearnerState(),index=Math.max(0,Math.min(Math.max(items.length-1,0),Number(learner.intermediateIndex)||0)),item=items[index]||{id:'empty',title:'No content yet',body:'Use Content Control to add this process.'},zero=page==='language-start-zero',choices=Array.isArray(item.choices)?item.choices:[];return '<section class="language-intermediate-page" data-language-intermediate="'+esc(page)+'"><div class="language-step-progress"><span style="width:'+Math.round(((index+1)/Math.max(items.length,1))*100)+'%"></span></div><header><small>'+(zero?'Start from zero':'Level check')+' · '+(index+1)+' / '+Math.max(items.length,1)+'</small><h1>'+(zero?'Learn the letters':'Determine your starting level')+'</h1><p>'+(zero?'One letter at a time before Level 1 · Step 1.':'A simple step-by-step English check. No advanced grading rules are connected yet.')+'</p></header><article class="language-process-card"><small>'+esc(item.title||'Step')+'</small><h2>'+esc(item.title||'Step')+'</h2><p>'+esc(item.body||'')+'</p>'+(choices.length?'<div class="language-test-choices">'+choices.map((choice,i)=>'<button type="button" data-language-answer="'+i+'">'+esc(choice)+'</button>').join('')+'</div>':'')+'</article><footer><button type="button" class="btn btn-ghost" data-language-step-prev '+(index===0?'disabled':'')+'>Previous</button>'+(index<items.length-1?'<button type="button" class="btn btn-primary" data-language-step-next>Next</button>':'<button type="button" class="btn btn-primary" data-language-step-finish>'+(zero?'Start Level 1 · Step 1':'Finish level check')+'</button>')+'</footer></section>';}
  function bindLanguagePage(page){document.querySelector('[data-language-continue]')?.addEventListener('click',event=>setHash(event.currentTarget.dataset.languageContinue));if(!LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return;document.querySelector('[data-language-step-prev]')?.addEventListener('click',()=>{const state=readLearnerState();writeLearnerState({intermediateIndex:Math.max(0,(Number(state.intermediateIndex)||0)-1)});render();});const advance=()=>{const state=readLearnerState();writeLearnerState({intermediateIndex:(Number(state.intermediateIndex)||0)+1});render();};document.querySelector('[data-language-step-next]')?.addEventListener('click',advance);document.querySelectorAll('[data-language-answer]').forEach(button=>button.addEventListener('click',()=>{const state=readLearnerState(),answers={...(state.answers||{})};answers[page+':'+(Number(state.intermediateIndex)||0)]=Number(button.dataset.languageAnswer);writeLearnerState({answers,intermediateIndex:(Number(state.intermediateIndex)||0)+1});render();}));document.querySelector('[data-language-step-finish]')?.addEventListener('click',()=>{writeLearnerState({onboardingComplete:true,intermediateIndex:0,currentLevel:1,currentStep:1,currentBox:1,completedAt:Date.now()});setHash('language-letters');});}
  let languageControlHiddenFor='';
  function hideLanguageControl(page){languageControlHiddenFor=page;document.querySelector('.language-content-control-trigger')?.remove();}
  function ensureLanguageControl(page){document.querySelector('.language-content-control-trigger')?.remove();if(!isLanguage()||!canManageLanguageContent()||page==='language-home'||(!LANGUAGE_ROUTES.includes(page)&&!LANGUAGE_INTERMEDIATE_ROUTES.includes(page))||languageControlHiddenFor===page)return;const button=document.createElement('button');button.type='button';button.className='language-content-control-trigger';button.innerHTML='<strong>Content Control</strong><span>Manage this language page</span>';button.onclick=()=>openLanguageControl(page);document.body.appendChild(button);}
  function languageControlSheet(title,body){const root=document.getElementById('overlay-root');if(!root)return()=>{};root.innerHTML='<div class="entity-sheet-overlay suite-overlay language-control-overlay" id="language-control-overlay"><section class="entity-sheet suite-sheet language-control-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><small>Language content</small><h2>'+esc(title)+'</h2></div><button class="icon-btn" id="language-control-close" type="button">×</button></div>'+body+'</section></div>';const close=()=>{root.innerHTML='';};document.getElementById('language-control-close').onclick=close;document.getElementById('language-control-overlay').onclick=e=>{if(e.target.id==='language-control-overlay')close();};return close;}
  function locationOptions(content,page,selection={}){if(LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return{markup:'<div class="language-location-fixed"><strong>Intermediate process</strong><span>'+esc(page==='language-start-zero'?'Letters process':'Level test')+'</span></div>',loc:{level:'intermediate',step:'process',box:'single'},page};const levels=Array.isArray(content.levels)?content.levels:[],level=levels.find(item=>item.id===selection.level)||levels[0]||{id:'level-1',name:'Level 1',steps:[]},steps=Array.isArray(level.steps)?level.steps:[],step=steps.find(item=>item.id===selection.step)||steps[0]||{id:'step-1',name:'Step 1',boxes:[]},boxes=Array.isArray(step.boxes)?step.boxes:[],box=boxes.find(item=>item.id===selection.box)||boxes[0]||{id:'box-1',name:'Box 1'},chosenPage=LANGUAGE_ROUTES.includes(selection.page)&&selection.page!=='language-home'?selection.page:(page==='language-home'?'language-letters':page),select=(name,items,value)=>'<label><span>'+name+'</span><select data-language-location="'+name.toLowerCase()+'">'+items.map(item=>'<option value="'+esc(item.id)+'" '+(item.id===value?'selected':'')+'>'+esc(item.name)+'</option>').join('')+'</select></label>',pageSelect='<label><span>Page</span><select data-language-location="page">'+navSpec.filter(item=>item[0]!=='language-home').map(item=>'<option value="'+item[0]+'" '+(item[0]===chosenPage?'selected':'')+'>'+esc(languageNavLabel(item))+'</option>').join('')+'</select></label>';return{markup:'<div class="language-location-grid">'+select('Level',levels,level.id)+select('Step',steps,step.id)+select('Box',boxes,box.id)+pageSelect+'</div>',loc:{level:level.id,step:step.id,box:box.id},page:chosenPage};}
  function itemChoices(items){return items.length?'<div class="language-control-items">'+items.map((item,index)=>'<label><input type="radio" name="languageItem" value="'+esc(item.id)+'" '+(index===0?'checked':'')+'><span><strong>'+esc(item.title||'Untitled')+'</strong><small>'+esc(item.body||'')+'</small></span></label>').join('')+'</div>':'<p class="auth-note">No content items exist at this location.</p>';}
  function openLanguageControl(page){const close=languageControlSheet('Content Control','<div class="language-control-step"><small>Step 1 of 3</small><h3>What do you want to do?</h3><div class="language-control-actions"><button type="button" data-language-control-action="access"><strong>Access content</strong><span>Open and edit one content item</span></button><button type="button" data-language-control-action="add"><strong>Add content</strong><span>Add language content or structure</span></button><button type="button" class="danger" data-language-control-action="delete"><strong>Delete content</strong><span>Choose one item and delete it</span></button></div></div>');document.querySelectorAll('[data-language-control-action]').forEach(button=>button.onclick=()=>renderLanguageControlLocation(page,button.dataset.languageControlAction,close));}
  function renderLanguageControlLocation(page,action,close,selection={}){const content=readLanguageContent(),where=locationOptions(content,page,selection),items=itemsFor(content,where.page,where.loc),sheet=document.querySelector('.language-control-sheet');if(!sheet)return;const addTargets=action==='add'?'<div class="language-add-targets"><label><input type="radio" name="languageAddTarget" value="language" checked><span>Add language content</span></label><label><input type="radio" name="languageAddTarget" value="level"><span>Add level</span></label><label><input type="radio" name="languageAddTarget" value="step"><span>Add step of a level</span></label><label><input type="radio" name="languageAddTarget" value="box"><span>Add box of a step</span></label></div>':'';sheet.querySelector(':scope > .language-control-step')?.remove();sheet.insertAdjacentHTML('beforeend','<div class="language-control-step"><small>Step 2 of 3</small><h3>Choose the level, step, box and page</h3>'+where.markup+addTargets+(action==='access'||action==='delete'?itemChoices(items):'')+'<div class="language-control-footer"><button type="button" class="btn btn-ghost" data-language-control-back>Back</button><button type="button" class="btn btn-primary" data-language-control-next>'+(action==='add'?'Continue':'Confirm')+'</button></div><p class="auth-note" data-language-control-status></p></div>');const step=sheet.querySelector(':scope > .language-control-step');step.querySelector('[data-language-control-back]').onclick=()=>{close();openLanguageControl(page);};step.querySelectorAll('[data-language-location]').forEach(select=>select.onchange=()=>{const next={level:step.querySelector('[data-language-location="level"]')?.value,step:step.querySelector('[data-language-location="step"]')?.value,box:step.querySelector('[data-language-location="box"]')?.value,page:step.querySelector('[data-language-location="page"]')?.value};step.remove();renderLanguageControlLocation(page,action,close,next);});step.querySelector('[data-language-control-next]').onclick=()=>{const selectedId=step.querySelector('input[name="languageItem"]:checked')?.value;if(action==='access'){if(!selectedId){step.querySelector('[data-language-control-status]').textContent='Choose a content item first.';return;}close();openLanguageItemEditor(page,where.page,where.loc,selectedId);return;}if(action==='delete'){if(!selectedId){step.querySelector('[data-language-control-status]').textContent='Choose a content item first.';return;}const source=itemsFor(content,where.page,where.loc),index=source.findIndex(item=>item.id===selectedId);if(index>=0)source.splice(index,1);writeLanguageContent(content);hideLanguageControl(page);close();render();return;}const target=step.querySelector('input[name="languageAddTarget"]:checked')?.value||'language';step.remove();renderLanguageImportStep(page,where.page,where.loc,target,close);};}
  async function importLanguageFiles(files){const result=[];for(const file of [...files].slice(0,12)){const name=String(file.name||'Imported file'),lower=name.toLowerCase();if(/\.(xlsx|xls|csv)$/.test(lower)&&window.XLSX){const workbook=window.XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=window.XLSX.utils.sheet_to_json(sheet,{header:1,blankrows:false});rows.slice(0,80).forEach((row,index)=>{const values=(Array.isArray(row)?row:[row]).map(value=>String(value??'').trim()).filter(Boolean);if(values.length)result.push({id:languageUid('import'),title:values[0]||('Row '+(index+1)),body:values.slice(1).join(' · ')});});}else if(lower.endsWith('.zip')&&window.JSZip){const zip=await window.JSZip.loadAsync(await file.arrayBuffer());Object.values(zip.files).filter(entry=>!entry.dir).slice(0,80).forEach(entry=>result.push({id:languageUid('import'),title:entry.name,body:'Imported from ZIP package.'}));}else result.push({id:languageUid('import'),title:name,body:'Imported file reference.'});}return result;}
  function renderLanguageImportStep(originPage,page,loc,target,close){const sheet=document.querySelector('.language-control-sheet');if(!sheet)return;sheet.insertAdjacentHTML('beforeend','<div class="language-control-step"><small>Step 3 of 3</small><h3>Import or add simple content</h3><div class="field"><label>Title</label><input data-language-import-title maxlength="120" placeholder="Simple content title"></div><div class="field"><label>Text</label><textarea data-language-import-body rows="4" maxlength="1200" placeholder="Simple editable text"></textarea></div><div class="field"><label>Excel or ZIP files</label><input data-language-import-files type="file" accept=".xlsx,.xls,.csv,.zip" multiple></div><p class="auth-note">Excel rows become simple text items. ZIP entries become simple file-reference items.</p><div class="language-control-footer"><button type="button" class="btn btn-ghost" data-language-import-cancel>Cancel</button><button type="button" class="btn btn-primary" data-language-import-save>Add</button></div><p class="auth-note" data-language-import-status></p></div>');const step=sheet.querySelector(':scope > .language-control-step');step.querySelector('[data-language-import-cancel]').onclick=close;step.querySelector('[data-language-import-save]').onclick=async()=>{const status=step.querySelector('[data-language-import-status]'),button=step.querySelector('[data-language-import-save]');button.disabled=true;status.textContent='Adding…';try{const content=readLanguageContent();let destination={...loc};if(!LANGUAGE_INTERMEDIATE_ROUTES.includes(page)&&target!=='language'){if(target==='level'){const number=(content.levels?.length||0)+1,newLevel={id:'level-'+number,name:'Level '+number,steps:[{id:'step-1',name:'Step 1',boxes:[{id:'box-1',name:'Box 1'}]}]};content.levels.push(newLevel);destination={level:newLevel.id,step:'step-1',box:'box-1'};}else{const level=content.levels.find(item=>item.id===loc.level)||content.levels[0];if(target==='step'){const number=(level.steps?.length||0)+1,newStep={id:'step-'+number,name:'Step '+number,boxes:[{id:'box-1',name:'Box 1'}]};level.steps.push(newStep);destination={level:level.id,step:newStep.id,box:'box-1'};}if(target==='box'){const stepObj=(level.steps||[]).find(item=>item.id===loc.step)||level.steps?.[0],number=(stepObj.boxes?.length||0)+1,newBox={id:'box-'+number,name:'Box '+number};stepObj.boxes.push(newBox);destination={level:level.id,step:stepObj.id,box:newBox.id};}}}const imported=await importLanguageFiles(step.querySelector('[data-language-import-files]').files||[]),title=step.querySelector('[data-language-import-title]').value.trim(),body=step.querySelector('[data-language-import-body]').value.trim(),additions=[...imported];if(title||body)additions.unshift({id:languageUid('content'),title:title||'New content',body});if(!additions.length)additions.push({id:languageUid('content'),title:'New content',body:'Simple editable content.'});if(LANGUAGE_INTERMEDIATE_ROUTES.includes(page)){content.intermediate=content.intermediate||{};content.intermediate[page]=Array.isArray(content.intermediate[page])?content.intermediate[page]:[];content.intermediate[page].push(...additions);}else{content.pages=content.pages||{};const key=pageKey(page,destination);content.pages[key]=Array.isArray(content.pages[key])?content.pages[key]:[];content.pages[key].push(...additions);}writeLanguageContent(content);close();render();}catch(error){status.textContent=error.message;button.disabled=false;}};}
  function openLanguageItemEditor(originPage,page,loc,itemId){const content=readLanguageContent(),items=itemsFor(content,page,loc),item=items.find(entry=>entry.id===itemId);if(!item)return;const close=languageControlSheet('Access content','<form class="language-item-editor"><div class="field"><label>Title</label><input name="title" maxlength="120" value="'+esc(item.title||'')+'"></div><div class="field"><label>Text</label><textarea name="body" rows="8" maxlength="1200">'+esc(item.body||'')+'</textarea></div><button class="btn btn-primary auth-submit" type="submit">Save changes</button><p class="auth-note">Simple text only.</p></form>');document.querySelector('.language-item-editor').onsubmit=event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));item.title=String(data.title||'').trim()||'Untitled';item.body=String(data.body||'').trim();writeLanguageContent(content);hideLanguageControl(originPage);close();render();};}
  function installWorkspaceRoutes(){const previousContent=workspaceContent;workspaceContent=function(page,parts,title){if(isLanguage()&&page==='language-home')return languageHomePage();if(isLanguage()&&LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return intermediatePage(page);if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return languageContentPage(page);if(courseType()==='personal'&&page==='study-rooms')return personalRoomPage();return previousContent(page,parts,title);};const previousWorkspace=workspace;workspace=function(current){const type=courseType(),page=String(current||'').split('/')[0];if(type==='language'&&window.DafatiiCourses.active().id){purgeLegacyLanguageBrowserState();if(!LANGUAGE_ROUTES.includes(page)&&!LANGUAGE_INTERMEDIATE_ROUTES.includes(page)&&!['change-course','profile','settings','representer','admin'].includes(page)){setHash('language-home');return;}}if(type==='personal'&&page==='chat'){setHash('study-rooms');return;}previousWorkspace(current);adaptNavigation();if(type==='personal'&&page==='study-rooms')bindPersonalRoom();if(type==='language'){bindLanguagePage(page);ensureLanguageControl(page);}};}
  function adaptNavigation(){const type=courseType(),current=(location.hash||'#language-home').replace(/^#\/?/,'').split('/')[0];if(type==='personal'){document.querySelectorAll('a[href^="#chat"],[data-page="chat"],[data-bottom-nav-item="chat"]').forEach(node=>node.remove());if(current==='study-rooms')document.querySelector('.quiet-workspace>.sub-nav')?.remove();return;}if(type!=='language')return;document.querySelector('.quiet-workspace>.sub-nav')?.remove();document.querySelector('.quiet-return-button')?.remove();const shell=document.querySelector('.quiet-workspace');if(shell){shell.classList.add('language-course-shell');shell.classList.toggle('language-intermediate-shell',LANGUAGE_INTERMEDIATE_ROUTES.includes(current));shell.dataset.languagePage=current.replace(/^language-/,'')||'home';}const toolbarTitle=document.querySelector('.quiet-toolbar-title strong'),toolbarKicker=document.querySelector('.quiet-toolbar-title small');if(LANGUAGE_INTERMEDIATE_ROUTES.includes(current)){if(toolbarTitle)toolbarTitle.textContent=current==='language-start-zero'?'Learn the letters':'Level check';if(toolbarKicker)toolbarKicker.textContent=targetLanguage()+' setup';return;}const activeNav=navSpec.find(item=>item[0]===current)||navSpec[0];if(toolbarTitle)toolbarTitle.textContent=languageNavLabel(activeNav);if(toolbarKicker)toolbarKicker.textContent=targetLanguage()+' course';const side=document.querySelector('.quiet-sidebar > nav'),desktop=document.querySelector('.quiet-desktop-tabs'),bottom=document.querySelector('.bottom-nav');if(side)side.innerHTML=sideLanguageNav(current);if(desktop)desktop.innerHTML=sideLanguageNav(current);if(bottom)bottom.innerHTML=bottomLanguageNav(current);}
  function routeAfterCourseSwitch(){if(courseType()!=='language')return'dashboard/overview';const learner=readLearnerState(),student=window.DafatiiCourses.active().membership?.role==='student';if(student&&learner.entryMode&&!learner.onboardingComplete)return learner.entryMode==='zero'?'language-start-zero':'language-level-test';return'language-home';}
  function installCourseChangeRouting(){window.addEventListener('dafatii:coursechanged',()=>{const current=(location.hash||'').replace(/^#\/?/,'').split('/')[0];if(current!=='change-course')return;setTimeout(()=>setHash(routeAfterCourseSwitch()),0);});}
  function installLanguageControlReset(){window.addEventListener('hashchange',()=>{languageControlHiddenFor='';});}
  wrapCourseCreation();installCreateInterceptor();installLanguageEnrollInterceptor();installWorkspaceRoutes();installCourseChangeRouting();installLanguageControlReset();window.DafatiiCourseModes=Object.freeze({courseType,isLanguage,targetLanguage,openTypeChooser,openLanguageEnrollment,languageRoutes:[...LANGUAGE_ROUTES],languageIntermediateRoutes:[...LANGUAGE_INTERMEDIATE_ROUTES],languageChoices:LANGUAGE_CHOICES.map(item=>item[0])});
})();
