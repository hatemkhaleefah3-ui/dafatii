(() => {
  'use strict';
  if (window.__dafatiiAdminConsoleInstalled) return;
  window.__dafatiiAdminConsoleInstalled = true;

  const SUBJECTS = [
    ['arabic','Arabic','العربي'],['english','English','الإنكليزي'],['math','Math','الرياضيات'],
    ['chemistry','Chemistry','الكيمياء'],['physics','Physics','الفيزياء'],['biology','Biology','الأحياء'],
    ['islamic_book','Islamic Book','الكتاب الإسلامي']
  ];
  const TABS = [
    ['overview','Overview','الرئيسية','dashboard'],
    ['students','Students','الطلاب','profile'],
    ['teachers','Teachers','المدرسون','subjects'],
    ['courses','Courses','الدورات','change-course'],
    ['study-rooms','Study Rooms','غرف الدراسة','study-rooms']
  ];
  const LEVELS = {
    primary_school:{label:'Primary School',stages:['sixth'],fields:[],org:'institution'},
    middle_school:{label:'Middle School',stages:['third'],fields:[],org:'institution'},
    preparatory_school:{label:'Preparatory School',stages:['sixth'],fields:['scientific','literary'],org:'institution'},
    institute:{label:'Institute',stages:['first','second'],fields:['medical','technical','mechanical','electrical','chemical','petroleum'],org:'institution'},
    college:{label:'College',stages:['first','second','third','fourth','fifth','sixth'],fields:['medical','engineering','sciences','education'],org:'college'},
    primary_studies:{label:'Undergraduate studies',stages:['primary_studies'],fields:[],org:'institution'},
    postgraduate_studies:{label:'Postgraduate studies',stages:['postgraduate_studies'],fields:[],org:'institution'}
  };

  const data={overview:null,users:[],teachers:[],courses:[],rooms:[],loading:false,error:'',loaded:false};
  let teacherContentDraft=null;
  const ar=()=>document.documentElement.lang==='ar';
  const tx=(en,arabic)=>ar()?arabic:en;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const icon=name=>window.DafatiiIcons?.icon?.(name)||'';
  const route=()=>location.hash.replace(/^#\/?/,'');
  const adminTab=()=>{
    const [page,raw]=route().split('/');
    if(page!=='admin')return '';
    const tab=decodeURIComponent(raw||'overview');
    return TABS.some(item=>item[0]===tab)?tab:'overview';
  };
  const adminTeacherId=()=>{const parts=route().split('/');return parts[0]==='admin'&&parts[1]==='teachers'&&parts[2]?decodeURIComponent(parts[2]):'';};
  const subjectLabel=id=>{const item=SUBJECTS.find(s=>s[0]===id);return item?(ar()?item[2]:item[1]):id;};

  function nav(){
    const current=adminTab()||'overview';
    return `<nav class="admin-console-nav" aria-label="${esc(tx('Admin sections','أقسام الإدارة'))}">${TABS.map(([key,en,arabicName,iconName])=>`
      <button type="button" class="${current===key?'active':''}" data-admin-tab="${key}">
        <span>${icon(iconName)}</span><strong>${esc(ar()?arabicName:en)}</strong>
      </button>`).join('')}</nav>`;
  }

  function shell(body){
    return `<section class="admin-console" data-admin-console>
      <header class="admin-console-head">
        <div><div class="eyebrow">${esc(tx('Platform administration','إدارة المنصة'))}</div><h1>${esc(tx('Admin Console','لوحة المشرف'))}</h1><p>${esc(tx('Students, teachers, courses and study rooms in one controlled workspace.','إدارة الطلاب والمدرسين والدورات وغرف الدراسة من مساحة واحدة.'))}</p></div>
        <button class="btn btn-ghost" id="admin-console-refresh">${esc(tx('Refresh','تحديث'))}</button>
      </header>
      ${data.error?`<div class="panel-alert">${esc(data.error)}</div>`:''}
      <main class="admin-console-content">${body}</main>
      ${nav()}
    </section>`;
  }

  const metric=(value,label,detail='')=>`<article class="admin-console-metric"><strong>${Number(value||0)}</strong><span>${esc(label)}</span>${detail?`<small>${esc(detail)}</small>`:''}</article>`;

  function overviewView(){
    const o=data.overview||{};
    const teacherIds=new Set(data.teachers.map(teacher=>teacher.id));
    const students=data.users.filter(user=>user.accountType==='student'&&!teacherIds.has(user.id)).length;
    return shell(`<div class="admin-console-metrics">
      ${metric(students,tx('Students','الطلاب'))}
      ${metric(data.teachers.length,tx('Teachers','المدرسون'))}
      ${metric(o.courses,tx('Active courses','الدورات النشطة'))}
      ${metric(data.rooms.length,tx('Study rooms','غرف الدراسة'))}
    </div>
    <div class="admin-console-overview-grid">
      <article class="admin-console-card"><span class="admin-console-card-icon">${icon('profile')}</span><div><small>${esc(tx('Accounts','الحسابات'))}</small><h2>${esc(tx('Student access','وصول الطلاب'))}</h2><p>${esc(tx('Create students, disable access, restore accounts, or soft-delete them without exposing credentials.','أنشئ حسابات الطلاب وعطّل الوصول أو أعده أو احذف الحسابات بشكل آمن دون كشف بيانات الدخول.'))}</p></div><button class="btn btn-primary" data-admin-tab="students">${esc(tx('Manage students','إدارة الطلاب'))}</button></article>
      <article class="admin-console-card"><span class="admin-console-card-icon">${icon('subjects')}</span><div><small>${esc(tx('Directory','الدليل'))}</small><h2>${esc(tx('Teacher content','محتوى المدرسين'))}</h2><p>${esc(tx('Manage teacher profiles, subjects, chapters and lectures used by the school teacher system.','إدارة ملفات المدرسين والمواد والفصول والمحاضرات المستخدمة في نظام المدرسين.'))}</p></div><button class="btn btn-primary" data-admin-tab="teachers">${esc(tx('Manage teachers','إدارة المدرسين'))}</button></article>
      <article class="admin-console-card"><span class="admin-console-card-icon">${icon('change-course')}</span><div><small>${esc(tx('Higher education','التعليم العالي'))}</small><h2>${esc(tx('Course operations','إدارة الدورات'))}</h2><p>${esc(tx('Review active courses and open their representer workspace.','راجع الدورات النشطة وافتح مساحة إدارة كل دورة.'))}</p></div><button class="btn btn-primary" data-admin-tab="courses">${esc(tx('View courses','عرض الدورات'))}</button></article>
      <article class="admin-console-card"><span class="admin-console-card-icon">${icon('study-rooms')}</span><div><small>${esc(tx('Community','المجتمع'))}</small><h2>${esc(tx('Study rooms','غرف الدراسة'))}</h2><p>${esc(tx('See student-created rooms and remove a room when moderation requires it.','راجع غرف الدراسة التي أنشأها الطلاب واحذف أي غرفة عند الحاجة للإشراف.'))}</p></div><button class="btn btn-primary" data-admin-tab="study-rooms">${esc(tx('View rooms','عرض الغرف'))}</button></article>
    </div>`);
  }

  function studentsView(){
    const teacherIds=new Set(data.teachers.map(teacher=>teacher.id));
    const users=data.users.filter(user=>user.accountType==='student'&&!teacherIds.has(user.id));
    return shell(`<div class="admin-console-section-head"><div><div class="eyebrow">${esc(tx('Accounts','الحسابات'))}</div><h2>${esc(tx('Students','الطلاب'))}</h2><p>${esc(tx('Disable removes sign-in access; Delete is a reversible soft-delete. Passwords and PINs are never shown here.','التعطيل يمنع تسجيل الدخول، والحذف حذف منطقي قابل للإرجاع. كلمات المرور وPIN لا تظهر هنا.'))}</p></div><button class="btn btn-primary" id="admin-add-student">＋ ${esc(tx('Add student','إضافة طالب'))}</button></div>
      <div class="admin-console-list">${users.length?users.map(studentRow).join(''):`<div class="admin-console-empty">${esc(tx('No student accounts found.','لا توجد حسابات طلاب.'))}</div>`}</div>`);
  }

  function studentRow(user){
    const disabled=user.status!=='active';
    return `<article class="admin-person-row" data-admin-student="${esc(user.id)}">
      <div class="admin-person-avatar">${esc((user.displayName||'S').slice(0,1).toUpperCase())}</div>
      <div class="admin-person-copy"><strong>${esc(user.displayName)}</strong><span>${esc(user.email)}</span><small>${esc(user.studentStage)} · ${Number(user.courseCount||0)} ${esc(tx('courses','دورات'))} · ${esc(user.status)}</small></div>
      <div class="admin-person-actions">
        <button class="btn btn-ghost btn-small" data-student-access="${esc(user.id)}">${esc(tx('Account access','إدارة الحساب'))}</button>
        <button class="btn btn-ghost btn-small" data-student-status="${esc(user.id)}" data-status="${disabled?'active':'disabled'}">${esc(disabled?tx('Restore','إرجاع'):tx('Remove access','إزالة الوصول'))}</button>
        <button class="btn btn-danger btn-small" data-student-delete="${esc(user.id)}">${esc(tx('Delete','حذف'))}</button>
      </div>
    </article>`;
  }

  function teacherCard(teacher){
    const subject=teacher.subjects?.[0];
    const chapters=subject?.chapters?.length||0;
    const lectures=(subject?.chapters||[]).reduce((sum,chapter)=>sum+(chapter.lectures?.length||0),0);
    return `<article class="admin-teacher-card ${teacher.status==='removed'?'removed':''}" data-admin-teacher="${esc(teacher.id)}">
      <button class="admin-teacher-open" type="button" data-teacher-open="${esc(teacher.id)}" aria-label="${esc(tx('Open teacher content','فتح محتوى المدرس'))}">
        <span class="admin-teacher-avatar">${teacher.imageUrl?`<img src="${esc(teacher.imageUrl)}" alt="">`:`<span>${esc((teacher.displayName||'T').slice(0,1).toUpperCase())}</span>`}</span>
        <span class="admin-teacher-copy"><h3>${esc(teacher.displayName)} ${teacher.status==='removed'?`<small class="admin-teacher-status">${esc(tx('Removed','مزال'))}</small>`:''}</h3><p>${esc(subject?subjectLabel(subject.id):tx('No subject','بلا مادة'))}</p></span>
        <span class="admin-teacher-stats"><span><strong>${chapters}</strong>${esc(tx('chapters','فصول'))}</span><span><strong>${lectures}</strong>${esc(tx('lectures','محاضرات'))}</span></span>
      </button>
      <div class="admin-teacher-actions"><button class="btn btn-ghost btn-small" data-teacher-edit="${esc(teacher.id)}">${esc(tx('Edit profile','تعديل الملف'))}</button><button class="btn btn-ghost btn-small" data-teacher-status="${esc(teacher.id)}" data-status="${teacher.status==='removed'?'active':'removed'}">${esc(teacher.status==='removed'?tx('Restore','إرجاع'):tx('Remove','إزالة'))}</button><button class="btn btn-danger btn-small" data-teacher-delete="${esc(teacher.id)}">${esc(tx('Delete','حذف'))}</button></div>
    </article>`;
  }

  function teachersView(){
    return shell(`<div class="admin-console-section-head"><div><div class="eyebrow">${esc(tx('School directory','دليل المدرسة'))}</div><h2>${esc(tx('Teachers','المدرسون'))}</h2><p>${esc(tx('Create the teacher profile with a picture, name and exactly one subject. Open a teacher card to manage chapters and lecture videos.','أنشئ ملف المدرس بصورة واسم ومادة واحدة فقط. افتح بطاقة المدرس لإدارة الفصول ومحاضرات الفيديو.'))}</p></div><button class="btn btn-primary" id="admin-add-teacher">＋ ${esc(tx('Add teacher','إضافة مدرس'))}</button></div>
      <div class="admin-teacher-grid">${data.teachers.length?data.teachers.map(teacherCard).join(''):`<div class="admin-console-empty">${esc(tx('No teachers have been added yet.','لم تتم إضافة مدرسين بعد.'))}</div>`}</div>`);
  }

  function coursesView(){
    return shell(`<div class="admin-console-section-head"><div><div class="eyebrow">${esc(tx('Higher education','التعليم العالي'))}</div><h2>${esc(tx('Courses','الدورات'))}</h2><p>${esc(tx('School accounts cannot create or enroll in Courses. Higher-education students can create their own Course.','حسابات المدارس لا يمكنها إنشاء أو الانضمام إلى الدورات. طلاب التعليم الأعلى من المدرسة يمكنهم إنشاء دورتهم الخاصة.'))}</p></div><button class="btn btn-primary" id="admin-create-course">＋ ${esc(tx('Create course','إنشاء دورة'))}</button></div>
      <div class="admin-console-list">${data.courses.length?data.courses.map(course=>`<article class="admin-course-row"><div><strong>${esc(course.name)}</strong><span>${esc(course.institution||'')} · ${esc(course.status)} · ${Number(course.memberCount||0)} ${esc(tx('members','أعضاء'))}</span><small>${esc(course.enrollmentCode||'')}</small></div><div><button class="btn btn-ghost btn-small" data-admin-course-open="${esc(course.id)}">${esc(tx('Open','فتح'))}</button>${course.status==='active'?`<button class="btn btn-danger btn-small" data-admin-course-archive="${esc(course.id)}">${esc(tx('Archive','أرشفة'))}</button>`:''}</div></article>`).join(''):`<div class="admin-console-empty">${esc(tx('No courses found.','لا توجد دورات.'))}</div>`}</div>`);
  }

  function roomsView(){
    return shell(`<div class="admin-console-section-head"><div><div class="eyebrow">${esc(tx('Community','المجتمع'))}</div><h2>${esc(tx('Study Rooms','غرف الدراسة'))}</h2><p>${esc(tx('All students can create Study Rooms. This list shows student-created rooms stored on their account.','يمكن لكل الطلاب إنشاء غرف دراسة. تعرض هذه القائمة الغرف التي أنشأها الطلاب والمحفوظة في حساباتهم.'))}</p></div></div>
      <div class="admin-console-list">${data.rooms.length?data.rooms.map(room=>`<article class="admin-room-row"><div class="admin-room-icon">◎</div><div><strong>${esc(room.name||tx('Untitled room','غرفة بلا اسم'))}</strong><span>${esc(room.subject||tx('General','عام'))} · ${esc(room.visibility||'public')}</span><small>${esc(room.ownerName)} · ${esc(room.ownerEmail)}</small></div><button class="btn btn-danger btn-small" data-admin-room-delete data-owner="${esc(room.ownerUserId)}" data-room="${esc(room.id)}">${esc(tx('Remove room','حذف الغرفة'))}</button></article>`).join(''):`<div class="admin-console-empty">${esc(tx('No student-created Study Rooms yet.','لا توجد غرف دراسة أنشأها الطلاب بعد.'))}</div>`}</div>`);
  }

  function adminPage(){
    if(window.DafatiiAuth?.user?.platformRole!=='admin')return `<section class="empty-state"><h1>${esc(tx('Access denied','تم رفض الوصول'))}</h1></section>`;
    const tab=adminTab()||'overview';
    if(!data.loaded)return shell(`<div class="admin-console-loading"><span></span><strong>${esc(tx('Loading Admin Console…','جارٍ تحميل لوحة المشرف…'))}</strong></div>`);
    if(tab==='students')return studentsView();
    if(tab==='teachers'){
      const teacherId=adminTeacherId();
      if(teacherId){const teacher=data.teachers.find(item=>item.id===teacherId);return teacher?teacherContentView(teacher):teachersView();}
      teacherContentDraft=null;return teachersView();
    }
    if(tab==='courses')return coursesView();
    if(tab==='study-rooms')return roomsView();
    return overviewView();
  }

  async function load(force=false){
    if(data.loading||data.loaded&&!force)return;
    data.loading=true;data.error='';
    try{
      const [overview,users,teachers,courses,rooms]=await Promise.all([
        window.DafatiiApi.request('/admin/overview',{idempotent:true}),
        window.DafatiiApi.request('/admin/users',{idempotent:true}),
        window.DafatiiApi.request('/admin/teachers',{idempotent:true}),
        window.DafatiiApi.request('/courses?scope=admin',{idempotent:true}),
        window.DafatiiApi.request('/admin/study-rooms',{idempotent:true})
      ]);
      data.overview=overview;data.users=users.users||[];data.teachers=teachers.teachers||[];data.courses=courses.courses||[];data.rooms=rooms.rooms||[];data.loaded=true;
    }catch(error){data.error=error.message||String(error);data.loaded=true;}
    finally{data.loading=false;}
    if(route().split('/')[0]==='admin')render();
  }

  function overlay(title,body){
    const root=document.getElementById('overlay-root');if(!root)return()=>{};
    root.innerHTML=`<div class="entity-sheet-overlay admin-console-overlay" id="admin-console-overlay"><section class="entity-sheet admin-console-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-head"><div><div class="eyebrow">${esc(tx('Admin Console','لوحة المشرف'))}</div><h2>${esc(title)}</h2></div><button class="icon-btn" id="admin-console-close">×</button></div>${body}</section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('admin-console-close').onclick=close;
    document.getElementById('admin-console-overlay').onclick=e=>{if(e.target.id==='admin-console-overlay')close();};
    return close;
  }

  function openStudentAccess(user){
    const close=overlay(tx('Account access','إدارة الحساب'),`<form id="admin-student-access-form">
      <div class="admin-account-summary"><strong>${esc(user.displayName)}</strong><span>${esc(user.email)}</span><small>${esc(tx('Passwords and PINs remain secret.','كلمات المرور وPIN تبقى سرية.'))}</small></div>
      <div class="admin-account-stage"><span>${esc(tx('Academic track','المسار الدراسي'))}</span><strong>${esc(user.studentStage)}</strong></div><div class="field"><label>${esc(tx('Account status','حالة الحساب'))}</label><select name="status"><option value="active" ${user.status==='active'?'selected':''}>${esc(tx('Active','نشط'))}</option><option value="disabled" ${user.status==='disabled'?'selected':''}>${esc(tx('Disabled','معطل'))}</option><option value="deleted" ${user.status==='deleted'?'selected':''}>${esc(tx('Deleted','محذوف'))}</option></select></div>
      <div class="field"><label>${esc(tx('Platform role','دور المنصة'))}</label><select name="platformRole"><option value="student" ${user.platformRole==='student'?'selected':''}>${esc(tx('Standard','عادي'))}</option><option value="admin" ${user.platformRole==='admin'?'selected':''}>${esc(tx('Administrator','مشرف'))}</option></select></div>
      <button class="btn btn-primary auth-submit">${esc(tx('Save account access','حفظ وصول الحساب'))}</button><p class="auth-note" id="admin-student-access-status"></p>
    </form>`);
    document.getElementById('admin-student-access-form').onsubmit=async e=>{
      e.preventDefault();const status=document.getElementById('admin-student-access-status');status.textContent=tx('Saving…','جارٍ الحفظ…');
      try{await window.DafatiiApi.request(`/admin/users/${user.id}`,{method:'PATCH',body:Object.fromEntries(new FormData(e.currentTarget))});close();data.loaded=false;await load(true);}
      catch(error){status.textContent=error.message;}
    };
  }

  function academicFields(levelKey){
    const rule=LEVELS[levelKey]||LEVELS.college;
    const stages=rule.stages.map(value=>`<option value="${value}">${esc(value.replaceAll('_',' '))}</option>`).join('');
    const fields=rule.fields.map(value=>`<option value="${value}">${esc(value)}</option>`).join('');
    return `<div class="field"><label>${esc(tx('Stage','المرحلة'))}</label><select name="academicStage" required>${stages}</select></div>${rule.fields.length?`<div class="field"><label>${esc(tx('Field','الفرع'))}</label><select name="academicField" required>${fields}</select></div>`:''}${rule.org==='college'?`<div class="field"><label>${esc(tx('University name','اسم الجامعة'))}</label><input name="universityName" required maxlength="160"></div><div class="field"><label>${esc(tx('College name','اسم الكلية'))}</label><input name="collegeName" required maxlength="160"></div>`:`<div class="field"><label>${esc(tx('School / institution name','اسم المدرسة / المؤسسة'))}</label><input name="institutionName" required maxlength="160"></div>`}`;
  }

  function openAddStudent(){
    const levelOptions=Object.entries(LEVELS).map(([value,rule])=>`<option value="${value}">${esc(rule.label)}</option>`).join('');
    const close=overlay(tx('Add student','إضافة طالب'),`<form id="admin-add-student-form">
      <div class="suite-form-grid"><div class="field"><label>${esc(tx('Full name','الاسم الكامل'))}</label><input name="displayName" required maxlength="100"></div><div class="field"><label>${esc(tx('Birth date','تاريخ الميلاد'))}</label><input name="birthDate" type="date" required></div></div>
      <div class="field"><label>${esc(tx('Academic level','المستوى الدراسي'))}</label><select name="academicLevel" id="admin-student-level" required>${levelOptions}</select></div><div id="admin-student-academic-fields">${academicFields('primary_school')}</div>
      <div class="suite-form-grid"><div class="field"><label>${esc(tx('Gender','الجنس'))}</label><select name="gender"><option value="male">${esc(tx('Male','ذكر'))}</option><option value="female">${esc(tx('Female','أنثى'))}</option><option value="prefer_not_to_say">${esc(tx('Prefer not to say','أفضل عدم الإجابة'))}</option></select></div><div class="field"><label>${esc(tx('Phone (optional)','الهاتف (اختياري)'))}</label><input name="phone" type="tel" placeholder="+964…"></div></div>
      <div class="field"><label>${esc(tx('Email','البريد الإلكتروني'))}</label><input name="email" type="email" required></div><div class="field"><label>${esc(tx('Temporary password','كلمة مرور مؤقتة'))}</label><input name="password" type="password" minlength="12" required></div>
      <button class="btn btn-primary auth-submit">${esc(tx('Create student account','إنشاء حساب الطالب'))}</button><p class="auth-note" id="admin-add-student-status"></p>
    </form>`);
    const level=document.getElementById('admin-student-level'),fields=document.getElementById('admin-student-academic-fields');
    level.onchange=()=>{fields.innerHTML=academicFields(level.value);};
    document.getElementById('admin-add-student-form').onsubmit=async e=>{
      e.preventDefault();const status=document.getElementById('admin-add-student-status');status.textContent=tx('Creating…','جارٍ الإنشاء…');
      try{
        const result=await window.DafatiiApi.request('/admin/users',{method:'POST',body:Object.fromEntries(new FormData(e.currentTarget))});
        status.innerHTML=`${esc(tx('Created. Student ID:','تم الإنشاء. رقم الطالب:'))} <strong>${esc(result.studentId)}</strong> · PIN <strong>${esc(result.initialPin)}</strong>. ${esc(tx('Save these once, then close.','احفظ هذه البيانات الآن ثم أغلق النافذة.'))}`;
        e.currentTarget.querySelector('button[type="submit"]').disabled=true;
        data.loaded=false;
      }catch(error){status.textContent=error.message;}
    };
  }

  function emptyTeacherDraft(){const first=SUBJECTS[0];return{displayName:'',imageUrl:'',subjects:[{id:first[0],name:first[1],fameScore:0,chapters:[]}]};}
  const clone=value=>JSON.parse(JSON.stringify(value));

  function teacherProfileEditorHtml(draft,adding){
    const subject=draft.subjects?.[0]||emptyTeacherDraft().subjects[0];
    return `<form id="admin-teacher-form"><div class="admin-teacher-profile-form">
      <div class="admin-teacher-picture-preview" id="admin-teacher-picture-preview">${draft.imageUrl?`<img src="${esc(draft.imageUrl)}" alt="">`:`<span>${esc((draft.displayName||'T').slice(0,1).toUpperCase())}</span>`}</div>
      <div class="admin-teacher-profile-fields"><div class="field"><label>${esc(tx('Teacher profile picture','صورة المدرس'))}</label><input id="admin-teacher-image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" ${adding&&!draft.imageUrl?'required':''}><small>${esc(tx('PNG, JPEG, WebP or GIF, up to 220 KB.','PNG أو JPEG أو WebP أو GIF، حتى 220 كيلوبايت.'))}</small></div>
      <div class="field"><label>${esc(tx('Teacher name','اسم المدرس'))}</label><input id="admin-teacher-name" value="${esc(draft.displayName||'')}" required maxlength="100"></div>
      <div class="field"><label>${esc(tx('Subject','المادة'))}</label><select id="admin-teacher-subject" required>${SUBJECTS.map(([id,en,arabicName])=>`<option value="${id}" ${id===subject.id?'selected':''}>${esc(ar()?arabicName:en)}</option>`).join('')}</select></div></div>
    </div><button class="btn btn-primary auth-submit">${esc(adding?tx('Add teacher','إضافة المدرس'):tx('Save profile','حفظ الملف'))}</button><p class="auth-note" id="admin-teacher-status"></p></form>`;
  }

  function readTeacherPicture(file){
    return new Promise((resolve,reject)=>{
      if(!file)return resolve('');
      if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))return reject(new Error(tx('Use a PNG, JPEG, WebP or GIF image.','استخدم صورة PNG أو JPEG أو WebP أو GIF.')));
      if(file.size>220*1024)return reject(new Error(tx('Teacher picture must be 220 KB or smaller.','يجب ألا تتجاوز صورة المدرس 220 كيلوبايت.')));
      const reader=new FileReader();reader.onerror=()=>reject(new Error(tx('Could not read the selected picture.','تعذر قراءة الصورة المحددة.')));reader.onload=()=>resolve(String(reader.result||''));reader.readAsDataURL(file);
    });
  }

  function openTeacherEditor(teacher=null){
    const adding=!teacher,draft=teacher?clone(teacher):emptyTeacherDraft();if(!draft.subjects?.length)draft.subjects=emptyTeacherDraft().subjects;
    const close=overlay(adding?tx('Add teacher','إضافة مدرس'):tx('Edit teacher profile','تعديل ملف المدرس'),teacherProfileEditorHtml(draft,adding));
    const picture=document.getElementById('admin-teacher-image-file');
    picture.onchange=async()=>{const status=document.getElementById('admin-teacher-status');try{draft.imageUrl=await readTeacherPicture(picture.files?.[0]);document.getElementById('admin-teacher-picture-preview').innerHTML=draft.imageUrl?`<img src="${esc(draft.imageUrl)}" alt="">`:'';status.textContent='';}catch(error){picture.value='';status.textContent=error.message;}};
    document.getElementById('admin-teacher-form').onsubmit=async e=>{
      e.preventDefault();const displayName=document.getElementById('admin-teacher-name').value.trim(),subjectId=document.getElementById('admin-teacher-subject').value,status=document.getElementById('admin-teacher-status');
      if(!draft.imageUrl){status.textContent=tx('Add a teacher profile picture.','أضف صورة للمدرس.');return;}status.textContent=tx('Saving…','جارٍ الحفظ…');
      const previous=draft.subjects?.[0],meta=SUBJECTS.find(item=>item[0]===subjectId)||SUBJECTS[0],subject={id:subjectId,name:meta[1],fameScore:Number(previous?.fameScore||0),chapters:previous?.id===subjectId?clone(previous.chapters||[]):[]};
      try{await window.DafatiiApi.request(adding?'/admin/teachers':`/admin/teachers/${teacher.id}`,{method:adding?'POST':'PATCH',body:{displayName,imageUrl:draft.imageUrl,subjects:[subject]}});close();data.loaded=false;await load(true);}catch(error){status.textContent=error.message;}
    };
  }

  function contentDraftFor(teacher){
    if(!teacherContentDraft||teacherContentDraft.teacherId!==teacher.id){const source=teacher.subjects?.[0]||emptyTeacherDraft().subjects[0];teacherContentDraft={teacherId:teacher.id,subject:clone(source)};}
    return teacherContentDraft;
  }

  function teacherContentView(teacher){
    const draft=contentDraftFor(teacher),subject=draft.subject,chapters=subject.chapters||[];
    const chapterHtml=chapters.length?chapters.map((chapter,ci)=>`<article class="admin-content-chapter" data-content-chapter="${ci}">
      <header class="admin-content-chapter-head"><div class="field"><label>${esc(tx('Chapter name','اسم الفصل'))}</label><input data-content-chapter-name="${ci}" value="${esc(chapter.name||'')}" maxlength="120" required></div><div class="admin-content-chapter-actions"><label class="btn btn-ghost btn-small admin-import-button">${esc(tx('Import Excel','استيراد Excel'))}<input type="file" hidden data-content-import="${ci}" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"></label><button class="btn btn-danger btn-small" type="button" data-content-remove-chapter="${ci}">${esc(tx('Delete chapter','حذف الفصل'))}</button></div></header>
      <div class="admin-content-table-wrap"><table class="admin-content-table"><thead><tr><th>${esc(tx('Lecture name','اسم المحاضرة'))}</th><th>${esc(tx('YouTube video link','رابط فيديو يوتيوب'))}</th><th></th></tr></thead><tbody>${(chapter.lectures||[]).map((lecture,li)=>`<tr><td><input data-content-lecture-name="${ci}:${li}" value="${esc(lecture.name||'')}" maxlength="160" required></td><td><input data-content-lecture-link="${ci}:${li}" type="url" value="${esc(lecture.link||'')}" placeholder="https://youtube.com/watch?v=…"></td><td><button type="button" class="icon-btn" data-content-remove-lecture="${ci}:${li}" aria-label="${esc(tx('Remove lecture','حذف المحاضرة'))}">×</button></td></tr>`).join('')}</tbody></table></div>
      <button type="button" class="btn btn-ghost btn-small" data-content-add-lecture="${ci}">＋ ${esc(tx('Add lecture','إضافة محاضرة'))}</button></article>`).join(''):`<div class="admin-console-empty compact">${esc(tx('Add the first chapter, then add lectures manually or import them from Excel.','أضف الفصل الأول، ثم أضف المحاضرات يدوياً أو استوردها من Excel.'))}</div>`;
    return shell(`<div class="admin-teacher-content-page"><div class="admin-content-toolbar"><button class="btn btn-ghost" type="button" data-teacher-content-back>← ${esc(tx('Teachers','المدرسون'))}</button><button class="btn btn-primary" type="button" data-save-teacher-content>${esc(tx('Save content','حفظ المحتوى'))}</button></div>
      <header class="admin-content-teacher"><div class="admin-teacher-avatar">${teacher.imageUrl?`<img src="${esc(teacher.imageUrl)}" alt="">`:esc((teacher.displayName||'T').slice(0,1))}</div><div><div class="eyebrow">${esc(subjectLabel(subject.id))}</div><h2>${esc(teacher.displayName)}</h2><p>${esc(tx('Organize this subject by chapter. Each lecture has a name and a YouTube video link. Excel import reads exactly the first two columns.','نظّم هذه المادة حسب الفصل. لكل محاضرة اسم ورابط فيديو يوتيوب. يستورد Excel أول عمودين فقط.'))}</p></div></header>
      <div class="admin-content-actions"><button class="btn btn-primary" type="button" data-content-add-chapter>＋ ${esc(tx('Add chapter','إضافة فصل'))}</button><span id="admin-content-status" class="auth-note"></span></div><div class="admin-content-chapters">${chapterHtml}</div></div>`);
  }

  function syncTeacherContentInputs(draft){
    document.querySelectorAll('[data-content-chapter-name]').forEach(input=>{const chapter=draft.subject.chapters?.[Number(input.dataset.contentChapterName)];if(chapter)chapter.name=input.value;});
    document.querySelectorAll('[data-content-lecture-name]').forEach(input=>{const [c,l]=input.dataset.contentLectureName.split(':').map(Number);if(draft.subject.chapters?.[c]?.lectures?.[l])draft.subject.chapters[c].lectures[l].name=input.value;});
    document.querySelectorAll('[data-content-lecture-link]').forEach(input=>{const [c,l]=input.dataset.contentLectureLink.split(':').map(Number);if(draft.subject.chapters?.[c]?.lectures?.[l])draft.subject.chapters[c].lectures[l].link=input.value;});
  }
  function normalizeYoutubeLink(value){const raw=String(value||'').trim();if(!raw)return '';let url;try{url=new URL(raw);}catch{return '';}const host=url.hostname.toLowerCase().replace(/^www\./,'');return url.protocol==='https:'&&(host==='youtu.be'||host==='youtube.com'||host.endsWith('.youtube.com'))?url.href:'';}
  async function importChapterSpreadsheet(file,draft,chapterIndex){
    if(!file)return;if(!window.XLSX)throw new Error(tx('Excel import is not available yet. Reload the page and try again.','استيراد Excel غير متاح الآن. أعد تحميل الصفحة وحاول مرة أخرى.'));
    const bytes=await file.arrayBuffer(),workbook=window.XLSX.read(bytes,{type:'array'}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=window.XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''}),parsed=[];
    rows.forEach((row,index)=>{const name=String(row?.[0]||'').trim(),rawLink=String(row?.[1]||'').trim();if(!name&&!rawLink)return;if(index===0&&/lecture|محاضرة/i.test(name)&&/youtube|video|link|رابط|يوتيوب/i.test(rawLink))return;const link=normalizeYoutubeLink(rawLink);if(!name||!link)throw new Error(tx(`Invalid row ${index+1}. Column A must be the lecture name and column B must be a valid HTTPS YouTube link.`,`الصف ${index+1} غير صالح. العمود A لاسم المحاضرة والعمود B لرابط يوتيوب HTTPS صالح.`));parsed.push({id:crypto.randomUUID(),name,link});});
    if(!parsed.length)throw new Error(tx('The spreadsheet has no lecture rows to import.','لا يحتوي الملف على صفوف محاضرات للاستيراد.'));const chapter=draft.subject.chapters?.[chapterIndex];if(!chapter)return;const combined=[...(chapter.lectures||[]),...parsed],seen=new Set();chapter.lectures=combined.filter(item=>{const key=`${String(item.name).trim().toLowerCase()}\0${String(item.link).trim()}`;if(seen.has(key))return false;seen.add(key);return true;});
  }
  function bindTeacherContent(teacher){
    const draft=contentDraftFor(teacher);
    document.querySelector('[data-teacher-content-back]')?.addEventListener('click',()=>{teacherContentDraft=null;location.hash='admin/teachers';});
    document.querySelector('[data-content-add-chapter]')?.addEventListener('click',()=>{syncTeacherContentInputs(draft);draft.subject.chapters=draft.subject.chapters||[];draft.subject.chapters.push({id:crypto.randomUUID(),name:tx('New chapter','فصل جديد'),lectures:[]});render();});
    document.querySelectorAll('[data-content-remove-chapter]').forEach(button=>button.onclick=()=>{syncTeacherContentInputs(draft);draft.subject.chapters.splice(Number(button.dataset.contentRemoveChapter),1);render();});
    document.querySelectorAll('[data-content-add-lecture]').forEach(button=>button.onclick=()=>{syncTeacherContentInputs(draft);const chapter=draft.subject.chapters?.[Number(button.dataset.contentAddLecture)];if(chapter){chapter.lectures=chapter.lectures||[];chapter.lectures.push({id:crypto.randomUUID(),name:'',link:''});render();}});
    document.querySelectorAll('[data-content-remove-lecture]').forEach(button=>button.onclick=()=>{syncTeacherContentInputs(draft);const [c,l]=button.dataset.contentRemoveLecture.split(':').map(Number);draft.subject.chapters?.[c]?.lectures?.splice(l,1);render();});
    document.querySelectorAll('[data-content-import]').forEach(input=>input.onchange=async()=>{const status=document.getElementById('admin-content-status');syncTeacherContentInputs(draft);status.textContent=tx('Importing…','جارٍ الاستيراد…');try{await importChapterSpreadsheet(input.files?.[0],draft,Number(input.dataset.contentImport));render();}catch(error){status.textContent=error.message;input.value='';}});
    document.querySelector('[data-save-teacher-content]')?.addEventListener('click',async()=>{const status=document.getElementById('admin-content-status');syncTeacherContentInputs(draft);for(const chapter of draft.subject.chapters||[]){if(!String(chapter.name||'').trim()){status.textContent=tx('Every chapter needs a name.','كل فصل يحتاج اسماً.');return;}for(const lecture of chapter.lectures||[]){const link=normalizeYoutubeLink(lecture.link);if(!String(lecture.name||'').trim()||!link){status.textContent=tx('Every lecture needs a name and a valid HTTPS YouTube link.','كل محاضرة تحتاج اسماً ورابط يوتيوب HTTPS صالحاً.');return;}lecture.link=link;}}status.textContent=tx('Saving…','جارٍ الحفظ…');try{await window.DafatiiApi.request(`/admin/teachers/${teacher.id}`,{method:'PATCH',body:{subjects:[draft.subject]}});teacherContentDraft=null;data.loaded=false;await load(true);}catch(error){status.textContent=error.message;}});
  }

  async function patchStudent(id,body){
    await window.DafatiiApi.request(`/admin/users/${id}`,{method:'PATCH',body});data.loaded=false;await load(true);
  }

  async function bind(){
    document.body.classList.add('admin-console-active');
    document.querySelectorAll('[data-admin-tab]').forEach(button=>button.onclick=()=>{location.hash=`admin/${button.dataset.adminTab}`;});
    document.getElementById('admin-console-refresh')?.addEventListener('click',()=>load(true));
    document.getElementById('admin-add-student')?.addEventListener('click',openAddStudent);
    document.querySelectorAll('[data-student-access]').forEach(button=>button.onclick=()=>openStudentAccess(data.users.find(user=>user.id===button.dataset.studentAccess)));
    document.querySelectorAll('[data-student-status]').forEach(button=>button.onclick=async()=>{try{await patchStudent(button.dataset.studentStatus,{status:button.dataset.status});}catch(error){data.error=error.message;render();}});
    document.querySelectorAll('[data-student-delete]').forEach(button=>button.onclick=async()=>{if(!confirm(tx('Soft-delete this student account?','حذف حساب الطالب بشكل منطقي؟')))return;try{await patchStudent(button.dataset.studentDelete,{status:'deleted'});}catch(error){data.error=error.message;render();}});
    document.getElementById('admin-add-teacher')?.addEventListener('click',()=>openTeacherEditor());
    document.querySelectorAll('[data-teacher-open]').forEach(button=>button.onclick=()=>{teacherContentDraft=null;location.hash=`admin/teachers/${encodeURIComponent(button.dataset.teacherOpen)}`;});
    document.querySelectorAll('[data-teacher-edit]').forEach(button=>button.onclick=event=>{event.stopPropagation();openTeacherEditor(data.teachers.find(t=>t.id===button.dataset.teacherEdit));});
    const contentTeacherId=adminTeacherId();if(contentTeacherId){const contentTeacher=data.teachers.find(item=>item.id===contentTeacherId);if(contentTeacher)bindTeacherContent(contentTeacher);}
    document.querySelectorAll('[data-teacher-status]').forEach(button=>button.onclick=async()=>{try{await window.DafatiiApi.request(`/admin/teachers/${button.dataset.teacherStatus}`,{method:'PATCH',body:{status:button.dataset.status}});data.loaded=false;await load(true);}catch(error){data.error=error.message;render();}});
    document.querySelectorAll('[data-teacher-delete]').forEach(button=>button.onclick=async()=>{if(!confirm(tx('Permanently delete this teacher directory profile and content?','حذف ملف المدرس ومحتواه من الدليل نهائياً؟')))return;try{await window.DafatiiApi.request(`/admin/teachers/${button.dataset.teacherDelete}`,{method:'DELETE'});data.loaded=false;await load(true);}catch(error){data.error=error.message;render();}});
    document.getElementById('admin-create-course')?.addEventListener('click',()=>{location.hash='change-course';});
    document.querySelectorAll('[data-admin-course-open]').forEach(button=>button.onclick=async()=>{await window.DafatiiCourses.switchCourse(button.dataset.adminCourseOpen);location.hash='representer';});
    document.querySelectorAll('[data-admin-course-archive]').forEach(button=>button.onclick=async()=>{if(!confirm(tx('Archive this course?','أرشفة هذه الدورة؟')))return;try{await window.DafatiiApi.request(`/courses/${button.dataset.adminCourseArchive}`,{method:'DELETE'});data.loaded=false;await load(true);}catch(error){data.error=error.message;render();}});
    document.querySelectorAll('[data-admin-room-delete]').forEach(button=>button.onclick=async()=>{if(!confirm(tx('Remove this study room?','حذف غرفة الدراسة؟')))return;try{await window.DafatiiApi.request(`/admin/study-rooms/${button.dataset.owner}/${encodeURIComponent(button.dataset.room)}`,{method:'DELETE'});data.loaded=false;await load(true);}catch(error){data.error=error.message;render();}});
  }

  const previousContent=workspaceContent;
  workspaceContent=function(page,parts,title){
    if(page==='admin')return adminPage();
    return previousContent(page,parts,title);
  };
  const previousWorkspace=workspace;
  workspace=function(current){
    const isAdmin=current.split('/')[0]==='admin';
    if(!isAdmin)document.body.classList.remove('admin-console-active');
    previousWorkspace(current);
    if(isAdmin){void bind();if(!data.loaded&&!data.loading)void load();}
  };

  window.addEventListener('dafatii:auth:changed',()=>{data.loaded=false;data.users=[];data.teachers=[];data.courses=[];data.rooms=[];});
})();