(() => {
  'use strict';
  window.DafatiiAdminSupervision=true;
  const esc=value=>escapeHtml(value??'');
  const rtl=()=>document.documentElement.dir==='rtl'||document.documentElement.lang==='ar';
  const copy=()=>rtl()?{
    title:'لوحة المشرف',supervision:'الإشراف',students:'الطلاب',dafat:'الدفعات',teachers:'المدرسون',search:'بحث',allLevels:'كل المستويات',allStages:'كل المراحل',allFields:'كل الفروع',apply:'تطبيق',edit:'تعديل',remove:'إزالة',restore:'استعادة',delete:'حذف',empty:'لا توجد نتائج',loading:'جارٍ تحميل بيانات الإشراف…',reset:'تمت إزالة الحسابات والدفعات القديمة مع الاحتفاظ بحساب المشرف الحالي.',name:'الاسم',institution:'المؤسسة',status:'الحالة',level:'المستوى',stage:'المرحلة',field:'الفرع',subject:'المادة',fame:'الشهرة',save:'حفظ',cancel:'إلغاء',danger:'هذا الإجراء نهائي ولا يمكن التراجع عنه.'
  }:{
    title:'Admin Panel',supervision:'Supervision',students:'Students',dafat:'Dafat',teachers:'Teachers',search:'Search',allLevels:'All levels',allStages:'All stages',allFields:'All fields',apply:'Apply',edit:'Edit',remove:'Remove',restore:'Restore',delete:'Delete',empty:'No results',loading:'Loading supervision data…',reset:'Existing accounts and Dafat were cleared. The current administrator was preserved.',name:'Name',institution:'Institution',status:'Status',level:'Level',stage:'Stage',field:'Field',subject:'Subject',fame:'Fame',save:'Save',cancel:'Cancel',danger:'This action is permanent and cannot be undone.'
  };
  let data=null, activeTab='students';
  const LEVELS=['primary_school','middle_school','preparatory_school','institute','college','primary_studies','postgraduate_studies'];
  const STAGES=['first','second','third','fourth','fifth','sixth','primary_studies','postgraduate_studies'];
  const FIELDS=['scientific','literary','medical','technical','mechanical','electrical','chemical','petroleum','engineering','sciences','education'];
  const levelLabel=value=>String(value||'—').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

  async function api(path='',options={}) {
    const response=await fetch(`/api/v1/admin/supervision${path}`,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    const body=await response.json().catch(()=>({}));
    if(!response.ok||!body.ok) throw new Error(body?.error?.message||`Request failed (${response.status})`);
    return body.data;
  }

  function shell(){
    const c=copy();
    return `<section class="suite-page admin-supervision-page">
      <div class="suite-head"><div><div class="eyebrow">${esc(c.supervision)}</div><h1>${esc(c.title)}</h1><p>${esc(c.supervision)} · ${esc(c.students)} · ${esc(c.dafat)} · ${esc(c.teachers)}</p></div></div>
      <div class="admin-panel-tabs"><button class="active" data-admin-section="supervision">${esc(c.supervision)}</button></div>
      <div id="admin-supervision-root" class="admin-supervision-root"><div class="admin-loading">${esc(c.loading)}</div></div>
    </section>`;
  }

  const previousWorkspaceContent=workspaceContent;
  workspaceContent=function(page,parts,title){if(page==='admin')return shell();return previousWorkspaceContent(page,parts,title);};
  const previousWorkspace=workspace;
  workspace=function(current){previousWorkspace(current);if(current.split('/')[0]==='admin')bind();};

  function bind(){
    const root=document.getElementById('admin-supervision-root');
    if(!root||window.DafatiiAuth?.user?.platformRole!=='admin') return;
    load();
  }

  function filters(){
    const c=copy();
    return `<form class="admin-filterbar" id="admin-filter-form">
      <input name="q" type="search" placeholder="${esc(c.search)}">
      <select name="level"><option value="">${esc(c.allLevels)}</option>${LEVELS.map(v=>`<option value="${v}">${esc(levelLabel(v))}</option>`).join('')}</select>
      <select name="stage"><option value="">${esc(c.allStages)}</option>${STAGES.map(v=>`<option value="${v}">${esc(levelLabel(v))}</option>`).join('')}</select>
      <select name="field"><option value="">${esc(c.allFields)}</option>${FIELDS.map(v=>`<option value="${v}">${esc(levelLabel(v))}</option>`).join('')}</select>
      <button class="btn btn-primary" type="submit">${esc(c.apply)}</button>
    </form>`;
  }

  function render(){
    const root=document.getElementById('admin-supervision-root'); if(!root||!data)return;
    const c=copy();
    const lists={students:data.students||[],dafat:data.dafat||[],teachers:data.teachers||[]};
    root.innerHTML=`${data.resetApplied?`<div class="admin-reset-notice">${esc(c.reset)}</div>`:''}${filters()}
      <div class="admin-entity-tabs">${['students','dafat','teachers'].map(key=>`<button class="${activeTab===key?'active':''}" data-admin-tab="${key}">${esc(c[key])}<span>${lists[key].length}</span></button>`).join('')}</div>
      <div class="admin-results">${renderList(activeTab,lists[activeTab])}</div>`;
    document.getElementById('admin-filter-form').onsubmit=e=>{e.preventDefault();load(new URLSearchParams(new FormData(e.currentTarget)));};
    root.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.onclick=()=>{activeTab=btn.dataset.adminTab;render();});
    root.querySelectorAll('[data-admin-action]').forEach(btn=>btn.onclick=()=>action(btn.dataset.adminAction,btn.dataset.id));
  }

  function meta(parts){return parts.filter(Boolean).map(part=>esc(part)).join(' · ');}
  function renderList(kind,items){
    const c=copy(); if(!items.length)return `<div class="admin-empty">${esc(c.empty)}</div>`;
    if(kind==='students')return `<div class="admin-grid">${items.map(item=>`<article class="admin-card"><div><span class="admin-badge">${esc(item.status)}</span><h3>${esc(item.display_name)}</h3><p>${esc(item.email_normalized)}</p><small>${meta([levelLabel(item.academic_level),levelLabel(item.academic_stage),levelLabel(item.academic_field),item.institution_name])}</small></div><div class="admin-actions"><button data-admin-action="edit-student" data-id="${item.id}">${esc(c.edit)}</button><button data-admin-action="toggle-student" data-id="${item.id}">${esc(item.status==='active'?c.remove:c.restore)}</button><button class="danger" data-admin-action="delete-student" data-id="${item.id}">${esc(c.delete)}</button></div></article>`).join('')}</div>`;
    if(kind==='dafat')return `<div class="admin-grid">${items.map(item=>`<article class="admin-card"><div><span class="admin-badge">${esc(item.status)}</span><h3>${esc(item.name)}</h3><p>${esc(item.owner_name||item.owner_email||'')}</p><small>${meta([item.institution,levelLabel(item.academic_level),levelLabel(item.academic_stage),levelLabel(item.academic_field)])}</small></div><div class="admin-actions"><button data-admin-action="edit-dafaa" data-id="${item.id}">${esc(c.edit)}</button><button data-admin-action="toggle-dafaa" data-id="${item.id}">${esc(item.status==='active'?c.remove:c.restore)}</button><button class="danger" data-admin-action="delete-dafaa" data-id="${item.id}">${esc(c.delete)}</button></div></article>`).join('')}</div>`;
    return `<div class="admin-grid">${items.map(item=>`<article class="admin-card"><div><span class="admin-badge">${esc(item.status)}</span><h3>${esc(item.display_name)}</h3><p>${esc(item.subject)} · ${esc(c.fame)} ${Number(item.fame_score||0)}</p><small>${meta([levelLabel(item.academic_level),levelLabel(item.academic_stage),levelLabel(item.academic_field),item.email_normalized])}</small></div><div class="admin-actions"><button data-admin-action="edit-teacher" data-id="${item.id}">${esc(c.edit)}</button><button data-admin-action="remove-teacher" data-id="${item.id}">${esc(c.remove)}</button><button class="danger" data-admin-action="delete-teacher-account" data-id="${item.id}">${esc(c.delete)}</button></div></article>`).join('')}</div>`;
  }

  async function load(params=new URLSearchParams()){
    const root=document.getElementById('admin-supervision-root'); if(root)root.innerHTML=`<div class="admin-loading">${esc(copy().loading)}</div>`;
    try{data=await api(params.toString()?`?${params}`:'');render();}catch(error){if(root)root.innerHTML=`<div class="admin-error">${esc(error.message)}</div>`;}
  }

  function find(kind,id){return (data?.[kind]||[]).find(item=>item.id===id);}
  function sheet(title,body,onSubmit){
    const c=copy(),overlay=document.getElementById('overlay-root');
    overlay.innerHTML=`<div class="entity-sheet-overlay suite-overlay" id="admin-overlay"><section class="entity-sheet suite-sheet admin-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" type="button" id="admin-close">×</button></div><form id="admin-edit-form">${body}<div class="admin-sheet-actions"><button class="btn btn-ghost" type="button" id="admin-cancel">${esc(c.cancel)}</button><button class="btn btn-primary" type="submit">${esc(c.save)}</button></div><p class="auth-note" id="admin-form-status"></p></form></section></div>`;
    const close=()=>overlay.innerHTML='';document.getElementById('admin-close').onclick=close;document.getElementById('admin-cancel').onclick=close;
    document.getElementById('admin-edit-form').onsubmit=async e=>{e.preventDefault();const status=document.getElementById('admin-form-status');try{await onSubmit(Object.fromEntries(new FormData(e.currentTarget)));close();await load();}catch(error){status.textContent=error.message;}};
  }

  function academicFields(item={}){const c=copy();return `<div class="field"><label>${esc(c.level)}</label><select name="academicLevel">${LEVELS.map(v=>`<option value="${v}" ${item.academic_level===v?'selected':''}>${esc(levelLabel(v))}</option>`).join('')}</select></div><div class="field"><label>${esc(c.stage)}</label><select name="academicStage">${STAGES.map(v=>`<option value="${v}" ${item.academic_stage===v?'selected':''}>${esc(levelLabel(v))}</option>`).join('')}</select></div><div class="field"><label>${esc(c.field)}</label><select name="academicField"><option value="">—</option>${FIELDS.map(v=>`<option value="${v}" ${item.academic_field===v?'selected':''}>${esc(levelLabel(v))}</option>`).join('')}</select></div>`;}

  async function action(type,id){
    const c=copy();
    if(type==='edit-student'){
      const item=find('students',id);if(!item)return;
      return sheet(c.edit,`<div class="field"><label>${esc(c.name)}</label><input name="displayName" value="${esc(item.display_name)}" required></div><div class="field"><label>${esc(c.institution)}</label><input name="institutionName" value="${esc(item.institution_name||'')}" required></div>${academicFields(item)}`,values=>api(`/students/${id}`,{method:'PATCH',body:JSON.stringify(values)}));
    }
    if(type==='edit-dafaa'){
      const item=find('dafat',id);if(!item)return;
      return sheet(c.edit,`<div class="field"><label>${esc(c.name)}</label><input name="name" value="${esc(item.name)}" required></div><div class="field"><label>${esc(c.institution)}</label><input name="institution" value="${esc(item.institution||'')}"></div><div class="field"><label>${esc(c.stage)}</label><select name="stage"><option value="university" ${item.stage==='university'?'selected':''}>University</option><option value="independent" ${item.stage==='independent'?'selected':''}>Independent</option></select></div>`,values=>api(`/dafat/${id}`,{method:'PATCH',body:JSON.stringify(values)}));
    }
    if(type==='edit-teacher'){
      const item=find('teachers',id);if(!item)return;
      const subjects=data?.filters?.subjects||[];
      return sheet(c.edit,`<div class="field"><label>${esc(c.subject)}</label><select name="subject">${subjects.map(v=>`<option value="${v}" ${item.subject===v?'selected':''}>${esc(levelLabel(v))}</option>`).join('')}</select></div><div class="field"><label>${esc(c.fame)}</label><input name="fameScore" type="number" min="0" value="${Number(item.fame_score||0)}"></div>${academicFields(item)}`,values=>{values.fameScore=Number(values.fameScore);return api(`/teachers/${id}`,{method:'PATCH',body:JSON.stringify(values)});});
    }
    if(type==='toggle-student'){const item=find('students',id);if(item)await api(`/students/${id}`,{method:'PATCH',body:JSON.stringify({status:item.status==='active'?'disabled':'active',displayName:item.display_name,institutionName:item.institution_name,academicLevel:item.academic_level,academicStage:item.academic_stage,academicField:item.academic_field||''})});return load();}
    if(type==='toggle-dafaa'){const item=find('dafat',id);if(item)await api(`/dafat/${id}`,{method:'PATCH',body:JSON.stringify({status:item.status==='active'?'archived':'active'})});return load();}
    if(!confirm(c.danger))return;
    if(type==='delete-student')await api(`/students/${id}`,{method:'DELETE'});
    if(type==='delete-dafaa')await api(`/dafat/${id}`,{method:'DELETE'});
    if(type==='remove-teacher')await api(`/teachers/${id}`,{method:'DELETE'});
    if(type==='delete-teacher-account')await api(`/teachers/${id}/account`,{method:'DELETE'});
    await load();
  }
})();
