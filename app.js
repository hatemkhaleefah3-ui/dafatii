const app = document.getElementById('app');

const DEFAULT_SUBJECTS = [
  { id: 'mathematics', name: 'Mathematics', icon: '∑' },
  { id: 'physics', name: 'Physics', icon: '⚛' },
  { id: 'english', name: 'English', icon: 'Aa' },
];

const SUBJECT_ICONS = ['∑','⚛','Aa','🧬','🧪','🌍','📚','✎','⌘','🎨','♫','🏛','⚽','🧠','💼','🔬'];

function loadSubjects(){
  try {
    const stored = JSON.parse(localStorage.getItem('dafatii:subjects') || 'null');
    return Array.isArray(stored) ? stored : DEFAULT_SUBJECTS;
  } catch {
    return DEFAULT_SUBJECTS;
  }
}

const state = {
  joined: localStorage.getItem('dafatii:joined') === '1',
  sidebar: false,
  authMode: 'signup',
  subjects: loadSubjects(),
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
function saveSubjects(){ localStorage.setItem('dafatii:subjects', JSON.stringify(state.subjects)); }

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
          <div class="field"><label>Password</label><input type="password" name="password" minlength="6" autocomplete="${isSignup?'new-password':'current-password'}" placeholder="••••••••" required></div>
          ${isSignup ? `<div class="field"><label>I study as</label><select name="studentType"><option>School student</option><option>University student</option><option>Independent student</option></select></div>` : ''}
          <button class="btn btn-primary auth-submit" type="submit">${isSignup ? 'Create account' : 'Sign in'} →</button>
        </form>
        <button class="btn btn-ghost auth-submit" id="access-site" type="button">Access website without account →</button>
        <div class="auth-note">Prototype authentication: this interface currently stores session state locally and does not send credentials to a server.</div>
      </div>
    </section>
  </div>`;
  document.querySelectorAll('[data-auth]').forEach(b=>b.onclick=()=>{state.authMode=b.dataset.auth;join();});
  document.getElementById('auth-form').onsubmit = e=>{
    e.preventDefault();
    state.joined = true; localStorage.setItem('dafatii:joined','1');
    setHash('dashboard/overview');
  };
  document.getElementById('access-site').onclick = ()=>{
    state.joined = true; localStorage.setItem('dafatii:joined','1');
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

function subjectDetailView(subject){
  return `<section class="empty-state subject-detail">
    <div class="empty-icon">${escapeHtml(subject.icon)}</div>
    <h1>${escapeHtml(subject.name)}</h1>
    <p>Coming soon…</p>
  </section>`;
}

function workspaceContent(page, parts, title){
  if(page === 'subjects'){
    if(parts[1] === 'subject'){
      const subject = state.subjects.find(s=>s.id===decodeURIComponent(parts[2] || ''));
      return subject ? subjectDetailView(subject) : subjectListView();
    }
    const sub = decodeURIComponent(parts.slice(1).join('/'));
    if(!sub || sub.toLowerCase() === 'all subjects') return subjectListView();
  }
  return `<section class="empty-state"><div class="empty-icon">${icon(page)}</div><h1>${escapeHtml(title)}</h1><p>Coming soon…</p></section>`;
}

function workspace(current){
  const parts = current.split('/');
  const page = parts[0];
  const sub = parts[1] === 'subject' ? '' : decodeURIComponent(parts.slice(1).join('/'));
  const mainActive = MAIN_NAV[page] ? page : '';
  const subject = page === 'subjects' && parts[1] === 'subject' ? state.subjects.find(s=>s.id===decodeURIComponent(parts[2] || '')) : null;
  const title = subject?.name || sub || LABELS[page] || prettify(page);
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

    <div class="sub-nav"><div class="sub-inner">${subnav(mainActive,sub)}</div></div>

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
  bindWorkspace();
  if(page === 'subjects' && (!parts[1] || decodeURIComponent(parts.slice(1).join('/')).toLowerCase() === 'all subjects')) bindSubjects();
}

function settingAction(key,label){return `<button class="settings-action" data-extra="${key}">${escapeHtml(label)}</button>`;}
function sideAction(key,label){return `<button class="side-action ${route()===key?'active':''}" data-extra="${key}"><span class="side-dot"></span>${escapeHtml(label)}</button>`;}
function subnav(main,sub){
  if(!main) return `<span class="muted">Workspace</span>`;
  return MAIN_NAV[main].map((s,i)=>`<button class="sub-link ${(!sub&&i===0)||sub===s?'active':''}" data-sub="${encodeURIComponent(s)}">${s}</button>`).join('');
}
function prettify(v){ return v.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' '); }
function escapeHtml(s){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function bindCommon(){ document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>setHash(el.dataset.go)); }
function bindWorkspace(){
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>setHash(`${b.dataset.page}/${encodeURIComponent(MAIN_NAV[b.dataset.page][0])}`));
  document.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{const main=route().split('/')[0];setHash(`${main}/${b.dataset.sub}`)});
  document.querySelectorAll('[data-extra]').forEach(b=>b.onclick=()=>setHash(b.dataset.extra));
  const open=document.getElementById('sidebar-open'), close=document.getElementById('sidebar-close');
  if(open) open.onclick=()=>{state.sidebar=true;render();};
  if(close) close.onclick=()=>{state.sidebar=false;render();};
}

function bindSubjects(){
  document.getElementById('subject-add')?.addEventListener('click',()=>openSubjectSheet('add'));
  document.getElementById('subjects-empty-add')?.addEventListener('click',()=>openSubjectSheet('add'));
  document.querySelectorAll('[data-edit-subject]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); openSubjectSheet('edit',btn.dataset.editSubject);
  }));
  document.querySelectorAll('[data-delete-subject]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation(); deleteSubject(btn.dataset.deleteSubject);
  }));

  document.querySelectorAll('.subject-swipe').forEach(shell=>{
    const card = shell.querySelector('.subject-card');
    const id = shell.dataset.subjectId;
    let startX = 0, deltaX = 0, dragging = false, moved = false;

    card.addEventListener('click',()=>{ if(!moved) setHash(`subjects/subject/${encodeURIComponent(id)}`); });
    card.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();setHash(`subjects/subject/${encodeURIComponent(id)}`);} });
    card.addEventListener('pointerdown',e=>{
      if(e.target.closest('button')) return;
      startX=e.clientX; deltaX=0; dragging=true; moved=false;
      card.setPointerCapture?.(e.pointerId);
    });
    card.addEventListener('pointermove',e=>{
      if(!dragging) return;
      deltaX=Math.max(-116,Math.min(116,e.clientX-startX));
      if(Math.abs(deltaX)>6) moved=true;
      card.style.transform=`translateX(${deltaX}px)`;
    });
    const endSwipe = ()=>{
      if(!dragging) return;
      dragging=false;
      card.style.transform='';
      if(deltaX <= -72) openSubjectSheet('edit',id);
      else if(deltaX >= 72) deleteSubject(id);
      setTimeout(()=>{moved=false;},0);
    };
    card.addEventListener('pointerup',endSwipe);
    card.addEventListener('pointercancel',endSwipe);
  });
}

function openSubjectSheet(mode,id){
  const existing = mode === 'edit' ? state.subjects.find(s=>s.id===id) : null;
  if(mode === 'edit' && !existing) return;
  const selectedIcon = existing?.icon || SUBJECT_ICONS[0];
  const root = document.getElementById('overlay-root');
  if(!root) return;
  root.innerHTML = `
    <div class="sheet-backdrop" id="subject-sheet-backdrop"></div>
    <section class="subject-sheet" role="dialog" aria-modal="true" aria-labelledby="subject-sheet-title">
      <div class="sheet-handle"></div>
      <div class="sheet-head">
        <div><div class="eyebrow">${mode==='edit'?'Edit subject':'New subject'}</div><h2 id="subject-sheet-title">${mode==='edit'?'Edit subject':'Add a subject'}</h2></div>
        <button class="icon-btn" id="subject-sheet-close" aria-label="Close">×</button>
      </div>
      <form id="subject-form">
        <div class="field">
          <label for="subject-name">Subject name</label>
          <input id="subject-name" name="name" maxlength="48" autocomplete="off" placeholder="e.g. Mathematics" value="${escapeHtml(existing?.name || '')}" required>
        </div>
        <div class="icon-picker-label">Choose an icon</div>
        <div class="subject-icon-picker">
          ${SUBJECT_ICONS.map(i=>`<button class="subject-icon-option ${i===selectedIcon?'selected':''}" type="button" data-icon="${escapeHtml(i)}" aria-label="Choose ${escapeHtml(i)}">${escapeHtml(i)}</button>`).join('')}
        </div>
        <input type="hidden" name="icon" value="${escapeHtml(selectedIcon)}">
        <div class="sheet-actions">
          <button class="btn btn-ghost" type="button" id="subject-cancel">Cancel</button>
          <button class="btn btn-primary" type="submit">${mode==='edit'?'Save changes':'Add subject'}</button>
        </div>
      </form>
    </section>`;

  const close=()=>{root.innerHTML='';};
  document.getElementById('subject-sheet-close').onclick=close;
  document.getElementById('subject-cancel').onclick=close;
  document.getElementById('subject-sheet-backdrop').onclick=close;
  document.querySelectorAll('.subject-icon-option').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.subject-icon-option').forEach(x=>x.classList.remove('selected'));
    btn.classList.add('selected');
    document.querySelector('#subject-form [name="icon"]').value=btn.dataset.icon;
  });
  const input=document.getElementById('subject-name');
  setTimeout(()=>input?.focus(),50);
  document.getElementById('subject-form').onsubmit=e=>{
    e.preventDefault();
    const data=new FormData(e.currentTarget);
    const name=String(data.get('name')||'').trim();
    const icon=String(data.get('icon')||SUBJECT_ICONS[0]);
    if(!name) return;
    if(mode==='edit'){
      state.subjects=state.subjects.map(s=>s.id===id?{...s,name,icon}:s);
    }else{
      const newId=`subject-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      state.subjects=[...state.subjects,{id:newId,name,icon}];
    }
    saveSubjects();
    close();
    render();
  };
}

function deleteSubject(id){
  const subject=state.subjects.find(s=>s.id===id);
  if(!subject) return;
  const index=state.subjects.findIndex(s=>s.id===id);
  state.subjects=state.subjects.filter(s=>s.id!==id);
  saveSubjects();
  render();
  showToast(`${subject.name} deleted`, 'Undo', ()=>{
    const next=[...state.subjects];
    next.splice(Math.min(index,next.length),0,subject);
    state.subjects=next;
    saveSubjects();
    render();
  });
}

function showToast(message,actionLabel,action){
  document.querySelector('.toast')?.remove();
  const toast=document.createElement('div');
  toast.className='toast';
  toast.innerHTML=`<span>${escapeHtml(message)}</span>${actionLabel?`<button type="button">${escapeHtml(actionLabel)}</button>`:''}`;
  document.body.appendChild(toast);
  let timer=setTimeout(()=>toast.remove(),4200);
  if(actionLabel){toast.querySelector('button').onclick=()=>{clearTimeout(timer);toast.remove();action?.();};}
}

function render(){
  const r=route();
  if(r==='landing'){ landing(); return; }
  if(r==='join'){ join(); return; }
  if(!state.joined){ setHash('join'); return; }
  workspace(r);
}

window.addEventListener('hashchange',render);
window.addEventListener('DOMContentLoaded',()=>{ if(!location.hash) location.hash='landing'; else render(); });
