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
    en:{home:'Home',letters:'Vocabulary & writing',voice:'Listening & talking',grammar:'Grammar & rules',video:'Watching & reading',examine:'Examining'},
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
  function canManageLanguageContent(){
    return isAdminActor()||['add_content','edit_content','remove_content'].some(permission=>window.DafatiiCourses?.editable?.(permission));
  }
  const languageUid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const learnerKey=courseId=>'dafatii:language-learner:'+String(courseId||window.DafatiiCourses.active().id||'none')+':v1';
  function readLearnerState(courseId){try{const value=JSON.parse(localStorage.getItem(learnerKey(courseId))||'null');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function writeLearnerState(patch,courseId){const next={...readLearnerState(courseId),...patch,updatedAt:Date.now()};localStorage.setItem(learnerKey(courseId),JSON.stringify(next));return next;}
  const LANGUAGE_PAGE_ITEM_TYPES=Object.freeze({
    'language-letters':[
      {id:'word_to_native',label:'Word Flip Card'},
      {id:'image_to_word',label:'Picture Word'},
      {id:'sentence_to_native',label:'Sentence Translation Match'},
      {id:'match_pairs',label:'Pair Matching'},
      {id:'word_builder',label:'Letter Scramble Builder'},
      {id:'fill_blank',label:'Fill the Missing Word'},
      {id:'trace_letter_word',label:'Trace & Write'},
      {id:'spelling_write',label:'Write the Word'},
      {id:'sentence_builder',label:'Build the Sentence'},
      {id:'category_sort',label:'Sort by Category'},
      {id:'paragraph_translate_write',label:'Translate the Paragraph'}
    ],
    'language-voice':[
      {id:'listen_voice_to_text',label:'Hear and Choose the Text'},
      {id:'listen_voice_to_image',label:'Hear and Choose the Image'},
      {id:'listen_voice_to_native_voice',label:'Hear and Pick the Native Audio'},
      {id:'listen_dictation',label:'Type What You Hear'},
      {id:'listen_missing_word',label:'Catch the Missing Word'},
      {id:'speak_voice_to_voice',label:'Listen and Repeat'},
      {id:'speak_text_to_voice',label:'Read Aloud'},
      {id:'speak_image_to_voice',label:'Say What You See'},
      {id:'speak_answer_question',label:'Answer by Voice'},
      {id:'speak_dialogue_roleplay',label:'Dialogue Role-Play'}
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
      {id:'seed-ink-1',type:'word_to_native',word:'Book',meaningEnglish:'Book',meaningArabic:'كتاب'},
      {id:'seed-ink-2',type:'image_to_word',imageUrl:'',choices:['book','pen','desk','door'],answer:'book'},
      {id:'seed-ink-3',type:'sentence_to_native',sentence:'I read a book every day.',choices:['I read a book every day.','I write a letter every day.','I open the door every day.'],answer:'I read a book every day.',wordGlosses:{book:'كتاب',read:'يقرأ'}},
      {id:'seed-ink-4',type:'match_pairs',pairs:[{left:'book',right:'كتاب'},{left:'pen',right:'قلم'},{left:'door',right:'باب'},{left:'desk',right:'مكتب'}]},
      {id:'seed-ink-5',type:'word_builder',word:'book'},
      {id:'seed-ink-6',type:'fill_blank',sentence:'I read a ___ every day.',choices:['book','door','pen'],answer:'book'},
      {id:'seed-ink-7',type:'trace_letter_word',word:'book'},
      {id:'seed-ink-8',type:'spelling_write',word:'book',meaningEnglish:'Book',meaningArabic:'كتاب',imageUrl:''},
      {id:'seed-ink-9',type:'sentence_builder',sourceEnglish:'I read a book.',sourceArabic:'أنا أقرأ كتاباً.',answer:'I read a book.'},
      {id:'seed-ink-10',type:'category_sort',categories:[{name:'School',words:['book','pen']},{name:'Home',words:['door','chair']}]},
      {id:'seed-ink-11',type:'paragraph_translate_write',sourceEnglish:'I wake up early. I read a book before school.',sourceArabic:'أستيقظ مبكراً. أقرأ كتاباً قبل المدرسة.',modelAnswer:'I wake up early. I read a book before school.',acceptedVariants:[],keywords:['wake','early','read','book','school']}
    ];
    pages[loc+'language-voice']=[
      {id:'seed-studio-1',type:'listen_voice_to_text',text:'Good morning',choices:['Good morning','Good evening','Good night'],answer:'Good morning',voiceFileName:''},
      {id:'seed-studio-2',type:'listen_voice_to_image',text:'book',imageChoices:[],answer:'',voiceFileName:''},
      {id:'seed-studio-3',type:'listen_voice_to_native_voice',text:'Good morning',audioChoices:[{label:'Good morning',voiceFileName:''},{label:'Good night',voiceFileName:''}],answer:'Good morning',voiceFileName:''},
      {id:'seed-studio-4',type:'listen_dictation',text:'I read every day.',answer:'I read every day.',voiceFileName:''},
      {id:'seed-studio-5',type:'listen_missing_word',text:'I read a book every day.',sentence:'I read a ___ every day.',choices:['book','pen','door'],answer:'book',voiceFileName:''},
      {id:'seed-studio-6',type:'speak_voice_to_voice',text:'Good morning',answer:'Good morning',voiceFileName:''},
      {id:'seed-studio-7',type:'speak_text_to_voice',text:'I am ready.',answer:'I am ready.'},
      {id:'seed-studio-8',type:'speak_image_to_voice',imageUrl:'',answer:'book'},
      {id:'seed-studio-9',type:'speak_answer_question',question:'What is your name?',answer:'My name is ...',voiceFileName:''},
      {id:'seed-studio-10',type:'speak_dialogue_roleplay',learnerRole:'B',dialogue:[{role:'A',text:'Hello. How are you?'},{role:'B',text:'I am fine, thank you.'},{role:'A',text:'Have a good day.'}]}
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
    return {version:6,targetLanguage:target,levels:[{id:'level-1',name:'Level 1',steps:[{id:'step-1',name:'Step 1',boxes:[{id:'box-1',name:'Box 1'}]}]}],pages,video:{[loc+'language-video']:{title:'Video understanding',prompt:'Write what you understood from this video in your own words.',url:'',storyTitle:'Story reading',storyText:'Add the story text from Content Control.',storyPrompt:'Write what you understood from the story in your own words.'}},intermediate:{
      'language-start-zero':[{id:'seed-letter-a',title:'A a',body:'A is the first starter letter.'},{id:'seed-letter-b',title:'B b',body:'B is the next starter letter.'},{id:'seed-letter-c',title:'C c',body:'C is a simple practice letter.'},{id:'seed-letter-d',title:'D d',body:'D completes this starter sample.'}],
      'language-level-test':[{id:'seed-test-1',title:'Question 1',body:'Choose the sentence that looks correct.',choices:['I am a student.','I student am.','I am student a.','I am student a.']},{id:'seed-test-2',title:'Question 2',body:'Choose the best word: I ___ English every day.',choices:['study','studies','studying am']},{id:'seed-test-3',title:'Question 3',body:'Choose the clearest sentence.',choices:['She went home yesterday.','She go home yesterday.','Yesterday she home go.']},{id:'seed-test-4',title:'Question 4',body:'Choose the best completion: If I have time, I ___ read.',choices:['will','am','was']}]
    }};
  }
  const stringArray=value=>Array.isArray(value)?value.map(item=>String(item)).filter(Boolean):String(value||'').split(/\n+|\s*\|\s*/).map(item=>item.trim()).filter(Boolean);
  const normalizePairs=value=>Array.isArray(value)?value.map(pair=>({left:String(pair?.left||''),right:String(pair?.right||'')})).filter(pair=>pair.left||pair.right):[];
  const normalizeCategories=value=>Array.isArray(value)?value.map(category=>({name:String(category?.name||'Category'),words:stringArray(category?.words)})).filter(category=>category.words.length):[];
  const normalizeDialogue=value=>Array.isArray(value)?value.map(line=>({role:String(line?.role||'A'),text:String(line?.text||'')})).filter(line=>line.text):[];
  const normalizeAudioChoices=value=>Array.isArray(value)?value.map(option=>({label:String(option?.label||option?.text||''),voiceFileName:String(option?.voiceFileName||''),voiceFileId:String(option?.voiceFileId||''),voiceContentType:String(option?.voiceContentType||'')})).filter(option=>option.label||option.voiceFileName):[];
  function normalizeLanguagePageItem(item,page,index){
    const source=item&&typeof item==='object'?item:{},id=String(source.id||languageUid('content'));
    if(page==='language-letters'){
      const legacy={vocabulary:'word_to_native','sentence-vocabulary':'sentence_to_native','image-vocabulary':'image_to_word'},rawType=legacy[source.type]||source.type,type=pageItemType(page,rawType)?.id||'word_to_native';
      const common={id,type};
      if(type==='word_to_native')return{...common,word:String(source.word||source.title||'Word'),meaningEnglish:String(source.meaningEnglish||source.meaning||source.body||''),meaningArabic:String(source.meaningArabic||'')};
      if(type==='image_to_word')return{...common,imageUrl:directImageUrl(source.imageUrl),choices:stringArray(source.choices?.length?source.choices:[source.word].filter(Boolean)),answer:String(source.answer||source.word||'')};
      if(type==='sentence_to_native')return{...common,sentence:String(source.sentence||source.text||source.body||''),choices:stringArray(source.choices),answer:String(source.answer||source.meaningEnglish||''),wordGlosses:source.wordGlosses&&typeof source.wordGlosses==='object'?source.wordGlosses:{}};
      if(type==='match_pairs')return{...common,pairs:normalizePairs(source.pairs)};
      if(type==='word_builder'||type==='trace_letter_word')return{...common,word:String(source.word||source.answer||source.title||'Word')};
      if(type==='fill_blank')return{...common,sentence:String(source.sentence||source.text||source.body||''),choices:stringArray(source.choices),answer:String(source.answer||source.word||'')};
      if(type==='spelling_write')return{...common,word:String(source.word||source.answer||'Word'),meaningEnglish:String(source.meaningEnglish||''),meaningArabic:String(source.meaningArabic||''),imageUrl:directImageUrl(source.imageUrl)};
      if(type==='sentence_builder')return{...common,sourceEnglish:String(source.sourceEnglish||source.meaningEnglish||''),sourceArabic:String(source.sourceArabic||source.meaningArabic||''),answer:String(source.answer||source.sentence||source.text||'')};
      if(type==='category_sort')return{...common,categories:normalizeCategories(source.categories)};
      return{...common,sourceEnglish:String(source.sourceEnglish||source.meaningEnglish||''),sourceArabic:String(source.sourceArabic||source.meaningArabic||''),modelAnswer:String(source.modelAnswer||source.answer||source.text||''),acceptedVariants:stringArray(source.acceptedVariants),keywords:stringArray(source.keywords)};
    }
    if(page==='language-voice'){
      const legacy={'hearing-word':'listen_voice_to_text','hearing-sentence':'listen_voice_to_text','speaking-word':'speak_text_to_voice','speaking-sentence':'speak_text_to_voice'},rawType=legacy[source.type]||source.type,type=pageItemType(page,rawType)?.id||'listen_voice_to_text',base={id,type,text:String(source.text||source.title||source.body||'Practice'),instruction:String(source.instruction||''),voiceFileName:String(source.voiceFileName||''),voiceFileId:String(source.voiceFileId||''),voiceContentType:String(source.voiceContentType||''),answer:String(source.answer||'')};
      if(type==='listen_voice_to_text')return{...base,choices:stringArray(source.choices?.length?source.choices:[source.text].filter(Boolean)),answer:String(source.answer||source.text||'')};
      if(type==='listen_voice_to_image')return{...base,imageChoices:stringArray(source.imageChoices||source.choices),answer:String(source.answer||'')};
      if(type==='listen_voice_to_native_voice')return{...base,audioChoices:normalizeAudioChoices(source.audioChoices),answer:String(source.answer||'')};
      if(type==='listen_dictation')return{...base,answer:String(source.answer||source.text||'')};
      if(type==='listen_missing_word')return{...base,sentence:String(source.sentence||source.body||''),choices:stringArray(source.choices),answer:String(source.answer||'')};
      if(type==='speak_voice_to_voice'||type==='speak_text_to_voice')return{...base,answer:String(source.answer||source.text||'')};
      if(type==='speak_image_to_voice')return{...base,imageUrl:directImageUrl(source.imageUrl),answer:String(source.answer||'')};
      if(type==='speak_answer_question')return{...base,question:String(source.question||source.text||source.title||'Question'),answer:String(source.answer||'')};
      return{...base,learnerRole:String(source.learnerRole||'B'),dialogue:normalizeDialogue(source.dialogue)};
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
    content.version=6;content.pages=content.pages&&typeof content.pages==='object'?content.pages:{};content.video=content.video&&typeof content.video==='object'?content.video:{};
    Object.keys(content.video).forEach(key=>{content.video[key]={...defaultWatchingReadingConfig(),...(content.video[key]&&typeof content.video[key]==='object'?content.video[key]:{})};});
    Object.keys(content.pages).forEach(key=>{
      const page=key.split('|').pop();
      if(page==='language-video'){content.pages[key]=[];content.video[key]={...defaultWatchingReadingConfig(),...(content.video[key]&&typeof content.video[key]==='object'?content.video[key]:{})};return;}
      const items=Array.isArray(content.pages[key])?content.pages[key]:[];
      content.pages[key]=items.map((item,index)=>normalizeLanguagePageItem(item,page,index));
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
  const inkNativeValue=(item,en='meaningEnglish',ar='meaningArabic')=>nativeLanguage()==='Arabic'?String(item[ar]||item[en]||''):String(item[en]||item[ar]||'');
  const shuffled=value=>[...(Array.isArray(value)?value:[])].map(item=>({item,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(entry=>entry.item);
  const nativeSource=item=>nativeLanguage()==='Arabic'?String(item.sourceArabic||item.sourceEnglish||''):String(item.sourceEnglish||item.sourceArabic||'');
  const paperFeedback=()=>'<div class="paper-feedback" data-paper-feedback aria-live="polite"></div>';
  const studioWave=()=>'<div class="studio-wave" aria-hidden="true">'+Array.from({length:13},(_,i)=>'<i style="--wave:'+((i%5)+2)+'"></i>').join('')+'</div>';
  function studioListenControl(item,text,label='Listen'){
    return '<div class="studio-listen-control"><button type="button" class="studio-listen-button" data-studio-listen data-language-voice-file-id="'+esc(item?.voiceFileId||'')+'" data-studio-text="'+esc(text||'')+'"><span class="studio-listen-ring"></span><b>▶</b><strong>'+esc(label)+'</strong></button><div class="studio-listen-meta">'+studioWave()+'<button type="button" data-studio-speed="0.75">0.75×</button><button type="button" class="is-active" data-studio-speed="1">1×</button><small>Played <b data-studio-play-count>0</b> times</small></div></div>';
  }
  function studioMicControl(targetText=''){
    return '<div class="studio-mic-zone"><button type="button" class="studio-mic-button mic-action" data-language-record><span class="studio-mic-ring" data-mic-countdown></span><b>●</b><strong>Open mic</strong></button><div class="studio-mic-level"><i data-mic-level></i></div><div class="voice-record-status" data-language-record-status>Microphone opens only after you press Open mic.</div><div class="studio-live-transcript" data-speech-live data-speech-target="'+esc(targetText)+'"></div><audio class="voice-playback" data-language-record-playback controls hidden></audio></div>';
  }
  function remoteImage(url,alt,klass=''){
    const src=directImageUrl(url);return src?'<img class="'+klass+'" data-language-direct-image src="'+esc(src)+'" alt="'+esc(alt||'')+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"><div class="vocab-image-error" data-language-image-fallback hidden><strong>Image unavailable</strong><small>Check the direct image URL.</small></div>':'<div class="vocab-image-empty"><strong>No image link yet</strong><small>Add a direct image URL from Content Control.</small></div>';
  }
  function splitSentences(text){return String(text||'').split(/(?<=[.!?؟])\s+/).map(value=>value.trim()).filter(Boolean);}
  function renderVocabularyItem(item,index){
    const type=pageItemType('language-letters',item.type)?.id||'word_to_native',number=String(index+1).padStart(2,'0');
    if(type==='word_to_native'){
      const meaning=inkNativeValue(item);
      return '<article class="ink-paper-card ink-flip-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>01 · Word Flip Card</span><b>'+number+'</b></div><button type="button" class="word-flip-card" data-word-flip aria-label="Flip card"><span class="word-flip-inner"><span class="word-flip-face word-flip-front"><i class="gold-corner c1"></i><i class="gold-corner c2"></i><small>Course language</small><strong class="language-auto-text" dir="auto">'+esc(item.word||'Word')+'</strong><em>Tap to reveal</em></span><span class="word-flip-face word-flip-back" dir="'+(nativeLanguage()==='Arabic'?'rtl':'ltr')+'"><small>'+esc(nativeLanguage())+' meaning</small><strong>'+esc(meaning||'Meaning not added')+'</strong><span class="ruled-lines"></span><em>Tap to return</em></span></span></button>'+paperFeedback()+'</article>';
    }
    if(type==='image_to_word'){
      const choices=shuffled(item.choices||[]);
      return '<article class="ink-paper-card picture-word-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>02 · Picture Word</span><b>'+number+'</b></div><figure class="paper-polaroid"><span class="masking-tape"></span>'+remoteImage(item.imageUrl,item.answer||'Picture word','picture-word-image')+'<figcaption>Which word matches this picture?</figcaption></figure><div class="ink-stamp-options">'+choices.map(choice=>'<button type="button" data-paper-choice="'+esc(choice)+'" data-paper-answer="'+esc(item.answer||'')+'"><span class="language-auto-text" dir="auto">'+esc(choice)+'</span></button>').join('')+'</div>'+paperFeedback()+'</article>';
    }
    if(type==='sentence_to_native'){
      const glosses=item.wordGlosses||{},words=String(item.sentence||'').split(/(\s+)/),choices=shuffled(item.choices||[]);
      return '<article class="ink-paper-card sentence-native-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>03 · Sentence Translation Match</span><b>'+number+'</b></div><div class="torn-sentence language-auto-text" dir="auto">'+words.map(word=>{const clean=word.replace(/[^\p{L}\p{N}'-]/gu,'').toLocaleLowerCase(),gloss=glosses[clean]||glosses[word]||'';return gloss?'<button type="button" class="gloss-word" data-word-gloss="'+esc(gloss)+'">'+esc(word)+'</button>':esc(word);}).join('')+'<span class="hand-underline"></span></div><div class="envelope-options">'+choices.map(choice=>'<button type="button" data-paper-choice="'+esc(choice)+'" data-paper-answer="'+esc(item.answer||'')+'"><span dir="auto">'+esc(choice)+'</span></button>').join('')+'</div>'+paperFeedback()+'</article>';
    }
    if(type==='match_pairs'){
      const pairs=item.pairs||[],right=shuffled(pairs.map((pair,i)=>({text:pair.right,index:i})));
      return '<article class="ink-paper-card pair-match-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>04 · Pair Matching</span><b>'+number+'</b></div><div class="pair-board"><svg class="pair-lines" aria-hidden="true"></svg><div class="pair-column">'+pairs.map((pair,i)=>'<button type="button" class="pinned-note" data-pair-left="'+i+'"><i></i><span dir="auto">'+esc(pair.left)+'</span></button>').join('')+'</div><div class="pair-column">'+right.map(pair=>'<button type="button" class="pinned-note native-note" data-pair-right="'+pair.index+'"><i></i><span dir="auto">'+esc(pair.text)+'</span></button>').join('')+'</div></div>'+paperFeedback()+'</article>';
    }
    if(type==='word_builder'){
      const letters=shuffled(Array.from(String(item.word||'')));
      return '<article class="ink-paper-card word-builder-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>05 · Letter Scramble Builder</span><b>'+number+'</b></div><div class="leather-desk"><div class="engraved-slots" data-builder-output aria-label="Word builder"></div><div class="letterpress-tiles">'+letters.map((letter,i)=>'<button type="button" data-builder-letter="'+esc(letter)+'" data-builder-index="'+i+'">'+esc(letter)+'</button>').join('')+'</div><div class="paper-actions"><button type="button" data-builder-reset>Reset</button><button type="button" class="wax-small" data-builder-check="'+esc(item.word||'')+'">Check</button></div></div>'+paperFeedback()+'</article>';
    }
    if(type==='fill_blank'){
      const parts=String(item.sentence||'').split('___'),choices=shuffled(item.choices||[]);
      return '<article class="ink-paper-card fill-blank-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>06 · Fill the Missing Word</span><b>'+number+'</b></div><div class="journal-sheet language-auto-text" dir="auto">'+esc(parts[0]||'')+'<button type="button" class="highlighter-blank" data-fill-slot>________</button>'+esc(parts.slice(1).join('___'))+'</div><div class="sticky-word-bank">'+choices.map(choice=>'<button type="button" data-fill-choice="'+esc(choice)+'" data-fill-answer="'+esc(item.answer||'')+'">'+esc(choice)+'</button>').join('')+'</div>'+paperFeedback()+'</article>';
    }
    if(type==='trace_letter_word'){
      return '<article class="ink-paper-card trace-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>07 · Trace & Write</span><b>'+number+'</b></div><div class="copybook-sheet"><canvas width="900" height="270" data-trace-canvas data-trace-word="'+esc(item.word||'')+'"></canvas><div class="trace-tools"><span>Trace over the dotted guide.</span><button type="button" data-trace-clear>Clear</button><button type="button" class="wax-small" data-trace-check>Score tracing</button></div><div class="trace-score"><span>Accuracy</span><strong data-trace-score>—</strong></div></div>'+paperFeedback()+'</article>';
    }
    if(type==='spelling_write'){
      const prompt=item.imageUrl?'<div class="spelling-image">'+remoteImage(item.imageUrl,item.word||'Word')+'</div>':'<div class="native-prompt" dir="'+(nativeLanguage()==='Arabic'?'rtl':'ltr')+'">'+esc(inkNativeValue(item))+'</div>';
      return '<article class="ink-paper-card spelling-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>08 · Write the Word</span><b>'+number+'</b></div>'+prompt+'<div class="typewriter-sheet"><input type="text" dir="auto" autocomplete="off" data-spelling-input data-spelling-answer="'+esc(item.word||'')+'" placeholder="Type the word…"><span class="ribbon-caret"></span></div><div class="onscreen-keyboard" data-onscreen-keyboard data-keyboard-answer="'+esc(item.word||'')+'"></div><button type="button" class="wax-small" data-spelling-check>Check spelling</button>'+paperFeedback()+'</article>';
    }
    if(type==='sentence_builder'){
      const words=shuffled(String(item.answer||'').split(/\s+/).filter(Boolean));
      return '<article class="ink-paper-card sentence-builder-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>09 · Build the Sentence</span><b>'+number+'</b></div><div class="native-source-card" dir="'+(nativeLanguage()==='Arabic'?'rtl':'ltr')+'">'+esc(nativeSource(item)||'Add the native sentence.')+'</div><div class="corkboard-strip"><div class="sentence-build-output" data-sentence-output></div><div class="magazine-tiles">'+words.map((word,i)=>'<button type="button" data-sentence-word="'+esc(word)+'" data-sentence-index="'+i+'">'+esc(word)+'</button>').join('')+'</div></div><div class="paper-actions"><button type="button" data-sentence-reset>Reset</button><button type="button" class="wax-small" data-sentence-check="'+esc(item.answer||'')+'">Check</button></div>'+paperFeedback()+'</article>';
    }
    if(type==='category_sort'){
      const categories=item.categories||[],cards=shuffled(categories.flatMap(category=>category.words.map(word=>({word,category:category.name}))));
      return '<article class="ink-paper-card category-sort-exercise premium-language-item" data-language-item="'+esc(item.id)+'"><div class="ink-item-head"><span>10 · Sort by Category</span><b>'+number+'</b></div><div class="filing-word-tray">'+cards.map((entry,i)=>'<button type="button" draggable="true" data-sort-word="'+esc(entry.word)+'" data-sort-category="'+esc(entry.category)+'" data-sort-id="'+i+'">'+esc(entry.word)+'</button>').join('')+'</div><div class="filing-drawers">'+categories.map(category=>'<div class="filing-drawer" data-sort-drawer="'+esc(category.name)+'"><div class="brass-label">'+esc(category.name)+'</div><div class="drawer-dropzone"></div></div>').join('')+'</div><button type="button" class="wax-small" data-sort-check>Check drawers</button>'+paperFeedback()+'</article>';
    }
    const source=nativeSource(item),sentences=splitSentences(source),modelSentences=splitSentences(item.modelAnswer),savedKey='dafatii:paragraph-translate:'+String(window.DafatiiCourses.active().id||'none')+':'+item.id;
    return '<article class="ink-paper-card paragraph-translate-exercise premium-language-item" data-language-item="'+esc(item.id)+'" data-paragraph-model="'+esc(item.modelAnswer||'')+'" data-paragraph-variants="'+esc(encodeURIComponent(JSON.stringify(item.acceptedVariants||[])))+'" data-paragraph-keywords="'+esc(encodeURIComponent(JSON.stringify(item.keywords||[])))+'" data-paragraph-save-key="'+esc(savedKey)+'"><div class="ink-item-head"><span>11 · Translate the Paragraph</span><b>'+number+'</b></div><div class="writing-desk-spread"><section class="source-parchment"><span class="paperclip"></span><small>'+esc(nativeLanguage())+' source</small><p dir="'+(nativeLanguage()==='Arabic'?'rtl':'ltr')+'">'+esc(source||'Add the source paragraph.')+'</p></section><section class="manuscript-answer"><div class="paragraph-mode-toggle"><button type="button" class="is-active" data-paragraph-mode="sentences">Sentence by sentence</button><button type="button" data-paragraph-mode="full">Full paragraph</button></div><div data-paragraph-sentence-mode>'+sentences.map((sentence,i)=>'<label><span>'+(i+1)+'. '+esc(sentence)+'</span><textarea rows="3" dir="auto" data-paragraph-sentence="'+i+'" data-model-sentence="'+esc(modelSentences[i]||'')+'"></textarea></label>').join('')+'</div><textarea rows="10" dir="auto" data-paragraph-full hidden placeholder="Write the complete translation…"></textarea><div class="paragraph-meter"><span><i data-keyword-meter></i></span><small><b data-paragraph-word-count>0</b> words · <b data-keyword-label>0%</b> keyword coverage</small></div><div class="paragraph-actions"><button type="button" data-paragraph-hint>Hint</button><button type="button" class="wax-submit" data-paragraph-submit>Submit & review</button></div><div class="paragraph-review" data-paragraph-review hidden></div></section></div>'+paperFeedback()+'</article>';
  }
  function renderVoiceItem(item,index){
    const type=pageItemType('language-voice',item.type)?.id||'listen_voice_to_text',number=String(index+1).padStart(2,'0'),head='<div class="studio-item-head"><span>'+esc(itemTypeLabel('language-voice',type))+'</span><b>'+number+'</b></div>',feedback='<div class="studio-feedback" data-studio-feedback aria-live="polite"></div>';
    if(type==='listen_voice_to_text')return '<article class="midnight-studio-card voice-card listening-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'">'+head+studioListenControl(item,item.text,'Listen')+'<div class="studio-text-options">'+shuffled(item.choices||[]).map(choice=>'<button type="button" data-studio-choice="'+esc(choice)+'" data-studio-answer="'+esc(item.answer||'')+'" dir="auto">'+esc(choice)+'</button>').join('')+'</div>'+feedback+'</article>';
    if(type==='listen_voice_to_image')return '<article class="midnight-studio-card voice-card listening-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'">'+head+studioListenControl(item,item.text,'Listen')+'<div class="studio-image-grid">'+(item.imageChoices||[]).map((url,i)=>'<button type="button" data-studio-image-choice="'+i+'" data-studio-answer="'+esc(item.answer||'')+'"><span class="studio-aperture">'+remoteImage(url,'Listening choice '+(i+1))+'</span><b>'+String.fromCharCode(65+i)+'</b></button>').join('')+'</div>'+feedback+'</article>';
    if(type==='listen_voice_to_native_voice')return '<article class="midnight-studio-card voice-card listening-card mixer-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'">'+head+studioListenControl(item,item.text,'Model')+'<div class="mixer-console">'+(item.audioChoices||[]).map((option,i)=>'<div class="mixer-channel"><div class="mixer-fader"><i></i></div><strong>'+String(i+1).padStart(2,'0')+'</strong><button type="button" class="mini-listen" data-studio-listen data-language-voice-file-id="'+esc(option.voiceFileId||'')+'" data-studio-text="'+esc(option.label||'')+'">▶ Hear</button><button type="button" data-native-audio-choice="'+esc(option.label||'')+'" data-studio-answer="'+esc(item.answer||'')+'" dir="auto">'+esc(option.label||'Option')+'</button></div>').join('')+'</div>'+feedback+'</article>';
    if(type==='listen_dictation')return '<article class="midnight-studio-card voice-card listening-card dictation-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'">'+head+studioListenControl(item,item.text,'Listen')+'<div class="glass-terminal">'+studioWave()+'<textarea rows="4" dir="auto" data-dictation-input placeholder="Type exactly what you hear…"></textarea><button type="button" data-dictation-check="'+esc(item.answer||item.text||'')+'">Check dictation</button></div><div class="neon-diff" data-neon-diff></div>'+feedback+'</article>';
    if(type==='listen_missing_word')return '<article class="midnight-studio-card voice-card listening-card missing-word-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'">'+head+'<div class="karaoke-line" dir="auto">'+esc(String(item.sentence||'').split('___')[0]||'')+'<span data-missing-slot>_____</span>'+esc(String(item.sentence||'').split('___').slice(1).join('___'))+'<i class="karaoke-playhead"></i></div>'+studioListenControl(item,item.text,'Listen')+'<div class="studio-text-options compact">'+shuffled(item.choices||[]).map(choice=>'<button type="button" data-missing-choice="'+esc(choice)+'" data-studio-answer="'+esc(item.answer||'')+'">'+esc(choice)+'</button>').join('')+'</div>'+feedback+'</article>';
    if(type==='speak_voice_to_voice')return '<article class="midnight-studio-card voice-card speaking-card dual-wave-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'" data-speech-target="'+esc(item.answer||item.text||'')+'">'+head+'<div class="dual-waveforms"><div><small>Model</small>'+studioWave()+'</div><div><small>You</small>'+studioWave()+'</div></div>'+studioListenControl(item,item.text,'Model voice')+studioMicControl(item.answer||item.text||'')+feedback+'</article>';
    if(type==='speak_text_to_voice')return '<article class="midnight-studio-card voice-card speaking-card teleprompter-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'" data-speech-target="'+esc(item.answer||item.text||'')+'">'+head+'<div class="teleprompter-text" data-teleprompter dir="auto">'+String(item.text||'').split(/\s+/).map(word=>'<span>'+esc(word)+'</span>').join(' ')+'</div>'+studioMicControl(item.answer||item.text||'')+feedback+'</article>';
    if(type==='speak_image_to_voice')return '<article class="midnight-studio-card voice-card speaking-card speak-image-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'" data-speech-target="'+esc(item.answer||'')+'">'+head+'<div class="studio-aperture-frame">'+remoteImage(item.imageUrl,item.answer||'Speak image')+'<span class="aperture-corners"></span></div>'+studioMicControl(item.answer||'')+feedback+'</article>';
    if(type==='speak_answer_question')return '<article class="midnight-studio-card voice-card speaking-card voice-question-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'" data-speech-target="'+esc(item.answer||'')+'">'+head+'<div class="studio-chat-bubble speaker-bubble"><div class="speaker-avatar">Q</div><p dir="auto">'+esc(item.question||'Question')+'</p>'+(item.voiceFileName||item.voiceFileId?studioListenControl(item,item.question,'Hear question'):'')+'</div><div class="studio-chat-bubble learner-bubble"><span>YOUR ANSWER</span>'+studioMicControl(item.answer||'')+'</div>'+feedback+'</article>';
    const dialogue=item.dialogue||[],role=String(item.learnerRole||'B');
    return '<article class="midnight-studio-card voice-card speaking-card roleplay-card premium-language-item" data-language-item="'+esc(item.id)+'" data-item-type="'+esc(type)+'">'+head+'<div class="podcast-stage"><div class="podcast-avatar model-avatar"><i></i><strong>Partner</strong></div><div class="podcast-avatar learner-avatar"><i></i><strong>You · '+esc(role)+'</strong></div></div><div class="dialogue-script">'+dialogue.map((line,i)=>line.role===role?'<div class="dialogue-turn learner-turn"><small>'+esc(line.role)+' · YOUR TURN</small><p dir="auto">'+esc(line.text)+'</p>'+studioMicControl(line.text)+'</div>':'<div class="dialogue-turn model-turn"><small>'+esc(line.role)+'</small><p dir="auto">'+esc(line.text)+'</p><button type="button" class="mini-listen" data-studio-listen data-studio-text="'+esc(line.text)+'">▶ Listen</button></div>').join('')+'</div>'+feedback+'</article>';
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
  function defaultWatchingReadingConfig(){return{title:'Video understanding',prompt:'Write what you understood from this video in your own words.',url:'',storyTitle:'Story reading',storyText:'Add the story text from Content Control.',storyPrompt:'Write what you understood from the story in your own words.'};}
  function languageVideoConfig(content,loc=currentLocation()){const key=pageKey('language-video',loc);content.video=content.video&&typeof content.video==='object'?content.video:{};return{...defaultWatchingReadingConfig(),...(content.video[key]&&typeof content.video[key]==='object'?content.video[key]:{})};}
  function languageWatchReadNoteKey(kind,loc=currentLocation()){return'dafatii:language-watch-read-note:'+String(window.DafatiiCourses.active().id||'none')+':'+kind+':'+pageKey('language-video',loc);}
  function readLanguageWatchReadNote(kind,loc=currentLocation()){try{if(kind==='video'){const modern=localStorage.getItem(languageWatchReadNoteKey(kind,loc));if(modern!==null)return modern;return localStorage.getItem('dafatii:language-video-note:'+String(window.DafatiiCourses.active().id||'none')+':'+pageKey('language-video',loc))||'';}return localStorage.getItem(languageWatchReadNoteKey(kind,loc))||'';}catch{return'';}}
  function languageResponseEditor(kind,prompt,note){
    const label=kind==='story'?'Reading response':'Video response',placeholder=kind==='story'?'Write the main idea, events, characters, new words, or questions you understood from the story…':'Write the key ideas, vocabulary, examples, or questions you understood from the video…';
    return '<article class="language-video-notes watching-reading-response"><div class="video-note-intro"><div class="video-note-icon">✎</div><div><small>Your understanding</small><h2>'+label+'</h2><p class="language-auto-text" dir="auto">'+esc(prompt)+'</p></div></div><div class="video-note-editor"><div class="video-note-editor-head"><span>Learning response</span><small><b data-language-response-word-count>0</b> words</small></div><textarea rows="10" dir="auto" data-language-response-note data-language-response-kind="'+kind+'" placeholder="'+esc(placeholder)+'">'+esc(note)+'</textarea><div class="video-note-editor-foot"><span data-language-response-status>Private to this browser</span><button type="button" data-language-response-save><span>Save response</span><b>⌘S</b></button></div></div></article>';
  }
  function languageVideoUnderstandingPage(config,loc,index){
    const id=youtubeVideoId(config.url),note=readLanguageWatchReadNote('video',loc),player=id?'<iframe src="https://www.youtube-nocookie.com/embed/'+esc(id)+'" title="'+esc(config.title||'Language video')+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>':'<div class="language-video-placeholder"><div class="language-youtube-mark">▶</div><strong>YouTube video</strong><span>Set the YouTube link from Content Control.</span></div>';
    return '<div class="watch-read-stage watch-read-video-stage" data-watch-read-stage="video"><div class="watch-read-stage-label"><span>01</span><div><small>Watching</small><strong>YouTube video understanding</strong></div></div><div class="language-video-player">'+player+'</div>'+languageResponseEditor('video',config.prompt||defaultWatchingReadingConfig().prompt,note)+'</div>';
  }
  function languageStoryReadingPage(config,loc,index){
    const note=readLanguageWatchReadNote('story',loc),story=String(config.storyText||'').trim()||'Add the story text from Content Control.';
    return '<div class="watch-read-stage watch-read-story-stage" data-watch-read-stage="story"><div class="watch-read-stage-label"><span>02</span><div><small>Reading</small><strong>Story reading & understanding</strong></div></div><article class="story-book-shell"><div class="story-book-spine" aria-hidden="true"></div><div class="story-book-page"><div class="story-book-corner story-book-corner-a" aria-hidden="true">✦</div><div class="story-book-corner story-book-corner-b" aria-hidden="true">✦</div><header class="story-book-header"><span>✧</span><small>A reading from the lesson</small><span>✧</span></header><h2 class="story-book-title language-auto-text" dir="auto">'+esc(config.storyTitle||'Story reading')+'</h2><div class="story-book-rule" aria-hidden="true"><i></i><b>❦</b><i></i></div><div class="story-book-text language-auto-text" dir="auto">'+esc(story).replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>').replace(/^/,'<p>').replace(/$/,'</p>')+'</div><footer class="story-book-footer"><span>❧</span><small>Read slowly · notice meaning · imagine the scene</small><span>☙</span></footer></div></article>'+languageResponseEditor('story',config.storyPrompt||defaultWatchingReadingConfig().storyPrompt,note)+'</div>';
  }
  function languageVideoPage(){
    const content=readLanguageContent(),loc=currentLocation(),learner=readLearnerState(),config=languageVideoConfig(content,loc),index=languagePageIndex('language-video',loc,[0,1]),stage=index===1?languageStoryReadingPage(config,loc,index):languageVideoUnderstandingPage(config,loc,index);
    return '<section class="language-content-page language-video-page watching-reading-page" data-language-content-page="language-video"><header class="language-page-head watching-reading-head"><div><small>Level '+Math.max(1,Number(learner.currentLevel)||1)+' · Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</small><h1>'+esc(routeTitle('language-video'))+'</h1><p>'+esc(targetLanguage())+' · watch, read, understand, respond</p></div><div class="watch-read-counter"><strong>'+(index+1)+'</strong><span>/ 2</span></div></header><div class="language-step-progress watch-read-progress"><span style="width:'+((index+1)*50)+'%"></span></div>'+stage+'<footer class="language-item-navigation watch-read-navigation"><button type="button" class="btn btn-ghost" data-watch-read-prev '+(index===0?'disabled':'')+'>Previous</button><span>'+(index+1)+' / 2</span><button type="button" class="btn btn-primary" data-watch-read-next '+(index===1?'disabled':'')+'>Next</button></footer></section>';
  }

  function languageContentPage(page){
    if(page==='language-video')return languageVideoPage();
    if(page==='language-grammar')return languageGrammarPage();
    const content=readLanguageContent(),loc=currentLocation(),items=itemsFor(content,page,loc),learner=readLearnerState(),index=languagePageIndex(page,loc,items),item=items[index],markup=item?(page==='language-letters'?renderVocabularyItem(item,index):page==='language-voice'?renderVoiceItem(item,index):page==='language-examine'?renderExamItem(item,index):renderGenericLanguageItem(item,index)):'<article class="language-learning-card empty"><div class="language-item-kicker"><span>Content</span><b>00</b></div><h2>No content yet</h2><p class="language-item-prompt">Use Content Control to add a content item.</p></article>';
    return '<section class="language-content-page language-item-process" data-language-content-page="'+esc(page)+'"><header class="language-page-head"><div><small>Level '+Math.max(1,Number(learner.currentLevel)||1)+' · Step '+Math.max(1,Number(learner.currentStep)||1)+' · Box '+Math.max(1,Number(learner.currentBox)||1)+'</small><h1>'+esc(routeTitle(page))+'</h1><p>'+esc(targetLanguage())+' · item '+(items.length?index+1:0)+' of '+items.length+'</p></div></header><div class="language-step-progress"><span style="width:'+Math.round(((index+1)/Math.max(items.length,1))*100)+'%"></span></div>'+markup+'<footer class="language-item-navigation"><button type="button" class="btn btn-ghost" data-language-item-prev '+(index===0?'disabled':'')+'>Previous</button><span>'+(items.length?index+1:0)+' / '+items.length+'</span><button type="button" class="btn btn-primary" data-language-item-next '+(!items.length||index>=items.length-1?'disabled':'')+'>Next</button></footer></section>';
  }
  function intermediatePage(page){const content=readLanguageContent(),items=itemsFor(content,page),learner=readLearnerState(),index=Math.max(0,Math.min(Math.max(items.length-1,0),Number(learner.intermediateIndex)||0)),item=items[index]||{id:'empty',title:'No content yet',body:'Use Content Control to add this process.'},zero=page==='language-start-zero',choices=Array.isArray(item.choices)?item.choices:[];return '<section class="language-intermediate-page" data-language-intermediate="'+esc(page)+'"><div class="language-step-progress"><span style="width:'+Math.round(((index+1)/Math.max(items.length,1))*100)+'%"></span></div><header><small>'+(zero?'Start from zero':'Level check')+' · '+(index+1)+' / '+Math.max(items.length,1)+'</small><h1>'+(zero?'Learn the letters':'Determine your starting level')+'</h1><p>'+(zero?'One letter at a time before Level 1 · Step 1.':'A simple step-by-step English check. No advanced grading rules are connected yet.')+'</p></header><article class="language-process-card"><small>'+esc(item.title||'Step')+'</small><h2>'+esc(item.title||'Step')+'</h2><p>'+esc(item.body||'')+'</p>'+(choices.length?'<div class="language-test-choices">'+choices.map((choice,i)=>'<button type="button" data-language-answer="'+i+'">'+esc(choice)+'</button>').join('')+'</div>':'')+'</article><footer><button type="button" class="btn btn-ghost" data-language-step-prev '+(index===0?'disabled':'')+'>Previous</button>'+(index<items.length-1?'<button type="button" class="btn btn-primary" data-language-step-next>Next</button>':'<button type="button" class="btn btn-primary" data-language-step-finish>'+(zero?'Start Level 1 · Step 1':'Finish level check')+'</button>')+'</footer></section>';}
  let activeLanguageRecorder=null,activeLanguageStream=null,activeLanguageRecordingUrl='',activeLanguageHearingAudio=null,activeLanguageRecognition=null,activeLanguageAudioContext=null,activeLanguageMeterFrame=0;
  function stopLanguageRecorder(){try{if(activeLanguageRecorder&&activeLanguageRecorder.state!=='inactive')activeLanguageRecorder.stop();}catch{}try{activeLanguageRecognition?.stop?.();}catch{}try{activeLanguageStream?.getTracks?.().forEach(track=>track.stop());}catch{}try{cancelAnimationFrame(activeLanguageMeterFrame);}catch{}try{activeLanguageAudioContext?.close?.();}catch{}activeLanguageRecorder=null;activeLanguageStream=null;activeLanguageRecognition=null;activeLanguageAudioContext=null;}
  function stopLanguageHearingAudio(){try{activeLanguageHearingAudio?.pause?.();if(activeLanguageHearingAudio)activeLanguageHearingAudio.src='';}catch{}activeLanguageHearingAudio=null;}
  function playLanguageSpeech(text,status,rate=.86,locale=''){
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){if(status)status.textContent='Speech playback is not supported by this browser.';return;}
    window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text||''));utterance.lang=locale||LANGUAGE_SPEECH_LOCALES[targetLanguage()]||'en-US';utterance.rate=rate;const voices=window.speechSynthesis.getVoices(),base=utterance.lang.split('-')[0].toLowerCase(),voice=voices.find(item=>String(item.lang||'').toLowerCase().startsWith(base));if(voice)utterance.voice=voice;utterance.onstart=()=>{if(status)status.textContent='Playing…';};utterance.onend=()=>{if(status)status.textContent='Ready to replay.';};utterance.onerror=()=>{if(status)status.textContent='Playback could not start.';};window.speechSynthesis.speak(utterance);
  }
  async function playStudioAudio(button){
    const card=button.closest('.voice-card'),status=card?.querySelector('[data-language-speech-status], [data-studio-feedback]'),fileId=String(button.dataset.languageVoiceFileId||''),text=String(button.dataset.studioText||button.dataset.languageSpeak||''),control=button.closest('.studio-listen-control'),speed=Number(control?.querySelector('[data-studio-speed].is-active')?.dataset.studioSpeed||1),count=control?.querySelector('[data-studio-play-count]');
    if(count)count.textContent=String((Number(count.textContent)||0)+1);
    stopLanguageHearingAudio();window.speechSynthesis?.cancel?.();
    if(!fileId){playLanguageSpeech(text,status,speed,button.dataset.nativeAudio==='1'?(nativeLanguage()==='Arabic'?'ar-SA':'en-US'):'');return;}
    if(!window.DafatiiFiles?.getViewUrl){if(status)status.textContent='Imported audio is not available in this browser session.';return;}
    try{if(status)status.textContent='Loading audio…';const url=await window.DafatiiFiles.getViewUrl(fileId),audio=new Audio(url);activeLanguageHearingAudio=audio;audio.preload='auto';audio.playbackRate=speed;audio.onplay=()=>{if(status)status.textContent='Playing…';};audio.onended=()=>{if(activeLanguageHearingAudio===audio)activeLanguageHearingAudio=null;if(status)status.textContent='Ready to replay.';};audio.onerror=()=>{if(status)status.textContent='The audio file could not be played.';};await audio.play();}catch{activeLanguageHearingAudio=null;if(status)status.textContent='The audio file could not be opened.';}
  }
  function startLanguageRecognition(card){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition)return null;
    try{const recognition=new Recognition();recognition.lang=LANGUAGE_SPEECH_LOCALES[targetLanguage()]||'en-US';recognition.continuous=true;recognition.interimResults=true;const target=String(card?.dataset.speechTarget||card?.querySelector('[data-speech-live]')?.dataset.speechTarget||'').trim(),live=card?.querySelector('[data-speech-live]'),teleprompter=card?.querySelector('[data-teleprompter]');
      recognition.onresult=event=>{let transcript='';for(let i=0;i<event.results.length;i++)transcript+=event.results[i][0].transcript+' ';transcript=transcript.trim();if(live){const expected=target.toLocaleLowerCase().split(/\s+/),actual=transcript.toLocaleLowerCase().split(/\s+/);live.innerHTML=actual.map((word,i)=>'<span class="'+(expected[i]===word?'heard-good':'heard-bad')+'">'+esc(word)+'</span>').join(' ');}if(teleprompter){const actual=transcript.toLocaleLowerCase().split(/\s+/);teleprompter.querySelectorAll('span').forEach((span,i)=>{span.classList.toggle('heard-good',actual[i]===span.textContent.toLocaleLowerCase());span.classList.toggle('heard-bad',Boolean(actual[i])&&actual[i]!==span.textContent.toLocaleLowerCase());});}};
      recognition.onerror=()=>{};recognition.start();return recognition;}catch{return null;}
  }
  function startMicMeter(stream,card){
    try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;const ctx=new Context(),source=ctx.createMediaStreamSource(stream),analyser=ctx.createAnalyser(),data=new Uint8Array(analyser.frequencyBinCount);analyser.fftSize=256;source.connect(analyser);activeLanguageAudioContext=ctx;const bar=card?.querySelector('[data-mic-level]'),tick=()=>{analyser.getByteFrequencyData(data);const avg=data.reduce((sum,v)=>sum+v,0)/Math.max(1,data.length);if(bar)bar.style.setProperty('--mic-level',Math.min(100,Math.round(avg*1.4))+'%');activeLanguageMeterFrame=requestAnimationFrame(tick);};tick();}catch{}
  }
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function toggleLanguageRecording(button){
    const card=button.closest('.voice-card, .dialogue-turn'),root=button.closest('.voice-card'),status=card?.querySelector('[data-language-record-status]'),playback=card?.querySelector('[data-language-record-playback]'),countdown=card?.querySelector('[data-mic-countdown]');
    if(button.dataset.recording==='1'){try{activeLanguageRecorder?.stop();}catch{}button.dataset.recording='0';button.classList.remove('is-recording');button.querySelector('strong').textContent='Stop';if(status)status.textContent='Processing your recording…';return;}
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){if(status)status.textContent='Microphone recording is not supported by this browser.';return;}
    stopLanguageRecorder();stopLanguageHearingAudio();if(activeLanguageRecordingUrl){URL.revokeObjectURL(activeLanguageRecordingUrl);activeLanguageRecordingUrl='';}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[],recorder=new MediaRecorder(stream);activeLanguageStream=stream;activeLanguageRecorder=recorder;startMicMeter(stream,card);
      for(let n=3;n>=1;n--){if(countdown)countdown.textContent=String(n);if(status)status.textContent='Get ready… '+n;await wait(450);}if(countdown)countdown.textContent='';
      activeLanguageRecognition=startLanguageRecognition(root||card);
      recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
      recorder.onstop=()=>{try{activeLanguageRecognition?.stop?.();}catch{}const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});activeLanguageRecordingUrl=URL.createObjectURL(blob);if(playback){playback.src=activeLanguageRecordingUrl;playback.hidden=false;}stream.getTracks().forEach(track=>track.stop());try{cancelAnimationFrame(activeLanguageMeterFrame);}catch{}try{activeLanguageAudioContext?.close?.();}catch{}activeLanguageStream=null;activeLanguageRecorder=null;activeLanguageRecognition=null;activeLanguageAudioContext=null;button.dataset.recording='0';button.classList.remove('is-recording');button.querySelector('strong').textContent='Retry';if(status)status.textContent='Recording ready. Play it back and compare.';};
      recorder.start();button.dataset.recording='1';button.classList.add('is-recording');button.querySelector('strong').textContent='Stop';if(status)status.textContent='Recording…';}
    catch(error){button.dataset.recording='0';button.classList.remove('is-recording');if(status)status.textContent=error?.name==='NotAllowedError'?'Microphone permission was not granted.':'The microphone could not be opened.';}
  }
  const normalizedAnswer=value=>String(value||'').toLocaleLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
  function similarity(a,b){a=normalizedAnswer(a);b=normalizedAnswer(b);if(!a&&!b)return 1;if(!a||!b)return 0;const rows=b.length+1,cols=a.length+1,prev=Array.from({length:cols},(_,i)=>i),curr=new Array(cols);for(let r=1;r<rows;r++){curr[0]=r;for(let c=1;c<cols;c++)curr[c]=Math.min(curr[c-1]+1,prev[c]+1,prev[c-1]+(a[c-1]===b[r-1]?0:1));for(let c=0;c<cols;c++)prev[c]=curr[c];}return 1-prev[a.length]/Math.max(a.length,b.length);}
  function setExerciseFeedback(card,message,correct=false){const box=card?.querySelector('[data-paper-feedback], [data-studio-feedback]');if(box){box.textContent=message;box.classList.toggle('is-correct',correct);box.classList.toggle('is-wrong',!correct);}}
  function drawPairMatch(card,left,right){const svg=card?.querySelector('.pair-lines'),board=card?.querySelector('.pair-board');if(!svg||!board)return;const br=board.getBoundingClientRect(),a=left.getBoundingClientRect(),b=right.getBoundingClientRect(),x1=a.right-br.left,y1=a.top+a.height/2-br.top,x2=b.left-br.left,y2=b.top+b.height/2-br.top;svg.insertAdjacentHTML('beforeend','<path d="M'+x1+' '+y1+' C '+(x1+60)+' '+y1+', '+(x2-60)+' '+y2+', '+x2+' '+y2+'" />');}
  function setupTraceCanvas(card){
    const canvas=card.querySelector('[data-trace-canvas]');if(!canvas)return;const ctx=canvas.getContext('2d'),word=canvas.dataset.traceWord||'',target=document.createElement('canvas');target.width=canvas.width;target.height=canvas.height;const tctx=target.getContext('2d');
    const drawGuide=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.font='700 150px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.setLineDash([3,9]);ctx.lineWidth=2;ctx.strokeStyle='rgba(27,42,65,.24)';ctx.strokeText(word,canvas.width/2,canvas.height/2);ctx.restore();};drawGuide();
    tctx.font='700 150px Georgia, serif';tctx.textAlign='center';tctx.textBaseline='middle';tctx.fillStyle='#000';tctx.fillText(word,target.width/2,target.height/2);
    const user=document.createElement('canvas');user.width=canvas.width;user.height=canvas.height;const uctx=user.getContext('2d');uctx.lineCap='round';uctx.lineJoin='round';uctx.lineWidth=18;uctx.strokeStyle='#172033';let drawing=false,last=null;
    const pos=e=>{const r=canvas.getBoundingClientRect(),p=e.touches?.[0]||e;return{x:(p.clientX-r.left)*canvas.width/r.width,y:(p.clientY-r.top)*canvas.height/r.height};},start=e=>{e.preventDefault();drawing=true;last=pos(e);},move=e=>{if(!drawing)return;e.preventDefault();const p=pos(e);uctx.beginPath();uctx.moveTo(last.x,last.y);uctx.lineTo(p.x,p.y);uctx.stroke();ctx.save();ctx.setLineDash([]);ctx.lineCap='round';ctx.lineWidth=8;ctx.strokeStyle='#1B2A41';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();last=p;},end=()=>{drawing=false;};
    canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',end);
    card.querySelector('[data-trace-clear]')?.addEventListener('click',()=>{uctx.clearRect(0,0,user.width,user.height);drawGuide();card.querySelector('[data-trace-score]').textContent='—';});
    card.querySelector('[data-trace-check]')?.addEventListener('click',()=>{const ta=tctx.getImageData(0,0,target.width,target.height).data,ua=uctx.getImageData(0,0,user.width,user.height).data;let targetPx=0,overlap=0,userPx=0;for(let i=3;i<ta.length;i+=4){if(ta[i]>20)targetPx++;if(ua[i]>20){userPx++;if(ta[i]>20)overlap++;}}const recall=overlap/Math.max(1,targetPx),precision=overlap/Math.max(1,userPx),score=Math.round(100*(2*recall*precision/Math.max(.001,recall+precision)));card.querySelector('[data-trace-score]').textContent=score+'%';setExerciseFeedback(card,score>=60?'Gold seal earned — strong tracing.':'Keep tracing closer to the dotted letter shapes.',score>=60);});
  }
  function setupInkPaperExercises(){
    document.querySelectorAll('[data-word-flip]').forEach(button=>button.addEventListener('click',()=>button.classList.toggle('is-flipped')));
    document.querySelectorAll('[data-paper-choice]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.ink-paper-card'),correct=normalizedAnswer(button.dataset.paperChoice)===normalizedAnswer(button.dataset.paperAnswer);button.classList.add(correct?'is-correct':'is-wrong');if(!correct)button.classList.add('is-crumpled');setExerciseFeedback(card,correct?'Correct — gold foil earned.':'Not quite. Try another option.',correct);}));
    document.querySelectorAll('[data-word-gloss]').forEach(button=>button.addEventListener('click',()=>{let tip=button.querySelector('.word-gloss-tip');if(!tip){tip=document.createElement('span');tip.className='word-gloss-tip';tip.textContent=button.dataset.wordGloss||'';button.appendChild(tip);}tip.hidden=!tip.hidden;}));
    document.querySelectorAll('.pair-match-exercise').forEach(card=>{let left=null;card.querySelectorAll('[data-pair-left]').forEach(button=>button.addEventListener('click',()=>{card.querySelectorAll('[data-pair-left]').forEach(x=>x.classList.remove('is-selected'));left=button;button.classList.add('is-selected');}));card.querySelectorAll('[data-pair-right]').forEach(button=>button.addEventListener('click',()=>{if(!left)return;const correct=left.dataset.pairLeft===button.dataset.pairRight;if(correct){left.classList.add('is-matched');button.classList.add('is-matched');drawPairMatch(card,left,button);left=null;setExerciseFeedback(card,'Pair connected with ink.',true);}else{button.classList.add('is-wrong');setTimeout(()=>button.classList.remove('is-wrong'),450);setExerciseFeedback(card,'Those notes do not match yet.',false);}}));});
    document.querySelectorAll('.word-builder-exercise').forEach(card=>{const out=card.querySelector('[data-builder-output]'),tiles=[...card.querySelectorAll('[data-builder-letter]')];const update=()=>{out.innerHTML=tiles.filter(t=>t.disabled).map(t=>'<span>'+esc(t.dataset.builderLetter)+'</span>').join('');};tiles.forEach(tile=>tile.addEventListener('click',()=>{tile.disabled=true;update();}));card.querySelector('[data-builder-reset]')?.addEventListener('click',()=>{tiles.forEach(t=>t.disabled=false);update();});card.querySelector('[data-builder-check]')?.addEventListener('click',event=>{const actual=tiles.filter(t=>t.disabled).map(t=>t.dataset.builderLetter).join(''),correct=normalizedAnswer(actual)===normalizedAnswer(event.currentTarget.dataset.builderCheck);setExerciseFeedback(card,correct?'The letterpress word is correct.':'Rearrange the tiles and try again.',correct);});update();});
    document.querySelectorAll('[data-fill-choice]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.fill-blank-exercise'),slot=card.querySelector('[data-fill-slot]'),correct=normalizedAnswer(button.dataset.fillChoice)===normalizedAnswer(button.dataset.fillAnswer);if(correct){slot.textContent=button.dataset.fillChoice;slot.classList.add('is-correct');button.classList.add('is-correct');setExerciseFeedback(card,'The missing word fits.',true);}else{button.classList.add('bounce-back');setTimeout(()=>button.classList.remove('bounce-back'),500);setExerciseFeedback(card,'That sticky note bounces back.',false);}}));
    document.querySelectorAll('.trace-exercise').forEach(setupTraceCanvas);
    document.querySelectorAll('.spelling-exercise').forEach(card=>{const input=card.querySelector('[data-spelling-input]'),keyboard=card.querySelector('[data-onscreen-keyboard]'),answer=keyboard?.dataset.keyboardAnswer||'',chars=[...new Set(Array.from(answer+'abcdefghijklmnopqrstuvwxyzابتثجحخدذرزسشصضطظعغفقكلمنهوي'))].filter(ch=>ch.trim()).slice(0,40);if(keyboard)keyboard.innerHTML=chars.map(ch=>'<button type="button">'+esc(ch)+'</button>').join('');keyboard?.querySelectorAll('button').forEach(key=>key.addEventListener('click',()=>{input.value+=key.textContent;input.focus();}));card.querySelector('[data-spelling-check]')?.addEventListener('click',()=>{const correct=normalizedAnswer(input.value)===normalizedAnswer(input.dataset.spellingAnswer);input.classList.toggle('is-correct',correct);setExerciseFeedback(card,correct?'Correct spelling — typed in ink.':'Check the letters and try again.',correct);});});
    document.querySelectorAll('.sentence-builder-exercise').forEach(card=>{const output=card.querySelector('[data-sentence-output]'),tiles=[...card.querySelectorAll('[data-sentence-word]')];const update=()=>{output.innerHTML=tiles.filter(t=>t.disabled).map(t=>'<span>'+esc(t.dataset.sentenceWord)+'</span>').join(' ');};tiles.forEach(tile=>tile.addEventListener('click',()=>{tile.disabled=true;update();}));card.querySelector('[data-sentence-reset]')?.addEventListener('click',()=>{tiles.forEach(t=>t.disabled=false);update();});card.querySelector('[data-sentence-check]')?.addEventListener('click',event=>{const actual=tiles.filter(t=>t.disabled).map(t=>t.dataset.sentenceWord).join(' '),correct=normalizedAnswer(actual)===normalizedAnswer(event.currentTarget.dataset.sentenceCheck);output.classList.toggle('is-complete',correct);setExerciseFeedback(card,correct?'Sentence complete — banner sealed.':'Reorder the clippings.',correct);});update();});
    document.querySelectorAll('.category-sort-exercise').forEach(card=>{let dragged=null;card.querySelectorAll('[data-sort-word]').forEach(word=>{word.addEventListener('dragstart',()=>dragged=word);word.addEventListener('click',()=>{dragged=word;word.classList.toggle('is-picked');});});card.querySelectorAll('[data-sort-drawer]').forEach(drawer=>{drawer.addEventListener('dragover',e=>e.preventDefault());drawer.addEventListener('drop',e=>{e.preventDefault();if(dragged)drawer.querySelector('.drawer-dropzone').appendChild(dragged);dragged=null;});drawer.addEventListener('click',()=>{if(dragged){drawer.querySelector('.drawer-dropzone').appendChild(dragged);dragged.classList.remove('is-picked');dragged=null;}});});card.querySelector('[data-sort-check]')?.addEventListener('click',()=>{const words=[...card.querySelectorAll('[data-sort-word]')],correct=words.every(word=>word.closest('[data-sort-drawer]')?.dataset.sortDrawer===word.dataset.sortCategory);words.forEach(word=>word.classList.toggle('is-correct',word.closest('[data-sort-drawer]')?.dataset.sortDrawer===word.dataset.sortCategory));setExerciseFeedback(card,correct?'Every card is filed correctly.':'Some cards belong in a different drawer.',correct);});});
    document.querySelectorAll('.paragraph-translate-exercise').forEach(card=>{const sentenceMode=card.querySelector('[data-paragraph-sentence-mode]'),full=card.querySelector('[data-paragraph-full]'),modeButtons=[...card.querySelectorAll('[data-paragraph-mode]')],fields=[...card.querySelectorAll('[data-paragraph-sentence]')],count=card.querySelector('[data-paragraph-word-count]'),meter=card.querySelector('[data-keyword-meter]'),label=card.querySelector('[data-keyword-label]'),key=card.dataset.paragraphSaveKey,keywords=JSON.parse(decodeURIComponent(card.dataset.paragraphKeywords||'%5B%5D'));const load=()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){fields.forEach((field,i)=>field.value=saved.sentences?.[i]||'');full.value=saved.full||'';}}catch{}},save=()=>{try{localStorage.setItem(key,JSON.stringify({sentences:fields.map(f=>f.value),full:full.value}));}catch{}},combined=()=>full.hidden?fields.map(f=>f.value).join(' '):full.value,update=()=>{const text=combined(),words=text.trim().match(/\S+/g)||[],norm=normalizedAnswer(text),hit=keywords.filter(k=>norm.includes(normalizedAnswer(k))).length,pct=keywords.length?Math.round(hit/keywords.length*100):100;if(count)count.textContent=String(words.length);if(meter)meter.style.width=pct+'%';if(label)label.textContent=pct+'%';save();};modeButtons.forEach(btn=>btn.addEventListener('click',()=>{const useFull=btn.dataset.paragraphMode==='full';modeButtons.forEach(b=>b.classList.toggle('is-active',b===btn));sentenceMode.hidden=useFull;full.hidden=!useFull;if(useFull&&!full.value)full.value=fields.map(f=>f.value).join(' ');update();}));[...fields,full].forEach(field=>field.addEventListener('input',update));card.querySelector('[data-paragraph-hint]')?.addEventListener('click',()=>{const model=card.dataset.paragraphModel||'',review=card.querySelector('[data-paragraph-review]');review.hidden=false;review.innerHTML='<small>Hint</small><p>'+esc(model.split(/\s+/).slice(0,Math.min(6,model.split(/\s+/).length)).join(' '))+'…</p>';});card.querySelector('[data-paragraph-submit]')?.addEventListener('click',()=>{const actual=combined(),model=card.dataset.paragraphModel||'',variants=JSON.parse(decodeURIComponent(card.dataset.paragraphVariants||'%5B%5D')),candidates=[model,...variants].filter(Boolean),best=candidates.reduce((score,candidate)=>Math.max(score,similarity(actual,candidate)),0),pct=Math.round(best*100),review=card.querySelector('[data-paragraph-review]'),expected=normalizedAnswer(model).split(' '),got=normalizedAnswer(actual).split(' ');review.hidden=false;review.innerHTML='<div class="wax-result '+(pct>=75?'is-good':'')+'"><strong>'+pct+'%</strong><span>'+(pct>=75?'Wax seal earned':'Review the ink marks')+'</span></div><div class="word-diff">'+got.map((word,i)=>'<span class="'+(expected[i]===word?'diff-good':'diff-problem')+'">'+esc(word)+'</span>').join(' ')+'</div>';setExerciseFeedback(card,pct>=75?'Translation is close to the model.':'Review the highlighted problem words.',pct>=75);});load();update();});
  }
  function setupStudioExercises(){
    document.querySelectorAll('[data-studio-speed]').forEach(button=>button.addEventListener('click',()=>{button.parentElement.querySelectorAll('[data-studio-speed]').forEach(b=>b.classList.remove('is-active'));button.classList.add('is-active');}));
    document.querySelectorAll('[data-studio-listen]').forEach(button=>button.addEventListener('click',()=>playStudioAudio(button)));
    document.querySelectorAll('[data-language-record]').forEach(button=>button.addEventListener('click',()=>toggleLanguageRecording(button)));
    document.querySelectorAll('[data-studio-choice]').forEach(button=>button.addEventListener('click',()=>{const correct=normalizedAnswer(button.dataset.studioChoice)===normalizedAnswer(button.dataset.studioAnswer);button.classList.add(correct?'is-correct':'is-wrong');setExerciseFeedback(button.closest('.voice-card'),correct?'Correct text selected.':'Listen again and compare.',correct);}));
    document.querySelectorAll('[data-studio-image-choice]').forEach(button=>button.addEventListener('click',()=>{const correct=String(Number(button.dataset.studioImageChoice)+1)===String(button.dataset.studioAnswer)||String(button.dataset.studioImageChoice)===String(button.dataset.studioAnswer);button.classList.add(correct?'is-correct':'is-wrong');setExerciseFeedback(button.closest('.voice-card'),correct?'Correct image — cyan lock.':'That image does not match the audio.',correct);}));
    document.querySelectorAll('[data-native-audio-choice]').forEach(button=>button.addEventListener('click',()=>{const correct=normalizedAnswer(button.dataset.nativeAudioChoice)===normalizedAnswer(button.dataset.studioAnswer);button.closest('.mixer-channel')?.classList.add(correct?'is-correct':'is-wrong');setExerciseFeedback(button.closest('.voice-card'),correct?'Correct channel selected.':'Compare the native clips again.',correct);}));
    document.querySelectorAll('[data-dictation-check]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.voice-card'),input=card.querySelector('[data-dictation-input]'),expected=button.dataset.dictationCheck||'',actual=input.value,score=similarity(actual,expected),a=normalizedAnswer(actual).split(' '),e=normalizedAnswer(expected).split(' '),diff=card.querySelector('[data-neon-diff]');diff.innerHTML=a.map((word,i)=>'<span class="'+(e[i]===word?'diff-good':'diff-problem')+'">'+esc(word)+'</span>').join(' ');setExerciseFeedback(card,score>=.85?'Excellent dictation.':'Replay and inspect the neon underline.',score>=.85);}));
    document.querySelectorAll('[data-missing-choice]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.voice-card'),correct=normalizedAnswer(button.dataset.missingChoice)===normalizedAnswer(button.dataset.studioAnswer),slot=card.querySelector('[data-missing-slot]');if(correct){slot.textContent=button.dataset.missingChoice;slot.classList.add('is-correct');}button.classList.add(correct?'is-correct':'is-wrong');setExerciseFeedback(card,correct?'You caught the missing word.':'Listen for the missing sound again.',correct);}));
  }
  function bindLanguagePage(page){
    document.querySelectorAll('[data-language-direct-image]').forEach(image=>{const fail=()=>{image.hidden=true;image.parentElement?.querySelector('[data-language-image-fallback]')?.removeAttribute('hidden');};image.addEventListener('error',fail,{once:true});if(image.complete&&!image.naturalWidth)fail();});
    document.querySelector('[data-language-continue]')?.addEventListener('click',event=>setHash(event.currentTarget.dataset.languageContinue));
    if(page==='language-video'){const loc=currentLocation(),area=document.querySelector('[data-language-response-note]'),status=document.querySelector('[data-language-response-status]'),count=document.querySelector('[data-language-response-word-count]'),kind=String(area?.dataset.languageResponseKind||'video'),save=()=>{try{localStorage.setItem(languageWatchReadNoteKey(kind,loc),area?.value||'');if(status)status.textContent='Saved on this device';}catch{if(status)status.textContent='Could not save this response';}},update=()=>{if(count)count.textContent=String((String(area?.value||'').trim().match(/\S+/g)||[]).length);};document.querySelector('[data-language-response-save]')?.addEventListener('click',save);area?.addEventListener('input',()=>{update();if(status)status.textContent='Unsaved changes';});area?.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save();}});document.querySelector('[data-watch-read-prev]')?.addEventListener('click',()=>{save();setLanguagePageIndex('language-video',loc,0);render();});document.querySelector('[data-watch-read-next]')?.addEventListener('click',()=>{save();setLanguagePageIndex('language-video',loc,1);render();});update();return;}
    if(page==='language-grammar'){
      document.querySelectorAll('[data-grammar-training-check]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.grammar-training-card'),input=card?.querySelector('[data-grammar-training-input]'),feedback=card?.querySelector('.grammar-training-feedback'),expected=String(button.dataset.grammarTrainingCheck||'').trim().toLocaleLowerCase(),actual=String(input?.value||'').trim().toLocaleLowerCase();if(feedback)feedback.textContent=!expected?'Answer recorded for self-review.':actual&&actual===expected?'Correct.':'Not yet. Review the rule and try again.';}));
      const focus=readLearnerState().grammarFocusItem;if(focus)setTimeout(()=>document.getElementById('language-item-'+focus)?.scrollIntoView({behavior:'smooth',block:'center'}),0);return;
    }
    if(LANGUAGE_ROUTES.includes(page)&&page!=='language-home'){
      const content=readLanguageContent(),loc=currentLocation(),items=itemsFor(content,page,loc),index=languagePageIndex(page,loc,items);
      document.querySelector('[data-language-item-prev]')?.addEventListener('click',()=>{stopLanguageRecorder();stopLanguageHearingAudio();setLanguagePageIndex(page,loc,index-1);render();});
      document.querySelector('[data-language-item-next]')?.addEventListener('click',()=>{stopLanguageRecorder();stopLanguageHearingAudio();setLanguagePageIndex(page,loc,index+1);render();});
      if(page==='language-letters')setupInkPaperExercises();
      if(page==='language-voice')setupStudioExercises();
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
  function itemDisplayName(page,item){if(page==='language-letters')return item.word||item.sentence||item.sourceEnglish||item.sourceArabic||itemTypeLabel(page,item.type)||'Vocabulary & writing';if(page==='language-voice')return item.text||item.question||itemTypeLabel(page,item.type)||'Listening & speaking';return item.title||itemTypeLabel(page,item.type)||'Untitled';}
  function itemChoices(items,page){return items.length?'<div class="language-control-items">'+items.map((item,index)=>'<label><input type="radio" name="languageItem" value="'+esc(item.id)+'" '+(index===0?'checked':'')+'><span><strong>'+esc(itemDisplayName(page,item))+'</strong><small>'+esc(itemTypeLabel(page,item.type))+'</small></span></label>').join('')+'</div>':'<p class="auth-note">No content items exist at this location.</p>';}
  function openLanguageControl(page){
    const importAction='<button type="button" data-language-control-action="import"><strong>Import content</strong><span>Import the language content Excel workbook</span></button>',voiceImportAction='<button type="button" data-language-control-action="import-voice"><strong>Import voice files</strong><span>Upload a ZIP and match hearing audio by voice file name</span></button>';
    const video=page==='language-video',actions=video?'<button type="button" data-language-control-action="access"><strong>Access page</strong><span>Return to Watching & Reading</span></button><button type="button" data-language-control-action="edit"><strong>Edit Watching & Reading</strong><span>Edit the YouTube page and the story reading page</span></button>'+importAction+voiceImportAction:'<button type="button" data-language-control-action="access"><strong>Access content</strong><span>Open or focus one content item</span></button><button type="button" data-language-control-action="add"><strong>Add content</strong><span>Add a page-specific content item or structure</span></button><button type="button" data-language-control-action="edit"><strong>Edit content</strong><span>Edit an item or delete it from its edit form</span></button>'+importAction+voiceImportAction;
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
    const lines=value=>Array.isArray(value)?value.join('\n'):'';
    if(page==='language-letters'){
      const pairs=Array.isArray(item.pairs)?item.pairs.map(pair=>pair.left+' | '+pair.right).join('\n'):'',categories=Array.isArray(item.categories)?item.categories.map(category=>category.name+': '+category.words.join(', ')).join('\n'):'',glosses=item.wordGlosses&&typeof item.wordGlosses==='object'?Object.entries(item.wordGlosses).map(([word,meaning])=>word+' | '+meaning).join('\n'):'';
      return languageTypeSelect(page,item.type||'word_to_native')
        +'<div class="field" data-language-types="word_to_native,word_builder,trace_letter_word,spelling_write"><label>Word</label><input name="word" dir="auto" maxlength="220" value="'+esc(item.word||'')+'"></div>'
        +'<div class="language-editor-pair" data-language-types="word_to_native,spelling_write"><div class="field"><label>Meaning in English</label><textarea name="meaningEnglish" dir="ltr" rows="3" maxlength="1000">'+esc(item.meaningEnglish||'')+'</textarea></div><div class="field"><label>Meaning in Arabic</label><textarea name="meaningArabic" dir="rtl" rows="3" maxlength="1000">'+esc(item.meaningArabic||'')+'</textarea></div></div>'
        +'<div class="field" data-language-types="image_to_word,spelling_write"><label>Direct image URL</label><input name="imageUrl" type="url" inputmode="url" maxlength="1400" value="'+esc(item.imageUrl||'')+'" placeholder="https://example.com/image.jpg"></div>'
        +'<div class="field" data-language-types="sentence_to_native,fill_blank"><label>Sentence</label><textarea name="sentence" dir="auto" rows="4" maxlength="1600">'+esc(item.sentence||'')+'</textarea></div>'
        +'<div class="field" data-language-types="image_to_word,sentence_to_native,fill_blank"><label>Choices — one per line</label><textarea name="choices" dir="auto" rows="6" maxlength="2400">'+esc(lines(item.choices))+'</textarea></div>'
        +'<div class="field" data-language-types="image_to_word,sentence_to_native,fill_blank,sentence_builder"><label>Correct answer</label><textarea name="answer" dir="auto" rows="3" maxlength="1600">'+esc(item.answer||'')+'</textarea></div>'
        +'<div class="field" data-language-types="sentence_to_native"><label>Word tooltips — one per line: word | native meaning</label><textarea name="wordGlosses" dir="auto" rows="5" maxlength="3000">'+esc(glosses)+'</textarea></div>'
        +'<div class="field" data-language-types="match_pairs"><label>Pairs — one per line: course word | native meaning</label><textarea name="pairs" dir="auto" rows="8" maxlength="5000">'+esc(pairs)+'</textarea></div>'
        +'<div class="language-editor-pair" data-language-types="sentence_builder,paragraph_translate_write"><div class="field"><label>Source in English</label><textarea name="sourceEnglish" dir="ltr" rows="5" maxlength="5000">'+esc(item.sourceEnglish||'')+'</textarea></div><div class="field"><label>Source in Arabic</label><textarea name="sourceArabic" dir="rtl" rows="5" maxlength="5000">'+esc(item.sourceArabic||'')+'</textarea></div></div>'
        +'<div class="field" data-language-types="category_sort"><label>Categories — Category: word, word</label><textarea name="categories" dir="auto" rows="8" maxlength="5000">'+esc(categories)+'</textarea></div>'
        +'<div class="field" data-language-types="paragraph_translate_write"><label>Model translation</label><textarea name="modelAnswer" dir="auto" rows="7" maxlength="9000">'+esc(item.modelAnswer||'')+'</textarea></div>'
        +'<div class="field" data-language-types="paragraph_translate_write"><label>Accepted variants — one full variant per line</label><textarea name="acceptedVariants" dir="auto" rows="5" maxlength="9000">'+esc(lines(item.acceptedVariants))+'</textarea></div>'
        +'<div class="field" data-language-types="paragraph_translate_write"><label>Keywords — comma or line separated</label><textarea name="keywords" dir="auto" rows="4" maxlength="3000">'+esc(lines(item.keywords))+'</textarea></div>';
    }
    if(page==='language-voice'){
      const audioChoices=Array.isArray(item.audioChoices)?item.audioChoices.map(option=>option.label+' | '+option.voiceFileName).join('\n'):'',dialogue=Array.isArray(item.dialogue)?item.dialogue.map(line=>line.role+' | '+line.text).join('\n'):'';
      return languageTypeSelect(page,item.type||'listen_voice_to_text')
        +'<div class="field" data-language-types="listen_voice_to_text,listen_voice_to_image,listen_voice_to_native_voice,listen_dictation,listen_missing_word,speak_voice_to_voice,speak_text_to_voice"><label>Course-language text / model phrase</label><textarea name="text" dir="auto" rows="3" maxlength="1800">'+esc(item.text||'')+'</textarea></div>'
        +'<div class="field" data-language-types="listen_voice_to_text,listen_voice_to_image,listen_voice_to_native_voice,listen_dictation,listen_missing_word,speak_voice_to_voice,speak_answer_question"><label>Model voice file name</label><input name="voiceFileName" maxlength="260" value="'+esc(item.voiceFileName||'')+'" placeholder="lesson-audio.mp3"><small class="auth-note">'+(item.voiceFileId?'A matched uploaded voice file is active.':'If blank or unmatched, Dafatii uses browser speech where possible.')+'</small></div>'
        +'<div class="field" data-language-types="listen_voice_to_text,listen_missing_word"><label>Choices — one per line</label><textarea name="choices" dir="auto" rows="6" maxlength="2600">'+esc(lines(item.choices))+'</textarea></div>'
        +'<div class="field" data-language-types="listen_voice_to_image"><label>Image choices — one direct URL per line</label><textarea name="imageChoices" dir="ltr" rows="6" maxlength="6000">'+esc(lines(item.imageChoices))+'</textarea></div>'
        +'<div class="field" data-language-types="listen_voice_to_native_voice"><label>Native audio options — one per line: label | voice filename</label><textarea name="audioChoices" dir="auto" rows="7" maxlength="6000">'+esc(audioChoices)+'</textarea></div>'
        +'<div class="field" data-language-types="listen_missing_word"><label>Transcript with ___ for the missing word</label><textarea name="sentence" dir="auto" rows="4" maxlength="1800">'+esc(item.sentence||'')+'</textarea></div>'
        +'<div class="field" data-language-types="listen_voice_to_text,listen_voice_to_image,listen_voice_to_native_voice,listen_dictation,listen_missing_word,speak_voice_to_voice,speak_text_to_voice,speak_image_to_voice,speak_answer_question"><label>Correct / expected answer</label><textarea name="answer" dir="auto" rows="3" maxlength="1800">'+esc(item.answer||'')+'</textarea></div>'
        +'<div class="field" data-language-types="speak_image_to_voice"><label>Direct image URL</label><input name="imageUrl" type="url" inputmode="url" maxlength="1400" value="'+esc(item.imageUrl||'')+'"></div>'
        +'<div class="field" data-language-types="speak_answer_question"><label>Question</label><textarea name="question" dir="auto" rows="4" maxlength="1800">'+esc(item.question||'')+'</textarea></div>'
        +'<div class="field" data-language-types="speak_dialogue_roleplay"><label>Learner role</label><input name="learnerRole" maxlength="30" value="'+esc(item.learnerRole||'B')+'" placeholder="B"></div>'
        +'<div class="field" data-language-types="speak_dialogue_roleplay"><label>Dialogue — one per line: role | text</label><textarea name="dialogue" dir="auto" rows="10" maxlength="9000">'+esc(dialogue)+'</textarea></div>';
    }
    if(page==='language-grammar')return languageTypeSelect(page,item.type||'grammar-law')+'<div class="field"><label>Title</label><input name="title" dir="auto" maxlength="160" value="'+esc(item.title||'')+'"></div><div class="field"><label>Content</label><textarea name="body" dir="auto" rows="6" maxlength="2400">'+esc(item.body||'')+'</textarea></div><div class="field" data-language-types="grammar-training"><label>Training answer</label><input name="answer" maxlength="500" value="'+esc(item.answer||'')+'" placeholder="Optional exact answer"></div>';
    if(page==='language-examine'){const choices=Array.isArray(item.choices)?item.choices.join('\n'):'',answers=Array.isArray(item.answers)?item.answers.join('\n'):'';return languageTypeSelect(page,item.type||'exam-single-choice')+'<div class="field"><label>Question</label><textarea name="question" dir="auto" rows="4" maxlength="1400">'+esc(item.question||'')+'</textarea></div><div class="field" data-language-types="exam-single-choice,exam-multiple-choice"><label>Choices — one per line</label><textarea name="choices" dir="auto" rows="5" maxlength="1600">'+esc(choices)+'</textarea></div><div class="field" data-language-types="exam-single-choice,exam-true-false,exam-fill-blank,exam-short-answer"><label>Answer / model answer</label><textarea name="answer" dir="auto" rows="3" maxlength="1000">'+esc(item.answer||'')+'</textarea></div><div class="field" data-language-types="exam-multiple-choice"><label>Correct answers — one per line</label><textarea name="answers" dir="auto" rows="4" maxlength="1400">'+esc(answers)+'</textarea></div>';}
    const choices=Array.isArray(item.choices)?item.choices.join('\n'):'';
    return '<div class="field"><label>Title</label><input name="title" maxlength="120" value="'+esc(item.title||'')+'" placeholder="Item title"></div><div class="field"><label>Text</label><textarea name="body" rows="6" maxlength="2000">'+esc(item.body||'')+'</textarea>'+(page==='language-level-test'?'</div><div class="field"><label>Choices — one per line</label><textarea name="choices" rows="4" maxlength="1200">'+esc(choices)+'</textarea>':'</div>');
  }
  function syncLanguageEditorType(form){
    const select=form.querySelector('[data-language-editor-type]');if(!select)return;const type=select.value;form.querySelectorAll('[data-language-types]').forEach(node=>{const allowed=String(node.dataset.languageTypes||'').split(','),active=allowed.includes(type);node.hidden=!active;node.querySelectorAll('input,textarea,select').forEach(control=>{control.disabled=!active;if(control.dataset.languageRequired==='true')control.required=active;});});select.onchange=()=>syncLanguageEditorType(form);
  }
  function readLanguageEditorData(form,page,base={}){
    const data=Object.fromEntries(new FormData(form)),id=String(base.id||languageUid('content')),list=value=>String(value||'').split(/\n+/).map(v=>v.trim()).filter(Boolean);
    if(page==='language-letters'){
      const type=pageItemType(page,data.type)?.id||'word_to_native';
      if(type==='word_to_native')return{id,type,word:String(data.word||'').trim()||'Word',meaningEnglish:String(data.meaningEnglish||'').trim(),meaningArabic:String(data.meaningArabic||'').trim()};
      if(type==='image_to_word')return{id,type,imageUrl:directImageUrl(data.imageUrl),choices:list(data.choices),answer:String(data.answer||'').trim()};
      if(type==='sentence_to_native'){const glosses={};list(data.wordGlosses).forEach(line=>{const [word,...rest]=line.split('|');if(word?.trim()&&rest.join('|').trim())glosses[word.trim().toLocaleLowerCase()]=rest.join('|').trim();});return{id,type,sentence:String(data.sentence||'').trim(),choices:list(data.choices),answer:String(data.answer||'').trim(),wordGlosses:glosses};}
      if(type==='match_pairs'){const pairs=list(data.pairs).map(line=>{const [left,...rest]=line.split('|');return{left:String(left||'').trim(),right:rest.join('|').trim()};}).filter(pair=>pair.left&&pair.right);return{id,type,pairs};}
      if(type==='word_builder'||type==='trace_letter_word')return{id,type,word:String(data.word||'').trim()||'Word'};
      if(type==='fill_blank')return{id,type,sentence:String(data.sentence||'').trim(),choices:list(data.choices),answer:String(data.answer||'').trim()};
      if(type==='spelling_write')return{id,type,word:String(data.word||'').trim()||'Word',meaningEnglish:String(data.meaningEnglish||'').trim(),meaningArabic:String(data.meaningArabic||'').trim(),imageUrl:directImageUrl(data.imageUrl)};
      if(type==='sentence_builder')return{id,type,sourceEnglish:String(data.sourceEnglish||'').trim(),sourceArabic:String(data.sourceArabic||'').trim(),answer:String(data.answer||'').trim()};
      if(type==='category_sort'){const categories=list(data.categories).map(line=>{const colon=line.indexOf(':');if(colon<0)return null;return{name:line.slice(0,colon).trim(),words:line.slice(colon+1).split(',').map(v=>v.trim()).filter(Boolean)};}).filter(Boolean);return{id,type,categories};}
      return{id,type,sourceEnglish:String(data.sourceEnglish||'').trim(),sourceArabic:String(data.sourceArabic||'').trim(),modelAnswer:String(data.modelAnswer||'').trim(),acceptedVariants:list(data.acceptedVariants),keywords:String(data.keywords||'').split(/[\n,]+/).map(v=>v.trim()).filter(Boolean)};
    }
    if(page==='language-voice'){
      const type=pageItemType(page,data.type)?.id||'listen_voice_to_text',voiceFileName=String(data.voiceFileName||'').trim(),sameVoiceName=voiceFileName&&voiceFileName.toLocaleLowerCase()===String(base.voiceFileName||'').trim().toLocaleLowerCase(),baseVoice={id,type,text:String(data.text||'').trim(),voiceFileName,voiceFileId:sameVoiceName?String(base.voiceFileId||''):'',voiceContentType:sameVoiceName?String(base.voiceContentType||''):'',answer:String(data.answer||'').trim()};
      if(type==='listen_voice_to_text')return{...baseVoice,choices:list(data.choices)};
      if(type==='listen_voice_to_image')return{...baseVoice,imageChoices:list(data.imageChoices).map(directImageUrl).filter(Boolean)};
      if(type==='listen_voice_to_native_voice'){const old=Array.isArray(base.audioChoices)?base.audioChoices:[],audioChoices=list(data.audioChoices).map(line=>{const [label,...rest]=line.split('|'),filename=rest.join('|').trim(),previous=old.find(option=>String(option.label).trim().toLocaleLowerCase()===String(label||'').trim().toLocaleLowerCase()&&String(option.voiceFileName).trim().toLocaleLowerCase()===filename.toLocaleLowerCase());return{label:String(label||'').trim(),voiceFileName:filename,voiceFileId:String(previous?.voiceFileId||''),voiceContentType:String(previous?.voiceContentType||'')};}).filter(option=>option.label);return{...baseVoice,audioChoices};}
      if(type==='listen_dictation')return baseVoice;
      if(type==='listen_missing_word')return{...baseVoice,sentence:String(data.sentence||'').trim(),choices:list(data.choices)};
      if(type==='speak_voice_to_voice'||type==='speak_text_to_voice')return baseVoice;
      if(type==='speak_image_to_voice')return{...baseVoice,imageUrl:directImageUrl(data.imageUrl)};
      if(type==='speak_answer_question')return{...baseVoice,question:String(data.question||'').trim()||'Question'};
      const dialogue=list(data.dialogue).map(line=>{const [role,...rest]=line.split('|');return{role:String(role||'').trim()||'A',text:rest.join('|').trim()};}).filter(line=>line.text);return{...baseVoice,learnerRole:String(data.learnerRole||'B').trim()||'B',dialogue};
    }
    if(page==='language-grammar'){const type=pageItemType(page,data.type)?.id||'grammar-law';return{id,type,title:String(data.title||'').trim()||itemTypeLabel(page,type),body:String(data.body||'').trim(),answer:type==='grammar-training'?String(data.answer||'').trim():''};}
    if(page==='language-examine'){const type=pageItemType(page,data.type)?.id||'exam-single-choice',choices=list(data.choices),answers=list(data.answers);return{id,type,question:String(data.question||'').trim()||'Question',choices:(type==='exam-single-choice'||type==='exam-multiple-choice')?choices:[],answer:type==='exam-multiple-choice'?'':String(data.answer||'').trim(),answers:type==='exam-multiple-choice'?answers:[]};}
    const next={id,title:String(data.title||'').trim()||'Untitled',body:String(data.body||'').trim()};if(page==='language-level-test')next.choices=list(data.choices);return next;
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
    word_to_native:'language-letters',image_to_word:'language-letters',sentence_to_native:'language-letters',match_pairs:'language-letters',word_builder:'language-letters',fill_blank:'language-letters',trace_letter_word:'language-letters',spelling_write:'language-letters',sentence_builder:'language-letters',category_sort:'language-letters',paragraph_translate_write:'language-letters',
    listen_voice_to_text:'language-voice',listen_voice_to_image:'language-voice',listen_voice_to_native_voice:'language-voice',listen_dictation:'language-voice',listen_missing_word:'language-voice',speak_voice_to_voice:'language-voice',speak_text_to_voice:'language-voice',speak_image_to_voice:'language-voice',speak_answer_question:'language-voice',speak_dialogue_roleplay:'language-voice',
    'grammar-law':'language-grammar','grammar-note':'language-grammar','grammar-example':'language-grammar','grammar-training':'language-grammar',
    'youtube-video':'language-video','story-reading':'language-video',
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
    const put=(object,key,column)=>{const value=excelText(row[column]);if(value)object[key]=value;},choices=()=>{const list=[];for(let n=1;n<=6;n++){const value=excelText(row['choice '+n]);if(value)list.push(value);}return list;};
    const item={id:languageUid('excel'),type},correct=excelText(row['correct answer']);
    if(type==='word_to_native'){put(item,'word','word');put(item,'meaningEnglish','meaning English');put(item,'meaningArabic','meaning Arabic');}
    if(type==='image_to_word'){put(item,'imageUrl','image URL');item.choices=choices();if(correct)item.answer=correct;}
    if(type==='sentence_to_native'){put(item,'sentence','sentence');item.choices=choices();if(correct)item.answer=correct;}
    if(type==='match_pairs'){item.pairs=excelText(row['text / instruction']).split(/\n+/).map(line=>{const [left,...rest]=line.split('|');return{left:String(left||'').trim(),right:rest.join('|').trim()};}).filter(pair=>pair.left&&pair.right);}
    if(type==='word_builder'||type==='trace_letter_word'){put(item,'word','word');}
    if(type==='fill_blank'){put(item,'sentence','sentence');item.choices=choices();if(correct)item.answer=correct;}
    if(type==='spelling_write'){put(item,'word','word');put(item,'meaningEnglish','meaning English');put(item,'meaningArabic','meaning Arabic');put(item,'imageUrl','image URL');}
    if(type==='sentence_builder'){put(item,'sourceEnglish','meaning English');put(item,'sourceArabic','meaning Arabic');if(correct)item.answer=correct;}
    if(type==='category_sort'){item.categories=excelText(row['text / instruction']).split(/\n+/).map(line=>{const p=line.indexOf(':');return p<0?null:{name:line.slice(0,p).trim(),words:line.slice(p+1).split(',').map(v=>v.trim()).filter(Boolean)}}).filter(Boolean);}
    if(type==='paragraph_translate_write'){put(item,'sourceEnglish','meaning English');put(item,'sourceArabic','meaning Arabic');if(correct)item.modelAnswer=correct;item.keywords=excelText(row['text / instruction']).split(/[\n,]+/).map(v=>v.trim()).filter(Boolean);}
    if(LANGUAGE_EXCEL_TYPE_PAGE[type]==='language-voice'){
      put(item,'text','text / instruction');put(item,'voiceFileName','voice file name');if(correct)item.answer=correct;
      if(['listen_voice_to_text','listen_missing_word'].includes(type))item.choices=choices();
      if(type==='listen_voice_to_image')item.imageChoices=choices().map(directImageUrl).filter(Boolean);
      if(type==='listen_missing_word')put(item,'sentence','sentence');
      if(type==='speak_image_to_voice')put(item,'imageUrl','image URL');
      if(type==='speak_answer_question')put(item,'question','sentence');
      if(type==='listen_voice_to_native_voice')item.audioChoices=choices().map(label=>({label,voiceFileName:''}));
      if(type==='speak_dialogue_roleplay')item.dialogue=excelText(row['text / instruction']).split(/\n+/).map(line=>{const [role,...rest]=line.split('|');return{role:String(role||'A').trim(),text:rest.join('|').trim()};}).filter(line=>line.text);
    }
    if(['grammar-law','grammar-note','grammar-example','grammar-training'].includes(type)){put(item,'title','title');put(item,'body','text / instruction');if(type==='grammar-training'&&correct)item.answer=correct;}
    if(type.startsWith('exam-')){put(item,'question','text / instruction');const list=choices();if(type==='exam-single-choice'||type==='exam-multiple-choice')item.choices=list;if(type==='exam-multiple-choice'){if(correct)item.answers=correct.split(/\s*\|\s*|\n+/).map(value=>value.trim()).filter(Boolean);}else if(correct)item.answer=correct;}
    return item;
  }
  function languageExcelFeatureCount(item){return Object.keys(item).filter(key=>!['id','type'].includes(key)&&!(Array.isArray(item[key])&&!item[key].length)&&excelText(Array.isArray(item[key])?item[key].join(''):item[key])).length;}
  function mergeLanguageExcelItem(existing,incoming,page,index){
    const base=existing&&existing.type===incoming.type?{...existing,id:existing.id}:{id:incoming.id,type:incoming.type};
    if(page==='language-voice'&&incoming.voiceFileName&&String(incoming.voiceFileName).toLocaleLowerCase()!==String(base.voiceFileName||'').toLocaleLowerCase()){base.voiceFileId='';base.voiceContentType='';}
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
      if(type==='youtube-video'||type==='story-reading'){
        const config={};
        if(type==='youtube-video'){const title=excelText(row.title),url=excelText(row['youtube video link']),prompt=excelText(row['youtube understanding prompt']);if(title)config.title=title;if(url)config.url=url;if(prompt)config.prompt=prompt;if(turn!==1)throw new Error('Row '+rowNumber+': youtube-video turning number must be 1.');}
        else{const storyTitle=excelText(row.title),storyText=excelText(row['text / instruction']),storyPrompt=excelText(row['youtube understanding prompt']);if(storyTitle)config.storyTitle=storyTitle;if(storyText)config.storyText=storyText;if(storyPrompt)config.storyPrompt=storyPrompt;if(turn!==2)throw new Error('Row '+rowNumber+': story-reading turning number must be 2.');}
        if(!Object.keys(config).length)throw new Error('Row '+rowNumber+': the '+type+' row has no non-empty content columns.');
        parsed.push({rowNumber,type,page,level,step,box,turn,config});return;
      }
      const item=languageExcelItem(row,type);if(['image_to_word','speak_image_to_voice'].includes(type)&&item.imageUrl&&!directImageUrl(item.imageUrl))throw new Error('Row '+rowNumber+': '+type+' requires a valid direct HTTP(S) image URL.');if(!languageExcelFeatureCount(item))throw new Error('Row '+rowNumber+': '+type+' has no non-empty content columns.');
      parsed.push({rowNumber,type,page,level,step,box,turn,item});
    });
    if(!parsed.length)throw new Error('No content rows were found in the Excel file.');
    const content=JSON.parse(JSON.stringify(readLanguageContent()));
    const groups=new Map();parsed.forEach(entry=>{const key=[entry.level,entry.step,entry.box,entry.page].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(entry);});
    for(const entries of groups.values()){
      entries.sort((a,b)=>a.turn-b.turn);
      for(const entry of entries){
        const loc=ensureLanguageExcelLocation(content,entry.level,entry.step,entry.box),key=pageKey(entry.page,loc),index=entry.turn-1;
        if(entry.type==='youtube-video'||entry.type==='story-reading'){
          content.video=content.video||{};const current={...defaultWatchingReadingConfig(),...(content.video[key]||{})};content.video[key]={...current,...entry.config};content.pages=content.pages||{};content.pages[key]=[];continue;
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
      items.forEach(item=>{
        const filename=voiceBaseName(item?.voiceFileName);if(filename)targets.push({holder:item,key,filename,match:filename.toLocaleLowerCase()});
        if(Array.isArray(item?.audioChoices))item.audioChoices.forEach(option=>{const optionName=voiceBaseName(option.voiceFileName);if(optionName)targets.push({holder:option,key,filename:optionName,match:optionName.toLocaleLowerCase()});});
      });
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
    if(!targets.length)throw new Error('No Listening & Speaking items have a voice file name to match.');
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
        matchedTargets.forEach(target=>{if(target.holder.voiceFileId)oldIds.add(String(target.holder.voiceFileId));target.holder.voiceFileId=fileId;target.holder.voiceContentType=LANGUAGE_VOICE_MIME[source.extension];});
        completed++;onProgress?.({file:source.base,completed,total:matches.size,ratio:1});
      }
      writeLanguageContent(content);
      const referenced=new Set(languageVoiceTargets(content).map(target=>String(target.holder.voiceFileId||'')).filter(Boolean));
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
    sheet.insertAdjacentHTML('beforeend','<form class="language-control-step language-item-editor" data-language-voice-import><small>Voice ZIP import</small><h3>Import voice files</h3><div class="field"><label>ZIP with hearing audio files</label><input data-language-voice-zip type="file" accept=".zip,application/zip" required></div><div class="language-location-fixed"><strong>Exact filename matching</strong><span>Each MP3, WAV, OGG, M4A/MP4 audio, or WebM file is matched to Listening & Speaking model audio or native-audio options with the same <em>voice file name</em>.</span></div><p class="auth-note">Folder names inside the ZIP are ignored. Filenames are matched case-insensitively. One uploaded file can serve multiple hearing items that use the same filename.</p><div class="language-control-footer"><button type="button" class="btn btn-ghost" data-language-voice-cancel>Cancel</button><button type="submit" class="btn btn-primary">Import voice ZIP</button></div><p class="auth-note" data-language-voice-status></p></form>');
    const form=sheet.querySelector('[data-language-voice-import]'),status=form.querySelector('[data-language-voice-status]'),button=form.querySelector('button[type=submit]');
    form.querySelector('[data-language-voice-cancel]').onclick=()=>{close();openLanguageControl(originPage);};
    form.onsubmit=async event=>{
      event.preventDefault();button.disabled=true;status.textContent='Reading ZIP…';
      try{
        const result=await importLanguageVoiceZip(form.querySelector('[data-language-voice-zip]').files?.[0],progress=>{
          const current=Math.min(progress.total,progress.completed+(progress.ratio<1?1:0));
          status.textContent='Uploading '+progress.file+' · '+current+' / '+progress.total;
        });
        status.textContent='Matched '+result.files+' voice files to '+result.items+' audio targets'+(result.unmatchedTargets?' · '+result.unmatchedTargets+' audio targets still unmatched':'')+'.';
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
    const content=readLanguageContent(),key=pageKey('language-video',loc),config=languageVideoConfig(content,loc),close=languageControlSheet('Edit Watching & Reading','<form class="language-item-editor watching-reading-editor" data-language-video-edit><section class="watch-read-editor-section"><small>Page 1 of 2 · Watching</small><h3>YouTube video understanding</h3><div class="field"><label>Video page title</label><input name="title" dir="auto" maxlength="120" value="'+esc(config.title||'')+'"></div><div class="field"><label>YouTube video link</label><input name="url" type="url" maxlength="900" value="'+esc(config.url||'')+'" placeholder="https://www.youtube.com/watch?v=…"></div><div class="field"><label>Video understanding prompt</label><textarea name="prompt" dir="auto" rows="4" maxlength="1200">'+esc(config.prompt||'')+'</textarea></div></section><section class="watch-read-editor-section story-editor-section"><small>Page 2 of 2 · Reading</small><h3>Story reading & understanding</h3><div class="field"><label>Story title</label><input name="storyTitle" dir="auto" maxlength="180" value="'+esc(config.storyTitle||'')+'"></div><div class="field"><label>Story text</label><textarea name="storyText" dir="auto" rows="12" maxlength="16000" placeholder="Write or paste the complete story…">'+esc(config.storyText||'')+'</textarea></div><div class="field"><label>Story understanding prompt</label><textarea name="storyPrompt" dir="auto" rows="4" maxlength="1200">'+esc(config.storyPrompt||'')+'</textarea></div></section><button class="btn btn-primary auth-submit" type="submit">Save Watching & Reading</button><p class="auth-note">Video and story responses stay private to each learner’s browser.</p></form>');
    document.querySelector('[data-language-video-edit]').onsubmit=event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));content.video=content.video||{};content.video[key]={title:String(data.title||'').trim()||'Video understanding',url:String(data.url||'').trim(),prompt:String(data.prompt||'').trim()||defaultWatchingReadingConfig().prompt,storyTitle:String(data.storyTitle||'').trim()||'Story reading',storyText:String(data.storyText||'').trim()||'Add the story text from Content Control.',storyPrompt:String(data.storyPrompt||'').trim()||defaultWatchingReadingConfig().storyPrompt};content.pages=content.pages||{};content.pages[key]=[];writeLanguageContent(content);hideLanguageControl(originPage);close();render();};
  }
  function installWorkspaceRoutes(){const previousContent=workspaceContent;workspaceContent=function(page,parts,title){if(isLanguage()&&page==='language-home')return languageHomePage();if(isLanguage()&&LANGUAGE_INTERMEDIATE_ROUTES.includes(page))return intermediatePage(page);if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return languageContentPage(page);if(courseType()==='personal'&&page==='study-rooms')return personalRoomPage();return previousContent(page,parts,title);};const previousWorkspace=workspace;workspace=function(current){const type=courseType(),page=String(current||'').split('/')[0];if(type==='language'&&window.DafatiiCourses.active().id){purgeLegacyLanguageBrowserState();if(!LANGUAGE_ROUTES.includes(page)&&!LANGUAGE_INTERMEDIATE_ROUTES.includes(page)&&!['change-course','profile','settings','representer','admin'].includes(page)){setHash('language-home');return;}}if(type==='personal'&&page==='chat'){setHash('study-rooms');return;}previousWorkspace(current);adaptNavigation();if(type==='personal'&&page==='study-rooms')bindPersonalRoom();if(type==='language'){bindLanguagePage(page);ensureLanguageControl(page);}};}
  function adaptNavigation(){const type=courseType(),current=(location.hash||'#language-home').replace(/^#\/?/,'').split('/')[0];if(type==='personal'){document.querySelectorAll('a[href^="#chat"],[data-page="chat"],[data-bottom-nav-item="chat"]').forEach(node=>node.remove());if(current==='study-rooms')document.querySelector('.quiet-workspace>.sub-nav')?.remove();return;}if(type!=='language')return;document.querySelector('.quiet-workspace>.sub-nav')?.remove();document.querySelector('.quiet-return-button')?.remove();const shell=document.querySelector('.quiet-workspace');if(shell){shell.classList.add('language-course-shell');shell.classList.toggle('language-intermediate-shell',LANGUAGE_INTERMEDIATE_ROUTES.includes(current));shell.dataset.languagePage=current.replace(/^language-/,'')||'home';}const toolbarTitle=document.querySelector('.quiet-toolbar-title strong'),toolbarKicker=document.querySelector('.quiet-toolbar-title small');if(LANGUAGE_INTERMEDIATE_ROUTES.includes(current)){if(toolbarTitle)toolbarTitle.textContent=current==='language-start-zero'?'Learn the letters':'Level check';if(toolbarKicker)toolbarKicker.textContent=targetLanguage()+' setup';return;}const activeNav=navSpec.find(item=>item[0]===current)||navSpec[0];if(toolbarTitle)toolbarTitle.textContent=languageNavLabel(activeNav);if(toolbarKicker)toolbarKicker.textContent=targetLanguage()+' course';const side=document.querySelector('.quiet-sidebar > nav'),desktop=document.querySelector('.quiet-desktop-tabs'),bottom=document.querySelector('.bottom-nav');if(side)side.innerHTML=sideLanguageNav(current);if(desktop)desktop.innerHTML=sideLanguageNav(current);if(bottom)bottom.innerHTML=bottomLanguageNav(current);}
  function routeAfterCourseSwitch(){if(courseType()!=='language')return'dashboard/overview';const learner=readLearnerState(),student=window.DafatiiCourses.active().membership?.role==='student';if(student&&learner.entryMode&&!learner.onboardingComplete)return learner.entryMode==='zero'?'language-start-zero':'language-level-test';return'language-home';}
  function installCourseChangeRouting(){window.addEventListener('dafatii:coursechanged',()=>{const current=(location.hash||'').replace(/^#\/?/,'').split('/')[0];if(current!=='change-course')return;setTimeout(()=>setHash(routeAfterCourseSwitch()),0);});}
  function installLanguageControlReset(){window.addEventListener('hashchange',()=>{languageControlHiddenFor='';});}
  wrapCourseCreation();installCreateInterceptor();installLanguageEnrollInterceptor();installWorkspaceRoutes();installCourseChangeRouting();installLanguageControlReset();window.DafatiiCourseModes=Object.freeze({courseType,isLanguage,targetLanguage,openTypeChooser,openLanguageEnrollment,languageRoutes:[...LANGUAGE_ROUTES],languageIntermediateRoutes:[...LANGUAGE_INTERMEDIATE_ROUTES],languageChoices:LANGUAGE_CHOICES.map(item=>item[0])});
})();
