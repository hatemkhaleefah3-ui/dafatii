const app = document.getElementById('app');

const state = {
  joined: localStorage.getItem('dafatii:joined') === '1',
  sidebar: false,
  authMode: 'signup',
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

function workspace(current){
  const parts = current.split('/');
  const page = parts[0];
  const sub = decodeURIComponent(parts.slice(1).join('/'));
  const mainActive = MAIN_NAV[page] ? page : '';
  const title = sub || LABELS[page] || prettify(page);
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

    <main class="workspace-main"><section class="empty-state"><div class="empty-icon">${icon(page)}</div><h1>${escapeHtml(title)}</h1><p>Coming soon…</p></section></main>
  </div>`;
  bindWorkspace();
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

function render(){
  const r=route();
  if(r==='landing'){ landing(); return; }
  if(r==='join'){ join(); return; }
  if(!state.joined){ setHash('join'); return; }
  workspace(r);
}

window.addEventListener('hashchange',render);
window.addEventListener('DOMContentLoaded',()=>{ if(!location.hash) location.hash='landing'; else render(); });
