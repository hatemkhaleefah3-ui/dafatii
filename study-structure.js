(() => {
  'use strict';

  const PROFILE_KEY = 'dafatii:studentProfile:v2';
  const STUDY_TYPES = Object.freeze({
    chapters:{singular:'Chapter',plural:'Chapters',arSingular:'الفصل',arPlural:'الفصول'},
    systems:{singular:'System',plural:'Systems',arSingular:'النظام',arPlural:'الأنظمة'},
    blocks:{singular:'Block',plural:'Blocks',arSingular:'البلوك',arPlural:'البلوكات'},
    courses:{singular:'Course',plural:'Courses',arSingular:'الكورس',arPlural:'الكورسات'}
  });
  const SCHOOL_LEVELS = new Set(['primary_school','middle_school','preparatory_school']);
  let higherStudyType = '';
  let attachedAuthForm = null;
  let authFormObserver = null;
  let workspacePatched = false;

  const isArabic = () => document.documentElement.lang === 'ar';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const readProfile = () => window.DafatiiData?.readJSON?.(PROFILE_KEY, null) || (() => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; } })();
  const copy = (en, ar) => isArabic() ? ar : en;
  const typeInfo = type => STUDY_TYPES[type] || STUDY_TYPES.courses;
  const typeSingular = type => isArabic() ? typeInfo(type).arSingular : typeInfo(type).singular;
  const typePlural = type => isArabic() ? typeInfo(type).arPlural : typeInfo(type).plural;
  const defaultUnitName = (type, index = 1) => `${typeSingular(type)} ${index}`;

  function effectiveStudyType() {
    const profile = readProfile() || {};
    const user = window.DafatiiAuth?.user || {};
    if (user.studentStage === 'school' || SCHOOL_LEVELS.has(profile.academicLevel)) return 'chapters';
    return STUDY_TYPES[profile.studyType] ? profile.studyType : 'courses';
  }

  function studyTypeField(levelValue) {
    const school = SCHOOL_LEVELS.has(levelValue);
    const label = copy('Type of study','نوع الدراسة');
    const hint = copy('This controls how every subject is divided and keeps each unit’s content separate.','يحدد هذا الخيار طريقة تقسيم كل مادة، ويحتفظ بمحتوى كل وحدة بشكل مستقل.');
    if (school) {
      return `<div class="field student-flow-field study-type-field" data-study-type-field><label>${esc(label)}</label><div class="study-type-locked"><strong>${esc(copy('Chapters','الفصول'))}</strong><span>${esc(copy('School study is organized by chapters.','الدراسة المدرسية منظمة تلقائياً حسب الفصول.'))}</span></div><input type="hidden" name="studyType" value="chapters"></div>`;
    }
    const selected = STUDY_TYPES[higherStudyType] ? higherStudyType : '';
    const options = [
      `<option value=""${selected ? '' : ' selected'} disabled>${esc(copy('Select study type','اختر نوع الدراسة'))}</option>`,
      ...Object.keys(STUDY_TYPES).map(type => `<option value="${type}"${selected === type ? ' selected' : ''}>${esc(typePlural(type))}</option>`)
    ].join('');
    return `<div class="field student-flow-field study-type-field" data-study-type-field><label>${esc(label)}</label><select name="studyType" required>${options}</select><p class="student-flow-hint">${esc(hint)}</p></div>`;
  }

  function injectStudyTypeField() {
    const form = document.getElementById('auth-form');
    if (!form) return;
    const level = form.elements?.academicLevel;
    if (!level) {
      form.querySelector('[data-study-type-field]')?.remove();
      return;
    }
    const step = form.querySelector('.student-flow-step');
    if (!step) return;
    const current = form.querySelector('[data-study-type-field]');
    const levelValue = String(level.value || '');
    const shouldBeSchool = SCHOOL_LEVELS.has(levelValue);
    const currentSchool = current?.querySelector('input[name="studyType"]')?.value === 'chapters';
    if (!current || currentSchool !== shouldBeSchool) {
      current?.remove();
      step.insertAdjacentHTML('beforeend', studyTypeField(levelValue));
    }
    const select = form.querySelector('select[name="studyType"]');
    if (select && !select.dataset.studyTypeBound) {
      select.dataset.studyTypeBound = 'true';
      select.addEventListener('change', () => { if (STUDY_TYPES[select.value]) higherStudyType = select.value; });
    }
    if (!level.dataset.studyTypeBound) {
      level.dataset.studyTypeBound = 'true';
      level.addEventListener('change', () => queueMicrotask(() => {
        form.querySelector('[data-study-type-field]')?.remove();
        injectStudyTypeField();
      }));
    }
  }

  function attachSignupForm() {
    const form = document.getElementById('auth-form');
    if (form === attachedAuthForm) {
      injectStudyTypeField();
      return;
    }
    authFormObserver?.disconnect();
    authFormObserver = null;
    attachedAuthForm = form || null;
    if (!form) return;
    authFormObserver = new MutationObserver(() => queueMicrotask(injectStudyTypeField));
    authFormObserver.observe(form,{childList:true});
    injectStudyTypeField();
  }

  const appRoot = document.getElementById('app');
  if (appRoot) new MutationObserver(attachSignupForm).observe(appRoot,{childList:true});
  window.addEventListener('hashchange', attachSignupForm);
  attachSignupForm();

  function patchWorkspace() {
    if (workspacePatched) return;
    if (typeof state === 'undefined' || typeof subjectCard !== 'function' || typeof openSubjectSheet !== 'function') return;
    workspacePatched = true;

    const originalSubjectCard = subjectCard;
    const originalBindSubjects = bindSubjects;
    const originalLectureListView = lectureListView;
    const originalBindLectures = bindLectures;

    function normalizedUnits(subject, type = subject?.studyType || effectiveStudyType()) {
      const source = Array.isArray(subject?.studyUnits) ? subject.studyUnits : [];
      const units = source
        .filter(unit => unit && typeof unit === 'object')
        .map((unit,index) => ({ id:String(unit.id || makeId('unit')), name:String(unit.name || defaultUnitName(type,index+1)).trim().slice(0,80) || defaultUnitName(type,index+1) }));
      return units.length ? units : [{id:makeId('unit'),name:defaultUnitName(type,1)}];
    }

    function normalizeSubject(subject) {
      if (!subject) return false;
      let changed = false;
      const type = STUDY_TYPES[subject.studyType] ? subject.studyType : effectiveStudyType();
      if (subject.studyType !== type) { subject.studyType = type; changed = true; }
      const units = normalizedUnits(subject,type);
      const oldSerialized = JSON.stringify(subject.studyUnits || []);
      const newSerialized = JSON.stringify(units);
      if (oldSerialized !== newSerialized) { subject.studyUnits = units; changed = true; }
      const validIds = new Set(units.map(unit => unit.id));
      if (!validIds.has(subject.activeStudyUnitId)) { subject.activeStudyUnitId = units[0].id; changed = true; }
      const lectures = Array.isArray(state.lectures[subject.id]) ? state.lectures[subject.id] : [];
      for (const lecture of lectures) {
        if (!validIds.has(lecture.studyUnitId)) { lecture.studyUnitId = subject.activeStudyUnitId; changed = true; }
      }
      return changed;
    }

    function migrateStudyStructure() {
      let subjectChanged = false;
      let lectureChanged = false;
      for (const subject of state.subjects) {
        const beforeLectures = JSON.stringify(state.lectures[subject.id] || []);
        if (normalizeSubject(subject)) subjectChanged = true;
        if (beforeLectures !== JSON.stringify(state.lectures[subject.id] || [])) lectureChanged = true;
      }
      if (subjectChanged) saveSubjects();
      if (lectureChanged) saveLectures();
    }

    function activeUnit(subject) {
      normalizeSubject(subject);
      return subject.studyUnits.find(unit => unit.id === subject.activeStudyUnitId) || subject.studyUnits[0];
    }

    function unitOptions(subject) {
      const active = activeUnit(subject);
      return subject.studyUnits.map(unit => `<option value="${esc(unit.id)}"${unit.id === active.id ? ' selected' : ''}>${esc(unit.name)}</option>`).join('');
    }

    function unitCardControl(subject) {
      normalizeSubject(subject);
      const type = subject.studyType;
      return `<label class="study-unit-card-switcher" data-study-unit-control data-subject-id="${esc(subject.id)}"><span>${esc(typeSingular(type))}</span><select data-study-unit-select data-subject-id="${esc(subject.id)}" aria-label="${esc(copy(`Select ${typeSingular(type).toLowerCase()}`,`اختر ${typeSingular(type)}`))}">${unitOptions(subject)}</select></label>`;
    }

    function unitDetailControl(subject) {
      normalizeSubject(subject);
      const type = subject.studyType;
      return `<div class="study-unit-detail-bar"><div><small>${esc(copy('Study content','محتوى الدراسة'))}</small><strong>${esc(typePlural(type))}</strong></div><label><span>${esc(typeSingular(type))}</span><select data-study-unit-detail-select data-subject-id="${esc(subject.id)}">${unitOptions(subject)}</select></label></div>`;
    }

    function switchUnit(subjectId, unitId) {
      const subject = state.subjects.find(item => item.id === subjectId);
      if (!subject) return;
      normalizeSubject(subject);
      if (!subject.studyUnits.some(unit => unit.id === unitId)) return;
      subject.activeStudyUnitId = unitId;
      saveSubjects();
      render();
    }

    subjectLectures = function(subjectId) {
      const subject = state.subjects.find(item => item.id === subjectId);
      if (!subject) return [];
      const unit = activeUnit(subject);
      const lectures = Array.isArray(state.lectures[subjectId]) ? state.lectures[subjectId] : [];
      return lectures.filter(lecture => lecture.studyUnitId === unit.id);
    };

    subjectCard = function(subject) {
      normalizeSubject(subject);
      const base = originalSubjectCard(subject);
      return base.replace('<div class="subject-card-copy">', `${unitCardControl(subject)}<div class="subject-card-copy">`);
    };

    bindSubjects = function() {
      originalBindSubjects();
      document.querySelectorAll('[data-study-unit-select]').forEach(select => {
        ['pointerdown','click','keydown'].forEach(name => select.addEventListener(name,event => event.stopPropagation()));
        select.addEventListener('change', event => {
          event.stopPropagation();
          switchUnit(select.dataset.subjectId, select.value);
        });
      });
    };

    lectureListView = function(subject) {
      normalizeSubject(subject);
      const base = originalLectureListView(subject);
      return base.replace('<div class="subjects-grid">', `${unitDetailControl(subject)}<div class="subjects-grid">`);
    };

    bindLectures = function(subject) {
      originalBindLectures(subject);
      document.querySelector('[data-study-unit-detail-select]')?.addEventListener('change', event => {
        switchUnit(event.currentTarget.dataset.subjectId, event.currentTarget.value);
      });
    };

    openLectureSheet = function(subject, lectureId = '') {
      normalizeSubject(subject);
      const unit = activeUnit(subject);
      const lectures = Array.isArray(state.lectures[subject.id]) ? state.lectures[subject.id] : [];
      const lecture = lectures.find(item => item.id === lectureId && item.studyUnitId === unit.id);
      openEntitySheet({
        title:lecture ? 'Edit lecture' : 'Add lecture',
        name:lecture?.name || '',
        icon:lecture?.icon || LECTURE_ICONS[0],
        icons:LECTURE_ICONS,
        link:lecture?.link || '',
        showLink:true,
        submitLabel:lecture ? 'Save changes' : 'Add lecture',
        onSubmit:({name,icon,link}) => {
          if (lecture) { lecture.name = name; lecture.icon = icon; lecture.link = link; lecture.studyUnitId = unit.id; }
          else lectures.push({id:makeId('lecture'),name,icon,link,studyUnitId:unit.id});
          state.lectures[subject.id] = lectures;
          saveLectures(); closeEntitySheet(); render();
        }
      });
    };

    deleteLecture = function(subject,id) {
      normalizeSubject(subject);
      const lectures = Array.isArray(state.lectures[subject.id]) ? state.lectures[subject.id] : [];
      const index = lectures.findIndex(item => item.id === id);
      if (index < 0) return;
      const removed = lectures[index];
      lectures.splice(index,1);
      state.lectures[subject.id] = lectures;
      saveLectures(); render();
      showToast(`${removed.name} deleted`, 'Undo', () => {
        const current = Array.isArray(state.lectures[subject.id]) ? state.lectures[subject.id] : [];
        current.splice(Math.min(index,current.length),0,removed);
        state.lectures[subject.id] = current;
        saveLectures(); render();
      });
    };

    openSubjectSheet = function(subjectId = '') {
      const subject = state.subjects.find(item => item.id === subjectId);
      if (subject) normalizeSubject(subject);
      const type = subject?.studyType || effectiveStudyType();
      let draftUnits = subject ? subject.studyUnits.map(unit => ({...unit})) : [{id:makeId('unit'),name:defaultUnitName(type,1)}];
      const root = document.getElementById('overlay-root');
      if (!root) return;
      const title = subject ? copy('Edit subject','تعديل المادة') : copy('Add subject','إضافة مادة');
      const submitLabel = subject ? copy('Save changes','حفظ التغييرات') : copy('Add subject','إضافة المادة');
      const currentIcon = subject?.icon || SUBJECT_ICONS[0];
      root.innerHTML = `<div class="entity-sheet-overlay" id="entity-sheet-overlay"><section class="entity-sheet study-subject-sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(copy('Subject','المادة'))}</div><h2>${esc(title)}</h2></div><button class="icon-btn" id="entity-sheet-close" aria-label="${esc(copy('Close','إغلاق'))}">${icon('close')}</button></div><form id="entity-form"><div class="field"><label>${esc(copy('Name','الاسم'))}</label><input id="entity-name" maxlength="80" value="${esc(subject?.name || '')}" required></div><div class="study-unit-editor"><div class="study-unit-type-lock"><span>${esc(copy('Study structure','هيكل الدراسة'))}</span><strong>${esc(typePlural(type))}</strong></div><p>${esc(copy(`Each ${typeSingular(type).toLowerCase()} keeps its own lectures and subject content.`,`كل ${typeSingular(type)} يحتفظ بمحاضراته ومحتواه بشكل مستقل.`))}</p><div class="study-unit-rows" id="study-unit-rows"></div><button type="button" class="btn btn-ghost study-unit-add" id="study-unit-add">+ ${esc(copy(`Add ${typeSingular(type)}`,`إضافة ${typeSingular(type)}`))}</button><p class="study-unit-error" id="study-unit-error" role="alert"></p></div><div class="entity-icon-label">${esc(copy('Choose icon','اختر الأيقونة'))}</div><div class="entity-icon-grid">${SUBJECT_ICONS.map(value => `<button type="button" class="entity-icon-choice ${value === currentIcon ? 'active' : ''}" data-icon="${esc(value)}">${esc(value)}</button>`).join('')}</div><button class="btn btn-primary entity-submit" type="submit">${esc(submitLabel)}</button></form></section></div>`;

      let selectedIcon = currentIcon;
      const form = document.getElementById('entity-form');
      const rows = document.getElementById('study-unit-rows');
      const error = document.getElementById('study-unit-error');
      const syncDraftNames = () => rows?.querySelectorAll('[data-study-unit-name]').forEach(input => {
        const unit = draftUnits.find(item => item.id === input.dataset.unitId);
        if (unit) unit.name = input.value;
      });
      const renderRows = () => {
        rows.innerHTML = draftUnits.map((unit,index) => `<div class="study-unit-row"><span>${index+1}</span><input data-study-unit-name data-unit-id="${esc(unit.id)}" maxlength="80" value="${esc(unit.name)}" aria-label="${esc(`${typeSingular(type)} ${index+1}`)}" required><button type="button" data-remove-study-unit="${esc(unit.id)}" aria-label="${esc(copy('Remove','حذف'))}" ${draftUnits.length === 1 ? 'disabled' : ''}>${icon('trash')}</button></div>`).join('');
        rows.querySelectorAll('[data-remove-study-unit]').forEach(button => button.addEventListener('click', () => {
          syncDraftNames();
          draftUnits = draftUnits.filter(unit => unit.id !== button.dataset.removeStudyUnit);
          renderRows();
        }));
      };
      renderRows();
      document.getElementById('study-unit-add').onclick = () => {
        syncDraftNames();
        draftUnits.push({id:makeId('unit'),name:defaultUnitName(type,draftUnits.length+1)});
        renderRows();
        rows.lastElementChild?.querySelector('input')?.focus();
      };
      document.getElementById('entity-sheet-close').onclick = closeEntitySheet;
      document.getElementById('entity-sheet-overlay').addEventListener('click', event => { if (event.target.id === 'entity-sheet-overlay') closeEntitySheet(); });
      document.querySelectorAll('.entity-icon-choice').forEach(button => button.onclick = () => {
        selectedIcon = button.dataset.icon;
        document.querySelectorAll('.entity-icon-choice').forEach(item => item.classList.toggle('active',item === button));
      });
      form.onsubmit = event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        syncDraftNames();
        const cleaned = draftUnits.map(unit => ({id:unit.id,name:String(unit.name || '').trim()})).filter(unit => unit.name);
        if (!cleaned.length) { error.textContent = copy('Add at least one study unit.','أضف وحدة دراسية واحدة على الأقل.'); return; }
        const unique = new Set(cleaned.map(unit => unit.name.toLocaleLowerCase()));
        if (unique.size !== cleaned.length) { error.textContent = copy('Unit names must be unique inside a subject.','يجب أن تكون أسماء الوحدات مختلفة داخل المادة.'); return; }
        const name = document.getElementById('entity-name').value.trim();
        if (!name) return;
        const validIds = new Set(cleaned.map(unit => unit.id));
        const firstId = cleaned[0].id;
        if (subject) {
          subject.name = name;
          subject.icon = selectedIcon;
          subject.studyType = type;
          subject.studyUnits = cleaned;
          if (!validIds.has(subject.activeStudyUnitId)) subject.activeStudyUnitId = firstId;
          const lectures = Array.isArray(state.lectures[subject.id]) ? state.lectures[subject.id] : [];
          lectures.forEach(lecture => { if (!validIds.has(lecture.studyUnitId)) lecture.studyUnitId = firstId; });
          state.lectures[subject.id] = lectures;
          saveLectures();
        } else {
          state.subjects.push({id:makeId('subject'),name,icon:selectedIcon,studyType:type,studyUnits:cleaned,activeStudyUnitId:firstId});
        }
        saveSubjects(); closeEntitySheet(); render();
      };
      setTimeout(() => document.getElementById('entity-name')?.focus(),60);
    };

    migrateStudyStructure();
    window.addEventListener('dafatii:datahydrated',migrateStudyStructure);
    window.addEventListener('dafatii:coursechanged',() => queueMicrotask(migrateStudyStructure));
  }

  patchWorkspace();
  window.addEventListener('dafatii:datahydrated',patchWorkspace);
})();
