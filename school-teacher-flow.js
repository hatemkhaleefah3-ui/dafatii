(() => {
  'use strict';

  const SUBJECTS = ['arabic','english','math','chemistry','physics','biology','islamic_book'];
  const ALLOWED_ROUTES = new Set(['dashboard','change-course','profile','settings']);
  let catalog = null;
  let loading = null;
  let currentStep = 0;
  let saving = false;
  let refreshedCoursesFor = '';
  let scheduled = false;

  const copy = {
    en:{
      teachers:'My Teachers', choose:'Choose my teachers', title:'Choose your teachers', subtitle:'Choose one teacher for each subject. Teachers are ordered by popularity for your school level, stage and field.',
      dashboardTitle:'Your school teachers', dashboardText:'School students study by subject and teacher instead of joining courses.', selected:'selected', complete:'Teacher setup complete', continue:'Continue choosing teachers', change:'Change teachers',
      previous:'Previous', next:'Next', finish:'Finish', step:'Step', of:'of', mostPopular:'Most popular', popular:'Popular', students:'students selected this teacher', teacher:'Teacher', selectedTeacher:'Selected',
      noTeachers:'No teachers have been published for your exact school level, stage and field yet.', loading:'Loading teachers…', error:'Could not load the teacher directory.', retry:'Retry', saving:'Saving…',
      arabic:'Arabic', english:'English', math:'Math', chemistry:'Chemistry', physics:'Physics', biology:'Biology', islamic_book:'Islamic Book'
    },
    ar:{
      teachers:'مدرسيني', choose:'اختر مدرسيني', title:'اختر مدرسيك', subtitle:'اختر مدرساً واحداً لكل مادة. يتم ترتيب المدرسين حسب الشهرة بما يطابق مستواك ومرحلتك وفرعك.',
      dashboardTitle:'مدرسو المدرسة', dashboardText:'طلاب المدارس يدرسون حسب المادة والمدرس بدلاً من التسجيل في الدورات.', selected:'تم اختيارهم', complete:'اكتمل اختيار المدرسين', continue:'متابعة اختيار المدرسين', change:'تغيير المدرسين',
      previous:'السابق', next:'التالي', finish:'إنهاء', step:'الخطوة', of:'من', mostPopular:'الأكثر شهرة', popular:'شائع', students:'طلاب اختاروا هذا المدرس', teacher:'مدرس', selectedTeacher:'مختار',
      noTeachers:'لم يتم نشر مدرسين مطابقين لمستواك ومرحلتك وفرعك حتى الآن.', loading:'جارٍ تحميل المدرسين…', error:'تعذر تحميل دليل المدرسين.', retry:'إعادة المحاولة', saving:'جارٍ الحفظ…',
      arabic:'العربي', english:'الإنكليزي', math:'الرياضيات', chemistry:'الكيمياء', physics:'الفيزياء', biology:'الأحياء', islamic_book:'الكتاب الإسلامي'
    }
  };

  const language = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const t = key => copy[language()][key] || copy.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const route = () => location.hash.replace(/^#\/?/, '').split('/')[0] || 'landing';
  const isSchoolStudent = () => window.DafatiiAuth?.user?.accountType === 'student' && window.DafatiiAuth?.user?.studentStage === 'school';
  const teacherFor = item => item?.teachers?.find(teacher => teacher.id === item.selectedTeacherId) || null;

  function subjectName(subject) { return t(subject); }
  function avatar(name) { return esc(String(name || 'T').trim().slice(0,1).toUpperCase() || 'T'); }

  async function loadCatalog(force = false) {
    if (!isSchoolStudent()) return null;
    if (catalog && !force) return catalog;
    if (loading && !force) return loading;
    loading = window.DafatiiApi.request('/school/teachers', { idempotent:true }).then(async result => {
      catalog = result;
      if (!SUBJECTS.includes(catalog?.subjects?.[currentStep]?.subject)) {
        const firstMissing = catalog?.subjects?.findIndex(item => !item.selectedTeacherId) ?? -1;
        currentStep = firstMissing >= 0 ? firstMissing : 0;
      }
      const userId = window.DafatiiAuth?.user?.id || '';
      if (userId && refreshedCoursesFor !== userId) {
        refreshedCoursesFor = userId;
        try { await window.DafatiiCourses?.refresh?.(); } catch {}
      }
      return catalog;
    }).finally(() => { loading = null; schedule(); });
    return loading;
  }

  function renameCourseNavigation() {
    const label = t('teachers');
    document.querySelectorAll('[data-pre-course-route="change-course"]').forEach(button => {
      button.dataset.schoolTeacherRoute = 'true';
      const icon = window.DafatiiIcons?.icon?.('subjects') || '';
      button.innerHTML = `${icon}<span>${esc(label)}</span>`;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    });
    document.querySelectorAll('.quiet-course-button').forEach(button => { button.hidden = true; });
  }

  function loadingMarkup() {
    return `<section class="school-teacher-page" data-school-teacher-view><div class="school-teacher-loading"><span class="school-teacher-spinner"></span><strong>${esc(t('loading'))}</strong></div></section>`;
  }

  function errorMarkup(message) {
    return `<section class="school-teacher-page" data-school-teacher-view><div class="school-teacher-empty"><strong>${esc(t('error'))}</strong><p>${esc(message || '')}</p><button class="btn btn-primary" type="button" data-school-retry>${esc(t('retry'))}</button></div></section>`;
  }

  function dashboardMarkup() {
    const selected = Number(catalog?.selectedCount || 0);
    const complete = Boolean(catalog?.complete);
    const rows = (catalog?.subjects || []).map(item => {
      const teacher = teacherFor(item);
      return `<article class="school-teacher-summary-card ${teacher ? 'selected' : ''}"><span class="school-subject-dot"></span><div><small>${esc(subjectName(item.subject))}</small><strong>${esc(teacher?.displayName || '—')}</strong></div>${teacher ? `<span class="school-selected-check">✓</span>` : ''}</article>`;
    }).join('');
    return `<section class="school-teacher-page school-teacher-dashboard" data-school-teacher-view>
      <header class="school-teacher-hero"><div><div class="eyebrow">${esc(t('teachers'))}</div><h1>${esc(t('dashboardTitle'))}</h1><p>${esc(t('dashboardText'))}</p></div><div class="school-teacher-score"><strong>${selected}/7</strong><span>${esc(t('selected'))}</span></div></header>
      <div class="school-teacher-progress"><span style="--school-progress:${Math.round(selected / 7 * 100)}%"></span></div>
      <div class="school-teacher-summary-grid">${rows}</div>
      <div class="school-teacher-dashboard-actions"><button class="btn btn-primary" type="button" data-open-teachers>${esc(complete ? t('change') : t('continue'))} →</button>${complete ? `<strong class="school-teacher-complete">✓ ${esc(t('complete'))}</strong>` : ''}</div>
    </section>`;
  }

  function teacherMeta(teacher, index) {
    if (index === 0) return t('mostPopular');
    if (Number(teacher.selectionCount || 0) > 0) return `${teacher.selectionCount} ${t('students')}`;
    if (Number(teacher.fameScore || 0) > 0) return t('popular');
    return teacher.institution || t('teacher');
  }

  function pickerMarkup() {
    const item = catalog?.subjects?.[currentStep];
    if (!item) return errorMarkup('');
    const selectedId = item.selectedTeacherId || '';
    const teachers = item.teachers || [];
    const cards = teachers.length ? teachers.map((teacher,index) => `<button class="school-teacher-card ${teacher.id === selectedId ? 'selected' : ''}" type="button" data-teacher-id="${esc(teacher.id)}" ${saving ? 'disabled' : ''}>
      <span class="school-teacher-rank">${index + 1}</span><span class="school-teacher-avatar">${avatar(teacher.displayName)}</span><span class="school-teacher-card-copy"><strong>${esc(teacher.displayName)}</strong><small>${esc(teacherMeta(teacher,index))}</small></span>${teacher.id === selectedId ? `<span class="school-selected-check">✓</span>` : ''}
    </button>`).join('') : `<div class="school-teacher-empty compact"><strong>${esc(subjectName(item.subject))}</strong><p>${esc(t('noTeachers'))}</p></div>`;
    const dots = (catalog?.subjects || []).map((subject,index) => `<button type="button" class="school-step-dot ${index === currentStep ? 'active' : subject.selectedTeacherId ? 'done' : ''}" data-school-step="${index}" aria-label="${esc(subjectName(subject.subject))}"><span>${index + 1}</span></button>`).join('');
    const isLast = currentStep === (catalog.subjects.length - 1);
    return `<section class="school-teacher-page" data-school-teacher-view>
      <header class="school-teacher-picker-head"><div><div class="eyebrow">${esc(t('step'))} ${currentStep + 1} ${esc(t('of'))} 7</div><h1>${esc(subjectName(item.subject))}</h1><p>${esc(t('subtitle'))}</p></div><strong class="school-step-count">${currentStep + 1}/7</strong></header>
      <div class="school-stepper" aria-label="${esc(t('title'))}">${dots}</div>
      <div class="school-teacher-list">${cards}</div>
      <footer class="school-teacher-actions"><button class="btn btn-ghost" type="button" data-school-previous ${currentStep === 0 ? 'disabled' : ''}>← ${esc(t('previous'))}</button><button class="btn btn-primary" type="button" data-school-next ${!selectedId || saving ? 'disabled' : ''}>${esc(saving ? t('saving') : isLast ? t('finish') : t('next'))}${saving ? '' : ' →'}</button></footer>
    </section>`;
  }

  function bindCommon(main) {
    main.querySelector('[data-school-retry]')?.addEventListener('click', async () => { catalog = null; renderCurrent(true); });
    main.querySelector('[data-open-teachers]')?.addEventListener('click', () => { location.hash = 'change-course'; });
  }

  function bindPicker(main) {
    main.querySelectorAll('[data-school-step]').forEach(button => button.addEventListener('click', () => { currentStep = Number(button.dataset.schoolStep) || 0; renderCurrent(); }));
    main.querySelector('[data-school-previous]')?.addEventListener('click', () => { currentStep = Math.max(0, currentStep - 1); renderCurrent(); });
    main.querySelector('[data-school-next]')?.addEventListener('click', () => {
      if (!catalog?.subjects?.[currentStep]?.selectedTeacherId) return;
      if (currentStep >= catalog.subjects.length - 1) { location.hash = 'dashboard'; return; }
      currentStep += 1; renderCurrent();
    });
    main.querySelectorAll('[data-teacher-id]').forEach(button => button.addEventListener('click', async () => {
      if (saving) return;
      const item = catalog?.subjects?.[currentStep];
      if (!item) return;
      saving = true; renderCurrent();
      try {
        catalog = await window.DafatiiApi.request(`/school/teachers/${encodeURIComponent(item.subject)}`, { method:'PUT', body:{ teacherId:button.dataset.teacherId } });
      } catch (error) {
        const root = document.querySelector('.workspace-main');
        if (root) root.innerHTML = errorMarkup(error.message || t('error'));
      } finally {
        saving = false; renderCurrent();
      }
    }));
  }

  async function renderCurrent(force = false) {
    if (!isSchoolStudent()) return;
    const currentRoute = route();
    if (!ALLOWED_ROUTES.has(currentRoute)) { location.hash = 'dashboard'; return; }
    renameCourseNavigation();
    if (!['dashboard','change-course'].includes(currentRoute)) return;
    const main = document.querySelector('.workspace-main');
    if (!main) return;
    if (!catalog || force) {
      main.innerHTML = loadingMarkup();
      try { await loadCatalog(force); }
      catch (error) { if (document.querySelector('.workspace-main') === main) { main.innerHTML = errorMarkup(error.message || t('error')); bindCommon(main); } return; }
      if (route() !== currentRoute) return;
    }
    main.innerHTML = currentRoute === 'change-course' ? pickerMarkup() : dashboardMarkup();
    bindCommon(main);
    if (currentRoute === 'change-course') bindPicker(main);
  }

  function enhance() {
    scheduled = false;
    const school = isSchoolStudent();
    document.documentElement.toggleAttribute('data-school-student', school);
    if (!school) { catalog = null; return; }
    renameCourseNavigation();
    void renderCurrent();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(enhance);
  }

  new MutationObserver(schedule).observe(document.getElementById('app') || document.documentElement, { childList:true, subtree:true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('dafatii:auth:changed', () => { catalog = null; refreshedCoursesFor = ''; schedule(); });
  window.addEventListener('dafatii:coursesloaded', schedule);
  window.addEventListener('dafatii:datahydrated', schedule);
  schedule();
})();
