(() => {
  const EXAMS_KEY = 'dafatii:examSchedule';
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';

  function read(key, fallback){
    try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function esc(v){ return escapeHtml(v ?? ''); }
  function uid(prefix){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
  function allExams(){ const v = read(EXAMS_KEY, []); return Array.isArray(v) ? v : []; }
  function subjectExamList(subjectId){ return allExams().filter(e => e.subjectId === subjectId); }

  // Richer lecture editor: subject selector + name + existing icon/link + notes.
  openLectureSheet = function(subject, lectureId=''){
    const currentSubject = subject;
    const currentList = subjectLectures(currentSubject.id);
    const lecture = currentList.find(l => l.id === lectureId);
    const selectedSubjectId = lecture?.subjectId || currentSubject.id;
    const root = document.getElementById('overlay-root');
    if(!root) return;

    root.innerHTML = `
      <div class="entity-sheet-overlay" id="academic-overlay">
        <section class="entity-sheet academic-sheet" role="dialog" aria-modal="true" aria-label="${lecture ? 'Edit lecture' : 'Add lecture'}">
          <div class="entity-sheet-handle"></div>
          <div class="entity-sheet-head"><div><div class="eyebrow">Lecture</div><h2>${lecture ? 'Edit lecture' : 'Add lecture'}</h2></div><button class="icon-btn" id="academic-close">×</button></div>
          <form id="academic-lecture-form">
            <div class="field"><label>Subject</label><div class="academic-toggle-grid" id="lecture-subject-toggle">${state.subjects.map(s=>`<button type="button" class="academic-toggle ${s.id===selectedSubjectId?'active':''}" data-subject-id="${esc(s.id)}"><span>${esc(s.icon)}</span>${esc(s.name)}</button>`).join('')}</div></div>
            <div class="field"><label>Lecture name</label><input id="lecture-name" maxlength="100" required value="${esc(lecture?.name || '')}" placeholder="Lecture name"></div>
            <div class="field"><label>Icon</label><div class="icon-picker">${LECTURE_ICONS.map(i=>`<button type="button" class="icon-choice ${i===(lecture?.icon||LECTURE_ICONS[0])?'active':''}" data-icon="${esc(i)}">${esc(i)}</button>`).join('')}</div></div>
            <div class="field"><label>Lecture link</label><input id="lecture-link" type="url" value="${esc(lecture?.link || '')}" placeholder="https://… (optional)"></div>
            <div class="field"><label>Notes</label><textarea id="lecture-notes" class="academic-notes" placeholder="Lecture notes…">${esc(lecture?.notes || '')}</textarea></div>
            <button class="btn btn-primary auth-submit" type="submit">${lecture ? 'Save changes' : 'Add lecture'}</button>
          </form>
        </section>
      </div>`;

    let chosenSubjectId = selectedSubjectId;
    let chosenIcon = lecture?.icon || LECTURE_ICONS[0];
    document.querySelectorAll('#lecture-subject-toggle .academic-toggle').forEach(btn=>btn.onclick=()=>{
      chosenSubjectId = btn.dataset.subjectId;
      document.querySelectorAll('#lecture-subject-toggle .academic-toggle').forEach(x=>x.classList.toggle('active',x===btn));
    });
    document.querySelectorAll('.icon-choice').forEach(btn=>btn.onclick=()=>{
      chosenIcon=btn.dataset.icon; document.querySelectorAll('.icon-choice').forEach(x=>x.classList.toggle('active',x===btn));
    });
    const close=()=>{root.innerHTML='';};
    document.getElementById('academic-close').onclick=close;
    document.getElementById('academic-overlay').onclick=e=>{if(e.target.id==='academic-overlay')close();};
    document.getElementById('academic-lecture-form').onsubmit=e=>{
      e.preventDefault();
      const targetSubject = state.subjects.find(s=>s.id===chosenSubjectId) || currentSubject;
      const targetList = subjectLectures(targetSubject.id);
      const payload = {
        id: lecture?.id || uid('lecture'),
        name: document.getElementById('lecture-name').value.trim(),
        icon: chosenIcon,
        link: document.getElementById('lecture-link').value.trim(),
        notes: document.getElementById('lecture-notes').value.trim(),
        subjectId: targetSubject.id
      };
      if(!payload.name) return;
      if(lecture){
        state.lectures[currentSubject.id] = currentList.filter(l=>l.id!==lecture.id);
        const idx=targetList.findIndex(l=>l.id===lecture.id);
        if(idx>=0) targetList[idx]=payload; else targetList.push(payload);
      } else targetList.push(payload);
      state.lectures[targetSubject.id]=targetList;
      saveLectures(); close(); setHash(`subjects/subject/${encodeURIComponent(targetSubject.id)}/lectures`);
    };
  };

  // Subject Degrees and Analysis are now functional and derive from exams/lectures.
  const baseSubjectDetailView = subjectDetailView;
  subjectDetailView = function(subject, tab){
    if(tab === 'degrees') return degreesView(subject);
    if(tab === 'analysis') return analysisView(subject);
    return baseSubjectDetailView(subject, tab);
  };

  function degreesView(subject){
    const exams = subjectExamList(subject.id);
    const cards = exams.length ? exams.map(exam=>`
      <article class="degree-card" data-degree-exam="${esc(exam.id)}">
        <div class="degree-card-head"><div><div class="eyebrow">Exam</div><h2>${esc(exam.subject || subject.name)}</h2></div><span>${esc(exam.day || '')} · ${esc(exam.time || '')}</span></div>
        ${exam.lectureIds?.length ? `<p class="degree-lectures">Includes ${exam.lectureIds.length} lecture${exam.lectureIds.length===1?'':'s'}</p>`:''}
        <div class="degree-input-row"><label>Degree</label><input inputmode="decimal" type="number" step="any" min="0" data-degree-input value="${exam.degree ?? ''}" placeholder="Enter degree"><button class="btn btn-primary" data-save-degree>Save</button></div>
        ${exam.notes ? `<p class="degree-note">${esc(exam.notes)}</p>`:''}
      </article>`).join('') : `<div class="subjects-empty"><div class="subjects-empty-icon">%</div><h2>No exams yet</h2><p>Exams created in Calendar will automatically appear here.</p></div>`;
    return `<section class="subjects-page"><div class="subjects-head"><div><div class="eyebrow">${esc(subject.name)} · Degrees</div><h1>Degrees</h1><p>Fill in the degree for each exam.</p></div></div><div class="degree-grid">${cards}</div></section>`;
  }

  function analysisView(subject){
    const lectures = subjectLectures(subject.id);
    const exams = subjectExamList(subject.id);
    const degrees = exams.map(e=>Number(e.degree)).filter(Number.isFinite);
    const average = degrees.length ? degrees.reduce((a,b)=>a+b,0)/degrees.length : null;
    return `<section class="subjects-page"><div class="subjects-head"><div><div class="eyebrow">${esc(subject.name)} · Analysis</div><h1>Analysis</h1><p>Automatically calculated from this subject.</p></div></div>
      <div class="analysis-grid">
        <article class="analysis-card"><span>Lectures</span><strong>${lectures.length}</strong><p>Total lectures</p></article>
        <article class="analysis-card"><span>Exams</span><strong>${exams.length}</strong><p>Total exams</p></article>
        <article class="analysis-card"><span>Degrees filled</span><strong>${degrees.length}/${exams.length}</strong><p>Completed exam degrees</p></article>
        <article class="analysis-card"><span>Degree average</span><strong>${average===null?'—':average.toFixed(1)}</strong><p>Average of entered degrees</p></article>
      </div>
    </section>`;
  }

  // Re-bind degree controls after workspace render.
  const previousWorkspace = workspace;
  workspace = function(current){
    previousWorkspace(current);
    bindAcademicDegreeCards();
    bindExamAddOverride();
  };

  function bindAcademicDegreeCards(){
    document.querySelectorAll('[data-degree-exam]').forEach(card=>{
      card.querySelector('[data-save-degree]')?.addEventListener('click',()=>{
        const exams=allExams(); const exam=exams.find(e=>e.id===card.dataset.degreeExam); if(!exam)return;
        const raw=card.querySelector('[data-degree-input]').value.trim();
        exam.degree = raw==='' ? null : Number(raw);
        write(EXAMS_KEY,exams); render();
      });
    });
  }

  // Replace the Calendar > Exams Add action with a richer bottom sheet/modal.
  function bindExamAddOverride(){
    const add=document.getElementById('exam-add');
    if(!add || add.dataset.academicBound) return;
    add.dataset.academicBound='1';
    add.addEventListener('click',e=>{
      e.preventDefault(); e.stopImmediatePropagation(); openExamSheet();
    }, true);
  }

  function openExamSheet(){
    const root=document.getElementById('overlay-root'); if(!root)return;
    const first=state.subjects[0];
    if(!first){ alert('Add a subject first.'); return; }
    root.innerHTML=`<div class="entity-sheet-overlay" id="exam-academic-overlay"><section class="entity-sheet academic-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Exam</div><h2>Add exam</h2></div><button class="icon-btn" id="exam-academic-close">×</button></div>
      <form id="exam-academic-form">
        <div class="field"><label>Subject</label><div class="academic-toggle-grid" id="exam-subject-toggle">${state.subjects.map((s,i)=>`<button type="button" class="academic-toggle ${i===0?'active':''}" data-subject-id="${esc(s.id)}"><span>${esc(s.icon)}</span>${esc(s.name)}</button>`).join('')}</div></div>
        <div class="field"><label>Lectures included in the exam</label><div id="exam-lecture-multiselect" class="lecture-multiselect"></div></div>
        <div class="calendar-form-grid"><div class="field"><label>Day</label><select id="exam-day"></select></div><div class="field"><label>Time</label><select id="exam-time"></select></div></div>
        <div class="field"><label>Location / room</label><input id="exam-location" placeholder="Optional"></div>
        <div class="field"><label>Notes</label><textarea id="exam-notes-rich" class="academic-notes" placeholder="Exam notes…"></textarea></div>
        <div class="academic-sheet-actions"><label class="btn btn-ghost academic-import"><input type="file" id="exam-excel-rich" accept=".xlsx,.xls,.csv" hidden>Import Excel</label><button class="btn btn-primary" type="submit">Add exam</button></div>
      </form></section></div>`;

    let chosenSubjectId=first.id;
    const getCols=()=>read('dafatii:calendarColumns', ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
    const getRows=()=>read('dafatii:calendarRows', ['7:00 AM','8:45 AM','10:30 AM','12:15 PM','2:00 PM','3:45 PM','5:30 PM','7:15 PM','9:00 PM']);
    document.getElementById('exam-day').innerHTML=getCols().map(x=>`<option>${esc(x)}</option>`).join('');
    document.getElementById('exam-time').innerHTML=getRows().map(x=>`<option>${esc(x)}</option>`).join('');
    const renderLectures=()=>{
      const list=subjectLectures(chosenSubjectId);
      document.getElementById('exam-lecture-multiselect').innerHTML=list.length?list.map(l=>`<label class="lecture-check"><input type="checkbox" value="${esc(l.id)}"><span>${esc(l.icon||'▶')}</span><strong>${esc(l.name)}</strong></label>`).join(''):`<div class="muted">No lectures in this subject yet.</div>`;
    };
    renderLectures();
    document.querySelectorAll('#exam-subject-toggle .academic-toggle').forEach(btn=>btn.onclick=()=>{
      chosenSubjectId=btn.dataset.subjectId; document.querySelectorAll('#exam-subject-toggle .academic-toggle').forEach(x=>x.classList.toggle('active',x===btn)); renderLectures();
    });
    const close=()=>{root.innerHTML='';};
    document.getElementById('exam-academic-close').onclick=close;
    document.getElementById('exam-academic-overlay').onclick=e=>{if(e.target.id==='exam-academic-overlay')close();};
    document.getElementById('exam-academic-form').onsubmit=e=>{
      e.preventDefault();
      const subject=state.subjects.find(s=>s.id===chosenSubjectId); if(!subject)return;
      const lectureIds=[...document.querySelectorAll('#exam-lecture-multiselect input:checked')].map(x=>x.value);
      const exams=allExams();
      exams.push({id:uid('exam'),subject:subject.name,subjectId:subject.id,lectureIds,day:document.getElementById('exam-day').value,time:document.getElementById('exam-time').value,location:document.getElementById('exam-location').value.trim(),notes:document.getElementById('exam-notes-rich').value.trim(),degree:null});
      write(EXAMS_KEY,exams); close(); render();
    };
    document.getElementById('exam-excel-rich').onchange=async e=>{
      const file=e.target.files[0]; if(!file)return;
      try{
        let matrix;
        if(/\.csv$/i.test(file.name)) matrix=(await file.text()).split(/\r?\n/).filter(Boolean).map(line=>line.split(',').map(x=>x.trim()));
        else { const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array'}); matrix=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''}); }
        const subject=state.subjects.find(s=>s.id===chosenSubjectId); const exams=allExams();
        matrix.slice(1).forEach(row=>{ const [day,time,name,location='',notes='']=row; if(!day||!time)return; exams.push({id:uid('exam'),subject:String(name||subject.name),subjectId:subject.id,lectureIds:[],day:String(day),time:String(time),location:String(location),notes:String(notes),degree:null}); });
        write(EXAMS_KEY,exams); close(); render();
      }catch(err){alert(`Could not import file: ${err.message}`);}
    };
  }
})();