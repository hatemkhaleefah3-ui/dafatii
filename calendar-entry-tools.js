(() => {
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const EXAMS_KEY = 'dafatii:examSchedule';
  const SCHEDULE_NOTES_KEY = 'dafatii:scheduleNotes';
  const AXIS_KEYS = {
    schedule: { days:'dafatii:scheduleDays', periods:'dafatii:schedulePeriods' },
    exam: { days:'dafatii:examDays', periods:'dafatii:examPeriods' }
  };
  const DEFAULT_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_PERIODS = ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM'];

  const read = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => escapeHtml(value ?? '');
  const keyFor = kind => kind === 'schedule' ? SCHEDULE_KEY : EXAMS_KEY;
  const axisValues = (kind, type) => {
    const key = AXIS_KEYS[kind][type === 'day' ? 'days' : 'periods'];
    const fallback = type === 'day' ? DEFAULT_DAYS : DEFAULT_PERIODS;
    const value = read(key, fallback);
    return Array.isArray(value) && value.length ? value.map(String) : [...fallback];
  };
  const optionLabel = (value, type) => value || (type === 'day' ? '(unnamed column)' : '(unnamed row)');

  const previousWorkspace = workspace;
  workspace = function(current){
    previousWorkspace(current);
    const parts = current.split('/');
    if(parts[0] !== 'calendar') return;
    const sub = decodeURIComponent(parts.slice(1).join('/')).toLowerCase();
    const kind = (!sub || sub === 'schedule') ? 'schedule' : sub === 'exams' ? 'exam' : null;
    if(!kind) return;
    bindFilledEntrySheets(kind);
    if(kind === 'schedule') bindClearSchedule();
  };

  function bindFilledEntrySheets(kind){
    document.querySelectorAll(`.cal-cell.filled[data-kind="${kind}"][data-entry]`).forEach(cell => {
      if(cell.dataset.entrySheetBound) return;
      cell.dataset.entrySheetBound = '1';
      cell.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openEntrySheet(kind, cell.dataset.entry);
      }, true);
    });
  }

  function bindClearSchedule(){
    const toolbar = document.querySelector('.calendar-page .calendar-toolbar');
    if(!toolbar || document.getElementById('calendar-clear-schedule')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'calendar-clear-schedule';
    button.className = 'calendar-clear-button';
    button.textContent = 'Clear schedule';
    toolbar.appendChild(button);
    button.addEventListener('click', () => {
      const count = Array.isArray(read(SCHEDULE_KEY, [])) ? read(SCHEDULE_KEY, []).length : 0;
      const detail = count ? ` This will delete ${count} scheduled ${count === 1 ? 'item' : 'items'}.` : '';
      if(!confirm(`Clear the entire weekly schedule?${detail} The grid will reset to one unnamed column and one unnamed row.`)) return;
      write(SCHEDULE_KEY, []);
      write(SCHEDULE_NOTES_KEY, '');
      write(AXIS_KEYS.schedule.days, ['']);
      write(AXIS_KEYS.schedule.periods, ['']);
      render();
    });
  }

  function subjectOptions(selectedId){
    const subjects = Array.isArray(state?.subjects) ? state.subjects : [];
    return `<option value="" ${selectedId ? '' : 'selected'}>Unlinked subject</option>` + subjects.map(subject =>
      `<option value="${esc(subject.id)}" ${subject.id === selectedId ? 'selected' : ''}>${esc(subject.icon || '')} ${esc(subject.name)}</option>`
    ).join('');
  }

  function lectureChecks(subjectId, selectedIds){
    const selected = new Set(Array.isArray(selectedIds) ? selectedIds : []);
    const lectures = subjectId ? subjectLectures(subjectId) : [];
    if(!lectures.length) return '<div class="muted calendar-entry-empty">No lectures available for this subject.</div>';
    return lectures.map(lecture => `<label class="calendar-entry-check"><input type="checkbox" value="${esc(lecture.id)}" ${selected.has(lecture.id) ? 'checked' : ''}><span>${esc(lecture.icon || '▶')}</span><strong>${esc(lecture.name)}</strong></label>`).join('');
  }

  function lectureSummary(box){
    const selected = [...box.querySelectorAll('input:checked')];
    const summary = box.closest('details')?.querySelector('summary span');
    if(!summary) return;
    if(!selected.length) summary.textContent = 'Select lectures';
    else if(selected.length === 1) summary.textContent = selected[0].closest('label')?.querySelector('strong')?.textContent || '1 lecture';
    else summary.textContent = `${selected.length} lectures selected`;
  }

  function openEntrySheet(kind, entryId){
    const key = keyFor(kind);
    const entries = read(key, []);
    const item = Array.isArray(entries) ? entries.find(entry => entry.id === entryId) : null;
    const root = document.getElementById('overlay-root');
    if(!item || !root) return;

    const days = axisValues(kind, 'day');
    const periods = axisValues(kind, 'period');
    const isExam = kind === 'exam';
    const subjectId = item.subjectId || '';
    const dayOptions = days.map(value => `<option value="${esc(value)}" ${value === String(item.day ?? '') ? 'selected' : ''}>${esc(optionLabel(value, 'day'))}</option>`).join('');
    const timeOptions = periods.map(value => `<option value="${esc(value)}" ${value === String(item.time ?? '') ? 'selected' : ''}>${esc(optionLabel(value, 'period'))}</option>`).join('');

    root.innerHTML = `<div class="entity-sheet-overlay" id="calendar-entry-overlay">
      <section class="entity-sheet calendar-entry-sheet" role="dialog" aria-modal="true" aria-label="Edit ${isExam ? 'exam' : 'lecture'}">
        <div class="entity-sheet-handle"></div>
        <div class="entity-sheet-head"><div><div class="eyebrow">Calendar · ${isExam ? 'Exam' : 'Lecture'}</div><h2>Edit ${isExam ? 'exam' : 'lecture'}</h2></div><button class="icon-btn" id="calendar-entry-close">×</button></div>
        <form id="calendar-entry-form">
          <div class="field"><label>Subject</label><select id="calendar-entry-subject">${subjectOptions(subjectId)}</select></div>
          ${isExam ? '' : `<div class="field"><label>Lecture name</label><input id="calendar-entry-title" maxlength="120" required value="${esc(item.subject || '')}" placeholder="Lecture name"></div>`}
          ${isExam ? `<div class="field"><label>Lectures included in the exam</label><details class="calendar-entry-multiselect"><summary><span>Select lectures</span><b>⌄</b></summary><div id="calendar-entry-lectures" class="calendar-entry-checks">${lectureChecks(subjectId, item.lectureIds)}</div></details></div>` : ''}
          <div class="calendar-form-grid"><div class="field"><label>Day / column</label><select id="calendar-entry-day">${dayOptions}</select></div><div class="field"><label>Time / row</label><select id="calendar-entry-time">${timeOptions}</select></div></div>
          <div class="field"><label>Location / room</label><input id="calendar-entry-location" value="${esc(item.location || '')}" placeholder="Optional"></div>
          <div class="field"><label>Notes</label><textarea id="calendar-entry-notes" class="academic-notes" placeholder="Notes…">${esc(item.notes || '')}</textarea></div>
          ${isExam ? `<div class="field"><label>Degree</label><input id="calendar-entry-degree" type="number" step="any" min="0" value="${item.degree ?? ''}" placeholder="Optional"></div>` : ''}
          <div class="calendar-entry-actions"><button class="btn btn-danger" type="button" id="calendar-entry-delete">Delete</button><button class="btn btn-primary" type="submit">Save changes</button></div>
        </form>
      </section>
    </div>`;

    const close = () => { root.innerHTML = ''; };
    document.getElementById('calendar-entry-close').onclick = close;
    document.getElementById('calendar-entry-overlay').onclick = event => { if(event.target.id === 'calendar-entry-overlay') close(); };

    const subjectSelect = document.getElementById('calendar-entry-subject');
    const lecturesBox = document.getElementById('calendar-entry-lectures');
    if(lecturesBox){
      lectureSummary(lecturesBox);
      lecturesBox.addEventListener('change', () => lectureSummary(lecturesBox));
      subjectSelect.addEventListener('change', () => {
        lecturesBox.innerHTML = lectureChecks(subjectSelect.value, []);
        lectureSummary(lecturesBox);
      });
    }

    document.getElementById('calendar-entry-delete').onclick = () => {
      if(!confirm(`Delete this ${isExam ? 'exam' : 'lecture'} from the calendar?`)) return;
      write(key, entries.filter(entry => entry.id !== item.id));
      close();
      render();
    };

    document.getElementById('calendar-entry-form').onsubmit = event => {
      event.preventDefault();
      const nextDay = document.getElementById('calendar-entry-day').value;
      const nextTime = document.getElementById('calendar-entry-time').value;
      const collision = entries.some(entry => entry.id !== item.id && String(entry.day ?? '') === nextDay && String(entry.time ?? '') === nextTime);
      if(collision){ alert('Another item already occupies that row and column.'); return; }

      const nextSubjectId = subjectSelect.value;
      const linkedSubject = Array.isArray(state?.subjects) ? state.subjects.find(subject => subject.id === nextSubjectId) : null;
      const next = {
        ...item,
        day: nextDay,
        time: nextTime,
        location: document.getElementById('calendar-entry-location').value.trim(),
        notes: document.getElementById('calendar-entry-notes').value.trim()
      };

      if(nextSubjectId) next.subjectId = nextSubjectId;
      else delete next.subjectId;

      if(isExam){
        if(linkedSubject) next.subject = linkedSubject.name;
        next.lectureIds = [...document.querySelectorAll('#calendar-entry-lectures input:checked')].map(input => input.value);
        const degree = document.getElementById('calendar-entry-degree').value.trim();
        next.degree = degree === '' ? null : Number(degree);
      } else {
        next.subject = document.getElementById('calendar-entry-title').value.trim();
        if(!next.subject) return;
      }

      write(key, entries.map(entry => entry.id === item.id ? next : entry));
      close();
      render();
    };
  }
})();