(() => {
  'use strict';

  const STUDY_TYPES = Object.freeze([
    ['chapters','Chapters','الفصول'],
    ['systems','Systems','الأنظمة'],
    ['blocks','Blocks','البلوكات'],
    ['courses','Courses','الكورسات']
  ]);
  let scheduled = false;

  const isArabic = () => document.documentElement.lang === 'ar';
  const label = (en, ar) => isArabic() ? ar : en;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const options = selected => STUDY_TYPES.map(([value,en,ar]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${esc(label(en,ar))}</option>`).join('');

  function createField(selected = 'courses', wrapper = 'div') {
    const node = document.createElement(wrapper);
    node.className = wrapper === 'label' ? '' : 'field';
    node.dataset.courseStudyTypeField = '';
    node.innerHTML = `<${wrapper === 'label' ? 'span' : 'label'}>${esc(label('Study type','نوع الدراسة'))}</${wrapper === 'label' ? 'span' : 'label'}><select name="studyType" required>${options(selected)}</select>${wrapper === 'label' ? '' : `<p class="auth-note">${esc(label('Subjects in this course will be organized by the selected structure.','ستُنظّم مواد هذا الكورس حسب الهيكل الدراسي المحدد.'))}</p>`}`;
    return node;
  }

  function enhanceCreateForm() {
    const form = document.getElementById('course-form');
    if (!form || form.querySelector('[name="studyType"]')) return;
    const grid = form.querySelector('.suite-form-grid');
    if (!grid) return;
    const field = createField('courses');
    const stage = grid.querySelector('[name="stage"]')?.closest('.field');
    if (stage?.nextSibling) grid.insertBefore(field,stage.nextSibling);
    else grid.append(field);
  }

  function enhanceEditForm() {
    const form = document.getElementById('course-settings');
    if (!form || form.querySelector('[name="studyType"]')) return;
    const course = window.DafatiiCourses?.active?.() || {};
    const selected = STUDY_TYPES.some(([value]) => value === course.studyType) ? course.studyType : 'courses';
    const field = createField(selected,'label');
    const nameField = form.querySelector('input[name="name"]')?.closest('label');
    if (nameField?.nextSibling) form.insertBefore(field,nameField.nextSibling);
    else form.prepend(field);
  }

  function enhanceForms() {
    scheduled = false;
    enhanceCreateForm();
    enhanceEditForm();
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(enhanceForms);
  }

  const app = document.getElementById('app');
  if (app) {
    new MutationObserver(records => {
      const relevant = records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && (
        node.matches?.('#course-form,#course-settings,.course-sheet,.role-panel') ||
        node.querySelector?.('#course-form,#course-settings')
      )));
      if (relevant) scheduleEnhance();
    }).observe(app,{childList:true,subtree:true});
  }

  window.addEventListener('hashchange',scheduleEnhance);
  window.addEventListener('dafatii:coursesloaded',scheduleEnhance);
  window.addEventListener('dafatii:coursechanged',scheduleEnhance);
  document.addEventListener('click',event => {
    if (event.target.closest?.('#course-add,[data-extra="change-course"],#representer-panel-button')) setTimeout(enhanceForms,0);
  });
  scheduleEnhance();
})();