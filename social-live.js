(() => {
  'use strict';

  const api = (path, options={}) => window.DafatiiApi.request(path, options);
  const esc = value => escapeHtml(value ?? '');
  const icon = name => window.DafatiiChatShell?.icon?.(name) || '';
  const cache = { lists:null, posts:null, messages:new Map(), members:new Map(), loading:false, error:'', postsSavedOnly:false };
  const ui = {
    filter:{messages:'all',groups:'joined',blogs:'latest',anonymous:'trending'},
    query:{messages:'',groups:'',blogs:'',anonymous:''},
    groupScope:'all',
    threadTab:'chat'
  };
  let refreshTimer=null;
  const sectionMap = {'Private chats':'messages','Groups':'groups','Blogs & announcements':'blogs','Anonymous':'anonymous'};

  function sectionFromParts(parts){
    const raw=decodeURIComponent(parts[1]||'Private chats');
    if(raw==='Groups') return 'groups';
    if(raw==='Blogs & announcements') return 'blogs';
    if(raw==='Anonymous') return 'anonymous';
    return 'messages';
  }
  function routeForSection(section){
    if(section==='groups')return 'chat/Groups';
    if(section==='blogs')return 'chat/'+encodeURIComponent('Blogs & announcements');
    if(section==='anonymous')return 'chat/Anonymous';
    return 'chat/'+encodeURIComponent('Private chats');
  }
  function titleFor(section){
    return section==='groups'?'Groups':section==='blogs'?'Blogs':section==='anonymous'?'Anonymous Chats':'Messages';
  }
  function subtitleFor(section){
    if(section==='groups')return 'Study groups, projects, and collaboration';
    if(section==='blogs')return 'Announcements, study tips, campus writing, and events.';
    if(section==='anonymous')return 'Ask freely, stay private, and study together.';
    return 'Direct chats, anonymous rooms, and study groups';
  }
  function tabsFor(section){
    if(section==='groups')return [['joined','Joined'],['discover','Discover'],['pinned','Pinned'],['archived','Archived']];
    if(section==='blogs')return [['latest','Latest'],['announcement','Announcements'],['article','Articles'],['event','Events']];
    if(section==='anonymous')return [['trending','Trending'],['new','New'],['course','Course-based'],['private','Private']];
    return [['all','All'],['unread','Unread'],['anonymous','Anonymous'],['archived','Archived']];
  }
  function nav(section){
    const items=[['messages','chat','Messages'],['groups','groups','Groups'],['blogs','news','Blogs'],['anonymous','anonymous','Anonymous']];
    return '<nav class="live-chat-bottom" aria-label="Chat navigation"><a class="live-chat-home" href="#dashboard" aria-label="Dashboard">'+icon('back')+'</a>'+
      items.map(item=>'<a href="#'+routeForSection(item[0])+'" class="'+(section===item[0]?'active':'')+'">'+icon(item[1])+'<span>'+item[2]+'</span></a>').join('')+'</nav>';
  }
  function header(section){
    const initial=esc((window.DafatiiAuth?.user?.displayName||'D').trim().slice(0,1).toUpperCase()||'D');
    return '<header class="live-chat-brand"><a href="#dashboard"><strong>Dafatii</strong><small>Learn together. Go further.</small></a><div><button id="live-chat-new" aria-label="Create new">'+icon('plus')+'</button><a href="#profile" class="live-chat-avatar">'+initial+'<i></i></a></div></header>'+
      '<div class="live-chat-heading"><h1>'+esc(titleFor(section))+'</h1><p>'+esc(subtitleFor(section))+'</p></div>';
  }
  function tabs(section){
    const active=ui.filter[section];
    return '<nav class="live-chat-tabs">'+tabsFor(section).map(item=>'<button data-live-filter="'+item[0]+'" class="'+(active===item[0]?'active':'')+'">'+item[1]+'</button>').join('')+'</nav>';
  }
  function shell(section, body, thread=false){
    if(thread)return '<section class="live-chat-app thread">'+body+'</section>';
    const privacy=section==='anonymous'?'<div class="live-chat-privacy"><span>◆</span><p>Your identity stays private. Be kind, keep it constructive.</p></div>':'';
    return '<section class="live-chat-app" data-live-section="'+section+'">'+header(section)+privacy+tabs(section)+'<main class="live-chat-stage">'+body+'</main>'+nav(section)+'</section>';
  }
  function loadingBlock(copy='Loading…'){return '<div class="live-chat-empty"><span>◇</span><strong>'+esc(copy)+'</strong></div>';}
  function errorBlock(message){return '<div class="live-chat-empty error"><span>!</span><strong>Could not load this page</strong><p>'+esc(message||'Please try again.')+'</p><button id="live-chat-retry">Retry</button></div>';}
  function rel(at){
    if(!at)return '';
    const m=Math.max(0,Math.floor((Date.now()-Number(at))/60000));
    if(m<1)return 'now';if(m<60)return m+'m';
    const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d';
  }

  async function loadLists(force=false){
    if(cache.loading||(!force&&cache.lists))return;
    cache.loading=true;cache.error='';
    try{cache.lists=await api('/social/conversations',{idempotent:true});}
    catch(error){cache.error=error.message||'Conversation service is unavailable.';}
    finally{cache.loading=false;}
  }
  async function loadPosts(force=false){
    if(cache.loading||(!force&&cache.posts))return;
    cache.loading=true;cache.error='';
    try{cache.posts=(await api('/social/posts',{idempotent:true})).posts||[];}
    catch(error){cache.error=error.message||'Community feed is unavailable.';}
    finally{cache.loading=false;}
  }
  async function loadThread(id,force=false){
    if(!force&&cache.messages.has(id))return;
    try{cache.messages.set(id,await api('/social/conversations/'+encodeURIComponent(id)+'/messages',{idempotent:true}));cache.error='';}
    catch(error){cache.error=error.message||'Conversation could not be loaded.';}
  }
  async function loadMembers(id,force=false){
    if(!force&&cache.members.has(id))return;
    try{cache.members.set(id,(await api('/social/conversations/'+encodeURIComponent(id)+'/members',{idempotent:true})).members||[]);}
    catch(error){cache.error=error.message||'Members could not be loaded.';}
  }

  function listSource(section){
    if(!cache.lists)return [];
    const joined=cache.lists.conversations||[];
    if(section==='groups'){
      const filter=ui.filter.groups;
      if(filter==='discover')return cache.lists.discoverGroups||[];
      const groups=joined.filter(c=>c.kind==='group');
      if(filter==='pinned')return groups.filter(c=>c.pinned&&!c.archived);
      if(filter==='archived')return groups.filter(c=>c.archived);
      return groups.filter(c=>!c.archived);
    }
    if(section==='anonymous'){
      const joinedAnon=joined.filter(c=>c.kind==='anonymous'&&!c.archived);
      const publicAnon=(cache.lists.discoverAnonymous||[]);
      let all=[...joinedAnon,...publicAnon.filter(x=>!joinedAnon.some(y=>y.id===x.id))];
      if(ui.filter.anonymous==='private')all=joinedAnon.filter(c=>c.visibility==='private');
      if(ui.filter.anonymous==='course'){
        const course=(window.DafatiiCourses?.active?.().name||'').toLowerCase();
        all=course?all.filter(c=>(c.topic||c.name||'').toLowerCase().includes(course)):joinedAnon;
      }
      if(ui.filter.anonymous==='new')all.sort((a,b)=>Number(b.lastMessageAt||b.createdAt||0)-Number(a.lastMessageAt||a.createdAt||0));
      else all.sort((a,b)=>(Number(b.memberCount||0)+Number(b.unread||0)*3)-(Number(a.memberCount||0)+Number(a.unread||0)*3));
      return all;
    }
    let all=joined.filter(c=>!c.archived);
    if(ui.filter.messages==='unread')all=all.filter(c=>Number(c.unread)>0);
    if(ui.filter.messages==='anonymous')all=all.filter(c=>c.kind==='anonymous');
    if(ui.filter.messages==='archived')all=joined.filter(c=>c.archived);
    return all;
  }
  function applySearch(section,list){
    const q=(ui.query[section]||'').trim().toLowerCase();
    if(!q)return list;
    return list.filter(c=>((c.name||'')+' '+(c.topic||'')+' '+(c.lastMessage||'')).toLowerCase().includes(q));
  }
  function groupScoped(list){
    if(ui.groupScope==='all')return list;
    if(ui.groupScope==='public')return list.filter(c=>c.visibility==='public');
    if(ui.groupScope==='private')return list.filter(c=>c.visibility==='private');
    if(ui.groupScope==='owned')return list.filter(c=>c.owner);
    return list;
  }
  function conversationCard(c,section){
    const isDiscoverGroup=section==='groups'&&ui.filter.groups==='discover'&&!c.joined;
    const canPreview=Boolean(c.joined)||(c.kind==='anonymous'&&c.visibility==='public');
    const status=c.kind==='group'?(Number(c.memberCount||0)+' members'):(c.kind==='anonymous'?(Number(c.memberCount||0)+' participants'):'');
    const badge=c.kind==='anonymous'?'Anonymous':c.kind==='group'?'Group':'';
    const mainStart=canPreview
      ? '<a class="live-chat-card-main" href="#'+routeForSection(sectionForKind(c.kind))+'/'+encodeURIComponent(c.id)+'" data-conversation-id="'+esc(c.id)+'">'
      : '<div class="live-chat-card-main discover" aria-label="'+esc(c.name||'Conversation')+'">';
    const mainEnd=canPreview?'</a>':'</div>';
    return '<article class="live-chat-card kind-'+esc(c.kind)+'">'+mainStart+
      '<span class="live-chat-card-avatar">'+esc((c.name||'?').slice(0,2).toUpperCase())+'</span>'+
      '<span class="live-chat-card-copy"><span><strong>'+esc(c.name||'Conversation')+'</strong>'+(badge?'<em>'+badge+'</em>':'')+'</span><p>'+esc(c.lastMessage||c.topic||status||'No messages yet')+'</p>'+(status?'<small>'+esc(status)+'</small>':'')+'</span>'+
      '<span class="live-chat-card-meta"><time>'+rel(c.lastMessageAt)+'</time>'+(c.unread?'<b>'+Number(c.unread)+'</b>':'')+(canPreview?'<i>›</i>':'')+'</span>'+mainEnd+
      (isDiscoverGroup?'<button class="live-chat-join" data-join-conversation="'+esc(c.id)+'">Join</button>':'')+'</article>';
  }
  function sectionForKind(kind){return kind==='group'?'groups':kind==='anonymous'?'anonymous':'messages';}
  function searchRow(section){
    const placeholder=section==='groups'?'Search groups, topics, or people…':section==='anonymous'?'Search anonymous rooms…':section==='blogs'?'Search posts, topics, or people…':'Search chats and people…';
    return '<div class="live-chat-search"><label>'+icon('search')+'<input id="live-chat-search" value="'+esc(ui.query[section]||'')+'" placeholder="'+esc(placeholder)+'"></label>'+(section==='blogs'?'<button id="live-chat-saved" class="'+(cache.postsSavedOnly?'active':'')+'" aria-label="Show saved posts">⌑</button>':'')+'</div>';
  }
  function groupScopes(){
    const scopes=[['all','All'],['public','Public'],['private','Private'],['owned','Owned']];
    return '<div class="live-chat-scopes">'+scopes.map(s=>'<button data-group-scope="'+s[0]+'" class="'+(ui.groupScope===s[0]?'active':'')+'">'+s[1]+'</button>').join('')+'</div>';
  }
  function listPage(section){
    if(cache.error&&!cache.lists)return shell(section,errorBlock(cache.error));
    if(!cache.lists)return shell(section,loadingBlock('Loading conversations…'));
    let list=applySearch(section,listSource(section));
    if(section==='groups')list=groupScoped(list);
    return shell(section,searchRow(section)+(section==='groups'?groupScopes():'')+
      '<div class="live-chat-list">'+(list.length?list.map(c=>conversationCard(c,section)).join(''):'<div class="live-chat-empty"><span>◇</span><strong>No conversations here yet</strong><p>Create one or change the current filter.</p></div>')+'</div>');
  }

  function postMatches(post){
    const filter=ui.filter.blogs;
    if(filter==='announcement'&&post.type!=='announcement')return false;
    if(filter==='article'&&post.type!=='blog')return false;
    if(filter==='event'&&post.type!=='event')return false;
    if(cache.postsSavedOnly&&!post.saved)return false;
    const q=(ui.query.blogs||'').toLowerCase();
    return !q||((post.title||'')+' '+(post.excerpt||'')+' '+(post.author||'')+' '+(post.tags||[]).join(' ')).toLowerCase().includes(q);
  }
  function postCard(post){
    const label=post.type==='announcement'?'Announcement':post.type==='event'?'Event':'Article';
    return '<article class="live-post-card"><header><span>'+label+'</span><time>'+rel(post.at)+'</time><button data-save-post="'+esc(post.id)+'" class="'+(post.saved?'saved':'')+'" aria-label="'+(post.saved?'Unsave':'Save')+' post">⌑</button></header>'+
      '<h2>'+esc(post.title)+'</h2><p>'+esc(post.excerpt)+'</p>'+
      '<div class="live-post-tags">'+(post.tags||[]).map(tag=>'<span>'+esc(tag)+'</span>').join('')+'</div>'+
      '<footer><span>'+esc((post.author||'D').slice(0,1).toUpperCase())+'</span><div><strong>'+esc(post.author||'Dafatii')+'</strong><small>'+label+'</small></div></footer></article>';
  }
  function blogsPage(){
    if(cache.error&&!cache.posts)return shell('blogs',errorBlock(cache.error));
    if(!cache.posts)return shell('blogs',loadingBlock('Loading community posts…'));
    const posts=cache.posts.filter(postMatches);
    return shell('blogs',searchRow('blogs')+'<div class="live-post-list">'+(posts.length?posts.map(postCard).join(''):'<div class="live-chat-empty"><span>◇</span><strong>No posts match</strong><p>Try another filter or create a post.</p></div>')+'</div>');
  }

  function renderPoll(message,conversationId){
    const payload=message.payload||{},options=payload.options||[];
    const total=options.reduce((sum,o)=>sum+Number(o.votes||0),0)||1;
    return '<div class="live-poll"><strong>'+esc(payload.question||'Poll')+'</strong>'+options.map((o,i)=>{
      const pct=Math.round(Number(o.votes||0)/total*100);
      return '<button data-live-poll="'+i+'" data-message-id="'+esc(message.id)+'"><span>'+esc(o.text)+'</span><b>'+pct+'%</b><i style="--pct:'+pct+'%"></i></button>';
    }).join('')+'</div>';
  }
  function messageRow(message,conversation){
    const payload=message.payload||{};
    const body=message.deleted?'<em class="live-deleted">Message deleted</em>':message.type==='poll'?renderPoll(message,conversation.id):'<p>'+esc(payload.text||'')+'</p>';
    const reactions=Object.entries(message.reactions||{});
    return '<div class="live-message '+(message.mine?'mine':'theirs')+'" data-message-id="'+esc(message.id)+'">'+
      (!message.mine?'<span class="live-message-avatar">'+esc((message.sender||'?').slice(0,1).toUpperCase())+'</span>':'')+
      '<div><small class="live-message-sender">'+(!message.mine?esc(message.sender||''):'')+'</small><div class="live-bubble">'+body+'</div>'+
      '<div class="live-message-meta"><time>'+new Date(message.at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'</time>'+
      reactions.map(r=>'<button data-live-reaction="'+esc(r[0])+'" data-message-id="'+esc(message.id)+'">'+esc(r[0])+' '+Number(r[1])+'</button>').join('')+
      (!message.mine?'<button data-live-reaction="👍" data-message-id="'+esc(message.id)+'">＋</button>':'')+'</div></div></div>';
  }
  function threadPage(section,id){
    const data=cache.messages.get(id);
    if(cache.error&&!data)return shell(section,'<div class="live-thread-shell">'+errorBlock(cache.error)+'</div>',true);
    if(!data)return shell(section,'<div class="live-thread-shell">'+loadingBlock('Loading conversation…')+'</div>',true);
    const c=data.conversation,messages=data.messages||[];
    const members=cache.members.get(id);
    const isGroup=c.kind==='group';
    const tabs=isGroup?'<nav class="live-thread-tabs"><button data-thread-tab="chat" class="'+(ui.threadTab==='chat'?'active':'')+'">Chat</button><button data-thread-tab="members" class="'+(ui.threadTab==='members'?'active':'')+'">Members</button></nav>':'';
    const course=window.DafatiiCourses?.active?.();
    const courseCard=isGroup&&course?.id?'<a class="live-course-card" href="#subjects/All%20subjects"><span>▤</span><div><small>Course workspace</small><strong>'+esc(course.name||'Current course')+'</strong><p>Open subjects, lectures, exams, and assignments.</p></div><b>View Course</b></a>':'';
    const safety=c.kind==='anonymous'?'<div class="live-anon-safety"><span>◆</span><div><small>Pinned by Dafatii</small><strong>Be kind. Keep it constructive.</strong><p>Your public identity is not exposed in this room.</p></div></div>':'';
    const memberPanel=isGroup&&ui.threadTab==='members'?'<div class="live-members">'+(members?members.map(m=>'<div><span>'+esc(m.name.slice(0,1).toUpperCase())+'</span><strong>'+esc(m.name)+'</strong><small>'+esc(m.role)+'</small></div>').join(''):(cache.error?errorBlock(cache.error):loadingBlock('Loading members…')))+'</div>':'';
    const timeline=ui.threadTab==='chat'?'<div class="live-messages" id="live-messages">'+(messages.length?messages.map(m=>messageRow(m,c)).join(''):'<div class="live-chat-empty compact"><strong>No messages yet</strong><p>Start the conversation below.</p></div>')+'</div>':'';
    const composer=ui.threadTab==='chat'?'<div class="live-composer"><button id="live-poll" aria-label="Create poll">＋</button><textarea id="live-message-input" rows="1" maxlength="5000" placeholder="'+esc(c.kind==='anonymous'?'Reply anonymously…':'Message '+c.name+'…')+'"></textarea><button id="live-send" aria-label="Send">'+icon('send')+'</button></div>':'';
    const headerAction=c.joined
      ? '<button id="live-thread-more" aria-label="Conversation options">'+icon('more')+'</button>'
      : '<button id="live-thread-join" class="join" aria-label="Join conversation">Join</button>';
    return shell(section,'<div class="live-thread-shell"><header><a href="#'+routeForSection(sectionForKind(c.kind))+'" aria-label="Back">'+icon('back')+'</a><span class="live-thread-avatar">'+esc((c.name||'?').slice(0,2).toUpperCase())+'</span><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.kind==='anonymous'?'Anonymous room':(c.memberCount?c.memberCount+' members':''))+'</small></div>'+headerAction+'</header>'+tabs+courseCard+safety+memberPanel+timeline+composer+'</div>',true);
  }

  function renderChat(parts){
    const section=sectionFromParts(parts),id=parts[2]?decodeURIComponent(parts[2]):'';
    if(id)return threadPage(section,id);
    if(section==='blogs')return blogsPage();
    return listPage(section);
  }

  const previousWorkspaceContent=workspaceContent;
  workspaceContent=function(page,parts,title){
    if(page==='chat')return renderChat(parts);
    return previousWorkspaceContent(page,parts,title);
  };
  const previousWorkspace=workspace;
  workspace=function(current){
    if(refreshTimer){clearInterval(refreshTimer);refreshTimer=null;}
    previousWorkspace(current);
    if(current.split('/')[0]==='chat')bindLiveChat(current);
  };

  async function bindLiveChat(current){
    const root=document.querySelector('.live-chat-app');if(!root)return;
    const parts=current.split('/'),section=sectionFromParts(parts),id=parts[2]?decodeURIComponent(parts[2]):'';
    if(section==='blogs'&&!cache.posts&&!cache.loading){await loadPosts();render();return;}
    if(section!=='blogs'&&!id&&!cache.lists&&!cache.loading){await loadLists();render();return;}
    if(id&&!cache.messages.has(id)){await loadThread(id);render();return;}
    if(id){
      const data=cache.messages.get(id);
      if(data?.conversation?.kind==='group'&&ui.threadTab==='members'&&!cache.members.has(id)){await loadMembers(id);render();return;}
      bindThread(id,data);
      refreshTimer=setInterval(async()=>{await loadThread(id,true);if(route()===current)render();},8000);
      return;
    }

    document.querySelectorAll('[data-live-filter]').forEach(button=>button.addEventListener('click',()=>{ui.filter[section]=button.dataset.liveFilter;render();}));
    document.querySelectorAll('[data-group-scope]').forEach(button=>button.addEventListener('click',()=>{ui.groupScope=button.dataset.groupScope;render();}));
    document.getElementById('live-chat-search')?.addEventListener('input',event=>{ui.query[section]=event.target.value;render();});
    document.getElementById('live-chat-saved')?.addEventListener('click',()=>{cache.postsSavedOnly=!cache.postsSavedOnly;render();});
    document.getElementById('live-chat-new')?.addEventListener('click',()=>openCreateSheet(section));
    document.getElementById('live-chat-retry')?.addEventListener('click',async()=>{cache.error='';if(section==='blogs'){cache.posts=null;await loadPosts(true);}else{cache.lists=null;await loadLists(true);}render();});
    document.querySelectorAll('[data-join-conversation]').forEach(button=>button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await api('/social/conversations/'+encodeURIComponent(button.dataset.joinConversation)+'/join',{method:'POST',body:{}});await loadLists(true);render();}catch(error){showToast(error.message||'Could not join this group.');button.disabled=false;}}));
    document.querySelectorAll('[data-save-post]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{const result=await api('/social/posts/'+encodeURIComponent(button.dataset.savePost)+'/save',{method:'POST',body:{}});const post=cache.posts?.find(p=>p.id===button.dataset.savePost);if(post)post.saved=result.saved;render();}catch(error){showToast(error.message||'Could not save this post.');button.disabled=false;}}));
    refreshTimer=setInterval(async()=>{if(section==='blogs')await loadPosts(true);else await loadLists(true);if(route()===current)render();},15000);
  }

  function bindThread(id,data){
    if(!data)return;
    const c=data.conversation;
    document.querySelectorAll('[data-thread-tab]').forEach(button=>button.addEventListener('click',async()=>{ui.threadTab=button.dataset.threadTab;if(ui.threadTab==='members'&&!cache.members.has(id))await loadMembers(id);render();}));
    document.getElementById('live-thread-more')?.addEventListener('click',()=>openConversationOptions(c));
    const input=document.getElementById('live-message-input');
    const send=async()=>{
      const text=input?.value.trim();if(!text)return;
      const button=document.getElementById('live-send');if(button)button.disabled=true;
      try{await api('/social/conversations/'+encodeURIComponent(id)+'/messages',{method:'POST',body:{type:'text',text}});input.value='';await loadThread(id,true);await loadLists(true);render();}
      catch(error){showToast(error.message||'Message could not be sent.');if(button)button.disabled=false;}
    };
    document.getElementById('live-send')?.addEventListener('click',send);
    input?.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void send();}});
    input?.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(140,input.scrollHeight)+'px';});
    document.getElementById('live-poll')?.addEventListener('click',()=>openPollSheet(id));
    document.querySelectorAll('[data-live-reaction]').forEach(button=>button.addEventListener('click',async()=>{try{await api('/social/conversations/'+encodeURIComponent(id)+'/messages/'+encodeURIComponent(button.dataset.messageId)+'/reactions',{method:'POST',body:{emoji:button.dataset.liveReaction}});await loadThread(id,true);render();}catch(error){showToast(error.message||'Reaction could not be saved.');}}));
    document.querySelectorAll('[data-live-poll]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{await api('/social/conversations/'+encodeURIComponent(id)+'/messages/'+encodeURIComponent(button.dataset.messageId)+'/poll',{method:'POST',body:{optionIndex:Number(button.dataset.livePoll)}});await loadThread(id,true);render();}catch(error){showToast(error.message||'Vote could not be saved.');button.disabled=false;}}));
    requestAnimationFrame(()=>{const box=document.getElementById('live-messages');if(box)box.scrollTop=box.scrollHeight;});
  }

  function sheet(inner,id){
    const root=document.getElementById('overlay-root');if(!root)return null;
    root.innerHTML='<div class="entity-sheet-overlay" id="'+id+'-overlay"><section class="entity-sheet live-social-sheet">'+inner+'</section></div>';
    const close=()=>{root.innerHTML='';};
    root.querySelector('[data-live-close]')?.addEventListener('click',close);
    root.querySelector('#'+id+'-overlay')?.addEventListener('click',event=>{if(event.target.id===id+'-overlay')close();});
    return {root,close};
  }
  function openCreateSheet(section){
    if(section==='blogs'){openPostSheet();return;}
    if(section==='messages'){openPeopleSheet();return;}
    const isGroup=section==='groups';
    const s=sheet('<div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Dafatii Community</div><h2>'+(isGroup?'Create group':'Start anonymous room')+'</h2></div><button class="icon-btn" data-live-close>×</button></div><form id="live-create-form">'+
      (isGroup?'<div class="field"><label>Group name</label><input id="live-create-name" maxlength="80" required></div>':'')+
      '<div class="field"><label>'+(isGroup?'Topic / description':'Topic')+'</label><input id="live-create-topic" maxlength="180" '+(isGroup?'':'required')+'></div>'+
      '<div class="field"><label>Visibility</label><select id="live-create-visibility"><option value="private">Private</option><option value="public">Public / discoverable</option></select></div>'+
      '<button class="btn btn-primary entity-submit">Create</button></form>','live-create');
    if(!s)return;
    document.getElementById('live-create-form').onsubmit=async event=>{event.preventDefault();const submit=event.submitter;submit.disabled=true;try{const result=await api('/social/conversations',{method:'POST',body:{kind:isGroup?'group':'anonymous',name:document.getElementById('live-create-name')?.value.trim()||'',topic:document.getElementById('live-create-topic').value.trim(),visibility:document.getElementById('live-create-visibility').value}});s.close();cache.lists=null;await loadLists(true);setHash(routeForSection(section)+'/'+encodeURIComponent(result.conversation.id));}catch(error){showToast(error.message||'Could not create conversation.');submit.disabled=false;}};
  }
  function openPeopleSheet(){
    const s=sheet('<div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">New message</div><h2>Find a person</h2></div><button class="icon-btn" data-live-close>×</button></div><div class="field"><label>Name</label><input id="live-people-search" maxlength="80" placeholder="Type at least 2 letters" autocomplete="off"></div><div id="live-people-results" class="live-people-results"><p>Search for an existing Dafatii account.</p></div>','live-people');
    if(!s)return;
    let timer;
    const input=document.getElementById('live-people-search'),results=document.getElementById('live-people-results');
    input.oninput=()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=input.value.trim();if(q.length<2){results.innerHTML='<p>Type at least 2 letters.</p>';return;}results.innerHTML='<p>Searching…</p>';try{const people=(await api('/social/people?q='+encodeURIComponent(q),{idempotent:true})).people||[];results.innerHTML=people.length?people.map(p=>'<button data-person-id="'+esc(p.id)+'"><span>'+esc(p.name.slice(0,1).toUpperCase())+'</span><strong>'+esc(p.name)+'</strong></button>').join(''):'<p>No matching accounts.</p>';results.querySelectorAll('[data-person-id]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const created=await api('/social/conversations',{method:'POST',body:{kind:'private',recipientId:button.dataset.personId}});s.close();cache.lists=null;await loadLists(true);setHash(routeForSection('messages')+'/'+encodeURIComponent(created.conversation.id));}catch(error){showToast(error.message||'Could not start conversation.');button.disabled=false;}});}catch(error){results.innerHTML='<p>'+esc(error.message||'Search failed.')+'</p>';}},250);};
    input.focus();
  }
  function openPostSheet(){
    const isAdmin=window.DafatiiAuth?.user?.platformRole==='admin';
    const typeOptions=(isAdmin?'<option value="announcement">Announcement</option>':'')+'<option value="blog">Article</option><option value="event">Event</option>';
    const s=sheet('<div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Community</div><h2>Create post</h2></div><button class="icon-btn" data-live-close>×</button></div><form id="live-post-form"><div class="field"><label>Type</label><select id="live-post-type">'+typeOptions+'</select></div><div class="field"><label>Title</label><input id="live-post-title" maxlength="140" required></div><div class="field"><label>Post</label><textarea id="live-post-body" maxlength="2000" rows="6" required></textarea></div><div class="field"><label>Tags</label><input id="live-post-tags" maxlength="200" placeholder="Study tips, Exams"></div><button class="btn btn-primary entity-submit">Publish</button></form>','live-post');
    if(!s)return;
    document.getElementById('live-post-form').onsubmit=async event=>{event.preventDefault();event.submitter.disabled=true;try{await api('/social/posts',{method:'POST',body:{type:document.getElementById('live-post-type').value,title:document.getElementById('live-post-title').value.trim(),excerpt:document.getElementById('live-post-body').value.trim(),tags:document.getElementById('live-post-tags').value.split(',').map(x=>x.trim()).filter(Boolean)}});s.close();cache.posts=null;await loadPosts(true);render();}catch(error){showToast(error.message||'Post could not be published.');event.submitter.disabled=false;}};
  }
  function openPollSheet(conversationId){
    const s=sheet('<div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Poll</div><h2>Create poll</h2></div><button class="icon-btn" data-live-close>×</button></div><form id="live-poll-form"><div class="field"><label>Question</label><input id="live-poll-question" maxlength="180" required></div><div class="field"><label>Options</label><textarea id="live-poll-options" rows="4" required placeholder="One option per line"></textarea></div><button class="btn btn-primary entity-submit">Send poll</button></form>','live-poll-sheet');
    if(!s)return;
    document.getElementById('live-poll-form').onsubmit=async event=>{event.preventDefault();const options=document.getElementById('live-poll-options').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);if(options.length<2){showToast('Add at least two options.');return;}event.submitter.disabled=true;try{await api('/social/conversations/'+encodeURIComponent(conversationId)+'/messages',{method:'POST',body:{type:'poll',question:document.getElementById('live-poll-question').value.trim(),options}});s.close();await loadThread(conversationId,true);render();}catch(error){showToast(error.message||'Poll could not be sent.');event.submitter.disabled=false;}};
  }
  function openConversationOptions(conversation){
    const item=(cache.lists?.conversations||[]).find(c=>c.id===conversation.id)||{};
    const s=sheet('<div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Conversation</div><h2>'+esc(conversation.name)+'</h2></div><button class="icon-btn" data-live-close>×</button></div><div class="live-option-list"><button data-option="pinned">'+(item.pinned?'Unpin':'Pin')+' conversation</button><button data-option="muted">'+(item.muted?'Unmute':'Mute')+' notifications</button><button data-option="archived">'+(item.archived?'Unarchive':'Archive')+' conversation</button></div>','live-options');
    if(!s)return;
    s.root.querySelectorAll('[data-option]').forEach(button=>button.onclick=async()=>{button.disabled=true;const key=button.dataset.option;try{await api('/social/conversations/'+encodeURIComponent(conversation.id),{method:'PATCH',body:{[key]:!Boolean(item[key])}});s.close();await loadLists(true);render();}catch(error){showToast(error.message||'Setting could not be updated.');button.disabled=false;}});
  }

  window.DafatiiLiveSocial=Object.freeze({reload:async()=>{cache.lists=null;cache.posts=null;cache.messages.clear();await Promise.all([loadLists(true),loadPosts(true)]);render();}});
})();