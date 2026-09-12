(() => {
  const ROOM_KEY = 'dafatii:studyRoomState:v1';
  const CHAT_KEY = 'dafatii:chatState:v1';
  const STUDY_SUBNAV = ['Public study rooms','Private study rooms','My study rooms'];
  const CHAT_SUBNAV = ['Private chats','Groups','Unknown messages'];
  const MAX_IMAGE_BYTES = 900 * 1024;
  const MAX_VIDEO_BYTES = 1500 * 1024;
  const MAX_VOICE_BYTES = 800 * 1024;
  const now = () => Date.now();
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const esc = value => escapeHtml(value ?? '');
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  let activeTimer = null;
  let mediaRecorder = null;
  let mediaStream = null;
  let mediaChunks = [];
  let recordingConversationId = '';
  let discardVoiceRecording = false;

  MAIN_NAV['study-rooms'] = STUDY_SUBNAV;
  MAIN_NAV.chat = CHAT_SUBNAV;

  const ROOM_SEEDS = [
    {id:'room-physics-dawn',name:'Physics Dawn Club',subject:'Physics',visibility:'public',description:'Quiet 50/10 focus cycles for mechanics, electromagnetism and problem sets.',vibe:'Deep focus',members:128,online:17,capacity:40,streak:19,accent:'⚛',tags:['50/10','Quiet','Problem solving']},
    {id:'room-calculus-lab',name:'Calculus Problem Lab',subject:'Mathematics',visibility:'public',description:'Work through derivatives, integrals and proofs together. Ask only after attempting.',vibe:'Collaborative',members:214,online:29,capacity:50,streak:34,accent:'∫',tags:['Calculus','Whiteboard','Questions']},
    {id:'room-night-owls',name:'Night Owls Library',subject:'Mixed subjects',visibility:'public',description:'Late-night accountability room with ambient rain, muted chat and progress check-ins.',vibe:'Cozy',members:391,online:46,capacity:60,streak:51,accent:'☾',tags:['Late night','Ambient','Accountability']},
    {id:'room-med-sprint',name:'Med School Sprint',subject:'Biology',visibility:'private',pin:'2468',description:'Fast recall rounds for anatomy, physiology and pharmacology. PIN required.',vibe:'High energy',members:93,online:12,capacity:24,streak:27,accent:'🧬',tags:['Recall','Flashcards','PIN']},
    {id:'room-ielts-circle',name:'IELTS Speaking Circle',subject:'English',visibility:'private',pin:'1188',description:'Timed speaking prompts, peer feedback and vocabulary drills in small groups.',vibe:'Social',members:76,online:9,capacity:16,streak:14,accent:'Aa',tags:['Speaking','Feedback','PIN']},
    {id:'room-secret-launch',name:'Project Launch Room',subject:'Engineering',visibility:'secret',code:'LAUNCH24',description:'Invite-only project sprint room.',vibe:'Build mode',members:18,online:6,capacity:20,streak:8,accent:'⌘',tags:['Secret','Project','Build']}
  ];

  const CHAT_SEEDS = {
    conversations: [
      {id:'chat-maya',kind:'private',name:'Maya',avatar:'M',status:'online',accent:'🟣',messages:[
        {id:'m1',mine:false,type:'text',text:'Did you finish the physics sheet?',at:now()-42*60*1000,reactions:{'🔥':1}},
        {id:'m2',mine:true,type:'text',text:'Almost. I am stuck on question 7 😭',at:now()-40*60*1000,reactions:{}},
        {id:'m3',mine:false,type:'text',text:'Same. Let’s join the Physics Dawn Club after dinner.',at:now()-37*60*1000,reactions:{'🤝':1}}
      ]},
      {id:'chat-omar',kind:'private',name:'Omar',avatar:'O',status:'last seen 8m ago',accent:'🟢',messages:[
        {id:'o1',mine:false,type:'text',text:'I sent the notes in the group.',at:now()-95*60*1000,reactions:{}},
        {id:'o2',mine:true,type:'text',text:'Got them, thanks!',at:now()-90*60*1000,reactions:{'❤️':1}}
      ]},
      {id:'group-calculus',kind:'group',name:'Calculus Squad',avatar:'∫',status:'14 members · 6 online',accent:'🟡',messages:[
        {id:'g1',mine:false,sender:'Lina',type:'text',text:'Drop your hardest integral here 👇',at:now()-75*60*1000,reactions:{'🔥':3}},
        {id:'g2',mine:false,sender:'Yousef',type:'sticker',text:'🧠',at:now()-70*60*1000,reactions:{'😂':2}},
        {id:'g3',mine:true,type:'text',text:'I’ll share mine after I clean up the steps.',at:now()-66*60*1000,reactions:{}}
      ]},
      {id:'group-finals',kind:'group',name:'Finals Survival',avatar:'⚡',status:'28 members · 11 online',accent:'🔵',messages:[
        {id:'f1',mine:false,sender:'Noor',type:'text',text:'Tonight: 25 min chemistry, 5 min break, repeat x4.',at:now()-2*60*60*1000,reactions:{'✅':5}}
      ]},
      {id:'unknown-4821',kind:'unknown',name:'Unknown #4821',avatar:'?',status:'anonymous relay',accent:'⚫',messages:[
        {id:'u1',mine:false,type:'text',text:'Hey, do you have the lecture 6 slides?',at:now()-25*60*1000,reactions:{}},
        {id:'u2',mine:true,type:'text',text:'Yes. I can send the page numbers you need.',at:now()-22*60*1000,reactions:{}}
      ]},
      {id:'unknown-9017',kind:'unknown',name:'Unknown #9017',avatar:'?',status:'anonymous relay',accent:'⚫',messages:[
        {id:'u3',mine:false,type:'text',text:'Good luck on tomorrow’s exam. You’ve got this.',at:now()-5*60*60*1000,reactions:{'❤️':1}}
      ]}
    ],
    selected:{private:'chat-maya',group:'group-calculus',unknown:'unknown-4821'},
    reported:[],
    blocked:[]
  };

  function read(key,fallback){ return window.DafatiiCourses.readJSON(key,fallback); }
  function write(key,value){ return window.DafatiiCourses.writeJSON(key,value); }
  function safeWrite(key,value){
    try { write(key,value); return true; }
    catch(err){ showToast('Storage is full. Remove large media and try again.'); return false; }
  }
  function roomState(){
    const value=read(ROOM_KEY,null);
    return value && typeof value==='object' ? {
      customRooms:Array.isArray(value.customRooms)?value.customRooms:[],
      applied:Array.isArray(value.applied)?value.applied:[],
      verified:Array.isArray(value.verified)?value.verified:[],
      active:value.active&&typeof value.active==='object'?value.active:null
    } : {customRooms:[],applied:[],verified:[],active:null};
  }
  function saveRoomState(value){ safeWrite(ROOM_KEY,value); }
  function allRooms(){ return [...window.DafatiiCourses.roomSeeds(),...roomState().customRooms]; }
  function chatState(){
    const value=read(CHAT_KEY,null);
    if(value&&Array.isArray(value.conversations)) return {
      conversations:value.conversations,
      selected:{...CHAT_SEEDS.selected,...(value.selected||{})},
      reported:Array.isArray(value.reported)?value.reported:[],
      blocked:Array.isArray(value.blocked)?value.blocked:[]
    };
    return JSON.parse(JSON.stringify(CHAT_SEEDS));
  }
  function saveChatState(value){ return safeWrite(CHAT_KEY,value); }

  const previousWorkspaceContent = workspaceContent;
  workspaceContent = function(page,parts,title){
    if(page==='study-rooms') return studyRoomsView(parts);
    if(page==='chat') return chatView(parts);
    return previousWorkspaceContent(page,parts,title);
  };

  const previousWorkspace = workspace;
  workspace = function(current){
    if(activeTimer){ clearInterval(activeTimer); activeTimer=null; }
    const parts=current.split('/');
    if(parts[0]!=='chat') cancelVoiceRecording();
    previousWorkspace(current);
    if(parts[0]==='study-rooms') bindStudyRooms();
    if(parts[0]==='chat') bindChat();
  };

  function currentSub(parts,defaults){
    const raw=decodeURIComponent(parts.slice(1).join('/'));
    return raw || defaults[0];
  }

  function roomMetric(iconText,value,label){
    return `<div class="sr-metric"><span>${iconText}</span><strong>${esc(value)}</strong><small>${esc(label)}</small></div>`;
  }

  function studyRoomsView(parts){
    const sub=currentSub(parts,STUDY_SUBNAV).toLowerCase();
    const stateValue=roomState();
    const rooms=allRooms();
    let visible;
    if(sub==='private study rooms') visible=rooms.filter(room=>room.visibility==='private');
    else if(sub==='my study rooms') visible=rooms.filter(room=>stateValue.applied.includes(room.id)||room.owner==='me');
    else visible=rooms.filter(room=>room.visibility==='public');
    const active=stateValue.active ? rooms.find(room=>room.id===stateValue.active.roomId) : null;
    const heading=sub==='private study rooms'?'Private study rooms':sub==='my study rooms'?'My study rooms':'Public study rooms';
    const description=sub==='private study rooms'
      ? 'PIN-protected rooms for focused cohorts and trusted classmates.'
      : sub==='my study rooms'
        ? 'Rooms you created or applied to. Join any room to start a live study session.'
        : 'Discover active rooms built around subjects, focus styles and student routines.';
    return `<section class="sr-page">
      <div class="sr-hero">
        <div><div class="eyebrow">Study Rooms</div><h1>${heading}</h1><p>${description}</p></div>
        <div class="sr-hero-actions"><button class="btn btn-ghost" id="sr-join-secret">⌁ Join secret room</button><button class="btn btn-primary" id="sr-create">＋ Create study room</button></div>
      </div>
      ${active?activeRoomBanner(active,stateValue.active):''}
      <div class="sr-insights">
        ${roomMetric('●',visible.reduce((sum,r)=>sum+(r.online||0),0),'studying now')}
        ${roomMetric('◇',visible.length,'rooms shown')}
        ${roomMetric('✓',stateValue.applied.length,'in My rooms')}
        ${roomMetric('⚡',Math.max(0,...visible.map(r=>r.streak||0)),'best streak')}
      </div>
      ${visible.length?`<div class="sr-grid">${visible.map(room=>roomCard(room,stateValue)).join('')}</div>`:`<div class="sr-empty"><div>◎</div><h2>No rooms here yet</h2><p>Create a study room or apply to one from Public or Private rooms.</p><button class="btn btn-primary" id="sr-empty-create">Create a room</button></div>`}
    </section>`;
  }

  function activeRoomBanner(room,active){
    return `<div class="sr-active" data-active-start="${active.startedAt}">
      <div class="sr-active-pulse"></div><div class="sr-active-copy"><span>LIVE STUDY SESSION</span><strong>${esc(room.name)}</strong><small>${esc(room.subject)} · ${esc(room.vibe)}</small></div>
      <div class="sr-active-timer"><span>Focus time</span><strong id="sr-active-time">00:00</strong></div>
      <button class="btn btn-ghost" id="sr-leave-active">Leave room</button>
    </div>`;
  }

  function roomCard(room,stateValue){
    const applied=stateValue.applied.includes(room.id)||room.owner==='me';
    const verified=stateValue.verified.includes(room.id)||room.visibility!=='private'||room.owner==='me';
    const isActive=stateValue.active?.roomId===room.id;
    const visibility=room.visibility==='private'?'PIN room':room.visibility==='secret'?'Secret':'Public';
    const capacity=room.capacity||24;
    const online=clamp(room.online||0,0,capacity);
    const percent=Math.round(online/capacity*100);
    return `<article class="sr-card ${isActive?'active':''}" data-room-id="${esc(room.id)}">
      <div class="sr-card-top"><div class="sr-room-icon">${esc(room.accent||'◎')}</div><div class="sr-badges"><span>${esc(visibility)}</span><span>${esc(room.vibe||'Focus')}</span></div></div>
      <h2>${esc(room.name)}</h2><p>${esc(room.description||'')}</p>
      <div class="sr-room-subject"><strong>${esc(room.subject||'General')}</strong><span>${online}/${capacity} online</span></div>
      <div class="sr-capacity"><i style="--fill:${percent}%"></i></div>
      <div class="sr-tags">${(room.tags||[]).map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>
      <div class="sr-card-foot"><div><strong>${room.members||1}</strong><span>members</span></div><div><strong>${room.streak||0}d</strong><span>room streak</span></div></div>
      <div class="sr-actions">
        ${applied?`<button class="btn btn-ghost" disabled>✓ Applied</button>`:`<button class="btn btn-ghost" data-room-apply="${esc(room.id)}">Apply</button>`}
        <button class="btn btn-primary" data-room-join="${esc(room.id)}">${isActive?'Studying now':'Join'}</button>
      </div>
      ${room.visibility==='private'&&!verified?'<small class="sr-pin-note">PIN required to apply or join.</small>':''}
      ${room.owner==='me'&&room.visibility==='secret'?`<small class="sr-pin-note">Joining code: <strong>${esc(room.code)}</strong></small>`:''}
    </article>`;
  }

  function bindStudyRooms(){
    document.getElementById('sr-create')?.addEventListener('click',openCreateRoomSheet);
    document.getElementById('sr-empty-create')?.addEventListener('click',openCreateRoomSheet);
    document.getElementById('sr-join-secret')?.addEventListener('click',openSecretJoinSheet);
    document.getElementById('sr-leave-active')?.addEventListener('click',()=>{
      const value=roomState(); value.active=null; saveRoomState(value); render();
    });
    document.querySelectorAll('[data-room-apply]').forEach(btn=>btn.addEventListener('click',()=>applyRoom(btn.dataset.roomApply)));
    document.querySelectorAll('[data-room-join]').forEach(btn=>btn.addEventListener('click',()=>joinRoom(btn.dataset.roomJoin)));
    bindActiveRoomTimer();
  }

  function bindActiveRoomTimer(){
    const node=document.getElementById('sr-active-time');
    const banner=document.querySelector('[data-active-start]');
    if(!node||!banner) return;
    const started=Number(banner.dataset.activeStart)||now();
    const update=()=>{
      const elapsed=Math.max(0,Math.floor((now()-started)/1000));
      const h=Math.floor(elapsed/3600),m=Math.floor(elapsed%3600/60),s=elapsed%60;
      node.textContent=h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };
    update(); activeTimer=setInterval(update,1000);
  }

  function findRoom(id){ return allRooms().find(room=>room.id===id); }
  function requirePin(room,action){
    const value=roomState();
    if(room.visibility!=='private'||value.verified.includes(room.id)||room.owner==='me'){ action(); return; }
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="sr-pin-overlay"><section class="entity-sheet sr-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Private room</div><h2>Enter room PIN</h2></div><button class="icon-btn" id="sr-pin-close">×</button></div><form id="sr-pin-form"><div class="sr-sheet-room"><span>${esc(room.accent||'◎')}</span><div><strong>${esc(room.name)}</strong><small>${esc(room.subject)}</small></div></div><div class="field"><label>PIN</label><input id="sr-pin" inputmode="numeric" autocomplete="one-time-code" maxlength="12" required placeholder="Enter PIN"></div><p class="sr-sheet-help">Ask the room owner for the PIN. Private-room PINs are only a client-side gate in this prototype.</p><button class="btn btn-primary entity-submit" type="submit">Unlock room</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('sr-pin-close').onclick=close;
    document.getElementById('sr-pin-overlay').onclick=e=>{if(e.target.id==='sr-pin-overlay')close();};
    document.getElementById('sr-pin-form').onsubmit=e=>{
      e.preventDefault();
      if(document.getElementById('sr-pin').value.trim()!==String(room.pin||'')){ showToast('Incorrect PIN'); return; }
      const next=roomState(); if(!next.verified.includes(room.id))next.verified.push(room.id); saveRoomState(next); close(); action();
    };
    setTimeout(()=>document.getElementById('sr-pin')?.focus(),40);
  }

  function applyRoom(id){
    const room=findRoom(id); if(!room)return;
    requirePin(room,()=>{
      const value=roomState();
      if(!value.applied.includes(id)) value.applied.push(id);
      saveRoomState(value); showToast(`${room.name} added to My study rooms`); render();
    });
  }
  function joinRoom(id){
    const room=findRoom(id); if(!room)return;
    requirePin(room,()=>{
      const value=roomState(); value.active={roomId:id,startedAt:now()}; saveRoomState(value); render();
    });
  }

  function openCreateRoomSheet(){
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="sr-create-overlay"><section class="entity-sheet sr-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Study Rooms</div><h2>Create a study room</h2></div><button class="icon-btn" id="sr-create-close">×</button></div><form id="sr-create-form">
      <div class="field"><label>Room name</label><input id="sr-room-name" maxlength="70" required placeholder="e.g. Organic Chemistry Sprint"></div>
      <div class="calendar-form-grid"><div class="field"><label>Subject</label><input id="sr-room-subject" maxlength="50" required placeholder="Subject"></div><div class="field"><label>Capacity</label><input id="sr-room-capacity" type="number" min="2" max="100" value="20"></div></div>
      <div class="field"><label>Description</label><textarea id="sr-room-description" class="academic-notes" maxlength="260" placeholder="How should students use this room?"></textarea></div>
      <div class="calendar-form-grid"><div class="field"><label>Visibility</label><select id="sr-room-visibility"><option value="public">Public</option><option value="private">Private · PIN</option><option value="secret">Secret · joining code</option></select></div><div class="field"><label>Vibe</label><select id="sr-room-vibe"><option>Deep focus</option><option>Collaborative</option><option>Cozy</option><option>High energy</option><option>Build mode</option></select></div></div>
      <div class="field" id="sr-room-pin-field" hidden><label>Room PIN</label><input id="sr-room-pin" maxlength="12" inputmode="numeric" placeholder="Required for private rooms"></div>
      <div class="sr-sheet-actions"><button class="btn btn-primary" type="submit">Create room</button></div>
    </form></section></div>`;
    const visibility=document.getElementById('sr-room-visibility');
    const pinField=document.getElementById('sr-room-pin-field');
    visibility.onchange=()=>{ pinField.hidden=visibility.value!=='private'; document.getElementById('sr-room-pin').required=visibility.value==='private'; };
    const close=()=>{root.innerHTML='';};
    document.getElementById('sr-create-close').onclick=close;
    document.getElementById('sr-create-overlay').onclick=e=>{if(e.target.id==='sr-create-overlay')close();};
    document.getElementById('sr-create-form').onsubmit=e=>{
      e.preventDefault();
      const type=visibility.value;
      const code=type==='secret'?Math.random().toString(36).slice(2,8).toUpperCase():'';
      const room={id:uid('room'),owner:'me',name:document.getElementById('sr-room-name').value.trim(),subject:document.getElementById('sr-room-subject').value.trim(),description:document.getElementById('sr-room-description').value.trim(),visibility:type,pin:type==='private'?document.getElementById('sr-room-pin').value.trim():'',code,vibe:document.getElementById('sr-room-vibe').value,capacity:clamp(Number(document.getElementById('sr-room-capacity').value)||20,2,100),members:1,online:1,streak:1,accent:'✦',tags:type==='secret'?['Created by you','Secret']:type==='private'?['Created by you','PIN']:['Created by you','Public']};
      if(!room.name||!room.subject||(type==='private'&&!room.pin)) return;
      const value=roomState(); value.customRooms.push(room); if(!value.applied.includes(room.id))value.applied.push(room.id); if(type==='private')value.verified.push(room.id); saveRoomState(value); close(); setHash(`study-rooms/${encodeURIComponent('My study rooms')}`); showToast(type==='secret'?`Room created. Joining code: ${code}`:'Study room created');
    };
  }

  function openSecretJoinSheet(){
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="sr-secret-overlay"><section class="entity-sheet sr-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Secret room</div><h2>Join with code</h2></div><button class="icon-btn" id="sr-secret-close">×</button></div><form id="sr-secret-form"><div class="field"><label>Joining code</label><input id="sr-secret-code" maxlength="20" required autocomplete="off" placeholder="e.g. LAUNCH24"></div><p class="sr-sheet-help">Secret rooms do not appear in Public or Private discovery.</p><button class="btn btn-primary entity-submit" type="submit">Join secret room</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('sr-secret-close').onclick=close;
    document.getElementById('sr-secret-overlay').onclick=e=>{if(e.target.id==='sr-secret-overlay')close();};
    document.getElementById('sr-secret-form').onsubmit=e=>{
      e.preventDefault(); const code=document.getElementById('sr-secret-code').value.trim().toUpperCase(); const room=allRooms().find(r=>r.visibility==='secret'&&String(r.code||'').toUpperCase()===code);
      if(!room){showToast('Joining code not found');return;}
      const value=roomState(); if(!value.applied.includes(room.id))value.applied.push(room.id); value.active={roomId:room.id,startedAt:now()}; saveRoomState(value); close(); setHash(`study-rooms/${encodeURIComponent('My study rooms')}`);
    };
    setTimeout(()=>document.getElementById('sr-secret-code')?.focus(),40);
  }

  function normalizeChatKind(sub){
    const value=String(sub||'').toLowerCase();
    if(value==='groups') return 'group';
    if(value==='unknown messages') return 'unknown';
    return 'private';
  }

  function chatView(parts){
    const sub=currentSub(parts,CHAT_SUBNAV);
    const kind=normalizeChatKind(sub);
    const value=chatState();
    const conversations=value.conversations.filter(c=>c.kind===kind);
    let selectedId=value.selected[kind];
    if(!conversations.some(c=>c.id===selectedId)) selectedId=conversations[0]?.id||'';
    const selected=conversations.find(c=>c.id===selectedId)||null;
    return `<section class="chat-page" data-chat-kind="${kind}">
      <div class="chat-shell">
        <aside class="chat-rail">
          <div class="chat-rail-head"><div><div class="eyebrow">Chat</div><h1>${kind==='private'?'Private chats':kind==='group'?'Groups':'Unknown messages'}</h1></div><button class="chat-new" id="chat-new" aria-label="New conversation">＋</button></div>
          <div class="chat-search"><span>⌕</span><input id="chat-search" placeholder="Search conversations"></div>
          ${kind==='unknown'?'<div class="unknown-note"><strong>Anonymous by design</strong><p>Your display identity is hidden in this section. Report and block controls stay available.</p></div>':''}
          <div class="chat-list" id="chat-list">${conversations.map(c=>conversationRow(c,c.id===selectedId,value)).join('')}</div>
        </aside>
        <div class="chat-thread">${selected?threadView(selected,value):emptyChatThread(kind)}</div>
      </div>
    </section>`;
  }

  function conversationRow(c,active,value){
    const last=c.messages[c.messages.length-1];
    const preview=last?messagePreview(last):'Start a conversation';
    const blocked=value.blocked.includes(c.id);
    return `<button class="chat-conversation ${active?'active':''}" data-chat-open="${esc(c.id)}"><span class="chat-avatar">${esc(c.avatar||c.name?.[0]||'?')}</span><span class="chat-conv-copy"><strong>${esc(c.name)}</strong><small>${esc(blocked?'Blocked':preview)}</small></span><span class="chat-conv-meta"><time>${last?relativeTime(last.at):''}</time>${!active&&c.unread?`<b>${c.unread}</b>`:''}</span></button>`;
  }
  function messagePreview(message){
    if(message.type==='text')return message.text||'';
    if(message.type==='image')return '📷 Image';
    if(message.type==='video')return '🎥 Video';
    if(message.type==='voice')return '🎙 Voice message';
    if(message.type==='sticker'||message.type==='custom-sticker')return '✨ Sticker';
    if(message.type==='gif'||message.type==='gif-maker')return 'GIF';
    return 'Message';
  }
  function relativeTime(at){
    const mins=Math.max(0,Math.floor((now()-Number(at||now()))/60000));
    if(mins<1)return 'now'; if(mins<60)return `${mins}m`; const hrs=Math.floor(mins/60); if(hrs<24)return `${hrs}h`; return `${Math.floor(hrs/24)}d`;
  }
  function clockTime(at){ try{return new Date(at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}catch{return '';} }

  function threadView(conversation,value){
    const blocked=value.blocked.includes(conversation.id);
    return `<div class="chat-thread-head"><div class="chat-person"><span class="chat-avatar large">${esc(conversation.avatar||'?')}</span><div><strong>${esc(conversation.name)}</strong><small>${esc(conversation.status||'')}</small></div></div><div class="chat-head-actions">${conversation.kind==='unknown'?`<button class="chat-tool text" id="chat-report">Report</button><button class="chat-tool text" id="chat-block">${blocked?'Unblock':'Block'}</button>`:''}<button class="chat-tool" title="Search messages">⌕</button><button class="chat-tool" title="Conversation info">ⓘ</button></div></div>
      <div class="chat-messages" id="chat-messages">${conversation.messages.map(m=>messageBubble(m,conversation)).join('')}</div>
      ${blocked?'<div class="chat-blocked">This anonymous conversation is blocked. Unblock to send messages.</div>':composerView(conversation)}`;
  }

  function emptyChatThread(kind){
    return `<div class="chat-empty-thread"><div>✦</div><h2>${kind==='group'?'Create or open a group':kind==='unknown'?'Start an anonymous conversation':'Open a private chat'}</h2><p>Your conversations, media and reactions will appear here.</p></div>`;
  }

  function messageBubble(message,conversation){
    const sender=message.mine?'You':conversation.kind==='group'?(message.sender||conversation.name):conversation.kind==='unknown'?conversation.name:conversation.name;
    const reactions=Object.entries(message.reactions||{}).filter(([,count])=>count>0);
    return `<div class="chat-message-row ${message.mine?'mine':'theirs'}" data-message-id="${esc(message.id)}"><div class="chat-message-wrap">${conversation.kind==='group'&&!message.mine?`<small class="chat-sender">${esc(sender)}</small>`:''}<div class="chat-bubble ${message.type!=='text'?'media':''}">${renderMessageContent(message)}<div class="chat-message-time">${esc(clockTime(message.at))}</div></div>${reactions.length?`<div class="chat-reactions">${reactions.map(([emoji,count])=>`<button data-react="${esc(emoji)}">${esc(emoji)} ${count}</button>`).join('')}</div>`:''}<div class="chat-quick-react"><button data-react="❤️">❤️</button><button data-react="😂">😂</button><button data-react="🔥">🔥</button><button data-react="✅">✅</button></div></div></div>`;
  }

  function renderMessageContent(message){
    if(message.type==='image') return `<img class="chat-image" src="${esc(message.data)}" alt="Shared image">`;
    if(message.type==='video') return `<video class="chat-video" src="${esc(message.data)}" controls playsinline></video>`;
    if(message.type==='voice') return `<div class="chat-voice"><span>🎙</span><audio src="${esc(message.data)}" controls preload="metadata"></audio></div>`;
    if(message.type==='sticker') return `<div class="chat-sticker">${esc(message.text||'✨')}</div>`;
    if(message.type==='custom-sticker') return `<div class="chat-custom-sticker"><span>${esc(message.emoji||'✨')}</span><strong>${esc(message.text||'Study mode')}</strong></div>`;
    if(message.type==='gif') return `<img class="chat-gif" src="${esc(message.data)}" alt="Shared GIF">`;
    if(message.type==='gif-maker') return `<div class="chat-made-gif"><span>${esc(message.frame1||'FOCUS')}</span><span>${esc(message.frame2||'DONE')}</span></div>`;
    return `<div class="chat-text">${esc(message.text||'')}</div>`;
  }

  function composerView(conversation){
    return `<div class="chat-composer-wrap">
      ${conversation.kind==='unknown'?'<div class="chat-anon-pill">◌ Sending as an unknown student</div>':''}
      <div class="chat-composer-tools"><button class="chat-tool-pill" id="chat-sticker">✨ Sticker</button><button class="chat-tool-pill" id="chat-gif">GIF</button><button class="chat-tool-pill" id="chat-image">📷 Image</button><button class="chat-tool-pill" id="chat-video">🎥 Video</button><button class="chat-tool-pill" id="chat-voice">🎙 Voice</button></div>
      <div class="chat-composer"><textarea id="chat-input" rows="1" maxlength="4000" placeholder="Message ${esc(conversation.kind==='unknown'?'anonymously':conversation.name)}…"></textarea><button id="chat-send" aria-label="Send message">➤</button></div>
      <input type="file" id="chat-image-file" accept="image/*" hidden><input type="file" id="chat-video-file" accept="video/*" hidden>
      <div id="chat-picker-root"></div>
    </div>`;
  }

  function bindChat(){
    const root=document.querySelector('.chat-page'); if(!root)return;
    const kind=root.dataset.chatKind;
    const value=chatState();
    document.querySelectorAll('[data-chat-open]').forEach(btn=>btn.addEventListener('click',()=>{
      value.selected[kind]=btn.dataset.chatOpen; saveChatState(value); render();
    }));
    document.getElementById('chat-search')?.addEventListener('input',e=>{
      const query=e.target.value.trim().toLowerCase();
      document.querySelectorAll('.chat-conversation').forEach(row=>{row.hidden=query&&!row.textContent.toLowerCase().includes(query);});
    });
    document.getElementById('chat-new')?.addEventListener('click',()=>openNewConversationSheet(kind));
    const selected=value.conversations.find(c=>c.id===value.selected[kind]&&c.kind===kind)||value.conversations.find(c=>c.kind===kind);
    if(mediaRecorder&&mediaRecorder.state==='recording'&&recordingConversationId&&selected?.id!==recordingConversationId) cancelVoiceRecording();
    if(!selected)return;
    bindMessageActions(selected,value);
    document.getElementById('chat-report')?.addEventListener('click',()=>{
      if(!value.reported.includes(selected.id))value.reported.push(selected.id); saveChatState(value); showToast('Anonymous conversation reported');
    });
    document.getElementById('chat-block')?.addEventListener('click',()=>{
      const i=value.blocked.indexOf(selected.id); if(i>=0)value.blocked.splice(i,1); else value.blocked.push(selected.id); saveChatState(value); render();
    });
    scrollChatToBottom();
  }

  function bindMessageActions(conversation,value){
    const input=document.getElementById('chat-input');
    const send=()=>{ const text=input?.value.trim(); if(!text)return; appendMessage(conversation,{type:'text',text}); };
    document.getElementById('chat-send')?.addEventListener('click',send);
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
    input?.addEventListener('input',()=>{input.style.height='auto';input.style.height=`${Math.min(130,input.scrollHeight)}px`;});
    document.getElementById('chat-image')?.addEventListener('click',()=>document.getElementById('chat-image-file')?.click());
    document.getElementById('chat-video')?.addEventListener('click',()=>document.getElementById('chat-video-file')?.click());
    document.getElementById('chat-image-file')?.addEventListener('change',e=>handleMediaFile(e.target.files?.[0],'image',conversation));
    document.getElementById('chat-video-file')?.addEventListener('change',e=>handleMediaFile(e.target.files?.[0],'video',conversation));
    document.getElementById('chat-sticker')?.addEventListener('click',()=>openStickerPicker(conversation));
    document.getElementById('chat-gif')?.addEventListener('click',()=>openGifPicker(conversation));
    document.getElementById('chat-voice')?.addEventListener('click',()=>toggleVoiceRecording(conversation));
    document.querySelectorAll('[data-message-id] [data-react]').forEach(btn=>btn.addEventListener('click',()=>{
      const row=btn.closest('[data-message-id]'); const message=conversation.messages.find(m=>m.id===row.dataset.messageId); if(!message)return; message.reactions=message.reactions||{}; message.reactions[btn.dataset.react]=(message.reactions[btn.dataset.react]||0)+1; saveChatMutation(conversation); render();
    }));
  }

  function saveChatMutation(conversation){
    const value=chatState(); const index=value.conversations.findIndex(c=>c.id===conversation.id); if(index>=0)value.conversations[index]=conversation; return saveChatState(value);
  }
  function appendMessage(conversation,payload){
    const message={id:uid('msg'),mine:true,at:now(),reactions:{},...payload};
    conversation.messages.push(message);
    if(saveChatMutation(conversation)) render(); else conversation.messages.pop();
  }
  function scrollChatToBottom(){ const box=document.getElementById('chat-messages'); if(box)requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight;}); }

  async function handleMediaFile(file,type,conversation){
    if(!file)return;
    const max=type==='image'?MAX_IMAGE_BYTES:MAX_VIDEO_BYTES;
    if(file.size>max){showToast(`${type==='image'?'Image':'Video'} is too large for this browser-only prototype`);return;}
    try { const data=await fileToDataUrl(file); appendMessage(conversation,{type,data,name:file.name}); }
    catch { showToast('Could not read that file'); }
  }
  function fileToDataUrl(file){ return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file);}); }

  function cancelVoiceRecording(){
    if(!mediaRecorder&& !mediaStream) return;
    discardVoiceRecording=true;
    try { if(mediaRecorder&&mediaRecorder.state==='recording') mediaRecorder.stop(); } catch {}
    mediaStream?.getTracks().forEach(track=>track.stop());
    mediaStream=null;
  }

  async function toggleVoiceRecording(conversation){
    const button=document.getElementById('chat-voice');
    if(mediaRecorder&&mediaRecorder.state==='recording'){
      mediaRecorder.stop(); if(button)button.textContent='🎙 Voice'; return;
    }
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){showToast('Voice recording is not supported in this browser');return;}
    try{
      mediaStream=await navigator.mediaDevices.getUserMedia({audio:true}); mediaChunks=[]; discardVoiceRecording=false; recordingConversationId=conversation.id; mediaRecorder=new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable=e=>{if(e.data.size)mediaChunks.push(e.data);};
      mediaRecorder.onstop=async()=>{
        const recorder=mediaRecorder;
        const blob=new Blob(mediaChunks,{type:recorder?.mimeType||'audio/webm'}); mediaStream?.getTracks().forEach(t=>t.stop()); mediaStream=null; mediaRecorder=null; recordingConversationId='';
        if(discardVoiceRecording){discardVoiceRecording=false;mediaChunks=[];return;}
        if(blob.size>MAX_VOICE_BYTES){showToast('Voice note is too long for local storage');return;}
        const data=await fileToDataUrl(blob); appendMessage(conversation,{type:'voice',data});
      };
      mediaRecorder.start(); if(button)button.textContent='■ Stop recording';
    }catch{showToast('Microphone permission was not granted');}
  }

  function openStickerPicker(conversation){
    const root=document.getElementById('chat-picker-root'); if(!root)return;
    const stickers=['📚','🧠','🔥','😭','😂','💯','🫡','⚡','☕','🎓','✅','🤝','😴','🚀','🧪','📐'];
    root.innerHTML=`<div class="chat-picker"><div class="chat-picker-head"><strong>Stickers</strong><button data-picker-close>×</button></div><div class="chat-provider-row"><button data-open-provider="https://giphy.com/stickers">GIPHY Stickers ↗</button><button data-open-provider="https://tenor.com/search/stickers">Tenor Stickers ↗</button></div><div class="chat-sticker-grid">${stickers.map(s=>`<button data-sticker="${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="chat-picker-footer"><button class="btn btn-ghost" id="chat-upload-sticker">Upload image</button><button class="btn btn-primary" id="chat-make-sticker">Make sticker</button><input id="chat-sticker-file" type="file" accept="image/*" hidden></div></div>`;
    bindPickerBase(root);
    root.querySelectorAll('[data-sticker]').forEach(btn=>btn.onclick=()=>appendMessage(conversation,{type:'sticker',text:btn.dataset.sticker}));
    document.getElementById('chat-upload-sticker').onclick=()=>document.getElementById('chat-sticker-file').click();
    document.getElementById('chat-sticker-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>MAX_IMAGE_BYTES){showToast('Sticker image is too large');return;}const data=await fileToDataUrl(file);appendMessage(conversation,{type:'image',data,sticker:true});};
    document.getElementById('chat-make-sticker').onclick=()=>openMakeStickerSheet(conversation);
  }

  function openGifPicker(conversation){
    const root=document.getElementById('chat-picker-root'); if(!root)return;
    root.innerHTML=`<div class="chat-picker"><div class="chat-picker-head"><strong>GIFs</strong><button data-picker-close>×</button></div><div class="chat-provider-row"><button data-open-provider="https://giphy.com/search/study">Search GIPHY ↗</button><button data-open-provider="https://tenor.com/search/study-gifs">Search Tenor ↗</button></div><div class="chat-gif-url"><input id="chat-gif-url" inputmode="url" placeholder="Paste a direct GIF URL"><button class="btn btn-primary" id="chat-add-gif">Add GIF</button></div><div class="chat-made-gif-presets"><button data-gif-preset="LOCKED IN|BREAK TIME">LOCKED IN ↔ BREAK TIME</button><button data-gif-preset="WE GOT THIS|ONE MORE PAGE">WE GOT THIS ↔ ONE MORE PAGE</button><button data-gif-preset="BRAIN LOADING|BRAIN ONLINE">BRAIN LOADING ↔ BRAIN ONLINE</button></div><div class="chat-picker-footer"><span></span><button class="btn btn-primary" id="chat-make-gif">Make GIF</button></div></div>`;
    bindPickerBase(root);
    document.getElementById('chat-add-gif').onclick=()=>{
      const url=document.getElementById('chat-gif-url').value.trim(); if(!/^https?:\/\//i.test(url)){showToast('Paste a valid http(s) GIF URL');return;} appendMessage(conversation,{type:'gif',data:url});
    };
    root.querySelectorAll('[data-gif-preset]').forEach(btn=>btn.onclick=()=>{const [frame1,frame2]=btn.dataset.gifPreset.split('|');appendMessage(conversation,{type:'gif-maker',frame1,frame2});});
    document.getElementById('chat-make-gif').onclick=()=>openMakeGifSheet(conversation);
  }

  function bindPickerBase(root){
    root.querySelector('[data-picker-close]').onclick=()=>{root.innerHTML='';};
    root.querySelectorAll('[data-open-provider]').forEach(btn=>btn.onclick=()=>{const win=window.open(btn.dataset.openProvider,'_blank','noopener,noreferrer');if(win)win.opener=null;});
  }

  function openMakeStickerSheet(conversation){
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="chat-maker-overlay"><section class="entity-sheet chat-maker-sheet"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Chat creator</div><h2>Make a sticker</h2></div><button class="icon-btn" id="chat-maker-close">×</button></div><form id="chat-maker-form"><div class="field"><label>Emoji</label><input id="chat-maker-emoji" maxlength="4" value="✨"></div><div class="field"><label>Sticker text</label><input id="chat-maker-text" maxlength="40" required placeholder="e.g. LOCKED IN"></div><button class="btn btn-primary entity-submit">Send sticker</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};document.getElementById('chat-maker-close').onclick=close;document.getElementById('chat-maker-overlay').onclick=e=>{if(e.target.id==='chat-maker-overlay')close();};document.getElementById('chat-maker-form').onsubmit=e=>{e.preventDefault();const text=document.getElementById('chat-maker-text').value.trim();if(!text)return;const emoji=document.getElementById('chat-maker-emoji').value.trim()||'✨';close();appendMessage(conversation,{type:'custom-sticker',text,emoji});};
  }

  function openMakeGifSheet(conversation){
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="chat-maker-overlay"><section class="entity-sheet chat-maker-sheet"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Chat creator</div><h2>Make a GIF</h2></div><button class="icon-btn" id="chat-maker-close">×</button></div><form id="chat-maker-form"><div class="field"><label>Frame 1</label><input id="chat-gif-frame1" maxlength="32" required placeholder="LOCKED IN"></div><div class="field"><label>Frame 2</label><input id="chat-gif-frame2" maxlength="32" required placeholder="BREAK TIME"></div><p class="sr-sheet-help">Creates a lightweight animated reaction loop inside Dafatii.</p><button class="btn btn-primary entity-submit">Send GIF</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};document.getElementById('chat-maker-close').onclick=close;document.getElementById('chat-maker-overlay').onclick=e=>{if(e.target.id==='chat-maker-overlay')close();};document.getElementById('chat-maker-form').onsubmit=e=>{e.preventDefault();const frame1=document.getElementById('chat-gif-frame1').value.trim(),frame2=document.getElementById('chat-gif-frame2').value.trim();if(!frame1||!frame2)return;close();appendMessage(conversation,{type:'gif-maker',frame1,frame2});};
  }

  function openNewConversationSheet(kind){
    const root=document.getElementById('overlay-root'); if(!root)return;
    const title=kind==='group'?'Create a group':kind==='unknown'?'Start unknown chat':'Start private chat';
    const label=kind==='group'?'Group name':kind==='unknown'?'Topic label':'Student name';
    root.innerHTML=`<div class="entity-sheet-overlay" id="chat-new-overlay"><section class="entity-sheet chat-maker-sheet"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Chat</div><h2>${title}</h2></div><button class="icon-btn" id="chat-new-close">×</button></div><form id="chat-new-form"><div class="field"><label>${label}</label><input id="chat-new-name" maxlength="60" required placeholder="${kind==='group'?'e.g. Organic Chem Crew':kind==='unknown'?'e.g. Lecture notes':'e.g. Sara'}"></div>${kind==='unknown'?'<p class="sr-sheet-help">A random anonymous alias is shown to both sides. Your profile name is not displayed in the thread.</p>':''}<button class="btn btn-primary entity-submit">${kind==='group'?'Create group':'Start chat'}</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};document.getElementById('chat-new-close').onclick=close;document.getElementById('chat-new-overlay').onclick=e=>{if(e.target.id==='chat-new-overlay')close();};document.getElementById('chat-new-form').onsubmit=e=>{e.preventDefault();const name=document.getElementById('chat-new-name').value.trim();if(!name)return;const value=chatState();const id=uid(kind);const display=kind==='unknown'?`Unknown #${Math.floor(1000+Math.random()*9000)}`:name;value.conversations.unshift({id,kind,name:display,topic:kind==='unknown'?name:'',avatar:kind==='group'?'◎':kind==='unknown'?'?':name[0].toUpperCase(),status:kind==='group'?'1 member · you':kind==='unknown'?'anonymous relay':'new chat',messages:[]});value.selected[kind]=id;saveChatState(value);close();render();};
  }
})();
