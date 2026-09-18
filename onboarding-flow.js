(() => {
  'use strict';

  const KEY='dafatii:onboarding:v1';
  const LEVELS=['beginner','intermediate','advanced','expert'];
  const SUBJECT_ICONS={arabic:'✎',english:'Aa',math:'∑',chemistry:'🧪',physics:'⚛',biology:'🧬',islamic_book:'📚'};
  let teacherCatalog=null,teacherStep=0,view='auto',chosenField='',chosenLevel='',busy=false,message='',waitingCourseId='',resolving=null,resolveGeneration=0;

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const user=()=>window.DafatiiAuth?.user||null;
  const isAdmin=()=>user()?.platformRole==='admin';
  const isSchool=()=>user()?.accountType==='student'&&user()?.studentStage==='school';
  const isHigher=()=>user()?.accountType==='student'&&user()?.studentStage==='university';
  const read=()=>window.DafatiiData?.readJSON?.(KEY,null);
  const write=patch=>{
    const previous=read()||{version:1,required:true,primaryComplete:false,recommendationComplete:false,completed:false};
    const next={...previous,...patch,version:1,updatedAt:Date.now()};
    window.DafatiiData?.writeJSON?.(KEY,next);
    return next;
  };
  const activeNormal=()=>window.DafatiiCourses?.list?.().find(course=>course.membership?.status==='active'&&!course.isSchoolProgram)||null;
  const schoolProgram=()=>window.DafatiiCourses?.list?.().find(course=>course.isSchoolProgram)||null;
  const publicCourses=()=>window.DafatiiCourses?.list?.().filter(course=>course.status==='active'&&course.visibility==='public'&&String(course.learningField||'').trim())||[];
  const timeoutError=label=>new Error(`${label} is taking too long. Check your connection and try again.`);
  const withDeadline=(promise,label,milliseconds=15000)=>Promise.race([
    Promise.resolve(promise),
    new Promise((_,reject)=>setTimeout(()=>reject(timeoutError(label)),milliseconds))
  ]);
  async function apiWithDeadline(path,options={},milliseconds=15000){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),milliseconds);
    try{return await window.DafatiiApi.request(path,{...options,signal:controller.signal});}
    catch(error){if(error?.name==='AbortError')throw timeoutError('This setup step');throw error;}
    finally{clearTimeout(timer);}
  }

  function needsLegacyRecovery(){
    if(isSchool())return !schoolProgram()&&!window.DafatiiSchoolWorkspaceReady;
    if(isHigher())return !activeNormal();
    return false;
  }

  function blocks(){
    if(!user()||isAdmin()||user()?.accountType!=='student')return false;
    const record=read();
    if(record?.completed||record?.required===false)return false;
    if(record?.required)return true;
    return needsLegacyRecovery();
  }

  function ensureRecoveryRecord(){
    let record=read();
    if(!record&&needsLegacyRecovery()){
      record=write({required:true,primaryComplete:false,recommendationComplete:true,completed:false,legacyRecovery:true,createdAt:Date.now()});
    }
    return record;
  }

  const shell=(body,process,step,total)=>`<div class="onboarding-page"><div class="onboarding-backdrop"></div><main class="onboarding-card">
    <header class="onboarding-head"><a class="onboarding-brand" href="#landing"><span>D</span><strong>dafatii</strong></a>
      <div class="onboarding-progress-copy"><small>Process ${process} of 2</small><strong>${step}</strong></div></header>
    <div class="onboarding-progress" aria-hidden="true"><span style="width:${Math.max(4,Math.min(100,Number(total?step/total*100:0)))}%"></span></div>
    ${body}
  </main></div>`;

  const errorView=text=>shell(`<section class="onboarding-section"><div class="onboarding-kicker">Setup</div><h1>We could not continue this step.</h1><p>${esc(text||'Please try again.')}</p><button class="btn btn-primary" data-onboarding-retry>Try again</button></section>`,1,1,1);

  async function loadTeachers(force=false){
    if(teacherCatalog&&!force)return teacherCatalog;
    teacherCatalog=await apiWithDeadline('/school/teachers',{idempotent:true});
    const missing=teacherCatalog.subjects?.findIndex(item=>!item.selectedTeacherId)??-1;
    teacherStep=missing>=0?missing:0;
    return teacherCatalog;
  }

  function registerSchoolProgram(){
    if(teacherCatalog?.complete)window.DafatiiSchoolTeachers?.register?.(teacherCatalog);
    return Boolean(schoolProgram()||window.DafatiiCourses?.active?.()?.isSchoolProgram);
  }

  function teacherView(){
    const item=teacherCatalog?.subjects?.[teacherStep];
    if(!item)return errorView('Teacher directory is unavailable.');
    const selected=item.selectedTeacherId||'';
    const cards=(item.teachers||[]).map((teacher,index)=>`<button type="button" class="onboarding-teacher ${selected===teacher.id?'selected':''}" data-onboarding-teacher="${esc(teacher.id)}" ${busy?'disabled':''}>
      <span class="onboarding-teacher-rank">${index+1}</span>
      <span class="onboarding-teacher-avatar">${teacher.imageUrl?`<img src="${esc(teacher.imageUrl)}" alt="" loading="lazy">`:esc((teacher.displayName||'T').slice(0,1).toUpperCase())}</span>
      <span><strong>${esc(teacher.displayName)}</strong><small>${esc(Number(teacher.selectionCount||0)?teacher.selectionCount+' students selected this teacher':teacher.institution||'Teacher')}</small></span>
      ${selected===teacher.id?'<b>✓</b>':''}</button>`).join('');
    const last=teacherStep===(teacherCatalog.subjects?.length||1)-1;
    return shell(`<section class="onboarding-section">
      <div class="onboarding-kicker">Choose your teachers · ${teacherStep+1}/7</div>
      <h1>${esc(item.subject.replaceAll('_',' '))}</h1>
      <p>Choose one teacher for this subject. The list already matches your academic level, stage and field.</p>
      <div class="onboarding-teacher-list">${cards||'<div class="onboarding-empty">No matching teacher has been published for this subject yet.</div>'}</div>
      <footer class="onboarding-actions"><button class="btn btn-ghost" data-onboarding-teacher-prev ${teacherStep===0?'disabled':''}>Previous</button>
      <button class="btn btn-primary" data-onboarding-teacher-next ${!selected||busy?'disabled':''}>${busy?'Saving…':last?'Finish teacher setup':'Next'} →</button></footer>
      ${message?`<p class="onboarding-status">${esc(message)}</p>`:''}
    </section>`,1,teacherStep+1,7);
  }

  function foundationChoice(){
    const profile=window.DafatiiData?.readJSON?.('dafatii:studentProfile:v2',{})||{};
    const identity=[profile.academicLevel,profile.academicStage,profile.academicField].filter(Boolean).map(value=>String(value).replaceAll('_',' ')).join(' · ');
    return shell(`<section class="onboarding-section"><div class="onboarding-kicker">Your first course</div><h1>Create or join a Course.</h1>
      <p>Your first workspace must be ready before Dafatii recommends optional public Courses. ${identity?`Your private Course will be locked to <strong>${esc(identity)}</strong>.`:''}</p>
      <div class="onboarding-choice-grid">
        <button class="onboarding-choice" data-foundation-create><span>＋</span><strong>Create a private Course</strong><small>Only you and people with its access code can join.</small></button>
        <button class="onboarding-choice" data-foundation-join><span>→</span><strong>Join an existing Course</strong><small>Use an enrollment code supplied by the Course owner.</small></button>
      </div></section>`,1,1,2);
  }

  function createCourseView(){
    const templates=window.DafatiiCourses?.templates?.()||['Computer Science'];
    return shell(`<section class="onboarding-section"><div class="onboarding-kicker">Create your first Course</div><h1>Private by design.</h1>
      <p>Your academic level, stage and field are attached from your signup profile and cannot be changed for this Course.</p>
      <form class="onboarding-form" data-foundation-create-form>
        <label>Course name<input name="name" maxlength="120" required></label>
        <label>Content template<select name="templateName">${templates.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}</select></label>
        <label>Private access code<input name="accessCode" type="password" minlength="6" maxlength="64" required></label>
        <div class="onboarding-lock-note">Private Course · academic identity locked to your student profile</div>
        <footer class="onboarding-actions"><button type="button" class="btn btn-ghost" data-foundation-back>Back</button><button class="btn btn-primary" type="submit" ${busy?'disabled':''}>${busy?'Creating…':'Create Course'} →</button></footer>
        <p class="onboarding-status">${esc(message)}</p>
      </form></section>`,1,2,2);
  }

  function joinCourseView(){
    return shell(`<section class="onboarding-section"><div class="onboarding-kicker">Join your first Course</div><h1>Enter the enrollment code.</h1>
      <p>If the Course is private, add its private access code too.</p>
      <form class="onboarding-form" data-foundation-join-form>
        <label>Enrollment code<input name="course" maxlength="36" required></label>
        <label>Private access code <small>if required</small><input name="accessCode" type="password" minlength="6" maxlength="64"></label>
        <label>Application note <small>optional</small><textarea name="note" maxlength="500"></textarea></label>
        <footer class="onboarding-actions"><button type="button" class="btn btn-ghost" data-foundation-back>Back</button><button class="btn btn-primary" type="submit" ${busy?'disabled':''}>${busy?'Submitting…':'Join Course'} →</button></footer>
        <p class="onboarding-status">${esc(message)}</p>
      </form></section>`,1,2,2);
  }

  function waitingView(){
    return shell(`<section class="onboarding-section"><div class="onboarding-kicker">Enrollment submitted</div><h1>Your Course is not active yet.</h1>
      <p>This Course requires approval or payment verification. The recommendation process starts after you have an active first Course.</p>
      <button class="btn btn-primary" data-foundation-refresh ${busy?'disabled':''}>${busy?'Checking…':'Check enrollment status'}</button>
      <button class="btn btn-ghost" data-foundation-back>Use another Course</button><p class="onboarding-status">${esc(message)}</p></section>`,1,2,2);
  }

  function recommendationIntent(){
    return shell(`<section class="onboarding-section onboarding-question"><div class="onboarding-kicker">Optional learning · Question 1</div>
      <h1>Do you want to learn new things?</h1><p>Dafatii can recommend public Courses created by the administrator. This does not replace your main Course.</p>
      <div class="onboarding-answer-grid"><button class="btn btn-primary" data-recommend-intent="yes" ${busy?'disabled':''}>${busy?'Loading…':'Yes, continue →'}</button><button class="btn btn-ghost" data-recommend-intent="no" ${busy?'disabled':''}>No, finish setup</button></div>
      ${message?`<p class="onboarding-status">${esc(message)}</p>`:''}
    </section>`,2,1,3);
  }

  function fieldView(){
    const fields=[...new Set(publicCourses().map(course=>String(course.learningField||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    return shell(`<section class="onboarding-section onboarding-question"><div class="onboarding-kicker">Optional learning · Question 2</div>
      <h1>What do you want to learn?</h1><p>These fields come directly from the public Courses currently published by the administrator.</p>
      <div class="onboarding-field-grid">${fields.map(field=>`<button class="onboarding-field ${chosenField===field?'selected':''}" data-recommend-field="${esc(field)}"><strong>${esc(field)}</strong><small>${publicCourses().filter(course=>course.learningField===field).length} public Course(s)</small></button>`).join('')||'<div class="onboarding-empty">No categorized public Courses are available yet.</div>'}</div>
      <footer class="onboarding-actions"><button class="btn btn-ghost" data-recommend-back="intent">Back</button>${fields.length?'':'<button class="btn btn-primary" data-recommend-finish>No recommendations now →</button>'}</footer>
    </section>`,2,2,3);
  }

  function levelView(){
    return shell(`<section class="onboarding-section onboarding-question"><div class="onboarding-kicker">Optional learning · Question 3</div>
      <h1>What is your current level in ${esc(chosenField)}?</h1><p>Choose the closest level so we can rank matching public Courses.</p>
      <div class="onboarding-level-grid">${LEVELS.map(level=>`<button class="onboarding-level" data-recommend-level="${level}"><strong>${level[0].toUpperCase()+level.slice(1)}</strong></button>`).join('')}</div>
      <footer class="onboarding-actions"><button class="btn btn-ghost" data-recommend-back="field">Back</button></footer>
    </section>`,2,3,3);
  }

  function recommendationResults(){
    const sameField=publicCourses().filter(course=>course.learningField===chosenField);
    const exact=sameField.filter(course=>course.difficultyLevel===chosenLevel);
    const results=exact.length?exact:sameField;
    const cards=results.map(course=>`<article class="onboarding-course"><div><small>${esc(course.learningField)} · ${esc(course.difficultyLevel||'beginner')}</small><h2>${esc(course.name)}</h2><p>${esc(course.description||course.institution||'Public Course')}</p></div>
      ${course.membership?.status==='active'?'<button class="btn btn-ghost" disabled>Already enrolled</button>':course.membership?.status?`<button class="btn btn-ghost" disabled>${esc(course.membership.status)}</button>`:`<button class="btn btn-primary" data-recommend-enroll="${esc(course.enrollmentCode)}" ${busy?'disabled':''}>Enroll</button>`}</article>`).join('');
    return shell(`<section class="onboarding-section"><div class="onboarding-kicker">Recommended public Courses</div><h1>${exact.length?'Best matches':'Closest matches'} for ${esc(chosenField)}.</h1>
      <p>${exact.length?`Matched to your ${esc(chosenLevel)} level.`:'No exact difficulty match is published, so these are the closest Courses in your chosen field.'}</p>
      <div class="onboarding-course-list">${cards||'<div class="onboarding-empty">No public Course currently matches this field.</div>'}</div>
      <footer class="onboarding-actions"><button class="btn btn-ghost" data-recommend-back="level">Back</button><button class="btn btn-primary" data-recommend-finish>Continue to workspace →</button></footer>
      <p class="onboarding-status">${esc(message)}</p>
    </section>`,2,3,3);
  }

  async function finish(){
    write({required:false,primaryComplete:true,recommendationComplete:true,completed:true,completedAt:Date.now()});
    if(isSchool())registerSchoolProgram();
    view='auto';message='';
    location.hash='dashboard/Overview';
    window.render?.();
    queueMicrotask(()=>{if(!isSchool())window.DafatiiCourses?.refresh?.().catch(()=>{});});
  }

  async function determineView(){
    let record=ensureRecoveryRecord()||read();
    if(!record)return;

    if(isSchool()){
      try{await loadTeachers(false);}catch(error){message=error.message||String(error);view='teacher-error';return;}
      if(!teacherCatalog.complete){view='teachers';return;}
      registerSchoolProgram();
      if(!record.primaryComplete){record=write({primaryComplete:true});}
    }else if(isHigher()){
      if(!activeNormal()){if(!['create','join','waiting'].includes(view))view='foundation';return;}
      if(!record.primaryComplete){record=write({primaryComplete:true});}
    }else{
      await finish();return;
    }

    if(record.legacyRecovery&&record.recommendationComplete){await finish();return;}
    if(record.recommendationComplete){await finish();return;}
    if(!['recommend-field','recommend-level','recommend-results'].includes(view))view='recommend-intent';
  }

  function markup(){
    if(view==='teachers')return teacherView();
    if(view==='teacher-error')return errorView(message);
    if(view==='foundation')return foundationChoice();
    if(view==='create')return createCourseView();
    if(view==='join')return joinCourseView();
    if(view==='waiting')return waitingView();
    if(view==='recommend-intent')return recommendationIntent();
    if(view==='recommend-field')return fieldView();
    if(view==='recommend-level')return levelView();
    if(view==='recommend-results')return recommendationResults();
    return errorView('We could not determine the next onboarding step. Tap Try again.');
  }

  function bind(){
    document.querySelector('[data-onboarding-retry]')?.addEventListener('click',()=>{teacherCatalog=null;message='';view='auto';void render(true);});
    document.querySelectorAll('[data-onboarding-teacher]').forEach(button=>button.addEventListener('click',async()=>{
      if(busy)return;const item=teacherCatalog?.subjects?.[teacherStep];if(!item)return;
      busy=true;message='';draw();
      try{teacherCatalog=await apiWithDeadline(`/school/teachers/${encodeURIComponent(item.subject)}`,{method:'PUT',body:{teacherId:button.dataset.onboardingTeacher}});}
      catch(error){message=error.message||String(error);}
      busy=false;draw();
    }));
    document.querySelector('[data-onboarding-teacher-prev]')?.addEventListener('click',()=>{teacherStep=Math.max(0,teacherStep-1);draw();});
    document.querySelector('[data-onboarding-teacher-next]')?.addEventListener('click',async()=>{
      const item=teacherCatalog?.subjects?.[teacherStep];if(!item?.selectedTeacherId||busy)return;
      if(teacherStep<(teacherCatalog.subjects?.length||1)-1){teacherStep+=1;draw();return;}
      busy=true;draw();
      try{
        if(!teacherCatalog?.complete){teacherStep=teacherCatalog?.subjects?.findIndex(subject=>!subject.selectedTeacherId)??0;busy=false;draw();return;}
        registerSchoolProgram();write({primaryComplete:true});view='recommend-intent';
      }catch(error){message=error.message||String(error);}
      busy=false;draw();
    });

    document.querySelector('[data-foundation-create]')?.addEventListener('click',()=>{message='';view='create';draw();});
    document.querySelector('[data-foundation-join]')?.addEventListener('click',()=>{message='';view='join';draw();});
    document.querySelectorAll('[data-foundation-back]').forEach(button=>button.addEventListener('click',()=>{message='';waitingCourseId='';view='foundation';draw();}));
    document.querySelector('[data-foundation-create-form]')?.addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;const data=Object.fromEntries(new FormData(event.currentTarget));busy=true;message='';draw();
      try{
        await window.DafatiiCourses.createCourse({name:data.name,templateName:data.templateName,visibility:'private',accessCode:data.accessCode,joinPolicy:'direct',pricing:'free',priceMinor:0,currency:'USD',stage:'university'},data.templateName);
        write({primaryComplete:true});view='recommend-intent';
      }catch(error){message=error.message||String(error);view='create';}
      busy=false;draw();
    });
    document.querySelector('[data-foundation-join-form]')?.addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;const data=Object.fromEntries(new FormData(event.currentTarget));busy=true;message='';draw();
      try{
        const result=await window.DafatiiCourses.enroll(data);waitingCourseId=result.courseId||'';
        if(result.status==='active'||activeNormal()){write({primaryComplete:true});view='recommend-intent';}
        else{message=result.status==='payment_pending'?'Payment verification is pending.':'Enrollment is waiting for approval.';view='waiting';}
      }catch(error){message=error.message||String(error);view='join';}
      busy=false;draw();
    });
    document.querySelector('[data-foundation-refresh]')?.addEventListener('click',async()=>{
      if(busy)return;busy=true;message='Checking…';draw();
      try{await window.DafatiiCourses.refresh();if(activeNormal()){write({primaryComplete:true});view='recommend-intent';message='';}else message='The Course is still waiting for approval or payment verification.';}
      catch(error){message=error.message||String(error);}
      busy=false;draw();
    });

    document.querySelector('[data-recommend-intent="no"]')?.addEventListener('click',()=>{write({recommendationComplete:true,recommendationOptIn:false});void finish();});
    document.querySelector('[data-recommend-intent="yes"]')?.addEventListener('click',async()=>{
      if(busy)return;
      write({recommendationOptIn:true});busy=true;message='Loading public Courses…';draw();
      try{await withDeadline(window.DafatiiCourses?.refresh?.(),'Public Course discovery');view='recommend-field';message='';}
      catch(error){view='recommend-intent';message=error.message||String(error);}
      busy=false;draw();
    });
    document.querySelectorAll('[data-recommend-field]').forEach(button=>button.addEventListener('click',()=>{chosenField=button.dataset.recommendField||'';chosenLevel='';view='recommend-level';draw();}));
    document.querySelectorAll('[data-recommend-level]').forEach(button=>button.addEventListener('click',()=>{chosenLevel=button.dataset.recommendLevel||'beginner';view='recommend-results';draw();}));
    document.querySelectorAll('[data-recommend-back]').forEach(button=>button.addEventListener('click',()=>{const target=button.dataset.recommendBack;view=target==='intent'?'recommend-intent':target==='field'?'recommend-field':'recommend-level';message='';draw();}));
    document.querySelectorAll('[data-recommend-enroll]').forEach(button=>button.addEventListener('click',async()=>{
      if(busy)return;busy=true;message='Submitting enrollment…';draw();
      try{
        const result=await window.DafatiiCourses.enroll({course:button.dataset.recommendEnroll});
        write({recommendedField:chosenField,recommendedLevel:chosenLevel,recommendationCourseId:result.courseId||'',recommendationEnrollmentStatus:result.status||'',recommendationComplete:true});
        message=result.status==='active'?'Enrolled successfully.':'Enrollment submitted. You can track approval from Courses.';
      }catch(error){message=error.message||String(error);}
      busy=false;draw();
    }));
    document.querySelectorAll('[data-recommend-finish]').forEach(button=>button.addEventListener('click',()=>{write({recommendedField:chosenField,recommendedLevel:chosenLevel,recommendationComplete:true});void finish();}));
  }

  function draw(){
    const root=document.getElementById('app');if(!root)return;
    root.innerHTML=markup();bind();
  }

  async function render(force=false){
    if(!blocks())return false;
    if(location.hash!=='#onboarding'){location.hash='onboarding';return true;}
    if(force){teacherCatalog=null;view='auto';message='';resolveGeneration+=1;resolving=null;}
    draw();

    const needsResolve=view==='auto'||(view==='teachers'&&!teacherCatalog);
    if(!needsResolve)return true;
    if(resolving)return true;

    const generation=++resolveGeneration;
    const watchdog=setTimeout(()=>{
      if(generation!==resolveGeneration)return;
      resolveGeneration+=1;resolving=null;busy=false;view='teacher-error';
      message='This setup step is taking too long. Tap Try again.';
      draw();
    },17000);

    resolving=(async()=>{
      busy=true;
      try{
        if(view==='auto'){
          const record=read();
          if(isHigher()&&(record?.legacyRecovery||record?.primaryComplete))await withDeadline(window.DafatiiCourses?.refresh?.(),'Course setup');
        }
        await determineView();
      }catch(error){
        if(generation!==resolveGeneration)return;
        message=error.message||String(error);view='teacher-error';
      }finally{
        clearTimeout(watchdog);
        if(generation===resolveGeneration){busy=false;resolving=null;draw();}
      }
    })();
    await resolving;
    return true;
  }

  function recover(){if(!blocks())return false;void render();return true;}

  window.DafatiiOnboarding=Object.freeze({blocks,render,recover,key:KEY});
})();
