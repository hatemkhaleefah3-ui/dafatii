(() => {
  const DEFAULT_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_PERIODS = ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM'];
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const SCHEDULE_NOTES_KEY = 'dafatii:scheduleNotes';
  const PLANNER_KEY = 'dafatii:schedulePlanner:v1';
  const PLANNER_MODES = ['day','week','month','year'];
  const PLANNER_TABS = ['tasks','schedule','todos','goals','attendance'];
  let plannerMode = 'day';
  let plannerDate = new Date();
  let plannerTab = 'tasks';
  const EXAMS_KEY = 'dafatii:examSchedule';
  const EXAM_NOTES_KEY = 'dafatii:examNotes';
  const AXIS_KEYS = {
    schedule: { days:'dafatii:scheduleDays', periods:'dafatii:schedulePeriods' },
    exam: { days:'dafatii:examDays', periods:'dafatii:examPeriods' }
  };

  MAIN_NAV.calendar = ['Schedule', 'Exams'];

  function read(key, fallback){ return window.DafatiiCourses.readJSON(key, fallback); }
  function write(key, value){ return window.DafatiiCourses.writeJSON(key, value); }
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

  const pad = value => String(value).padStart(2,'0');
  const dateKey = value => `${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())}`;
  const cloneDate = value => new Date(value.getFullYear(),value.getMonth(),value.getDate());
  const addDate = (value,mode,amount) => {
    const next=cloneDate(value);
    if(mode==='day')next.setDate(next.getDate()+amount);
    else if(mode==='week')next.setDate(next.getDate()+(amount*7));
    else if(mode==='month')next.setMonth(next.getMonth()+amount);
    else next.setFullYear(next.getFullYear()+amount);
    return next;
  };
  const weekStart = value => {const next=cloneDate(value);next.setDate(next.getDate()-next.getDay());return next;};
  const periodKey = (mode,value) => {
    if(mode==='day')return `day:${dateKey(value)}`;
    if(mode==='week')return `week:${dateKey(weekStart(value))}`;
    if(mode==='month')return `month:${value.getFullYear()}-${pad(value.getMonth()+1)}`;
    return `year:${value.getFullYear()}`;
  };
  const plannerData = () => {
    const value=read(PLANNER_KEY,{});
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  };
  const emptyBucket = () => ({tasks:[],schedule:[],todos:[],goals:[],attendance:[]});
  const plannerBucket = () => {
    const value=plannerData()[periodKey(plannerMode,plannerDate)];
    return value&&typeof value==='object'?{...emptyBucket(),...value}:emptyBucket();
  };
  function savePlannerBucket(bucket){
    const value=plannerData();
    value[periodKey(plannerMode,plannerDate)]={...emptyBucket(),...bucket,updatedAt:Date.now()};
    write(PLANNER_KEY,value);
  }
  const sameDay = (a,b) => dateKey(a)===dateKey(b);
  const monthName = (date,style='long') => date.toLocaleDateString(undefined,{month:style});
  const dayName = (date,style='long') => date.toLocaleDateString(undefined,{weekday:style});
  const ordinal = number => {
    const rem100=number%100;if(rem100>=11&&rem100<=13)return `${number}th`;
    return `${number}${number%10===1?'st':number%10===2?'nd':number%10===3?'rd':'th'}`;
  };
  function periodLabel(mode,date){
    if(mode==='day')return {primary:dayName(date),secondary:`${monthName(date,'short')} ${ordinal(date.getDate())}`,meta:sameDay(date,new Date())?'Today':String(date.getFullYear())};
    if(mode==='week'){
      const start=weekStart(date),end=addDate(start,'day',6);
      const cross=start.getMonth()!==end.getMonth();
      return {primary:`${monthName(start,'short')} ${start.getDate()}–${cross?monthName(end,'short')+' ':''}${end.getDate()}`,secondary:'Week',meta:String(start.getFullYear())};
    }
    if(mode==='month')return {primary:monthName(date),secondary:String(date.getFullYear()),meta:'Month'};
    return {primary:String(date.getFullYear()),secondary:'Year',meta:`${date.getFullYear()-1} · ${date.getFullYear()+1}`};
  }
  function modeLoop(){
    const index=PLANNER_MODES.indexOf(plannerMode);
    return [-2,-1,0,1,2].map(offset=>{
      const mode=PLANNER_MODES[(index+offset+PLANNER_MODES.length*3)%PLANNER_MODES.length];
      return `<button class="planner-loop-item ${offset===0?'active':''}" data-planner-mode="${mode}" data-loop-offset="${offset}" aria-current="${offset===0?'true':'false'}">${mode[0].toUpperCase()+mode.slice(1)}${mode==='day'?'s':mode==='week'?'s':mode==='month'?'s':'s'}</button>`;
    }).join('');
  }
  function periodLoop(){
    return [-3,-2,-1,0,1,2,3].map(offset=>{
      const date=addDate(plannerDate,plannerMode,offset),label=periodLabel(plannerMode,date);
      return `<button class="planner-date-item ${offset===0?'active':''}" data-planner-period-offset="${offset}" aria-current="${offset===0?'date':'false'}"><strong>${esc(label.primary)}</strong><span>${esc(label.secondary)}</span><small>${esc(label.meta)}</small></button>`;
    }).join('');
  }
  const tabLabel = tab => ({tasks:'Tasks',schedule:'Schedule',todos:'To do',goals:'Goals',attendance:'Attendance'}[tab]||tab);
  function recurringSchedule(){
    const entries=read(SCHEDULE_KEY,[]);
    if(!Array.isArray(entries)||!entries.length)return [];
    if(plannerMode==='day'){
      const day=dayName(plannerDate);
      return entries.filter(item=>String(item.day||'').toLowerCase()===day.toLowerCase());
    }
    return entries;
  }
  function plannerItemMarkup(item,type){
    const done=Boolean(item.done);
    if(type==='schedule')return `<article class="planner-content-card schedule-card"><div class="planner-item-time">${esc(item.time||'Any time')}</div><div><strong>${esc(item.title||'Schedule item')}</strong><p>${esc(item.location||item.notes||'')}</p></div><button class="planner-delete" data-planner-delete="${esc(item.id)}" aria-label="Delete">×</button></article>`;
    if(type==='attendance')return `<article class="planner-content-card attendance-card"><div><strong>${esc(item.title||'Attendance')}</strong><p>${esc(item.notes||'')}</p></div><span class="attendance-status ${esc(item.status||'present')}">${esc(item.status||'present')}</span><button class="planner-delete" data-planner-delete="${esc(item.id)}" aria-label="Delete">×</button></article>`;
    return `<article class="planner-content-card ${done?'done':''}"><button class="planner-check" data-planner-toggle="${esc(item.id)}" aria-label="${done?'Mark incomplete':'Mark complete'}">${done?'✓':''}</button><div><strong>${esc(item.title||tabLabel(type))}</strong><p>${esc(item.notes||'')}</p></div><button class="planner-delete" data-planner-delete="${esc(item.id)}" aria-label="Delete">×</button></article>`;
  }
  function scheduleContent(){
    const bucket=plannerBucket(),items=Array.isArray(bucket[plannerTab])?bucket[plannerTab]:[];
    const recurring=plannerTab==='schedule'?recurringSchedule():[];
    const own=items.length?items.map(item=>plannerItemMarkup(item,plannerTab)).join(''):`<div class="planner-empty"><strong>No ${esc(tabLabel(plannerTab).toLowerCase())} yet</strong><p>Add something for this selected ${esc(plannerMode)}.</p></div>`;
    const recurringMarkup=plannerTab==='schedule'&&recurring.length?`<div class="planner-recurring"><div class="planner-section-label"><span>Recurring weekly timetable</span><button id="calendar-add" class="planner-text-button">Edit weekly timetable</button></div>${recurring.map(item=>`<article class="planner-content-card recurring"><div class="planner-item-time">${esc(item.time||'')}</div><div><strong>${esc(item.subject||'Scheduled lecture')}</strong><p>${esc([item.day,item.location].filter(Boolean).join(' · '))}</p></div></article>`).join('')}</div>`:plannerTab==='schedule'?`<div class="planner-recurring"><div class="planner-section-label"><span>Recurring weekly timetable</span><button id="calendar-add" class="planner-text-button">Set weekly timetable</button></div></div>`:'';
    return `<div class="planner-content-list">${own}${recurringMarkup}</div>`;
  }

  function scheduleView(){
    const selected=periodLabel(plannerMode,plannerDate);
    return `<section class="calendar-page planner-page" data-planner-mode="${plannerMode}">
      <div class="planner-head"><div><div class="eyebrow">Schedule</div><h1>Your schedule</h1><p>Move through time, then keep separate tasks, plans, goals and attendance for every selected period.</p></div><button class="subject-add planner-add" data-planner-add><span>＋</span><strong>Add</strong></button></div>
      <div class="planner-loop-shell planner-mode-shell">
        <button class="planner-loop-arrow" data-planner-mode-step="-1" aria-label="Previous time scale">‹</button>
        <div class="planner-loop-track" data-planner-loop="mode">${modeLoop()}</div>
        <button class="planner-loop-arrow" data-planner-mode-step="1" aria-label="Next time scale">›</button>
      </div>
      <div class="planner-loop-shell planner-date-shell">
        <button class="planner-loop-arrow" data-planner-period-step="-1" aria-label="Previous ${plannerMode}">‹</button>
        <div class="planner-date-track" data-planner-loop="period">${periodLoop()}</div>
        <button class="planner-loop-arrow" data-planner-period-step="1" aria-label="Next ${plannerMode}">›</button>
      </div>
      <div class="planner-selected-summary"><strong>${esc(selected.primary)}</strong><span>${esc(selected.secondary)}</span><small>${esc(selected.meta)}</small></div>
      <nav class="planner-content-tabs" aria-label="Schedule content">${PLANNER_TABS.map(tab=>`<button class="${plannerTab===tab?'active':''}" data-planner-tab="${tab}">${esc(tabLabel(tab))}</button>`).join('')}</nav>
      <section class="planner-content" aria-live="polite"><div class="planner-content-head"><div><span>${esc(tabLabel(plannerTab))}</span><h2>${esc(selected.primary)}</h2></div><button class="planner-inline-add" data-planner-add>＋ Add ${esc(tabLabel(plannerTab))}</button></div>${scheduleContent()}</section>
    </section>`;
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
      eyebrow:'Calendar · Exams'
    });
  }

  function timetableView({kind,title,subtitle,entries,notes,notesId,addId,eyebrow}){
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
    const rerender=()=>render();
    document.querySelectorAll('[data-planner-mode]').forEach(button=>button.addEventListener('click',()=>{
      plannerMode=button.dataset.plannerMode;rerender();
    }));
    document.querySelectorAll('[data-planner-mode-step]').forEach(button=>button.addEventListener('click',()=>{
      const index=PLANNER_MODES.indexOf(plannerMode),step=Number(button.dataset.plannerModeStep||0);
      plannerMode=PLANNER_MODES[(index+step+PLANNER_MODES.length)%PLANNER_MODES.length];rerender();
    }));
    document.querySelectorAll('[data-planner-period-offset]').forEach(button=>button.addEventListener('click',()=>{
      plannerDate=addDate(plannerDate,plannerMode,Number(button.dataset.plannerPeriodOffset||0));rerender();
    }));
    document.querySelectorAll('[data-planner-period-step]').forEach(button=>button.addEventListener('click',()=>{
      plannerDate=addDate(plannerDate,plannerMode,Number(button.dataset.plannerPeriodStep||0));rerender();
    }));
    document.querySelectorAll('[data-planner-tab]').forEach(button=>button.addEventListener('click',()=>{plannerTab=button.dataset.plannerTab;rerender();}));
    document.querySelectorAll('[data-planner-add]').forEach(button=>button.addEventListener('click',openPlannerEntrySheet));
    document.getElementById('calendar-add')?.addEventListener('click',()=>openChoice('schedule'));
    document.querySelectorAll('[data-planner-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const bucket=plannerBucket(),list=Array.isArray(bucket[plannerTab])?bucket[plannerTab]:[];
      const item=list.find(entry=>entry.id===button.dataset.plannerToggle);if(!item)return;item.done=!item.done;savePlannerBucket(bucket);rerender();
    }));
    document.querySelectorAll('[data-planner-delete]').forEach(button=>button.addEventListener('click',()=>{
      const bucket=plannerBucket(),list=Array.isArray(bucket[plannerTab])?bucket[plannerTab]:[];
      bucket[plannerTab]=list.filter(entry=>entry.id!==button.dataset.plannerDelete);savePlannerBucket(bucket);rerender();
    }));
    document.querySelectorAll('[data-planner-loop]').forEach(track=>{
      let startX=null;
      track.addEventListener('pointerdown',event=>{startX=event.clientX;track.setPointerCapture?.(event.pointerId);});
      track.addEventListener('pointerup',event=>{
        if(startX===null)return;const delta=event.clientX-startX;startX=null;if(Math.abs(delta)<42)return;
        if(track.dataset.plannerLoop==='mode'){
          const index=PLANNER_MODES.indexOf(plannerMode),step=delta<0?1:-1;
          plannerMode=PLANNER_MODES[(index+step+PLANNER_MODES.length)%PLANNER_MODES.length];
        }else plannerDate=addDate(plannerDate,plannerMode,delta<0?1:-1);
        rerender();
      });
    });
    requestAnimationFrame(()=>document.querySelectorAll('.planner-loop-track,.planner-date-track').forEach(track=>{
      const active=track.querySelector('.active');if(active)active.scrollIntoView({block:'nearest',inline:'center'});
    }));
  }

  function openPlannerEntrySheet(){
    const root=document.getElementById('overlay-root');if(!root)return;
    const selected=periodLabel(plannerMode,plannerDate),type=plannerTab;
    const standard=type!=='schedule'&&type!=='attendance';
    root.innerHTML=`<div class="entity-sheet-overlay" id="planner-entry-overlay"><section class="entity-sheet planner-entry-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(tabLabel(type))} · ${esc(selected.primary)}</div><h2>Add ${esc(tabLabel(type))}</h2></div><button class="icon-btn" id="planner-entry-close">×</button></div><form id="planner-entry-form">
      <div class="field"><label>${type==='schedule'?'Title':type==='attendance'?'Class / event':'Title'}</label><input name="title" maxlength="140" required placeholder="${type==='tasks'?'Finish chapter review':type==='todos'?'Send assignment':type==='goals'?'Study for 90 minutes':type==='attendance'?'Physics lecture':'Study session'}"></div>
      ${type==='schedule'?'<div class="calendar-form-grid"><div class="field"><label>Time</label><input name="time" type="time"></div><div class="field"><label>Location</label><input name="location" maxlength="100"></div></div>':''}
      ${type==='attendance'?'<div class="field"><label>Status</label><select name="status"><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option></select></div>':''}
      <div class="field"><label>Notes</label><textarea name="notes" maxlength="500" placeholder="Optional"></textarea></div>
      <button class="btn btn-primary" type="submit">Add to this ${esc(plannerMode)}</button>
    </form></section></div>`;
    const close=()=>closeOverlay();
    document.getElementById('planner-entry-close').onclick=close;
    document.getElementById('planner-entry-overlay').onclick=event=>{if(event.target.id==='planner-entry-overlay')close();};
    document.getElementById('planner-entry-form').onsubmit=event=>{
      event.preventDefault();const form=new FormData(event.currentTarget),bucket=plannerBucket();
      const item={id:id(),title:String(form.get('title')||'').trim(),notes:String(form.get('notes')||'').trim(),createdAt:Date.now()};
      if(!item.title)return;
      if(type==='schedule'){item.time=String(form.get('time')||'');item.location=String(form.get('location')||'').trim();}
      else if(type==='attendance')item.status=String(form.get('status')||'present');
      else item.done=false;
      bucket[type]=Array.isArray(bucket[type])?bucket[type]:[];bucket[type].push(item);savePlannerBucket(bucket);close();render();
    };
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
