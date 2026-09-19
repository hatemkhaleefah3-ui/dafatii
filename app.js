const app = document.getElementById('app');

const DEFAULT_SUBJECTS = [
  { id: 'mathematics', name: 'Mathematics', icon: '∑' },
  { id: 'physics', name: 'Physics', icon: '⚛' },
  { id: 'english', name: 'English', icon: 'Aa' },
];

const SUBJECT_ICONS = ['∑','⚛','Aa','🧬','🧪','🌍','📚','✎','⌘','🎨','♫','🏛','⚽','🧠','💼','🔬'];
const LECTURE_ICONS = ['▶','📖','📝','🎓','🧠','🔬','🧪','📐','💻','📊','🎥','🔗','🗂','✦','✓','◎'];
const SUBJECT_TABS = ['Lectures', 'Degrees', 'Analysis'];

function loadJSON(key, fallback){
  return window.DafatiiCourses.readJSON(key, fallback);
}

function loadSubjects(){
  const stored = loadJSON('dafatii:subjects', null);
  return Array.isArray(stored) ? stored : [];
}

function loadLectures(){
  const stored = loadJSON('dafatii:lectures', {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

const state = {
  joined: Boolean(window.DafatiiAuth?.user),
  authReady: false,
  sidebar: false,
  authMode: 'signup',
  subjects: loadSubjects(),
  lectures: loadLectures(),
};

const MAIN_NAV = {
  dashboard: ['Overview', 'Recent materials', 'Progress'],
  subjects: ['All subjects', 'Notes', 'Resources', 'Assignments'],
  calendar: ['Schedule', 'Deadlines', 'Exams'],
  'study-rooms': ['Discover', 'My rooms', 'Create room'],
  chat: ['Messages', 'Groups', 'Requests'],
};

const LANDING_COPY = {
  ar:{home:'الرئيسية',about:'من نحن',contact:'تواصل معنا',join:'انضم إلينا',eyebrow:'حياتك الدراسية في مكان واحد',title:'دراسة أقل تشتتاً.',titleAccent:'تعلّم أكثر.',intro:'يجمع دفاتري المواد والدروس والجداول وغرف الدراسة والمحادثات في مساحة واحدة منظمة للمدرسة والجامعة والتعلّم المستقل.',start:'ابدأ الدراسة',explore:'استكشف المزايا',proofOne:'مساحة واحدة لكل دورة',proofTwo:'مصمم للتركيز بلا فوضى',today:'اليوم',workspace:'مساحة الدراسة',physics:'الفيزياء',calculus:'التفاضل والتكامل',upcoming:'القادم',focus:'وضع التركيز',ready:'جاهز عندما تكون جاهزاً.',materials:'المواد',reach:'كل شيء في متناولك.',designed:'مصمم حول الطالب',everything:'لكل شيء مكان.',calm:'واجهة هادئة لحياة دراسية معقدة.',planning:'التخطيط',community:'المجتمع',materialText:'نظّم المواد والملاحظات والمصادر بالطريقة التي تدرس بها فعلياً.',planningText:'ضع المحاضرات والاختبارات والمواعيد وجلسات الدراسة في جدول واحد مترابط.',communityText:'انتقل من الدراسة الفردية إلى الغرف والمحادثات المركزة عندما يفيد التعاون.',aboutTitle:'مساحة أكاديمية تبنيها أنت',aboutText:'دفاتري منصة دراسية تجمع المحتوى والتخطيط والتعاون وإدارة الدورات مع صلاحيات واضحة للطلاب والممثلين والمشرفين.',contactTitle:'تواصل مع فريق دفاتري',contactText:'للأسئلة والملاحظات والدعم، راسلنا وسنتابع طلبك.',contactAction:'إرسال بريد',cta:'فصلك الدراسي القادم يستحق نظاماً أوضح.'},
  en:{home:'Home',about:'About us',contact:'Contact us',join:'Join us',eyebrow:'Your study life, one place',title:'Study less scattered.',titleAccent:'Learn more.',intro:'Dafatii brings materials, subjects, schedules, rooms and conversations into one focused workspace for school, university and independent learners.',start:'Start studying',explore:'Explore features',proofOne:'One workspace for every course',proofTwo:'Built for focus, not clutter',today:'Today',workspace:'Study workspace',physics:'Physics',calculus:'Calculus',upcoming:'Upcoming',focus:'Focus mode',ready:'Ready when you are.',materials:'Materials',reach:'Everything in reach.',designed:'Designed around students',everything:'Everything has a place.',calm:'A calm interface for complex academic life.',planning:'Planning',community:'Community',materialText:'Keep subjects, notes and resources organized around the way you actually study.',planningText:'Put classes, exams, deadlines and study sessions on one coherent timeline.',communityText:'Move from solo study to focused rooms and conversations when collaboration helps.',aboutTitle:'An academic workspace you control',aboutText:'Dafatii brings content, planning, collaboration, and course administration together with clear permissions for students, representatives, and administrators.',contactTitle:'Contact the Dafatii team',contactText:'For questions, feedback, or support, email us and we will follow up.',contactAction:'Send email',cta:'Your next semester deserves a cleaner system.'}
};
const AUTH_COPY = {
  ar:{join:'انضم إلى مساحة الدراسة',build:'ابنِ بيتك الأكاديمي.',description:'لطلاب المدارس والجامعات والمتعلمين المستقلين الذين يريدون المواد والتخطيط والتعاون في نظام واحد.',subjects:'المواد',calendar:'التقويم',rooms:'غرف الدراسة',chat:'المحادثات',signin:'تسجيل الدخول',signup:'إنشاء حساب',create:'أنشئ حسابك',welcome:'مرحباً بعودتك',createText:'جهّز مساحة دفاتري الخاصة بك خلال ثوانٍ.',signinText:'سجّل الدخول للمتابعة إلى مساحتك.',name:'الاسم الكامل',namePlaceholder:'اسمك',email:'البريد الإلكتروني',password:'كلمة المرور',accountType:'نوع الحساب',student:'طالب',representer:'ممثل دورة',stage:'المرحلة الدراسية',school:'المدرسة',university:'الجامعة',independent:'تعلم مستقل',createButton:'إنشاء الحساب',offline:'تعذر فحص الاتصال تلقائياً. ما زال بإمكانك إرسال النموذج أو إعادة المحاولة.',secure:'يتحقق خادم دفاتري من بيانات الدخول والأدوار والتسجيل وصلاحيات الدورات.',retry:'حاول مرة أخرى',reconnecting:'جارٍ إعادة الاتصال…',stillOffline:'الخادم غير متاح بعد. تحقق من اتصالك وحاول مرة أخرى.',creating:'جارٍ إنشاء الحساب…',signing:'جارٍ تسجيل الدخول…',failed:'فشلت المصادقة.'},
  en:{join:'Join the workspace',build:'Build your academic home.',description:'For school students, university students and independent learners who want materials, planning and collaboration in one focused system.',subjects:'Subjects',calendar:'Calendar',rooms:'Study rooms',chat:'Chat',signin:'Sign in',signup:'Sign up',create:'Create your account',welcome:'Welcome back',createText:'Set up your Dafatii workspace in a few seconds.',signinText:'Sign in to continue to your workspace.',name:'Full name',namePlaceholder:'Your name',email:'Email',password:'Password',accountType:'Account type',student:'Student',representer:'Course representer',stage:'Student stage',school:'School',university:'University',independent:'Independent',createButton:'Create account',offline:'The automatic connection check failed. You can still submit the form or try the check again.',secure:'Credentials, roles, enrollment and course permissions are verified by Dafatii’s server.',retry:'Try again',reconnecting:'Reconnecting…',stillOffline:'The server is still unavailable. Check your connection and try again.',creating:'Creating account…',signing:'Signing in…',failed:'Authentication failed.'}
};

const LABELS = {
  dashboard: 'Dashboard', subjects: 'Subjects', calendar: 'Calendar',
  'study-rooms': 'Study Rooms', chat: 'Chat', settings: 'Settings', profile: 'Profile',
  'change-course': 'Change Course', 'school-teachers':'Teachers', 'change-language': 'Change Language', 'dark-mode': 'Change Dark Mode',
  'apply-work': 'Apply Work', 'apply-scholarship': 'Apply Scholarship', volunteer: 'Volunteer', 'donate-us': 'Donate Us'
};

function icon(name){
  return window.DafatiiIcons?.icon(name) || '';
}

function setHash(hash){ location.hash = hash; }
function route(){ return location.hash.replace(/^#\/?/,'') || 'landing'; }
function saveSubjects(){ window.DafatiiCourses.writeJSON('dafatii:subjects', state.subjects); }
function saveLectures(){ window.DafatiiCourses.writeJSON('dafatii:lectures', state.lectures); }
function subjectLectures(subjectId){ return Array.isArray(state.lectures[subjectId]) ? state.lectures[subjectId] : []; }

function landing(){
  const c=LANDING_COPY[interfaceLanguage()];
  app.innerHTML = `
    <div class="app-shell page landing-page" id="home">
      <div class="container">
        <nav class="landing-nav" aria-label="${escapeHtml(c.home)}">
          ${brand()}
          <div class="landing-nav-tabs">
            <button class="landing-nav-link active" data-landing-section="home" aria-label="${escapeHtml(c.home)}" title="${escapeHtml(c.home)}">${icon('nav-home')}<span>${escapeHtml(c.home)}</span></button>
            <button class="landing-nav-link" data-landing-section="about" aria-label="${escapeHtml(c.about)}" title="${escapeHtml(c.about)}">${icon('info')}<span>${escapeHtml(c.about)}</span></button>
            <button class="landing-nav-link" data-landing-section="contact" aria-label="${escapeHtml(c.contact)}" title="${escapeHtml(c.contact)}">${icon('mail')}<span>${escapeHtml(c.contact)}</span></button>
            <button class="landing-nav-link" data-go="join" aria-label="${escapeHtml(c.join)}" title="${escapeHtml(c.join)}">${icon('profile')}<span>${escapeHtml(c.join)}</span></button>
          </div>
          <button class="landing-language" data-interface-language="${interfaceLanguage()==='ar'?'en':'ar'}">${interfaceLanguage()==='ar'?'EN':'ع'}</button>
        </nav>
        <main>
          <section class="hero">
            <div>
              <div class="eyebrow">${escapeHtml(c.eyebrow)}</div>
              <h1>${escapeHtml(c.title)} <span>${escapeHtml(c.titleAccent)}</span></h1>
              <p>${escapeHtml(c.intro)}</p>
              <div class="hero-actions">
                <button class="btn btn-primary" data-go="join">${escapeHtml(c.start)} →</button>
                <button class="btn btn-ghost" data-landing-section="features">${escapeHtml(c.explore)}</button>
              </div>
              <div class="hero-proof"><span><strong>${escapeHtml(c.proofOne)}</strong></span><span><strong>${escapeHtml(c.proofTwo)}</strong></span></div>
            </div>
            <div class="hero-visual" aria-hidden="true">
              <div class="float-card main">
                <div class="mock-top"><strong>${escapeHtml(c.today)}</strong><span class="muted">${escapeHtml(c.workspace)}</span></div>
                <div class="mock-grid">
                  <div class="mock-block"><strong>${escapeHtml(c.physics)}</strong><div class="mock-pill"></div><div class="mock-pill accent"></div></div>
                  <div class="mock-block"><strong>${escapeHtml(c.calculus)}</strong><div class="mock-pill"></div><div class="mock-pill"></div></div>
                  <div class="mock-block big"><strong>${escapeHtml(c.upcoming)}</strong><div class="mock-pill"></div><div class="mock-pill accent"></div><div class="mock-pill"></div></div>
                </div>
              </div>
              <div class="float-card mini-card"><div class="mini-icon">✓</div><strong>${escapeHtml(c.focus)}</strong><p class="muted">${escapeHtml(c.ready)}</p></div>
              <div class="float-card mini-card bottom"><div class="mini-icon">24</div><strong>${escapeHtml(c.materials)}</strong><p class="muted">${escapeHtml(c.reach)}</p></div>
            </div>
          </section>
          <section class="landing-section" id="features">
            <div class="section-head"><div><div class="eyebrow">${escapeHtml(c.designed)}</div><h2>${escapeHtml(c.everything)}</h2></div><p class="muted">${escapeHtml(c.calm)}</p></div>
            <div class="feature-grid">
              ${feature('01',c.materials,c.materialText)}${feature('02',c.planning,c.planningText)}${feature('03',c.community,c.communityText)}
            </div>
          </section>
          <section class="landing-section landing-about" id="about"><div class="eyebrow">${escapeHtml(c.about)}</div><h2>${escapeHtml(c.aboutTitle)}</h2><p>${escapeHtml(c.aboutText)}</p></section>
          <section class="landing-section landing-contact" id="contact"><div><div class="eyebrow">${escapeHtml(c.contact)}</div><h2>${escapeHtml(c.contactTitle)}</h2><p>${escapeHtml(c.contactText)}</p></div><a class="btn btn-primary" href="mailto:hatemkhaleefah3@gmail.com">${escapeHtml(c.contactAction)}</a></section>
          <section class="landing-cta"><h2>${escapeHtml(c.cta)}</h2><button class="btn" data-go="join">${escapeHtml(c.join)} →</button></section>
        </main>
      </div>
    </div>`;
  bindCommon();
  document.querySelectorAll('[data-landing-section]').forEach(button=>button.onclick=()=>{const target=document.getElementById(button.dataset.landingSection);target?.scrollIntoView({behavior:'smooth',block:'start'});document.querySelectorAll('.landing-nav-link').forEach(item=>item.classList.toggle('active',item===button));});
  document.querySelector('[data-interface-language]')?.addEventListener('click',event=>{applyInterfaceLanguage(event.currentTarget.dataset.interfaceLanguage);landing();});
}

function brand(){ return `<a class="brand" href="#landing"><span class="brand-mark">D</span><span class="brand-name">dafatii</span></a>`; }
function feature(num,title,text){ return `<article class="feature-card"><div class="num">${num}</div><h3>${title}</h3><p>${text}</p></article>`; }

function join(){
  const isSignup = state.authMode === 'signup';
  const authOffline = window.DafatiiAuth?.availability === 'offline';
  const c=AUTH_COPY[interfaceLanguage()];
  app.innerHTML = `
  <div class="join-page">
    <section class="join-panel">
      <div class="join-brand">${brand()}</div>
      <div class="join-copy"><div class="eyebrow">${escapeHtml(c.join)}</div><h1>${escapeHtml(c.build)}</h1><p>${escapeHtml(c.description)}</p></div>
      <div class="join-art"><span>${escapeHtml(c.subjects)}</span><span>${escapeHtml(c.calendar)}</span><span>${escapeHtml(c.rooms)}</span><span>${escapeHtml(c.chat)}</span></div>
    </section>
    <section class="auth-side">
      <div class="auth-card">
        <div class="auth-card-tools"><button class="landing-language" data-interface-language="${interfaceLanguage()==='ar'?'en':'ar'}">${interfaceLanguage()==='ar'?'EN':'ع'}</button></div>
        <div class="auth-tabs"><button class="auth-tab ${!isSignup?'active':''}" data-auth="signin">${escapeHtml(c.signin)}</button><button class="auth-tab ${isSignup?'active':''}" data-auth="signup">${escapeHtml(c.signup)}</button></div>
        <h2>${escapeHtml(isSignup ? c.create : c.welcome)}</h2>
        <p>${escapeHtml(isSignup ? c.createText : c.signinText)}</p>
        <form id="auth-form">
          ${isSignup ? `<div class="field"><label>${escapeHtml(c.name)}</label><input name="name" autocomplete="name" placeholder="${escapeHtml(c.namePlaceholder)}" required></div>` : ''}
          <div class="field"><label>${escapeHtml(c.email)}</label><input type="email" name="email" autocomplete="email" placeholder="you@example.com" required></div>
          <div class="field"><label>${escapeHtml(c.password)}</label><input type="password" name="password" minlength="12" maxlength="256" autocomplete="${isSignup?'new-password':'current-password'}" placeholder="••••••••••••" required></div>
          ${isSignup ? `<div class="field"><label>${escapeHtml(c.accountType)}</label><select name="accountType"><option value="student">${escapeHtml(c.student)}</option><option value="representer">${escapeHtml(c.representer)}</option></select></div><div class="field"><label>${escapeHtml(c.stage)}</label><select name="studentStage"><option value="school">${escapeHtml(c.school)}</option><option value="university" selected>${escapeHtml(c.university)}</option><option value="independent">${escapeHtml(c.independent)}</option></select></div>` : ''}
          <button class="btn btn-primary auth-submit" type="submit">${escapeHtml(isSignup ? c.createButton : c.signin)} →</button>
        </form>
        <div class="auth-note" id="auth-status">${escapeHtml(authOffline ? c.offline : c.secure)}</div>
        ${authOffline ? `<button class="btn btn-ghost auth-retry" id="auth-retry" type="button">${escapeHtml(c.retry)}</button>` : ''}
      </div>
    </section>
  </div>`;
  document.querySelectorAll('[data-auth]').forEach(b=>b.onclick=()=>{state.authMode=b.dataset.auth;join();});
  document.querySelector('[data-interface-language]')?.addEventListener('click',event=>{applyInterfaceLanguage(event.currentTarget.dataset.interfaceLanguage);join();});
  const retry=document.getElementById('auth-retry');
  if(retry) retry.onclick=async()=>{
    retry.disabled=true;
    document.getElementById('auth-status').textContent=c.reconnecting;
    await window.DafatiiAuth.current();
    if(window.DafatiiAuth.availability==='offline'){
      retry.disabled=false;
      document.getElementById('auth-status').textContent=c.stillOffline;
    }
  };
  document.getElementById('auth-form').onsubmit = async e=>{
    e.preventDefault();
    const form=e.currentTarget, submit=form.querySelector('[type=submit]'), status=document.getElementById('auth-status');
    form.dataset.submitting='true'; submit.disabled=true; status.textContent=isSignup?c.creating:c.signing;
    try{
      const values=new FormData(form);
      if(isSignup) await window.DafatiiAuth.signup({email:values.get('email'),password:values.get('password'),displayName:values.get('name'),accountType:values.get('accountType'),studentStage:values.get('studentStage')});
      else await window.DafatiiAuth.login({email:values.get('email'),password:values.get('password')});
      state.joined = true; await window.DafatiiCourses.refresh(); setHash(window.DafatiiAuth?.user?.studentStage==='school'?'dashboard':window.DafatiiCourses.active().id?'dashboard/overview':'change-course');
    }catch(error){
      const suffix=error.code?` (${error.code})`:'';
      status.textContent=`${error.message||c.failed}${suffix}`;
      submit.disabled=false;
      delete form.dataset.submitting;
    }
  };
}

function schoolManagedWorkspace(){return Boolean(window.DafatiiSchoolWorkspaceReady&&window.DafatiiAuth?.user?.accountType==='student'&&window.DafatiiAuth?.user?.studentStage==='school'&&window.DafatiiCourses?.active?.()?.isSchoolProgram);}

function subjectListView(){
  const managed=schoolManagedWorkspace();
  const cards = state.subjects.length ? state.subjects.map(subjectCard).join('') : `
    <div class="subjects-empty">
      <div class="subjects-empty-icon">${icon('subjects')}</div>
      <h2>No subjects yet</h2>
      <p>${managed?'Your selected teachers have not published subject content yet.':'Add your first subject to start organizing materials.'}</p>
      ${managed?'':'<button class="btn btn-primary" id="subjects-empty-add">Add subject</button>'}
    </div>`;
  return `
    <section class="subjects-page ${managed?'school-managed-subjects':''}">
      <div class="subjects-head">
        <div><div class="eyebrow">Subjects</div><h1>My subjects</h1></div>
        ${managed?'':`<button class="subject-add" id="subject-add" aria-label="Add subject"><span>${icon('add')}</span><strong>Add subject</strong></button>`}
      </div>
      <div class="subjects-grid">${cards}</div>
    </section>`;
}

function subjectCard(subject){
  const managed=schoolManagedWorkspace();
  const lectureCount=Array.isArray(state.lectures[subject.id])?state.lectures[subject.id].length:0;
  const lectureLabel=`${lectureCount} ${lectureCount===1?'lecture':'lectures'}`;
  return `
    <div class="subject-card-wrap ${managed?'school-managed-card':''}" data-subject-id="${escapeHtml(subject.id)}">
      <article class="subject-card" tabindex="0" role="button" aria-label="Open ${escapeHtml(subject.name)}">
        <div class="subject-card-top">
          <div class="subject-icon" aria-hidden="true">${escapeHtml(subject.icon)}</div>
          ${managed?'':`<div class="subject-desktop-actions"><button class="subject-mini-action edit" data-edit-subject="${escapeHtml(subject.id)}" aria-label="Edit ${escapeHtml(subject.name)}">${icon('edit')}</button><button class="subject-mini-action delete" data-delete-subject="${escapeHtml(subject.id)}" aria-label="Delete ${escapeHtml(subject.name)}">${icon('trash')}</button></div>`}
        </div>
        <div class="subject-card-copy">
          <div class="subject-card-heading"><h2>${escapeHtml(subject.name)}</h2>${managed&&subject.teacherName?`<span class="subject-card-teacher">${escapeHtml(subject.teacherName)}</span>`:''}</div>
          <div class="subject-card-footer"><span class="subject-card-meta">${escapeHtml(lectureLabel)}</span><span class="subject-card-open" aria-hidden="true">${icon('arrow-right')}</span></div>
        </div>
      </article>
    </div>`;
}
function subjectDetailView(subject, tab){
  if(tab === 'lectures') return lectureListView(subject);
  return `<section class="empty-state subject-detail">
    <div class="empty-icon">${escapeHtml(subject.icon)}</div>
    <h1>${escapeHtml(tab === 'degrees' ? 'Degrees' : 'Analysis')}</h1>
    <p>${escapeHtml(subject.name)} · Coming soon…</p>
  </section>`;
}

function lectureListView(subject){
  const managed=schoolManagedWorkspace(),lectures = subjectLectures(subject.id);
  const cards = lectures.length ? lectures.map(l=>lectureCard(subject, l)).join('') : `
    <div class="subjects-empty lecture-empty">
      <div class="subjects-empty-icon">${icon('subjects')}</div>
      <h2>No lectures yet</h2>
      <p>${managed?'This teacher has not published lectures for this chapter yet.':`Add your first lecture for ${escapeHtml(subject.name)}.`}</p>
      ${managed?'':'<button class="btn btn-primary" id="lectures-empty-add">Add lecture</button>'}
    </div>`;
  return `
    <section class="subjects-page lectures-page ${managed?'school-managed-subjects':''}">
      <div class="subjects-head"><div><div class="eyebrow">${escapeHtml(subject.name)} · Lectures</div><h1>Lectures</h1></div>${managed?'':`<button class="subject-add" id="lecture-add" aria-label="Add lecture"><span>${icon('add')}</span><strong>Add lecture</strong></button>`}</div>
      <div class="subjects-grid">${cards}</div>
    </section>`;
}

function lectureCard(subject, lecture){
  const hasLink = Boolean(String(lecture.link || '').trim()),managed=schoolManagedWorkspace();
  return `
    <div class="lecture-card-wrap ${managed?'school-managed-card':''}" data-lecture-id="${escapeHtml(lecture.id)}" data-subject-id="${escapeHtml(subject.id)}">
      <article class="subject-card lecture-card" tabindex="0" role="button" aria-label="Open ${escapeHtml(lecture.name)}">
        <div class="subject-card-top">
          <div class="subject-icon">${escapeHtml(lecture.icon || '▶')}</div>
          ${managed?'':`<div class="subject-desktop-actions"><button class="subject-mini-action edit" data-edit-lecture="${escapeHtml(lecture.id)}" aria-label="Edit ${escapeHtml(lecture.name)}">${icon('edit')}</button><button class="subject-mini-action delete" data-delete-lecture="${escapeHtml(lecture.id)}" aria-label="Delete ${escapeHtml(lecture.name)}">${icon('trash')}</button></div>`}
        </div>
        <div class="subject-card-copy">
          <h2>${escapeHtml(lecture.name)}</h2>
          <p>${hasLink ? 'Open lecture link ↗' : 'No link added'}</p>
        </div>
      </article>
    </div>`;
}

function workspaceContent(page, parts, title){
  if(page === 'subjects'){
    if(parts[1] === 'subject'){
      const subject = state.subjects.find(s=>s.id===decodeURIComponent(parts[2] || ''));
      if(!subject) return subjectListView();
      const tab = String(parts[3] || 'lectures').toLowerCase();
      return subjectDetailView(subject, SUBJECT_TABS.map(x=>x.toLowerCase()).includes(tab) ? tab : 'lectures');
    }
    const sub = decodeURIComponent(parts.slice(1).join('/'));
    if(!sub || sub.toLowerCase() === 'all subjects') return subjectListView();
  }
  return `<section class="empty-state"><div class="empty-icon">${icon(page)}</div><h1>${escapeHtml(title)}</h1><p>Coming soon…</p></section>`;
}

function interfaceLanguage(){return window.DafatiiData?.readString('dafatii:interface-language')==='en'?'en':'ar';}
function interfaceTheme(){return window.DafatiiData?.readString('dafatii:theme')==='dark'?'dark':'light';}
function applyInterfaceTheme(theme=interfaceTheme()){
  const normalized=theme==='dark'?'dark':'light';
  document.documentElement.dataset.theme=normalized;
  document.documentElement.style.colorScheme=normalized;
  window.DafatiiData?.writeString('dafatii:theme',normalized);
}
function applyInterfaceLanguage(language=interfaceLanguage()){
  document.documentElement.lang=language;
  document.documentElement.dir=language==='ar'?'rtl':'ltr';
  window.DafatiiData?.writeString('dafatii:interface-language',language);
}
function workspace(current){
  if(!window.DafatiiCourses.active().id&&!schoolManagedWorkspace()){
    if(window.DafatiiOnboarding?.recover?.())return;
    app.innerHTML='<div class="join-page"><section class="auth-side"><div class="auth-card"><h2>Preparing onboarding…</h2></div></section></div>';
    return;
  }
  const parts = current.split('/');
  const page = parts[0];
  const inSubject = page === 'subjects' && parts[1] === 'subject';
  const subject = inSubject ? state.subjects.find(s=>s.id===decodeURIComponent(parts[2] || '')) : null;
  const subjectTab = subject ? String(parts[3] || 'lectures').toLowerCase() : '';
  const sub = inSubject ? '' : decodeURIComponent(parts.slice(1).join('/'));
  const mainActive = MAIN_NAV[page] ? page : '';
  const title = subject ? `${subject.name} · ${prettify(subjectTab)}` : sub || LABELS[page] || prettify(page);
  const sidebarClass = state.sidebar ? ' sidebar-open' : '';
  app.innerHTML = `
  <div class="app-shell workspace${sidebarClass}">
    <header class="main-nav"><div class="inner">
      ${brand()}
      <nav class="nav-center">${Object.keys(MAIN_NAV).map(k=>`<button class="nav-link ${mainActive===k?'active':''}" data-page="${k}">${LABELS[k]}</button>`).join('')}</nav>
      <div class="user-chip"><span class="avatar">${escapeHtml((window.DafatiiAuth?.user?.displayName||'D')[0])}</span><span>${escapeHtml(window.DafatiiAuth?.user?.displayName||'Account')}</span></div>
    </div></header>

    <div class="settings-nav ${state.sidebar?'hidden':''}"><div class="settings-inner">
      ${settingAction('settings','Settings')}${settingAction('profile','Profile')}${window.DafatiiAuth?.user?.studentStage==='school'?settingAction('school-teachers','Teachers'):''}${settingAction('change-course','Change Course')}${settingAction('change-language','Change Language')}${settingAction('dark-mode','Change Dark Mode')}
      <button class="settings-action sidebar-trigger" id="sidebar-open">${icon('menu')} Sidebar</button>
    </div></div>

    <div class="sub-nav"><div class="sub-inner">${subnav(mainActive,sub,subject,subjectTab)}</div></div>

    <aside class="sidebar ${state.sidebar?'open':''}">
      <div class="sidebar-head"><h3>Workspace</h3><button class="icon-btn" id="sidebar-close" aria-label="Close">${icon('close')}</button></div>
      <div class="sidebar-label">Settings</div>
      ${sideAction('settings','Settings')}${sideAction('profile','Profile')}${window.DafatiiAuth?.user?.studentStage==='school'?sideAction('school-teachers','Teachers'):''}${sideAction('change-course','Change Course')}${sideAction('change-language','Change Language')}${sideAction('dark-mode','Change Dark Mode')}
      ${window.DafatiiAuth?.user?.platformRole==='admin'?sideAction('admin','Admin Panel'):''}
      ${['owner','representer'].includes(window.DafatiiCourses.active().membership?.role)?sideAction('representer','Representer Panel'):''}
      <div class="sidebar-section"><div class="sidebar-label">Opportunities</div>
        ${sideAction('apply-work','Apply Work')}${sideAction('apply-scholarship','Apply Scholarship')}${sideAction('volunteer','Volunteer')}${sideAction('donate-us','Donate Us')}
      </div>
    </aside>

    <main class="workspace-main ${page==='subjects' ? 'workspace-main-subjects' : ''}">${workspaceContent(page,parts,title)}</main>
    <div id="overlay-root"></div>
  </div>`;
  bindWorkspace(subject);
  if(page === 'subjects' && !inSubject && (!parts[1] || decodeURIComponent(parts.slice(1).join('/')).toLowerCase() === 'all subjects')) bindSubjects();
  if(subject && subjectTab === 'lectures') bindLectures(subject);
}

function settingAction(key,label){return `<button class="settings-action" data-extra="${key}">${escapeHtml(label)}</button>`;}
function sideAction(key,label){return `<button class="side-action ${route()===key?'active':''}" data-extra="${key}">${icon(key)}${escapeHtml(label)}</button>`;}
function subnav(main,sub,subject,subjectTab){
  if(subject){
    return SUBJECT_TABS.map(tab=>{
      const slug = tab.toLowerCase();
      return `<button class="sub-link ${slug===subjectTab?'active':''}" data-subject-tab="${slug}">${tab}</button>`;
    }).join('');
  }
  if(!main) return `<span class="muted">Workspace</span>`;
  return MAIN_NAV[main].map((s,i)=>`<button class="sub-link ${(!sub&&i===0)||sub===s?'active':''}" data-sub="${encodeURIComponent(s)}">${s}</button>`).join('');
}
function prettify(v){ return String(v || '').split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' '); }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function makeId(prefix){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }

function bindCommon(){ document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>setHash(el.dataset.go)); }
function bindWorkspace(subject){
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>setHash(`${b.dataset.page}/${encodeURIComponent(MAIN_NAV[b.dataset.page][0])}`));
  document.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{const main=route().split('/')[0];setHash(`${main}/${b.dataset.sub}`)});
  document.querySelectorAll('[data-extra]').forEach(b=>b.onclick=()=>setHash(b.dataset.extra));
  document.querySelectorAll('[data-subject-tab]').forEach(b=>b.onclick=()=>{
    if(subject) setHash(`subjects/subject/${encodeURIComponent(subject.id)}/${b.dataset.subjectTab}`);
  });
  const open=document.getElementById('sidebar-open'), close=document.getElementById('sidebar-close');
  if(open) open.onclick=()=>{state.sidebar=true;render();};
  if(close) close.onclick=()=>{state.sidebar=false;render();};
}

function bindSubjects(){
  const managed=schoolManagedWorkspace();
  if(!managed)document.getElementById('subject-add')?.addEventListener('click',()=>openSubjectSheet());
  if(!managed)document.getElementById('subjects-empty-add')?.addEventListener('click',()=>openSubjectSheet());
  if(!managed)document.querySelectorAll('[data-edit-subject]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); openSubjectSheet(btn.dataset.editSubject);
  }));
  if(!managed)document.querySelectorAll('[data-delete-subject]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); deleteSubject(btn.dataset.deleteSubject);
  }));
  document.querySelectorAll('.subject-card-wrap[data-subject-id]').forEach(wrap=>{
    const id=wrap.dataset.subjectId;
    const card=wrap.querySelector('.subject-card');
    card.addEventListener('click',()=>setHash(`subjects/subject/${encodeURIComponent(id)}/lectures`));
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setHash(`subjects/subject/${encodeURIComponent(id)}/lectures`);}});
  });
}

function bindLectures(subject){
  const managed=schoolManagedWorkspace();
  if(!managed)document.getElementById('lecture-add')?.addEventListener('click',()=>openLectureSheet(subject));
  if(!managed)document.getElementById('lectures-empty-add')?.addEventListener('click',()=>openLectureSheet(subject));
  if(!managed)document.querySelectorAll('[data-edit-lecture]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); openLectureSheet(subject, btn.dataset.editLecture);
  }));
  if(!managed)document.querySelectorAll('[data-delete-lecture]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); deleteLecture(subject, btn.dataset.deleteLecture);
  }));
  document.querySelectorAll('.lecture-card-wrap').forEach(wrap=>{
    const id=wrap.dataset.lectureId;
    const lecture=subjectLectures(subject.id).find(l=>l.id===id);
    const card=wrap.querySelector('.lecture-card');
    const open=()=>openLectureLink(lecture);
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
}


function openSubjectSheet(subjectId=''){
  const subject=state.subjects.find(s=>s.id===subjectId);
  openEntitySheet({
    title:subject?'Edit subject':'Add subject',
    name:subject?.name||'',
    icon:subject?.icon||SUBJECT_ICONS[0],
    icons:SUBJECT_ICONS,
    submitLabel:subject?'Save changes':'Add subject',
    onSubmit:({name,icon})=>{
      if(subject){subject.name=name;subject.icon=icon;}
      else state.subjects.push({id:makeId('subject'),name,icon});
      saveSubjects(); closeEntitySheet(); render();
    }
  });
}

function openLectureSheet(subject, lectureId=''){
  const lectures=subjectLectures(subject.id);
  const lecture=lectures.find(l=>l.id===lectureId);
  openEntitySheet({
    title:lecture?'Edit lecture':'Add lecture',
    name:lecture?.name||'',
    icon:lecture?.icon||LECTURE_ICONS[0],
    icons:LECTURE_ICONS,
    link:lecture?.link||'',
    showLink:true,
    submitLabel:lecture?'Save changes':'Add lecture',
    onSubmit:({name,icon,link})=>{
      if(lecture){lecture.name=name;lecture.icon=icon;lecture.link=link;}
      else lectures.push({id:makeId('lecture'),name,icon,link});
      state.lectures[subject.id]=lectures;
      saveLectures(); closeEntitySheet(); render();
    }
  });
}

function openEntitySheet({title,name,icon,icons,link='',showLink=false,submitLabel,onSubmit}){
  const root=document.getElementById('overlay-root');
  if(!root)return;
  root.innerHTML=`
    <div class="entity-sheet-overlay" id="entity-sheet-overlay">
      <section class="entity-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="entity-sheet-handle"></div>
        <div class="entity-sheet-head"><div><div class="eyebrow">${showLink?'Lecture':'Subject'}</div><h2>${escapeHtml(title)}</h2></div><button class="icon-btn" id="entity-sheet-close" aria-label="Close">${icon('close')}</button></div>
        <form id="entity-form">
          <div class="field"><label>Name</label><input id="entity-name" maxlength="80" value="${escapeHtml(name)}" placeholder="${showLink?'Lecture name':'Subject name'}" required></div>
          ${showLink?`<div class="field"><label>Lecture link <span class="field-optional">Optional</span></label><input id="entity-link" type="url" inputmode="url" value="${escapeHtml(link)}" placeholder="https://example.com/lecture"></div>`:''}
          <div class="entity-icon-label">Choose icon</div>
          <div class="entity-icon-grid">${icons.map(i=>`<button type="button" class="entity-icon-choice ${i===icon?'active':''}" data-icon="${escapeHtml(i)}">${escapeHtml(i)}</button>`).join('')}</div>
          <button class="btn btn-primary entity-submit" type="submit">${escapeHtml(submitLabel)}</button>
        </form>
      </section>
    </div>`;
  let selectedIcon=icon;
  const overlay=document.getElementById('entity-sheet-overlay');
  document.getElementById('entity-sheet-close').onclick=closeEntitySheet;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeEntitySheet();});
  document.querySelectorAll('.entity-icon-choice').forEach(btn=>btn.onclick=()=>{
    selectedIcon=btn.dataset.icon;
    document.querySelectorAll('.entity-icon-choice').forEach(x=>x.classList.toggle('active',x===btn));
  });
  document.getElementById('entity-form').onsubmit=e=>{
    e.preventDefault();
    const entityName=document.getElementById('entity-name').value.trim();
    if(!entityName)return;
    const entityLink=showLink?document.getElementById('entity-link').value.trim():'';
    onSubmit({name:entityName,icon:selectedIcon,link:entityLink});
  };
  setTimeout(()=>document.getElementById('entity-name')?.focus(),60);
}

function closeEntitySheet(){ const root=document.getElementById('overlay-root'); if(root)root.innerHTML=''; }

function deleteSubject(id){
  const index=state.subjects.findIndex(s=>s.id===id); if(index<0)return;
  const removed=state.subjects[index];
  const removedLectures=state.lectures[id];
  state.subjects.splice(index,1); delete state.lectures[id]; saveSubjects(); saveLectures(); render();
  showToast(`${removed.name} deleted`, 'Undo', ()=>{
    state.subjects.splice(Math.min(index,state.subjects.length),0,removed);
    if(removedLectures)state.lectures[id]=removedLectures;
    saveSubjects();saveLectures();render();
  });
}

function deleteLecture(subject,id){
  const lectures=subjectLectures(subject.id); const index=lectures.findIndex(l=>l.id===id); if(index<0)return;
  const removed=lectures[index]; lectures.splice(index,1); state.lectures[subject.id]=lectures; saveLectures(); render();
  showToast(`${removed.name} deleted`, 'Undo', ()=>{
    const current=subjectLectures(subject.id);current.splice(Math.min(index,current.length),0,removed);state.lectures[subject.id]=current;saveLectures();render();
  });
}

function openLectureLink(lecture){
  if(!lecture)return;
  let raw=String(lecture.link||'').trim();
  if(!raw){showToast('No lecture link added');return;}
  if(!/^https?:\/\//i.test(raw)) raw=`https://${raw}`;
  try {
    const url=new URL(raw);
    if(!['http:','https:'].includes(url.protocol))throw new Error('bad protocol');
    const win=window.open(url.href,'_blank','noopener,noreferrer');
    if(win)win.opener=null;
  } catch { showToast('Invalid lecture link'); }
}

function showToast(message,actionLabel='',action){
  document.querySelector('.toast')?.remove();
  const toast=document.createElement('div'); toast.className='toast';
  toast.innerHTML=`<span>${escapeHtml(message)}</span>${actionLabel?`<button type="button">${escapeHtml(actionLabel)}</button>`:''}`;
  document.body.appendChild(toast);
  if(actionLabel)toast.querySelector('button').onclick=()=>{toast.remove();action?.();};
  setTimeout(()=>toast.remove(),4200);
}

function render(){
  const r=route();
  if(r==='landing'){ landing(); return; }
  if(r==='join'){ join(); return; }
  if(!state.authReady){ app.innerHTML='<div class="join-page"><section class="auth-side"><div class="auth-card"><h2>Checking your session…</h2><p>Your secure workspace is loading.</p></div></section></div>'; return; }
  if(!state.joined){ setHash('join'); return; }
  if(window.DafatiiOnboarding?.blocks?.()){void window.DafatiiOnboarding.render();return;}
  if(r==='onboarding'){setHash(window.DafatiiCourses.active().id||schoolManagedWorkspace()?'dashboard/Overview':'onboarding');return;}
  workspace(r);
}

window.addEventListener('hashchange',render);
window.addEventListener('dafatii:auth:availability',()=>{
  if(route()==='join'&&!document.getElementById('auth-form')?.dataset.submitting) join();
});
window.addEventListener('online',()=>{ if(window.DafatiiAuth?.availability==='offline') window.DafatiiAuth.current(); });
window.addEventListener('dafatii:datahydrated',async()=>{
  state.subjects = loadSubjects();
  state.lectures = loadLectures();
  if(state.joined&&!window.DafatiiOnboarding?.blocks?.()&&!window.DafatiiCourses.active().id){
    try{await window.DafatiiCourses.refresh();}catch(error){console.warn('Course access unavailable.',error.code||error.message);}
  }
  render();
});
window.addEventListener('dafatii:coursechanged',()=>{
  state.subjects = loadSubjects();
  state.lectures = loadLectures();
  render();
});
window.addEventListener('dafatii:coursesloaded',()=>{
  if(!state.authReady||!state.joined)return;
  if(window.DafatiiOnboarding?.blocks?.()){render();return;}
  if(window.DafatiiCourses.active().id&&route()==='onboarding')setHash('dashboard/Overview');
  else render();
});
window.addEventListener('dafatii:auth:changed',event=>{
  state.joined=Boolean(event.detail.user);state.authReady=true;
  // Student Course state is resolved after data hydration so onboarding can own a new signup without competing schema/API work.
  if(state.joined&&event.detail.user?.accountType!=='student'){
    window.DafatiiCourses.refresh().catch(error=>console.warn('Course access unavailable.',error.code||error.message));
  }
  render();
});
window.addEventListener('dafatii:coursewriteerror',event=>{showToast(event.detail.error?.message||'Course change was not saved.');state.subjects=loadSubjects();state.lectures=loadLectures();render();});
window.addEventListener('DOMContentLoaded',()=>{applyInterfaceTheme();applyInterfaceLanguage();if(!location.hash)location.hash='landing';else render();});
setInterval(()=>{if(state.joined&&!window.DafatiiOnboarding?.blocks?.()&&!window.DafatiiCourses.active().id&&document.visibilityState==='visible')window.DafatiiCourses.refresh().catch(()=>{});},60000);
window.addEventListener('focus',()=>{if(state.joined&&!window.DafatiiOnboarding?.blocks?.()&&!window.DafatiiCourses.active().id)window.DafatiiCourses.refresh().catch(()=>{});});
