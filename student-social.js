(() => {
  const ROOM_KEY = 'dafatii:studyRoomState:v1';
  const CHAT_KEY = 'dafatii:chatState:v1';
  const CHAT_POST_KEY = 'dafatii:chatCommunityPosts:v1';
  const STUDY_SUBNAV = ['Public study rooms','Private study rooms','My study rooms'];
  const CHAT_SUBNAV = ['Private chats','Groups','Blogs & announcements','Anonymous'];
  const CHAT_SECTION_SUBPAGES = {
    'Private chats':[['all','All'],['unread','Unread'],['starred','Starred'],['archived','Archived']],
    'Groups':[['all','All groups'],['unread','Unread'],['starred','Starred'],['archived','Archived']],
    'Blogs & announcements':[['latest','Latest'],['announcement','Announcements'],['blog','Blogs'],['study','Study tips']],
    'Anonymous':[['all','All'],['unread','Unread'],['starred','Starred'],['archived','Archived']]
  };
  let chatFeedFilter='latest';
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

  const CHAT_FEED_SEEDS = [
    {id:'post-exam-week',type:'announcement',author:'Dafatii',title:'Exam-week study rooms are open',excerpt:'Join subject-specific study rooms, keep your schedule updated, and use the shared course workspace to stay coordinated this week.',at:now()-55*60*1000,tags:['Exams','Study rooms']},
    {id:'post-active-recall',type:'blog',author:'Learning team',title:'A practical active-recall routine for lecture-heavy courses',excerpt:'Turn every lecture into a short retrieval loop: close the material, write what you remember, check gaps, then repeat after a delay.',at:now()-6*60*60*1000,tags:['Study skills','Recall']},
    {id:'post-course-updates',type:'announcement',author:'Course team',title:'Course announcements now live in Chats',excerpt:'Important course-wide updates and learning posts are collected here so they do not get lost between private and group conversations.',at:now()-25*60*60*1000,tags:['Courses','Updates']},
    {id:'post-focus-sprint',type:'blog',author:'Student community',title:'Build a 45-minute focus sprint that you can repeat',excerpt:'Pick one concrete outcome, block distractions, work for 45 minutes, then record what moved before taking a real break.',at:now()-2*24*60*60*1000,tags:['Focus','Planning']}
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
    if(value==='anonymous'||value==='unknown messages') return 'unknown';
    return 'private';
  }
  const chatSectionForKind = kind => kind==='group'?'Groups':kind==='unknown'?'Anonymous':'Private chats';
  const chatSectionSlug = section => encodeURIComponent(section);
  const chatThreadRoute = (kind,id='') => `chat/${chatSectionSlug(chatSectionForKind(kind))}${id?'/'+encodeURIComponent(id):''}`;
  function chatSection(parts){
    const raw=decodeURIComponent(parts[1]||CHAT_SUBNAV[0]);
    return CHAT_SUBNAV.find(item=>item.toLowerCase()===raw.toLowerCase())||CHAT_SUBNAV[0];
  }
  const CHAT_ICON_PATHS = {
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4.1 3.1-6.2 7-6.2S18.2 15.9 19 20"/>',
    back:'<path d="M19 12H5m6-6-6 6 6 6"/>',
    chat:'<path d="M5.5 17.5 4 21l4.4-1.4A8.5 8.5 0 1 0 5.5 17.5Z"/>',
    groups:'<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M17 11a3 3 0 1 0 0-6m4 15v-1.5a4 4 0 0 0-3-3.9"/>',
    news:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h4M14 13h2M8 16h8"/>',
    anonymous:'<path d="M4 11h16M7 11l2-5h6l2 5"/><circle cx="8" cy="15" r="3"/><circle cx="16" cy="15" r="3"/><path d="M11 15h2"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    pin:'<path d="m9 4 6 0-1 5 3 3H7l3-3-1-5Z"/><path d="M12 12v8"/>',
    mute:'<path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="m17 9 4 4m0-4-4 4"/>',
    phone:'<path d="M6.5 4.5 9 8l-1.5 2a14 14 0 0 0 6.5 6.5L16 15l3.5 2.5c.7.5.8 1.5.2 2.1l-1 1c-.8.8-2 1.1-3 .6C8.9 18.3 5.7 15.1 2.8 8.3c-.5-1-.2-2.2.6-3l1-1c.6-.6 1.6-.5 2.1.2Z"/>',
    video:'<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    attach:'<path d="m8.5 12.5 6.8-6.8a3 3 0 1 1 4.2 4.2l-8.7 8.7a5 5 0 0 1-7.1-7.1l8.6-8.6"/><path d="m7 14 7.3-7.3"/>',
    smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M8 14c1 1.5 2.3 2.2 4 2.2S15 15.5 16 14"/>',
    mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    send:'<path d="m4 5 16 7-16 7 3-7-3-7Z"/><path d="M7 12h13"/>',
    reply:'<path d="m10 8-5 4 5 4v-3c5 0 7 1 9 4-1-6-4-8-9-8V8Z"/>',
    forward:'<path d="m14 8 5 4-5 4v-3c-5 0-7 1-9 4 1-6 4-8 9-8V8Z"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    archive:'<path d="M4 7h16v13H4V7Z"/><path d="M3 4h18v3H3V4Zm6 7h6"/>',
    copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    edit:'<path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m13.5 7.5 3 3"/>',
    trash:'<path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 20"/>',
    file:'<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h6M9 17h5"/>',
    location:'<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
    poll:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
    stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>',
    block:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    chevronRight:'<path d="m9 5 7 7-7 7"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  };
  function chatIcon(name,extra=''){
    return `<svg class="chat-icon ${extra}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${CHAT_ICON_PATHS[name]||''}</svg>`;
  }
  function chatSubpages(section){return CHAT_SECTION_SUBPAGES[section]||CHAT_SECTION_SUBPAGES['Private chats'];}
  function chatAppNavItem(section,label,iconName){
    const active=section.toLowerCase()===label.toLowerCase();
    return `<a class="chat-app-nav-item ${active?'active':''}" href="#chat/${chatSectionSlug(label)}" aria-current="${active?'page':'false'}"><span aria-hidden="true">${chatIcon(iconName)}</span><small>${esc(label==='Blogs & announcements'?'Blogs':label==='Private chats'?'Private':label)}</small></a>`;
  }
  function chatAppShell(section,body,{thread=false,subpage=''}={}){
    const user=window.DafatiiAuth?.user;
    const avatar=esc((user?.displayName||'D').trim().slice(0,1).toUpperCase()||'D');
    const subpages=chatSubpages(section);
    const activeSubpage=subpage||subpages[0]?.[0]||'';
    return `<section class="chat-app-page ${thread?'thread-open':''}" data-chat-section="${esc(section)}" data-chat-subpage="${esc(activeSubpage)}">
      <header class="chat-app-topbar">
        <button class="chat-app-menu" id="chat-app-menu" aria-label="Open Chat menu" aria-expanded="false">${chatIcon('menu')}</button>
        <span class="chat-app-topbar-spacer" aria-hidden="true"></span>
        <div class="chat-app-top-actions">
          <a class="chat-app-profile" href="#profile" aria-label="Profile"><span>${avatar}</span></a>
        </div>
      </header>
      <nav class="chat-app-subnav" aria-label="${esc(section)} subpages">
        ${subpages.map(([id,label])=>`<button type="button" data-chat-subpage="${esc(id)}" class="${id===activeSubpage?'active':''}" aria-current="${id===activeSubpage?'page':'false'}">${esc(label)}</button>`).join('')}
      </nav>
      <aside class="chat-app-drawer" id="chat-app-drawer" aria-label="Chat app menu">
        <div class="chat-app-drawer-head"><div><span class="chat-app-logo-mark">D</span><div><strong>Dafatii Chat</strong><small>People · Connect</small></div></div><button id="chat-app-drawer-close" aria-label="Close Chat menu">${chatIcon('close')}</button></div>
        <nav>
          <a class="${section==='Private chats'?'active':''}" href="#chat/${chatSectionSlug('Private chats')}">${chatIcon('chat')}<span>Private chats</span></a>
          <a class="${section==='Groups'?'active':''}" href="#chat/${chatSectionSlug('Groups')}">${chatIcon('groups')}<span>Groups</span></a>
          <a class="${section==='Blogs & announcements'?'active':''}" href="#chat/${chatSectionSlug('Blogs & announcements')}">${chatIcon('news')}<span>Blogs & announcements</span></a>
          <a class="${section==='Anonymous'?'active':''}" href="#chat/${chatSectionSlug('Anonymous')}">${chatIcon('anonymous')}<span>Anonymous</span></a>
        </nav>
        <div class="chat-app-drawer-foot"><a href="#dashboard">${chatIcon('back')}<span>Return to dashboard</span></a><a href="#profile">${chatIcon('user')}<span>Profile</span></a></div>
      </aside>
      <button class="chat-app-drawer-backdrop" id="chat-app-drawer-backdrop" aria-label="Close Chat menu"></button>
      <main class="chat-app-stage">${body}</main>
      <nav class="chat-app-bottom" aria-label="Chat app navigation">
        <a class="chat-app-nav-item exit" href="#dashboard"><span aria-hidden="true">${chatIcon('back')}</span><small>Dashboard</small></a>
        ${chatAppNavItem(section,'Private chats','chat')}
        ${chatAppNavItem(section,'Groups','groups')}
        ${chatAppNavItem(section,'Blogs & announcements','news')}
        ${chatAppNavItem(section,'Anonymous','anonymous')}
      </nav>
    </section>`;
  }
  function chatListView(kind,value,conversations){
    const title=kind==='private'?'Private chats':kind==='group'?'Groups':'Anonymous';
    const description=kind==='private'?'Direct conversations with students.':kind==='group'?'Course and study-group conversations.':'Identity-hidden conversations with report and block controls.';
    return `<section class="chat-directory">
      <div class="chat-directory-head"><div><div class="eyebrow">Chats</div><h1>${title}</h1><p>${description}</p></div><button class="chat-new" id="chat-new" aria-label="New conversation">＋</button></div>
      <div class="chat-search"><span>⌕</span><input id="chat-search" placeholder="Search ${kind==='group'?'groups':'conversations'}"></div>
      ${kind==='unknown'?'<div class="unknown-note"><strong>Anonymous by design</strong><p>Your profile name is hidden here. You can report or block any anonymous conversation.</p></div>':''}
      <div class="chat-directory-list" id="chat-list">${conversations.length?conversations.map(c=>conversationRow(c,false,value)).join(''):`<div class="chat-directory-empty"><span>${chatAppMark(kind)}</span><h2>No conversations yet</h2><p>Start one with the button above.</p></div>`}</div>
    </section>`;
  }
  function chatThreadPage(conversation,value){
    return `<section class="chat-thread-page">
      <div class="chat-thread-route-head"><a href="#${chatThreadRoute(conversation.kind)}" aria-label="Back to conversation list">←</a><div><small>${esc(chatSectionForKind(conversation.kind))}</small><strong>${esc(conversation.name)}</strong></div></div>
      <div class="chat-thread">${threadView(conversation,value)}</div>
    </section>`;
  }
  function chatCommunityPosts(){
    const value=read(CHAT_POST_KEY,[]);
    return Array.isArray(value)?value:[];
  }
  function chatFeedView(){
    const posts=[...chatCommunityPosts(),...CHAT_FEED_SEEDS].filter(post=>{
      if(chatFeedFilter==='announcement')return post.type==='announcement';
      if(chatFeedFilter==='blog')return post.type==='blog';
      if(chatFeedFilter==='study')return post.type==='blog'&&post.tags.some(tag=>/study|focus|recall|planning/i.test(tag));
      return true;
    }).sort((a,b)=>b.at-a.at);
    return `<section class="chat-feed-page">
      <div class="chat-feed-intro"><div><small>Community</small><h1>Blogs & announcements</h1></div><p>Course updates, Dafatii announcements, and useful study posts in one focused feed.</p></div>
      <button class="chat-feed-create" id="chat-feed-create" type="button" aria-label="Create community post" title="Create community post">${chatIcon('plus')}</button>
      <div class="chat-feed-grid">${posts.map(post=>`<article class="chat-feed-card ${post.type}">
        <div class="chat-feed-card-top"><span>${post.type==='announcement'?'Announcement':'Blog'}</span><time>${relativeTime(post.at)}</time></div>
        <h2>${esc(post.title)}</h2><p>${esc(post.excerpt)}</p>
        <div class="chat-feed-author"><span>${esc((post.author||'D')[0])}</span><div><strong>${esc(post.author)}</strong><small>${post.type==='announcement'?'Official update':'Community post'}</small></div></div>
        <div class="chat-feed-tags">${post.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>
      </article>`).join('')}</div>
    </section>`;
  }
  function openCommunityPostSheet(){
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="chat-post-overlay"><section class="entity-sheet chat-maker-sheet"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Community</div><h2>Create post</h2></div><button class="icon-btn" id="chat-post-close">×</button></div><form id="chat-post-form"><div class="field"><label>Title</label><input id="chat-post-title" maxlength="120" required placeholder="Post title"></div><div class="field"><label>Post</label><textarea id="chat-post-body" maxlength="600" rows="6" required placeholder="Share something useful with the community…"></textarea></div><div class="field"><label>Tags <span class="field-optional">Optional</span></label><input id="chat-post-tags" maxlength="100" placeholder="Study tips, Focus"></div><button class="btn btn-primary entity-submit">Publish post</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('chat-post-close').onclick=close;
    document.getElementById('chat-post-overlay').onclick=e=>{if(e.target.id==='chat-post-overlay')close();};
    document.getElementById('chat-post-form').onsubmit=e=>{
      e.preventDefault();
      const title=document.getElementById('chat-post-title').value.trim();
      const excerpt=document.getElementById('chat-post-body').value.trim();
      const tags=document.getElementById('chat-post-tags').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,6);
      if(!title||!excerpt)return;
      const posts=chatCommunityPosts();
      posts.unshift({id:uid('post'),type:'blog',author:'You',title,excerpt,at:now(),tags:tags.length?tags:['Community']});
      if(!safeWrite(CHAT_POST_KEY,posts.slice(0,50)))return;
      close(); chatFeedFilter='latest'; render(); showToast('Community post published');
    };
  }

  function chatView(parts){
    const section=chatSection(parts);
    if(section==='Blogs & announcements')return chatAppShell(section,chatFeedView(),{subpage:chatFeedFilter});
    const kind=normalizeChatKind(section),value=chatState();
    const conversations=value.conversations.filter(c=>c.kind===kind);
    const requestedId=parts[2]?decodeURIComponent(parts[2]):'';
    const selected=requestedId?conversations.find(c=>c.id===requestedId)||null:null;
    const body=selected?chatThreadPage(selected,value):chatListView(kind,value,conversations);
    return chatAppShell(section,`<div class="chat-page" data-chat-kind="${kind}" data-chat-selected="${esc(selected?.id||'')}">${body}</div>`,{thread:Boolean(selected)});
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
    const appRoot=document.querySelector('.chat-app-page'); if(!appRoot)return;
    const drawer=document.getElementById('chat-app-drawer');
    const menu=document.getElementById('chat-app-menu');
    const closeDrawer=()=>{appRoot.classList.remove('drawer-open');menu?.setAttribute('aria-expanded','false');};
    menu?.addEventListener('click',()=>{const open=appRoot.classList.toggle('drawer-open');menu.setAttribute('aria-expanded',String(open));});
    document.getElementById('chat-app-drawer-close')?.addEventListener('click',closeDrawer);
    document.getElementById('chat-app-drawer-backdrop')?.addEventListener('click',closeDrawer);
    drawer?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeDrawer));
    document.getElementById('chat-app-search-top')?.addEventListener('click',()=>{
      const input=document.getElementById('chatpro-search')||document.getElementById('chat-search');
      input?.focus();input?.select?.();
    });
    if(appRoot.dataset.chatSection==='Blogs & announcements'){
      document.querySelectorAll('[data-chat-subpage]').forEach(button=>button.addEventListener('click',()=>{
        chatFeedFilter=button.dataset.chatSubpage||'latest';
        render();
      }));
      document.getElementById('chat-feed-create')?.addEventListener('click',openCommunityPostSheet);
      return;
    }

    const root=document.querySelector('.chat-page'); if(!root)return;
    const kind=root.dataset.chatKind;
    const value=chatState();
    document.querySelectorAll('[data-chat-open]').forEach(btn=>btn.addEventListener('click',()=>{
      value.selected[kind]=btn.dataset.chatOpen; saveChatState(value); setHash(chatThreadRoute(kind,btn.dataset.chatOpen));
    }));
    document.getElementById('chat-search')?.addEventListener('input',e=>{
      const query=e.target.value.trim().toLowerCase();
      document.querySelectorAll('.chat-conversation').forEach(row=>{row.hidden=query&&!row.textContent.toLowerCase().includes(query);});
    });
    document.getElementById('chat-new')?.addEventListener('click',()=>openNewConversationSheet(kind));
    const selectedId=root.dataset.chatSelected||value.selected[kind]||'';
    const selected=value.conversations.find(c=>c.id===selectedId&&c.kind===kind)||null;
    if(mediaRecorder&&mediaRecorder.state==='recording'&&recordingConversationId&&selected?.id!==recordingConversationId) cancelVoiceRecording();
    if(!selected)return;
    value.selected[kind]=selected.id;
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
    const close=()=>{root.innerHTML='';};document.getElementById('chat-new-close').onclick=close;document.getElementById('chat-new-overlay').onclick=e=>{if(e.target.id==='chat-new-overlay')close();};document.getElementById('chat-new-form').onsubmit=e=>{e.preventDefault();const name=document.getElementById('chat-new-name').value.trim();if(!name)return;const value=chatState();const id=uid(kind);const display=kind==='unknown'?`Unknown #${Math.floor(1000+Math.random()*9000)}`:name;value.conversations.unshift({id,kind,name:display,topic:kind==='unknown'?name:'',avatar:kind==='group'?'◎':kind==='unknown'?'?':name[0].toUpperCase(),status:kind==='group'?'1 member · you':kind==='unknown'?'anonymous relay':'new chat',messages:[]});value.selected[kind]=id;saveChatState(value);close();setHash(chatThreadRoute(kind,id));};
  }
  window.DafatiiStudyRooms = Object.freeze({
    view: parts => studyRoomsView(parts),
    bind: () => bindStudyRooms()
  });
  window.DafatiiChatShell = Object.freeze({
    render: (section,body,options={}) => chatAppShell(section,body,options),
    feed: () => chatFeedView(),
    threadRoute: (kind,id='') => chatThreadRoute(kind,id),
    sectionForKind: kind => chatSectionForKind(kind),
    sections: [...CHAT_SUBNAV],
    subpages: section => chatSubpages(section),
    icon: (name,extra='') => chatIcon(name,extra)
  });

})();
