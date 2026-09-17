(() => {
  'use strict';

  if (window.__dafatiiPremiumWorkspaceInstalled) return;
  window.__dafatiiPremiumWorkspaceInstalled = true;

  const STUDY_LABELS = Object.freeze({
    chapters:['Chapter','Chapters','فصل','فصول'],
    systems:['System','Systems','نظام','أنظمة'],
    blocks:['Block','Blocks','بلوك','بلوكات'],
    courses:['Course','Courses','كورس','كورسات']
  });

  const arabic = () => document.documentElement.lang === 'ar';
  const text = (en, ar) => arabic() ? ar : en;
  const studyLabel = (type, count = 2) => {
    const item = STUDY_LABELS[type] || STUDY_LABELS.courses;
    return arabic() ? item[count === 1 ? 2 : 3] : item[count === 1 ? 0 : 1];
  };
  const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

  function activeSubject() {
    if (typeof state === 'undefined') return null;
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    if (parts[0] !== 'subjects' || parts[1] !== 'subject') return null;
    const id = decodeURIComponent(parts[2] || '');
    return state.subjects.find(subject => subject.id === id) || null;
  }

  function enhanceSubjectCards() {
    if (typeof state === 'undefined') return;
    document.querySelectorAll('.subject-swipe[data-subject-id]').forEach(wrapper => {
      if (wrapper.classList.contains('lecture-swipe')) return;
      const subject = state.subjects.find(item => item.id === wrapper.dataset.subjectId);
      const card = wrapper.querySelector('.subject-card');
      if (!subject || !card) return;
      card.classList.add('premium-subject-card');
      if (card.querySelector('.premium-subject-meta')) return;

      const lectureCount = Array.isArray(state.lectures?.[subject.id]) ? state.lectures[subject.id].length : 0;
      const unitCount = Array.isArray(subject.studyUnits) ? subject.studyUnits.length : 0;
      const type = subject.studyType || window.DafatiiCourses?.active?.()?.studyType || 'courses';
      const meta = document.createElement('div');
      meta.className = 'premium-subject-meta';
      meta.innerHTML = `<span>${arabic() ? `${lectureCount} محاضرة` : plural(lectureCount,'lecture','lectures')}</span>${unitCount ? `<span>${unitCount} ${studyLabel(type,unitCount)}</span>` : ''}<b aria-hidden="true">→</b>`;
      card.querySelector('.subject-card-copy')?.append(meta);
    });
  }

  function enhanceSubjectPage() {
    const subject = activeSubject();
    const page = document.querySelector('.lectures-page');
    if (!subject || !page) return;
    page.classList.add('premium-subject-detail');

    const head = page.querySelector('.subjects-head');
    if (head && !head.dataset.premiumSubjectHead) {
      head.dataset.premiumSubjectHead = 'true';
      head.classList.add('subject-page-hero');
      const iconBox = document.createElement('div');
      iconBox.className = 'subject-page-icon';
      iconBox.textContent = subject.icon || '•';
      head.prepend(iconBox);

      const copyHost = [...head.children].find(child => child !== iconBox && child.tagName === 'DIV');
      const eyebrow = copyHost?.querySelector('.eyebrow');
      const heading = copyHost?.querySelector('h1');
      if (eyebrow) eyebrow.textContent = text('Subject workspace · Lectures','مساحة المادة · المحاضرات');
      if (heading) heading.textContent = subject.name;

      const lectureCount = Array.isArray(state.lectures?.[subject.id]) ? state.lectures[subject.id].length : 0;
      const unitCount = Array.isArray(subject.studyUnits) ? subject.studyUnits.length : 0;
      const type = subject.studyType || window.DafatiiCourses?.active?.()?.studyType || 'courses';
      const summary = document.createElement('div');
      summary.className = 'subject-page-summary';
      summary.innerHTML = `<span>${arabic() ? `${lectureCount} محاضرة` : plural(lectureCount,'lecture','lectures')}</span>${unitCount ? `<span>${unitCount} ${studyLabel(type,unitCount)}</span>` : ''}`;
      copyHost?.append(summary);
    }

    page.querySelectorAll('.lecture-card').forEach(card => card.classList.add('premium-lecture-card'));
    page.querySelector('.study-unit-detail-bar')?.classList.add('premium-study-unit-bar');
  }

  function wrapAdminFields() {
    const labels = {
      accountType:text('Account type','نوع الحساب'),
      studentStage:text('Study stage','المرحلة الدراسية'),
      platformRole:text('Platform role','دور المنصة'),
      status:text('Status','الحالة')
    };
    document.querySelectorAll('.admin-user').forEach(form => {
      form.classList.add('premium-admin-user');
      [...form.querySelectorAll(':scope > select')].forEach(select => {
        if (select.closest('.premium-select-field')) return;
        const label = document.createElement('label');
        label.className = 'premium-select-field';
        const caption = document.createElement('span');
        caption.textContent = labels[select.name] || select.name;
        select.before(label);
        label.append(caption, select);
      });
    });
  }

  function addRepresenterSummary(panel) {
    if (panel.querySelector('.premium-management-summary')) return;
    const course = window.DafatiiCourses?.active?.();
    const hero = panel.querySelector('.suite-head');
    if (!course?.id || !hero) return;
    const studyType = course.studyType || 'courses';
    const summary = document.createElement('div');
    summary.className = 'premium-management-summary';
    summary.innerHTML = `
      <article><span>${text('Members','الأعضاء')}</span><strong>${Number(course.memberCount || 0)}</strong></article>
      <article><span>${text('Pending','قيد الانتظار')}</span><strong>${Number(course.applicationCount || 0)}</strong></article>
      <article><span>${text('Study type','نوع الدراسة')}</span><strong>${studyLabel(studyType,2)}</strong></article>
      <article><span>${text('Your role','دورك')}</span><strong>${String(course.membership?.role || 'owner')}</strong></article>`;
    hero.insertAdjacentElement('afterend',summary);
  }

  function enhanceRolePanel() {
    const panel = document.querySelector('.role-panel');
    if (!panel) return;
    panel.classList.add('premium-role-panel');
    panel.querySelector('.suite-head')?.classList.add('premium-panel-hero');
    panel.querySelectorAll('.panel-card').forEach(card => card.classList.add('premium-panel-card'));
    panel.querySelectorAll('.member-row').forEach(row => row.classList.add('premium-member-row'));
    panel.querySelectorAll('.admin-row').forEach(row => row.classList.add('premium-admin-row'));

    if (location.hash.replace(/^#\/?/, '').split('/')[0] === 'representer') addRepresenterSummary(panel);
    if (location.hash.replace(/^#\/?/, '').split('/')[0] === 'admin') {
      panel.querySelector('.admin-stats')?.classList.add('premium-management-summary','premium-admin-summary');
      wrapAdminFields();
    }
  }

  function enhance() {
    enhanceSubjectCards();
    enhanceSubjectPage();
    enhanceRolePanel();
  }

  if (typeof workspace === 'function') {
    const previousWorkspace = workspace;
    workspace = function premiumWorkspace(current) {
      previousWorkspace(current);
      queueMicrotask(enhance);
    };
  }

  window.addEventListener('dafatii:datahydrated',() => queueMicrotask(enhance));
  window.addEventListener('dafatii:coursechanged',() => queueMicrotask(enhance));
  window.addEventListener('dafatii:coursesloaded',() => queueMicrotask(enhance));
  window.addEventListener('hashchange',() => queueMicrotask(enhance));
  queueMicrotask(enhance);
})();
