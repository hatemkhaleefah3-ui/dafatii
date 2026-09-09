(() => {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const PERIODS = ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM'];
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const SCHEDULE_NOTES_KEY = 'dafatii:scheduleNotes';
  const EXAMS_KEY = 'dafatii:examSchedule';
  const EXAM_NOTES_KEY = 'dafatii:examNotes';

  MAIN_NAV.calendar = ['Schedule', 'Exams'];

  function read(key, fallback){
    try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function esc(v){ return escapeHtml(v ?? ''); }
  function id(){ return `cal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }

  const originalWorkspaceContent = workspaceContent;
  workspaceContent = function(page, parts, title){
    if(page === 'calendar'){
      const sub = decodeURIComponent(parts.slice(1).join('/')).toLowerCase();
      if(!sub || sub === 'schedule') return scheduleView();
      if(sub === 'exams') return examsView();
      if(sub === 'manual-schedule') return manualScheduleView();
      if(sub === 'manual-exam') return manualExamView();
    }
    return originalWorkspaceContent(page, parts, title);
  };

  const originalWorkspace = workspace;
  workspace = function(current){
    originalWorkspace(current);
    const parts = current.split('/');
    if(parts[0] !== 'calendar') return;
    const sub = decodeURIComponent(parts.slice(1).join('/')).toLowerCase();
    if(!sub || sub === 'schedule') bindSchedule();
    else if(sub === 'exams') bindExams();
    else if(sub === 'manual-schedule') bindManualSchedule();
    else if(sub === 'manual-exam') bindManualExam();
  };

  function scheduleView(){
    return timetableView({
      kind:'schedule',
      title:'Weekly schedule',
      subtitle:'Lectures repeat every week.',
      entries:read(SCHEDULE_KEY, []),
      notes:read(SCHEDULE_NOTES_KEY, ''),
      notesId:'schedule-notes',
      addId:'calendar-add',
      eyebrow:'Calendar · Schedule',
      repeatLabel:'Weekly repeat'
    });
  }

  function examsView(){
    const raw = read(EXAMS_KEY, []);
    const entries = Array.isArray(raw) ? raw : [];
    return timetableView({
      kind:'exam',
      title:'Exam schedule',
      subtitle:'Use the same 7-day, 9-time-row calendar layout as your schedule.',
      entries,
      notes:read(EXAM_NOTES_KEY, ''),
      notesId:'exam-notes',
      addId:'exam-add',
      eyebrow:'Calendar · Exams',
      repeatLabel:'Exam timetable'
    });
  }

  function timetableView({kind,title,subtitle,entries,notes,notesId,addId,eyebrow,repeatLabel}){
    const byCell = new Map(entries.map(e => [`${e.day}|${e.time}`, e]));
    const header = DAYS.map(d => `<div class="cal-day">${d}</div>`).join('');
    const rows = PERIODS.map(time => {
      const cells = DAYS.map(day => {
        const e = byCell.get(`${day}|${time}`);
        return `<button class="cal-cell ${e?'filled':''}" data-kind="${kind}" data-day="${day}" data-time="${time}" ${e?`data-entry="${e.id}"`:''}>${e?`<strong>${esc(e.subject)}</strong><span>${esc(e.location || '')}</span>`:'<span class="cal-empty-dot">＋</span>'}</button>`;
      }).join('');
      return `<div class="cal-time">${time}</div>${cells}`;
    }).join('');
    return `<section class="calendar-page">
      <div class="calendar-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><button class="subject-add" id="${addId}"><span>＋</span><strong>Add</strong></button></div>
      <div class="calendar-toolbar"><span>7 days</span><span>9 time rows</span><span>${repeatLabel}</span></div>
      <div class="calendar-scroll"><div class="schedule-grid"><div class="cal-corner">Time</div>${header}${rows}</div></div>
      <div class="calendar-notes"><div class="calendar-notes-head"><h2>Notes</h2><span>Saved automatically</span></div><textarea id="${notesId}" placeholder="Add notes…">${esc(notes)}</textarea></div>
    </section>`;
  }

  function openChoice(kind){
    const root = document.getElementById('overlay-root');
    root.innerHTML = `<div class="entity-sheet-overlay" id="calendar-choice-overlay"><section class="entity-sheet calendar-choice" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Calendar</div><h2>Add ${kind==='schedule'?'schedule':'exam'}</h2></div><button class="icon-btn" id="calendar-choice-close">×</button></div><div class="calendar-choice-list"><label class="calendar-choice-card"><input type="file" id="calendar-excel" accept=".xlsx,.xls,.csv" hidden><span class="choice-icon">⇧</span><div><strong>Add from Excel file</strong><p>Import Day, Time, Subject and optional Location.</p></div></label><button class="calendar-choice-card" id="calendar-manual"><span class="choice-icon">✎</span><div><strong>Add manually</strong><p>Open the manual entry page.</p></div></button></div></section></div>`;
    document.getElementById('calendar-choice-close').onclick = closeChoice;
    document.getElementById('calendar-choice-overlay').onclick = e => { if(e.target.id==='calendar-choice-overlay') closeChoice(); };
    document.getElementById('calendar-manual').onclick = () => setHash(kind==='schedule'?'calendar/manual-schedule':'calendar/manual-exam');
    document.getElementById('calendar-excel').onchange = e => importExcel(e.target.files[0], kind);
  }
  function closeChoice(){ const r=document.getElementById('overlay-root'); if(r) r.innerHTML=''; }

  async function importExcel(file, kind){
    if(!file) return;
    try {
      let matrix;
      if(/\.csv$/i.test(file.name)){
        const text = await file.text();
        matrix = text.split(/\r?\n/).filter(Boolean).map(line => line.split(',').map(x=>x.trim()));
      } else {
        if(typeof XLSX === 'undefined') throw new Error('Excel parser unavailable');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, {type:'array'});
        matrix = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''});
      }
      importTimetableMatrix(matrix, kind === 'schedule' ? SCHEDULE_KEY : EXAMS_KEY);
      closeChoice(); render();
    } catch(err){ alert(`Could not import file: ${err.message}`); }
  }

  function importTimetableMatrix(matrix, key){
    const out=[];
    for(const row of matrix.slice(1)){
      const [day,time,subject,location=''] = row;
      if(!day||!time||!subject) continue;
      out.push({id:id(),day:String(day),time:String(time),subject:String(subject),location:String(location)});
    }
    write(key,out);
  }

  function manualScheduleView(){
    return manualEntryView({
      type:'schedule',
      eyebrow:'Manual entry',
      title:'Add weekly lecture',
      backLabel:'Schedule',
      submitLabel:'Add to weekly schedule'
    });
  }

  function manualExamView(){
    return manualEntryView({
      type:'exam',
      eyebrow:'Manual entry',
      title:'Add exam',
      backLabel:'Exams',
      submitLabel:'Add to exam schedule'
    });
  }

  function manualEntryView({type,eyebrow,title,backLabel,submitLabel}){
    return `<section class="calendar-page manual-page"><div class="manual-head"><button class="btn btn-ghost" id="manual-back">← ${backLabel}</button><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div></div><form id="manual-entry-form" class="calendar-form"><div class="field"><label>${type==='exam'?'Exam subject':'Subject / lecture'}</label><input name="subject" required placeholder="e.g. Physics"></div><div class="calendar-form-grid"><div class="field"><label>Day</label><select name="day">${DAYS.map(d=>`<option>${d}</option>`).join('')}</select></div><div class="field"><label>Time</label><select name="time">${PERIODS.map(t=>`<option>${t}</option>`).join('')}</select></div></div><div class="field"><label>Location / room</label><input name="location" placeholder="Optional"></div><button class="btn btn-primary" type="submit">${submitLabel}</button></form></section>`;
  }

  function bindManualSchedule(){ bindManualEntry('schedule'); }
  function bindManualExam(){ bindManualEntry('exam'); }

  function bindManualEntry(kind){
    document.getElementById('manual-back').onclick=()=>setHash(kind==='schedule'?'calendar/Schedule':'calendar/Exams');
    document.getElementById('manual-entry-form').onsubmit=e=>{
      e.preventDefault();
      const f=new FormData(e.currentTarget);
      const key = kind==='schedule' ? SCHEDULE_KEY : EXAMS_KEY;
      const arr=read(key,[]);
      arr.push({id:id(),day:f.get('day'),time:f.get('time'),subject:f.get('subject'),location:f.get('location')});
      write(key,arr);
      setHash(kind==='schedule'?'calendar/Schedule':'calendar/Exams');
    };
  }

  function bindSchedule(){
    document.getElementById('calendar-add')?.addEventListener('click',()=>openChoice('schedule'));
    document.getElementById('schedule-notes')?.addEventListener('input',e=>write(SCHEDULE_NOTES_KEY,e.target.value));
    bindTimetableCells('schedule', SCHEDULE_KEY, 'calendar/manual-schedule');
  }

  function bindExams(){
    document.getElementById('exam-add')?.addEventListener('click',()=>openChoice('exam'));
    document.getElementById('exam-notes')?.addEventListener('input',e=>write(EXAM_NOTES_KEY,e.target.value));
    bindTimetableCells('exam', EXAMS_KEY, 'calendar/manual-exam');
  }

  function bindTimetableCells(kind,key,manualRoute){
    document.querySelectorAll(`.cal-cell[data-kind="${kind}"]`).forEach(cell=>cell.addEventListener('click',()=>{
      if(!cell.dataset.entry){ setHash(manualRoute); return; }
      const arr=read(key,[]);
      const item=arr.find(x=>x.id===cell.dataset.entry);
      if(!item) return;
      if(confirm(`Delete ${item.subject} from ${item.day} at ${item.time}?`)){
        write(key,arr.filter(x=>x.id!==item.id));
        render();
      }
    }));
  }
})();
