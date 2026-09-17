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
    const canCreate=actor?.platformRole==='admin'||actor?.studentStage==='university';
    return `<section class="suite-page dafaa-manager">
      <div class="suite-head"><div><div class="eyebrow">Dafat and enrollment</div><h1>Dafati</h1><p>Enrollment, roles and every Dafaa workspace are stored securely on the server.</p></div><div class="suite-head-actions">${canCreate?'<button class="btn btn-primary" id="dafaa-add">＋ Create a Dafaa</button>':''}<button class="btn btn-ghost" id="dafaa-join">Join with code</button></div></div>
      ${active.id?`<article class="dafaa-active-hero"><span class="dafaa-active-icon">◇</span><div><div class="eyebrow">Active Dafaa · ${esc(active.membership?.role||'student')}</div><h2>${esc(active.name)}</h2><p>${esc([active.institution,active.stage].filter(Boolean).join(' · '))}</p></div><div class="dafaa-active-count"><strong>${state.subjects.length}</strong><span>subjects</span></div></article>`:'<article class="dafaa-explainer"><span>＋</span><div><h2>No active Dafaa yet</h2><p>Join a Dafaa, or create your own Dafaa if you are a post-school student.</p></div></article>'}
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
    document.getElementById('dafaa-add')?.addEventListener('click',()=>openDafaaSheetV2());document.getElementById('dafaa-join')?.addEventListener('click',()=>openEnrollSheet('',false));
  }

  function sheet(title,body){const root=document.getElementById('overlay-root');root.innerHTML=`<div class="entity-sheet-overlay suite-overlay" id="dafaa-overlay"><section class="entity-sheet suite-sheet dafaa-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" id="dafaa-close">×</button></div>${body}</section></div>`;const close=()=>root.innerHTML='';document.getElementById('dafaa-close').onclick=close;document.getElementById('dafaa-overlay').onclick=e=>{if(e.target.id==='dafaa-overlay')close();};return close;}
  function openEnrollSheet(code='',privateDafaa=false){
    const close=sheet('Join a Dafaa',`<form id="dafaa-enroll-form"><div class="field"><label>Enrollment code</label><input name="dafaa" value="${esc(code)}" maxlength="36" required></div><div class="field"><label>Private access code <span class="field-optional">If required</span></label><input name="accessCode" type="password" minlength="6" maxlength="64" ${privateDafaa?'required':''}></div><div class="field"><label>Application note <span class="field-optional">Optional</span></label><textarea name="note" maxlength="500"></textarea></div><button class="btn btn-primary auth-submit">Submit enrollment</button><p class="auth-note" id="dafaa-status"></p></form>`);
    document.getElementById('dafaa-enroll-form').onsubmit=async e=>{e.preventDefault();const values=new FormData(e.currentTarget),status=document.getElementById('dafaa-status');try{const result=await window.DafatiiDafat.enroll(Object.fromEntries(values));status.textContent=statusLabel(result.status);if(result.status==='active'){close();await window.DafatiiDafat.switchDafaa(result.dafaaId);}else setTimeout(()=>{close();render();},900);}catch(error){status.textContent=error.message;}};
  }

  function openDafaaSheetV2(){
    const close=sheet('Create a new Dafaa',`<form id="dafaa-create-v2" class="dafaa-create-v2">
      <div class="dafaa-create-intro"><span>◇</span><div><strong>New Dafaa</strong><p>For higher-education students. You will be the owner immediately after creation.</p></div></div>
      <section class="dafaa-create-section"><h3>Identity</h3><div class="field"><label>Dafaa name</label><input name="name" maxlength="120" autocomplete="off" required placeholder="Example: Medical Class 2027"></div><div class="field"><label>Institution</label><input name="institution" maxlength="160" autocomplete="organization" placeholder="University, college or institute"></div><div class="field"><label>Description <span class="field-optional">Optional</span></label><textarea name="description" maxlength="1000" rows="3" placeholder="What is this Dafaa for?"></textarea></div></section>
      <section class="dafaa-create-section"><h3>Enrollment</h3><div class="suite-form-grid"><div class="field"><label>Visibility</label><select name="visibility" id="dafaa-v2-visibility"><option value="public">Public</option><option value="private">Private by access code</option></select></div><div class="field"><label>Join policy</label><select name="joinPolicy"><option value="approval">Owner approval required</option><option value="direct">Join immediately</option></select></div></div><div class="field dafaa-v2-conditional" id="dafaa-v2-access-wrap" hidden><label>Private access code</label><input name="accessCode" id="dafaa-v2-access" type="password" minlength="6" maxlength="64" autocomplete="new-password"><small class="dafaa-field-help">6–64 characters. This is required only for a private Dafaa.</small></div></section>
      <section class="dafaa-create-section"><h3>Pricing</h3><div class="suite-form-grid"><div class="field"><label>Enrollment price</label><select name="pricing" id="dafaa-v2-pricing"><option value="free">Free</option><option value="paid">Paid</option></select></div><div class="field dafaa-v2-conditional" id="dafaa-v2-price-wrap" hidden><label>Price (minor units)</label><input name="priceMinor" id="dafaa-v2-price" type="number" min="1" step="1" value="1"><small class="dafaa-field-help">Example: 1000 = 10.00 in a two-decimal currency.</small></div></div></section>
      <input type="hidden" name="currency" value="USD"><input type="hidden" name="stage" value="university">
      <button class="btn btn-primary auth-submit dafaa-create-submit" type="submit">Create Dafaa</button><p class="auth-note" id="dafaa-status" aria-live="polite"></p>
    </form>`);
    const form=document.getElementById('dafaa-create-v2'),visibility=document.getElementById('dafaa-v2-visibility'),pricing=document.getElementById('dafaa-v2-pricing'),accessWrap=document.getElementById('dafaa-v2-access-wrap'),access=document.getElementById('dafaa-v2-access'),priceWrap=document.getElementById('dafaa-v2-price-wrap'),price=document.getElementById('dafaa-v2-price');
    const sync=()=>{const privateMode=visibility.value==='private',paid=pricing.value==='paid';accessWrap.hidden=!privateMode;access.required=privateMode;if(!privateMode)access.value='';priceWrap.hidden=!paid;price.required=paid;if(!paid)price.value='0';else if(Number(price.value)<1)price.value='1';};
    visibility.addEventListener('change',sync);pricing.addEventListener('change',sync);sync();
    form.onsubmit=async e=>{e.preventDefault();const status=document.getElementById('dafaa-status'),submit=form.querySelector('button[type=submit]'),data=Object.fromEntries(new FormData(form));data.priceMinor=Number(data.priceMinor||0);submit.disabled=true;status.textContent='Creating Dafaa…';try{const result=await window.DafatiiApi.request('/dafat/create-v2',{method:'POST',body:data});await window.DafatiiDafat.refresh();if(result?.dafaa?.id)await window.DafatiiDafat.switchDafaa(result.dafaa.id);close();setHash('dashboard/overview');}catch(error){status.textContent=error.message||'Could not create the Dafaa.';submit.disabled=false;}};
  }
})();