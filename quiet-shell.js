(() => {
  'use strict';

  const paths = {
    menu:'M4 7h16M4 12h16M4 17h16', close:'M6 6l12 12M18 6 6 18',
    dashboard:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8', subjects:'M4 4h7v16H4zM14 4h6v16h-6z',
    calendar:'M4 6h16v15H4zM8 3v6M16 3v6M4 11h16', chat:'M3 4h18v14H8l-5 3zM7 9h10M7 13h6',
    'study-rooms':'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M1 21v-2a7 7 0 0 1 14 0v2M17 5a4 4 0 0 1 0 8M18 16a5 5 0 0 1 5 5',
    'change-course':'M3 7 12 3l9 4-9 4zM6 10v7l6 4 6-4v-7', profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 22v-2a8 8 0 0 1 16 0v2',
    settings:'M4 6h16M4 12h16M4 18h16M9 3v6M15 9v6M9 15v6', admin:'M12 3l8 4v5c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10V7zM9 12l2 2 4-4',
    representer:'M4 5h16v14H4zM8 9h8M8 13h5', language:'M4 5h10M9 3v2c0 5-2 8-5 10M6 10c2 3 5 5 8 6M15 19l3-8 3 8M16 16h4',
    appearance:'M20 15.2A8.2 8.2 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z', 'apply-work':'M4 7h16v13H4zM9 7V4h6v3',
    'apply-scholarship':'M12 3l3 6 6 .8-4.5 4.4 1.2 6.3L12 17l-5.7 3.5 1.2-6.3L3 9.8 9 9z', volunteer:'M12 21S4 16 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 7-6 12-6 12z',
    'donate-us':'M12 4v16M4 12h16'
  };
  const copy = {
    en:{workspace:'WORKSPACE',account:'Account & preferences',openMenu:'Open sidebar',closeMenu:'Close sidebar',skip:'Skip to content',courses:'Courses',primary:'Main navigation',accountNav:'Account navigation',preferences:'Preferences',opportunities:'Opportunities',appearance:'Appearance',language:'Language',light:'Light mode',dark:'Dark mode',english:'English',arabic:'Arabic',signout:'Sign out',signoutError:'Could not sign out. Please try again.',yourAccount:'Your account',dashboard:'Dashboard',subjects:'Library',calendar:'Calendar',chat:'Messages','study-rooms':'Study rooms','change-course':'Courses',profile:'Profile',settings:'Settings',admin:'Administration',representer:'Course management','apply-work':'Apply for work','apply-scholarship':'Scholarships',volunteer:'Volunteer','donate-us':'Support Dafatii'},
    ar:{workspace:'مساحة العمل',account:'الحساب والتفضيلات',openMenu:'فتح القائمة الجانبية',closeMenu:'إغلاق القائمة الجانبية',skip:'تخطي إلى المحتوى',courses:'الدورات',primary:'التنقل الرئيسي',accountNav:'تنقل الحساب',preferences:'التفضيلات',opportunities:'الفرص',appearance:'المظهر',language:'اللغة',light:'الوضع الفاتح',dark:'الوضع الداكن',english:'الإنجليزية',arabic:'العربية',signout:'تسجيل الخروج',signoutError:'تعذر تسجيل الخروج. حاول مرة أخرى.',yourAccount:'حسابك',dashboard:'لوحة التحكم',subjects:'المكتبة',calendar:'التقويم',chat:'الرسائل','study-rooms':'غرف الدراسة','change-course':'الدورات',profile:'الملف الشخصي',settings:'الإعدادات',admin:'الإدارة',representer:'إدارة الدورة','apply-work':'التقديم للعمل','apply-scholarship':'المنح الدراسية',volunteer:'التطوع','donate-us':'دعم دفاتري'}
  };

  const language = () => typeof interfaceLanguage === 'function' ? interfaceLanguage() : (document.documentElement.lang === 'ar' ? 'ar' : 'en');
  const text = key => copy[language()][key] || key;
  const glyph = key => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[key] || paths.settings}"/></svg>`;
  const href = key => MAIN_NAV[key] ? `${key}/${encodeURIComponent(MAIN_NAV[key][0])}` : key;
  const activePage = () => route().split('/')[0];
  const navItem = (key,current) => `<a href="#${href(key)}" aria-label="${escapeHtml(text(key))}" title="${escapeHtml(text(key))}" class="quiet-link ${current===key?'selected':''}" ${current===key?'aria-current="page"':''}>${glyph(key)}<span>${escapeHtml(text(key))}</span></a>`;

  function setTheme(theme){
    document.documentElement.dataset.theme=theme;
    document.documentElement.style.colorScheme=theme;
    window.DafatiiData.writeString('dafatii:theme',theme);
    render();
  }
  function setLanguage(next){applyInterfaceLanguage(next);render();}
  function closeMenu(shell=document.querySelector('.quiet-workspace')){
    shell?.classList.remove('quiet-menu-open');
    shell?.querySelector('[data-quiet-menu]')?.setAttribute('aria-expanded','false');
  }

  function enhance(){
    const shell=document.querySelector('.workspace,.pre-course-shell');
    if(!shell || shell.querySelector('.quiet-sidebar')) return;
    const active=window.DafatiiCourses.active();
    const full=Boolean(active.id),current=activePage(),user=window.DafatiiAuth.user;
    const primary=full?['dashboard','subjects','calendar','study-rooms','chat']:['dashboard','change-course','profile','settings'];
    const account=full?['change-course','profile','settings']:[];
    const opportunities=full?['apply-work','apply-scholarship','volunteer','donate-us']:[];
    if(user?.platformRole==='admin'&&full) account.push('admin');
    if(full&&['owner','representer'].includes(active.membership?.role)) account.push('representer');
    shell.classList.add('quiet-workspace');
    const sidebarInitiallyExpanded=window.matchMedia('(min-width:768px)').matches;
    shell.insertAdjacentHTML('afterbegin',`<a class="quiet-skip" href="#quiet-content">${escapeHtml(text('skip'))}</a><button class="quiet-menu-backdrop" data-quiet-menu-close aria-label="${escapeHtml(text('closeMenu'))}"></button><aside class="quiet-sidebar" id="quiet-sidebar" aria-label="${escapeHtml(text('workspace'))}"><div class="quiet-sidebar-head"><a class="quiet-brand" href="#dashboard">d<span>dafatii</span></a><button class="quiet-sidebar-close" data-quiet-menu-close aria-label="${escapeHtml(text('closeMenu'))}">${glyph('close')}</button></div><small>${escapeHtml(text('workspace'))}</small><nav aria-label="${escapeHtml(text('primary'))}">${primary.map(k=>navItem(k,current)).join('')}</nav>${account.length?`<div class="quiet-account-nav" aria-label="${escapeHtml(text('accountNav'))}">${account.map(k=>navItem(k,current)).join('')}</div>`:''}${opportunities.length?`<div class="quiet-opportunity-nav"><small>${escapeHtml(text('opportunities'))}</small>${opportunities.map(k=>navItem(k,current)).join('')}</div>`:''}<div class="quiet-preferences" aria-label="${escapeHtml(text('preferences'))}"><button class="quiet-link" data-quiet-theme>${glyph('appearance')}<span>${escapeHtml(document.documentElement.dataset.theme==='dark'?text('light'):text('dark'))}</span></button><button class="quiet-link" data-quiet-language>${glyph('language')}<span>${escapeHtml(language()==='ar'?text('english'):text('arabic'))}</span></button></div><button class="quiet-person" data-quiet-account>${glyph('profile')}<span>${escapeHtml(user?.displayName||text('yourAccount'))}<small>${escapeHtml(text('account'))}</small></span></button></aside><header class="quiet-toolbar"><div class="quiet-toolbar-title"><button class="quiet-menu-button" data-quiet-menu aria-controls="quiet-sidebar" aria-expanded="${sidebarInitiallyExpanded}" aria-label="${escapeHtml(text('openMenu'))}">${glyph('menu')}</button><div><small>${full?escapeHtml(active.name):escapeHtml(text('workspace'))}</small><strong>${escapeHtml(text(current))}</strong></div></div><div class="quiet-toolbar-actions"><a class="quiet-course-button" href="#change-course">${glyph('change-course')}<span>${escapeHtml(text('courses'))}</span></a><button class="quiet-avatar" data-quiet-account aria-label="${escapeHtml(text('account'))}">${escapeHtml((user?.displayName||'D')[0])}</button></div></header><nav class="quiet-tabs" aria-label="${escapeHtml(text('primary'))}">${primary.map(k=>navItem(k,current)).join('')}</nav>`);
    const main=shell.querySelector('.workspace-main');
    if(main){main.id='quiet-content';main.tabIndex=-1;}
    shell.querySelector('[data-quiet-menu]').onclick=()=>{
      const mobile=window.matchMedia('(max-width:767px)').matches;
      const expanded=mobile?shell.classList.toggle('quiet-menu-open'):!shell.classList.toggle('quiet-sidebar-collapsed');
      shell.querySelector('[data-quiet-menu]').setAttribute('aria-expanded',String(expanded));
    };
    shell.querySelectorAll('[data-quiet-menu-close]').forEach(button=>button.onclick=()=>closeMenu(shell));
    shell.querySelectorAll('.quiet-sidebar a').forEach(link=>link.onclick=()=>closeMenu(shell));
    shell.querySelector('[data-quiet-theme]').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
    shell.querySelector('[data-quiet-language]').onclick=()=>setLanguage(language()==='ar'?'en':'ar');
    shell.querySelectorAll('[data-quiet-account]').forEach(button=>button.onclick=()=>openAccount(account));
  }

  function openAccount(account){
    const dialog=document.createElement('dialog');dialog.className='quiet-dialog';
    dialog.innerHTML=`<div class="quiet-dialog-head"><h2>${escapeHtml(text('yourAccount'))}</h2><button class="icon-btn" data-close aria-label="${escapeHtml(text('closeMenu'))}">×</button></div><nav>${[...new Set(['profile','settings','change-course',...account])].map(k=>navItem(k,activePage())).join('')}</nav><div class="quiet-dialog-preferences"><button class="btn" data-theme>${escapeHtml(document.documentElement.dataset.theme==='dark'?text('light'):text('dark'))}</button><button class="btn" data-language>${escapeHtml(language()==='ar'?text('english'):text('arabic'))}</button></div><button class="btn" data-signout>${escapeHtml(text('signout'))}</button><p class="quiet-account-error" role="status"></p>`;
    document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelectorAll('a').forEach(link=>link.onclick=()=>dialog.close());
    dialog.querySelector('[data-theme]').onclick=()=>{dialog.close();setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');};
    dialog.querySelector('[data-language]').onclick=()=>{dialog.close();setLanguage(language()==='ar'?'en':'ar');};
    dialog.querySelector('[data-signout]').onclick=async event=>{event.target.disabled=true;try{await window.DafatiiAuth.logout();dialog.close();setHash('join');}catch{dialog.querySelector('[role=status]').textContent=text('signoutError');event.target.disabled=false;}};
    dialog.showModal();
  }

  const previous=workspace;
  workspace=function(current){
    if(current.split('/')[0]==='change-language'){history.replaceState(null,'','#settings');current='settings';}
    previous(current);enhance();
  };
  window.addEventListener('hashchange',()=>requestAnimationFrame(enhance));
  window.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(enhance));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();if(window.DafatiiAuth.user)setHash('settings');}});
})();
