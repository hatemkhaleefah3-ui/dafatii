(() => {
  'use strict';
  const esc=value=>escapeHtml(value??'');
  const statusLabel=value=>({active:'Enrolled',pending:'Awaiting acceptance',payment_pending:'Payment verification pending',rejected:'Rejected',removed:'Removed'}[value]||'Available');
  const money=dafaa=>dafaa.pricing==='free'?'Free':new Intl.NumberFormat(undefined,{style:'currency',currency:dafaa.currency||'USD'}).format((dafaa.priceMinor||0)/100);
  LABELS.dafati='Dafati';

  function dafaaPage(){
    const active=window.DafatiiDafat.active(),dafat=window.DafatiiDafat.list(),actor=window.DafatiiDafat.actor||window.DafatiiAuth.user;
    const enrolled=dafat.filter(dafaa=>dafaa.membership?.status==='active');
    const available=dafat.filter(dafaa=>!dafaa.membership||dafaa.membership.status!=='active');
    const canCreate=actor?.platformRole==='admin'||actor?.accountType==='representer';
    return `<section class="suite-page dafaa-manager">
      <div class="suite-head"><div><div class="eyebrow">Dafat and enrollment</div><h1>Dafati</h1><p>Enrollment, roles and every Dafaa workspace are stored securely on the server.</p></div><div class="suite-head-actions">${canCreate?'<button class="btn btn-primary" id="dafaa-add">＋ Create a Dafaa</button>':''}<button class="btn btn-ghost" id="dafaa-join">Join with code</button></div></div>
      ${active.id?`<article class="dafaa-active-hero"><span class="dafaa-active-icon">◇</span><div><div class="eyebrow">Active Dafaa · ${esc(active.membership?.role||'student')}</div><h2>${esc(active.name)}</h2><p>${esc([active.institution,active.stage].filter(Boolean).join(' · '))}</p></div><div class="dafaa-active-count"><strong>${state.subjects.length}</strong><span>subjects</span></div></article>`:'<article class="dafaa-explainer"><span>＋</span><div><h2>No active Dafaa yet</h2><p>Join a Dafaa, or create a Dafaa from a representer account.</p></div></article>'}
      <h2 class="dafaa-section-title">Enrolled</h2><div class="dafaa-card-grid">${enrolled.length?enrolled.map(dafaaCard).join(''):'<p class="muted">You are not enrolled in an active Dafaa.</p>'}</div>
      <h2 class="dafaa-section-title">Discover Dafat</h2><div class="dafaa-card-grid">${available.length?available.map(dafaaCard).join(''):'<p class="muted">No other public Dafat are available.</p>'}</div>
      <article class="dafaa-explainer"><span>i</span><div><h2>Paid enrollment is verified manually</h2><p>Dafatii records payment as pending until an authorized representer or administrator confirms it. No payment processor is connected yet.</p></div></article>
    </section>`;
  }

  function dafaaCard(dafaa){
    const member=dafaa.membership,status=member?.status,active=dafaa.id===window.DafatiiDafat.active().id;
    return `<article class="dafaa-card ${active?'active':''}"><div class="dafaa-card-top"><span>◇</span><b>${esc(statusLabel(status))}</b></div><h2>${esc(dafaa.name)}</h2><p>${esc([dafaa.institution,dafaa.stage,money(dafaa),dafaa.visibility,dafaa.joinPolicy==='approval'?'Approval required':'Direct join'].filter(Boolean).join(' · '))}</p><div class="dafaa-card-actions">${status==='active'?`<button class="btn ${active?'btn-ghost':'btn-primary'}" data-dafaa-switch="${esc(dafaa.id)}" ${active?'disabled':''}>${active?'Currently open':'Open Dafaa'}</button>`:status?`<span class="dafaa-status">${esc(statusLabel(status))}</span>`:`<button class="btn btn-primary" data-dafaa-enroll="${esc(dafaa.enrollmentCode)}" data-private="${dafaa.visibility==='private'?'1':'0'}">Enroll</button>`}</div></article>`;
  }

  const previousWorkspaceContent=workspaceContent;
  workspaceContent=function(page,parts,title){if(page==='dafati')return dafaaPage();return previousWorkspaceContent(page,parts,title);};
  const previousWorkspace=workspace;
  workspace=function(current){previousWorkspace(current);enhanceDafaaSwitcher();if(current.split('/')[0]==='dafati')bindDafaaManager();};

  function enhanceDafaaSwitcher(){
    const host=document.querySelector('.settings-inner'),dafat=window.DafatiiDafat.list().filter(dafaa=>dafaa.membership?.status==='active'),active=window.DafatiiDafat.active();if(!host||!active.id||host.querySelector('[data-dafaa-picker]'))return;
    const label=document.createElement('label');label.className='dafaa-picker';label.dataset.dafaaPicker='';label.innerHTML=`<span class="dafaa-picker-icon">◇</span><span class="dafaa-picker-copy"><small>Active Dafaa</small><strong>${esc(active.name)}</strong></span><select aria-label="Active Dafaa">${dafat.map(dafaa=>`<option value="${esc(dafaa.id)}" ${dafaa.id===active.id?'selected':''}>${esc(dafaa.name)}</option>`).join('')}</select><b>⌄</b>`;
    label.querySelector('select').addEventListener('change',async event=>{await window.DafatiiDafat.switchDafaa(event.target.value);});host.prepend(label);
  }

  function bindDafaaManager(){
    document.querySelectorAll('[data-dafaa-switch]').forEach(button=>button.onclick=()=>window.DafatiiDafat.switchDafaa(button.dataset.dafaaSwitch));
    document.querySelectorAll('[data-dafaa-enroll]').forEach(button=>button.onclick=()=>openEnrollSheet(button.dataset.dafaaEnroll,button.dataset.private==='1'));
    document.getElementById('dafaa-add')?.addEventListener('click',()=>openDafaaSheet());document.getElementById('dafaa-join')?.addEventListener('click',()=>openEnrollSheet('',false));
  }

  function sheet(title,body){const root=document.getElementById('overlay-root');root.innerHTML=`<div class="entity-sheet-overlay suite-overlay" id="dafaa-overlay"><section class="entity-sheet suite-sheet dafaa-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" id="dafaa-close">×</button></div>${body}</section></div>`;const close=()=>root.innerHTML='';document.getElementById('dafaa-close').onclick=close;document.getElementById('dafaa-overlay').onclick=e=>{if(e.target.id==='dafaa-overlay')close();};return close;}
  function openEnrollSheet(code='',privateDafaa=false){
    const close=sheet('Join a Dafaa',`<form id="dafaa-enroll-form"><div class="field"><label>Enrollment code</label><input name="dafaa" value="${esc(code)}" maxlength="36" required></div><div class="field"><label>Private access code <span class="field-optional">If required</span></label><input name="accessCode" type="password" minlength="6" maxlength="64" ${privateDafaa?'required':''}></div><div class="field"><label>Application note <span class="field-optional">Optional</span></label><textarea name="note" maxlength="500"></textarea></div><button class="btn btn-primary auth-submit">Submit enrollment</button><p class="auth-note" id="dafaa-status"></p></form>`);
    document.getElementById('dafaa-enroll-form').onsubmit=async e=>{e.preventDefault();const values=new FormData(e.currentTarget),status=document.getElementById('dafaa-status');try{const result=await window.DafatiiDafat.enroll(Object.fromEntries(values));status.textContent=statusLabel(result.status);if(result.status==='active'){close();await window.DafatiiDafat.switchDafaa(result.dafaaId);}else setTimeout(()=>{close();render();},900);}catch(error){status.textContent=error.message;}};
  }
  function openDafaaSheet(){
    const templates=window.DafatiiDafat.templates();const close=sheet('Create a Dafaa',`<form id="dafaa-form"><div class="field"><label>Dafaa name</label><input name="name" maxlength="120" required></div><div class="field"><label>Content template</label><select name="templateName">${templates.map(name=>`<option>${esc(name)}</option>`).join('')}</select></div><div class="suite-form-grid"><div class="field"><label>Institution</label><input name="institution" maxlength="160"></div><div class="field"><label>Stage</label><select name="stage"><option value="school">School</option><option value="university" selected>University</option><option value="independent">Independent</option></select></div><div class="field"><label>Pricing</label><select name="pricing"><option value="free">Free</option><option value="paid">Paid</option></select></div><div class="field"><label>Price (minor units)</label><input name="priceMinor" type="number" min="0" value="0"></div><div class="field"><label>Visibility</label><select name="visibility"><option value="public">Public</option><option value="private">Private by code</option></select></div><div class="field"><label>Join policy</label><select name="joinPolicy"><option value="approval">Needs acceptance</option><option value="direct">Direct join</option></select></div></div><div class="field"><label>Private access code</label><input name="accessCode" type="password" minlength="6" maxlength="64"></div><button class="btn btn-primary auth-submit" type="submit">Create a Dafaa</button><p class="auth-note" id="dafaa-status"></p></form>`);
    document.getElementById('dafaa-form').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,status=document.getElementById('dafaa-status'),submit=form.querySelector('button[type=submit]'),data=Object.fromEntries(new FormData(form));data.priceMinor=Number(data.priceMinor);submit.disabled=true;status.textContent='Creating secure Dafaa workspace…';try{await window.DafatiiDafat.createDafaa(data);close();setHash('dashboard/overview');}catch(error){status.textContent=error.message;submit.disabled=false;}};
  }
})();
