(() => {
  'use strict';
  const translated = new WeakSet();
  const pending = new Set();
  const cache = new Map();
  let timer = 0, running = false;
  const excluded = 'script,style,code,pre,input,textarea,select,option,[contenteditable],.chat-message,.message-bubble,.advanced-message,.file-viewer,.subject-card-copy,.lecture-card,.course-card h2,.suite-note-card,.suite-resource-card,.suite-material-card,.suite-profile-card,.member-row,.admin-row,.quiet-profile-summary,.quiet-course-list,[data-no-translate]';
  const eligible = text => /[A-Za-z]{2}/.test(text) && !/@|https?:\/\//i.test(text) && text.length <= 2000;
  const decode = value => { const area=document.createElement('textarea');area.innerHTML=value;return area.value; };
  function collect(){
    if(interfaceLanguage()!=='ar') return;
    const root=document.querySelector('.workspace-main,.pre-course-shell');
    if(!root) return;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode,text=node.nodeValue.trim(),parent=node.parentElement;
      if(translated.has(node)||!parent||parent.closest(excluded)||!eligible(text))continue;
      if(cache.has(text)){node.nodeValue=node.nodeValue.replace(text,cache.get(text));translated.add(node);continue;}
      pending.add(node);
    }
    schedule();
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(flush,80);}
  async function flush(){
    if(running||interfaceLanguage()!=='ar'||!pending.size)return;
    running=true;
    const nodes=[...pending].filter(node=>node.isConnected&&!translated.has(node)).slice(0,40);
    nodes.forEach(node=>pending.delete(node));
    const sources=nodes.map(node=>node.nodeValue.trim());
    try{
      const result=await window.DafatiiApi.request('/translate',{method:'POST',body:{texts:sources,source:'en',target:'ar'}});
      result.translations.forEach((value,index)=>{const target=decode(value);cache.set(sources[index],target);if(nodes[index].isConnected){nodes[index].nodeValue=nodes[index].nodeValue.replace(sources[index],target);translated.add(nodes[index]);}});
    }catch(error){
      if(!['TRANSLATION_NOT_CONFIGURED','AUTHENTICATION_REQUIRED'].includes(error.code))console.warn('Interface translation unavailable.',error.code||error.message);
      nodes.forEach(node=>translated.add(node));
    }finally{running=false;if(pending.size)schedule();}
  }
  const observer=new MutationObserver(()=>collect());
  window.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true});collect();});
  window.addEventListener('hashchange',()=>requestAnimationFrame(collect));
  window.DafatiiTranslate=Object.freeze({refresh:collect});
})();
