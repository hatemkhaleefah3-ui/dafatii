(() => {
  const DEFAULT_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_PERIODS = ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM'];
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const SCHEDULE_NOTES_KEY = 'dafatii:scheduleNotes';
  const EXAMS_KEY = 'dafatii:examSchedule';
  const EXAM_NOTES_KEY = 'dafatii:examNotes';
  const AXIS_KEYS = {
    schedule: { days:'dafatii:scheduleDays', periods:'dafatii:schedulePeriods' },
    exam: { days:'dafatii:examDays', periods:'dafatii:examPeriods' }
  };

  MAIN_NAV.calendar = ['Schedule', 'Exams'];

  function read(key, fallback){ return window.DafatiiData.readJSON(key, fallback); }
  function write(key, value){ return window.DafatiiData.writeJSON(key, value); }
  function esc(v){ return escapeHtml(v ?? ''); }
  function id(){ return `cal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
  function kindKey(kind){ return kind === 'schedule' ? SCHEDULE_KEY : EXAMS_KEY; }
  function kindRoute(kind){ return kind === 'schedule' ? 'calendar/Schedule' : 'calendar/Exams'; }

  function axes(kind){
    const keys = AXIS_KEYS[kind];
    const days = read(keys.days, DEFAULT_DAYS);
    const periods = read(keys.periods, DEFAULT_PERIODS);
    return {
      days: Array.isArray(days) && days.length ? days.map(String) : [...DEFAULT_DAYS],
      periods: Array.isArray(periods) && periods.length ? periods.map(String) : [...DEFAULT_PERIODS]
    };
  }
  function saveAxes(kind, value){
    write(AXIS_KEYS[kind].days, value.days);
    write(AXIS_KEYS[kind].periods, value.periods);
  }

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
    return timetableView({
      kind:'exam',
      title:'Exam schedule',
      subtitle:'Use the same timetable tools as your weekly schedule.',
      entries:Array.isArray(raw) ? raw : [],
      notes:read(EXAM_NOTES_KEY, ''),
      notesId:'exam-notes',
      addId:'exam-add',
      eyebrow:'Calendar · Exams',
      repeatLabel:'Exam timetable'
    });
  }

  function timetableView({kind,title,subtitle,entries,notes,notesId,addId,eyebrow,repeatLabel}){
    const {days, periods} = axes(kind);
    const byCell = new Map(entries.map(e => [`${e.day}|${e.time}`, e]));
    const header = days.map((day,index) => `<button class="cal-day cal-head-button" data-axis-kind="${kind}" data-axis-type="day" data-axis-index="${index}" aria-label="Edit ${esc(day)} column">${esc(day)}</button>`).join('');
    const rows = periods.map((time,timeIndex) => {
      const cells = days.map(day => {
        const e = byCell.get(`${day}|${time}`);
        return `<button class="cal-cell ${e?'filled':''}" data-kind="${kind}" data-day="${esc(day)}" data-time="${esc(time)}" ${e?`data-entry="${e.id}"`:''}>${e?`<strong>${esc(e.subject)}</strong><span>${esc(e.location || '')}</span>`:'<span class="cal-empty-dot">＋</span>'}</button>`;
      }).join('');
      return `<button class="cal-time cal-head-button" data-axis-kind="${kind}" data-axis-type="period" data-axis-index="${timeIndex}" aria-label="Edit ${esc(time)} row">${esc(time)}</button>${cells}<div class="cal-axis-spacer" aria-hidden="true"></div>`;
    }).join('');
    const bottomSpacers = days.map(()=>'<div class="cal-axis-spacer cal-axis-bottom-spacer" aria-hidden="true"></div>').join('');
    return `<section class="calendar-page">
      <div class="calendar-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><button class="subject-add" id="${addId}"><span>＋</span><strong>Add</strong></button></div>
      <div class="calendar-toolbar"><span>${days.length} columns</span><span>${periods.length} time rows</span><span>${repeatLabel}</span><span>Tap a row/column header to edit</span></div>
      <div class="calendar-scroll"><div class="schedule-grid" style="--cal-cols:${days.length}"><div class="cal-corner">Time</div>${header}<button class="cal-add-axis cal-add-column" data-add-axis="day" data-axis-kind="${kind}" aria-label="Add column">＋</button>${rows}<button class="cal-add-axis cal-add-row" data-add-axis="period" data-axis-kind="${kind}" aria-label="Add row">＋</button>${bottomSpacers}<div class="cal-axis-spacer cal-axis-plus-corner" aria-hidden="true"></div></div></div>
      <div class="calendar-notes"><div class="calendar-notes-head"><h2>Notes</h2><span>Saved automatically</span></div><textarea id="${notesId}" placeholder="Add notes…">${esc(notes)}</textarea></div>
    </section>`;
  }

  function openChoice(kind){
    const root = document.getElementById('overlay-root');
    root.innerHTML = `<div class="entity-sheet-overlay" id="calendar-choice-overlay"><section class="entity-sheet calendar-choice" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Calendar</div><h2>Add ${kind==='schedule'?'schedule':'exam'}</h2></div><button class="icon-btn" id="calendar-choice-close">×</button></div><div class="calendar-choice-list"><label class="calendar-choice-card"><input type="file" id="calendar-excel" accept=".xlsx,.xls,.csv" hidden><span class="choice-icon">⇧</span><div><strong>Add from Excel file</strong><p>Import Day, Time, Subject and optional Location.</p></div></label><button class="calendar-choice-card" id="calendar-manual"><span class="choice-icon">✎</span><div><strong>Add manually</strong><p>Open the manual entry page.</p></div></button></div></section></div>`;
    document.getElementById('calendar-choice-close').onclick = closeOverlay;
    document.getElementById('calendar-choice-overlay').onclick = e => { if(e.target.id==='calendar-choice-overlay') closeOverlay(); };
    document.getElementById('calendar-manual').onclick = () => setHash(kind==='schedule'?'calendar/manual-schedule':'calendar/manual-exam');
    document.getElementById('calendar-excel').onchange = e => importExcel(e.target.files[0], kind);
  }

  function closeOverlay(){ const r=document.getElementById('overlay-root'); if(r) r.innerHTML=''; }

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
      importTimetableMatrix(matrix, kind);
      closeOverlay();
      render();
    } catch(err){ alert(`Could not import file: ${err.message}`); }
  }

  function importTimetableMatrix(matrix, kind){
    const out=[];
    const current = axes(kind);
    for(const row of matrix.slice(1)){
      const [day,time,subject,location=''] = row;
      if(!day||!time||!subject) continue;
      const dayText=String(day).trim(), timeText=String(time).trim();
      out.push({id:id(),day:dayText,time:timeText,subject:String(subject),location:String(location)});
      if(!current.days.includes(dayText)) current.days.push(dayText);
      if(!current.periods.includes(timeText)) current.periods.push(timeText);
    }
    write(kindKey(kind),out);
    saveAxes(kind,current);
  }

  function manualScheduleView(){
    return manualEntryView({ type:'schedule', eyebrow:'Manual entry', title:'Add weekly lecture', backLabel:'Schedule', submitLabel:'Add to weekly schedule' });
  }
  function manualExamView(){
    return manualEntryView({ type:'exam', eyebrow:'Manual entry', title:'Add exam', backLabel:'Exams', submitLabel:'Add to exam schedule' });
  }

  function manualEntryView({type,eyebrow,title,backLabel,submitLabel}){
    const {days, periods} = axes(type);
    return `<section class="calendar-page manual-page"><div class="manual-head"><button class="btn btn-ghost" id="manual-back">← ${backLabel}</button><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div></div><form id="manual-entry-form" class="calendar-form"><div class="field"><label>${type==='exam'?'Exam subject':'Subject / lecture'}</label><input name="subject" required placeholder="e.g. Physics"></div><div class="calendar-form-grid"><div class="field"><label>Day / column</label><select name="day">${days.map(d=>`<option>${esc(d)}</option>`).join('')}</select></div><div class="field"><label>Time / row</label><select name="time">${periods.map(t=>`<option>${esc(t)}</option>`).join('')}</select></div></div><div class="field"><label>Location / room</label><input name="location" placeholder="Optional"></div><button class="btn btn-primary" type="submit">${submitLabel}</button></form></section>`;
  }

  function bindManualSchedule(){ bindManualEntry('schedule'); }
  function bindManualExam(){ bindManualEntry('exam'); }
  function bindManualEntry(kind){
    document.getElementById('manual-back').onclick=()=>setHash(kindRoute(kind));
    document.getElementById('manual-entry-form').onsubmit=e=>{
      e.preventDefault();
      const f=new FormData(e.currentTarget);
      const arr=read(kindKey(kind),[]);
      arr.push({id:id(),day:f.get('day'),time:f.get('time'),subject:f.get('subject'),location:f.get('location')});
      write(kindKey(kind),arr);
      setHash(kindRoute(kind));
    };
  }

  function bindSchedule(){
    document.getElementById('calendar-add')?.addEventListener('click',()=>openChoice('schedule'));
    document.getElementById('schedule-notes')?.addEventListener('input',e=>write(SCHEDULE_NOTES_KEY,e.target.value));
    bindTimetable('schedule','calendar/manual-schedule');
  }

  function bindExams(){
    document.getElementById('exam-add')?.addEventListener('click',()=>openChoice('exam'));
    document.getElementById('exam-notes')?.addEventListener('input',e=>write(EXAM_NOTES_KEY,e.target.value));
    bindTimetable('exam','calendar/manual-exam');
  }

  function bindTimetable(kind,manualRoute){
    bindTimetableCells(kind,kindKey(kind),manualRoute);
    document.querySelectorAll(`.cal-head-button[data-axis-kind="${kind}"]`).forEach(head=>head.addEventListener('click',()=>{
      openAxisSheet(kind,head.dataset.axisType,Number(head.dataset.axisIndex));
    }));
    document.querySelectorAll(`.cal-add-axis[data-axis-kind="${kind}"]`).forEach(btn=>btn.addEventListener('click',()=>{
      openAxisSheet(kind,btn.dataset.addAxis,-1);
    }));
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

  function openAxisSheet(kind,type,index){
    const root=document.getElementById('overlay-root');
    if(!root) return;
    const current=axes(kind);
    const list=type==='day'?current.days:current.periods;
    const editing=index>=0;
    const value=editing?list[index]:'';
    const label=type==='day'?'column':'row';
    root.innerHTML=`<div class="entity-sheet-overlay" id="axis-overlay"><section class="entity-sheet calendar-axis-sheet" role="dialog" aria-modal="true" aria-label="${editing?'Edit':'Add'} ${label}"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${kind==='schedule'?'Schedule':'Exams'} · ${label}</div><h2>${editing?'Edit':'Add'} ${label}</h2></div><button class="icon-btn" id="axis-close">×</button></div><form id="axis-form"><div class="field"><label>${type==='day'?'Column name':'Row time / label'}</label><input id="axis-value" maxlength="60" required value="${esc(value)}" placeholder="${type==='day'?'e.g. Monday':'e.g. 10:30 AM'}"></div><div class="axis-sheet-actions">${editing?'<button class="btn btn-danger" type="button" id="axis-delete">Delete</button>':''}<button class="btn btn-primary" type="submit">${editing?'Save changes':'Add'}</button></div></form></section></div>`;
    const close=()=>closeOverlay();
    document.getElementById('axis-close').onclick=close;
    document.getElementById('axis-overlay').onclick=e=>{if(e.target.id==='axis-overlay')close();};
    document.getElementById('axis-form').onsubmit=e=>{
      e.preventDefault();
      const next=document.getElementById('axis-value').value.trim();
      if(!next) return;
      if(list.some((v,i)=>v.toLowerCase()===next.toLowerCase() && i!==index)){
        alert(`${type==='day'?'Column':'Row'} already exists.`);
        return;
      }
      if(editing) renameAxis(kind,type,index,next); else addAxis(kind,type,next);
      close(); render();
    };
    document.getElementById('axis-delete')?.addEventListener('click',()=>{
      if(list.length<=1){ alert(`At least one ${label} is required.`); return; }
      const associated=read(kindKey(kind),[]).filter(e=>type==='day'?e.day===value:e.time===value).length;
      const suffix=associated?` This also deletes ${associated} ${associated===1?'item':'items'} in this ${label}.`:'';
      if(confirm(`Delete ${value}?${suffix}`)){
        deleteAxis(kind,type,index);
        close(); render();
      }
    });
    setTimeout(()=>document.getElementById('axis-value')?.focus(),30);
  }

  function addAxis(kind,type,value){
    const current=axes(kind);
    (type==='day'?current.days:current.periods).push(value);
    saveAxes(kind,current);
  }

  function renameAxis(kind,type,index,next){
    const current=axes(kind);
    const list=type==='day'?current.days:current.periods;
    const previous=list[index];
    list[index]=next;
    saveAxes(kind,current);
    const entries=read(kindKey(kind),[]).map(entry=>{
      if(type==='day' && entry.day===previous) return {...entry,day:next};
      if(type==='period' && entry.time===previous) return {...entry,time:next};
      return entry;
    });
    write(kindKey(kind),entries);
  }

  function deleteAxis(kind,type,index){
    const current=axes(kind);
    const list=type==='day'?current.days:current.periods;
    const removed=list[index];
    list.splice(index,1);
    saveAxes(kind,current);
    const entries=read(kindKey(kind),[]).filter(entry=>type==='day'?entry.day!==removed:entry.time!==removed);
    write(kindKey(kind),entries);
  }
})();