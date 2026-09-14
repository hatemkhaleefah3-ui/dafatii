(() => {
  'use strict';

  const paths = {
    menu:'M4 7h16M4 12h16M4 17h16', close:'M6 6l12 12M18 6 6 18',
    dashboard:'M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9.5 21v-7h5v7',
    subjects:'M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z',
    calendar:'M4 6.5h16V21H4V6.5ZM8 3v6M16 3v6M4 11h16',
    'study-rooms':'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1.5 21v-1a6.5 6.5 0 0 1 13 0v1M17 5a3.5 3.5 0 0 1 0 7M17.5 15.5A5.5 5.5 0 0 1 23 21',
    chat:'M4 4h16v13H9l-5 4V4ZM8 9h8M8 13h5',
    'change-course':'M3 7 12 3l9 4-9 4-9-4ZM6 10v7l6 4 6-4v-7M21 7v7',
    profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
    settings:'M4 6h16M4 12h16M4 18h16M9 3v6M15 9v6M9 15v6',
    admin:'M12 3l8 4v5c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10V7l8-4ZM9 12l2 2 4-4',
    representer:'M5 4h14v17H5V4ZM9 4V2h6v2M8 9h8M8 13h8M8 17h5',
    language:'M4 5h10M9 3v2c0 5-2 8-5 10M6 10c2 3 5 5 8 6M15 20l3-9 3 9M16 17h4',
    appearance:'M20 15.2A8.2 8.2 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z',
    sun:'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
    'apply-work':'M4 7h16v13H4V7ZM9 7V4h6v3M4 12h16',
    'apply-scholarship':'M12 3l3 6 6 .8-4.5 4.4 1.2 6.3L12 17l-5.7 3.5 1.2-6.3L3 9.8 9 9 12 3Z',
    volunteer:'M12 21S4 16 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 7-6 12-6 12Z',
    'donate-us':'M4 10h16v11H4V10ZM3 7h18v3H3V7ZM12 7v14M12 7H8.5A2.5 2.5 0 1 1 12 3.5V7Zm0 0h3.5A2.5 2.5 0 1 0 12 3.5V7Z',
    info:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 10v7M12 7h.01',
    mail:'M3 5h18v14H3V5Zm0 1 9 7 9-7',
    add:'M12 5v14M5 12h14', edit:'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
    trash:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
    check:'m5 12 4 4L19 6', 'arrow-left':'M19 12H5M11 18l-6-6 6-6', 'arrow-right':'M5 12h14M13 6l6 6-6 6',
    'external-link':'M14 4h6v6M20 4 10 14M18 13v7H4V6h7', more:'M5 12h.01M12 12h.01M19 12h.01',
    search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM17 17l4 4',
    bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    upload:'M12 16V4M7 9l5-5 5 5M4 20h16', download:'M12 4v12M7 11l5 5 5-5M4 20h16',
    file:'M6 2h8l4 4v16H6V2Zm8 0v5h5', image:'M4 4h16v16H4V4Zm0 12 5-5 4 4 2-2 5 5M15 9h.01',
    video:'M4 5h12v14H4V5Zm12 5 5-3v10l-5-3', audio:'M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z',
    play:'m9 6 9 6-9 6V6Z', link:'M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1',
    clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2', reply:'M9 8 4 12l5 4M5 12h8a7 7 0 0 1 7 7',
    attach:'M20 12.5 11.5 21a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 1 1-2.9-2.8L14 7',
    microphone:'M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4ZM5 11a7 7 0 0 0 14 0M12 18v4M9 22h6',
    send:'m3 11 18-8-8 18-2-7-8-3Zm8 3 10-11',
    phone:'M6.5 3h3l1.5 5-2 1.5a15 15 0 0 0 5.5 5.5l1.5-2 5 1.5v3A3.5 3.5 0 0 1 17.5 21C9.5 20.5 3.5 14.5 3 6.5A3.5 3.5 0 0 1 6.5 3Z',
    star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z',
    pin:'M9 3h6l-1 6 3 3H7l3-3-1-6ZM12 12v9',
    archive:'M4 8h16v12H4V8ZM3 4h18v4H3V4ZM9 12h6'
  };

  function icon(name, options={}){
    const title=options.title?`<title>${String(options.title).replace(/[&<>"']/g,'')}</title>`:'';
    const className=['ui-icon',options.className].filter(Boolean).join(' ');
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="${options.title?'false':'true'}" focusable="false">${title}<path d="${paths[name]||paths.info}"/></svg>`;
  }

  function hydrate(root){
    if(!root?.querySelectorAll)return;
    root.querySelectorAll('button:not([data-ui-icon]),a:not([data-ui-icon])').forEach(control=>{
      const raw=(control.textContent||'').trim();
      if(!raw||raw.length>2)return;
      const hint=`${control.id} ${control.className} ${control.getAttribute('title')||''} ${control.getAttribute('aria-label')||''} ${[...control.attributes].map(a=>a.name).join(' ')}`.toLowerCase();
      let name='';
      if(/close|dismiss/.test(hint)||raw==='×')name='close';
      else if(/delete|remove|trash/.test(hint))name='trash';
      else if(/edit/.test(hint)||raw==='✎')name='edit';
      else if(/search/.test(hint)||raw==='⌕')name='search';
      else if(/video-call/.test(hint))name='video';
      else if(/call/.test(hint)||raw==='☎')name='phone';
      else if(/info/.test(hint)||raw==='ⓘ')name='info';
      else if(/attach/.test(hint))name='attach';
      else if(/voice|microphone/.test(hint)||raw==='🎙')name='microphone';
      else if(/schedule/.test(hint)||raw==='◷')name='clock';
      else if(/send/.test(hint)||raw==='➤')name='send';
      else if(/back/.test(hint)||raw==='‹')name='arrow-left';
      else if(/menu|more/.test(hint)||raw==='⋮')name='more';
      else if(/new|add|create/.test(hint)||raw==='＋')name='add';
      if(!name)return;
      control.innerHTML=icon(name);control.dataset.uiIcon=name;
    });
  }

  const api=Object.freeze({icon,hydrate,names:Object.freeze(Object.keys(paths))});
  if(typeof window!=='undefined') window.DafatiiIcons=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(typeof document!=='undefined'){
    const start=()=>{hydrate(document);new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1){if(node.matches?.('button,a'))hydrate(node.parentElement);else hydrate(node);}}))).observe(document.body,{childList:true,subtree:true});};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  }
})();
