(() => {
  const SUITE_KEY = 'dafatii:studentSuite:v1';
  const EXAMS_KEY = 'dafatii:examSchedule';
  const SCHEDULE_KEY = 'dafatii:weeklySchedule';
  const RECENT_KEY = 'dafatii:subjectRecent:v1';
  const ASSIGNMENT_PROGRESS_KEY = 'dafatii:assignmentProgress:v1';
  const ui = { search:'', sort:'name', lectureFilter:'all', examFilter:'all', assignmentFilter:'all' };
  const DAY = 86400000;
  const esc = value => escapeHtml(value ?? '');
  const now = () => Date.now();
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const read = (key,fallback) => window.DafatiiCourses.readJSON(key,fallback);
  const write = (key,value) => window.DafatiiCourses.writeJSON(key,value);
  const managed = () => typeof schoolManagedWorkspace === 'function' && schoolManagedWorkspace();
  const schoolProgram = () => Boolean(window.DafatiiCourses?.active?.()?.isSchoolProgram);
  const canContent = permission => !managed() && Boolean(window.DafatiiCourses?.editable?.(permission));
  const canPlan = permission => schoolProgram() || Boolean(window.DafatiiCourses?.editable?.(permission));

  MAIN_NAV.subjects = ['All subjects','Lectures','Exams','Assignments'];

  function suite(){
    const value = read(SUITE_KEY,{});
    return value && typeof value === 'object' ? {
      ...value,
      assignments:Array.isArray(value.assignments)?value.assignments:[]
    } : {assignments:[]};
  }
  function saveSuite(value){ write(SUITE_KEY,value); }
  function assignmentProgress(){
    const value=read(ASSIGNMENT_PROGRESS_KEY,{});
    return value&&typeof value==='object'&&value.courses&&typeof value.courses==='object'?value:{courses:{}};
  }
  function assignmentScope(){ return String(window.DafatiiCourses?.active?.()?.id||'personal'); }
  function assignmentProgressFor(id){
    const value=assignmentProgress();
    return value.courses?.[assignmentScope()]?.[id]||null;
  }
  function saveAssignmentProgress(id,progress){
    const value=assignmentProgress(),scope=assignmentScope();
    value.courses[scope]=value.courses[scope]&&typeof value.courses[scope]==='object'?value.courses[scope]:{};
    value.courses[scope][id]={status:progress.status,submissionNote:String(progress.submissionNote||'').slice(0,2000),submittedAt:progress.status==='done'?(progress.submittedAt||now()):null,updatedAt:now()};
    write(ASSIGNMENT_PROGRESS_KEY,value);
    return value.courses[scope][id];
  }
  function tracksPersonalAssignmentProgress(){ return !schoolProgram()&&!canPlan('edit_content')&&Boolean(window.DafatiiCourses?.active?.()?.membership?.status==='active'); }
  function effectiveAssignment(assignment){
    if(!tracksPersonalAssignmentProgress())return assignment;
    const progress=assignmentProgressFor(assignment.id);
    return progress
      ? {...assignment,status:progress.status||'todo',completedAt:progress.submittedAt||null,submissionNote:progress.submissionNote||''}
      : {...assignment,status:'todo',completedAt:null,submissionNote:''};
  }
  function exams(){
    const value=read(EXAMS_KEY,[]);
    return Array.isArray(value)?value:[];
  }
  function saveExams(value){ write(EXAMS_KEY,value); }
  function schedules(){
    const value=read(SCHEDULE_KEY,[]);
    return Array.isArray(value)?value:[];
  }
  function subjectAssignments(subjectId){ return suite().assignments.filter(a=>a.subjectId===subjectId).map(effectiveAssignment); }
  function subjectExams(subject){
    return exams().filter(e=>e.subjectId===subject.id || (!e.subjectId && String(e.subject||'').toLowerCase()===String(subject.name||'').toLowerCase()));
  }
  function hasDegree(exam){ return exam.degree!==null && exam.degree!==undefined && exam.degree!=='' && Number.isFinite(Number(exam.degree)); }
  function isLectureDone(lecture){ return lecture.completed===true || lecture.done===true || String(lecture.status||'').toLowerCase()==='completed'; }
  function isExamPast(exam){
    if(hasDegree(exam) || ['past','completed','graded'].includes(String(exam.status||'').toLowerCase())) return true;
    const t=dateTimeValue(exam.day,exam.time);
    return Number.isFinite(t) ? t < now() : false;
  }
  function dateTimeValue(day,time=''){
    const d=String(day||'').trim();
    if(!d) return NaN;
    let candidate=d;
    if(/^\d{4}-\d{2}-\d{2}$/.test(d) && time) candidate += ` ${time}`;
    const t=Date.parse(candidate);
    return Number.isFinite(t)?t:NaN;
  }
  function dateLabel(day){
    const d=String(day||'').trim();
    if(!d) return 'Date not set';
    const t=Date.parse(d);
    if(!Number.isFinite(t)) return d;
    return new Date(t).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:new Date(t).getFullYear()!==new Date().getFullYear()?'numeric':undefined});
  }
  function assignmentDueTime(a){
    if(!a.dueDate) return NaN;
    return Date.parse(`${a.dueDate}T${a.dueTime||'23:59'}:00`);
  }
  function assignmentDone(a){ return a.status==='done'; }
  function subjectStats(subject){
    const lectures=subjectLectures(subject.id);
    const es=subjectExams(subject);
    const as=subjectAssignments(subject.id);
    const lectureDone=lectures.filter(isLectureDone).length;
    const examDone=es.filter(isExamPast).length;
    const assignmentComplete=as.filter(assignmentDone).length;
    const total=lectures.length+es.length+as.length;
    const done=lectureDone+examDone+assignmentComplete;
    const degrees=es.filter(hasDegree).map(e=>Number(e.degree)).filter(Number.isFinite);
    const average=degrees.length?degrees.reduce((a,b)=>a+b,0)/degrees.length:null;
    const upcomingExam=es.filter(e=>!isExamPast(e)).sort((a,b)=>{
      const av=dateTimeValue(a.day,a.time),bv=dateTimeValue(b.day,b.time);
      if(Number.isFinite(av)&&Number.isFinite(bv))return av-bv;
      if(Number.isFinite(av))return -1;if(Number.isFinite(bv))return 1;return 0;
    })[0]||null;
    const dueAssignments=as.filter(a=>!assignmentDone(a)&&a.dueDate);
    return {lectures,exams:es,assignments:as,lectureDone,examDone,assignmentComplete,total,done,progress:total?Math.round(done/total*100):0,degrees,average,upcomingExam,dueAssignments};
  }
  function plural(n,singular,pluralWord){ return `${n} ${n===1?singular:(pluralWord||singular+'s')}`; }
  function iconFor(subject){ return esc(subject.icon||'✎'); }
  function chapterName(subject){ return String(subject.chapter||subject.chapterName||'Chapter 1'); }

  function mainTabs(active){
    const tabs=[['All subjects','all subjects'],['Lectures','lectures'],['Exams','exams'],['Assignments','assignments']];
    return `<nav class="subject-r-tabs" aria-label="Subjects sections">${tabs.map(([label,key])=>`<button class="${active===key?'active':''}" data-subjects-route="${encodeURIComponent(label)}">${label}</button>`).join('')}</nav>`;
  }
  function detailTabs(subject,active){
    return `<nav class="subject-r-tabs" aria-label="${esc(subject.name)} sections">${['overview','lectures','exams','assignments'].map(key=>`<button class="${active===key?'active':''}" data-subject-detail-route="${key}" data-subject-id="${esc(subject.id)}">${key[0].toUpperCase()+key.slice(1)}</button>`).join('')}</nav>`;
  }
  function chapterControl(subject){
    const label=esc(chapterName(subject));
    return canContent('edit_content')
      ? `<button type="button" class="subject-r-chapter-button" data-edit-chapter="${esc(subject.id)}" aria-label="Edit chapter">${label} <span>⌄</span></button>`
      : `<span class="subject-r-chapter-static">${label}</span>`;
  }
  function pageTitle(title,subtitle,action='',chapter=''){
    return `<div class="subject-r-heading"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="subject-r-heading-actions">${chapter}${action}</div></div>`;
  }
  function metric(icon,value,label,tone='blue'){
    return `<article class="subject-r-metric ${tone}"><span>${icon}</span><div><strong>${esc(value)}</strong><small>${esc(label)}</small></div></article>`;
  }
  function emptyState(title,copy){
    return `<div class="subject-r-empty"><span>◇</span><strong>${esc(title)}</strong><p>${esc(copy)}</p></div>`;
  }

  function subjectListViewRedesign(){
    const list=[...state.subjects];
    const totals=list.reduce((acc,s)=>{
      const st=subjectStats(s);acc.lectures+=st.lectures.length;acc.exams+=st.exams.length;acc.due+=st.dueAssignments.filter(a=>{
        const t=assignmentDueTime(a);return Number.isFinite(t)&&t>=now()&&t<=now()+7*DAY;
      }).length;return acc;
    },{lectures:0,exams:0,due:0});
    return `<section class="subject-redesign-page subject-r-index">
      ${pageTitle('My Subjects','Manage lectures, exams, assignments, and progress across all subjects.',canContent('add_content')?'<button class="subject-r-primary" id="subject-r-new"><span>＋</span> New Subject</button>':'')}
      ${mainTabs('all subjects')}
      <div class="subject-r-tools">
        <label class="subject-r-search"><span>⌕</span><input id="subject-r-search" value="${esc(ui.search)}" placeholder="Search subjects…" autocomplete="off"></label>
        <label class="subject-r-filter"><span>☷</span><select id="subject-r-sort" aria-label="Sort subjects"><option value="name" ${ui.sort==='name'?'selected':''}>Name</option><option value="progress" ${ui.sort==='progress'?'selected':''}>Progress</option><option value="recent" ${ui.sort==='recent'?'selected':''}>Recent</option></select></label>
      </div>
      <div class="subject-r-metrics">
        ${metric('▥',list.length,'Subjects','blue')}
        ${metric('▶',totals.lectures,'Lectures','green')}
        ${metric('▤',totals.exams,'Exams','purple')}
        ${metric('▣',totals.due,'Due this week','red')}
      </div>
      <div class="subject-r-list" id="subject-r-list">${subjectCards(list)}</div>
      ${recentSection()}
    </section>`;
  }
  function recentMap(){
    const v=read(RECENT_KEY,[]);
    return Array.isArray(v)?v:[];
  }
  function touchRecent(subjectId){
    const recent=recentMap().filter(x=>x.id!==subjectId);
    recent.unshift({id:subjectId,at:now()});
    write(RECENT_KEY,recent.slice(0,8));
  }
  function recentSection(){
    const saved=recentMap().map(x=>({rec:x,subject:state.subjects.find(s=>s.id===x.id)})).filter(x=>x.subject).slice(0,3);
    if(!saved.length)return '';
    return `<section class="subject-r-recent"><header><h2>Recently accessed</h2></header><div>${saved.map(({rec,subject})=>`<button data-open-subject="${esc(subject.id)}"><strong>${esc(subject.name)}</strong><small>${relativeTime(rec.at)}</small></button>`).join('')}</div></section>`;
  }
  function relativeTime(at){
    const m=Math.max(0,Math.floor((now()-Number(at||now()))/60000));
    if(m<1)return 'Just now';if(m<60)return `${m} min ago`;
    const h=Math.floor(m/60);if(h<24)return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  }
  function subjectCards(input){
    const rec=new Map(recentMap().map(x=>[x.id,x.at]));
    const query=ui.search.trim().toLowerCase();
    let list=input.filter(s=>!query||String(s.name||'').toLowerCase().includes(query));
    list.sort((a,b)=>{
      if(ui.sort==='progress')return subjectStats(b).progress-subjectStats(a).progress;
      if(ui.sort==='recent')return Number(rec.get(b.id)||0)-Number(rec.get(a.id)||0);
      return String(a.name||'').localeCompare(String(b.name||''));
    });
    if(!list.length)return emptyState(query?'No subjects match':'No subjects yet',query?'Try a different search.':'Create your first subject to start organizing your coursework.');
    return list.map(subjectCardRedesign).join('');
  }
  function subjectCardRedesign(subject){
    const st=subjectStats(subject);
    const next=st.upcomingExam;
    return `<article class="subject-r-card" data-open-subject="${esc(subject.id)}" tabindex="0" role="button">
      <div class="subject-r-card-icon">${iconFor(subject)}</div>
      <div class="subject-r-card-body">
        <div class="subject-r-card-title"><h2>${esc(subject.name)}</h2><span class="subject-r-chapter-pill">${esc(chapterName(subject))}</span></div>
        <div class="subject-r-progress"><i><b style="width:${st.progress}%"></b></i><strong>${st.progress}%</strong></div>
        <div class="subject-r-card-meta">
          <span>▣ ${plural(st.lectures.length,'lecture')}</span><span>▤ ${plural(st.exams.length,'exam')}</span>
          <span>▦ ${next?`Next exam: ${esc(dateLabel(next.day))}`:'No upcoming exam'}</span>
        </div>
      </div>
    </article>`;
  }

  function aggregateLecturesView(){
    const rows=[];
    state.subjects.forEach(s=>subjectLectures(s.id).forEach(l=>rows.push({subject:s,lecture:l})));
    return `<section class="subject-redesign-page">
      ${pageTitle('Lectures','All lecture materials across your subjects.')}
      ${mainTabs('lectures')}
      <div class="subject-r-metrics two">${metric('▶',rows.length,'Total lectures')}${metric('◉',rows.filter(x=>Boolean(x.lecture.link)).length,'Recorded','red')}</div>
      <div class="subject-r-stack">${rows.length?rows.map(x=>lectureCard(x.subject,x.lecture,true)).join(''):emptyState('No lectures yet','Add a lecture from a subject workspace.')}</div>
    </section>`;
  }
  function aggregateExamsView(){
    const rows=[];
    state.subjects.forEach(s=>subjectExams(s).forEach(e=>rows.push({subject:s,exam:e})));
    return `<section class="subject-redesign-page">
      ${pageTitle('Exams','Upcoming exams and past results across all subjects.')}
      ${mainTabs('exams')}
      <div class="subject-r-metrics">${metric('▤',rows.length,'Total exams')}${metric('▣',rows.filter(x=>!isExamPast(x.exam)).length,'Upcoming','red')}${metric('✓',rows.filter(x=>isExamPast(x.exam)).length,'Past exams','purple')}${metric('▥',formatAverage(rows.filter(x=>hasDegree(x.exam)).map(x=>Number(x.exam.degree))),'Average degree','green')}</div>
      <div class="subject-r-stack">${rows.length?rows.map(x=>examCard(x.subject,x.exam,true)).join(''):emptyState('No exams yet','Add an exam from a subject workspace.')}</div>
    </section>`;
  }
  function aggregateAssignmentsView(){
    const v=suite(),rows=v.assignments.map(a=>({assignment:effectiveAssignment(a),subject:state.subjects.find(s=>s.id===a.subjectId)}));
    return `<section class="subject-redesign-page">
      ${pageTitle('Assignments','Track tasks, due dates, and submissions across all subjects.')}
      ${mainTabs('assignments')}
      <div class="subject-r-metrics">${metric('▣',rows.length,'Total')}${metric('!',rows.filter(x=>isDueToday(x.assignment)).length,'Due today','red')}${metric('↻',rows.filter(x=>x.assignment.status==='doing').length,'In progress','purple')}${metric('✓',rows.filter(x=>assignmentDone(x.assignment)).length,'Submitted','green')}</div>
      <div class="subject-r-stack">${rows.length?rows.map(x=>assignmentCard(x.subject||{id:'',name:'General',icon:'✓'},x.assignment,true)).join(''):emptyState('No assignments yet','Add an assignment from a subject workspace.')}</div>
    </section>`;
  }

  function subjectOverviewView(subject){
    const st=subjectStats(subject);
    const upcomingLecture=st.lectures.find(l=>!isLectureDone(l))||st.lectures[0]||null;
    const upcomingExams=st.exams.filter(e=>!isExamPast(e)).slice(0,2);
    const latest=st.exams.filter(hasDegree).slice().sort((a,b)=>dateTimeValue(b.day,b.time)-dateTimeValue(a.day,a.time)).slice(0,3);
    const outline=st.lectures.slice(0,6);
    return `<section class="subject-redesign-page subject-r-detail" data-subject-id="${esc(subject.id)}">
      ${pageTitle(subject.name,'Subject workspace and chapter progress.','')}
      ${detailTabs(subject,'overview')}
      <article class="subject-r-hero">
        <div class="subject-r-hero-icon">${iconFor(subject)}</div>
        <div class="subject-r-hero-copy"><h2>${esc(subject.name)}</h2>${chapterControl(subject)}<p>${esc(`${plural(st.lectures.length,'lecture')}, ${plural(st.exams.length,'exam')}, and ${plural(st.assignments.length,'assignment')} organized in this workspace.`)}</p></div>
        <strong class="subject-r-hero-progress">${st.progress}%</strong>
      </article>
      <div class="subject-r-metrics compact">
        ${metric('▶',st.lectures.length,st.lectures.length===1?'Lecture':'Lectures')}
        ${metric('▤',st.exams.length,st.exams.length===1?'Exam':'Exams','purple')}
        ${metric('▥',st.average===null?'—':formatNumber(st.average),'Average degree','green')}
        ${metric('!',st.dueAssignments.length,'Assignments due','red')}
      </div>
      <section class="subject-r-section"><h2>Upcoming lecture</h2>${upcomingLecture?lectureCard(subject,upcomingLecture,false):emptyState('No lecture scheduled','Add a lecture to this subject to see it here.')}</section>
      <section class="subject-r-section"><div class="subject-r-section-head"><h2>Upcoming exams</h2><button data-subject-detail-route="exams" data-subject-id="${esc(subject.id)}">See all</button></div>${upcomingExams.length?`<div class="subject-r-mini-list">${upcomingExams.map(e=>`<button data-open-exam="${esc(e.id)}" data-subject-id="${esc(subject.id)}"><span><strong>${esc(e.title||'Exam')}</strong><small>${esc(dateLabel(e.day))}${e.time?` · ${esc(e.time)}`:''}</small></span><b>Scheduled</b></button>`).join('')}</div>`:emptyState('No upcoming exams','Add an exam to this subject when the date is known.')}</section>
      <section class="subject-r-section"><h2>Chapter outline</h2>${outline.length?`<div class="subject-r-outline">${outline.map((l,i)=>{const p=isLectureDone(l)?100:0;return `<div><b>${i+1}</b><span><strong>${esc(l.name)}</strong><small>${esc((l.notes||'Lecture material').slice(0,80))}</small></span><em>${p}%</em><i><b style="width:${p}%"></b></i></div>`;}).join('')}</div>`:emptyState('No chapter content','Lectures added to this subject will form the chapter outline.')}</section>
      <section class="subject-r-section"><h2>Latest results</h2>${latest.length?`<div class="subject-r-results">${latest.map(e=>`<div><strong>${esc(e.title||'Exam')}</strong><span>${esc(dateLabel(e.day))}</span><b>${esc(formatNumber(Number(e.degree)))}</b></div>`).join('')}</div>`:emptyState('No graded results','Enter exam degrees to build the results history.')}</section>
      ${(canContent('add_content')||canPlan('add_content'))?'<button class="subject-r-wide-action" id="subject-r-add-content">＋ <span>Add content</span></button>':''}
    </section>`;
  }

  function subjectLecturesView(subject){
    const list=subjectLectures(subject.id);
    const filtered=list.filter(l=>ui.lectureFilter==='all'||(ui.lectureFilter==='recorded'&&Boolean(l.link)));
    return `<section class="subject-redesign-page subject-r-detail" data-subject-id="${esc(subject.id)}">
      ${pageTitle(`${subject.name} Lectures`,'Chapter materials and lecture schedule.',canContent('add_content')?'<button class="subject-r-primary" id="subject-r-add-lecture">＋ Add Lecture</button>':'',chapterControl(subject))}
      ${detailTabs(subject,'lectures')}
      <div class="subject-r-metrics two">${metric('▶',list.length,'Lectures')}${metric('◉',list.filter(l=>Boolean(l.link)).length,'Recorded','red')}</div>
      <div class="subject-r-filterbar two">${[['all','All'],['recorded','Recorded']].map(([key,label])=>`<button class="${ui.lectureFilter===key?'active':''}" data-lecture-filter="${key}">${label}</button>`).join('')}</div>
      <div class="subject-r-stack">${filtered.length?filtered.map(l=>lectureCard(subject,l,false)).join(''):emptyState('No lectures in this view','Add a lecture or choose another filter.')}</div>
      ${canContent('add_content')?'<button class="subject-r-wide-action" id="subject-r-add-lecture-bottom">＋ <span>Add Lecture</span></button>':''}
    </section>`;
  }
  function lectureCard(subject,lecture,showSubject){
    return `<article class="subject-r-row lecture" data-open-lecture="${esc(lecture.id)}" data-subject-id="${esc(subject.id)}" tabindex="0" role="button">
      <div class="subject-r-row-main"><h2>${esc(lecture.name)}</h2><p>${showSubject?`${esc(subject.name)} · `:''}${esc(lecture.notes||'Lecture material')}</p><small>${lecture.link?'🔗 Lecture link available':'No recording/link attached'}</small></div>
    </article>`;
  }

  function subjectExamsView(subject){
    const list=subjectExams(subject);
    const filtered=list.filter(e=>ui.examFilter==='all'||(ui.examFilter==='upcoming'&&!isExamPast(e))||(ui.examFilter==='past'&&isExamPast(e)));
    const degrees=list.filter(hasDegree).map(e=>Number(e.degree));
    const upcoming=filtered.filter(e=>!isExamPast(e));
    const past=filtered.filter(isExamPast);
    return `<section class="subject-redesign-page subject-r-detail" data-subject-id="${esc(subject.id)}">
      ${pageTitle(`${subject.name} Exams`,'Track upcoming exams and past results.',canPlan('add_content')?'<button class="subject-r-primary" id="subject-r-add-exam">＋ Add Exam</button>':'',chapterControl(subject))}
      ${detailTabs(subject,'exams')}
      <div class="subject-r-metrics">${metric('▤',list.length,'Total exams')}${metric('▣',list.filter(e=>!isExamPast(e)).length,'Upcoming','red')}${metric('✓',list.filter(isExamPast).length,'Past exams','purple')}${metric('▥',formatAverage(degrees),'Average degree','green')}</div>
      <div class="subject-r-filterbar three">${[['all','All'],['upcoming','Upcoming'],['past','Past']].map(([key,label])=>`<button class="${ui.examFilter===key?'active':''}" data-exam-filter="${key}">${label}</button>`).join('')}</div>
      <section class="subject-r-section"><div class="subject-r-section-head"><h2>Upcoming exams</h2></div><div class="subject-r-stack">${upcoming.length?upcoming.map(e=>examCard(subject,e,false)).join(''):emptyState('No upcoming exams','Nothing scheduled in this filter.')}</div></section>
      <section class="subject-r-section"><div class="subject-r-section-head"><h2>Past exams</h2></div><div class="subject-r-stack">${past.length?past.map(e=>examCard(subject,e,false)).join(''):emptyState('No past exams','Graded and completed exams will appear here.')}</div></section>
      ${canPlan('add_content')?'<button class="subject-r-wide-action" id="subject-r-add-exam-bottom">＋ <span>Add Exam</span></button>':''}
    </section>`;
  }
  function examCard(subject,exam,showSubject){
    const past=isExamPast(exam),degree=hasDegree(exam)?Number(exam.degree):null;
    return `<article class="subject-r-row exam" data-open-exam="${esc(exam.id)}" data-subject-id="${esc(subject.id)}" tabindex="0" role="button">
      <div class="subject-r-row-main"><h2>${esc(exam.title||'Exam')}</h2><small>▣ ${esc(past?'Taken':'Due')} ${esc(dateLabel(exam.day))}${exam.time?` · ${esc(exam.time)}`:''}</small><p>${showSubject?`${esc(subject.name)} · `:''}${esc(exam.notes||'Exam details')}</p></div>
      <div class="subject-r-row-badges"><span class="subject-r-status ${past?'done':'upcoming'}">${past?(degree!==null?'Graded':'Completed'):'Upcoming'}</span>${degree!==null?`<b>${esc(formatNumber(degree))}</b>`:''}</div>
    </article>`;
  }

  function subjectAssignmentsView(subject){
    const list=subjectAssignments(subject.id).slice().sort((a,b)=>{
      const av=assignmentDueTime(a),bv=assignmentDueTime(b);
      if(assignmentDone(a)!==assignmentDone(b))return assignmentDone(a)?1:-1;
      if(Number.isFinite(av)&&Number.isFinite(bv))return av-bv;
      return 0;
    });
    const filtered=list.filter(a=>ui.assignmentFilter==='all'||(ui.assignmentFilter==='due'&&isDueSoon(a))||(ui.assignmentFilter==='doing'&&a.status==='doing')||(ui.assignmentFilter==='done'&&assignmentDone(a)));
    const active=filtered.filter(a=>!assignmentDone(a)),history=list.filter(assignmentDone);
    return `<section class="subject-redesign-page subject-r-detail" data-subject-id="${esc(subject.id)}">
      ${pageTitle(`${subject.name} Assignments`,'Track tasks, due dates, and submissions.',canPlan('add_content')?'<button class="subject-r-primary" id="subject-r-add-assignment">＋ New Assignment</button>':'',chapterControl(subject))}
      ${detailTabs(subject,'assignments')}
      <div class="subject-r-metrics compact">${metric('',list.length,'Total')}${metric('',list.filter(isDueToday).length,'Due today','red')}${metric('',list.filter(a=>a.status==='doing').length,'In progress','purple')}${metric('',history.length,'Submitted','green')}</div>
      <div class="subject-r-filterbar">${[['all','All'],['due','Due soon'],['doing','In progress'],['done','Submitted']].map(([key,label])=>`<button class="${ui.assignmentFilter===key?'active':''}" data-assignment-r-filter="${key}">${label}</button>`).join('')}</div>
      <div class="subject-r-stack">${active.length?active.map(a=>assignmentCard(subject,a,false)).join(''):ui.assignmentFilter==='done'?'':emptyState('No active assignments','Your active tasks will appear here.')}</div>
      ${history.length?`<section class="subject-r-section"><h2>Submission history</h2><div class="subject-r-results">${history.map(a=>`<div data-open-assignment="${esc(a.id)}" data-subject-id="${esc(subject.id)}" tabindex="0" role="button"><strong>${esc(a.title)}</strong><span>${a.completedAt?`Submitted ${new Date(a.completedAt).toLocaleDateString()}`:'Submitted'}</span><b>Submitted</b></div>`).join('')}</div></section>`:''}
      ${canPlan('add_content')?'<button class="subject-r-wide-action" id="subject-r-add-assignment-bottom">＋ <span>New Assignment</span></button>':''}
    </section>`;
  }
  function isDueToday(a){
    if(!a.dueDate||assignmentDone(a))return false;
    const today=new Date();const key=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    return a.dueDate===key;
  }
  function isDueSoon(a){
    if(!a.dueDate||assignmentDone(a))return false;
    const t=assignmentDueTime(a);return Number.isFinite(t)&&t>=now()-DAY&&t<=now()+7*DAY;
  }
  function assignmentCard(subject,a,showSubject){
    const due=assignmentDueTime(a),overdue=Number.isFinite(due)&&due<now()&&!assignmentDone(a);
    const status=assignmentDone(a)?'Submitted':a.status==='doing'?'In progress':isDueSoon(a)?'Due soon':'Not started';
    return `<article class="subject-r-row assignment ${overdue?'overdue':''}" data-open-assignment="${esc(a.id)}" data-subject-id="${esc(subject.id||'')}" tabindex="0" role="button">
      <div class="subject-r-row-main"><h2>${esc(a.title)}</h2><small class="${overdue?'danger':''}">${a.dueDate?`${overdue?'Overdue':'Due'} ${esc(dateLabel(a.dueDate))}${a.dueTime?`, ${esc(a.dueTime)}`:''}`:'No due date'}</small><p>${showSubject?`${esc(subject.name)} · `:''}${esc(a.notes||'No extra notes.')}</p></div>
      <div class="subject-r-row-badges"><span class="subject-r-status ${assignmentDone(a)?'done':a.status==='doing'?'progress':isDueSoon(a)?'danger':'muted'}">${status}</span><b class="priority ${esc(a.priority||'medium')}">${esc((a.priority||'medium')[0].toUpperCase()+(a.priority||'medium').slice(1))}</b>${(canPlan('edit_content')||tracksPersonalAssignmentProgress())&&!assignmentDone(a)?'<button class="subject-r-open" type="button">Open</button>':''}</div>
    </article>`;
  }
  function formatNumber(value){ return Number.isInteger(value)?String(value):Number(value).toFixed(1); }
  function formatAverage(values){
    if(!values.length)return '—';
    const avg=values.reduce((a,b)=>a+b,0)/values.length;
    return `${formatNumber(avg)}${avg>=0&&avg<=100?'%':''}`;
  }

  function routeView(parts){
    if(parts[1]==='subject'){
      const subject=state.subjects.find(s=>s.id===decodeURIComponent(parts[2]||''));
      if(!subject)return subjectListViewRedesign();
      const tab=String(parts[3]||'overview').toLowerCase();
      if(tab==='lectures')return subjectLecturesView(subject);
      if(tab==='exams')return subjectExamsView(subject);
      if(tab==='assignments')return subjectAssignmentsView(subject);
      return subjectOverviewView(subject);
    }
    const sub=decodeURIComponent(parts.slice(1).join('/')).toLowerCase();
    if(!sub||sub==='all subjects')return subjectListViewRedesign();
    if(sub==='lectures')return aggregateLecturesView();
    if(sub==='exams')return aggregateExamsView();
    if(sub==='assignments')return aggregateAssignmentsView();
    return null;
  }

  const previousWorkspaceContent=workspaceContent;
  workspaceContent=function(page,parts,title){
    if(page==='subjects'){
      const view=routeView(parts);
      if(view!==null)return view;
    }
    return previousWorkspaceContent(page,parts,title);
  };

  const previousSubnav=subnav;
  subnav=function(main,sub,subject,subjectTab){
    if(main==='subjects')return '';
    return previousSubnav(main,sub,subject,subjectTab);
  };

  const previousWorkspace=workspace;
  workspace=function(current){
    previousWorkspace(current);
    if(current.split('/')[0]==='subjects')bindSubjectRedesign(current);
  };

  function bindSubjectRedesign(current){
    document.querySelectorAll('[data-subjects-route]').forEach(b=>b.addEventListener('click',()=>setHash(`subjects/${b.dataset.subjectsRoute}`)));
    document.querySelectorAll('[data-subject-detail-route]').forEach(b=>b.addEventListener('click',()=>setHash(`subjects/subject/${encodeURIComponent(b.dataset.subjectId)}/${b.dataset.subjectDetailRoute}`)));
    document.querySelectorAll('[data-open-subject]').forEach(el=>{
      const open=()=>{touchRecent(el.dataset.openSubject);setHash(`subjects/subject/${encodeURIComponent(el.dataset.openSubject)}/overview`);};
      el.addEventListener('click',open);
      el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
    });

    document.getElementById('subject-r-new')?.addEventListener('click',()=>openSubjectSheet());
    document.getElementById('subject-r-search')?.addEventListener('input',e=>{ui.search=e.target.value;const box=document.getElementById('subject-r-list');if(box)box.innerHTML=subjectCards(state.subjects);rebindSubjectCards();});
    document.getElementById('subject-r-sort')?.addEventListener('change',e=>{ui.sort=e.target.value;const box=document.getElementById('subject-r-list');if(box)box.innerHTML=subjectCards(state.subjects);rebindSubjectCards();});

    document.querySelectorAll('[data-lecture-filter]').forEach(b=>b.addEventListener('click',()=>{ui.lectureFilter=b.dataset.lectureFilter;render();}));
    document.querySelectorAll('[data-exam-filter]').forEach(b=>b.addEventListener('click',()=>{ui.examFilter=b.dataset.examFilter;render();}));
    document.querySelectorAll('[data-assignment-r-filter]').forEach(b=>b.addEventListener('click',()=>{ui.assignmentFilter=b.dataset.assignmentRFilter;render();}));

    const parts=current.split('/');
    const subject=parts[1]==='subject'?state.subjects.find(s=>s.id===decodeURIComponent(parts[2]||'')):null;
    const addLecture=()=>subject&&openLectureSheet(subject);
    document.getElementById('subject-r-add-lecture')?.addEventListener('click',addLecture);
    document.getElementById('subject-r-add-lecture-bottom')?.addEventListener('click',addLecture);
    document.getElementById('subject-r-add-exam')?.addEventListener('click',()=>subject&&openExamRedesign(subject));
    document.getElementById('subject-r-add-exam-bottom')?.addEventListener('click',()=>subject&&openExamRedesign(subject));
    document.getElementById('subject-r-add-assignment')?.addEventListener('click',()=>subject&&openAssignmentRedesign(subject));
    document.getElementById('subject-r-add-assignment-bottom')?.addEventListener('click',()=>subject&&openAssignmentRedesign(subject));
    document.getElementById('subject-r-add-content')?.addEventListener('click',()=>subject&&openAddContent(subject));
    document.querySelectorAll('[data-edit-chapter]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();const target=state.subjects.find(s=>s.id===button.dataset.editChapter);if(target)openChapterSheet(target);}));

    document.querySelectorAll('[data-open-lecture]').forEach(el=>{
      const open=()=>{const s=state.subjects.find(x=>x.id===el.dataset.subjectId);if(!s)return;const lecture=subjectLectures(s.id).find(x=>x.id===el.dataset.openLecture);if(canContent('edit_content')){openLectureSheet(s,el.dataset.openLecture);return;}openLectureDetails(s,lecture);};
      el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
    });
    document.querySelectorAll('[data-open-exam]').forEach(el=>{
      const open=()=>{const s=state.subjects.find(x=>x.id===el.dataset.subjectId);if(s)openExamRedesign(s,el.dataset.openExam);};
      el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
    });
    document.querySelectorAll('[data-open-assignment]').forEach(el=>{
      const open=()=>{const s=state.subjects.find(x=>x.id===el.dataset.subjectId)||subject;if(s)openAssignmentRedesign(s,el.dataset.openAssignment);};
      el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
    });
  }
  function rebindSubjectCards(){
    document.querySelectorAll('[data-open-subject]').forEach(el=>{
      const open=()=>{touchRecent(el.dataset.openSubject);setHash(`subjects/subject/${encodeURIComponent(el.dataset.openSubject)}/overview`);};
      el.addEventListener('click',open);
      el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
    });
  }

  function openAddContent(subject){
    const actions=[];
    if(canContent('add_content'))actions.push('<button data-add-kind="lecture"><span>▶</span><strong>Lecture</strong><small>Add material or a lecture link</small></button>');
    if(canPlan('add_content')){
      actions.push('<button data-add-kind="exam"><span>▤</span><strong>Exam</strong><small>Schedule an exam or record a result</small></button>');
      actions.push('<button data-add-kind="assignment"><span>✓</span><strong>Assignment</strong><small>Create coursework with a due date</small></button>');
    }
    if(!actions.length){showToast('You do not have permission to add content here.');return;}
    const root=document.getElementById('overlay-root');if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="subject-r-content-overlay"><section class="entity-sheet subject-r-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(subject.name)}</div><h2>Add content</h2></div><button class="icon-btn" id="subject-r-content-close">×</button></div><div class="subject-r-content-actions">${actions.join('')}</div></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('subject-r-content-close').onclick=close;
    document.getElementById('subject-r-content-overlay').onclick=e=>{if(e.target.id==='subject-r-content-overlay')close();};
    root.querySelectorAll('[data-add-kind]').forEach(b=>b.onclick=()=>{const kind=b.dataset.addKind;close();if(kind==='lecture')openLectureSheet(subject);if(kind==='exam')openExamRedesign(subject);if(kind==='assignment')openAssignmentRedesign(subject);});
  }

  function openChapterSheet(subject){
    if(!canContent('edit_content'))return;
    const root=document.getElementById('overlay-root');if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="subject-r-chapter-overlay"><section class="entity-sheet subject-r-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(subject.name)}</div><h2>Chapter</h2></div><button class="icon-btn" id="subject-r-chapter-close">×</button></div><form id="subject-r-chapter-form"><div class="field"><label>Chapter name</label><input id="subject-r-chapter-input" maxlength="80" required value="${esc(chapterName(subject))}" placeholder="e.g. Chapter 1"></div><button class="btn btn-primary entity-submit">Save chapter</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('subject-r-chapter-close').onclick=close;
    document.getElementById('subject-r-chapter-overlay').onclick=e=>{if(e.target.id==='subject-r-chapter-overlay')close();};
    document.getElementById('subject-r-chapter-form').onsubmit=e=>{e.preventDefault();const value=document.getElementById('subject-r-chapter-input').value.trim();if(!value)return;subject.chapter=value;saveSubjects();close();render();};
  }

  function readOnlySheet(subject,title,rows,action=''){
    const root=document.getElementById('overlay-root');if(!root)return null;
    root.innerHTML=`<div class="entity-sheet-overlay" id="subject-r-readonly-overlay"><section class="entity-sheet subject-r-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(subject.name)}</div><h2>${esc(title)}</h2></div><button class="icon-btn" id="subject-r-readonly-close">×</button></div><div class="subject-r-readonly">${rows.map(([label,value])=>`<div><small>${esc(label)}</small><strong>${esc(value||'—')}</strong></div>`).join('')}</div>${action}</section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('subject-r-readonly-close').onclick=close;
    document.getElementById('subject-r-readonly-overlay').onclick=e=>{if(e.target.id==='subject-r-readonly-overlay')close();};
    return {root,close};
  }
  function openLectureDetails(subject,lecture){
    if(!lecture)return;
    const link=String(lecture.link||'').trim();
    const action=link?'<button class="btn btn-primary entity-submit" id="subject-r-open-lecture-link">Open lecture link</button>':'';
    readOnlySheet(subject,lecture.name,[['Notes',lecture.notes||'No notes added.'],['Link',link||'No link attached.']],action);
    document.getElementById('subject-r-open-lecture-link')?.addEventListener('click',()=>{let raw=link;if(!/^https?:\/\//i.test(raw))raw='https://'+raw;try{const url=new URL(raw);if(!['http:','https:'].includes(url.protocol))throw new Error();const win=window.open(url.href,'_blank','noopener,noreferrer');if(win)win.opener=null;}catch{showToast('The lecture link is invalid.');}});
  }
  function openExamDetails(subject,exam){
    readOnlySheet(subject,exam.title||'Exam',[
      ['Date',dateLabel(exam.day)+(exam.time?' · '+exam.time:'')],
      ['Status',isExamPast(exam)?(hasDegree(exam)?'Graded':'Completed'):'Upcoming'],
      ['Degree',hasDegree(exam)?formatNumber(Number(exam.degree)):'Not entered'],
      ['Notes',exam.notes||'No notes added.']
    ]);
  }
  function openAssignmentDetails(subject,assignment){
    readOnlySheet(subject,assignment.title,[
      ['Due',assignment.dueDate?dateLabel(assignment.dueDate)+(assignment.dueTime?' · '+assignment.dueTime:''):'No due date'],
      ['Status',assignmentDone(assignment)?'Submitted':assignment.status==='doing'?'In progress':'Not started'],
      ['Priority',(assignment.priority||'medium')[0].toUpperCase()+(assignment.priority||'medium').slice(1)],
      ['Notes',assignment.notes||'No notes added.']
    ]);
  }

  function openExamRedesign(subject,examId=''){
    const all=exams(),exam=all.find(e=>e.id===examId);
    if(exam ? !canPlan('edit_content') : !canPlan('add_content')){ if(exam)openExamDetails(subject,exam); return; }
    const root=document.getElementById('overlay-root');if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="subject-r-exam-overlay"><section class="entity-sheet subject-r-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(subject.name)} · Exam</div><h2>${exam?'Edit exam':'Add exam'}</h2></div><button class="icon-btn" id="subject-r-exam-close">×</button></div><form id="subject-r-exam-form">
      <div class="field"><label>Exam title</label><input id="subject-r-exam-title" required maxlength="120" value="${esc(exam?.title||'')}" placeholder="e.g. Midterm Grammar Test"></div>
      <div class="suite-form-grid"><div class="field"><label>Date</label><input id="subject-r-exam-date" type="date" value="${esc(/^\d{4}-\d{2}-\d{2}$/.test(String(exam?.day||''))?exam.day:'')}"></div><div class="field"><label>Time</label><input id="subject-r-exam-time" type="time" value="${esc(normalizeTime(exam?.time||''))}"></div></div>
      <div class="suite-form-grid"><div class="field"><label>Status</label><select id="subject-r-exam-status"><option value="upcoming" ${!exam||!isExamPast(exam)?'selected':''}>Upcoming</option><option value="completed" ${exam&&isExamPast(exam)?'selected':''}>Completed</option></select></div>${schoolProgram()?`<div class="field"><label>Your degree <span class="field-optional">optional</span></label><input id="subject-r-exam-degree" type="number" step="any" min="0" value="${esc(exam?.degree??'')}" placeholder="e.g. 90"></div>`:'<div class="field subject-r-field-note"><label>Individual result</label><p>Grades are personal and are not written into the shared course exam.</p></div>'}</div>
      <div class="field"><label>Notes</label><textarea id="subject-r-exam-notes" placeholder="Chapters, topics, location…">${esc(exam?.notes||'')}</textarea></div>
      <div class="suite-sheet-actions">${exam&&canPlan('remove_content')?'<button class="btn btn-danger" type="button" id="subject-r-exam-delete">Delete</button>':'<span></span>'}<button class="btn btn-primary" type="submit">${exam?'Save changes':'Add Exam'}</button></div>
    </form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('subject-r-exam-close').onclick=close;
    document.getElementById('subject-r-exam-overlay').onclick=e=>{if(e.target.id==='subject-r-exam-overlay')close();};
    document.getElementById('subject-r-exam-delete')?.addEventListener('click',()=>{if(confirm('Delete this exam?')){saveExams(all.filter(e=>e.id!==exam.id));close();render();}});
    document.getElementById('subject-r-exam-form').onsubmit=e=>{
      e.preventDefault();
      const title=document.getElementById('subject-r-exam-title').value.trim();if(!title)return;
      const date=document.getElementById('subject-r-exam-date').value;
      const time=document.getElementById('subject-r-exam-time').value;
      const status=document.getElementById('subject-r-exam-status').value;
      const degreeInput=document.getElementById('subject-r-exam-degree');
      const rawDegree=degreeInput?degreeInput.value.trim():'';
      const payload={...(exam||{}),id:exam?.id||uid('exam'),subject:subject.name,subjectId:subject.id,title,day:date,time,status,degree:schoolProgram()?(rawDegree===''?null:Number(rawDegree)):null,notes:document.getElementById('subject-r-exam-notes').value.trim()};
      if(exam)Object.assign(exam,payload);else all.push(payload);
      saveExams(all);close();render();
    };
  }
  function normalizeTime(value){
    const text=String(value||'').trim();
    if(/^\d{2}:\d{2}$/.test(text))return text;
    const m=text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if(!m)return '';
    let h=Number(m[1]);if(m[3].toUpperCase()==='PM'&&h<12)h+=12;if(m[3].toUpperCase()==='AM'&&h===12)h=0;
    return `${String(h).padStart(2,'0')}:${m[2]}`;
  }

  function openAssignmentProgress(subject,assignment){
    const current=effectiveAssignment(assignment),root=document.getElementById('overlay-root');if(!root)return;
    const currentStatus=current.status==='doing'?'doing':current.status==='done'?'done':'todo';
    root.innerHTML=`<div class="entity-sheet-overlay" id="subject-r-progress-overlay"><section class="entity-sheet subject-r-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(subject.name)} · Assignment</div><h2>${esc(assignment.title)}</h2></div><button class="icon-btn" id="subject-r-progress-close">×</button></div><form id="subject-r-progress-form"><div class="subject-r-readonly"><div><small>Due</small><strong>${esc(assignment.dueDate?dateLabel(assignment.dueDate)+(assignment.dueTime?' · '+assignment.dueTime:''):'No due date')}</strong></div><div><small>Requirements</small><strong>${esc(assignment.notes||'No extra notes.')}</strong></div></div><div class="field"><label>Your status</label><select id="subject-r-progress-status"><option value="todo" ${currentStatus==='todo'?'selected':''}>Not started</option><option value="doing" ${currentStatus==='doing'?'selected':''}>In progress</option><option value="done" ${currentStatus==='done'?'selected':''}>Submitted</option></select></div><div class="field"><label>Submission note <span class="field-optional">optional</span></label><textarea id="subject-r-progress-note" maxlength="2000" rows="5" placeholder="Add a note about your work or submission…">${esc(current.submissionNote||'')}</textarea></div><button class="btn btn-primary entity-submit" type="submit">Save progress</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('subject-r-progress-close').onclick=close;
    document.getElementById('subject-r-progress-overlay').onclick=e=>{if(e.target.id==='subject-r-progress-overlay')close();};
    document.getElementById('subject-r-progress-form').onsubmit=e=>{e.preventDefault();const status=document.getElementById('subject-r-progress-status').value;saveAssignmentProgress(assignment.id,{status,submissionNote:document.getElementById('subject-r-progress-note').value.trim(),submittedAt:current.completedAt||null});close();render();};
  }

  function openAssignmentRedesign(subject,assignmentId=''){
    const value=suite(),assignment=value.assignments.find(a=>a.id===assignmentId);
    if(assignment&&!canPlan('edit_content')){ if(tracksPersonalAssignmentProgress())openAssignmentProgress(subject,assignment);else openAssignmentDetails(subject,effectiveAssignment(assignment)); return; }
    if(!assignment&&!canPlan('add_content'))return;
    const root=document.getElementById('overlay-root');if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="subject-r-assignment-overlay"><section class="entity-sheet subject-r-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">${esc(subject.name)} · Assignment</div><h2>${assignment?'Edit assignment':'New assignment'}</h2></div><button class="icon-btn" id="subject-r-assignment-close">×</button></div><form id="subject-r-assignment-form">
      <div class="field"><label>Assignment</label><input id="subject-r-assignment-title" required maxlength="140" value="${esc(assignment?.title||'')}" placeholder="e.g. Grammar Exercise 1"></div>
      <div class="suite-form-grid"><div class="field"><label>Due date</label><input id="subject-r-assignment-date" type="date" value="${esc(assignment?.dueDate||'')}"></div><div class="field"><label>Due time</label><input id="subject-r-assignment-time" type="time" value="${esc(assignment?.dueTime||'')}"></div></div>
      <div class="suite-form-grid"><div class="field"><label>Priority</label><select id="subject-r-assignment-priority"><option value="low" ${assignment?.priority==='low'?'selected':''}>Low</option><option value="medium" ${!assignment||assignment.priority==='medium'?'selected':''}>Medium</option><option value="high" ${assignment?.priority==='high'?'selected':''}>High</option></select></div>${schoolProgram()?`<div class="field"><label>Status</label><select id="subject-r-assignment-status"><option value="todo" ${!assignment||assignment.status==='todo'?'selected':''}>Not started</option><option value="doing" ${assignment?.status==='doing'?'selected':''}>In progress</option><option value="done" ${assignment?.status==='done'?'selected':''}>Submitted</option></select></div>`:'<div class="field subject-r-field-note"><label>Student progress</label><p>Each student tracks their own progress separately from this shared assignment.</p></div>'}</div>
      <div class="field"><label>Notes</label><textarea id="subject-r-assignment-notes" placeholder="Requirements, submission details, checklist…">${esc(assignment?.notes||'')}</textarea></div>
      <div class="suite-sheet-actions">${assignment&&canPlan('remove_content')?'<button class="btn btn-danger" type="button" id="subject-r-assignment-delete">Delete</button>':'<span></span>'}<button class="btn btn-primary" type="submit">${assignment?'Save changes':'Create Assignment'}</button></div>
    </form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('subject-r-assignment-close').onclick=close;
    document.getElementById('subject-r-assignment-overlay').onclick=e=>{if(e.target.id==='subject-r-assignment-overlay')close();};
    document.getElementById('subject-r-assignment-delete')?.addEventListener('click',()=>{if(confirm('Delete this assignment?')){value.assignments=value.assignments.filter(a=>a.id!==assignment.id);saveSuite(value);close();render();}});
    document.getElementById('subject-r-assignment-form').onsubmit=e=>{
      e.preventDefault();
      const title=document.getElementById('subject-r-assignment-title').value.trim();if(!title)return;
      const statusInput=document.getElementById('subject-r-assignment-status');
      const status=schoolProgram()?(statusInput?.value||'todo'):'todo';
      const payload={...(assignment||{}),id:assignment?.id||uid('asg'),title,subjectId:subject.id,dueDate:document.getElementById('subject-r-assignment-date').value,dueTime:document.getElementById('subject-r-assignment-time').value,priority:document.getElementById('subject-r-assignment-priority').value,status,notes:document.getElementById('subject-r-assignment-notes').value.trim(),createdAt:assignment?.createdAt||now(),updatedAt:now(),completedAt:schoolProgram()&&status==='done'?(assignment?.completedAt||now()):null};
      if(assignment)Object.assign(assignment,payload);else value.assignments.unshift(payload);
      saveSuite(value);close();render();
    };
  }

  window.DafatiiSubjectRedesign = Object.freeze({
    subjectStats,
    routeView
  });
})();
