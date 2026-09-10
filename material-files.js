(() => {
  'use strict';
  const KEY='dafatii:materialFiles'; let decorating=false;
  const records=()=>window.DafatiiData?.readJSON(KEY,[]) || [];
  const save=value=>window.DafatiiData?.writeJSON(KEY,value);
  function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function openFile(item){
    if(item.contentType==='application/pdf') return window.DafatiiPdfViewer.open(item.fileId,item.name);
    const url=await window.DafatiiFiles.getViewUrl(item.fileId);
    if(item.contentType.startsWith('image/')||item.contentType.startsWith('audio/')||item.contentType.startsWith('video/')){
      const overlay=document.createElement('div');overlay.className='dafatii-media-overlay';const tag=item.contentType.startsWith('image/')?'img':item.contentType.startsWith('audio/')?'audio':'video';overlay.innerHTML=`<div class="dafatii-media-view"><button aria-label="Close">×</button><${tag} ${tag==='img'?'':'controls'}></${tag}></div>`;overlay.querySelector(tag).src=url;overlay.querySelector('button').onclick=()=>overlay.remove();document.body.appendChild(overlay);return;
    }
    window.open(url,'_blank','noopener,noreferrer');
  }
  function decorate(){if(decorating||!window.DafatiiFiles||!window.DafatiiData)return;decorating=true;try{document.querySelectorAll('.lecture-swipe[data-lecture-id]').forEach(wrap=>{if(wrap.dataset.filesReady)return;wrap.dataset.filesReady='1';const subjectId=wrap.dataset.subjectId,lectureId=wrap.dataset.lectureId,card=wrap.querySelector('.lecture-card'),copy=card?.querySelector('.subject-card-copy');if(!copy)return;const area=document.createElement('div');area.className='lecture-files';const items=records().filter(x=>x.subjectId===subjectId&&x.lectureId===lectureId);area.innerHTML=`<div class="lecture-file-list">${items.map(x=>`<button class="lecture-file" data-file="${escape(x.fileId)}">${escape(x.name)}</button>`).join('')}</div><button class="lecture-attach" type="button">＋ File</button><input type="file" hidden>`;copy.appendChild(area);area.onclick=e=>e.stopPropagation();area.querySelectorAll('[data-file]').forEach(btn=>btn.onclick=()=>openFile(items.find(x=>x.fileId===btn.dataset.file)));const input=area.querySelector('input'),attach=area.querySelector('.lecture-attach');attach.onclick=()=>input.click();input.onchange=async()=>{const file=input.files?.[0];if(!file)return;attach.disabled=true;attach.textContent='Uploading…';try{const uploaded=await window.DafatiiFiles.upload(file);const next=records();next.push({subjectId,lectureId,fileId:uploaded.id,name:uploaded.name,contentType:uploaded.contentType,size:uploaded.size});save(next);wrap.dataset.filesReady='';decorate();}catch(error){alert(error.message);}finally{attach.disabled=false;attach.textContent='＋ File';}};});}finally{decorating=false;}}
  new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('dafatii:datachange',e=>{if(e.detail?.record?.key===KEY)document.querySelectorAll('.lecture-swipe').forEach(x=>delete x.dataset.filesReady);decorate();});document.addEventListener('DOMContentLoaded',decorate);
})();
