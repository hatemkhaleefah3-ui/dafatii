(() => {
  'use strict';
  const esc=value=>escapeHtml(value??'');

  LABELS['change-course']='Courses';

  function coursePage(){
    const active=window.DafatiiCourses.active();
    const courses=window.DafatiiCourses.list();
    return `<section class="suite-page course-manager">
      <div class="suite-head"><div><div class="eyebrow">Workspace · Courses</div><h1>Your courses</h1><p>Each course keeps its own subjects, lectures, materials, calendar, progress, rooms and conversations.</p></div><div class="suite-head-actions"><button class="btn btn-ghost" id="course-edit-active">Edit active</button><button class="btn btn-primary" id="course-add">＋ Add course</button></div></div>
      <article class="course-active-hero" style="--course-color:${esc(active.color||'#2563eb')}"><span class="course-active-icon">${esc(active.icon||'◇')}</span><div><div class="eyebrow">Active course</div><h2>${esc(active.name)}</h2><p>${esc([active.institution,active.term].filter(Boolean).join(' · ')||'Course workspace')}</p></div><div class="course-active-count"><strong>${state.subjects.length}</strong><span>subjects</span></div></article>
      <div class="course-card-grid">${courses.map(course=>`<article class="course-card ${course.id===active.id?'active':''}" style="--course-color:${esc(course.color||'#2563eb')}"><div class="course-card-top"><span>${esc(course.icon||'◇')}</span>${course.id===active.id?'<b>Active</b>':''}</div><h2>${esc(course.name)}</h2><p>${esc([course.institution,course.term].filter(Boolean).join(' · ')||'Independent course')}</p><button class="btn ${course.id===active.id?'btn-ghost':'btn-primary'}" data-course-switch="${esc(course.id)}" ${course.id===active.id?'disabled':''}>${course.id===active.id?'Currently open':'Open course'}</button></article>`).join('')}</div>
      <article class="course-explainer"><span>↻</span><div><h2>Course switching is complete</h2><p>Open another course and every academic surface reloads from that course’s workspace. Your current course stays exactly as you left it.</p></div></article>
    </section>`;
  }

  const previousWorkspaceContent=workspaceContent;
  workspaceContent=function(page,parts,title){if(page==='change-course')return coursePage();return previousWorkspaceContent(page,parts,title);};

  const previousWorkspace=workspace;
  workspace=function(current){previousWorkspace(current);enhanceCourseSwitcher();if(current.split('/')[0]==='change-course')bindCourseManager();};

  function enhanceCourseSwitcher(){
    const host=document.querySelector('.settings-inner');if(!host||host.querySelector('[data-course-picker]'))return;
    const active=window.DafatiiCourses.active(),courses=window.DafatiiCourses.list();
    const label=document.createElement('label');label.className='course-picker';label.dataset.coursePicker='';label.style.setProperty('--course-color',active.color||'#2563eb');
    label.innerHTML=`<span class="course-picker-icon">${esc(active.icon||'◇')}</span><span class="course-picker-copy"><small>Active course</small><strong>${esc(active.name)}</strong></span><select aria-label="Active course">${courses.map(course=>`<option value="${esc(course.id)}" ${course.id===active.id?'selected':''}>${esc(course.name)}</option>`).join('')}</select><b>⌄</b>`;
    label.querySelector('select').addEventListener('change',event=>window.DafatiiCourses.switchCourse(event.target.value));
    host.prepend(label);
  }

  function bindCourseManager(){
    document.querySelectorAll('[data-course-switch]').forEach(button=>button.onclick=()=>window.DafatiiCourses.switchCourse(button.dataset.courseSwitch));
    document.getElementById('course-add')?.addEventListener('click',()=>openCourseSheet());
    document.getElementById('course-edit-active')?.addEventListener('click',()=>openCourseSheet(window.DafatiiCourses.active()));
  }

  function openCourseSheet(course=null){
    const root=document.getElementById('overlay-root');if(!root)return;
    const templates=window.DafatiiCourses.templates();
    root.innerHTML=`<div class="entity-sheet-overlay suite-overlay" id="course-overlay"><section class="entity-sheet suite-sheet course-sheet" role="dialog" aria-modal="true" aria-label="${course?'Edit course':'Add course'}"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Course workspace</div><h2>${course?'Edit course':'Add a course'}</h2></div><button class="icon-btn" id="course-close" aria-label="Close">×</button></div><form id="course-form"><div class="field"><label for="course-name">Course name</label><input id="course-name" maxlength="80" required value="${esc(course?.name||'')}" placeholder="e.g. Computer Science — Year 2"></div>${course?'':`<div class="field"><label for="course-template">Content template</label><select id="course-template">${templates.map(name=>`<option>${esc(name)}</option>`).join('')}</select><small class="course-field-help">Starts the course with tailored subjects, lectures, notes, resources, assignments, calendar items, rooms and conversations.</small></div>`}<div class="suite-form-grid"><div class="field"><label for="course-institution">Institution <span class="field-optional">Optional</span></label><input id="course-institution" maxlength="100" value="${esc(course?.institution||'')}" placeholder="School or university"></div><div class="field"><label for="course-term">Term <span class="field-optional">Optional</span></label><input id="course-term" maxlength="80" value="${esc(course?.term||'')}" placeholder="e.g. Fall 2026"></div></div><button class="btn btn-primary auth-submit" type="submit">${course?'Save course':'Create and open course'}</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};document.getElementById('course-close').onclick=close;document.getElementById('course-overlay').onclick=event=>{if(event.target.id==='course-overlay')close();};
    const template=document.getElementById('course-template'),name=document.getElementById('course-name');
    template?.addEventListener('change',()=>{if(!name.value.trim()||templates.includes(name.value.trim()))name.value=template.value;});
    if(template&&!name.value)name.value=template.value;
    document.getElementById('course-form').onsubmit=event=>{event.preventDefault();const payload={name:name.value.trim(),institution:document.getElementById('course-institution').value.trim(),term:document.getElementById('course-term').value.trim()};if(!payload.name)return;if(course)window.DafatiiCourses.updateCourse(course.id,payload);else window.DafatiiCourses.createCourse({...payload,templateName:template.value});close();};
    setTimeout(()=>name.focus(),40);
  }
})();
