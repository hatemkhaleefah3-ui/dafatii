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
  return window.DafatiiData.readJSON(key, fallback);
}

function loadSubjects(){
  const stored = loadJSON('dafatii:subjects', null);
  return Array.isArray(stored) ? stored : DEFAULT_SUBJECTS;
}

function loadLectures(){
  const stored = loadJSON('dafatii:lectures', {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

const state = {
  joined: window.DafatiiData.readString('dafatii:joined') === '1',
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

const LABELS = {
  dashboard: 'Dashboard', subjects: 'Subjects', calendar: 'Calendar',
  'study-rooms': 'Study Rooms', chat: 'Chat', settings: 'Settings', profile: 'Profile',
  'change-course': 'Change Course', 'change-language': 'Change Language', 'dark-mode': 'Change Dark Mode',
  'apply-work': 'Apply Work', 'apply-scholarship': 'Apply Scholarship', volunteer: 'Volunteer', 'donate-us': 'Donate Us'
};

function icon(name){
  const icons = {
    dashboard:'⌂', subjects:'◇', calendar:'□', 'study-rooms':'◎', chat:'◌', settings:'⚙', profile:'○',
    'change-course':'↻','change-language':'文','dark-mode':'◐','apply-work':'↗','apply-scholarship':'✦',volunteer:'♡','donate-us':'＋'
  };
  return icons[name] || '•';
}

function setHash(hash){ location.hash = hash; }
function route(){ return location.hash.replace(/^#\/?/,'') || 'landing'; }
function saveSubjects(){ window.DafatiiData.writeJSON('dafatii:subjects', state.subjects); }
function saveLectures(){ window.DafatiiData.writeJSON('dafatii:lectures', state.lectures); }
function subjectLectures(subjectId){ return Array.isArray(state.lectures[subjectId]) ? state.lectures[subjectId] : []; }

function landing(){
  app.innerHTML = `
    <div class="app-shell page">
      <div class="container">
        <nav class="landing-nav">
          ${brand()}
          <div class="nav-actions">
            <button class="btn btn-ghost" data-go="join">Sign in</button>
            <button class="btn btn-primary" data-go="join">Join us →</button>
          </div>
        </nav>
        <main>
          <section class="hero">
            <div>
              <div class="eyebrow">Your study life, one place</div>
              <h1>Study less scattered. <span>Learn more.</span></h1>
              <p>Dafatii brings materials, subjects, schedules, rooms and conversations into one focused workspace for school, university and independent learners.</p>
              <div class="hero-actions">
                <button class="btn btn-primary" data-go="join">Start studying →</button>
                <a class="btn btn-ghost" href="#features">Explore features</a>
              </div>
              <div class="hero-proof"><span><strong>One workspace</strong> for every course</span><span><strong>Built for focus</strong>, not clutter</span></div>
            </div>
            <div class="hero-visual" aria-hidden="true">
              <div class="float-card main">
                <div class="mock-top"><strong>Today</strong><span class="muted">Study workspace</span></div>
                <div class="mock-grid">
                  <div class="mock-block"><strong>Physics</strong><div class="mock-pill"></div><div class="mock-pill accent"></div></div>
                  <div class="mock-block"><strong>Calculus</strong><div class="mock-pill"></div><div class="mock-pill"></div></div>
                  <div class="mock-block big"><strong>Upcoming</strong><div class="mock-pill"></div><div class="mock-pill accent"></div><div class="mock-pill"></div></div>
                </div>
              </div>
              <div class="float-card mini-card"><div class="mini-icon">✓</div><strong>Focus mode</strong><p class="muted">Ready when you are.</p></div>
              <div class="float-card mini-card bottom"><div class="mini-icon">24</div><strong>Materials</strong><p class="muted">Everything in reach.</p></div>
            </div>
          </section>
          <section class="landing-section" id="features">
            <div class="section-head"><div><div class="eyebrow">Designed around students</div><h2>Everything has a place.</h2></div><p class="muted">A calm interface for complex academic life.</p></div>
            <div class="feature-grid">
              ${feature('01','Materials','Keep subjects, notes and resources organized around the way you actually study.')}
              ${feature('02','Planning','Put classes, exams, deadlines and study sessions on one coherent timeline.')}
              ${feature('03','Community','Move from solo study to focused rooms and conversations when collaboration helps.')}
            </div>
          </section>
          <section class="landing-cta"><h2>Your next semester deserves a cleaner system.</h2><button class="btn" data-go="join">Join Dafatii →</button></section>
        </main>
      </div>
    </div>`;
  bindCommon();
}

function brand(){ return `<a class="brand" href="#landing"><span class="brand-mark">D</span><span class="brand-name">dafatii</span></a>`; }
function feature(num,title,text){ return `<article class="feature-card"><div class="num">${num}</div><h3>${title}</h3><p>${text}</p></article>`; }

function join(){
  const isSignup = state.authMode === 'signup';
  app.innerHTML = `
  <div class="join-page">
    <section class="join-panel">
      <div class="join-brand">${brand()}</div>
      <div class="join-copy"><div class="eyebrow">Join the workspace</div><h1>Build your academic home.</h1><p>For school students, university students and independent learners who want materials, planning and collaboration in one focused system.</p></div>
      <div class="join-art"><span>Subjects</span><span>Calendar</span><span>Study rooms</span><span>Chat</span></div>
    </section>
    <section class="auth-side">
      <div class="auth-card">
        <div class="auth-tabs"><button class="auth-tab ${!isSignup?'active':''}" data-auth="signin">Sign in</button><button class="auth-tab ${isSignup?'active':''}" data-auth="signup">Sign up</button></div>
        <h2>${isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p>${isSignup ? 'Set up your Dafatii workspace in a few seconds.' : 'Sign in to continue to your workspace.'}</p>
        <form id="auth-form">
          ${isSignup ? `<div class="field"><label>Full name</label><input name="name" autocomplete="name" placeholder="Your name" required></div>` : ''}
          <div class="field"><label>Email</label><input type="email" name="email" autocomplete="email" placeholder="you@example.com" required></div>
          <div class="field"><label>Password</label><input type="password" name="password" minlength="12" maxlength="256" autocomplete="${isSignup?'new-password':'current-password'}" placeholder="••••••••••••" required></div>
          ${isSignup ? `<div class="field"><label>I study as</label><select name="studentType"><option>School student</option><option>University student</option><option>Independent student</option></select></div>` : ''}
          <button class="btn btn-primary auth-submit" type="submit">${isSignup ? 'Create account' : 'Sign in'} →</button>
        </form>
        <button class="btn btn-ghost auth-submit" id="access-site" type="button">Access website without account →</button>
        <div class="auth-note" id="auth-status">Credentials are verified by Dafatii's server. Guest access remains local-only and does not synchronize.</div>
      </div>
    </section>
  </div>`;
  document.querySelectorAll('[data-auth]').forEach(b=>b.onclick=()=>{state.authMode=b.dataset.auth;join();});
  document.getElementById('auth-form').onsubmit = async e=>{
    e.preventDefault();
    const form=e.currentTarget, submit=form.querySelector('[type=submit]'), status=document.getElementById('auth-status');
    submit.disabled=true; status.textContent=isSignup?'Creating account…':'Signing in…';
    try{
      const values=new FormData(form);
      if(isSignup) await window.DafatiiAuth.signup({email:values.get('email'),password:values.get('password'),displayName:values.get('name')});
      else await window.DafatiiAuth.login({email:values.get('email'),password:values.get('password')});
      state.joined = true; window.DafatiiData.writeString('dafatii:joined','1'); setHash('dashboard/overview');
    }catch(error){status.textContent=error.message||'Authentication failed.';submit.disabled=false;}
  };
  document.getElementById('access-site').onclick = ()=>{
    state.joined = true; window.DafatiiData.writeString('dafatii:joined','1');
    setHash('dashboard/overview');
  };
}

function subjectListView(){
  const cards = state.subjects.length ? state.subjects.map(subjectCard).join('') : `
    <div class="subjects-empty">
      <div class="subjects-empty-icon">＋</div>
      <h2>No subjects yet</h2>
      <p>Add your first subject to start organizing materials.</p>
      <button class="btn btn-primary" id="subjects-empty-add">Add subject</button>
    </div>`;
  return `
    <section class="subjects-page">
      <div class="subjects-head">
        <div>
          <div class="eyebrow">Subjects</div>
          <h1>My subjects</h1>
          <p>Open a subject, swipe left to edit, or swipe right to delete.</p>
        </div>
        <button class="subject-add" id="subject-add" aria-label="Add subject"><span>＋</span><strong>Add subject</strong></button>
      </div>
      <div class="subjects-grid">${cards}</div>
    </section>`;
}

function subjectCard(subject){
  return `
    <div class="subject-swipe" data-subject-id="${escapeHtml(subject.id)}">
      <div class="subject-action subject-action-delete">Delete</div>
      <div class="subject-action subject-action-edit">Edit</div>
      <article class="subject-card" tabindex="0" role="button" aria-label="Open ${escapeHtml(subject.name)}">
        <div class="subject-card-top">
          <div class="subject-icon">${escapeHtml(subject.icon)}</div>
          <div class="subject-desktop-actions">
            <button class="subject-mini-action edit" data-edit-subject="${escapeHtml(subject.id)}" aria-label="Edit ${escapeHtml(subject.name)}">✎</button>
            <button class="subject-mini-action delete" data-delete-subject="${escapeHtml(subject.id)}" aria-label="Delete ${escapeHtml(subject.name)}">×</button>
          </div>
        </div>
        <div class="subject-card-copy">
          <h2>${escapeHtml(subject.name)}</h2>
          <p>Open subject →</p>
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
  const lectures = subjectLectures(subject.id);
  const cards = lectures.length ? lectures.map(l=>lectureCard(subject, l)).join('') : `
    <div class="subjects-empty lecture-empty">
      <div class="subjects-empty-icon">＋</div>
      <h2>No lectures yet</h2>
      <p>Add your first lecture for ${escapeHtml(subject.name)}.</p>
      <button class="btn btn-primary" id="lectures-empty-add">Add lecture</button>
    </div>`;
  return `
    <section class="subjects-page lectures-page">
      <div class="subjects-head">
        <div>
          <div class="eyebrow">${escapeHtml(subject.name)} · Lectures</div>
          <h1>Lectures</h1>
          <p>Open a lecture link, swipe left to edit, or swipe right to delete.</p>
        </div>
        <button class="subject-add" id="lecture-add" aria-label="Add lecture"><span>＋</span><strong>Add lecture</strong></button>
      </div>
      <div class="subjects-grid">${cards}</div>
    </section>`;
}

function lectureCard(subject, lecture){
  const hasLink = Boolean(String(lecture.link || '').trim());
  return `
    <div class="subject-swipe lecture-swipe" data-lecture-id="${escapeHtml(lecture.id)}" data-subject-id="${escapeHtml(subject.id)}">
      <div class="subject-action subject-action-delete">Delete</div>
      <div class="subject-action subject-action-edit">Edit</div>
      <article class="subject-card lecture-card" tabindex="0" role="button" aria-label="Open ${escapeHtml(lecture.name)}">
        <div class="subject-card-top">
          <div class="subject-icon">${escapeHtml(lecture.icon || '▶')}</div>
          <div class="subject-desktop-actions">
            <button class="subject-mini-action edit" data-edit-lecture="${escapeHtml(lecture.id)}" aria-label="Edit ${escapeHtml(lecture.name)}">✎</button>
            <button class="subject-mini-action delete" data-delete-lecture="${escapeHtml(lecture.id)}" aria-label="Delete ${escapeHtml(lecture.name)}">×</button>
          </div>
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

function workspace(current){
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
      <div class="user-chip"><span class="avatar">D</span><span>Student</span></div>
    </div></header>

    <div class="settings-nav ${state.sidebar?'hidden':''}"><div class="settings-inner">
      ${settingAction('settings','Settings')}${settingAction('profile','Profile')}${settingAction('change-course','Change Course')}${settingAction('change-language','Change Language')}${settingAction('dark-mode','Change Dark Mode')}
      <button class="settings-action sidebar-trigger" id="sidebar-open">Sidebar ☰</button>
    </div></div>

    <div class="sub-nav"><div class="sub-inner">${subnav(mainActive,sub,subject,subjectTab)}</div></div>

    <aside class="sidebar ${state.sidebar?'open':''}">
      <div class="sidebar-head"><h3>Workspace</h3><button class="icon-btn" id="sidebar-close">×</button></div>
      <div class="sidebar-label">Settings</div>
      ${sideAction('settings','Settings')}${sideAction('profile','Profile')}${sideAction('change-course','Change Course')}${sideAction('change-language','Change Language')}${sideAction('dark-mode','Change Dark Mode')}
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
function sideAction(key,label){return `<button class="side-action ${route()===key?'active':''}" data-extra="${key}"><span class="side-dot"></span>${escapeHtml(label)}</button>`;}
function subnav(main,sub,subject,subjectTab){
  if(subject){
    return `<button class="sub-link subject-back" data-subjects-back>← ${escapeHtml(subject.name)}</button>` + SUBJECT_TABS.map(tab=>{
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
  document.querySelector('[data-subjects-back]')?.addEventListener('click',()=>setHash(`subjects/${encodeURIComponent('All subjects')}`));
  const open=document.getElementById('sidebar-open'), close=document.getElementById('sidebar-close');
  if(open) open.onclick=()=>{state.sidebar=true;render();};
  if(close) close.onclick=()=>{state.sidebar=false;render();};
}

function bindSubjects(){
  document.getElementById('subject-add')?.addEventListener('click',()=>openSubjectSheet());
  document.getElementById('subjects-empty-add')?.addEventListener('click',()=>openSubjectSheet());
  document.querySelectorAll('[data-edit-subject]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); openSubjectSheet(btn.dataset.editSubject);
  }));
  document.querySelectorAll('[data-delete-subject]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); deleteSubject(btn.dataset.deleteSubject);
  }));
  document.querySelectorAll('.subject-swipe[data-subject-id]').forEach(wrap=>{
    const id=wrap.dataset.subjectId;
    const card=wrap.querySelector('.subject-card');
    card.addEventListener('click',()=>setHash(`subjects/subject/${encodeURIComponent(id)}/lectures`));
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setHash(`subjects/subject/${encodeURIComponent(id)}/lectures`);}});
    bindSwipe(card,()=>openSubjectSheet(id),()=>deleteSubject(id));
  });
}

function bindLectures(subject){
  document.getElementById('lecture-add')?.addEventListener('click',()=>openLectureSheet(subject));
  document.getElementById('lectures-empty-add')?.addEventListener('click',()=>openLectureSheet(subject));
  document.querySelectorAll('[data-edit-lecture]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); openLectureSheet(subject, btn.dataset.editLecture);
  }));
  document.querySelectorAll('[data-delete-lecture]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); deleteLecture(subject, btn.dataset.deleteLecture);
  }));
  document.querySelectorAll('.lecture-swipe').forEach(wrap=>{
    const id=wrap.dataset.lectureId;
    const lecture=subjectLectures(subject.id).find(l=>l.id===id);
    const card=wrap.querySelector('.lecture-card');
    const open=()=>openLectureLink(lecture);
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    bindSwipe(card,()=>openLectureSheet(subject,id),()=>deleteLecture(subject,id));
  });
}

function bindSwipe(card,onEdit,onDelete){
  let startX=0,startY=0,currentX=0,dragging=false;
  const reset=()=>{card.style.transition='transform .2s ease';card.style.transform='translateX(0)';setTimeout(()=>card.style.transition='',220);};
  card.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;startX=e.clientX;startY=e.clientY;currentX=0;dragging=true;card.setPointerCapture?.(e.pointerId);});
  card.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(Math.abs(dy)>Math.abs(dx)+10)return;
    currentX=Math.max(-110,Math.min(110,dx));
    card.style.transform=`translateX(${currentX}px)`;
  });
  card.addEventListener('pointerup',()=>{
    if(!dragging)return;dragging=false;
    if(currentX<=-70){reset();onEdit();}
    else if(currentX>=70){reset();onDelete();}
    else reset();
  });
  card.addEventListener('pointercancel',()=>{dragging=false;reset();});
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
        <div class="entity-sheet-head"><div><div class="eyebrow">${showLink?'Lecture':'Subject'}</div><h2>${escapeHtml(title)}</h2></div><button class="icon-btn" id="entity-sheet-close" aria-label="Close">×</button></div>
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
  if(!state.joined){ setHash('join'); return; }
  workspace(r);
}

window.addEventListener('hashchange',render);
window.addEventListener('dafatii:datahydrated',()=>{
  state.joined = window.DafatiiData.readString('dafatii:joined') === '1';
  state.subjects = loadSubjects();
  state.lectures = loadLectures();
  render();
});
window.addEventListener('DOMContentLoaded',()=>{ if(!location.hash) location.hash='landing'; else render(); });
