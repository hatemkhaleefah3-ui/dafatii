(() => {
  const DEFAULT_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_PERIODS = ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM'];
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const SCHEDULE_NOTES_KEY = 'dafatii:scheduleNotes';
  const LEGACY_PLANNER_KEY = 'dafatii:schedulePlanner:v1';
  const PLANNER_KEY = 'dafatii:schedulePlanner:v2';
  const plannerScopeId = () => String(window.DafatiiCourses?.active?.()?.id || 'no-course').replace(/[^A-Za-z0-9_.-]/g,'-').slice(0,80) || 'no-course';
  const plannerPersonalKey = version => `dafatii:planner-course:${plannerScopeId()}:v${version}`;
  const plannerRead = (version,fallback) => window.DafatiiData.readJSON(plannerPersonalKey(version),fallback);
  const plannerWrite = (version,value) => window.DafatiiData.writeJSON(plannerPersonalKey(version),value);
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
  function normalizePlannerTime(value){
    const text=String(value||'').trim();
    if(/^([01]\d|2[0-3]):[0-5]\d$/.test(text))return text;
    const match=text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if(match){
      let hour=Number(match[1])%12;if(match[3].toUpperCase()==='PM')hour+=12;
      return `${pad(hour)}:${match[2]||'00'}`;
    }
    return '09:00';
  }
  function legacyAnchorDate(key){
    if(key.startsWith('day:'))return key.slice(4);
    if(key.startsWith('week:'))return key.slice(5);
    if(key.startsWith('month:'))return `${key.slice(6)}-01`;
    if(key.startsWith('year:'))return `${key.slice(5)}-01-01`;
    return dateKey(new Date());
  }
  function parseStoredJSON(key){
    try{const raw=localStorage.getItem(key);return raw===null?null:JSON.parse(raw);}catch{return null;}
  }
  function legacyPlannerSnapshot(baseKey){
    const activeId=String(window.DafatiiCourses?.active?.()?.id||'');
    const suffix=String(baseKey).replace(/^dafatii:/,'');
    const candidates=[
      activeId?`__dafatii:course-cache:${activeId}:${baseKey}`:'',
      `dafatii:school-course:${suffix}`,
      baseKey
    ].filter(Boolean);
    for(const key of candidates){
      const value=parseStoredJSON(key);
      if(value&&typeof value==='object')return value;
    }
    return null;
  }
  function plannerState(){
    const current=plannerRead(2,null);
    if(current?.version===2&&Array.isArray(current.items))return current;

    const stagedV2=legacyPlannerSnapshot(PLANNER_KEY);
    if(stagedV2?.version===2&&Array.isArray(stagedV2.items)){
      const next={...stagedV2,version:2,updatedAt:Number(stagedV2.updatedAt||Date.now()),migratedFrom:stagedV2.migratedFrom||PLANNER_KEY};
      plannerWrite(2,next);
      return next;
    }

    const legacy=plannerRead(1,null)||legacyPlannerSnapshot(LEGACY_PLANNER_KEY)||{};
    const items=[];
    if(legacy&&typeof legacy==='object'&&!Array.isArray(legacy)){
      Object.entries(legacy).forEach(([key,bucket])=>{
        if(!bucket||typeof bucket!=='object'||!/^(day|week|month|year):/.test(key))return;
        const anchor=legacyAnchorDate(key);
        PLANNER_TABS.forEach(type=>{
          const list=Array.isArray(bucket[type])?bucket[type]:[];
          list.forEach(entry=>items.push({
            ...entry,
            id:entry.id||id(),
            type,
            date:entry.date||anchor,
            time:normalizePlannerTime(entry.time),
            migratedFrom:key
          }));
        });
      });
    }
    const next={version:2,items,updatedAt:Date.now(),migratedFrom:items.length?LEGACY_PLANNER_KEY:null};
    plannerWrite(2,next);
    return next;
  }
  const plannerItems=()=>plannerState().items;
  function savePlannerItems(items){plannerWrite(2,{version:2,items,updatedAt:Date.now()});}
  const dateFromKey = key => {
    const [year,month,day]=String(key).split('-').map(Number);
    return new Date(year,Math.max(0,(month||1)-1),Math.max(1,day||1));
  };
  const itemHour = item => Number(normalizePlannerTime(item.time).slice(0,2));
  const itemOnDate = (item,date) => item.date===dateKey(date);
  const canonicalItemsForDate = (date,type=plannerTab) => plannerItems().filter(item=>item.type===type&&itemOnDate(item,date));
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
    return [-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map(offset=>{
      const mode=PLANNER_MODES[(index+offset+PLANNER_MODES.length*8)%PLANNER_MODES.length];
      return `<button type="button" class="planner-loop-item ${offset===0?'active':''}" data-planner-mode="${mode}" data-loop-offset="${offset}" aria-current="${offset===0?'true':'false'}" tabindex="-1">${mode[0].toUpperCase()+mode.slice(1)}s</button>`;
    }).join('');
  }
  function periodLoop(){
    return [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(offset=>{
      const date=addDate(plannerDate,plannerMode,offset),label=periodLabel(plannerMode,date);
      return `<button type="button" class="planner-date-item ${offset===0?'active':''}" data-planner-period-offset="${offset}" aria-current="${offset===0?'date':'false'}" tabindex="-1"><strong>${esc(label.primary)}</strong><span>${esc(label.secondary)}</span><small>${esc(label.meta)}</small></button>`;
    }).join('');
  }
  const tabLabel = tab => ({tasks:'Tasks',schedule:'Schedule',todos:'To do',goals:'Goals',attendance:'Attendance'}[tab]||tab);
  function recurringForDate(date){
    if(plannerTab!=='schedule')return [];
    const entries=read(SCHEDULE_KEY,[]);
    if(!Array.isArray(entries))return [];
    const target=dayName(date).toLowerCase();
    return entries.filter(item=>String(item.day||'').toLowerCase()===target).map(item=>({
      id:`recurring:${dateKey(date)}:${item.id||item.subject||item.time||Math.random()}`,
      type:'schedule',date:dateKey(date),time:normalizePlannerTime(item.time),
      title:item.subject||'Scheduled lecture',location:item.location||'',notes:'Recurring weekly timetable',recurring:true
    }));
  }
  function visibleItemsForDate(date){
    const own=canonicalItemsForDate(date,plannerTab);
    return plannerTab==='schedule'?[...own,...recurringForDate(date)]:own;
  }
  function plannerCompactItem(item){
    const done=Boolean(item.done),meta=[item.time,item.location,item.status].filter(Boolean).join(' · ');
    return `<article class="planner-table-item ${done?'done':''} ${item.recurring?'recurring':''}" data-planner-entry-id="${esc(item.id)}">
      <div><strong>${esc(item.title||tabLabel(item.type||plannerTab))}</strong>${meta?`<small>${esc(meta)}</small>`:''}</div>
      ${!item.recurring&&item.type!=='schedule'&&item.type!=='attendance'?`<button class="planner-mini-check" data-planner-toggle="${esc(item.id)}" aria-label="${done?'Mark incomplete':'Mark complete'}">${done?'✓':''}</button>`:''}
      ${!item.recurring?`<button class="dcc-native-action" type="button" data-planner-edit="${esc(item.id)}" aria-label="Edit ${esc(item.title||'item')}"></button><button class="planner-mini-delete" data-planner-delete="${esc(item.id)}" aria-label="Delete">×</button>`:''}
    </article>`;
  }
  function plannerCellBody(date){
    const items=visibleItemsForDate(date);
    return items.length?items.map(plannerCompactItem).join(''):`<span class="planner-cell-empty">No ${esc(tabLabel(plannerTab).toLowerCase())}</span>`;
  }
  function formatHour(hour){
    const suffix=hour<12?'AM':'PM',display=hour%12||12;
    return `${display}:00 ${suffix}`;
  }
  function dayTable(){
    const key=dateKey(plannerDate),items=visibleItemsForDate(plannerDate);
    return `<div class="planner-table planner-day-table">${Array.from({length:24},(_,hour)=>{
      const slot=items.filter(item=>itemHour(item)===hour);
      return `<div class="planner-hour-row" data-planner-slot-date="${key}" data-planner-slot-time="${pad(hour)}:00">
        <div class="planner-hour-label">${formatHour(hour)}</div>
        <div class="planner-hour-content">${slot.length?slot.map(plannerCompactItem).join(''):'<span class="planner-cell-empty">Free</span>'}</div>
        <button class="planner-cell-add" data-planner-cell-add data-date="${key}" data-time="${pad(hour)}:00" aria-label="Add item at ${formatHour(hour)}">＋</button>
      </div>`;
    }).join('')}</div>`;
  }
  function weekTable(){
    const start=weekStart(plannerDate),days=Array.from({length:7},(_,index)=>addDate(start,'day',index));
    return `<div class="planner-table-scroll"><div class="planner-table planner-week-table">${days.map(date=>`<section class="planner-period-cell">
      <button class="planner-period-cell-head" data-planner-open-date="${dateKey(date)}"><strong>${esc(dayName(date,'short'))}</strong><span>${esc(monthName(date,'short'))} ${date.getDate()}</span></button>
      <div class="planner-period-cell-body">${plannerCellBody(date)}</div>
      <button class="planner-cell-add" data-planner-cell-add data-date="${dateKey(date)}" data-time="09:00">＋ Add</button>
    </section>`).join('')}</div></div>`;
  }
  function monthTable(){
    const year=plannerDate.getFullYear(),month=plannerDate.getMonth(),daysInMonth=new Date(year,month+1,0).getDate();
    return `<div class="planner-table planner-month-table">${Array.from({length:30},(_,index)=>{
      const day=index+1;
      if(day>daysInMonth)return `<section class="planner-period-cell unavailable"><div class="planner-period-cell-head"><strong>Day ${day}</strong><span>Not in this month</span></div><div class="planner-period-cell-body"><span class="planner-cell-empty">—</span></div></section>`;
      const date=new Date(year,month,day),include31=day===30&&daysInMonth===31,newDate=include31?new Date(year,month,31):null;
      const items=[...visibleItemsForDate(date),...(newDate?visibleItemsForDate(newDate):[])];
      return `<section class="planner-period-cell">
        <button class="planner-period-cell-head" data-planner-open-date="${dateKey(date)}"><strong>${include31?'Days 30–31':`Day ${day}`}</strong><span>${esc(dayName(date,'short'))} · ${esc(monthName(date,'short'))} ${include31?'30–31':day}</span></button>
        <div class="planner-period-cell-body">${items.length?items.map(plannerCompactItem).join(''):`<span class="planner-cell-empty">No ${esc(tabLabel(plannerTab).toLowerCase())}</span>`}</div>
        <button class="planner-cell-add" data-planner-cell-add data-date="${dateKey(date)}" data-time="09:00">＋</button>
      </section>`;
    }).join('')}</div>`;
  }
  function yearTable(){
    const year=plannerDate.getFullYear();
    return `<div class="planner-table planner-year-table">${Array.from({length:12},(_,month)=>{
      const first=new Date(year,month,1),next=new Date(year,month+1,1);
      const items=plannerItems().filter(item=>item.type===plannerTab&&item.date>=dateKey(first)&&item.date<dateKey(next));
      return `<section class="planner-period-cell planner-month-cell">
        <button class="planner-period-cell-head" data-planner-open-month="${year}-${pad(month+1)}"><strong>${esc(monthName(first))}</strong><span>${items.length} ${esc(tabLabel(plannerTab).toLowerCase())}</span></button>
        <div class="planner-period-cell-body">${items.length?items.slice(0,6).map(plannerCompactItem).join(''):`<span class="planner-cell-empty">No ${esc(tabLabel(plannerTab).toLowerCase())}</span>`}${items.length>6?`<small class="planner-more-count">+${items.length-6} more</small>`:''}</div>
        <button class="planner-cell-add" data-planner-cell-add data-date="${dateKey(first)}" data-time="09:00">＋</button>
      </section>`;
    }).join('')}</div>`;
  }
  function scheduleContent(){
    if(plannerMode==='day')return dayTable();
    if(plannerMode==='week')return weekTable();
    if(plannerMode==='month')return monthTable();
    return yearTable();
  }

  function scheduleView(){
    const selected=periodLabel(plannerMode,plannerDate);
    return `<section class="calendar-page planner-page" data-planner-mode="${plannerMode}">
      <div class="planner-head"><div><div class="eyebrow">Schedule</div><h1>Your schedule</h1><p>One dated item flows through every scale: day, week, month and year.</p></div><button class="subject-add planner-add" data-planner-add><span>＋</span><strong>Add</strong></button></div>
      <div class="planner-loop-shell planner-mode-shell">
        <div class="planner-loop-track" data-planner-loop="mode" role="listbox" aria-label="Time scale">${modeLoop()}</div>
      </div>
      <div class="planner-loop-shell planner-date-shell">
        <div class="planner-date-track" data-planner-loop="period" role="listbox" aria-label="${plannerMode} selection">${periodLoop()}</div>
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
        return `<button class="cal-cell ${e?'filled':''}" data-kind="${kind}" data-day="${esc(day)}" data-time="${esc(time)}" ${e?`data-entry="${e.id}" data-content-id="${e.id}"`:''}>${e?`<strong>${esc(e.subject)}</strong><span>${esc(e.location || '')}</span><span class="dcc-native-action" role="button" data-calendar-edit-entry="${e.id}" aria-label="Edit ${esc(e.subject)}"></span><span class="dcc-native-action" role="button" data-calendar-delete-entry="${e.id}" aria-label="Delete ${esc(e.subject)}"></span>`:'<span class="cal-empty-dot">＋</span>'}</button>`;
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

  function centeredPlannerItem(track){
    const items=[...track.children];if(!items.length)return null;
    const rect=track.getBoundingClientRect(),center=rect.left+(rect.width/2);
    return items.reduce((best,item)=>{
      const itemRect=item.getBoundingClientRect(),distance=Math.abs((itemRect.left+(itemRect.width/2))-center);
      return !best||distance<best.distance?{item,distance}:best;
    },null)?.item||null;
  }
  function paintPlannerTrack(track){
    const rect=track.getBoundingClientRect(),center=rect.left+(rect.width/2),fadeDistance=Math.max(1,rect.width*.48);
    const centered=centeredPlannerItem(track);
    [...track.children].forEach(item=>{
      const itemRect=item.getBoundingClientRect(),distance=Math.abs((itemRect.left+(itemRect.width/2))-center);
      const ratio=Math.min(1,distance/fadeDistance);
      item.style.opacity=String(Math.max(.12,1-(ratio*.88)));
      item.style.transform=`scale(${(1-(ratio*.12)).toFixed(3)})`;
      const active=item===centered;
      item.classList.toggle('active',active);
      item.setAttribute('aria-current',active?(track.dataset.plannerLoop==='period'?'date':'true'):'false');
    });
  }
  function commitPlannerCenter(track){
    if(!document.contains(track))return;
    const centered=centeredPlannerItem(track);if(!centered)return;
    if(track.dataset.plannerLoop==='mode'){
      const offset=Number(centered.dataset.loopOffset||0);
      if(!offset)return;
      plannerMode=centered.dataset.plannerMode||plannerMode;
    }else{
      const offset=Number(centered.dataset.plannerPeriodOffset||0);
      if(!offset)return;
      plannerDate=addDate(plannerDate,plannerMode,offset);
    }
    render();
  }
  function bindPlannerLoop(track){
    let frame=0,settleTimer=0;
    const paint=()=>{frame=0;if(document.contains(track))paintPlannerTrack(track);};
    const settle=()=>{clearTimeout(settleTimer);settleTimer=setTimeout(()=>commitPlannerCenter(track),110);};
    track.addEventListener('scroll',()=>{
      if(!frame)frame=requestAnimationFrame(paint);
      settle();
    },{passive:true});
    track.addEventListener('scrollend',()=>commitPlannerCenter(track),{passive:true});
    requestAnimationFrame(()=>{
      const active=track.querySelector('[data-loop-offset="0"],[data-planner-period-offset="0"]');
      active?.scrollIntoView({block:'nearest',inline:'center'});
      requestAnimationFrame(()=>paintPlannerTrack(track));
    });
  }
  function bindSchedule(){
    const rerender=()=>render();
    document.querySelectorAll('[data-planner-tab]').forEach(button=>button.addEventListener('click',()=>{plannerTab=button.dataset.plannerTab;rerender();}));
    document.querySelectorAll('[data-planner-add]').forEach(button=>button.addEventListener('click',()=>openPlannerEntrySheet()));
    document.querySelectorAll('[data-planner-cell-add]').forEach(button=>button.addEventListener('click',event=>{
      event.stopPropagation();openPlannerEntrySheet(button.dataset.date||'',button.dataset.time||'09:00');
    }));
    document.querySelectorAll('[data-planner-open-date]').forEach(button=>button.addEventListener('click',()=>{
      plannerDate=dateFromKey(button.dataset.plannerOpenDate);plannerMode='day';rerender();
    }));
    document.querySelectorAll('[data-planner-open-month]').forEach(button=>button.addEventListener('click',()=>{
      const [year,month]=button.dataset.plannerOpenMonth.split('-').map(Number);
      plannerDate=new Date(year,month-1,1);plannerMode='month';rerender();
    }));
    document.querySelectorAll('[data-planner-toggle]').forEach(button=>button.addEventListener('click',event=>{
      event.stopPropagation();const items=plannerItems(),item=items.find(entry=>entry.id===button.dataset.plannerToggle);if(!item)return;
      item.done=!item.done;savePlannerItems(items);rerender();
    }));
    document.querySelectorAll('[data-planner-edit]').forEach(button=>button.addEventListener('click',event=>{
      event.stopPropagation();openPlannerEntrySheet('','',button.dataset.plannerEdit);
    }));
    document.querySelectorAll('[data-planner-delete]').forEach(button=>button.addEventListener('click',event=>{
      event.stopPropagation();savePlannerItems(plannerItems().filter(entry=>entry.id!==button.dataset.plannerDelete));rerender();
    }));
    document.querySelectorAll('[data-planner-loop]').forEach(bindPlannerLoop);
  }

  function defaultEntryDate(){
    if(plannerMode==='day')return dateKey(plannerDate);
    if(plannerMode==='week')return dateKey(weekStart(plannerDate));
    if(plannerMode==='month')return dateKey(new Date(plannerDate.getFullYear(),plannerDate.getMonth(),1));
    return dateKey(new Date(plannerDate.getFullYear(),0,1));
  }
  function openPlannerEntrySheet(dateOverride='',timeOverride='09:00',editId=''){
    const root=document.getElementById('overlay-root');if(!root)return;
    const allItems=plannerItems(),editing=editId?allItems.find(item=>item.id===editId):null;
    const selected=periodLabel(plannerMode,plannerDate),type=editing?.type||plannerTab;
    const chosenDate=editing?.date||dateOverride||defaultEntryDate(),chosenTime=normalizePlannerTime(editing?.time||timeOverride);
    const title=editing?'Edit':'Add';
    root.innerHTML=`<div class="entity-sheet-overlay" id="planner-entry-overlay"><section class="entity-sheet planner-entry-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(tabLabel(type))} · ${esc(selected.primary)}</div><h2>${title} ${esc(tabLabel(type))}</h2></div><button class="icon-btn" id="planner-entry-close">×</button></div><form id="planner-entry-form">
      <div class="field"><label>${type==='schedule'?'Title':type==='attendance'?'Class / event':'Title'}</label><input name="title" maxlength="140" required value="${esc(editing?.title||'')}" placeholder="${type==='tasks'?'Finish chapter review':type==='todos'?'Send assignment':type==='goals'?'Study for 90 minutes':type==='attendance'?'Physics lecture':'Study session'}"></div>
      <div class="calendar-form-grid"><div class="field"><label>Date</label><input name="date" type="date" value="${esc(chosenDate)}" required></div><div class="field"><label>Time</label><input name="time" type="time" value="${esc(chosenTime)}" required></div></div>
      ${type==='schedule'?`<div class="field"><label>Location</label><input name="location" maxlength="100" value="${esc(editing?.location||'')}"></div>`:''}
      ${type==='attendance'?`<div class="field"><label>Status</label><select name="status"><option value="present" ${editing?.status==='present'?'selected':''}>Present</option><option value="late" ${editing?.status==='late'?'selected':''}>Late</option><option value="absent" ${editing?.status==='absent'?'selected':''}>Absent</option></select></div>`:''}
      <div class="field"><label>Notes</label><textarea name="notes" maxlength="500" placeholder="Optional">${esc(editing?.notes||'')}</textarea></div>
      <button class="btn btn-primary" type="submit">${editing?'Save changes':'Add'}</button>
    </form></section></div>`;
    const close=()=>closeOverlay();
    document.getElementById('planner-entry-close').onclick=close;
    document.getElementById('planner-entry-overlay').onclick=event=>{if(event.target.id==='planner-entry-overlay')close();};
    document.getElementById('planner-entry-form').onsubmit=event=>{
      event.preventDefault();const form=new FormData(event.currentTarget),items=plannerItems();
      const payload={
        id:editing?.id||id(),type,title:String(form.get('title')||'').trim(),notes:String(form.get('notes')||'').trim(),
        date:String(form.get('date')||chosenDate),time:normalizePlannerTime(form.get('time')),createdAt:editing?.createdAt||Date.now()
      };
      if(!payload.title||!/^\d{4}-\d{2}-\d{2}$/.test(payload.date))return;
      if(type==='schedule')payload.location=String(form.get('location')||'').trim();
      else if(type==='attendance')payload.status=String(form.get('status')||'present');
      else payload.done=Boolean(editing?.done);
      if(editing){
        const index=items.findIndex(item=>item.id===editing.id);
        if(index>=0)items[index]=payload;else items.push(payload);
      }else items.push(payload);
      savePlannerItems(items);close();render();
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
    document.querySelectorAll(`.cal-cell[data-kind="${kind}"]`).forEach(cell=>cell.addEventListener('click',event=>{
      if(event.target.closest('[data-calendar-edit-entry],[data-calendar-delete-entry]'))return;
      if(!cell.dataset.entry)return;
    }));
    document.querySelectorAll(`[data-calendar-edit-entry]`).forEach(control=>control.addEventListener('click',event=>{
      event.stopPropagation();
      const arr=read(key,[]),item=arr.find(entry=>entry.id===control.dataset.calendarEditEntry);
      if(item)openTimetableEntrySheet(kind,key,item);
    }));
    document.querySelectorAll(`[data-calendar-delete-entry]`).forEach(control=>control.addEventListener('click',event=>{
      event.stopPropagation();
      write(key,read(key,[]).filter(entry=>entry.id!==control.dataset.calendarDeleteEntry));
      render();
    }));
  }

  function openTimetableEntrySheet(kind,key,item){
    const root=document.getElementById('overlay-root');if(!root||!item)return;
    const {days,periods}=axes(kind);
    root.innerHTML=`<div class="entity-sheet-overlay" id="calendar-entry-edit-overlay"><section class="entity-sheet calendar-axis-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${kind==='schedule'?'Schedule':'Exams'}</div><h2>Edit entry</h2></div><button class="icon-btn" id="calendar-entry-edit-close">×</button></div><form id="calendar-entry-edit-form"><div class="field"><label>Subject</label><input name="subject" required maxlength="140" value="${esc(item.subject||'')}"></div><div class="calendar-form-grid"><div class="field"><label>Day</label><select name="day">${days.map(day=>`<option ${day===item.day?'selected':''}>${esc(day)}</option>`).join('')}</select></div><div class="field"><label>Time</label><select name="time">${periods.map(time=>`<option ${time===item.time?'selected':''}>${esc(time)}</option>`).join('')}</select></div></div><div class="field"><label>Location / room</label><input name="location" maxlength="100" value="${esc(item.location||'')}"></div><button class="btn btn-primary" type="submit">Save changes</button></form></section></div>`;
    const close=()=>closeOverlay();
    document.getElementById('calendar-entry-edit-close').onclick=close;
    document.getElementById('calendar-entry-edit-overlay').onclick=event=>{if(event.target.id==='calendar-entry-edit-overlay')close();};
    document.getElementById('calendar-entry-edit-form').onsubmit=event=>{
      event.preventDefault();
      const form=new FormData(event.currentTarget),arr=read(key,[]),target=arr.find(entry=>entry.id===item.id);
      if(!target)return;
      const subject=String(form.get('subject')||'').trim();if(!subject)return;
      Object.assign(target,{subject,day:String(form.get('day')||item.day),time:String(form.get('time')||item.time),location:String(form.get('location')||'').trim()});
      write(key,arr);close();render();
    };
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
