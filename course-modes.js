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
      ['language','Aa','Create Language course','Create a blank language course workspace to build from scratch.','إنشاء دورة لغة','أنشئ مساحة دورة لغة فارغة للبناء من الصفر.']
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
    const close=sheet(arabic?'إنشاء دورة لغة':'Create Language course','<form id="course-mode-form" class="language-course-create"><input type="hidden" name="courseType" value="language"><input type="hidden" name="targetLanguage" value=""><input type="hidden" name="name" value=""><input type="hidden" name="templateName" value="Computer Science"><input type="hidden" name="studyType" value="courses"><input type="hidden" name="institution" value=""><input type="hidden" name="stage" value="university"><input type="hidden" name="pricing" value="free"><input type="hidden" name="priceMinor" value="0"><input type="hidden" name="visibility" value="public"><input type="hidden" name="joinPolicy" value="direct"><input type="hidden" name="learningField" value="Languages"><input type="hidden" name="difficultyLevel" value="beginner"><div class="language-create-intro"><small>'+(arabic?'دورة لغة':'Language course')+'</small><h3>'+(arabic?'اختر اللغة':'Select a language')+'</h3><p>'+(arabic?'سيتم إنشاء دورة فارغة بالكامل دون محتوى أو عناصر تعلم مسبقة.':'The course will be created completely blank, with no seeded content or learning item system.')+'</p></div><div class="language-picker" role="radiogroup" aria-label="'+(arabic?'لغة الدورة':'Course language')+'">'+choices+'</div><button class="btn btn-primary auth-submit language-create-submit" id="language-course-create" type="submit" disabled>'+(arabic?'إنشاء الدورة':'Create course')+'</button><p class="auth-note" id="course-mode-status">'+(arabic?'اختر لغة للمتابعة.':'Select a language to continue.')+'</p></form>');
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
  function blankLanguagePage(page){
    return '<section class="language-blank-page" data-language-blank-page="'+esc(page)+'" aria-label="'+esc(languageNavLabel(navSpec.find(item=>item[0]===page)||navSpec[0]))+'"></section>';
  }

  function installWorkspaceRoutes(){
    const previousContent=workspaceContent;
    workspaceContent=function(page,parts,title){
      if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return blankLanguagePage(page);
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
    languageChoices:LANGUAGE_CHOICES.map(item=>item[0])
  });
})();
