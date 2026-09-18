(() => {
  'use strict';

  const ALLOWED = new Set(['dashboard','change-course','profile','settings']);
  const SUBJECTS = ['arabic','english','math','chemistry','physics','biology','islamic_book'];
  const SUBJECT_ICONS = {arabic:'✎',english:'Aa',math:'∑',chemistry:'🧪',physics:'⚛',biology:'🧬',islamic_book:'📚'};
  let catalog = null, loading = null, step = 0, saving = false, refreshedFor = '', scheduled = false;

  const copy = {
    en:{teachers:'My Teachers',title:'Choose your teachers',subtitle:'Choose one teacher for each subject. Teachers are ordered by popularity for your school level, stage and field.',dashboardTitle:'Your school teachers',dashboardText:'School students study by subject and teacher instead of joining courses.',selected:'selected',complete:'Teacher setup complete',continue:'Continue choosing teachers',change:'Change teachers',previous:'Previous',next:'Next',finish:'Finish',step:'Step',of:'of',mostPopular:'Most popular',popular:'Popular',students:'students selected this teacher',teacher:'Teacher',noTeachers:'No teachers have been published for your exact school level, stage and field yet.',loading:'Loading teachers…',error:'Could not load the teacher directory.',retry:'Retry',saving:'Saving…',arabic:'Arabic',english:'English',math:'Math',chemistry:'Chemistry',physics:'Physics',biology:'Biology',islamic_book:'Islamic Book'},
    ar:{teachers:'مدرسيني',title:'اختر مدرسيك',subtitle:'اختر مدرساً واحداً لكل مادة. يتم ترتيب المدرسين حسب الشهرة بما يطابق مستواك ومرحلتك وفرعك.',dashboardTitle:'مدرسو المدرسة',dashboardText:'طلاب المدارس يدرسون حسب المادة والمدرس بدلاً من التسجيل في الدورات.',selected:'تم اختيارهم',complete:'اكتمل اختيار المدرسين',continue:'متابعة اختيار المدرسين',change:'تغيير المدرسين',previous:'السابق',next:'التالي',finish:'إنهاء',step:'الخطوة',of:'من',mostPopular:'الأكثر شهرة',popular:'شائع',students:'طلاب اختاروا هذا المدرس',teacher:'مدرس',noTeachers:'لم يتم نشر مدرسين مطابقين لمستواك ومرحلتك وفرعك حتى الآن.',loading:'جارٍ تحميل المدرسين…',error:'تعذر تحميل دليل المدرسين.',retry:'إعادة المحاولة',saving:'جارٍ الحفظ…',arabic:'العربي',english:'الإنكليزي',math:'الرياضيات',chemistry:'الكيمياء',physics:'الفيزياء',biology:'الأحياء',islamic_book:'الكتاب الإسلامي'}
  };

  const lang = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const t = key => copy[lang()][key] || copy.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const route = () => location.hash.replace(/^#\/?/,'').split('/')[0] || 'landing';
  const school = () => window.DafatiiAuth?.user?.accountType === 'student' && window.DafatiiAuth?.user?.studentStage === 'school';
  const teacherRoute = value => value === 'change-course' || (value === 'dashboard' && !catalog?.complete);
  const selectedTeacher = item => item?.teachers?.find(teacher => teacher.id === item.selectedTeacherId) || null;

  function syncSchoolWorkspace(){
    const ready=school()&&Boolean(catalog?.complete);
    window.DafatiiSchoolWorkspaceReady=ready;
    if(!ready||typeof state==='undefined')return false;
    const nextSubjects=[],nextLectures={};
    for(const item of catalog.subjects||[]){
      const teacher=selectedTeacher(item),subjectId=`school-${item.subject}`;
      const chapters=Array.isArray(teacher?.chapters)?teacher.chapters:[];
      const units=(chapters.length?chapters:[{id:`${subjectId}-chapter-1`,name:'Chapter 1',lectures:[]}]).map((chapter,index)=>({id:String(chapter.id||`${subjectId}-chapter-${index+1}`),name:String(chapter.name||`Chapter ${index+1}`)}));
      const activeStudyUnitId=units[0].id;
      nextSubjects.push({id:subjectId,name:t(item.subject),icon:SUBJECT_ICONS[item.subject]||'📚',studyType:'chapters',studyUnits:units,activeStudyUnitId,teacherId:teacher?.id||'',teacherName:teacher?.displayName||'',teacherImageUrl:teacher?.imageUrl||''});
      const lectures=[];
      chapters.forEach((chapter,chapterIndex)=>{const unitId=units[chapterIndex]?.id||activeStudyUnitId;(chapter.lectures||[]).forEach((lecture,lectureIndex)=>lectures.push({id:String(lecture.id||`${subjectId}-lecture-${chapterIndex+1}-${lectureIndex+1}`),name:String(lecture.name||''),link:String(lecture.link||''),icon:'▶',studyUnitId:unitId,subjectId}));});
      nextLectures[subjectId]=lectures;
    }
    state.subjects=nextSubjects;state.lectures=nextLectures;return true;
  }
  const avatar = teacher => teacher?.imageUrl
    ? `<img src="${esc(teacher.imageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : esc(String(teacher?.displayName || 'T').trim().slice(0,1).toUpperCase() || 'T');

  function renameNav(){
    const label = t('teachers');
    document.querySelectorAll('[data-pre-course-route="change-course"]').forEach(button => {
      if (button.dataset.schoolTeacherLabel === label) return;
      button.dataset.schoolTeacherLabel = label;
      const icon = window.DafatiiIcons?.icon?.('subjects') || '';
      button.innerHTML = `${icon}<span>${esc(label)}</span>`;
      button.setAttribute('aria-label',label); button.setAttribute('title',label);
    });
    document.querySelectorAll('.quiet-course-button').forEach(button => { button.hidden = true; });
  }

  async function load(force=false){
    if (!school()) return null;
    if (catalog && !force) return catalog;
    if (loading && !force) return loading;
    loading = window.DafatiiApi.request('/school/teachers',{idempotent:true}).then(async result => {
      catalog = result;
      syncSchoolWorkspace();
      const missing = catalog.subjects?.findIndex(item => !item.selectedTeacherId) ?? -1;
      if (!catalog.subjects?.[step]) step = missing >= 0 ? missing : 0;
      const uid = window.DafatiiAuth?.user?.id || '';
      if (uid && refreshedFor !== uid){ refreshedFor = uid; try{ await window.DafatiiCourses?.refresh?.(); }catch{} }
      return catalog;
    }).finally(() => { loading = null; });
    return loading;
  }

  const loadingView = () => `<section class="school-teacher-page" data-school-teacher-view><div class="school-teacher-loading"><span class="school-teacher-spinner"></span><strong>${esc(t('loading'))}</strong></div></section>`;
  const errorView = message => `<section class="school-teacher-page" data-school-teacher-view><div class="school-teacher-empty"><strong>${esc(t('error'))}</strong><p>${esc(message || '')}</p><button class="btn btn-primary" type="button" data-school-retry>${esc(t('retry'))}</button></div></section>`;

  function dashboardView(){
    const selected = Number(catalog?.selectedCount || 0), complete = Boolean(catalog?.complete);
    const cards = (catalog?.subjects || []).map(item => {
      const teacher = selectedTeacher(item);
      return `<article class="school-teacher-summary-card ${teacher?'selected':''}"><span class="school-subject-dot"></span><div><small>${esc(t(item.subject))}</small><strong>${esc(teacher?.displayName || '—')}</strong></div>${teacher?'<span class="school-selected-check">✓</span>':''}</article>`;
    }).join('');
    return `<section class="school-teacher-page school-teacher-dashboard" data-school-teacher-view><header class="school-teacher-hero"><div><div class="eyebrow">${esc(t('teachers'))}</div><h1>${esc(t('dashboardTitle'))}</h1><p>${esc(t('dashboardText'))}</p></div><div class="school-teacher-score"><strong>${selected}/7</strong><span>${esc(t('selected'))}</span></div></header><div class="school-teacher-progress"><span style="--school-progress:${Math.round(selected/7*100)}%"></span></div><div class="school-teacher-summary-grid">${cards}</div><div class="school-teacher-dashboard-actions"><button class="btn btn-primary" type="button" data-open-teachers>${esc(complete?t('change'):t('continue'))} →</button>${complete?`<strong class="school-teacher-complete">✓ ${esc(t('complete'))}</strong>`:''}</div></section>`;
  }

  function meta(teacher,index){
    if(index===0) return t('mostPopular');
    if(Number(teacher.selectionCount||0)>0) return `${teacher.selectionCount} ${t('students')}`;
    if(Number(teacher.fameScore||0)>0) return t('popular');
    return teacher.institution || t('teacher');
  }

  function pickerView(){
    const item = catalog?.subjects?.[step];
    if(!item) return errorView('');
    const chosen = item.selectedTeacherId || '';
    const teachers = (item.teachers || []).length ? item.teachers.map((teacher,index)=>`<button class="school-teacher-card ${teacher.id===chosen?'selected':''}" type="button" data-teacher-id="${esc(teacher.id)}" ${saving?'disabled':''}><span class="school-teacher-rank">${index+1}</span><span class="school-teacher-avatar">${avatar(teacher)}</span><span class="school-teacher-card-copy"><strong>${esc(teacher.displayName)}</strong><small>${esc(meta(teacher,index))}</small></span>${teacher.id===chosen?'<span class="school-selected-check">✓</span>':''}</button>`).join('') : `<div class="school-teacher-empty compact"><strong>${esc(t(item.subject))}</strong><p>${esc(t('noTeachers'))}</p></div>`;
    const dots = (catalog.subjects || []).map((subject,index)=>`<button type="button" class="school-step-dot ${index===step?'active':subject.selectedTeacherId?'done':''}" data-school-step="${index}" aria-label="${esc(t(subject.subject))}"><span>${index+1}</span></button>`).join('');
    const last = step === catalog.subjects.length-1;
    return `<section class="school-teacher-page" data-school-teacher-view><header class="school-teacher-picker-head"><div><div class="eyebrow">${esc(t('step'))} ${step+1} ${esc(t('of'))} 7</div><h1>${esc(t(item.subject))}</h1><p>${esc(t('subtitle'))}</p></div><strong class="school-step-count">${step+1}/7</strong></header><div class="school-stepper" aria-label="${esc(t('title'))}">${dots}</div><div class="school-teacher-list">${teachers}</div><footer class="school-teacher-actions"><button class="btn btn-ghost" type="button" data-school-previous ${step===0?'disabled':''}>← ${esc(t('previous'))}</button><button class="btn btn-primary" type="button" data-school-next ${!chosen||saving?'disabled':''}>${esc(saving?t('saving'):last?t('finish'):t('next'))}${saving?'':' →'}</button></footer></section>`;
  }

  function bind(main){
    main.querySelector('[data-school-retry]')?.addEventListener('click',()=>{catalog=null; void render(true);});
    main.querySelector('[data-open-teachers]')?.addEventListener('click',()=>{location.hash='change-course';});
    main.querySelectorAll('[data-school-step]').forEach(button=>button.addEventListener('click',()=>{step=Number(button.dataset.schoolStep)||0; void render(true);}));
    main.querySelector('[data-school-previous]')?.addEventListener('click',()=>{step=Math.max(0,step-1); void render(true);});
    main.querySelector('[data-school-next]')?.addEventListener('click',()=>{if(!catalog?.subjects?.[step]?.selectedTeacherId)return;if(step>=catalog.subjects.length-1){syncSchoolWorkspace();location.hash=catalog.complete?'subjects/All%20subjects':'dashboard';return;}step+=1;void render(true);});
    main.querySelectorAll('[data-teacher-id]').forEach(button=>button.addEventListener('click',async()=>{
      if(saving)return; const item=catalog?.subjects?.[step]; if(!item)return;
      saving=true; await render(true);
      try{catalog=await window.DafatiiApi.request(`/school/teachers/${encodeURIComponent(item.subject)}`,{method:'PUT',body:{teacherId:button.dataset.teacherId}});syncSchoolWorkspace();}
      catch(error){const root=document.querySelector('.workspace-main');if(root){root.dataset.schoolTeacherRoute='error';root.innerHTML=errorView(error.message||t('error'));bind(root);}saving=false;return;}
      saving=false; await render(true);
    }));
  }

  async function render(force=false){
    if(!school())return;
    const current=route();
    if(!ALLOWED.has(current) || !teacherRoute(current))return;
    renameNav();
    const main=document.querySelector('.workspace-main'); if(!main)return;
    if(!force && catalog && main.dataset.schoolTeacherRoute===current && main.querySelector('[data-school-teacher-view]'))return;
    main.dataset.schoolTeacherRoute=current;
    if(!catalog||force&&!catalog){main.innerHTML=loadingView();try{await load(Boolean(force&&!catalog));}catch(error){main.innerHTML=errorView(error.message||t('error'));bind(main);return;}if(route()!==current)return;}
    if(catalog?.complete&&current==='dashboard'){syncSchoolWorkspace();main.removeAttribute('data-school-teacher-route');window.render?.();return;}
    main.innerHTML=current==='change-course'?pickerView():dashboardView(); bind(main);
  }

  function enhance(){
    scheduled=false;
    const active=school();
    document.documentElement.toggleAttribute('data-school-student',active);
    if(!active){catalog=null;window.DafatiiSchoolWorkspaceReady=false;return;}
    if(!teacherRoute(route()))return;
    renameNav();
    void render(false);
  }
  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(enhance);}

  const appRoot=document.getElementById('app');
  if(appRoot){
    new MutationObserver(()=>{
      if(school() && teacherRoute(route())) schedule();
    }).observe(appRoot,{childList:true});
  }
  window.addEventListener('hashchange',schedule);
  window.addEventListener('dafatii:auth:changed',()=>{catalog=null;refreshedFor='';window.DafatiiSchoolWorkspaceReady=false;schedule();});
  window.addEventListener('dafatii:coursesloaded',schedule);
  window.addEventListener('dafatii:datahydrated',schedule);
  schedule();
})();
