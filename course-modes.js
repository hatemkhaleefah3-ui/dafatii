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
  const LANGUAGE_PAGE_ITEM_TYPES=Object.freeze({
    'language-letters':[
      {id:'vocabulary',label:'Vocabulary'},
      {id:'sentence-vocabulary',label:'Sentence vocabulary'},
      {id:'image-vocabulary',label:'Image vocabulary'}
    ],
    'language-voice':[
      {id:'hearing-word',label:'Hearing · word'},
      {id:'hearing-sentence',label:'Hearing · sentence'}
    ],
    'language-grammar':[
      {id:'grammar-law',label:'Grammar / rule'},
      {id:'grammar-note',label:'Note'},
      {id:'grammar-example',label:'Example'},
      {id:'grammar-training',label:'Training'}
    ],
    'language-examine':[
      {id:'exam-single-choice',label:'Single choice'},
      {id:'exam-multiple-choice',label:'Multiple choice'},
      {id:'exam-true-false',label:'True / false'},
      {id:'exam-fill-blank',label:'Fill in the blank'},
      {id:'exam-short-answer',label:'Short answer'}
    ]
  });
  const LANGUAGE_SPEECH_LOCALES=Object.freeze({
    English:'en-US',Arabic:'ar-SA',Spanish:'es-ES',French:'fr-FR',German:'de-DE',Turkish:'tr-TR',
    Persian:'fa-IR',Kurdish:'ku',Italian:'it-IT',Portuguese:'pt-PT',Russian:'ru-RU',Chinese:'zh-CN',
    Japanese:'ja-JP',Korean:'ko-KR',Hindi:'hi-IN',Urdu:'ur-PK'
  });
  function pageItemTypes(page){return LANGUAGE_PAGE_ITEM_TYPES[page]||[];}
  function pageItemType(page,type){return pageItemTypes(page).find(item=>item.id===type)||pageItemTypes(page)[0]||null;}
  function itemTypeLabel(page,type){return pageItemType(page,type)?.label||'Content';}
  function defaultLanguageContent(selectedLanguage=targetLanguage()){
    const target=normalizeTargetLanguage(selectedLanguage)||'Language',pages={},loc='level-1|step-1|box-1|';
    pages[loc+'language-letters']=[
      {id:'seed-vocab-1',type:'vocabulary',word:'New word',meaningEnglish:'Meaning in English',meaningArabic:'المعنى بالعربية'},
      {id:'seed-vocab-2',type:'sentence-vocabulary',word:'New word',sentence:'Use the new word in a sentence.',meaningEnglish:'Meaning in English',meaningArabic:'المعنى بالعربية'},
      {id:'seed-vocab-3',type:'image-vocabulary',word:'Image word',imageUrl:''}
    ];
    pages[loc+'language-voice']=[
      {id:'seed-voice-1',type:'hearing-word',text:'New word',instruction:'Listen to the pronunciation, then repeat it.'},
      {id:'seed-voice-2',type:'hearing-sentence',text:'This is a practice sentence.',instruction:'Listen to the whole sentence and notice its rhythm.'}
    ];
    pages[loc+'language-grammar']=[
      {id:'seed-grammar-law',type:'grammar-law',title:'Main grammar / rule',body:'Write the law of this grammar lesson here.'},
      {id:'seed-grammar-note',type:'grammar-note',title:'Important note',body:'Add a short note that helps the learner understand the rule.'},
      {id:'seed-grammar-example',type:'grammar-example',title:'Example',body:'Add a clear example that demonstrates the rule.'},
      {id:'seed-grammar-training',type:'grammar-training',title:'Training',body:'Add a short practice prompt for this rule.',answer:'Model answer'}
    ];
    pages[loc+'language-examine']=[
      {id:'seed-exam-1',type:'exam-single-choice',question:'Choose the correct sentence.',choices:['I am ready.','I ready am.','I am readying.'],answer:'I am ready.'},
      {id:'seed-exam-2',type:'exam-multiple-choice',question:'Choose all correct sentences.',choices:['We are here.','She are here.','They are ready.','I are ready.'],answers:['We are here.','They are ready.']},
      {id:'seed-exam-3',type:'exam-true-false',question:'“He is a student.” is grammatically correct.',answer:'True'},
      {id:'seed-exam-4',type:'exam-fill-blank',question:'I ___ English every day.',answer:'study'},
      {id:'seed-exam-5',type:'exam-short-answer',question:'Write one short sentence about your day.',answer:'I study every day.'}
    ];
    pages[loc+'language-video']=[];
    return {version:4,targetLanguage:target,levels:[{id:'level-1',name:'Level 1',steps:[{id:'step-1',name:'Step 1',boxes:[{id:'box-1',name:'Box 1'}]}]}],pages,video:{[loc+'language-video']:{title:'Watch and understand',prompt:'Write what you understood from this video in your own words.',url:''}},intermediate:{
      'language-start-zero':[{id:'seed-letter-a',title:'A a',body:'A is the first starter letter.'},{id:'seed-letter-b',title:'B b',body:'B is the next starter letter.'},{id:'seed-letter-c',title:'C c',body:'C is a simple practice letter.'},{id:'seed-letter-d',title:'D d',body:'D completes this starter sample.'}],
      'language-level-test':[{id:'seed-test-1',title:'Question 1',body:'Choose the sentence that looks correct.',choices:['I am a student.','I student am.','I am student a.']},{id:'seed-test-2',title:'Question 2',body:'Choose the best word: I ___ English every day.',choices:['study','studies','studying am']},{id:'seed-test-3',title:'Question 3',body:'Choose the clearest sentence.',choices:['She went home yesterday.','She go home yesterday.','Yesterday she home go.']},{id:'seed-test-4',title:'Question 4',body:'Choose the best completion: If I have time, I ___ read.',choices:['will','am','was']}]
    }};
  }
  function normalizeLanguagePageItem(item,page,index){
    const source=item&&typeof item==='object'?item:{},id=String(source.id||languageUid('content'));
    if(page==='language-letters'){
      const type=pageItemType(page,source.type)?.id||'vocabulary';
      if(type==='sentence-vocabulary')return{id,type,word:String(source.word||source.title||'Word'),sentence:String(source.sentence||source.body||''),meaningEnglish:String(source.meaningEnglish||source.meaning||''),meaningArabic:String(source.meaningArabic||'')};
      if(type==='image-vocabulary')return{id,type,word:String(source.word||source.title||'Word'),imageUrl:directImageUrl(source.imageUrl)};
      return{id,type:'vocabulary',word:String(source.word||source.title||'Word'),meaningEnglish:String(source.meaningEnglish||source.meaning||source.body||''),meaningArabic:String(source.meaningArabic||'')};
    }
    if(page==='language-voice'){
      const type=pageItemType(page,source.type)?.id||'hearing-word';
      return{id,type,text:String(source.text||source.title||'Practice'),instruction:String(source.instruction||source.body||''),voiceFileName:type.startsWith('hearing-')?String(source.voiceFileName||''):'',voiceFileId:type.startsWith('hearing-')?String(source.voiceFileId||''):'',voiceContentType:type.startsWith('hearing-')?String(source.voiceContentType||''):''};
    }
    if(page==='language-grammar'){
      const type=pageItemType(page,source.type)?.id||(index===0?'grammar-law':'grammar-note');
      return{id,type,title:String(source.title||itemTypeLabel(page,type)),body:String(source.body||''),answer:type==='grammar-training'?String(source.answer||''):''};
    }
    if(page==='language-examine'){
      const type=pageItemType(page,source.type)?.id||'exam-single-choice',choices=Array.isArray(source.choices)?source.choices.map(String):[];
      return{id,type,question:String(source.question||source.title||source.body||'Question'),choices,answer:String(source.answer||''),answers:Array.isArray(source.answers)?source.answers.map(String):String(source.answers||'').split('|').map(value=>value.trim()).filter(Boolean)};
    }
    return{id,title:String(source.title||'Untitled'),body:String(source.body||''),...(page==='language-level-test'?{choices:Array.isArray(source.choices)?source.choices.map(String):[]}:{})};
  }
  function normalizeLanguageContent(value){
    const content=value&&typeof value==='object'&&!Array.isArray(value)?value:defaultLanguageContent();
    content.version=4;content.pages=content.pages&&typeof content.pages==='object'?content.pages:{};content.video=content.video&&typeof content.video==='object'?content.video:{};
    Object.keys(content.pages).forEach(key=>{
      const page=key.split('|').pop();
      if(page==='language-video'){content.pages[key]=[];if(!content.video[key])content.video[key]={title:'Watch and understand',prompt:'Write what you understood from this video in your own words.',url:''};return;}
      const items=Array.isArray(content.pages[key])?content.pages[key]:[],supported=page==='language-voice'?items.filter(item=>!['speaking-word','speaking-sentence'].includes(item?.type)):items;
      content.pages[key]=supported.map((item,index)=>normalizeLanguagePageItem(item,page,index));
    });
    return content;
  }
  function readLanguageContent(){const value=window.DafatiiCourses.readJSON(LANGUAGE_CONTENT_KEY,null);return normalizeLanguageContent(value);}
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
      ['language','Aa','Create Language course','Choose a language, then create an interactive six-page language course.','إنشاء دورة لغة','اختر لغة ثم أنشئ دورة لغة تفاعلية من ست صفحات.']
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
    const close=sheet(arabic?'إنشاء دورة لغة':'Create Language course','<form id="course-mode-form" class="language-course-create"><input type="hidden" name="courseType" value="language"><input type="hidden" name="targetLanguage" value=""><input type="hidden" name="name" value=""><input type="hidden" name="templateName" value="Computer Science"><input type="hidden" name="studyType" value="courses"><input type="hidden" name="institution" value=""><input type="hidden" name="stage" value="university"><input type="hidden" name="pricing" value="free"><input type="hidden" name="priceMinor" value="0"><input type="hidden" name="visibility" value="public"><input type="hidden" name="joinPolicy" value="direct"><input type="hidden" name="learningField" value="Languages"><input type="hidden" name="difficultyLevel" value="beginner"><div class="language-create-intro"><small>'+(arabic?'دورة لغة':'Language course')+'</small><h3>'+(arabic?'اختر اللغة':'Select a language')+'</h3><p>'+(arabic?'اختر لغة واحدة. تبدأ الدورة بعناصر تعلم تفاعلية وصفحة يوتيوب قابلة للتعديل.':'Choose one language. The course starts with vocabulary, voice, grammar, examination, and a configurable YouTube page.')+'</p></div><div class="language-picker" role="radiogroup" aria-label="'+(arabic?'لغة الدورة':'Course language')+'">'+choices+'</div><button class="btn btn-primary auth-submit language-create-submit" id="language-course-create" type="submit" disabled>'+(arabic?'إنشاء الدورة':'Create course')+'</button><p class="auth-note" id="course-mode-status">'+(arabic?'اختر لغة للمتابعة.':'Select a language to continue.')+'</p></form>');
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
  function nativeLanguage(){return readLearnerState().nativeLanguage==='Arabic'?'Arabic':'English';}
  function nativeMeaning(item){const native=nativeLanguage();return native==='Arabic'?(item.meaningArabic||item.meaningEnglish||''):(item.meaningEnglish||item.meaningArabic||'');}
  function directImageUrl(value){const raw=String(value||'').trim();if(!raw)return'';try{const parsed=new URL(raw);return ['https:','http:'].includes(parsed.protocol)?parsed.href:'';}catch{return'';}}
  function languageHomePage(){const learner=readLearnerState(),target=targetLanguage(),student=window.DafatiiCourses.active().membership?.role==='student',unfinished=student&&learner.entryMode&&!learner.onboardingComplete,continueRoute=unfinished?(learner.entryMode==='zero'?'language-start-zero':'language-level-test'):'language-letters',pathLabel=learner.entryMode==='zero'?'Start from zero':learner.entryMode==='test'?'Level check':'Course workspace';return '<section class="language-home-page"><header class="language-home-hero"><small>'+esc(target)+' course</small><h1>'+esc(target)+'</h1><p>Build vocabulary, listening, speaking and grammar through focused learning experiences.</p><button type="button" data-language-continue="'+esc(continueRoute)+'">'+(unfinished?'Continue setup':'Continue learning')+' <span>›</span></button></header><div class="language-home-grid"><article><small>Current position</small><strong>Level '+Math.max(1,Number(learner.currentLevel)||1)+'</strong><span>Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</span></article><article><small>Native language</small><strong>'+esc(learner.nativeLanguage||'Not selected')+'</strong><span>'+esc(pathLabel)+'</span></article><article><small>Learning format</small><strong>Focused practice</strong><span>Vocabulary and voice item-by-item · grammar as one connected lesson</span></article></div></section>';}
  function languagePageIndex(page,loc,items){const learner=readLearnerState(),indexes=learner.pageIndexes&&typeof learner.pageIndexes==='object'?learner.pageIndexes:{},key=pageKey(page,loc),value=Math.max(0,Number(indexes[key])||0);return Math.min(value,Math.max(items.length-1,0));}
  function setLanguagePageIndex(page,loc,index){const learner=readLearnerState(),indexes={...(learner.pageIndexes||{})};indexes[pageKey(page,loc)]=Math.max(0,Number(index)||0);writeLearnerState({pageIndexes:indexes});}
  function renderVocabularyItem(item,index){
    const type=pageItemType('language-letters',item.type)?.id||'vocabulary',meaning=nativeMeaning(item),native=nativeLanguage(),word=String(item.word||'Word'),number=String(index+1).padStart(2,'0');
    if(type==='image-vocabulary'){
      const src=directImageUrl(item.imageUrl),image=src?'<img data-language-direct-image src="'+esc(src)+'" alt="'+esc(word)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"><div class="vocab-image-error" data-language-image-fallback hidden><span>◫</span><strong>Image unavailable</strong><small>Check the direct image URL in Content Control.</small></div>':'<div class="vocab-image-empty"><span>◫</span><strong>No image link yet</strong><small>Add a direct image URL from Content Control.</small></div>';
      return '<article class="language-learning-card vocab-card image-vocab-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Image vocabulary</span><b>'+number+'</b></div><figure class="vocab-image-frame">'+image+'</figure><div class="vocab-word-row"><div><small>Visual vocabulary</small><h2 class="language-auto-text" dir="auto">'+esc(word)+'</h2></div><span>See · connect · remember</span></div></article>';
    }
    if(type==='sentence-vocabulary')return '<article class="language-learning-card vocab-card sentence-vocab-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Sentence vocabulary</span><b>'+number+'</b></div><div class="vocab-word-chip language-auto-text" dir="auto">'+esc(word)+'</div><blockquote class="language-auto-text" dir="auto">'+esc(item.sentence||'Add a sentence for this word.')+'</blockquote><div class="vocab-meaning-panel" dir="'+(native==='Arabic'?'rtl':'ltr')+'"><small>'+esc(native)+' meaning</small><strong>'+esc(meaning||'Meaning not added yet')+'</strong></div></article>';
    return '<article class="language-learning-card vocab-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Vocabulary</span><b>'+number+'</b></div><div class="vocab-focus-label">Focus word</div><div class="vocab-main-word language-auto-text" dir="auto">'+esc(word)+'</div><div class="vocab-meaning-panel" dir="'+(native==='Arabic'?'rtl':'ltr')+'"><small>'+esc(native)+' meaning</small><strong>'+esc(meaning||'Meaning not added yet')+'</strong></div><div class="vocab-native-badge">'+(native==='Arabic'?'العربية':'English')+'</div></article>';
  }
  function renderVoiceItem(item,index){
    const type=pageItemType('language-voice',item.type)?.id||'hearing-word',sentence=type==='hearing-sentence',label='Hearing · '+(sentence?'sentence':'word'),text=String(item.text||'Practice'),voiceId=String(item.voiceFileId||''),number=String(index+1).padStart(2,'0');
    const hear='<button type="button" class="voice-action hear-action" data-language-speak="'+esc(text)+'" data-language-voice-file-id="'+esc(voiceId)+'"><span class="voice-action-icon" aria-hidden="true">▶</span><span><strong>Hear pronunciation</strong><small>'+(voiceId?'Play the imported voice file':'Use '+esc(targetLanguage())+' pronunciation')+'</small></span></button>';
    const mic='<button type="button" class="voice-action mic-action" data-language-record><span class="voice-action-icon mic-icon" aria-hidden="true">●</span><span><strong>Open microphone</strong><small>Practice, record, and listen back</small></span></button>';
    return '<article class="language-learning-card voice-card hearing-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'"><div class="language-item-kicker"><span>'+esc(label)+'</span><b>'+number+'</b></div><div class="voice-listen-stage"><div class="voice-waveform" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="'+(sentence?'voice-sentence':'voice-word')+' language-auto-text" dir="auto">'+esc(text)+'</div><p class="voice-instruction language-auto-text" dir="auto">'+esc(item.instruction||'Listen carefully, then repeat when you are ready.')+'</p></div><div class="voice-practice-actions">'+hear+mic+'</div><div class="voice-record-status" data-language-speech-status></div><div class="voice-record-status" data-language-record-status>Microphone opens only after you press Open microphone.</div><audio class="voice-playback" data-language-record-playback controls hidden></audio></article>';
  }
  function renderExamItem(item,index){
    const type=pageItemType('language-examine',item.type)?.id||'exam-single-choice',number=String(index+1).padStart(2,'0'),question=esc(item.question||'Question'),choices=Array.isArray(item.choices)?item.choices:[];
    if(type==='exam-multiple-choice')return '<article class="language-learning-card exam-card exam-multiple-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Multiple choice</span><b>'+number+'</b></div><div class="exam-question-label">Select every correct answer</div><h2 class="language-auto-text" dir="auto">'+question+'</h2><div class="exam-multiple-grid">'+choices.map(choice=>'<label><input type="checkbox" value="'+esc(choice)+'" data-exam-multiple-option><span class="language-auto-text" dir="auto">'+esc(choice)+'</span></label>').join('')+'</div><button type="button" class="exam-submit" data-exam-multiple-check="'+esc((item.answers||[]).join('|'))+'">Check selected answers</button><div class="exam-feedback" aria-live="polite"></div></article>';
    if(type==='exam-true-false')return '<article class="language-learning-card exam-card exam-truefalse-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>True / false</span><b>'+number+'</b></div><div class="exam-statement-mark">?</div><h2 class="language-auto-text" dir="auto">'+question+'</h2><div class="exam-truefalse-actions"><button type="button" data-exam-choice="True" data-exam-answer="'+esc(item.answer||'True')+'">True</button><button type="button" data-exam-choice="False" data-exam-answer="'+esc(item.answer||'True')+'">False</button></div><div class="exam-feedback" aria-live="polite"></div></article>';
    if(type==='exam-fill-blank')return '<article class="language-learning-card exam-card exam-fill-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Fill in the blank</span><b>'+number+'</b></div><div class="exam-fill-line"></div><h2 class="language-auto-text" dir="auto">'+question+'</h2><div class="exam-text-answer"><input type="text" dir="auto" data-exam-text-input placeholder="Type the missing answer…"><button type="button" data-exam-text-check="'+esc(item.answer||'')+'">Check</button></div><div class="exam-feedback" aria-live="polite"></div></article>';
    if(type==='exam-short-answer')return '<article class="language-learning-card exam-card exam-short-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Short answer</span><b>'+number+'</b></div><div class="exam-question-label">Respond in your own words</div><h2 class="language-auto-text" dir="auto">'+question+'</h2><textarea rows="6" dir="auto" class="exam-short-textarea" data-exam-short-input placeholder="Write your answer in your own words…"></textarea><div class="exam-short-actions"><button type="button" data-exam-short-review="'+esc(item.answer||'')+'">Review answer</button></div><div class="exam-model-answer" hidden><small>Model answer</small><strong class="language-auto-text" dir="auto">'+esc(item.answer||'No model answer has been added.')+'</strong></div><div class="exam-feedback" aria-live="polite"></div></article>';
    return '<article class="language-learning-card exam-card exam-single-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Single choice</span><b>'+number+'</b></div><div class="exam-question-label">Choose one answer</div><h2 class="language-auto-text" dir="auto">'+question+'</h2><div class="exam-choice-stack">'+choices.map((choice,choiceIndex)=>'<button type="button" data-exam-choice="'+esc(choice)+'" data-exam-answer="'+esc(item.answer||'')+'"><span>'+String.fromCharCode(65+choiceIndex)+'</span><strong class="language-auto-text" dir="auto">'+esc(choice)+'</strong></button>').join('')+'</div><div class="exam-feedback" aria-live="polite"></div></article>';
  }
  function renderGenericLanguageItem(item,index){return '<article class="language-learning-card generic-language-card premium-language-item" data-language-item="'+esc(item.id)+'"><div class="language-item-kicker"><span>Content</span><b>'+String(index+1).padStart(2,'0')+'</b></div><h2 class="language-auto-text" dir="auto">'+esc(item.title||'Untitled')+'</h2><p class="language-item-prompt language-auto-text" dir="auto">'+esc(item.body||'')+'</p></article>';}
  function grammarItemMarkup(item,index){
    const type=pageItemType('language-grammar',item.type)?.id||'grammar-note',number=String(index+1).padStart(2,'0');
    if(type==='grammar-law')return '<article class="grammar-law-card premium-language-item" id="language-item-'+esc(item.id)+'" data-language-item="'+esc(item.id)+'"><div class="grammar-law-badge">LAW</div><small>Grammar / rule · '+number+'</small><h2 class="language-auto-text" dir="auto">'+esc(item.title||'Grammar / rule')+'</h2><p class="language-auto-text" dir="auto">'+esc(item.body||'')+'</p></article>';
    if(type==='grammar-example')return '<article class="grammar-thread-card grammar-example-card premium-language-item" id="language-item-'+esc(item.id)+'" data-language-item="'+esc(item.id)+'"><div class="grammar-thread-icon">EX</div><div><small>Example · '+number+'</small><h3 class="language-auto-text" dir="auto">'+esc(item.title||'Example')+'</h3><p class="language-auto-text" dir="auto">'+esc(item.body||'')+'</p></div></article>';
    if(type==='grammar-training')return '<article class="grammar-thread-card grammar-training-card premium-language-item" id="language-item-'+esc(item.id)+'" data-language-item="'+esc(item.id)+'"><div class="grammar-thread-icon">TR</div><div><small>Training · '+number+'</small><h3 class="language-auto-text" dir="auto">'+esc(item.title||'Training')+'</h3><p class="language-auto-text" dir="auto">'+esc(item.body||'')+'</p><div class="grammar-training-response"><input type="text" dir="auto" data-grammar-training-input placeholder="Write your answer…"><button type="button" data-grammar-training-check="'+esc(item.answer||'')+'">Check</button></div><div class="grammar-training-feedback" aria-live="polite"></div></div></article>';
    return '<article class="grammar-thread-card grammar-note-card premium-language-item" id="language-item-'+esc(item.id)+'" data-language-item="'+esc(item.id)+'"><div class="grammar-thread-icon">NT</div><div><small>Note · '+number+'</small><h3 class="language-auto-text" dir="auto">'+esc(item.title||'Note')+'</h3><p class="language-auto-text" dir="auto">'+esc(item.body||'')+'</p></div></article>';
  }
  function languageGrammarPage(){
    const content=readLanguageContent(),loc=currentLocation(),items=itemsFor(content,'language-grammar',loc),learner=readLearnerState(),laws=items.filter(item=>item.type==='grammar-law'),support=items.filter(item=>item.type!=='grammar-law');
    return '<section class="language-content-page grammar-lesson-page" data-language-content-page="language-grammar"><header class="language-page-head"><div><small>Level '+Math.max(1,Number(learner.currentLevel)||1)+' · Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</small><h1>'+esc(routeTitle('language-grammar'))+'</h1><p>'+esc(targetLanguage())+' · one connected rule, notes, examples and training</p></div></header><div class="grammar-lesson-shell"><section class="grammar-law-stack">'+(laws.length?laws.map((item,index)=>grammarItemMarkup(item,index)).join(''):'<article class="grammar-law-card empty"><div class="grammar-law-badge">LAW</div><small>Grammar / rule</small><h2>No rule yet</h2><p>Add the grammar or rule from Content Control.</p></article>')+'</section><div class="grammar-connection"><span></span><strong>Understand the law, then follow the supporting content</strong><span></span></div><section class="grammar-thread">'+(support.length?support.map((item,index)=>grammarItemMarkup(item,laws.length+index)).join(''):'<article class="grammar-thread-card grammar-note-card empty"><div class="grammar-thread-icon">+</div><div><small>Lesson content</small><h3>No supporting content yet</h3><p>Add notes, examples, and training items.</p></div></article>')+'</section></div></section>';
  }
  function youtubeVideoId(url){const raw=String(url||'').trim();if(!raw)return'';try{const parsed=new URL(raw);if(parsed.hostname.includes('youtu.be'))return parsed.pathname.split('/').filter(Boolean)[0]||'';if(parsed.searchParams.get('v'))return parsed.searchParams.get('v');const parts=parsed.pathname.split('/').filter(Boolean),marker=parts.findIndex(part=>['embed','shorts','live'].includes(part));return marker>=0?parts[marker+1]||'':'';}catch{return'';}}
  function languageVideoConfig(content,loc=currentLocation()){const key=pageKey('language-video',loc);content.video=content.video&&typeof content.video==='object'?content.video:{};return content.video[key]||{title:'Watch and understand',prompt:'Write what you understood from this video in your own words.',url:''};}
  function languageVideoNoteKey(loc=currentLocation()){return'dafatii:language-video-note:'+String(window.DafatiiCourses.active().id||'none')+':'+pageKey('language-video',loc);}
  function languageVideoPage(){
    const content=readLanguageContent(),loc=currentLocation(),learner=readLearnerState(),config=languageVideoConfig(content,loc),id=youtubeVideoId(config.url),note=(()=>{try{return localStorage.getItem(languageVideoNoteKey(loc))||'';}catch{return'';}})();
    const player=id?'<iframe src="https://www.youtube-nocookie.com/embed/'+esc(id)+'" title="'+esc(config.title||'Language video')+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>':'<div class="language-video-placeholder"><div class="language-youtube-mark">▶</div><strong>YouTube video</strong><span>Set the YouTube link from Content Control.</span></div>';
    return '<section class="language-content-page language-video-page" data-language-content-page="language-video"><header class="language-page-head"><div><small>Level '+Math.max(1,Number(learner.currentLevel)||1)+' · Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</small><h1 class="language-auto-text" dir="auto">'+esc(config.title||routeTitle('language-video'))+'</h1><p>'+esc(targetLanguage())+' · watch, understand, explain</p></div></header><div class="language-video-player">'+player+'</div><article class="language-video-notes"><div class="video-note-intro"><div class="video-note-icon">✎</div><div><small>Your understanding</small><h2>Capture what you learned</h2><p class="language-auto-text" dir="auto">'+esc(config.prompt||'Write the main ideas in your own words.')+'</p></div></div><div class="video-note-editor"><div class="video-note-editor-head"><span>Learning note</span><small><b data-language-video-word-count>0</b> words</small></div><textarea rows="10" dir="auto" data-language-video-note placeholder="Write the key ideas, vocabulary, examples, or questions you understood from the video…">'+esc(note)+'</textarea><div class="video-note-editor-foot"><span data-language-video-note-status>Private to this browser</span><button type="button" data-language-video-note-save><span>Save note</span><b>⌘S</b></button></div></div></article></section>';
  }
  function languageContentPage(page){
    if(page==='language-video')return languageVideoPage();
    if(page==='language-grammar')return languageGrammarPage();
    const content=readLanguageContent(),loc=currentLocation(),items=itemsFor(content,page,loc),learner=readLearnerState(),index=languagePageIndex(page,loc,items),item=items[index],markup=item?(page==='language-letters'?renderVocabularyItem(item,index):page==='language-voice'?renderVoiceItem(item,index):page==='language-examine'?renderExamItem(item,index):renderGenericLanguageItem(item,index)):'<article class="language-learning-card empty"><div class="language-item-kicker"><span>Content</span><b>00</b></div><h2>No content yet</h2><p class="language-item-prompt">Use Content Control to add a content item.</p></article>';
    return '<section class="language-content-page language-item-process" data-language-content-page="'+esc(page)+'"><header class="language-page-head"><div><small>Level '+Math.max(1,Number(learner.currentLevel)||1)+' · Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</small><h1>'+esc(routeTitle(page))+'</h1><p>'+esc(targetLanguage())+' · item '+(items.length?index+1:0)+' of '+items.length+'</p></div></header><div class="language-step-progress"><span style="width:'+Math.round(((index+1)/Math.max(items.length,1))*100)+'%"></span></div>'+markup+'<footer class="language-item-navigation"><button type="button" class="btn btn-ghost" data-language-item-prev '+(index===0?'disabled':'')+'>Previous</button><span>'+(items.length?index+1:0)+' / '+items.length+'</span><button type="button" class="btn btn-primary" data-language-item-next '+(!items.length||index>=items.length-1?'disabled':'')+'>Next</button></footer></section>';
  }
  function intermediatePage(page){const content=readLanguageContent(),items=itemsFor(content,page),learner=readLearnerState(),index=Math.max(0,Math.min(Math.max(items.length-1,0),Number(learner.intermediateIndex)||0)),item=items[index]||{id:'empty',title:'No content yet',body:'Use Content Control to add this process.'},zero=page==='language-start-zero',choices=Array.isArray(item.choices)?item.choices:[];return '<section class="language-intermediate-page" data-language-intermediate="'+esc(page)+'"><div class="language-step-progress"><span style="width:'+Math.round(((index+1)/Math.max(items.length,1))*100)+'%"></span></div><header><small>'+(zero?'Start from zero':'Level check')+' · '+(index+1)+' / '+Math.max(items.length,1)+'</small><h1>'+(zero?'Learn the letters':'Determine your starting level')+'</h1><p>'+(zero?'One letter at a time before Level 1 · Step 1.':'A simple step-by-step English check. No advanced grading rules are connected yet.')+'</p></header><article class="language-process-card"><small>'+esc(item.title||'Step')+'</small><h2>'+esc(item.title||'Step')+'</h2><p>'+esc(item.body||'')+'</p>'+(choices.length?'<div class="language-test-choices">'+choices.map((choice,i)=>'<button type="button" data-language-answer="'+i+'">'+esc(choice)+'</button>').join('')+'</div>':'')+'</article><footer><button type="button" class="btn btn-ghost" data-language-step-prev '+(index===0?'disabled':'')+'>Previous</button>'+(index<items.length-1?'<button type="button" class="btn btn-primary" data-language-step-next>Next</button>':'<button type="button" class="btn btn-primary" data-language-step-finish>'+(zero?'Start Level 1 · Step 1':'Finish level check')+'</button>')+'</footer></section>';}
  let activeLanguageRecorder=null,activeLanguageStream=null,activeLanguageRecordingUrl='',activeLanguageHearingAudio=null;
  function stopLanguageRecorder(){try{if(activeLanguageRecorder&&activeLanguageRecorder.state!=='inactive')activeLanguageRecorder.stop();}catch{}try{activeLanguageStream?.getTracks?.().forEach(track=>track.stop());}catch{}activeLanguageRecorder=null;activeLanguageStream=null;}
  function stopLanguageHearingAudio(){try{activeLanguageHearingAudio?.pause?.();if(activeLanguageHearingAudio)activeLanguageHearingAudio.src='';}catch{}activeLanguageHearingAudio=null;}
  function playLanguageSpeech(text,status){
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){if(status)status.textContent='Speech playback is not supported by this browser.';return;}
    window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text||''));utterance.lang=LANGUAGE_SPEECH_LOCALES[targetLanguage()]||'en-US';utterance.rate=.86;const voices=window.speechSynthesis.getVoices(),base=utterance.lang.split('-')[0].toLowerCase(),voice=voices.find(item=>String(item.lang||'').toLowerCase().startsWith(base));if(voice)utterance.voice=voice;utterance.onstart=()=>{if(status)status.textContent='Playing pronunciation…';};utterance.onend=()=>{if(status)status.textContent='Listen again whenever you need.';};utterance.onerror=()=>{if(status)status.textContent='Pronunciation playback could not start.';};window.speechSynthesis.speak(utterance);
  }
  async function playLanguageHearing(button){
    const status=button.closest('.voice-card')?.querySelector('[data-language-speech-status]'),fileId=String(button.dataset.languageVoiceFileId||''),text=String(button.dataset.languageSpeak||'');
    stopLanguageHearingAudio();window.speechSynthesis?.cancel?.();
    if(!fileId){playLanguageSpeech(text,status);return;}
    if(!window.DafatiiFiles?.getViewUrl){if(status)status.textContent='Imported voice playback is not available in this browser session.';return;}
    try{
      if(status)status.textContent='Loading imported voice…';
      const url=await window.DafatiiFiles.getViewUrl(fileId),audio=new Audio(url);activeLanguageHearingAudio=audio;audio.preload='auto';
      audio.onplay=()=>{if(status)status.textContent='Playing imported voice…';};
      audio.onended=()=>{if(activeLanguageHearingAudio===audio)activeLanguageHearingAudio=null;if(status)status.textContent='Listen again whenever you need.';};
      audio.onerror=()=>{if(activeLanguageHearingAudio===audio)activeLanguageHearingAudio=null;if(status)status.textContent='The imported voice file could not be played.';};
      await audio.play();
    }catch{activeLanguageHearingAudio=null;if(status)status.textContent='The imported voice file could not be opened.';}
  }
  async function toggleLanguageRecording(button){
    const card=button.closest('.voice-card'),status=card?.querySelector('[data-language-record-status]'),playback=card?.querySelector('[data-language-record-playback]');
    if(button.dataset.recording==='1'){try{activeLanguageRecorder?.stop();}catch{}button.dataset.recording='0';button.classList.remove('is-recording');button.querySelector('strong').textContent='Start microphone';if(status)status.textContent='Processing your recording…';return;}
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){if(status)status.textContent='Microphone recording is not supported by this browser.';return;}
    stopLanguageRecorder();stopLanguageHearingAudio();if(activeLanguageRecordingUrl){URL.revokeObjectURL(activeLanguageRecordingUrl);activeLanguageRecordingUrl='';}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[],recorder=new MediaRecorder(stream);activeLanguageStream=stream;activeLanguageRecorder=recorder;
      recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
      recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});activeLanguageRecordingUrl=URL.createObjectURL(blob);if(playback){playback.src=activeLanguageRecordingUrl;playback.hidden=false;}stream.getTracks().forEach(track=>track.stop());activeLanguageStream=null;activeLanguageRecorder=null;button.dataset.recording='0';button.classList.remove('is-recording');button.querySelector('strong').textContent='Record again';if(status)status.textContent='Recording ready. Play it back and compare with the hearing item.';};
      recorder.start();button.dataset.recording='1';button.classList.add('is-recording');button.querySelector('strong').textContent='Stop recording';if(status)status.textContent='Recording… pronounce the '+(String(pageItemType('language-voice',card?.dataset.itemType)?.id||'').endsWith('sentence')?'sentence.':'word.');
    }catch(error){button.dataset.recording='0';button.classList.remove('is-recording');if(status)status.textContent=error?.name==='NotAllowedError'?'Microphone permission was not granted.':'The microphone could not be opened.';}
  }
  function bindLanguagePage(page){
    document.querySelectorAll('[data-language-direct-image]').forEach(image=>{const fail=()=>{image.hidden=true;image.parentElement?.querySelector('[data-language-image-fallback]')?.removeAttribute('hidden');};image.addEventListener('error',fail,{once:true});if(image.complete&&!image.naturalWidth)fail();});
    document.querySelector('[data-language-continue]')?.addEventListener('click',event=>setHash(event.currentTarget.dataset.languageContinue));
    if(page==='language-video'){const area=document.querySelector('[data-language-video-note]'),status=document.querySelector('[data-language-video-note-status]'),count=document.querySelector('[data-language-video-word-count]'),save=()=>{try{localStorage.setItem(languageVideoNoteKey(currentLocation()),area?.value||'');if(status)status.textContent='Saved on this device';}catch{if(status)status.textContent='Could not save this note';}},update=()=>{if(count)count.textContent=String((String(area?.value||'').trim().match(/\S+/g)||[]).length);};document.querySelector('[data-language-video-note-save]')?.addEventListener('click',save);area?.addEventListener('input',()=>{update();if(status)status.textContent='Unsaved changes';});area?.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save();}});update();return;}
    if(page==='language-grammar'){
      document.querySelectorAll('[data-grammar-training-check]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.grammar-training-card'),input=card?.querySelector('[data-grammar-training-input]'),feedback=card?.querySelector('.grammar-training-feedback'),expected=String(button.dataset.grammarTrainingCheck||'').trim().toLocaleLowerCase(),actual=String(input?.value||'').trim().toLocaleLowerCase();if(feedback)feedback.textContent=!expected?'Answer recorded for self-review.':actual&&actual===expected?'Correct.':'Not yet. Review the rule and try again.';}));
      const focus=readLearnerState().grammarFocusItem;if(focus)setTimeout(()=>document.getElementById('language-item-'+focus)?.scrollIntoView({behavior:'smooth',block:'center'}),0);return;
    }
    if(LANGUAGE_ROUTES.includes(page)&&page!=='language-home'){
      const content=readLanguageContent(),loc=currentLocation(),items=itemsFor(content,page,loc),index=languagePageIndex(page,loc,items);
      document.querySelector('[data-language-item-prev]')?.addEventListener('click',()=>{stopLanguageRecorder();stopLanguageHearingAudio();setLanguagePageIndex(page,loc,index-1);render();});
      document.querySelector('[data-language-item-next]')?.addEventListener('click',()=>{stopLanguageRecorder();stopLanguageHearingAudio();setLanguagePageIndex(page,loc,index+1);render();});
      if(page==='language-voice'){document.querySelectorAll('[data-language-speak]').forEach(button=>button.addEventListener('click',()=>playLanguageHearing(button)));document.querySelectorAll('[data-language-record]').forEach(button=>button.addEventListener('click',()=>toggleLanguageRecording(button)));}
      if(page==='language-examine'){
        document.querySelectorAll('[data-exam-choice]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.exam-card'),feedback=card?.querySelector('.exam-feedback'),correct=String(button.dataset.examChoice||'')===String(button.dataset.examAnswer||'');card?.querySelectorAll('[data-exam-choice]').forEach(item=>item.classList.remove('is-correct','is-wrong'));button.classList.add(correct?'is-correct':'is-wrong');if(feedback)feedback.textContent=correct?'Correct.':'Try again.';}));
        document.querySelector('[data-exam-multiple-check]')?.addEventListener('click',event=>{const card=event.currentTarget.closest('.exam-card'),selected=[...(card?.querySelectorAll('[data-exam-multiple-option]:checked')||[])].map(input=>input.value).sort(),expected=String(event.currentTarget.dataset.examMultipleCheck||'').split('|').filter(Boolean).sort(),feedback=card?.querySelector('.exam-feedback'),correct=selected.length===expected.length&&selected.every((value,i)=>value===expected[i]);if(feedback)feedback.textContent=correct?'Correct.':'Check your selections and try again.';});
        document.querySelector('[data-exam-text-check]')?.addEventListener('click',event=>{const card=event.currentTarget.closest('.exam-card'),actual=String(card?.querySelector('[data-exam-text-input]')?.value||'').trim().toLocaleLowerCase(),expected=String(event.currentTarget.dataset.examTextCheck||'').trim().toLocaleLowerCase(),feedback=card?.querySelector('.exam-feedback');if(feedback)feedback.textContent=actual&&actual===expected?'Correct.':'Try again.';});
        document.querySelector('[data-exam-short-review]')?.addEventListener('click',event=>{const card=event.currentTarget.closest('.exam-card'),panel=card?.querySelector('.exam-model-answer'),feedback=card?.querySelector('.exam-feedback');panel?.removeAttribute('hidden');if(feedback)feedback.textContent='Compare your response with the model answer.';});
      }
      return;
    }
    if(!LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return;
    document.querySelector('[data-language-step-prev]')?.addEventListener('click',()=>{const state=readLearnerState();writeLearnerState({intermediateIndex:Math.max(0,(Number(state.intermediateIndex)||0)-1)});render();});
    document.querySelector('[data-language-step-next]')?.addEventListener('click',()=>{const state=readLearnerState();writeLearnerState({intermediateIndex:(Number(state.intermediateIndex)||0)+1});render();});
    document.querySelectorAll('[data-language-answer]').forEach(button=>button.addEventListener('click',()=>{const state=readLearnerState(),answers={...(state.answers||{})};answers[page+':'+(Number(state.intermediateIndex)||0)]=Number(button.dataset.languageAnswer);writeLearnerState({answers,intermediateIndex:(Number(state.intermediateIndex)||0)+1});render();}));
    document.querySelector('[data-language-step-finish]')?.addEventListener('click',()=>{writeLearnerState({onboardingComplete:true,intermediateIndex:0,currentLevel:1,currentStep:1,currentBox:1,completedAt:Date.now()});setHash('language-letters');});
  }
  let languageControlHiddenFor='';
  function hideLanguageControl(page){languageControlHiddenFor=page;document.querySelector('.language-content-control-trigger')?.remove();}
  function ensureLanguageControl(page){document.querySelector('.language-content-control-trigger')?.remove();if(!isLanguage()||!canManageLanguageContent()||page==='language-home'||(!LANGUAGE_ROUTES.includes(page)&&!LANGUAGE_INTERMEDIATE_ROUTES.includes(page))||languageControlHiddenFor===page)return;const button=document.createElement('button');button.type='button';button.className='language-content-control-trigger';button.innerHTML='<strong>Content Control</strong><span>Manage this language page</span>';button.onclick=()=>openLanguageControl(page);document.body.appendChild(button);}
  function languageControlSheet(title,body){const root=document.getElementById('overlay-root');if(!root)return()=>{};root.innerHTML='<div class="entity-sheet-overlay suite-overlay language-control-overlay" id="language-control-overlay"><section class="entity-sheet suite-sheet language-control-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><small>Language content</small><h2>'+esc(title)+'</h2></div><button class="icon-btn" id="language-control-close" type="button">×</button></div>'+body+'</section></div>';const close=()=>{root.innerHTML='';};document.getElementById('language-control-close').onclick=close;document.getElementById('language-control-overlay').onclick=e=>{if(e.target.id==='language-control-overlay')close();};return close;}
  function locationOptions(content,page,selection={}){if(LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return{markup:'<div class="language-location-fixed"><strong>Intermediate process</strong><span>'+esc(page==='language-start-zero'?'Letters process':'Level test')+'</span></div>',loc:{level:'intermediate',step:'process',box:'single'},page};const levels=Array.isArray(content.levels)?content.levels:[],level=levels.find(item=>item.id===selection.level)||levels[0]||{id:'level-1',name:'Level 1',steps:[]},steps=Array.isArray(level.steps)?level.steps:[],step=steps.find(item=>item.id===selection.step)||steps[0]||{id:'step-1',name:'Step 1',boxes:[]},boxes=Array.isArray(step.boxes)?step.boxes:[],box=boxes.find(item=>item.id===selection.box)||boxes[0]||{id:'box-1',name:'Box 1'},chosenPage=LANGUAGE_ROUTES.includes(selection.page)&&selection.page!=='language-home'?selection.page:(page==='language-home'?'language-letters':page),select=(name,items,value)=>'<label><span>'+name+'</span><select data-language-location="'+name.toLowerCase()+'">'+items.map(item=>'<option value="'+esc(item.id)+'" '+(item.id===value?'selected':'')+'>'+esc(item.name)+'</option>').join('')+'</select></label>',pageSelect='<label><span>Page</span><select data-language-location="page">'+navSpec.filter(item=>item[0]!=='language-home').map(item=>'<option value="'+item[0]+'" '+(item[0]===chosenPage?'selected':'')+'>'+esc(languageNavLabel(item))+'</option>').join('')+'</select></label>';return{markup:'<div class="language-location-grid">'+select('Level',levels,level.id)+select('Step',steps,step.id)+select('Box',boxes,box.id)+pageSelect+'</div>',loc:{level:level.id,step:step.id,box:box.id},page:chosenPage};}
  function itemDisplayName(page,item){if(page==='language-letters')return item.word||'Vocabulary';if(page==='language-voice')return item.text||'Voice practice';return item.title||itemTypeLabel(page,item.type)||'Untitled';}
  function itemChoices(items,page){return items.length?'<div class="language-control-items">'+items.map((item,index)=>'<label><input type="radio" name="languageItem" value="'+esc(item.id)+'" '+(index===0?'checked':'')+'><span><strong>'+esc(itemDisplayName(page,item))+'</strong><small>'+esc(itemTypeLabel(page,item.type))+'</small></span></label>').join('')+'</div>':'<p class="auth-note">No content items exist at this location.</p>';}
  function openLanguageControl(page){
    const importAction='<button type="button" data-language-control-action="import"><strong>Import content</strong><span>Import the language content Excel workbook</span></button>',voiceImportAction='<button type="button" data-language-control-action="import-voice"><strong>Import voice files</strong><span>Upload a ZIP and match hearing audio by voice file name</span></button>';
    const video=page==='language-video',actions=video?'<button type="button" data-language-control-action="access"><strong>Access page</strong><span>Return to this video page</span></button><button type="button" data-language-control-action="edit"><strong>Edit video</strong><span>Change the YouTube link, title and writing prompt</span></button>'+importAction+voiceImportAction:'<button type="button" data-language-control-action="access"><strong>Access content</strong><span>Open or focus one content item</span></button><button type="button" data-language-control-action="add"><strong>Add content</strong><span>Add a page-specific content item or structure</span></button><button type="button" data-language-control-action="edit"><strong>Edit content</strong><span>Edit an item or delete it from its edit form</span></button>'+importAction+voiceImportAction;
    const close=languageControlSheet('Content Control','<div class="language-control-step"><small>Step 1 of 3</small><h3>What do you want to do?</h3><div class="language-control-actions">'+actions+'</div></div>');
    document.querySelectorAll('[data-language-control-action]').forEach(button=>button.onclick=()=>{const action=button.dataset.languageControlAction;if(action==='import'){renderLanguageExcelImport(page,close);return;}if(action==='import-voice'){renderLanguageVoiceImport(page,close);return;}renderLanguageControlLocation(page,action,close);});
  }
  function accessLanguageContent(originPage,page,loc,itemId){
    if(LANGUAGE_INTERMEDIATE_ROUTES.includes(page)){const content=readLanguageContent(),items=itemsFor(content,page,loc),index=Math.max(0,items.findIndex(item=>item.id===itemId));writeLearnerState({intermediateIndex:index});hideLanguageControl(originPage);render();return;}
    const content=readLanguageContent(),items=itemsFor(content,page,loc),index=Math.max(0,items.findIndex(item=>item.id===itemId)),level=Number(String(loc.level).replace(/\D/g,''))||1,step=Number(String(loc.step).replace(/\D/g,''))||1,box=Number(String(loc.box).replace(/\D/g,''))||1;
    const patch={currentLevel:level,currentStep:step,currentBox:box};if(page==='language-grammar')patch.grammarFocusItem=itemId;writeLearnerState(patch);if(page!=='language-grammar')setLanguagePageIndex(page,loc,index);hideLanguageControl(originPage);if(originPage!==page)setHash(page);else render();
  }
  function renderLanguageControlLocation(page,action,close,selection={}){
    const content=readLanguageContent(),where=locationOptions(content,page,selection),items=itemsFor(content,where.page,where.loc),sheet=document.querySelector('.language-control-sheet');if(!sheet)return;
    const video=where.page==='language-video';
    const addTargets=action==='add'?'<div class="language-add-targets"><label><input type="radio" name="languageAddTarget" value="language" checked><span>Add language content</span></label><label><input type="radio" name="languageAddTarget" value="level"><span>Add level</span></label><label><input type="radio" name="languageAddTarget" value="step"><span>Add step of a level</span></label><label><input type="radio" name="languageAddTarget" value="box"><span>Add box of a step</span></label></div>':'';
    sheet.querySelector(':scope > .language-control-step')?.remove();
    sheet.insertAdjacentHTML('beforeend','<div class="language-control-step"><small>Step 2 of 3</small><h3>Choose the level, step, box and page</h3>'+where.markup+addTargets+((action==='access'||action==='edit')&&!video?itemChoices(items,where.page):'')+'<div class="language-control-footer"><button type="button" class="btn btn-ghost" data-language-control-back>Back</button><button type="button" class="btn btn-primary" data-language-control-next>'+(action==='add'?'Continue':action==='edit'?'Edit':'Access')+'</button></div><p class="auth-note" data-language-control-status></p></div>');
    const step=sheet.querySelector(':scope > .language-control-step');
    step.querySelector('[data-language-control-back]').onclick=()=>{close();openLanguageControl(page);};
    step.querySelectorAll('[data-language-location]').forEach(select=>select.onchange=()=>{const next={level:step.querySelector('[data-language-location="level"]')?.value,step:step.querySelector('[data-language-location="step"]')?.value,box:step.querySelector('[data-language-location="box"]')?.value,page:step.querySelector('[data-language-location="page"]')?.value};step.remove();renderLanguageControlLocation(page,action,close,next);});
    step.querySelector('[data-language-control-next]').onclick=()=>{
      const selectedId=step.querySelector('input[name="languageItem"]:checked')?.value,status=step.querySelector('[data-language-control-status]');
      if(video){close();if(action==='edit')openLanguageVideoEditor(page,where.loc);else{hideLanguageControl(page);render();}return;}
      if(action==='access'){if(!selectedId){status.textContent='Choose a content item first.';return;}close();accessLanguageContent(page,where.page,where.loc,selectedId);return;}
      if(action==='edit'){if(!selectedId){status.textContent='Choose a content item first.';return;}close();openLanguageItemEditor(page,where.page,where.loc,selectedId);return;}
      const target=step.querySelector('input[name="languageAddTarget"]:checked')?.value||'language';step.remove();renderLanguageImportStep(page,where.page,where.loc,target,close);
    };
  }
  function languageTypeSelect(page,selected=''){const types=pageItemTypes(page);return types.length?'<div class="field language-type-field"><label>Content item type</label><select name="type" data-language-editor-type>'+types.map(item=>'<option value="'+esc(item.id)+'" '+(item.id===selected?'selected':'')+'>'+esc(item.label)+'</option>').join('')+'</select></div>':'';}
  function languageEditorFields(page,item={}){
    if(page==='language-letters')return languageTypeSelect(page,item.type||'vocabulary')+'<div class="field"><label>Word</label><input name="word" dir="auto" maxlength="160" value="'+esc(item.word||'')+'" placeholder="Word in '+esc(targetLanguage())+'"></div><div class="field" data-language-types="sentence-vocabulary"><label>Sentence</label><textarea name="sentence" dir="auto" rows="3" maxlength="800">'+esc(item.sentence||'')+'</textarea></div><div class="language-editor-pair" data-language-types="vocabulary,sentence-vocabulary"><div class="field"><label>Meaning in English</label><textarea name="meaningEnglish" dir="ltr" rows="3" maxlength="800">'+esc(item.meaningEnglish||'')+'</textarea></div><div class="field"><label>Meaning in Arabic</label><textarea name="meaningArabic" rows="3" maxlength="800" dir="rtl">'+esc(item.meaningArabic||'')+'</textarea></div></div><div class="field" data-language-types="image-vocabulary"><label>Direct image URL</label><input name="imageUrl" type="url" inputmode="url" data-language-required="true" maxlength="1200" value="'+esc(item.imageUrl||'')+'" placeholder="https://example.com/image.jpg"><small class="auth-note">Paste a direct HTTP(S) image link. Dafatii displays that image directly in the vocabulary card.</small></div>';
    if(page==='language-voice')return languageTypeSelect(page,item.type||'hearing-word')+'<div class="field"><label>Word or sentence</label><textarea name="text" dir="auto" rows="3" maxlength="900">'+esc(item.text||'')+'</textarea></div><div class="field"><label>Practice instruction</label><textarea name="instruction" dir="auto" rows="3" maxlength="900">'+esc(item.instruction||'')+'</textarea></div><div class="field" data-language-types="hearing-word,hearing-sentence"><label>Voice file name</label><input name="voiceFileName" maxlength="260" value="'+esc(item.voiceFileName||'')+'" placeholder="pronunciation.mp3"></div><p class="auth-note" data-language-types="hearing-word,hearing-sentence">'+(item.voiceFileId?'Matched voice file is uploaded and active.':'No uploaded voice file is currently matched to this item.')+'</p><p class="auth-note">Hearing items use an imported voice file when available and browser pronunciation as fallback. The microphone button remains a learner practice action, not a separate content type.</p>';
    if(page==='language-grammar')return languageTypeSelect(page,item.type||'grammar-law')+'<div class="field"><label>Title</label><input name="title" dir="auto" maxlength="160" value="'+esc(item.title||'')+'"></div><div class="field"><label>Content</label><textarea name="body" dir="auto" rows="6" maxlength="2400">'+esc(item.body||'')+'</textarea></div><div class="field" data-language-types="grammar-training"><label>Training answer</label><input name="answer" maxlength="500" value="'+esc(item.answer||'')+'" placeholder="Optional exact answer"></div>';
    if(page==='language-examine'){const choices=Array.isArray(item.choices)?item.choices.join('\n'):'',answers=Array.isArray(item.answers)?item.answers.join('\n'):'';return languageTypeSelect(page,item.type||'exam-single-choice')+'<div class="field"><label>Question</label><textarea name="question" dir="auto" rows="4" maxlength="1400">'+esc(item.question||'')+'</textarea></div><div class="field" data-language-types="exam-single-choice,exam-multiple-choice"><label>Choices — one per line</label><textarea name="choices" dir="auto" rows="5" maxlength="1600">'+esc(choices)+'</textarea></div><div class="field" data-language-types="exam-single-choice,exam-true-false,exam-fill-blank,exam-short-answer"><label>Answer / model answer</label><textarea name="answer" dir="auto" rows="3" maxlength="1000">'+esc(item.answer||'')+'</textarea></div><div class="field" data-language-types="exam-multiple-choice"><label>Correct answers — one per line</label><textarea name="answers" dir="auto" rows="4" maxlength="1400">'+esc(answers)+'</textarea></div>';}
    const choices=Array.isArray(item.choices)?item.choices.join('\n'):'';
    return '<div class="field"><label>Title</label><input name="title" maxlength="120" value="'+esc(item.title||'')+'" placeholder="Item title"></div><div class="field"><label>Text</label><textarea name="body" rows="6" maxlength="2000">'+esc(item.body||'')+'</textarea>'+(page==='language-level-test'?'</div><div class="field"><label>Choices — one per line</label><textarea name="choices" rows="4" maxlength="1200">'+esc(choices)+'</textarea>':'</div>');
  }
  function syncLanguageEditorType(form){
    const select=form.querySelector('[data-language-editor-type]');if(!select)return;const type=select.value;form.querySelectorAll('[data-language-types]').forEach(node=>{const allowed=String(node.dataset.languageTypes||'').split(','),active=allowed.includes(type);node.hidden=!active;node.querySelectorAll('input,textarea,select').forEach(control=>{control.disabled=!active;if(control.dataset.languageRequired==='true')control.required=active;});});select.onchange=()=>syncLanguageEditorType(form);
  }
  function readLanguageEditorData(form,page,base={}){
    const data=Object.fromEntries(new FormData(form)),id=String(base.id||languageUid('content'));
    if(page==='language-letters'){const type=pageItemType(page,data.type)?.id||'vocabulary';if(type==='sentence-vocabulary')return{id,type,word:String(data.word||'').trim()||'Word',sentence:String(data.sentence||'').trim(),meaningEnglish:String(data.meaningEnglish||'').trim(),meaningArabic:String(data.meaningArabic||'').trim()};if(type==='image-vocabulary')return{id,type,word:String(data.word||'').trim()||'Word',imageUrl:directImageUrl(data.imageUrl)};return{id,type:'vocabulary',word:String(data.word||'').trim()||'Word',meaningEnglish:String(data.meaningEnglish||'').trim(),meaningArabic:String(data.meaningArabic||'').trim()};}
    if(page==='language-voice'){const type=pageItemType(page,data.type)?.id||'hearing-word',voiceFileName=type.startsWith('hearing-')?String(data.voiceFileName||'').trim():'',sameVoiceName=voiceFileName&&voiceFileName.toLocaleLowerCase()===String(base.voiceFileName||'').trim().toLocaleLowerCase();return{id,type,text:String(data.text||'').trim()||'Practice',instruction:String(data.instruction||'').trim(),voiceFileName,voiceFileId:sameVoiceName?String(base.voiceFileId||''):'',voiceContentType:sameVoiceName?String(base.voiceContentType||''):''};}
    if(page==='language-grammar'){const type=pageItemType(page,data.type)?.id||'grammar-law';return{id,type,title:String(data.title||'').trim()||itemTypeLabel(page,type),body:String(data.body||'').trim(),answer:type==='grammar-training'?String(data.answer||'').trim():''};}
    if(page==='language-examine'){const type=pageItemType(page,data.type)?.id||'exam-single-choice',choices=String(data.choices||'').split(/\n+/).map(value=>value.trim()).filter(Boolean),answers=String(data.answers||'').split(/\n+/).map(value=>value.trim()).filter(Boolean);return{id,type,question:String(data.question||'').trim()||'Question',choices:(type==='exam-single-choice'||type==='exam-multiple-choice')?choices:[],answer:type==='exam-multiple-choice'?'':String(data.answer||'').trim(),answers:type==='exam-multiple-choice'?answers:[]};}
    const next={id,title:String(data.title||'').trim()||'Untitled',body:String(data.body||'').trim()};if(page==='language-level-test')next.choices=String(data.choices||'').split(/\n+/).map(value=>value.trim()).filter(Boolean);return next;
  }
  function languageDraftHasContent(page,item){if(page==='language-letters')return item.word!=='Word'||Boolean(item.sentence||item.meaningEnglish||item.meaningArabic||item.imageUrl);if(page==='language-voice')return item.text!=='Practice'||Boolean(item.instruction);if(page==='language-grammar')return Boolean(item.body||item.answer||!['Grammar / rule','Note','Example','Training'].includes(item.title));if(page==='language-examine')return item.question!=='Question'||Boolean(item.answer||(item.answers||[]).length||(item.choices||[]).length);return item.title!=='Untitled'||Boolean(item.body||(item.choices||[]).length);}
  const LANGUAGE_EXCEL_HEADERS=Object.freeze([
    'item type','item level','item step','item box','item page','item turning number',
    'title','text / instruction','word','sentence','meaning English','meaning Arabic',
    'image URL','voice file name',
    'choice 1','choice 2','choice 3','choice 4','choice 5','choice 6',
    'correct answer','youtube video link','youtube understanding prompt'
  ]);
  const LANGUAGE_EXCEL_TYPE_PAGE=Object.freeze({
    vocabulary:'language-letters','sentence-vocabulary':'language-letters','image-vocabulary':'language-letters',
    'hearing-word':'language-voice','hearing-sentence':'language-voice',
    'grammar-law':'language-grammar','grammar-note':'language-grammar','grammar-example':'language-grammar','grammar-training':'language-grammar',
    'youtube-video':'language-video',
    'exam-single-choice':'language-examine','exam-multiple-choice':'language-examine','exam-true-false':'language-examine','exam-fill-blank':'language-examine','exam-short-answer':'language-examine'
  });
  const excelText=value=>String(value==null?'':value).trim();
  function excelPositiveInt(value,label,rowNumber){
    const number=Number(value);if(!Number.isInteger(number)||number<1)throw new Error('Row '+rowNumber+': '+label+' must be a positive whole number.');return number;
  }
  function ensureLanguageExcelLocation(content,levelNumber,stepNumber,boxNumber){
    content.levels=Array.isArray(content.levels)?content.levels:[];
    for(let n=1;n<=levelNumber;n++){const id='level-'+n;if(!content.levels.some(item=>item.id===id))content.levels.push({id,name:'Level '+n,steps:[]});}
    const level=content.levels.find(item=>item.id==='level-'+levelNumber);level.steps=Array.isArray(level.steps)?level.steps:[];
    for(let n=1;n<=stepNumber;n++){const id='step-'+n;if(!level.steps.some(item=>item.id===id))level.steps.push({id,name:'Step '+n,boxes:[]});}
    const step=level.steps.find(item=>item.id==='step-'+stepNumber);step.boxes=Array.isArray(step.boxes)?step.boxes:[];
    for(let n=1;n<=boxNumber;n++){const id='box-'+n;if(!step.boxes.some(item=>item.id===id))step.boxes.push({id,name:'Box '+n});}
    return{level:'level-'+levelNumber,step:'step-'+stepNumber,box:'box-'+boxNumber};
  }
  function languageExcelItem(row,type){
    const put=(object,key,column)=>{const value=excelText(row[column]);if(value)object[key]=value;};
    const item={id:languageUid('excel'),type};
    if(type==='vocabulary'){put(item,'word','word');put(item,'meaningEnglish','meaning English');put(item,'meaningArabic','meaning Arabic');}
    if(type==='sentence-vocabulary'){put(item,'word','word');put(item,'sentence','sentence');put(item,'meaningEnglish','meaning English');put(item,'meaningArabic','meaning Arabic');}
    if(type==='image-vocabulary'){put(item,'word','word');put(item,'imageUrl','image URL');}
    if(['hearing-word','hearing-sentence'].includes(type)){
      if(type.endsWith('-word'))put(item,'text','word');else put(item,'text','sentence');
      put(item,'instruction','text / instruction');put(item,'voiceFileName','voice file name');
    }
    if(['grammar-law','grammar-note','grammar-example','grammar-training'].includes(type)){put(item,'title','title');put(item,'body','text / instruction');if(type==='grammar-training')put(item,'answer','correct answer');}
    if(type.startsWith('exam-')){
      put(item,'question','text / instruction');
      const choices=[];for(let n=1;n<=6;n++){const value=excelText(row['choice '+n]);if(value)choices.push(value);}
      if(type==='exam-single-choice'||type==='exam-multiple-choice')item.choices=choices;
      const correct=excelText(row['correct answer']);
      if(type==='exam-multiple-choice'){if(correct)item.answers=correct.split(/\s*\|\s*|\n+/).map(value=>value.trim()).filter(Boolean);}
      else if(correct)item.answer=correct;
    }
    return item;
  }
  function languageExcelFeatureCount(item){return Object.keys(item).filter(key=>!['id','type'].includes(key)&&!(Array.isArray(item[key])&&!item[key].length)&&excelText(Array.isArray(item[key])?item[key].join(''):item[key])).length;}
  function mergeLanguageExcelItem(existing,incoming,page,index){
    const base=existing&&existing.type===incoming.type?{...existing,id:existing.id}:{id:incoming.id,type:incoming.type};
    if(page==='language-voice'&&incoming.type?.startsWith('hearing-')&&incoming.voiceFileName&&String(incoming.voiceFileName).toLocaleLowerCase()!==String(base.voiceFileName||'').toLocaleLowerCase()){base.voiceFileId='';base.voiceContentType='';}
    return normalizeLanguagePageItem({...base,...incoming},page,index);
  }
  async function importLanguageExcel(file){
    if(!file)throw new Error('Choose an Excel file first.');
    if(!/\.(xlsx|xls)$/i.test(String(file.name||'')))throw new Error('Import content accepts Excel .xlsx or .xls files only.');
    if(!window.XLSX)throw new Error('Excel import is not available yet. Reload the page and try again.');
    const workbook=window.XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=workbook.Sheets['Content Items']||workbook.Sheets[workbook.SheetNames[0]];
    if(!sheet)throw new Error('The Excel workbook does not contain a worksheet.');
    const matrix=window.XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',blankrows:false,raw:false});
    if(!matrix.length)throw new Error('The Excel worksheet is empty.');
    const headers=(matrix[0]||[]).map(value=>excelText(value)),normalizedHeaders=headers.map(value=>value.toLowerCase());
    const missing=LANGUAGE_EXCEL_HEADERS.filter(header=>!normalizedHeaders.includes(header.toLowerCase()));
    if(missing.length)throw new Error('Missing Excel columns: '+missing.join(', ')+'.');
    const headerMap={};headers.forEach((header,index)=>{headerMap[header.toLowerCase()]=index;});
    const parsed=[],seen=new Set();
    matrix.slice(1).forEach((values,rowOffset)=>{
      const rowNumber=rowOffset+2,row={};LANGUAGE_EXCEL_HEADERS.forEach(header=>{row[header]=values[headerMap[header.toLowerCase()]]??'';});
      const type=excelText(row['item type']);if(!type)return;
      const expectedPage=LANGUAGE_EXCEL_TYPE_PAGE[type];if(!expectedPage)throw new Error('Row '+rowNumber+': unknown item type "'+type+'".');
      const page=excelText(row['item page']);if(page!==expectedPage)throw new Error('Row '+rowNumber+': item page must be '+expectedPage+' for '+type+'.');
      const level=excelPositiveInt(row['item level'],'item level',rowNumber),step=excelPositiveInt(row['item step'],'item step',rowNumber),box=excelPositiveInt(row['item box'],'item box',rowNumber),turn=excelPositiveInt(row['item turning number'],'item turning number',rowNumber);
      const unique=[level,step,box,page,turn].join('|');if(seen.has(unique))throw new Error('Row '+rowNumber+': duplicate turning number '+turn+' for the same level, step, box, and page.');seen.add(unique);
      if(type==='youtube-video'){
        const config={};const title=excelText(row.title),url=excelText(row['youtube video link']),prompt=excelText(row['youtube understanding prompt']);if(title)config.title=title;if(url)config.url=url;if(prompt)config.prompt=prompt;
        if(!Object.keys(config).length)throw new Error('Row '+rowNumber+': the YouTube row has no non-empty content columns.');
        parsed.push({rowNumber,type,page,level,step,box,turn,config});return;
      }
      const item=languageExcelItem(row,type);if(type==='image-vocabulary'){item.imageUrl=directImageUrl(item.imageUrl);if(!item.imageUrl)throw new Error('Row '+rowNumber+': image-vocabulary requires a valid direct HTTP(S) image URL.');}if(!languageExcelFeatureCount(item))throw new Error('Row '+rowNumber+': '+type+' has no non-empty content columns.');
      parsed.push({rowNumber,type,page,level,step,box,turn,item});
    });
    if(!parsed.length)throw new Error('No content rows were found in the Excel file.');
    const content=JSON.parse(JSON.stringify(readLanguageContent()));
    const groups=new Map();parsed.forEach(entry=>{const key=[entry.level,entry.step,entry.box,entry.page].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(entry);});
    for(const entries of groups.values()){
      entries.sort((a,b)=>a.turn-b.turn);
      for(const entry of entries){
        const loc=ensureLanguageExcelLocation(content,entry.level,entry.step,entry.box),key=pageKey(entry.page,loc),index=entry.turn-1;
        if(entry.type==='youtube-video'){
          if(entry.turn!==1)throw new Error('Row '+entry.rowNumber+': youtube-video turning number must be 1.');
          content.video=content.video||{};const current=content.video[key]||{title:'Watch and understand',prompt:'Write what you understood from this video in your own words.',url:''};content.video[key]={...current,...entry.config};content.pages=content.pages||{};content.pages[key]=[];continue;
        }
        content.pages=content.pages||{};const items=Array.isArray(content.pages[key])?content.pages[key]:[];
        if(index>items.length)throw new Error('Row '+entry.rowNumber+': item turning number '+entry.turn+' skips an empty position on '+entry.page+'.');
        const existing=items[index];const next=mergeLanguageExcelItem(existing,entry.item,entry.page,index);
        if(index===items.length)items.push(next);else items[index]=next;content.pages[key]=items;
      }
    }
    writeLanguageContent(content);
    return{rows:parsed.length,locations:groups.size};
  }
  function renderLanguageExcelImport(originPage,close){
    const sheet=document.querySelector('.language-control-sheet');if(!sheet)return;
    sheet.querySelector(':scope > .language-control-step')?.remove();
    sheet.insertAdjacentHTML('beforeend','<form class="language-control-step language-item-editor" data-language-excel-import><small>Excel bulk import</small><h3>Import content</h3><div class="field"><label>Language content Excel file</label><input data-language-excel-file type="file" accept=".xlsx,.xls" required></div><div class="language-location-fixed"><strong>Exact workbook structure</strong><span>Uses item type, level, step, box, page and turning number exactly like the provided Excel file.</span></div><p class="auth-note">Only non-empty feature columns valid for each item type are applied. Existing values at the same turning position are kept when the matching Excel feature cell is blank. Hearing rows support <strong>voice file name</strong>; YouTube rows support <strong>youtube video link</strong>; exam rows use <strong>correct answer</strong>.</p><div class="language-control-footer"><button type="button" class="btn btn-ghost" data-language-excel-cancel>Cancel</button><button type="submit" class="btn btn-primary">Import Excel</button></div><p class="auth-note" data-language-excel-status></p></form>');
    const form=sheet.querySelector('[data-language-excel-import]'),status=form.querySelector('[data-language-excel-status]'),button=form.querySelector('button[type=submit]');
    form.querySelector('[data-language-excel-cancel]').onclick=()=>{close();openLanguageControl(originPage);};
    form.onsubmit=async event=>{event.preventDefault();button.disabled=true;status.textContent='Validating workbook…';try{const result=await importLanguageExcel(form.querySelector('[data-language-excel-file]').files?.[0]);status.textContent='Imported '+result.rows+' rows across '+result.locations+' content locations.';hideLanguageControl(originPage);setTimeout(()=>{close();render();},250);}catch(error){status.textContent=error.message;button.disabled=false;}};
  }


  const LANGUAGE_VOICE_MIME=Object.freeze({mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4',mp4:'audio/mp4',webm:'audio/webm'});
  const voiceBaseName=value=>String(value||'').replace(/\\/g,'/').split('/').filter(Boolean).pop()||'';
  function languageVoiceTargets(content){
    const targets=[];
    Object.entries(content.pages||{}).forEach(([key,items])=>{
      if(!key.endsWith('|language-voice')||!Array.isArray(items))return;
      items.forEach(item=>{if(!['hearing-word','hearing-sentence'].includes(item?.type))return;const filename=voiceBaseName(item.voiceFileName);if(filename)targets.push({item,key,filename,match:filename.toLocaleLowerCase()});});
    });
    return targets;
  }
  async function importLanguageVoiceZip(file,onProgress){
    if(!file)throw new Error('Choose a ZIP file first.');
    if(!/\.zip$/i.test(String(file.name||'')))throw new Error('Import voice files accepts one .zip file only.');
    if(file.size>314572800)throw new Error('The ZIP file exceeds the 300 MB import limit.');
    if(!window.JSZip)throw new Error('ZIP import is not available yet. Reload the page and try again.');
    if(!window.DafatiiFiles?.upload)throw new Error('Course file upload is not available in this session.');
    const content=readLanguageContent(),targets=languageVoiceTargets(content);
    if(!targets.length)throw new Error('No hearing items have a voice file name to match.');
    const zip=await window.JSZip.loadAsync(await file.arrayBuffer()),entries=new Map(),duplicates=[];
    Object.values(zip.files).filter(entry=>!entry.dir).forEach(entry=>{
      const base=voiceBaseName(entry.name),match=base.toLocaleLowerCase(),extension=base.toLocaleLowerCase().split('.').pop();
      if(!LANGUAGE_VOICE_MIME[extension])return;
      if(entries.has(match))duplicates.push(base);else entries.set(match,{entry,base,extension});
    });
    if(duplicates.length)throw new Error('Duplicate audio filenames in ZIP: '+[...new Set(duplicates)].slice(0,8).join(', ')+'.');
    const matches=new Map();
    targets.forEach(target=>{const source=entries.get(target.match);if(source){if(!matches.has(target.match))matches.set(target.match,{source,targets:[]});matches.get(target.match).targets.push(target);}});
    if(!matches.size)throw new Error('No ZIP audio filenames matched any hearing item voice file name.');
    const uploaded=[],oldIds=new Set();let completed=0;
    try{
      for(const {source,targets:matchedTargets} of matches.values()){
        const blob=await source.entry.async('blob');
        if(!blob.size)throw new Error(source.base+' is empty.');
        if(blob.size>52428800)throw new Error(source.base+' exceeds the 50 MB per-file limit.');
        const audioFile=new File([blob],source.base,{type:LANGUAGE_VOICE_MIME[source.extension]}),courseId=window.DafatiiCourses.active().id;
        onProgress?.({file:source.base,completed,total:matches.size,ratio:0});
        const result=await window.DafatiiFiles.upload(audioFile,{courseId,purpose:'language-hearing-audio',onProgress:progress=>onProgress?.({file:source.base,completed,total:matches.size,ratio:progress.ratio})});
        const fileId=String(result?.id||'');if(!fileId)throw new Error('Storage did not return a file ID for '+source.base+'.');
        uploaded.push(fileId);
        matchedTargets.forEach(target=>{if(target.item.voiceFileId)oldIds.add(String(target.item.voiceFileId));target.item.voiceFileId=fileId;target.item.voiceContentType=LANGUAGE_VOICE_MIME[source.extension];});
        completed++;onProgress?.({file:source.base,completed,total:matches.size,ratio:1});
      }
      writeLanguageContent(content);
      const referenced=new Set(languageVoiceTargets(content).map(target=>String(target.item.voiceFileId||'')).filter(Boolean));
      for(const id of oldIds){if(!referenced.has(id)&&window.DafatiiFiles.delete){void window.DafatiiFiles.delete(id).catch(()=>{});}}
      const unmatchedTargets=targets.filter(target=>!entries.has(target.match)).length,unmatchedFiles=[...entries.keys()].filter(name=>!matches.has(name)).length;
      return{files:matches.size,items:[...matches.values()].reduce((sum,value)=>sum+value.targets.length,0),unmatchedTargets,unmatchedFiles};
    }catch(error){
      for(const id of uploaded){try{await window.DafatiiFiles.delete?.(id);}catch{}}
      throw error;
    }
  }
  function renderLanguageVoiceImport(originPage,close){
    const sheet=document.querySelector('.language-control-sheet');if(!sheet)return;
    sheet.querySelector(':scope > .language-control-step')?.remove();
    sheet.insertAdjacentHTML('beforeend','<form class="language-control-step language-item-editor" data-language-voice-import><small>Voice ZIP import</small><h3>Import voice files</h3><div class="field"><label>ZIP with hearing audio files</label><input data-language-voice-zip type="file" accept=".zip,application/zip" required></div><div class="language-location-fixed"><strong>Exact filename matching</strong><span>Each MP3, WAV, OGG, M4A/MP4 audio, or WebM file is matched to hearing items whose <em>voice file name</em> is the same filename.</span></div><p class="auth-note">Folder names inside the ZIP are ignored. Filenames are matched case-insensitively. One uploaded file can serve multiple hearing items that use the same filename.</p><div class="language-control-footer"><button type="button" class="btn btn-ghost" data-language-voice-cancel>Cancel</button><button type="submit" class="btn btn-primary">Import voice ZIP</button></div><p class="auth-note" data-language-voice-status></p></form>');
    const form=sheet.querySelector('[data-language-voice-import]'),status=form.querySelector('[data-language-voice-status]'),button=form.querySelector('button[type=submit]');
    form.querySelector('[data-language-voice-cancel]').onclick=()=>{close();openLanguageControl(originPage);};
    form.onsubmit=async event=>{
      event.preventDefault();button.disabled=true;status.textContent='Reading ZIP…';
      try{
        const result=await importLanguageVoiceZip(form.querySelector('[data-language-voice-zip]').files?.[0],progress=>{
          const current=Math.min(progress.total,progress.completed+(progress.ratio<1?1:0));
          status.textContent='Uploading '+progress.file+' · '+current+' / '+progress.total;
        });
        status.textContent='Matched '+result.files+' voice files to '+result.items+' hearing items'+(result.unmatchedTargets?' · '+result.unmatchedTargets+' hearing items still unmatched':'')+'.';
        hideLanguageControl(originPage);setTimeout(()=>{close();render();},350);
      }catch(error){status.textContent=error.message;button.disabled=false;}
    };
  }

  function renderLanguageImportStep(originPage,page,loc,target,close){
    const sheet=document.querySelector('.language-control-sheet');if(!sheet)return;
    sheet.insertAdjacentHTML('beforeend','<form class="language-control-step language-item-editor" data-language-add-form><small>Step 3 of 3</small><h3>Add content</h3>'+languageEditorFields(page,{})+'<p class="auth-note">Use this form for one manual content item. For bulk Excel rows, return to Content Control and choose Import content.</p><div class="language-control-footer"><button type="button" class="btn btn-ghost" data-language-import-cancel>Cancel</button><button type="submit" class="btn btn-primary">Add</button></div><p class="auth-note" data-language-import-status></p></form>');
    const step=sheet.querySelector('[data-language-add-form]');syncLanguageEditorType(step);step.querySelector('[data-language-import-cancel]').onclick=close;
    step.onsubmit=async event=>{event.preventDefault();const status=step.querySelector('[data-language-import-status]'),button=step.querySelector('button[type=submit]');button.disabled=true;status.textContent='Adding…';try{const content=readLanguageContent();let destination={...loc};if(!LANGUAGE_INTERMEDIATE_ROUTES.includes(page)&&target!=='language'){if(target==='level'){const number=(content.levels?.length||0)+1,newLevel={id:'level-'+number,name:'Level '+number,steps:[{id:'step-1',name:'Step 1',boxes:[{id:'box-1',name:'Box 1'}]}]};content.levels.push(newLevel);destination={level:newLevel.id,step:'step-1',box:'box-1'};}else{const level=content.levels.find(item=>item.id===loc.level)||content.levels[0];if(target==='step'){const number=(level.steps?.length||0)+1,newStep={id:'step-'+number,name:'Step '+number,boxes:[{id:'box-1',name:'Box 1'}]};level.steps.push(newStep);destination={level:level.id,step:newStep.id,box:'box-1'};}if(target==='box'){const stepObj=(level.steps||[]).find(item=>item.id===loc.step)||level.steps?.[0],number=(stepObj.boxes?.length||0)+1,newBox={id:'box-'+number,name:'Box '+number};stepObj.boxes.push(newBox);destination={level:level.id,step:stepObj.id,box:newBox.id};}}}
      const draft=readLanguageEditorData(step,page,{id:languageUid('content')}),additions=[draft];
      if(LANGUAGE_INTERMEDIATE_ROUTES.includes(page)){content.intermediate=content.intermediate||{};content.intermediate[page]=Array.isArray(content.intermediate[page])?content.intermediate[page]:[];content.intermediate[page].push(...additions);}else{content.pages=content.pages||{};const key=pageKey(page,destination);content.pages[key]=Array.isArray(content.pages[key])?content.pages[key]:[];content.pages[key].push(...additions);}
      writeLanguageContent(content);close();render();
    }catch(error){status.textContent=error.message;button.disabled=false;}};
  }
  function openLanguageItemEditor(originPage,page,loc,itemId){
    const content=readLanguageContent(),items=itemsFor(content,page,loc),item=items.find(entry=>entry.id===itemId);if(!item)return;
    const close=languageControlSheet('Edit content','<form class="language-item-editor" data-language-edit-form>'+languageEditorFields(page,item)+'<div class="language-editor-actions"><button class="btn btn-primary" type="submit">Save changes</button><button class="btn btn-ghost danger" type="button" data-language-delete-item>Delete item</button></div><p class="auth-note" data-language-edit-status>Delete is available inside this edit form.</p></form>');
    const form=document.querySelector('[data-language-edit-form]');syncLanguageEditorType(form);
    form.onsubmit=event=>{event.preventDefault();const updated=readLanguageEditorData(form,page,item);Object.keys(item).forEach(key=>delete item[key]);Object.assign(item,updated);writeLanguageContent(content);hideLanguageControl(originPage);close();render();};
    form.querySelector('[data-language-delete-item]').onclick=()=>{if(!window.confirm('Delete this content item?'))return;const index=items.findIndex(entry=>entry.id===itemId);if(index>=0)items.splice(index,1);writeLanguageContent(content);hideLanguageControl(originPage);close();render();};
  }
  function openLanguageVideoEditor(originPage,loc){
    const content=readLanguageContent(),key=pageKey('language-video',loc),config=languageVideoConfig(content,loc),close=languageControlSheet('Edit YouTube page','<form class="language-item-editor" data-language-video-edit><div class="field"><label>Page title</label><input name="title" dir="auto" maxlength="120" value="'+esc(config.title||'')+'"></div><div class="field"><label>YouTube video link</label><input name="url" type="url" maxlength="900" value="'+esc(config.url||'')+'" placeholder="https://www.youtube.com/watch?v=…"></div><div class="field"><label>Understanding prompt</label><textarea name="prompt" dir="auto" rows="5" maxlength="1200">'+esc(config.prompt||'')+'</textarea></div><button class="btn btn-primary auth-submit" type="submit">Save video page</button><p class="auth-note">The learner note stays private to the learner’s browser.</p></form>');
    document.querySelector('[data-language-video-edit]').onsubmit=event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));content.video=content.video||{};content.video[key]={title:String(data.title||'').trim()||'Watch and understand',url:String(data.url||'').trim(),prompt:String(data.prompt||'').trim()||'Write what you understood from this video in your own words.'};content.pages=content.pages||{};content.pages[key]=[];writeLanguageContent(content);hideLanguageControl(originPage);close();render();};
  }
  function installWorkspaceRoutes(){const previousContent=workspaceContent;workspaceContent=function(page,parts,title){if(isLanguage()&&page==='language-home')return languageHomePage();if(isLanguage()&&LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return intermediatePage(page);if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return languageContentPage(page);if(courseType()==='personal'&&page==='study-rooms')return personalRoomPage();return previousContent(page,parts,title);};const previousWorkspace=workspace;workspace=function(current){const type=courseType(),page=String(current||'').split('/')[0];if(type==='language'&&window.DafatiiCourses.active().id){purgeLegacyLanguageBrowserState();if(!LANGUAGE_ROUTES.includes(page)&&!LANGUAGE_INTERMEDIATE_ROUTES.includes(page)&&!['change-course','profile','settings','representer','admin'].includes(page)){setHash('language-home');return;}}if(type==='personal'&&page==='chat'){setHash('study-rooms');return;}previousWorkspace(current);adaptNavigation();if(type==='personal'&&page==='study-rooms')bindPersonalRoom();if(type==='language'){bindLanguagePage(page);ensureLanguageControl(page);}};}
  function adaptNavigation(){const type=courseType(),current=(location.hash||'#language-home').replace(/^#\/?/,'').split('/')[0];if(type==='personal'){document.querySelectorAll('a[href^="#chat"],[data-page="chat"],[data-bottom-nav-item="chat"]').forEach(node=>node.remove());if(current==='study-rooms')document.querySelector('.quiet-workspace>.sub-nav')?.remove();return;}if(type!=='language')return;document.querySelector('.quiet-workspace>.sub-nav')?.remove();document.querySelector('.quiet-return-button')?.remove();const shell=document.querySelector('.quiet-workspace');if(shell){shell.classList.add('language-course-shell');shell.classList.toggle('language-intermediate-shell',LANGUAGE_INTERMEDIATE_ROUTES.includes(current));shell.dataset.languagePage=current.replace(/^language-/,'')||'home';}const toolbarTitle=document.querySelector('.quiet-toolbar-title strong'),toolbarKicker=document.querySelector('.quiet-toolbar-title small');if(LANGUAGE_INTERMEDIATE_ROUTES.includes(current)){if(toolbarTitle)toolbarTitle.textContent=current==='language-start-zero'?'Learn the letters':'Level check';if(toolbarKicker)toolbarKicker.textContent=targetLanguage()+' setup';return;}const activeNav=navSpec.find(item=>item[0]===current)||navSpec[0];if(toolbarTitle)toolbarTitle.textContent=languageNavLabel(activeNav);if(toolbarKicker)toolbarKicker.textContent=targetLanguage()+' course';const side=document.querySelector('.quiet-sidebar > nav'),desktop=document.querySelector('.quiet-desktop-tabs'),bottom=document.querySelector('.bottom-nav');if(side)side.innerHTML=sideLanguageNav(current);if(desktop)desktop.innerHTML=sideLanguageNav(current);if(bottom)bottom.innerHTML=bottomLanguageNav(current);}
  function routeAfterCourseSwitch(){if(courseType()!=='language')return'dashboard/overview';const learner=readLearnerState(),student=window.DafatiiCourses.active().membership?.role==='student';if(student&&learner.entryMode&&!learner.onboardingComplete)return learner.entryMode==='zero'?'language-start-zero':'language-level-test';return'language-home';}
  function installCourseChangeRouting(){window.addEventListener('dafatii:coursechanged',()=>{const current=(location.hash||'').replace(/^#\/?/,'').split('/')[0];if(current!=='change-course')return;setTimeout(()=>setHash(routeAfterCourseSwitch()),0);});}
  function installLanguageControlReset(){window.addEventListener('hashchange',()=>{languageControlHiddenFor='';});}
  wrapCourseCreation();installCreateInterceptor();installLanguageEnrollInterceptor();installWorkspaceRoutes();installCourseChangeRouting();installLanguageControlReset();window.DafatiiCourseModes=Object.freeze({courseType,isLanguage,targetLanguage,openTypeChooser,openLanguageEnrollment,languageRoutes:[...LANGUAGE_ROUTES],languageIntermediateRoutes:[...LANGUAGE_INTERMEDIATE_ROUTES],languageChoices:LANGUAGE_CHOICES.map(item=>item[0])});
})();
