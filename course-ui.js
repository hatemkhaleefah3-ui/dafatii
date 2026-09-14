(() => {
  'use strict';
  const esc=value=>escapeHtml(value??'');
  const statusLabel=value=>({active:'Enrolled',pending:'Awaiting acceptance',payment_pending:'Payment verification pending',rejected:'Rejected',removed:'Removed'}[value]||'Available');
  const money=course=>course.pricing==='free'?'Free':new Intl.NumberFormat(undefined,{style:'currency',currency:course.currency||'USD'}).format((course.priceMinor||0)/100);
  LABELS['change-course']='Courses';

  function coursePage(){
    const active=window.DafatiiCourses.active(),courses=window.DafatiiCourses.list(),actor=window.DafatiiCourses.actor||window.DafatiiAuth.user;
    const enrolled=courses.filter(course=>course.membership?.status==='active');
    const available=courses.filter(course=>!course.membership||course.membership.status!=='active');
    const canCreate=actor?.platformRole==='admin'||actor?.accountType==='representer';
    return `<section class="suite-page course-manager">
      <div class="suite-head"><div><div class="eyebrow">Courses and enrollment</div><h1>Your courses</h1><p>Enrollment, roles and every course workspace are stored securely on the server.</p></div><div class="suite-head-actions">${canCreate?'<button class="btn btn-primary" id="course-add">＋ Create course</button>':''}<button class="btn btn-ghost" id="course-join">Join with code</button></div></div>
      ${active.id?`<article class="course-active-hero"><span class="course-active-icon">◇</span><div><div class="eyebrow">Active course · ${esc(active.membership?.role||'student')}</div><h2>${esc(active.name)}</h2><p>${esc([active.institution,active.stage].filter(Boolean).join(' · '))}</p></div><div class="course-active-count"><strong>${state.subjects.length}</strong><span>subjects</span></div></article>`:'<article class="course-explainer"><span>＋</span><div><h2>No active course yet</h2><p>Join a course, or create one from a representer account.</p></div></article>'}
      <h2 class="course-section-title">Enrolled</h2><div class="course-card-grid">${enrolled.length?enrolled.map(courseCard).join(''):'<p class="muted">You are not enrolled in an active course.</p>'}</div>
      <h2 class="course-section-title">Discover courses</h2><div class="course-card-grid">${available.length?available.map(courseCard).join(''):'<p class="muted">No other public courses are available.</p>'}</div>
      <article class="course-explainer"><span>i</span><div><h2>Paid enrollment is verified manually</h2><p>Dafatii records payment as pending until an authorized representer or administrator confirms it. No payment processor is connected yet.</p></div></article>
    </section>`;
  }

  function courseCard(course){
    const member=course.membership,status=member?.status,active=course.id===window.DafatiiCourses.active().id;
    return `<article class="course-card ${active?'active':''}"><div class="course-card-top"><span>◇</span><b>${esc(statusLabel(status))}</b></div><h2>${esc(course.name)}</h2><p>${esc([course.institution,course.stage,money(course),course.visibility,course.joinPolicy==='approval'?'Approval required':'Direct join'].filter(Boolean).join(' · '))}</p><div class="course-card-actions">${status==='active'?`<button class="btn ${active?'btn-ghost':'btn-primary'}" data-course-switch="${esc(course.id)}" ${active?'disabled':''}>${active?'Currently open':'Open course'}</button>`:status?`<span class="course-status">${esc(statusLabel(status))}</span>`:`<button class="btn btn-primary" data-course-enroll="${esc(course.enrollmentCode)}" data-private="${course.visibility==='private'?'1':'0'}">Enroll</button>`}</div></article>`;
  }

  const previousWorkspaceContent=workspaceContent;
  workspaceContent=function(page,parts,title){if(page==='change-course')return coursePage();return previousWorkspaceContent(page,parts,title);};
  const previousWorkspace=workspace;
  workspace=function(current){previousWorkspace(current);enhanceCourseSwitcher();if(current.split('/')[0]==='change-course')bindCourseManager();};

  function enhanceCourseSwitcher(){
    const host=document.querySelector('.settings-inner'),courses=window.DafatiiCourses.list().filter(course=>course.membership?.status==='active'),active=window.DafatiiCourses.active();if(!host||!active.id||host.querySelector('[data-course-picker]'))return;
    const label=document.createElement('label');label.className='course-picker';label.dataset.coursePicker='';label.innerHTML=`<span class="course-picker-icon">◇</span><span class="course-picker-copy"><small>Active course</small><strong>${esc(active.name)}</strong></span><select aria-label="Active course">${courses.map(course=>`<option value="${esc(course.id)}" ${course.id===active.id?'selected':''}>${esc(course.name)}</option>`).join('')}</select><b>⌄</b>`;
    label.querySelector('select').addEventListener('change',async event=>{await window.DafatiiCourses.switchCourse(event.target.value);});host.prepend(label);
  }

  function bindCourseManager(){
    document.querySelectorAll('[data-course-switch]').forEach(button=>button.onclick=()=>window.DafatiiCourses.switchCourse(button.dataset.courseSwitch));
    document.querySelectorAll('[data-course-enroll]').forEach(button=>button.onclick=()=>openEnrollSheet(button.dataset.courseEnroll,button.dataset.private==='1'));
    document.getElementById('course-add')?.addEventListener('click',()=>openCourseSheet());document.getElementById('course-join')?.addEventListener('click',()=>openEnrollSheet('',false));
  }

  function sheet(title,body){const root=document.getElementById('overlay-root');root.innerHTML=`<div class="entity-sheet-overlay suite-overlay" id="course-overlay"><section class="entity-sheet suite-sheet course-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" id="course-close">×</button></div>${body}</section></div>`;const close=()=>root.innerHTML='';document.getElementById('course-close').onclick=close;document.getElementById('course-overlay').onclick=e=>{if(e.target.id==='course-overlay')close();};return close;}
  function openEnrollSheet(code='',privateCourse=false){
    const close=sheet('Join a course',`<form id="course-enroll-form"><div class="field"><label>Enrollment code</label><input name="course" value="${esc(code)}" maxlength="36" required></div><div class="field"><label>Private access code <span class="field-optional">If required</span></label><input name="accessCode" type="password" minlength="6" maxlength="64" ${privateCourse?'required':''}></div><div class="field"><label>Application note <span class="field-optional">Optional</span></label><textarea name="note" maxlength="500"></textarea></div><button class="btn btn-primary auth-submit">Submit enrollment</button><p class="auth-note" id="course-status"></p></form>`);
    document.getElementById('course-enroll-form').onsubmit=async e=>{e.preventDefault();const values=new FormData(e.currentTarget),status=document.getElementById('course-status');try{const result=await window.DafatiiCourses.enroll(Object.fromEntries(values));status.textContent=statusLabel(result.status);if(result.status==='active'){close();await window.DafatiiCourses.switchCourse(result.courseId);}else setTimeout(()=>{close();render();},900);}catch(error){status.textContent=error.message;}};
  }
  function openCourseSheet(){
    const templates=window.DafatiiCourses.templates();const close=sheet('Create a course',`<form id="course-form"><div class="field"><label>Course name</label><input name="name" maxlength="120" required></div><div class="field"><label>Content template</label><select name="templateName">${templates.map(name=>`<option>${esc(name)}</option>`).join('')}</select></div><div class="suite-form-grid"><div class="field"><label>Institution</label><input name="institution" maxlength="160"></div><div class="field"><label>Stage</label><select name="stage"><option value="school">School</option><option value="university" selected>University</option><option value="independent">Independent</option></select></div><div class="field"><label>Pricing</label><select name="pricing"><option value="free">Free</option><option value="paid">Paid</option></select></div><div class="field"><label>Price (minor units)</label><input name="priceMinor" type="number" min="0" value="0"></div><div class="field"><label>Visibility</label><select name="visibility"><option value="public">Public</option><option value="private">Private by code</option></select></div><div class="field"><label>Join policy</label><select name="joinPolicy"><option value="approval">Needs acceptance</option><option value="direct">Direct join</option></select></div></div><div class="field"><label>Private access code</label><input name="accessCode" type="password" minlength="6" maxlength="64"></div><button class="btn btn-primary auth-submit" type="submit">Create course</button><p class="auth-note" id="course-status"></p></form>`);
    document.getElementById('course-form').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,status=document.getElementById('course-status'),submit=form.querySelector('button[type=submit]'),data=Object.fromEntries(new FormData(form));data.priceMinor=Number(data.priceMinor);submit.disabled=true;status.textContent='Creating secure course workspace…';try{await window.DafatiiCourses.createCourse(data);close();setHash('dashboard/overview');}catch(error){status.textContent=error.message;submit.disabled=false;}};
  }
})();
