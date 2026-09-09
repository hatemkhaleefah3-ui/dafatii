(() => {
  let holdTimer=null;
  let gesture=null;
  const isInteractive=target=>Boolean(target.closest('a,button,audio,video,input,textarea,select'));
  const hiddenAction=(row,selector)=>row?.querySelector(selector);

  document.addEventListener('keydown',event=>{
    const page=document.querySelector('.chatpro-page');
    if(!page)return;
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();
      document.getElementById('chatpro-search')?.focus();
      return;
    }
    if(event.key==='Escape'){
      const overlay=document.querySelector('.entity-sheet-overlay');
      if(overlay){overlay.querySelector('[data-sheet-close],.icon-btn')?.click();return;}
      const openRow=document.querySelector('.chatpro-msg-row.menu-open');
      if(openRow){hiddenAction(openRow,'[data-message-more]')?.click();return;}
      document.querySelector('.chatpro-layer-dismiss')?.click();
    }
  });

  document.addEventListener('click',event=>{
    const statusAdd=event.target.closest('.chatpro-status-add');
    if(statusAdd){event.preventDefault();document.getElementById('chatpro-new')?.click();return;}
    const saved=event.target.closest('[data-rail-action="saved"]');
    if(saved)setTimeout(()=>typeof render==='function'&&render(),0);
  });

  document.addEventListener('dblclick',event=>{
    const bubble=event.target.closest('.chatpro-bubble');
    if(!bubble||isInteractive(event.target))return;
    hiddenAction(bubble.closest('.chatpro-msg-row'),'[data-message-reply]')?.click();
  });

  document.addEventListener('pointerdown',event=>{
    const row=event.target.closest('.chatpro-msg-row');
    const bubble=event.target.closest('.chatpro-bubble');
    if(!row||!bubble||isInteractive(event.target))return;
    gesture={row,startX:event.clientX,startY:event.clientY,lastX:event.clientX,moved:false,pointerId:event.pointerId};
    holdTimer=setTimeout(()=>{
      if(!gesture||gesture.moved)return;
      hiddenAction(row,'[data-message-more]')?.click();
      if(navigator.vibrate)navigator.vibrate(18);
      gesture=null;
    },480);
  },{passive:true});

  document.addEventListener('pointermove',event=>{
    if(!gesture||gesture.pointerId!==event.pointerId)return;
    const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;
    gesture.lastX=event.clientX;
    if(Math.abs(dx)>8||Math.abs(dy)>8){gesture.moved=true;clearTimeout(holdTimer);}
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)<90){
      const direction=gesture.row.classList.contains('mine')?-1:1;
      const translated=Math.max(0,Math.min(64,dx*direction));
      gesture.row.style.transform=`translateX(${translated*direction}px)`;
      gesture.row.style.transition='none';
    }
  },{passive:true});

  const finishGesture=event=>{
    clearTimeout(holdTimer);
    if(!gesture||gesture.pointerId!==event.pointerId){gesture=null;return;}
    const row=gesture.row;
    const dx=gesture.lastX-gesture.startX;
    const direction=row.classList.contains('mine')?-1:1;
    row.style.transition='transform .18s ease';
    row.style.transform='translateX(0)';
    if(dx*direction>52)hiddenAction(row,'[data-message-reply]')?.click();
    setTimeout(()=>{row.style.transition='';},220);
    gesture=null;
  };
  document.addEventListener('pointerup',finishGesture,{passive:true});
  document.addEventListener('pointercancel',finishGesture,{passive:true});
})();
