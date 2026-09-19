(() => {
  'use strict';

  const NOTES_KEY = 'dafatii:viewerNotes:v1';
  const PREFS_KEY = 'dafatii:viewerPrefs:v1';
  const copy = {
    en: {
      settings:'Reader settings', interactive:'Interactive lecture', flashcards:'Flashcards', exam:'Exam', mcqs:'MCQs', questionAnswer:'Question & Answer',
      download:'Download', fullscreen:'Fullscreen', vertical:'Up – Down', horizontal:'Left – Right', notes:'Notes', writeNote:'Write note',
      lectureNotes:'Lecture notes', personalNotes:'My notes', addNote:'Add note', notePlaceholder:'Write a note…', page:'Page', close:'Close',
      noNotes:'No notes yet.', remove:'Delete', search:'Search document', searchPlaceholder:'Search…', zoomIn:'Zoom in', zoomOut:'Zoom out',
      rotate:'Rotate', unavailable:'This study tool is not configured yet.', video:'Video', file:'File',
      switchLecture:'Switch lecture', navigateLectures:'Navigate lectures', lectureStatus:'Lecture status', examine:'Examine',
      previousLecture:'Previous lecture', nextLecture:'Next lecture', selectLecture:'Select specific lecture',
      unread:'Unread', reading:'Reading', finished:'Finished', notOpened:'Not opened yet.', inProgress:'In progress.', completed:'Completed.',
      reviewPoints:'Quickly review key points.', testUnderstanding:'Test your understanding.', exploreDeeper:'Explore and learn deeper.',
      scrollDirection:'Scroll direction', scrollHelp:'Choose how to navigate pages.', theme:'Theme', light:'Light', dark:'Dark',
      fontSize:'Font size', small:'Small', medium:'Medium', large:'Large', zoom:'Zoom', pageBehavior:'Page behavior',
      continuousScroll:'Continuous scroll', paged:'Paged', tools:'Reader tools', chooseNotesSource:'Choose notes source', lectureSource:'Lecture notes', lectureSourceHelp:'Notes attached to this lecture.', myNotesHelp:'Your personal notes for this lecture.', addNoteTitle:'Add a note', visibility:'Visibility', public:'Public', personal:'Personal', publicHelp:'Visible to other students', personalHelp:'Only you can see this note', publishNote:'Publish note', publicUnavailable:'Public note sharing is not configured yet.', noLectureNotes:'No lecture notes have been added yet.', noteSaved:'Note saved.'
    },
    ar: {
      settings:'إعدادات القارئ', interactive:'المحاضرة التفاعلية', flashcards:'البطاقات التعليمية', exam:'الاختبار', mcqs:'أسئلة اختيار من متعدد', questionAnswer:'سؤال وجواب',
      download:'تنزيل', fullscreen:'ملء الشاشة', vertical:'أعلى – أسفل', horizontal:'يمين – يسار', notes:'الملاحظات', writeNote:'كتابة ملاحظة',
      lectureNotes:'ملاحظات المحاضرة', personalNotes:'ملاحظاتي', addNote:'إضافة ملاحظة', notePlaceholder:'اكتب ملاحظة…', page:'صفحة', close:'إغلاق',
      noNotes:'لا توجد ملاحظات بعد.', remove:'حذف', search:'البحث في الملف', searchPlaceholder:'بحث…', zoomIn:'تكبير', zoomOut:'تصغير',
      rotate:'تدوير', unavailable:'هذه الأداة الدراسية غير مهيأة بعد.', video:'فيديو', file:'ملف',
      switchLecture:'تبديل المحاضرة', navigateLectures:'التنقل بين المحاضرات', lectureStatus:'حالة المحاضرة', examine:'اختبر نفسك',
      previousLecture:'المحاضرة السابقة', nextLecture:'المحاضرة التالية', selectLecture:'اختر محاضرة محددة',
      unread:'غير مقروءة', reading:'قيد القراءة', finished:'مكتملة', notOpened:'لم تُفتح بعد.', inProgress:'قيد التقدم.', completed:'مكتملة.',
      reviewPoints:'راجع النقاط المهمة بسرعة.', testUnderstanding:'اختبر مدى فهمك.', exploreDeeper:'استكشف وتعلّم بعمق أكبر.',
      scrollDirection:'اتجاه التمرير', scrollHelp:'اختر طريقة التنقل بين الصفحات.', theme:'المظهر', light:'فاتح', dark:'داكن',
      fontSize:'حجم المحتوى', small:'صغير', medium:'متوسط', large:'كبير', zoom:'التكبير', pageBehavior:'سلوك الصفحات',
      continuousScroll:'تمرير مستمر', paged:'صفحة بصفحة', tools:'أدوات القارئ', chooseNotesSource:'اختر مصدر الملاحظات', lectureSource:'ملاحظات المحاضرة', lectureSourceHelp:'الملاحظات المرفقة بهذه المحاضرة.', myNotesHelp:'ملاحظاتك الشخصية لهذه المحاضرة.', addNoteTitle:'أضف ملاحظة', visibility:'الخصوصية', public:'عام', personal:'شخصي', publicHelp:'مرئية للطلاب الآخرين', personalHelp:'يمكنك أنت فقط رؤية هذه الملاحظة', publishNote:'نشر الملاحظة', publicUnavailable:'مشاركة الملاحظات العامة غير مفعلة حالياً.', noLectureNotes:'لا توجد ملاحظات للمحاضرة حتى الآن.', noteSaved:'تم حفظ الملاحظة.'
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

  const READER_PREFS_KEY = 'dafatii:readerUiPrefs:v1';
  const LECTURE_STATUS_KEY = 'dafatii:lectureReaderStatus:v1';
  const icon = (name, fallback='') => window.DafatiiIcons?.icon?.(name) || fallback;

  function localObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }
  function writeLocalObject(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  function readerPrefs() { return localObject(READER_PREFS_KEY); }
  function setReaderPref(key, value) { const p=readerPrefs(); p[key]=value; writeLocalObject(READER_PREFS_KEY,p); }

  function lectureGroup(context = {}) {
    const lecture = context.lecture;
    if (!lecture || typeof state === 'undefined' || !state?.subjects) return null;
    let subject = null;
    if (lecture.subjectId) subject = state.subjects.find(item => String(item.id) === String(lecture.subjectId)) || null;
    if (!subject && state.lectures && typeof state.lectures === 'object') {
      const entry = Object.entries(state.lectures).find(([,items]) => Array.isArray(items) && items.some(item => String(item?.id) === String(lecture.id)));
      if (entry) subject = state.subjects.find(item => String(item.id) === String(entry[0])) || null;
    }
    if (!subject) return null;
    let lectures = [];
    try {
      lectures = typeof subjectLectures === 'function' ? subjectLectures(subject.id) : (Array.isArray(state.lectures?.[subject.id]) ? state.lectures[subject.id] : []);
    } catch { lectures = Array.isArray(state.lectures?.[subject.id]) ? state.lectures[subject.id] : []; }
    const index = lectures.findIndex(item => String(item?.id) === String(lecture.id));
    return { subject, lectures, index };
  }

  function openLectureFromReader(root, lecture, controls = {}) {
    if (!lecture) return;
    closeSheets(root);
    controls.close?.();
    setTimeout(() => {
      try { window.openLectureLink?.(lecture); }
      catch (error) { if (typeof showToast === 'function') showToast(error?.message || t('unavailable')); }
    }, 0);
  }

  function currentLectureStatus(context) {
    if (!context.lecture?.id) return 'unread';
    return localObject(LECTURE_STATUS_KEY)[String(context.lecture.id)] || 'unread';
  }
  function setLectureStatus(context, status) {
    if (!context.lecture?.id || !['unread','reading','finished'].includes(status)) return;
    const value=localObject(LECTURE_STATUS_KEY);
    value[String(context.lecture.id)]=status;
    writeLocalObject(LECTURE_STATUS_KEY,value);
  }
  function syncLectureStatus(root, context) {
    const status=currentLectureStatus(context);
    root.dataset.readerLectureStatus=status;
    const button=root.querySelector('[data-viewer-dock="status"]');
    if (button) button.dataset.status=status;
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

  function openSwitchLecture(root, context, controls = {}) {
    const group=lectureGroup(context);
    if (!group?.lectures?.length) { if(typeof showToast==='function')showToast(t('unavailable')); return; }
    const backdrop=sheet(root,t('switchLecture'),`
      <div class="viewer-lecture-picker">
        ${group.lectures.map(item => `<button type="button" data-reader-lecture="${esc(item.id)}" class="${String(item.id)===String(context.lecture?.id)?'active':''}"><span class="viewer-lecture-picker-icon">${esc(item.icon || '◫')}</span><span><strong>${esc(item.name || t('file'))}</strong><small>${String(item.id)===String(context.lecture?.id)?esc(t('reading')):''}</small></span><span class="viewer-row-arrow">${icon('arrow-right','→')}</span></button>`).join('')}
      </div>`);
    backdrop.querySelectorAll('[data-reader-lecture]').forEach(button => button.onclick = () => {
      const lecture=group.lectures.find(item => String(item.id)===String(button.dataset.readerLecture));
      openLectureFromReader(root,lecture,controls);
    });
  }

  function openNavigateLectures(root, context, controls = {}) {
    const group=lectureGroup(context);
    if (!group?.lectures?.length) { if(typeof showToast==='function')showToast(t('unavailable')); return; }
    const prev=group.index>0?group.lectures[group.index-1]:null;
    const next=group.index>=0&&group.index<group.lectures.length-1?group.lectures[group.index+1]:null;
    const backdrop=sheet(root,t('navigateLectures'),`
      <div class="viewer-navigation-sheet">
        <div class="viewer-nav-pair">
          <button type="button" data-reader-nav="previous" ${prev?'':'disabled'}>${icon('arrow-left','←')}<span>${esc(t('previousLecture'))}</span></button>
          <button type="button" data-reader-nav="next" ${next?'':'disabled'}><span>${esc(t('nextLecture'))}</span>${icon('arrow-right','→')}</button>
        </div>
        <label class="viewer-lecture-select"><span>${esc(t('selectLecture'))}</span><select data-reader-lecture-select>${group.lectures.map(item => `<option value="${esc(item.id)}"${String(item.id)===String(context.lecture?.id)?' selected':''}>${esc(item.name || t('file'))}</option>`).join('')}</select></label>
      </div>`);
    backdrop.querySelector('[data-reader-nav="previous"]')?.addEventListener('click',()=>openLectureFromReader(root,prev,controls));
    backdrop.querySelector('[data-reader-nav="next"]')?.addEventListener('click',()=>openLectureFromReader(root,next,controls));
    backdrop.querySelector('[data-reader-lecture-select]')?.addEventListener('change',event=>{
      const lecture=group.lectures.find(item=>String(item.id)===String(event.currentTarget.value));
      openLectureFromReader(root,lecture,controls);
    });
  }

  function openLectureStatus(root, context) {
    if (!context.lecture?.id) { if(typeof showToast==='function')showToast(t('unavailable')); return; }
    const current=currentLectureStatus(context);
    const rows=[
      ['unread','clock',t('unread'),t('notOpened')],
      ['reading','check',t('reading'),t('inProgress')],
      ['finished','check',t('finished'),t('completed')]
    ];
    const backdrop=sheet(root,t('lectureStatus'),`
      <div class="viewer-status-list">${rows.map(([value,ic,title,desc])=>`<button type="button" data-reader-status="${value}" class="${current===value?'active':''}"><span class="viewer-status-icon">${icon(ic,value==='unread'?'◷':'✓')}</span><span><strong>${esc(title)}</strong><small>${esc(desc)}</small></span></button>`).join('')}</div>`);
    backdrop.querySelectorAll('[data-reader-status]').forEach(button=>button.onclick=()=>{
      setLectureStatus(context,button.dataset.readerStatus);
      syncLectureStatus(root,context);
      backdrop.remove();
    });
  }

  function openExamine(root, context, controls = {}) {
    const items=[
      ['flashcards','file',t('flashcards'),t('reviewPoints')],
      ['mcqs','check',t('mcqs'),t('testUnderstanding')],
      ['question-answer','chat',t('questionAnswer'),t('exploreDeeper')]
    ];
    const backdrop=sheet(root,t('examine'),`
      <div class="viewer-examine-list">${items.map(([action,ic,title,desc])=>`<button type="button" data-reader-examine="${action}"><span class="viewer-examine-icon">${icon(ic,'✦')}</span><span><strong>${esc(title)}</strong><small>${esc(desc)}</small></span><span class="viewer-row-arrow">${icon('arrow-right','→')}</span></button>`).join('')}</div>`);
    backdrop.querySelectorAll('[data-reader-examine]').forEach(button=>button.onclick=()=>studyAction(root,button.dataset.readerExamine,context,controls.close));
  }

  function setReaderTheme(root, theme) {
    const next=theme==='dark'?'dark':'light';
    root.dataset.readerTheme=next;
    setReaderPref('theme',next);
  }

  function openSearch(root, controls) {
    const searchSheet = sheet(root, t('search'), `<form class="viewer-search-form"><input type="search" placeholder="${esc(t('searchPlaceholder'))}" autofocus><button type="submit">${esc(t('search'))}</button></form><p class="viewer-search-status" role="status"></p>`);
    searchSheet.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const q=event.currentTarget.querySelector('input').value.trim(); if(!q)return;
      const status=searchSheet.querySelector('.viewer-search-status'); status.textContent='…'; status.textContent = await controls.search(q) || '';
    };
  }

  function openSettings(root, context, controls = {}) {
    const axis=controls.getAxis?.() || 'vertical';
    const theme=root.dataset.readerTheme || readerPrefs().theme || 'light';
    const scale=root.dataset.readerScale || 'medium';
    const paged=root.classList.contains('reader-paged');
    const backdrop=sheet(root,t('settings'),`
      <div class="reader-settings-stack" data-reader-settings>
        ${controls.setAxis?`<section class="reader-setting-section"><div class="reader-setting-heading"><strong>${esc(t('scrollDirection'))}</strong><small>${esc(t('scrollHelp'))}</small></div><div class="reader-segmented" data-reader-axis><button type="button" data-axis-value="vertical" class="${axis==='vertical'?'active':''}">↕ <span>${esc(t('vertical'))}</span></button><button type="button" data-axis-value="horizontal" class="${axis==='horizontal'?'active':''}">↔ <span>${esc(t('horizontal'))}</span></button></div></section>`:''}
        <section class="reader-setting-row"><span class="reader-setting-row-icon">◐</span><strong>${esc(t('theme'))}</strong><button type="button" data-reader-theme-toggle><span data-reader-theme-value>${esc(theme==='dark'?t('dark'):t('light'))}</span>${icon('arrow-right','›')}</button></section>
        ${controls.zoomIn&&controls.zoomOut?`<section class="reader-setting-row reader-size-row"><span class="reader-setting-row-icon">Aa</span><strong>${esc(t('fontSize'))}</strong><div class="reader-size-control"><button type="button" data-reader-size="small" class="${scale==='small'?'active':''}">A</button><button type="button" data-reader-size="medium" class="${scale==='medium'?'active':''}">A</button><button type="button" data-reader-size="large" class="${scale==='large'?'active':''}">A</button></div></section><section class="reader-setting-row"><span class="reader-setting-row-icon">⌕</span><strong>${esc(t('zoom'))}</strong><div class="reader-zoom-control"><button type="button" data-reader-zoom="out">−</button><span data-reader-zoom-value>100%</span><button type="button" data-reader-zoom="in">＋</button></div></section>`:''}
        <section class="reader-setting-row"><span class="reader-setting-row-icon">▤</span><strong>${esc(t('pageBehavior'))}</strong><button type="button" data-reader-page-behavior><span>${esc(paged?t('paged'):t('continuousScroll'))}</span>${icon('arrow-right','›')}</button></section>
        <section class="reader-tool-list"><h3>${esc(t('tools'))}</h3>
          ${controls.notes?`<button type="button" data-reader-tool="notes"><span>${icon('edit','✎')}</span><strong>${esc(t('notes'))}</strong>${icon('arrow-right','›')}</button>`:''}
          ${controls.search?`<button type="button" data-reader-tool="search"><span>${icon('search','⌕')}</span><strong>${esc(t('search'))}</strong>${icon('arrow-right','›')}</button>`:''}
          ${controls.rotate?`<button type="button" data-reader-tool="rotate"><span>↻</span><strong>${esc(t('rotate'))}</strong>${icon('arrow-right','›')}</button>`:''}
          ${controls.download?`<button type="button" data-reader-tool="download"><span>${icon('download','⇩')}</span><strong>${esc(t('download'))}</strong>${icon('arrow-right','›')}</button>`:''}
          ${controls.fullscreen?`<button type="button" data-reader-tool="fullscreen"><span>⛶</span><strong>${esc(t('fullscreen'))}</strong>${icon('arrow-right','›')}</button>`:''}
        </section>
      </div>`);

    backdrop.querySelectorAll('[data-axis-value]').forEach(button=>button.onclick=()=>{
      controls.setAxis?.(button.dataset.axisValue);
      backdrop.remove();
    });
    backdrop.querySelector('[data-reader-theme-toggle]')?.addEventListener('click',()=>{
      const next=(root.dataset.readerTheme||theme)==='dark'?'light':'dark';
      setReaderTheme(root,next);
      const value=backdrop.querySelector('[data-reader-theme-value]');
      if(value)value.textContent=next==='dark'?t('dark'):t('light');
    });
    const scaleOrder=['small','medium','large'];
    backdrop.querySelectorAll('[data-reader-size]').forEach(button=>button.onclick=()=>{
      const current=root.dataset.readerScale||'medium';
      const next=button.dataset.readerSize;
      const delta=scaleOrder.indexOf(next)-scaleOrder.indexOf(current);
      if(delta>0) for(let i=0;i<delta;i++)controls.zoomIn?.();
      if(delta<0) for(let i=0;i<Math.abs(delta);i++)controls.zoomOut?.();
      root.dataset.readerScale=next;
      backdrop.querySelectorAll('[data-reader-size]').forEach(item=>item.classList.toggle('active',item===button));
    });
    let zoomPercent=100;
    backdrop.querySelectorAll('[data-reader-zoom]').forEach(button=>button.onclick=()=>{
      if(button.dataset.readerZoom==='in'){controls.zoomIn?.();zoomPercent=Math.min(300,Math.round(zoomPercent*1.18));}
      else {controls.zoomOut?.();zoomPercent=Math.max(45,Math.round(zoomPercent/1.18));}
      const value=backdrop.querySelector('[data-reader-zoom-value]'); if(value)value.textContent=`${zoomPercent}%`;
    });
    backdrop.querySelector('[data-reader-page-behavior]')?.addEventListener('click',event=>{
      root.classList.toggle('reader-paged');
      const span=event.currentTarget.querySelector('span');
      if(span)span.textContent=root.classList.contains('reader-paged')?t('paged'):t('continuousScroll');
      setReaderPref('paged',root.classList.contains('reader-paged'));
    });
    backdrop.querySelectorAll('[data-reader-tool]').forEach(button=>button.onclick=async()=>{
      const action=button.dataset.readerTool;
      if(action==='notes'){backdrop.remove();openNotes(root,context,controls.getPage);return;}
      if(action==='search'){backdrop.remove();openSearch(root,controls);return;}
      if(action==='rotate'){controls.rotate?.();backdrop.remove();return;}
      if(action==='download'){await controls.download?.();backdrop.remove();return;}
      if(action==='fullscreen'){await controls.fullscreen?.();backdrop.remove();}
    });
  }

  function mountCompactDock(root, context, controls = {}) {
    const dock=document.createElement('nav');
    dock.className='viewer-bottom-dock viewer-bottom-dock-compact';
    dock.innerHTML=`<button type="button" data-viewer-dock="settings" aria-label="${esc(t('settings'))}">⚙</button>${controls.notes?`<button type="button" data-viewer-dock="notes" aria-label="${esc(t('writeNote'))}">✎</button>`:''}`;
    root.append(dock);
    dock.querySelector('[data-viewer-dock="settings"]').onclick=()=>openSettings(root,context,controls);
    dock.querySelector('[data-viewer-dock="notes"]')?.addEventListener('click',()=>openNotes(root,context,controls.getPage));
    return dock;
  }

  function mountReaderDock(root, context, controls = {}) {
    const shell=root.querySelector('.immersive-viewer-shell') || root;
    const pref=readerPrefs();
    setReaderTheme(root,pref.theme || 'light');
    root.classList.toggle('reader-paged',Boolean(pref.paged));
    if(context.lecture?.id && currentLectureStatus(context)==='unread')setLectureStatus(context,'reading');

    const settings=document.createElement('button');
    settings.type='button';
    settings.className='reader-top-control reader-settings-button';
    settings.setAttribute('aria-label',t('settings'));
    settings.innerHTML=icon('settings','⚙');
    shell.append(settings);
    settings.onclick=()=>openSettings(root,context,controls);

    const dock=document.createElement('nav');
    dock.className='viewer-bottom-dock viewer-reader-dock';
    dock.setAttribute('aria-label',t('file'));
    const hasLecture=Boolean(context.lecture?.id);
    dock.innerHTML=`
      <button type="button" data-viewer-dock="switch" aria-label="${esc(t('switchLecture'))}" title="${esc(t('switchLecture'))}" ${hasLecture?'':'disabled'}><span class="viewer-dock-icon">${icon('change-course','▣')}</span></button>
      <button type="button" data-viewer-dock="navigate" aria-label="${esc(t('navigateLectures'))}" title="${esc(t('navigateLectures'))}" ${hasLecture?'':'disabled'}><span class="viewer-dock-icon">${icon('subjects','☷')}</span></button>
      <button type="button" data-viewer-dock="status" aria-label="${esc(t('lectureStatus'))}" title="${esc(t('lectureStatus'))}" ${hasLecture?'':'disabled'}><span class="viewer-dock-icon">${icon('check','✓')}</span></button>
      <button type="button" data-viewer-dock="examine" aria-label="${esc(t('examine'))}" title="${esc(t('examine'))}"><span class="viewer-dock-icon">${icon('star','✦')}</span></button>`;
    root.append(dock);
    dock.querySelector('[data-viewer-dock="switch"]')?.addEventListener('click',()=>openSwitchLecture(root,context,controls));
    dock.querySelector('[data-viewer-dock="navigate"]')?.addEventListener('click',()=>openNavigateLectures(root,context,controls));
    dock.querySelector('[data-viewer-dock="status"]')?.addEventListener('click',()=>openLectureStatus(root,context));
    dock.querySelector('[data-viewer-dock="examine"]')?.addEventListener('click',()=>openExamine(root,context,controls));
    syncLectureStatus(root,context);
    return dock;
  }

  function mountDock(root, context, controls = {}) {
    return root?.classList?.contains('file-workspace') ? mountReaderDock(root,context,controls) : mountCompactDock(root,context,controls);
  }

  function youtubeId(value) {
    try { const url=new URL(value); if(url.hostname==='youtu.be')return url.pathname.split('/').filter(Boolean)[0]||''; if(/(^|\.)youtube\.com$/i.test(url.hostname)){if(url.pathname==='/watch')return url.searchParams.get('v')||''; return (url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/i)||[])[1]||'';} } catch {} return '';
  }
  function vimeoId(value) { try { const url=new URL(value); if(!/(^|\.)vimeo\.com$/i.test(url.hostname))return ''; return (url.pathname.match(/\/(\d+)(?:$|\/)/)||[])[1]||''; } catch { return ''; } }

  function openVideoNotesSource(root, context, selected, onSelect) {
    const options=[
      { id:'lecture', icon:'file', title:t('lectureSource'), help:t('lectureSourceHelp') },
      { id:'personal', icon:'edit', title:t('personalNotes'), help:t('myNotesHelp') }
    ];
    const backdrop=sheet(root,t('chooseNotesSource'),`
      <div class="video-source-list">
        ${options.map(option=>`<button type="button" data-video-source="${option.id}" class="${selected===option.id?'active':''}"><span class="video-source-icon">${icon(option.icon,option.id==='lecture'?'▤':'✎')}</span><span><strong>${esc(option.title)}</strong><small>${esc(option.help)}</small></span><span class="video-source-radio" aria-hidden="true"></span></button>`).join('')}
      </div>`);
    backdrop.querySelectorAll('[data-video-source]').forEach(button=>button.onclick=()=>{
      backdrop.remove();
      onSelect?.(button.dataset.videoSource);
    });
  }

  async function openVideo(context = {}) {
    let url = context.url || '';
    if (!url && context.fileId) url = await window.DafatiiFiles.getViewUrl(context.fileId);
    if (!url) throw new Error('Video URL is unavailable.');

    const yt = youtubeId(url), vm = vimeoId(url);
    const embed = yt ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?rel=0&playsinline=1` : vm ? `https://player.vimeo.com/video/${encodeURIComponent(vm)}?playsinline=1` : '';
    const root = document.createElement('div');
    root.className = 'dafatii-immersive-viewer video-workspace';
    const title = context.lecture?.name || context.metadata?.filename || t('video');
    const ctx = { ...context, url };
    let selectedSource = context.lecture?.notes ? 'lecture' : 'personal';
    let visibility = 'personal';

    root.innerHTML = `<section class="immersive-viewer-shell video-reader-shell" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="video-reader-topbar">
        <button class="video-reader-exit" type="button" aria-label="${esc(t('close'))}">×</button>
        <button class="video-reader-examine" type="button"><span class="video-reader-examine-icon">${icon('star','✦')}</span><span>${esc(t('examine'))}</span></button>
      </header>
      <div class="video-workspace-stage">${embed ? `<iframe src="${esc(embed)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<video src="${esc(url)}" controls playsinline preload="metadata"></video>`}</div>
      <section class="video-reader-heading"><h1>${esc(title)}</h1></section>
      <section class="video-reader-notes" aria-label="${esc(t('notes'))}">
        <div class="video-notes-scroll" data-video-notes-scroll>
          <div class="video-notes-source-row">
            <div><span>${esc(t('notes'))}</span><strong data-video-source-title></strong></div>
            <button type="button" data-video-source-button><span data-video-source-button-label></span>${icon('arrow-right','›')}</button>
          </div>
          <div class="video-notes-region" data-video-notes-region></div>
          <form class="video-note-composer" data-video-note-form>
            <label class="video-note-field"><span>${esc(t('addNoteTitle'))}</span><textarea maxlength="500" placeholder="${esc(t('notePlaceholder'))}"></textarea><small><span data-video-note-count>0</span>/500</small></label>
            <div class="video-note-toolbar">
              <button type="button" class="video-note-source-control" data-video-source-button-bottom>${icon('file','▤')}<span><small>${esc(t('chooseNotesSource'))}</small><strong data-video-source-bottom-label></strong></span>${icon('arrow-right','›')}</button>
              <div class="video-note-visibility" role="group" aria-label="${esc(t('visibility'))}">
                <button type="button" data-video-visibility="public"><span class="video-visibility-icon">${icon('globe','◎')}</span><span><strong>${esc(t('public'))}</strong><small>${esc(t('publicHelp'))}</small></span></button>
                <button type="button" data-video-visibility="personal" class="active"><span class="video-visibility-icon">${icon('lock','▣')}</span><span><strong>${esc(t('personal'))}</strong><small>${esc(t('personalHelp'))}</small></span></button>
              </div>
            </div>
            <button class="video-note-publish" type="submit">${esc(t('publishNote'))}</button>
          </form>
        </div>
      </section>
    </section>`;
    document.body.append(root);

    const shell = root.querySelector('.video-reader-shell');
    const notesScroll = root.querySelector('[data-video-notes-scroll]');
    const textarea = root.querySelector('.video-note-composer textarea');
    const close = () => root.remove();

    function sourceLabel() {
      return selectedSource === 'lecture' ? t('lectureSource') : t('personalNotes');
    }
    function renderNotes() {
      const region=root.querySelector('[data-video-notes-region]');
      const label=sourceLabel();
      root.querySelector('[data-video-source-title]').textContent=label;
      root.querySelector('[data-video-source-button-label]').textContent=label;
      root.querySelector('[data-video-source-bottom-label]').textContent=label;

      if (selectedSource === 'lecture') {
        const notes=String(context.lecture?.notes || '').trim();
        region.innerHTML = notes
          ? `<article class="video-notes-card video-notes-card-lecture"><div class="video-notes-card-badge">${icon('file','▤')}</div><div><strong>${esc(t('lectureSource'))}</strong><p>${esc(notes)}</p></div></article>`
          : `<div class="video-notes-empty">${esc(t('noLectureNotes'))}</div>`;
        return;
      }

      const list=notesFor(ctx).slice().reverse();
      region.innerHTML=list.length
        ? `<div class="video-personal-note-list">${list.map(item=>`<article data-video-note-id="${esc(item.id)}"><p>${esc(item.text)}</p><div>${item.page?`<span>${esc(t('page'))} ${item.page}</span>`:''}<time>${new Date(item.createdAt).toLocaleString(lang()==='ar'?'ar-IQ':'en')}</time><button type="button" data-video-note-delete="${esc(item.id)}">${esc(t('remove'))}</button></div></article>`).join('')}</div>`
        : `<div class="video-notes-empty">${esc(t('noNotes'))}</div>`;
      region.querySelectorAll('[data-video-note-delete]').forEach(button=>button.onclick=()=>{
        removeNote(ctx,button.dataset.videoNoteDelete);
        renderNotes();
      });
    }

    const chooseSource=()=>openVideoNotesSource(root,ctx,selectedSource,next=>{selectedSource=next;renderNotes();});
    root.querySelector('[data-video-source-button]').onclick=chooseSource;
    root.querySelector('[data-video-source-button-bottom]').onclick=chooseSource;
    root.querySelector('.video-reader-exit').onclick=close;
    root.querySelector('.video-reader-examine').onclick=()=>openExamine(root,ctx,{close});
    root.addEventListener('click',event=>{if(event.target===root)close();});

    root.querySelectorAll('[data-video-visibility]').forEach(button=>button.onclick=()=>{
      visibility=button.dataset.videoVisibility;
      root.querySelectorAll('[data-video-visibility]').forEach(item=>item.classList.toggle('active',item===button));
    });
    textarea.addEventListener('input',()=>{root.querySelector('[data-video-note-count]').textContent=String(textarea.value.length);});

    root.querySelector('[data-video-note-form]').onsubmit=event=>{
      event.preventDefault();
      const text=textarea.value.trim();
      if(!text)return;
      if(visibility==='public'){
        const publishEvent=new CustomEvent('dafatii:viewer-note-publish',{cancelable:true,detail:{text,visibility,lecture:ctx.lecture||null,fileId:ctx.fileId||null,url:ctx.url||null}});
        window.dispatchEvent(publishEvent);
        if(!publishEvent.defaultPrevented){
          if(typeof showToast==='function')showToast(t('publicUnavailable'));
          return;
        }
        textarea.value='';
        root.querySelector('[data-video-note-count]').textContent='0';
        if(typeof showToast==='function')showToast(t('noteSaved'));
        return;
      }
      addNote(ctx,text,null);
      textarea.value='';
      root.querySelector('[data-video-note-count]').textContent='0';
      selectedSource='personal';
      renderNotes();
      if(typeof showToast==='function')showToast(t('noteSaved'));
    };

    notesScroll?.addEventListener('scroll',()=>{}, { passive:true });

    renderNotes();
    root.querySelector('video')?.play?.().catch(() => {});
    return root;
  }

  window.DafatiiViewerWorkspace = Object.freeze({ t, esc, getAxis, setAxis, mountDock, openSettings, openNotes, openVideo, notesFor });
})();
