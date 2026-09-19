(() => {
  'use strict';

  const STUDY_TYPES = Object.freeze({
    chapters:{singular:'Chapter',plural:'Chapters',arSingular:'الفصل',arPlural:'الفصول'},
    systems:{singular:'System',plural:'Systems',arSingular:'النظام',arPlural:'الأنظمة'},
    blocks:{singular:'Block',plural:'Blocks',arSingular:'البلوك',arPlural:'البلوكات'},
    courses:{singular:'Course',plural:'Courses',arSingular:'الكورس',arPlural:'الكورسات'}
  });
  let workspacePatched = false;

  const isArabic = () => document.documentElement.lang === 'ar';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const copy = (en, ar) => isArabic() ? ar : en;
  const typeInfo = type => STUDY_TYPES[type] || STUDY_TYPES.courses;
  const typeSingular = type => isArabic() ? typeInfo(type).arSingular : typeInfo(type).singular;
  const typePlural = type => isArabic() ? typeInfo(type).arPlural : typeInfo(type).plural;
  const defaultUnitName = (type, index = 1) => `${typeSingular(type)} ${index}`;

  function effectiveStudyType() {
    const user = window.DafatiiAuth?.user || {};
    if (user.studentStage === 'school') return 'chapters';
    const activeCourse = window.DafatiiCourses?.active?.() || {};
    return STUDY_TYPES[activeCourse.studyType] ? activeCourse.studyType : 'courses';
  }

  function patchWorkspace() {
    if (workspacePatched) return;
    if (typeof state === 'undefined' || typeof subjectCard !== 'function' || typeof openSubjectSheet !== 'function') return;
    workspacePatched = true;

    const originalLectureListView = lectureListView;
    const originalBindLectures = bindLectures;

    function normalizedUnits(subject, type = effectiveStudyType()) {
      const source = Array.isArray(subject?.studyUnits) ? subject.studyUnits : [];
      const units = source
        .filter(unit => unit && typeof unit === 'object')
        .map((unit,index) => ({ id:String(unit.id || makeId('unit')), name:String(unit.name || defaultUnitName(type,index+1)).trim().slice(0,80) || defaultUnitName(type,index+1) }));
      return units.length ? units : [{id:makeId('unit'),name:defaultUnitName(type,1)}];
    }

    function normalizeSubject(subject) {
      if (!subject) return false;
      let changed = false;
      const type = effectiveStudyType();
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

    function unitDetailControl(subject) {
      normalizeSubject(subject);
      const type=subject.studyType;
      const active=activeUnit(subject);
      const singular=typeSingular(type);
      return `<section class="study-unit-detail-bar" aria-label="${esc(copy(`Select ${singular.toLowerCase()}`,`اختر ${singular}`))}"><div class="study-unit-detail-copy"><small>${esc(copy(`Current ${singular.toLowerCase()}`,`${singular} الحالي`))}</small><strong>${esc(active.name)}</strong></div><label class="study-unit-detail-picker"><span>${esc(copy(`Switch ${singular.toLowerCase()}`,`تغيير ${singular}`))}</span><select data-study-unit-detail-select data-subject-id="${esc(subject.id)}" aria-label="${esc(copy(`Switch ${singular.toLowerCase()}`,`تغيير ${singular}`))}">${unitOptions(subject)}</select></label></section>`;
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
      const type = effectiveStudyType();
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
    window.addEventListener('dafatii:coursesloaded',() => queueMicrotask(migrateStudyStructure));
    window.addEventListener('dafatii:coursechanged',() => queueMicrotask(migrateStudyStructure));
  }

  patchWorkspace();
  window.addEventListener('dafatii:datahydrated',patchWorkspace);
})();