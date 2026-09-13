(() => {
  'use strict';
  const paths={dashboard:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',subjects:'M4 4h7v16H4zM14 4h6v16h-6z',calendar:'M4 6h16v15H4zM8 3v6M16 3v6M4 11h16',chat:'M3 4h18v14H8l-5 3zM7 9h10M7 13h6','study-rooms':'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M1 21v-2a7 7 0 0 1 14 0v2M17 5a4 4 0 0 1 0 8M18 16a5 5 0 0 1 5 5','change-course':'M3 7 12 3l9 4-9 4zM6 10v7l6 4 6-4v-7',profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 22v-2a8 8 0 0 1 16 0v2',settings:'M4 6h16M4 12h16M4 18h16M9 3v6M15 9v6M9 15v6'};
  const glyph=key=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[key]||paths.settings}"/></svg>`;
  const label=key=>({dashboard:'Dashboard',subjects:'Library',calendar:'Calendar',chat:'Messages','study-rooms':'Study rooms','change-course':'Courses',profile:'Profile',settings:'Settings',admin:'Administration',representer:'Course management'}[key]||key);
  const href=key=>MAIN_NAV[key]?`${key}/${encodeURIComponent(MAIN_NAV[key][0])}`:key;
  function navItem(key,current){return `<a href="#${href(key)}" aria-label="${escapeHtml(label(key))}" title="${escapeHtml(label(key))}" class="quiet-link ${current===key?'selected':''}" ${current===key?'aria-current="page"':''}>${glyph(key)}<span>${escapeHtml(label(key))}</span></a>`;}
  function enhance(){
    const shell=document.querySelector('.workspace,.pre-course-shell');if(!shell||shell.querySelector('.quiet-sidebar'))return;
    const full=Boolean(window.DafatiiCourses.active().id),current=route().split('/')[0],user=window.DafatiiAuth.user;
    const primary=full?['dashboard','subjects','calendar','study-rooms','chat']:['dashboard','change-course','profile','settings'];
    const account=full?['change-course','profile','settings']:[];
    if(user?.platformRole==='admin'&&full)account.push('admin');
    if(full&&['owner','representer'].includes(window.DafatiiCourses.active().membership?.role))account.push('representer');
    shell.classList.add('quiet-workspace');
    shell.insertAdjacentHTML('afterbegin',`<a class="quiet-skip" href="#quiet-content">Skip to content</a><aside class="quiet-sidebar"><a class="quiet-brand" href="#dashboard">d<span>dafatii</span></a><small>WORKSPACE</small><nav aria-label="Workspace">${primary.map(k=>navItem(k,current)).join('')}</nav><div class="quiet-account-nav">${account.map(k=>navItem(k,current)).join('')}</div><button class="quiet-person" data-quiet-account>${glyph('profile')}<span>${escapeHtml(user?.displayName||'Account')}<small>Account & preferences</small></span></button></aside><header class="quiet-toolbar"><div><small>${full?escapeHtml(window.DafatiiCourses.active().name):'YOUR WORKSPACE'}</small><strong>${escapeHtml(label(current))}</strong></div><div class="quiet-toolbar-actions"><a class="quiet-course-button" href="#change-course">${glyph('change-course')}<span>Courses</span></a><button class="quiet-avatar" data-quiet-account aria-label="Open account and preferences">${escapeHtml((user?.displayName||'D')[0])}</button></div></header><nav class="quiet-tabs" aria-label="Main navigation">${primary.map(k=>navItem(k,current)).join('')}</nav>`);
    const main=shell.querySelector('.workspace-main');if(main){main.id='quiet-content';main.tabIndex=-1;}
    shell.querySelectorAll('[data-quiet-account]').forEach(b=>b.onclick=()=>openAccount(account));
  }
  function openAccount(account){
    const dialog=document.createElement('dialog');dialog.className='quiet-dialog';
    dialog.innerHTML=`<div class="quiet-dialog-head"><h2>Your account</h2><button class="icon-btn" data-close aria-label="Close account">×</button></div><nav>${[...new Set(['profile','settings','change-course',...account])].map(k=>navItem(k,route().split('/')[0])).join('')}</nav><div class="quiet-dialog-preferences"><button class="btn" data-theme>Switch to ${document.documentElement.dataset.theme==='dark'?'light':'dark'} mode</button></div><button class="btn" data-signout>Sign out</button><p class="quiet-account-error" role="status"></p>`;
    document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelectorAll('a').forEach(a=>a.onclick=()=>dialog.close());
    dialog.querySelector('[data-theme]').onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;window.DafatiiData.writeString('dafatii:theme',theme);dialog.close();render();};
    dialog.querySelector('[data-signout]').onclick=async e=>{e.target.disabled=true;try{await window.DafatiiAuth.logout();dialog.close();setHash('join');}catch{dialog.querySelector('[role=status]').textContent='Could not sign out. Please try again.';e.target.disabled=false;}};
    dialog.showModal();
  }
  const previous=workspace;workspace=function(current){previous(current);enhance();};
  window.addEventListener('hashchange',()=>requestAnimationFrame(enhance));
  window.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(enhance));
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();if(window.DafatiiAuth.user)setHash('settings');}});
})();
