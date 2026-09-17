(() => {
  'use strict';

  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const SCHEDULE_NOTES_KEY = 'dafatii:scheduleNotes';
  const DAYS_KEY = 'dafatii:scheduleDays';
  const PERIODS_KEY = 'dafatii:schedulePeriods';
  const DEFAULT_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_PERIODS = ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM'];

  const isArabic = () => typeof interfaceLanguage === 'function' ? interfaceLanguage() === 'ar' : document.documentElement.lang === 'ar';
  const t = (en, ar) => isArabic() ? ar : en;
  const read = (key, fallback) => window.DafatiiDafat.readJSON(key, fallback);
  const write = (key, value) => window.DafatiiDafat.writeJSON(key, value);
  const uid = () => `cal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  function canManageSchedule(){
    const user = window.DafatiiAuth?.user;
    const active = window.DafatiiDafat?.active?.() || {};
    return user?.platformRole === 'admin' || ['owner','representer'].includes(active.membership?.role);
  }

  function closeOverlay(){
    const root = document.getElementById('overlay-root');
    if(root) root.innerHTML = '';
  }

  function lockScheduleForStudent(page){
    page.classList.add('schedule-readonly-mode');
    page.querySelectorAll('#calendar-add,.cal-head-button,.cal-add-axis,.cal-cell').forEach(control => {
      control.disabled = true;
      control.setAttribute('aria-disabled', 'true');
    });
    const notes = page.querySelector('#schedule-notes');
    if(notes){
      notes.readOnly = true;
      notes.setAttribute('aria-readonly', 'true');
    }
  }

  function openManageSheet(){
    const root = document.getElementById('overlay-root');
    if(!root) return;
    root.innerHTML = `<div class="entity-sheet-overlay" id="schedule-manage-overlay"><section class="entity-sheet schedule-manage-sheet" role="dialog" aria-modal="true" aria-labelledby="schedule-manage-title"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${t('Schedule management','إدارة الجدول')}</div><h2 id="schedule-manage-title">${t('Edit weekly schedule','تعديل الجدول الأسبوعي')}</h2></div><button class="icon-btn" id="schedule-manage-close" aria-label="${t('Close','إغلاق')}">×</button></div><div class="schedule-manage-actions"><button class="calendar-choice-card" id="schedule-add-more"><span class="choice-icon">＋</span><div><strong>${t('Add to schedule','إضافة إلى الجدول')}</strong><p>${t('Add lectures manually or import a file.','أضف المحاضرات يدويًا أو استورد ملفًا.')}</p></div></button><button class="calendar-choice-card" id="schedule-replace"><span class="choice-icon">⇄</span><div><strong>${t('Replace current schedule','استبدال الجدول الحالي')}</strong><p>${t('Upload an Excel or CSV file and replace all current entries.','ارفع ملف Excel أو CSV لاستبدال جميع الإدخالات الحالية.')}</p></div></button><button class="calendar-choice-card schedule-remove-card" id="schedule-remove"><span class="choice-icon">×</span><div><strong>${t('Remove current schedule','إزالة الجدول الحالي')}</strong><p>${t('Delete all weekly schedule entries and notes.','احذف جميع إدخالات الجدول الأسبوعي وملاحظاته.')}</p></div></button><input type="file" id="schedule-replace-file" accept=".xlsx,.xls,.csv" hidden></div></section></div>`;
    document.getElementById('schedule-manage-close').onclick = closeOverlay;
    document.getElementById('schedule-manage-overlay').onclick = event => { if(event.target.id === 'schedule-manage-overlay') closeOverlay(); };
    document.getElementById('schedule-add-more').onclick = () => {
      closeOverlay();
      document.getElementById('calendar-add')?.click();
    };
    document.getElementById('schedule-replace').onclick = () => document.getElementById('schedule-replace-file')?.click();
    document.getElementById('schedule-replace-file').onchange = event => replaceFromFile(event.target.files?.[0]);
    document.getElementById('schedule-remove').onclick = removeSchedule;
  }

  function removeSchedule(){
    if(!confirm(t('Remove the current weekly schedule? This cannot be undone.','إزالة الجدول الأسبوعي الحالي؟ لا يمكن التراجع عن هذا الإجراء.'))) return;
    write(SCHEDULE_KEY, []);
    write(SCHEDULE_NOTES_KEY, '');
    write(DAYS_KEY, DEFAULT_DAYS);
    write(PERIODS_KEY, DEFAULT_PERIODS);
    closeOverlay();
    render();
  }

  async function replaceFromFile(file){
    if(!file) return;
    try{
      let matrix;
      if(/\.csv$/i.test(file.name)){
        const text = await file.text();
        matrix = text.split(/\r?\n/).filter(Boolean).map(line => line.split(',').map(value => value.trim()));
      } else {
        if(typeof XLSX === 'undefined') throw new Error(t('Excel parser unavailable','محلل Excel غير متاح'));
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {type:'array'});
        matrix = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header:1, defval:''});
      }

      const entries = [];
      const days = [];
      const periods = [];
      for(const row of matrix.slice(1)){
        const [day,time,subject,location=''] = row;
        if(!day || !time || !subject) continue;
        const dayText = String(day).trim();
        const timeText = String(time).trim();
        if(!days.includes(dayText)) days.push(dayText);
        if(!periods.includes(timeText)) periods.push(timeText);
        entries.push({id:uid(), day:dayText, time:timeText, subject:String(subject).trim(), location:String(location || '').trim()});
      }
      if(!entries.length) throw new Error(t('No valid rows found. Expected Day, Time, Subject and optional Location columns.','لم يتم العثور على صفوف صالحة. يلزم وجود أعمدة اليوم والوقت والمادة، والموقع اختياري.'));
      if(!confirm(t(`Replace the current schedule with ${entries.length} imported entries?`,`استبدال الجدول الحالي بـ ${entries.length} إدخالًا مستوردًا؟`))) return;

      write(SCHEDULE_KEY, entries);
      write(DAYS_KEY, days);
      write(PERIODS_KEY, periods);
      closeOverlay();
      render();
    } catch(error){
      alert(`${t('Could not replace schedule','تعذر استبدال الجدول')}: ${error.message}`);
    }
  }

  function enhanceSchedule(){
    const page = document.querySelector('.calendar-page');
    if(!page || !document.getElementById('schedule-notes')) return;
    if(!canManageSchedule()){
      lockScheduleForStudent(page);
      return;
    }

    page.classList.add('schedule-leader-mode');
    const head = page.querySelector('.calendar-head');
    const originalAdd = document.getElementById('calendar-add');
    if(!head || !originalAdd || document.getElementById('schedule-edit')) return;
    originalAdd.classList.add('schedule-original-add');
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'schedule-edit';
    button.className = 'subject-add schedule-edit-button';
    button.innerHTML = `<span>✎</span><strong>${t('Edit','تعديل')}</strong>`;
    button.setAttribute('aria-label', t('Edit weekly schedule','تعديل الجدول الأسبوعي'));
    button.onclick = openManageSheet;
    originalAdd.insertAdjacentElement('afterend', button);
  }

  const previousWorkspace = workspace;
  workspace = function(current){
    previousWorkspace(current);
    const normalized = (() => { try { return decodeURIComponent(current || '').toLowerCase(); } catch { return String(current || '').toLowerCase(); } })();
    if(normalized === 'calendar' || normalized === 'calendar/schedule') enhanceSchedule();
  };
})();
