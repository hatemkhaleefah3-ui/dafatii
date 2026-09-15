(() => {
  'use strict';

  const paths = {
    menu:'M4 7h16M4 12h16M4 17h16', close:'M6 6l12 12M18 6 6 18',
    dashboard:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8', subjects:'M4 4h7v16H4zM14 4h6v16h-6z',
    calendar:'M4 6h16v15H4zM8 3v6M16 3v6M4 11h16', chat:'M3 4h18v14H8l-5 3zM7 9h10M7 13h6',
    'nav-home':'M3.5 10.25 12 3l8.5 7.25v8A2.75 2.75 0 0 1 17.75 21H6.25a2.75 2.75 0 0 1-2.75-2.75v-8ZM8.75 21v-6.75h6.5V21',
    'nav-library':'M6 3.5h12A2.5 2.5 0 0 1 20.5 6v12A2.5 2.5 0 0 1 18 20.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5ZM8.5 3.5v17M12.5 8h4M12.5 12h4M12.5 16h3',
    'nav-calendar':'M6 4.5h12A2.5 2.5 0 0 1 20.5 7v11A2.5 2.5 0 0 1 18 20.5H6A2.5 2.5 0 0 1 3.5 18V7A2.5 2.5 0 0 1 6 4.5ZM8 2.5v4M16 2.5v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01',
    'nav-community':'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4.5 5',
    'nav-messages':'M6 3.5h12A2.5 2.5 0 0 1 20.5 6v9A2.5 2.5 0 0 1 18 17.5H10L4.5 21v-4.85A2.5 2.5 0 0 1 3.5 14V6A2.5 2.5 0 0 1 6 3.5ZM8 9h8M8 13h5',
    'study-rooms':'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M1 21v-2a7 7 0 0 1 14 0v2M17 5a4 4 0 0 1 0 8M18 16a5 5 0 0 1 5 5',
    'change-course':'M3 7 12 3l9 4-9 4zM6 10v7l6 4 6-4v-7', profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 22v-2a8 8 0 0 1 16 0v2',
    settings:'M4 6h16M4 12h16M4 18h16M9 3v6M15 9v6M9 15v6', admin:'M12 3l8 4v5c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10V7zM9 12l2 2 4-4',
    representer:'M4 5h16v14H4zM8 9h8M8 13h5', language:'M4 5h10M9 3v2c0 5-2 8-5 10M6 10c2 3 5 5 8 6M15 19l3-8 3 8M16 16h4',
    appearance:'M20 15.2A8.2 8.2 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z', 'apply-work':'M4 7h16v13H4zM9 7V4h6v3',
    'apply-scholarship':'M12 3l3 6 6 .8-4.5 4.4 1.2 6.3L12 17l-5.7 3.5 1.2-6.3L3 9.8 9 9z', volunteer:'M12 21S4 16 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 7-6 12-6 12z',
    'donate-us':'M12 4v16M4 12h16'
  };
  const copy = {
    en:{workspace:'WORKSPACE',account:'Account & preferences',openMenu:'Open sidebar',closeMenu:'Close sidebar',skip:'Skip to content',courses:'Courses',primary:'Main navigation',accountNav:'Account navigation',preferences:'Preferences',opportunities:'Opportunities',appearance:'Appearance',language:'Language',light:'Light mode',dark:'Dark mode',english:'English',arabic:'Arabic',signout:'Sign out',signoutError:'Could not sign out. Please try again.',yourAccount:'Your account',dashboard:'Dashboard',subjects:'Library',calendar:'Calendar',chat:'Messages','study-rooms':'Study rooms','change-course':'Courses',profile:'Profile',settings:'Settings',admin:'Administration',representer:'Course management','apply-work':'Apply for work','apply-scholarship':'Scholarships',volunteer:'Volunteer','donate-us':'Support Dafatii',activeCourse:'Active course',recentCourses:'Recent courses',seeAllCourses:'See all courses',seeProfile:'See full profile',student:'Student',owner:'Course owner',email:'Email',stage:'Study stage',switching:'Opening…',back:'Go back'},
    ar:{workspace:'مساحة العمل',account:'الحساب والتفضيلات',openMenu:'فتح القائمة الجانبية',closeMenu:'إغلاق القائمة الجانبية',skip:'تخطي إلى المحتوى',courses:'الدورات',primary:'التنقل الرئيسي',accountNav:'تنقل الحساب',preferences:'التفضيلات',opportunities:'الفرص',appearance:'المظهر',language:'اللغة',light:'الوضع الفاتح',dark:'الوضع الداكن',english:'الإنجليزية',arabic:'العربية',signout:'تسجيل الخروج',signoutError:'تعذر تسجيل الخروج. حاول مرة أخرى.',yourAccount:'حسابك',dashboard:'لوحة التحكم',subjects:'المكتبة',calendar:'التقويم',chat:'الرسائل','study-rooms':'غرف الدراسة','change-course':'الدورات',profile:'الملف الشخصي',settings:'الإعدادات',admin:'الإدارة',representer:'إدارة الدورة','apply-work':'التقديم للعمل','apply-scholarship':'المنح الدراسية',volunteer:'التطوع','donate-us':'دعم دفاتري',activeCourse:'الدورة النشطة',recentCourses:'أحدث الدورات',seeAllCourses:'عرض جميع الدورات',seeProfile:'عرض الملف الشخصي كاملاً',student:'طالب',owner:'مالك الدورة',email:'البريد الإلكتروني',stage:'المرحلة الدراسية',switching:'جارٍ الفتح…',back:'رجوع'}
  };

  const language = () => typeof interfaceLanguage === 'function' ? interfaceLanguage() : (document.documentElement.lang === 'ar' ? 'ar' : 'en');
  const text = key => copy[language()][key] || key;
  const glyph = key => window.DafatiiIcons?.icon(key) || `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[key] || paths.settings}"/></svg>`;
  const href = key => MAIN_NAV[key] ? `${key}/${encodeURIComponent(MAIN_NAV[key][0])}` : key;
  const activePage = () => route().split('/')[0];
  const normalizedRoute = value => {try{return decodeURIComponent(String(value||'')).replace(/^\/+|\/+$/g,'').toLowerCase();}catch{return String(value||'').replace(/^\/+|\/+$/g,'').toLowerCase();}};
  const mainNavIcons = Object.freeze({dashboard:'nav-home',subjects:'nav-library',calendar:'nav-calendar','study-rooms':'nav-community',chat:'nav-messages'});
  const navItem = (key,current) => `<a href="#${href(key)}" aria-label="${escapeHtml(text(key))}" title="${escapeHtml(text(key))}" class="quiet-link ${current===key?'selected':''}" ${current===key?'aria-current="page"':''}>${glyph(mainNavIcons[key]||key)}<span>${escapeHtml(text(key))}</span></a>`;
  const bottomIcons = Object.freeze({...mainNavIcons,'change-course':'change-course',profile:'profile',settings:'settings'});
  const bottomNavItem = (key,current) => `<a href="#${href(key)}" class="bottom-nav-item ${current===key?'is-active':''}" data-bottom-nav-item="${escapeHtml(key)}" aria-label="${escapeHtml(text(key))}" title="${escapeHtml(text(key))}" ${current===key?'aria-current="page"':''}><span class="bottom-nav-icon">${glyph(bottomIcons[key]||key)}</span><span class="bottom-nav-label">${escapeHtml(text(key))}</span></a>`;

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
  function closePopovers(){
    document.querySelectorAll('.quiet-popover').forEach(popover=>popover.remove());
    document.querySelectorAll('[data-quiet-courses],[data-quiet-profile]').forEach(button=>button.setAttribute('aria-expanded','false'));
  }
  function openCoursePopover(trigger){
    if(document.querySelector('.quiet-course-popover')){closePopovers();return;}
    closePopovers();trigger.setAttribute('aria-expanded','true');
    const active=window.DafatiiCourses.active();
    const enrolled=window.DafatiiCourses.list().filter(course=>course.membership?.status==='active');
    const recent=[active,...enrolled.filter(course=>course.id!==active.id).sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0))].filter(course=>course?.id).slice(0,3);
    const panel=document.createElement('section');panel.className='quiet-popover quiet-course-popover';panel.setAttribute('aria-label',text('recentCourses'));
    panel.innerHTML=`<div class="quiet-popover-head"><strong>${escapeHtml(text('recentCourses'))}</strong><small>${escapeHtml(text('activeCourse'))}</small></div><div class="quiet-course-list">${recent.map(course=>`<button data-switch-course="${escapeHtml(course.id)}" class="${course.id===active.id?'active':''}"><span style="--course-color:${escapeHtml(course.color||'#1877f2')}">${escapeHtml(course.icon||'◇')}</span><span><strong>${escapeHtml(course.name)}</strong><small>${course.id===active.id?escapeHtml(text('activeCourse')):escapeHtml(course.institution||'')}</small></span>${course.id===active.id?`<b>${glyph('check')}</b>`:''}</button>`).join('')}</div><a class="quiet-popover-more" href="#change-course">${escapeHtml(text('seeAllCourses'))} ${glyph(language()==='ar'?'arrow-left':'arrow-right')}</a><p role="status"></p>`;
    trigger.parentElement.append(panel);
    panel.querySelector('.quiet-popover-more').onclick=closePopovers;
    panel.querySelectorAll('[data-switch-course]').forEach(button=>button.onclick=async()=>{if(button.dataset.switchCourse===active.id)return;panel.querySelector('[role=status]').textContent=text('switching');panel.querySelectorAll('button').forEach(item=>item.disabled=true);try{await window.DafatiiCourses.switchCourse(button.dataset.switchCourse);closePopovers();}catch(error){panel.querySelector('[role=status]').textContent=error.message;panel.querySelectorAll('button').forEach(item=>item.disabled=false);}});
  }
  function openProfilePopover(trigger){
    if(document.querySelector('.quiet-profile-popover')){closePopovers();return;}
    closePopovers();trigger.setAttribute('aria-expanded','true');
    const user=window.DafatiiAuth.user||{},active=window.DafatiiCourses.active();
    const role=user.platformRole==='admin'?text('admin'):user.accountType==='representer'?text('representer'):text('student');
    const panel=document.createElement('section');panel.className='quiet-popover quiet-profile-popover';panel.setAttribute('aria-label',text('yourAccount'));
    panel.innerHTML=`<div class="quiet-profile-summary"><span>${escapeHtml((user.displayName||'D')[0])}</span><div><strong>${escapeHtml(user.displayName||text('yourAccount'))}</strong><small>${escapeHtml(role)}</small></div></div><dl><div><dt>${escapeHtml(text('email'))}</dt><dd>${escapeHtml(user.email||'—')}</dd></div><div><dt>${escapeHtml(text('stage'))}</dt><dd>${escapeHtml(user.studentStage||'—')}</dd></div>${active.id?`<div><dt>${escapeHtml(text('activeCourse'))}</dt><dd>${escapeHtml(active.name)}</dd></div>`:''}</dl><a class="quiet-popover-more" href="#profile">${escapeHtml(text('seeProfile'))} ${glyph(language()==='ar'?'arrow-left':'arrow-right')}</a><button class="quiet-popover-signout" data-signout>${escapeHtml(text('signout'))}</button><p role="status"></p>`;
    trigger.parentElement.append(panel);
    panel.querySelector('.quiet-popover-more').onclick=closePopovers;
    panel.querySelector('[data-signout]').onclick=async event=>{event.currentTarget.disabled=true;try{await window.DafatiiAuth.logout();closePopovers();setHash('join');}catch{panel.querySelector('[role=status]').textContent=text('signoutError');event.currentTarget.disabled=false;}};
  }

  const gelNavigationSelector = '.landing-nav-tabs,.quiet-desktop-tabs,.bottom-nav,.sub-inner';
  const observedGelNavigations = new WeakSet();
  const gelResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    entries.forEach(entry => positionNavigationGel(entry.target));
  }) : null;

  function positionNavigationGel(navigation, immediate=false){
    if(!navigation?.isConnected)return;
    navigation.classList.add('gel-nav');
    let gel=[...navigation.children].find(child=>child.classList.contains('nav-gel'));
    if(!gel){
      gel=document.createElement('span');
      gel.className='nav-gel';
      gel.setAttribute('aria-hidden','true');
      navigation.prepend(gel);
      immediate=true;
    }
    const items=[...navigation.children].filter(child=>!child.classList.contains('nav-gel'));
    navigation.style.setProperty('--nav-count',String(items.length));
    const active=items.find(child=>child.matches('.active,.selected,.is-active,[aria-current="page"]'));
    if(!active){gel.hidden=true;return;}
    gel.hidden=false;
    if(immediate)navigation.classList.remove('gel-nav-ready');
    gel.style.width=`${active.offsetWidth}px`;
    gel.style.height=`${active.offsetHeight}px`;
    gel.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
    requestAnimationFrame(()=>navigation.classList.add('gel-nav-ready'));
    if(gelResizeObserver&&!observedGelNavigations.has(navigation)){
      observedGelNavigations.add(navigation);
      gelResizeObserver.observe(navigation);
    }
  }

  function syncGelNavigation(root=document){
    root.querySelectorAll?.(gelNavigationSelector).forEach(navigation=>positionNavigationGel(navigation,true));
  }

  function resetPageScroll(){
    window.scrollTo(0,0);
    if(document.scrollingElement)document.scrollingElement.scrollTop=0;
    const main=document.querySelector('.workspace-main');
    if(main)main.scrollTop=0;
  }

  function enhance(){
    const shell=document.querySelector('.workspace,.pre-course-shell');
    if(!shell || shell.querySelector('.quiet-sidebar')) return;
    const active=window.DafatiiCourses.active();
    const full=Boolean(active.id),current=activePage(),user=window.DafatiiAuth.user;
    const primary=full?['dashboard','subjects','calendar','study-rooms','chat']:['dashboard','change-course','profile','settings'];
    const primaryDestinations=new Set(primary.flatMap(key=>[normalizedRoute(key),normalizedRoute(href(key))]));
    const showReturnButton=!primaryDestinations.has(normalizedRoute(current));
    const account=full?['change-course','profile','settings']:[];
    const opportunities=full?['apply-work','apply-scholarship','volunteer','donate-us']:[];
    if(user?.platformRole==='admin'&&full) account.push('admin');
    if(full&&['owner','representer'].includes(active.membership?.role)) account.push('representer');
    shell.classList.add('quiet-workspace');
    const sidebarInitiallyExpanded=window.matchMedia('(min-width:768px)').matches;
    shell.insertAdjacentHTML('afterbegin',`<a class="quiet-skip" href="#quiet-content">${escapeHtml(text('skip'))}</a><button class="quiet-menu-backdrop" data-quiet-menu-close aria-label="${escapeHtml(text('closeMenu'))}"></button><aside class="quiet-sidebar" id="quiet-sidebar" aria-label="${escapeHtml(text('workspace'))}"><div class="quiet-sidebar-head"><a class="quiet-brand" href="#dashboard">d<span>dafatii</span></a><button class="quiet-sidebar-close" data-quiet-menu-close aria-label="${escapeHtml(text('closeMenu'))}">${glyph('close')}</button></div><small>${escapeHtml(text('workspace'))}</small><nav aria-label="${escapeHtml(text('primary'))}">${primary.map(k=>navItem(k,current)).join('')}</nav>${account.length?`<div class="quiet-account-nav" aria-label="${escapeHtml(text('accountNav'))}">${account.map(k=>navItem(k,current)).join('')}</div>`:''}${opportunities.length?`<div class="quiet-opportunity-nav"><small>${escapeHtml(text('opportunities'))}</small>${opportunities.map(k=>navItem(k,current)).join('')}</div>`:''}<div class="quiet-preferences" aria-label="${escapeHtml(text('preferences'))}"><button class="quiet-link" data-quiet-theme>${glyph('appearance')}<span>${escapeHtml(document.documentElement.dataset.theme==='dark'?text('light'):text('dark'))}</span></button><button class="quiet-link" data-quiet-language>${glyph('language')}<span>${escapeHtml(language()==='ar'?text('english'):text('arabic'))}</span></button></div><button class="quiet-person" data-quiet-sidebar-profile>${glyph('profile')}<span>${escapeHtml(user?.displayName||text('yourAccount'))}<small>${escapeHtml(text('account'))}</small></span></button></aside><header class="quiet-toolbar"><div class="quiet-toolbar-title"><button class="quiet-menu-button" data-quiet-menu aria-controls="quiet-sidebar" aria-expanded="${sidebarInitiallyExpanded}" aria-label="${escapeHtml(text('openMenu'))}">${glyph('menu')}</button><div><small>${full?escapeHtml(active.name):escapeHtml(text('workspace'))}</small><strong>${escapeHtml(text(current))}</strong></div></div><nav class="quiet-desktop-tabs" aria-label="${escapeHtml(text('primary'))}">${primary.map(k=>navItem(k,current)).join('')}</nav><div class="quiet-toolbar-actions"><button class="quiet-course-button" data-quiet-courses aria-expanded="false" aria-label="${escapeHtml(text('courses'))}">${glyph('change-course')}<span>${escapeHtml(text('courses'))}</span></button><button class="quiet-avatar" data-quiet-profile aria-expanded="false" aria-label="${escapeHtml(text('account'))}">${escapeHtml((user?.displayName||'D')[0])}</button></div></header><nav class="bottom-nav" aria-label="${escapeHtml(text('primary'))}">${primary.map(k=>bottomNavItem(k,current)).join('')}</nav>${showReturnButton?`<button class="quiet-return-button" data-quiet-return aria-label="${escapeHtml(text('back'))}" title="${escapeHtml(text('back'))}">${glyph(language()==='ar'?'arrow-right':'arrow-left')}</button>`:''}`);
    syncGelNavigation(shell);
    shell.querySelector('[data-quiet-return]')?.addEventListener('click',()=>{if(history.length>1)history.back();else setHash(href(primary[0]));});
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
    shell.querySelector('[data-quiet-courses]').onclick=event=>{event.stopPropagation();openCoursePopover(event.currentTarget);};
    shell.querySelector('[data-quiet-sidebar-profile]').onclick=()=>{closeMenu(shell);setHash('profile');};
    shell.querySelectorAll('[data-quiet-profile]').forEach(button=>button.onclick=event=>{event.stopPropagation();openProfilePopover(event.currentTarget);});
  }

  const previous=workspace;
  workspace=function(current){
    if(current.split('/')[0]==='change-language'){history.replaceState(null,'','#settings');current='settings';}
    previous(current);enhance();
  };
  window.addEventListener('hashchange',()=>requestAnimationFrame(()=>{enhance();syncGelNavigation();resetPageScroll();}));
  window.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(()=>{enhance();syncGelNavigation();resetPageScroll();}));
  window.addEventListener('resize',()=>requestAnimationFrame(()=>document.querySelectorAll(gelNavigationSelector).forEach(navigation=>positionNavigationGel(navigation))));
  document.addEventListener('click',event=>{
    if(event.target.closest('.landing-nav-link,.quiet-desktop-tabs .quiet-link,.bottom-nav-item'))requestAnimationFrame(()=>syncGelNavigation());
    if(!event.target.closest('.quiet-popover,.quiet-toolbar-actions,.quiet-person'))closePopovers();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closePopovers();}if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();if(window.DafatiiAuth.user)setHash('settings');}});
})();
