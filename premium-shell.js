(() => {
  const THEME_KEY = 'dafatii:theme';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  const icons = {
    dashboard: svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>'),
    subjects: svg('<path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z"/><path d="M8 8h6M8 11.5h6"/><path d="M17 8h2a2 2 0 0 1 2 2v8h-4"/>'),
    calendar: svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01"/>'),
    'study-rooms': svg('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="9.5" r="2.5"/><path d="M15.5 14.5a4.5 4.5 0 0 1 5 4.5"/>'),
    chat: svg('<path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10h8M8 13h5"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.07 14H3v-4h.07A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.07V3h4v.07A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.93 10H21v4h-.07A1.7 1.7 0 0 0 19.4 15Z"/>'),
    profile: svg('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
    'change-course': svg('<path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z"/><path d="M6.5 10.2V15c0 1.8 2.5 3.3 5.5 3.3s5.5-1.5 5.5-3.3v-4.8M20.5 8.5V14"/>'),
    'change-language': svg('<circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    'dark-mode': svg('<path d="M20 15.2A8.2 8.2 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M2.5 12h2M19.5 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4"/>'),
    sidebar: svg('<rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="M9 4v16M6.2 8h.01M6.2 11h.01"/>')
  };

  function syncThemeChrome(){
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark ? '#07111f' : '#f5f8ff');
  }

  function applyStoredTheme(){
    const stored = window.DafatiiData.readString(THEME_KEY);
    if(stored === 'light' || stored === 'dark') document.documentElement.dataset.theme = stored;
    syncThemeChrome();
  }

  function mainLabel(key){
    const labels = {dashboard:'Dashboard',subjects:'Subjects',calendar:'Calendar','study-rooms':'Study Rooms',chat:'Chat'};
    return labels[key] || key;
  }

  function enhanceMainNav(){
    document.querySelectorAll('.main-nav .nav-link[data-page]').forEach(button => {
      const key = button.dataset.page;
      const label = mainLabel(key);
      button.classList.add('premium-icon-nav');
      button.setAttribute('aria-label', label);
      button.dataset.tooltip = label;
      button.innerHTML = `<span class="premium-nav-icon">${icons[key] || icons.dashboard}</span>`;
    });
  }

  function enhanceSettingsNav(){
    document.querySelectorAll('.settings-nav .settings-action[data-extra]').forEach(button => {
      const key = button.dataset.extra;
      const originalLabel = button.dataset.premiumLabel || button.textContent.trim();
      button.dataset.premiumLabel = originalLabel;
      const isTheme = key === 'dark-mode';
      const isDark = document.documentElement.dataset.theme === 'dark';
      const label = isTheme ? (isDark ? 'Light Mode' : 'Dark Mode') : originalLabel;
      const glyph = isTheme && isDark ? icons.sun : (icons[key] || icons.settings);
      button.classList.add('premium-settings-action');
      button.classList.toggle('is-active', typeof route === 'function' && route() === key);
      button.setAttribute('aria-label',label);
      button.innerHTML = `<span class="settings-motion-icon">${glyph}</span><span class="settings-text">${label}</span>`;
    });
    const sidebar = document.getElementById('sidebar-open');
    if(sidebar){
      sidebar.classList.add('premium-settings-action','premium-sidebar-trigger');
      sidebar.innerHTML = `<span class="settings-motion-icon">${icons.sidebar}</span><span class="settings-text">Sidebar</span>`;
    }
  }

  function revealSurfaces(){
    if(reducedMotion) return;
    const selector = [
      '.feature-card','.float-card','.subject-swipe','.calendar-scroll','.calendar-notes',
      '.calendar-form','.academic-card','.sr-card','.sr-active','.srw-focus-card','.srw-content-card',
      '.chatpro-shell','.entity-sheet','.subjects-empty'
    ].join(',');
    document.querySelectorAll(selector).forEach((node,index) => {
      if(node.dataset.premiumReveal === '1') return;
      node.dataset.premiumReveal = '1';
      node.style.setProperty('--premium-delay', `${Math.min(index,8) * 35}ms`);
      node.classList.add('premium-reveal');
    });
  }

  function enhancePremiumShell(){
    document.documentElement.dataset.design = 'premium-blue';
    enhanceMainNav();
    enhanceSettingsNav();
    revealSurfaces();
  }

  function toggleTheme(event){
    const trigger = event.target.closest?.('[data-extra="dark-mode"]');
    if(!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    window.DafatiiData.writeString(THEME_KEY,next);
    syncThemeChrome();
    if(typeof showToast === 'function') showToast(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled`);
    requestAnimationFrame(enhancePremiumShell);
  }

  function ripple(event){
    if(reducedMotion) return;
    const host = event.target.closest?.('.btn,.settings-action,.sub-link,.subject-add,.icon-btn');
    if(!host) return;
    const rect = host.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'premium-ripple';
    dot.style.left = `${event.clientX - rect.left}px`;
    dot.style.top = `${event.clientY - rect.top}px`;
    host.classList.add('premium-ripple-host');
    host.appendChild(dot);
    dot.addEventListener('animationend',()=>dot.remove(),{once:true});
  }

  applyStoredTheme();
  document.addEventListener('click',toggleTheme,true);
  document.addEventListener('pointerdown',ripple,{passive:true});

  if(typeof workspace === 'function'){
    const previousWorkspace = workspace;
    workspace = function(current){
      previousWorkspace(current);
      enhancePremiumShell();
    };
  }

  window.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(enhancePremiumShell),{once:true});
  window.addEventListener('hashchange',()=>requestAnimationFrame(enhancePremiumShell));
})();
