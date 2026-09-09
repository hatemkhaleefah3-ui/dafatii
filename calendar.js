(() => {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const PERIODS = ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM'];
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const SCHEDULE_NOTES_KEY = 'dafatii:scheduleNotes';
  const EXAMS_KEY = 'dafatii:examsGrid';
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
    const entries = read(SCHEDULE_KEY, []);
    const notes = read(SCHEDULE_NOTES_KEY, '');
    const byCell = new Map(entries.map(e => [`${e.day}|${e.time}`, e]));
    const header = DAYS.map(d => `<div class="cal-day">${d}</div>`).join('');
    const rows = PERIODS.map(time => {
      const cells = DAYS.map(day => {
        const e = byCell.get(`${day}|${time}`);
        return `<button class="cal-cell ${e?'filled':''}" data-day="${day}" data-time="${time}" ${e?`data-entry="${e.id}"`:''}>${e?`<strong>${esc(e.subject)}</strong><span>${esc(e.location || '')}</span>`:'<span class="cal-empty-dot">＋</span>'}</button>`;
      }).join('');
      return `<div class="cal-time">${time}</div>${cells}`;
    }).join('');
    return `<section class="calendar-page">
      <div class="calendar-head"><div><div class="eyebrow">Calendar · Schedule</div><h1>Weekly schedule</h1><p>Lectures repeat every week.</p></div><button class="subject-add" id="calendar-add"><span>＋</span><strong>Add</strong></button></div>
      <div class="calendar-toolbar"><span>7 days</span><span>9 time rows</span><span>Weekly repeat</span></div>
      <div class="calendar-scroll"><div class="schedule-grid"><div class="cal-corner">Time</div>${header}${rows}</div></div>
      <div class="calendar-notes"><div class="calendar-notes-head"><h2>Notes</h2><span>Saved automatically</span></div><textarea id="schedule-notes" placeholder="Add notes below your weekly schedule…">${esc(notes)}</textarea></div>
    </section>`;
  }

  function examsView(){
    const data = read(EXAMS_KEY, {subjects:[], rows:[]});
    const notes = read(EXAM_NOTES_KEY, '');
    const subjects = Array.isArray(data.subjects) ? data.subjects : [];
    const rows = Array.isArray(data.rows) ? data.rows : [];
    let grid;
    if(subjects.length){
      grid = `<div class="exam-grid" style="--exam-cols:${subjects.length}"><div class="exam-corner">Day / Subject</div>${subjects.map(s=>`<div class="exam-head">${esc(s)}</div>`).join('')}${rows.map(r=>`<div class="exam-day">${esc(r.day)}</div>${subjects.map(s=>`<button class="exam-cell" data-exam-day="${esc(r.day)}" data-exam-subject="${esc(s)}">${esc((r.values||{})[s]||'')}</button>`).join('')}`).join('')}</div>`;
    } else {
      grid = `<div class="subjects-empty"><div class="subjects-empty-icon">□</div><h2>No exam schedule yet</h2><p>Import an Excel file or add the exam schedule manually.</p></div>`;
    }
    return `<section class="calendar-page">
      <div class="calendar-head"><div><div class="eyebrow">Calendar · Exams</div><h1>Exam schedule</h1><p>The grid expands to match the subjects and exam days in your imported sheet.</p></div><button class="subject-add" id="exam-add"><span>＋</span><strong>Add</strong></button></div>
      <div class="calendar-scroll">${grid}</div>
      <div class="calendar-notes"><div class="calendar-notes-head"><h2>Notes</h2><span>Saved automatically</span></div><textarea id="exam-notes" placeholder="Add exam notes…">${esc(notes)}</textarea></div>
    </section>`;
  }

  function openChoice(kind){
    const root = document.getElementById('overlay-root');
    root.innerHTML = `<div class="entity-sheet-overlay" id="calendar-choice-overlay"><section class="entity-sheet calendar-choice" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Calendar</div><h2>Add ${kind==='schedule'?'schedule':'exam schedule'}</h2></div><button class="icon-btn" id="calendar-choice-close">×</button></div><div class="calendar-choice-list"><label class="calendar-choice-card"><input type="file" id="calendar-excel" accept=".xlsx,.xls,.csv" hidden><span class="choice-icon">⇧</span><div><strong>Add from Excel file</strong><p>Import spreadsheet data.</p></div></label><button class="calendar-choice-card" id="calendar-manual"><span class="choice-icon">✎</span><div><strong>Add manually</strong><p>Open the manual entry page.</p></div></button></div></section></div>`;
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
      if(kind==='schedule') importScheduleMatrix(matrix); else importExamMatrix(matrix);
      closeChoice(); render();
    } catch(err){ alert(`Could not import file: ${err.message}`); }
  }

  function importScheduleMatrix(matrix){
    const out=[];
    for(const row of matrix.slice(1)){
      const [day,time,subject,location=''] = row;
      if(!day||!time||!subject) continue;
      out.push({id:id(),day:String(day),time:String(time),subject:String(subject),location:String(location)});
    }
    write(SCHEDULE_KEY,out);
  }
  function importExamMatrix(matrix){
    if(!matrix.length) return;
    const subjects = matrix[0].slice(1).filter(Boolean).map(String);
    const rows = matrix.slice(1).filter(r=>r[0]).map(r=>({day:String(r[0]),values:Object.fromEntries(subjects.map((s,i)=>[s,String(r[i+1]??'')]))}));
    write(EXAMS_KEY,{subjects,rows});
  }

  function manualScheduleView(){
    return `<section class="calendar-page manual-page"><div class="manual-head"><button class="btn btn-ghost" id="manual-back">← Schedule</button><div><div class="eyebrow">Manual entry</div><h1>Add weekly lecture</h1></div></div><form id="manual-schedule-form" class="calendar-form"><div class="field"><label>Subject / lecture</label><input name="subject" required placeholder="e.g. Physics"></div><div class="calendar-form-grid"><div class="field"><label>Day</label><select name="day">${DAYS.map(d=>`<option>${d}</option>`).join('')}</select></div><div class="field"><label>Time</label><select name="time">${PERIODS.map(t=>`<option>${t}</option>`).join('')}</select></div></div><div class="field"><label>Location / room</label><input name="location" placeholder="Optional"></div><button class="btn btn-primary" type="submit">Add to weekly schedule</button></form></section>`;
  }
  function bindManualSchedule(){
    document.getElementById('manual-back').onclick=()=>setHash('calendar/Schedule');
    document.getElementById('manual-schedule-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);const arr=read(SCHEDULE_KEY,[]);arr.push({id:id(),day:f.get('day'),time:f.get('time'),subject:f.get('subject'),location:f.get('location')});write(SCHEDULE_KEY,arr);setHash('calendar/Schedule');};
  }

  function manualExamView(){
    return `<section class="calendar-page manual-page"><div class="manual-head"><button class="btn btn-ghost" id="manual-exam-back">← Exams</button><div><div class="eyebrow">Manual entry</div><h1>Create exam grid</h1></div></div><form id="manual-exam-form" class="calendar-form"><div class="field"><label>Subjects</label><input name="subjects" required placeholder="Math, Physics, English"><small>Separate subjects with commas.</small></div><div class="field"><label>Exam days</label><textarea name="days" required placeholder="Monday 12 May&#10;Wednesday 14 May"></textarea><small>One day per line.</small></div><button class="btn btn-primary" type="submit">Create exam schedule</button></form></section>`;
  }
  function bindManualExam(){
    document.getElementById('manual-exam-back').onclick=()=>setHash('calendar/Exams');
    document.getElementById('manual-exam-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);const subjects=String(f.get('subjects')).split(',').map(x=>x.trim()).filter(Boolean);const rows=String(f.get('days')).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(day=>({day,values:{}}));write(EXAMS_KEY,{subjects,rows});setHash('calendar/Exams');};
  }

  function bindSchedule(){
    document.getElementById('calendar-add')?.addEventListener('click',()=>openChoice('schedule'));
    document.getElementById('schedule-notes')?.addEventListener('input',e=>write(SCHEDULE_NOTES_KEY,e.target.value));
    document.querySelectorAll('.cal-cell').forEach(cell=>cell.addEventListener('click',()=>{
      if(!cell.dataset.entry){
        setHash('calendar/manual-schedule');
        return;
      }
      const arr=read(SCHEDULE_KEY,[]); const item=arr.find(x=>x.id===cell.dataset.entry); if(!item) return;
      if(confirm(`Delete ${item.subject} from ${item.day} at ${item.time}?`)){ write(SCHEDULE_KEY,arr.filter(x=>x.id!==item.id)); render(); }
    }));
  }
  function bindExams(){
    document.getElementById('exam-add')?.addEventListener('click',()=>openChoice('exams'));
    document.getElementById('exam-notes')?.addEventListener('input',e=>write(EXAM_NOTES_KEY,e.target.value));
    document.querySelectorAll('.exam-cell').forEach(cell=>cell.addEventListener('click',()=>{
      const value=prompt(`${cell.dataset.examSubject} · ${cell.dataset.examDay}`,cell.textContent.trim()); if(value===null)return;
      const data=read(EXAMS_KEY,{subjects:[],rows:[]});const row=data.rows.find(r=>r.day===cell.dataset.examDay);if(row){row.values=row.values||{};row.values[cell.dataset.examSubject]=value;write(EXAMS_KEY,data);render();}
    }));
  }
})();
