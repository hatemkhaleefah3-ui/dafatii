(() => {
  'use strict';
  const OPEN_DISTANCE=92,OPEN_THRESHOLD=38;
  const wrappers=new Set();

  function destination(dx,dy,threshold=OPEN_THRESHOLD,distance=OPEN_DISTANCE){
    if(Math.abs(dy)>Math.abs(dx)) return 0;
    if(Math.abs(dx)<threshold) return 0;
    return dx>0?distance:-distance;
  }
  function apply(wrapper,value){
    const card=wrapper.querySelector('.subject-card');
    if(!card)return;
    card.style.setProperty('--swipe-x',`${value}px`);
    wrapper.classList.toggle('swipe-open-edit',value>0);
    wrapper.classList.toggle('swipe-open-delete',value<0);
    wrapper.querySelectorAll('.subject-swipe-action').forEach(button=>{
      const shown=(value>0&&button.classList.contains('edit'))||(value<0&&button.classList.contains('delete'));
      button.tabIndex=shown?0:-1;
      button.setAttribute('aria-hidden',String(!shown));
    });
  }
  function close(wrapper){if(wrapper)apply(wrapper,0);}
  function closeAll(except){wrappers.forEach(wrapper=>{if(!wrapper.isConnected){wrappers.delete(wrapper);return;}if(wrapper!==except)close(wrapper);});}
  function bind(card){
    const wrapper=card?.closest('.subject-swipe');
    if(!wrapper||wrapper.dataset.swipeBound==='true')return;
    wrapper.dataset.swipeBound='true';wrappers.add(wrapper);apply(wrapper,0);
    let startX=0,startY=0,currentX=0,dragging=false,axis='',moved=false;
    card.addEventListener('pointerdown',event=>{
      if(event.button!==undefined&&event.button!==0)return;
      if(event.target.closest('button,a,input,select,textarea'))return;
      closeAll(wrapper);startX=event.clientX;startY=event.clientY;currentX=0;axis='';moved=false;dragging=true;
      wrapper.classList.add('is-dragging');card.setPointerCapture?.(event.pointerId);
    });
    card.addEventListener('pointermove',event=>{
      if(!dragging)return;
      const dx=event.clientX-startX,dy=event.clientY-startY;
      if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>8)axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
      if(axis==='y'){dragging=false;wrapper.classList.remove('is-dragging');close(wrapper);return;}
      if(axis!=='x')return;
      event.preventDefault();moved=Math.abs(dx)>8;currentX=Math.max(-OPEN_DISTANCE,Math.min(OPEN_DISTANCE,dx));apply(wrapper,currentX);
    });
    const finish=()=>{
      if(!dragging)return;
      dragging=false;wrapper.classList.remove('is-dragging');apply(wrapper,destination(currentX,0));
      if(moved){wrapper.dataset.suppressClick='true';requestAnimationFrame(()=>delete wrapper.dataset.suppressClick);}
    };
    card.addEventListener('pointerup',finish);card.addEventListener('pointercancel',()=>{dragging=false;wrapper.classList.remove('is-dragging');close(wrapper);});
    card.addEventListener('click',event=>{
      if(wrapper.dataset.suppressClick==='true'){event.preventDefault();event.stopImmediatePropagation();return;}
      if(wrapper.classList.contains('swipe-open-edit')||wrapper.classList.contains('swipe-open-delete')){event.preventDefault();event.stopImmediatePropagation();close(wrapper);}
    },true);
  }
  if(typeof document!=='undefined'){
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('.subject-swipe'))closeAll();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAll();});
  }
  const api={bind,close,closeAll,destination};
  if(typeof window!=='undefined')window.DafatiiSwipe=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
