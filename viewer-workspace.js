(() => {
  'use strict';

  const NOTES_KEY = 'dafatii:viewerNotes:v1';
  const PREFS_KEY = 'dafatii:viewerPrefs:v1';
  const copy = {
    en: {
      settings:'Viewer settings', interactive:'Interactive lecture', flashcards:'Flashcards', exam:'Exam', download:'Download', fullscreen:'Fullscreen',
      vertical:'Vertical pages', horizontal:'Horizontal pages', notes:'Notes', writeNote:'Write note', lectureNotes:'Lecture notes', personalNotes:'My notes', addNote:'Add note',
      notePlaceholder:'Write a note…', page:'Page', close:'Close', noNotes:'No notes yet.', remove:'Delete', search:'Search document', searchPlaceholder:'Search…',
      zoomIn:'Zoom in', zoomOut:'Zoom out', rotate:'Rotate', unavailable:'This study tool is not configured yet.', video:'Video', file:'File'
    },
    ar: {
      settings:'إعدادات العارض', interactive:'المحاضرة التفاعلية', flashcards:'البطاقات التعليمية', exam:'الاختبار', download:'تنزيل', fullscreen:'ملء الشاشة',
      vertical:'تمرير الصفحات عمودياً', horizontal:'تمرير الصفحات أفقياً', notes:'الملاحظات', writeNote:'كتابة ملاحظة', lectureNotes:'ملاحظات المحاضرة', personalNotes:'ملاحظاتي', addNote:'إضافة ملاحظة',
      notePlaceholder:'اكتب ملاحظة…', page:'صفحة', close:'إغلاق', noNotes:'لا توجد ملاحظات بعد.', remove:'حذف', search:'البحث في الملف', searchPlaceholder:'بحث…',
      zoomIn:'تكبير', zoomOut:'تصغير', rotate:'تدوير', unavailable:'هذه الأداة الدراسية غير مهيأة بعد.', video:'فيديو', file:'ملف'
    }
  };

  const lang = () => (typeof interfaceLanguage === 'function' ? interfaceLanguage() : document.documentElement.lang) === 'ar' ? 'ar' : 'en';
  const t = key => copy[lang()][key] || copy.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const readJSON = (key, fallback) => window.DafatiiCourses?.readJSON?.(key, fallback) ?? fallback;
  const writeJSON = (key, value) => window.DafatiiCourses?.writeJSON?.(key, value);

  function prefs() {
    const value = readJSON(PREFS_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function getAxis(kind = 'file') { return prefs()[`${kind}Axis`] === 'horizontal' ? 'horizontal' : 'vertical'; }
  function setAxis(kind, axis) { const value = prefs(); value[`${kind}Axis`] = axis === 'horizontal' ? 'horizontal' : 'vertical'; writeJSON(PREFS_KEY, value); }

  function noteKey(context = {}) {
    if (context.lecture?.id) return `lecture:${context.lecture.id}`;
    if (context.fileId) return `file:${context.fileId}`;
    if (context.url) return `url:${context.url}`;
    return `viewer:${context.title || 'unknown'}`;
  }
  function allNotes() {
    const value = readJSON(NOTES_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function notesFor(context) { const list = allNotes()[noteKey(context)]; return Array.isArray(list) ? list : []; }
  function saveNotes(context, list) { const value = allNotes(); value[noteKey(context)] = list; writeJSON(NOTES_KEY, value); }
  function addNote(context, text, page) {
    const clean = String(text || '').trim(); if (!clean) return null;
    const item = { id:`note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`, text:clean, page:Number(page) || null, createdAt:Date.now() };
    saveNotes(context, [...notesFor(context), item]); return item;
  }
  function removeNote(context, id) { saveNotes(context, notesFor(context).filter(item => item.id !== id)); }

  function closeSheets(root) { root.querySelectorAll('.viewer-sheet-backdrop').forEach(node => node.remove()); }
  function sheet(root, title, body) {
    closeSheets(root);
    const backdrop = document.createElement('div');
    backdrop.className = 'viewer-sheet-backdrop';
    backdrop.innerHTML = `<section class="viewer-bottom-sheet" role="dialog" aria-modal="true"><div class="viewer-sheet-handle"></div><div class="viewer-sheet-head"><h2>${esc(title)}</h2><button type="button" data-sheet-close aria-label="${esc(t('close'))}">×</button></div><div class="viewer-sheet-body">${body}</div></section>`;
    root.append(backdrop);
    backdrop.addEventListener('click', event => { if (event.target === backdrop || event.target.closest('[data-sheet-close]')) backdrop.remove(); });
    return backdrop;
  }

  function openNotes(root, context, getPage) {
    const render = () => {
      const list = notesFor(context);
      const currentPage = Number(getPage?.()) || null;
      const backdrop = sheet(root, t('notes'), `
        ${context.lecture?.notes ? `<section class="viewer-lecture-notes"><span>${esc(t('lectureNotes'))}</span><p>${esc(context.lecture.notes)}</p></section>` : ''}
        <form class="viewer-note-form"><textarea maxlength="4000" placeholder="${esc(t('notePlaceholder'))}"></textarea><div><span>${currentPage ? `${esc(t('page'))} ${currentPage}` : ''}</span><button type="submit">${esc(t('addNote'))}</button></div></form>
        <section class="viewer-note-list"><h3>${esc(t('personalNotes'))}</h3>${list.length ? list.slice().reverse().map(item => `<article data-note-id="${esc(item.id)}"><div>${item.page ? `<span>${esc(t('page'))} ${item.page}</span>` : ''}<time>${new Date(item.createdAt).toLocaleString(lang()==='ar'?'ar-IQ':'en')}</time></div><p>${esc(item.text)}</p><button type="button" data-note-delete="${esc(item.id)}">${esc(t('remove'))}</button></article>`).join('') : `<p class="viewer-empty-note">${esc(t('noNotes'))}</p>`}</section>`);
      backdrop.querySelector('.viewer-note-form').onsubmit = event => {
        event.preventDefault();
        const textarea = event.currentTarget.querySelector('textarea');
        if (!addNote(context, textarea.value, currentPage)) return;
        backdrop.remove(); render();
      };
      backdrop.querySelectorAll('[data-note-delete]').forEach(button => button.onclick = () => { removeNote(context, button.dataset.noteDelete); backdrop.remove(); render(); });
    };
    render();
  }

  function studyAction(root, action, context, onClose) {
    closeSheets(root);
    if (action === 'exam') {
      onClose?.();
      location.hash = 'calendar/Exams';
      return;
    }
    const event = new CustomEvent('dafatii:viewer-study-action', { cancelable:true, detail:{ action, lecture:context.lecture || null, fileId:context.fileId || null, url:context.url || null } });
    window.dispatchEvent(event);
    if (!event.defaultPrevented) {
      if (typeof showToast === 'function') showToast(t('unavailable'));
      else alert(t('unavailable'));
    }
  }

  function openSettings(root, context, controls = {}) {
    const axis = controls.getAxis?.();
    const backdrop = sheet(root, t('settings'), `
      <div class="viewer-setting-grid">
        <button type="button" data-viewer-setting="interactive"><span>✦</span><strong>${esc(t('interactive'))}</strong></button>
        <button type="button" data-viewer-setting="flashcards"><span>◫</span><strong>${esc(t('flashcards'))}</strong></button>
        <button type="button" data-viewer-setting="exam"><span>✓</span><strong>${esc(t('exam'))}</strong></button>
        ${controls.setAxis ? `<button type="button" data-viewer-setting="axis"><span>${axis === 'horizontal' ? '↔' : '↕'}</span><strong>${esc(axis === 'horizontal' ? t('vertical') : t('horizontal'))}</strong></button>` : ''}
        ${controls.zoomIn ? `<button type="button" data-viewer-setting="zoom-in"><span>＋</span><strong>${esc(t('zoomIn'))}</strong></button><button type="button" data-viewer-setting="zoom-out"><span>−</span><strong>${esc(t('zoomOut'))}</strong></button>` : ''}
        ${controls.rotate ? `<button type="button" data-viewer-setting="rotate"><span>↻</span><strong>${esc(t('rotate'))}</strong></button>` : ''}
        ${controls.search ? `<button type="button" data-viewer-setting="search"><span>⌕</span><strong>${esc(t('search'))}</strong></button>` : ''}
        ${controls.download ? `<button type="button" data-viewer-setting="download"><span>⇩</span><strong>${esc(t('download'))}</strong></button>` : ''}
        ${controls.fullscreen ? `<button type="button" data-viewer-setting="fullscreen"><span>⛶</span><strong>${esc(t('fullscreen'))}</strong></button>` : ''}
      </div>`);
    backdrop.querySelectorAll('[data-viewer-setting]').forEach(button => button.onclick = async () => {
      const action = button.dataset.viewerSetting;
      if (['interactive','flashcards','exam'].includes(action)) return studyAction(root, action, context, controls.close);
      if (action === 'axis') { const next = controls.getAxis() === 'horizontal' ? 'vertical' : 'horizontal'; controls.setAxis(next); backdrop.remove(); return; }
      if (action === 'zoom-in') controls.zoomIn?.();
      if (action === 'zoom-out') controls.zoomOut?.();
      if (action === 'rotate') controls.rotate?.();
      if (action === 'download') await controls.download?.();
      if (action === 'fullscreen') await controls.fullscreen?.();
      if (action === 'search') {
        backdrop.remove();
        const searchSheet = sheet(root, t('search'), `<form class="viewer-search-form"><input type="search" placeholder="${esc(t('searchPlaceholder'))}" autofocus><button type="submit">${esc(t('search'))}</button></form><p class="viewer-search-status" role="status"></p>`);
        searchSheet.querySelector('form').onsubmit = async event => { event.preventDefault(); const q=event.currentTarget.querySelector('input').value.trim(); if(!q)return; const status=searchSheet.querySelector('.viewer-search-status'); status.textContent='…'; status.textContent = await controls.search(q) || ''; };
        return;
      }
      backdrop.remove();
    });
  }

  function mountDock(root, context, controls = {}) {
    const dock = document.createElement('nav');
    dock.className = 'viewer-bottom-dock';
    dock.innerHTML = `<button type="button" data-viewer-dock="settings" aria-label="${esc(t('settings'))}">⚙</button>${controls.setAxis ? `<button type="button" data-viewer-dock="axis" aria-label="${esc(t('horizontal'))}">${controls.getAxis?.() === 'horizontal' ? '↔' : '↕'}</button>` : ''}${controls.notes ? `<button type="button" data-viewer-dock="notes" aria-label="${esc(t('writeNote'))}">✎</button>` : ''}`;
    root.append(dock);
    dock.querySelector('[data-viewer-dock=settings]').onclick = () => openSettings(root, context, controls);
    const axisButton = dock.querySelector('[data-viewer-dock=axis]');
    if (axisButton) axisButton.onclick = () => { const next = controls.getAxis() === 'horizontal' ? 'vertical' : 'horizontal'; controls.setAxis(next); axisButton.textContent = next === 'horizontal' ? '↔' : '↕'; };
    const noteButton = dock.querySelector('[data-viewer-dock=notes]');
    if (noteButton) noteButton.onclick = () => openNotes(root, context, controls.getPage);
    return dock;
  }

  function youtubeId(value) {
    try { const url=new URL(value); if(url.hostname==='youtu.be')return url.pathname.split('/').filter(Boolean)[0]||''; if(/(^|\.)youtube\.com$/i.test(url.hostname)){if(url.pathname==='/watch')return url.searchParams.get('v')||''; return (url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/i)||[])[1]||'';} } catch {} return '';
  }
  function vimeoId(value) { try { const url=new URL(value); if(!/(^|\.)vimeo\.com$/i.test(url.hostname))return ''; return (url.pathname.match(/\/(\d+)(?:$|\/)/)||[])[1]||''; } catch { return ''; } }

  async function openVideo(context = {}) {
    let url = context.url || '';
    if (!url && context.fileId) url = await window.DafatiiFiles.getViewUrl(context.fileId);
    if (!url) throw new Error('Video URL is unavailable.');
    const yt = youtubeId(url), vm = vimeoId(url);
    const embed = yt ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?rel=0&playsinline=1` : vm ? `https://player.vimeo.com/video/${encodeURIComponent(vm)}?playsinline=1` : '';
    const root = document.createElement('div');
    root.className = 'dafatii-immersive-viewer video-workspace';
    const title = context.lecture?.name || context.metadata?.filename || t('video');
    root.innerHTML = `<section class="immersive-viewer-shell" role="dialog" aria-modal="true"><button class="immersive-close" type="button" aria-label="${esc(t('close'))}">×</button><div class="immersive-title"><span>${esc(t('video'))}</span><strong>${esc(title)}</strong></div><div class="video-workspace-stage">${embed ? `<iframe src="${esc(embed)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<video src="${esc(url)}" controls playsinline preload="metadata"></video>`}</div><aside class="video-notes-pane"><span>${esc(t('notes'))}</span><p data-video-notes-copy>${esc(context.lecture?.notes || t('noNotes'))}</p></aside></section>`;
    document.body.append(root);
    const shell = root.querySelector('.immersive-viewer-shell');
    const close = () => root.remove();
    root.querySelector('.immersive-close').onclick = close;
    root.addEventListener('click', event => { if (event.target === root) close(); });
    const notePane = root.querySelector('.video-notes-pane');
    const ctx = { ...context, url };
    mountDock(root, ctx, {
      notes:true,
      close,
      download: context.fileId ? async () => { location.assign(await window.DafatiiFiles.getViewUrl(context.fileId, { download:true })); } : null,
      fullscreen: () => shell.requestFullscreen?.(),
      getPage: () => null
    });
    const dock = root.querySelector('.viewer-bottom-dock');
    const toggle = document.createElement('button'); toggle.type='button'; toggle.className='viewer-note-toggle'; toggle.textContent='▤'; toggle.setAttribute('aria-label',t('notes'));
    toggle.onclick=()=>notePane.classList.toggle('collapsed'); dock.insertBefore(toggle,dock.lastElementChild);
    root.querySelector('video')?.play?.().catch(() => {});
    return root;
  }

  window.DafatiiViewerWorkspace = Object.freeze({ t, esc, getAxis, setAxis, mountDock, openSettings, openNotes, openVideo, notesFor });
})();
