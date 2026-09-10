(() => {
  const ROOM_KEY = 'dafatii:studyRoomState:v1';
  const WORKSPACE_KEY = 'dafatii:studyRoomWorkspace:v1';
  const MAX_MATERIAL_BYTES = 900 * 1024;
  const DEFAULT_FOCUS_SECONDS = 50 * 60;
  const STUDY_SUBNAV = ['Public study rooms','Private study rooms','My study rooms'];
  const ROOM_SEEDS = [
    {id:'room-physics-dawn',name:'Physics Dawn Club',subject:'Physics',visibility:'public',description:'Quiet 50/10 focus cycles for mechanics, electromagnetism and problem sets.',vibe:'Deep focus',members:128,online:17,capacity:40,streak:19,accent:'⚛'},
    {id:'room-calculus-lab',name:'Calculus Problem Lab',subject:'Mathematics',visibility:'public',description:'Work through derivatives, integrals and proofs together. Ask only after attempting.',vibe:'Collaborative',members:214,online:29,capacity:50,streak:34,accent:'∫'},
    {id:'room-night-owls',name:'Night Owls Library',subject:'Mixed subjects',visibility:'public',description:'Late-night accountability room with ambient rain, muted chat and progress check-ins.',vibe:'Cozy',members:391,online:46,capacity:60,streak:51,accent:'☾'},
    {id:'room-med-sprint',name:'Med School Sprint',subject:'Biology',visibility:'private',pin:'2468',description:'Fast recall rounds for anatomy, physiology and pharmacology. PIN required.',vibe:'High energy',members:93,online:12,capacity:24,streak:27,accent:'🧬'},
    {id:'room-ielts-circle',name:'IELTS Speaking Circle',subject:'English',visibility:'private',pin:'1188',description:'Timed speaking prompts, peer feedback and vocabulary drills in small groups.',vibe:'Social',members:76,online:9,capacity:16,streak:14,accent:'Aa'},
    {id:'room-secret-launch',name:'Project Launch Room',subject:'Engineering',visibility:'secret',code:'LAUNCH24',description:'Invite-only project sprint room.',vibe:'Build mode',members:18,online:6,capacity:20,streak:8,accent:'⌘'}
  ];

  const now = () => Date.now();
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const esc = value => escapeHtml(value ?? '');
  let roomTimerInterval = null;

  function read(key,fallback){ return window.DafatiiData.readJSON(key,fallback); }
  function write(key,value){ return window.DafatiiData.writeJSON(key,value); }
  function safeWrite(key,value){
    try { write(key,value); return true; }
    catch { showToast('Browser storage is full. Remove a material and try again.'); return false; }
  }
  function roomState(){
    const value=read(ROOM_KEY,{});
    return {
      customRooms:Array.isArray(value.customRooms)?value.customRooms:[],
      applied:Array.isArray(value.applied)?value.applied:[],
      verified:Array.isArray(value.verified)?value.verified:[],
      active:value.active&&typeof value.active==='object'?value.active:null
    };
  }
  function saveRoomState(value){ return safeWrite(ROOM_KEY,value); }
  function allRooms(){ return [...ROOM_SEEDS,...roomState().customRooms]; }
  function findRoom(id){ return allRooms().find(room=>room.id===id); }

  function workspaceState(){
    const value=read(WORKSPACE_KEY,{});
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  }
  function defaultRoomWorkspace(room){
    return {
      notes:'',
      selectedTab:'chat',
      materials:[],
      messages:[
        {id:uid('room-msg'),mine:false,sender:'Room host',text:`Welcome to ${room.name}. Share what you are working on and keep each other moving.`,at:now()},
        {id:uid('room-msg'),mine:false,sender:'Focus bot',text:'Set one concrete goal for this focus block before you start.',at:now()+1}
      ],
      timer:{duration:DEFAULT_FOCUS_SECONDS,remaining:DEFAULT_FOCUS_SECONDS,running:false,endsAt:null}
    };
  }
  function getRoomWorkspace(room){
    const all=workspaceState();
    const existing=all[room.id];
    if(!existing) return defaultRoomWorkspace(room);
    const timer=existing.timer&&typeof existing.timer==='object'?existing.timer:{};
    return {
      notes:String(existing.notes||''),
      selectedTab:['chat','notes','materials'].includes(existing.selectedTab)?existing.selectedTab:'chat',
      materials:Array.isArray(existing.materials)?existing.materials:[],
      messages:Array.isArray(existing.messages)?existing.messages:[],
      timer:{
        duration:Math.max(60,Number(timer.duration)||DEFAULT_FOCUS_SECONDS),
        remaining:Math.max(0,Number(timer.remaining ?? timer.duration)||DEFAULT_FOCUS_SECONDS),
        running:Boolean(timer.running),
        endsAt:timer.endsAt?Number(timer.endsAt):null
      }
    };
  }
  function saveRoomWorkspace(roomId,value){
    const all=workspaceState(); all[roomId]=value; return safeWrite(WORKSPACE_KEY,all);
  }
  function currentRemaining(timer){
    if(!timer.running||!timer.endsAt) return Math.max(0,Math.ceil(Number(timer.remaining)||0));
    return Math.max(0,Math.ceil((timer.endsAt-now())/1000));
  }
  function normalizeTimer(workspace){
    const remaining=currentRemaining(workspace.timer);
    if(workspace.timer.running&&remaining<=0){
      workspace.timer={...workspace.timer,remaining:0,running:false,endsAt:null};
      return true;
    }
    if(!workspace.timer.running) workspace.timer.remaining=remaining;
    return false;
  }
  function formatDuration(seconds){
    const total=Math.max(0,Math.floor(seconds));
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function formatTime(at){
    try { return new Date(at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
    catch { return ''; }
  }

  const previousSubnav = subnav;
  subnav = function(main,sub,subject,subjectTab){
    if(main==='study-rooms'&&String(sub||'').toLowerCase().startsWith('room/')){
      return STUDY_SUBNAV.map(label=>`<button class="sub-link ${label==='My study rooms'?'active':''}" data-sub="${encodeURIComponent(label)}">${label}</button>`).join('');
    }
    return previousSubnav(main,sub,subject,subjectTab);
  };

  const previousWorkspaceContent = workspaceContent;
  workspaceContent = function(page,parts,title){
    if(page==='study-rooms'&&parts[1]==='room') return roomWorkspaceView(decodeURIComponent(parts[2]||''));
    return previousWorkspaceContent(page,parts,title);
  };

  const previousWorkspace = workspace;
  workspace = function(current){
    if(roomTimerInterval){ clearInterval(roomTimerInterval); roomTimerInterval=null; }
    previousWorkspace(current);
    const parts=current.split('/');
    if(parts[0]==='study-rooms'&&parts[1]==='room') bindRoomWorkspace(decodeURIComponent(parts[2]||''));
  };

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-room-join]');
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    enterRoom(button.dataset.roomJoin);
  },true);

  document.addEventListener('submit',event=>{
    if(event.target?.id!=='sr-secret-form') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const code=document.getElementById('sr-secret-code')?.value.trim().toUpperCase()||'';
    const room=allRooms().find(item=>item.visibility==='secret'&&String(item.code||'').toUpperCase()===code);
    if(!room){ showToast('Joining code not found'); return; }
    const value=roomState();
    if(!value.applied.includes(room.id)) value.applied.push(room.id);
    value.active={roomId:room.id,startedAt:now()};
    saveRoomState(value);
    document.getElementById('overlay-root').innerHTML='';
    startInitialTimer(room);
    setHash(`study-rooms/room/${encodeURIComponent(room.id)}`);
  },true);

  function enterRoom(id){
    const room=findRoom(id); if(!room)return;
    const proceed=()=>{
      const value=roomState();
      value.active={roomId:id,startedAt:now()};
      saveRoomState(value);
      startInitialTimer(room);
      setHash(`study-rooms/room/${encodeURIComponent(id)}`);
    };
    if(room.visibility!=='private'||room.owner==='me'||roomState().verified.includes(id)){ proceed(); return; }
    openJoinPinSheet(room,proceed);
  }

  function startInitialTimer(room){
    const workspace=getRoomWorkspace(room);
    const remaining=currentRemaining(workspace.timer);
    if(!workspace.timer.running){
      workspace.timer.remaining=remaining>0?remaining:workspace.timer.duration;
      workspace.timer.running=true;
      workspace.timer.endsAt=now()+workspace.timer.remaining*1000;
      saveRoomWorkspace(room.id,workspace);
    }
  }

  function openJoinPinSheet(room,onSuccess){
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="room-workspace-pin-overlay"><section class="entity-sheet sr-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Private study room</div><h2>Enter room PIN</h2></div><button class="icon-btn" id="room-workspace-pin-close">×</button></div><form id="room-workspace-pin-form"><div class="sr-sheet-room"><span>${esc(room.accent||'◎')}</span><div><strong>${esc(room.name)}</strong><small>${esc(room.subject)}</small></div></div><div class="field"><label>PIN</label><input id="room-workspace-pin" inputmode="numeric" maxlength="12" autocomplete="one-time-code" required placeholder="Enter PIN"></div><button class="btn btn-primary entity-submit" type="submit">Join room</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('room-workspace-pin-close').onclick=close;
    document.getElementById('room-workspace-pin-overlay').onclick=e=>{if(e.target.id==='room-workspace-pin-overlay')close();};
    document.getElementById('room-workspace-pin-form').onsubmit=e=>{
      e.preventDefault();
      if(document.getElementById('room-workspace-pin').value.trim()!==String(room.pin||'')){showToast('Incorrect PIN');return;}
      const value=roomState(); if(!value.verified.includes(room.id))value.verified.push(room.id); saveRoomState(value); close(); onSuccess();
    };
    setTimeout(()=>document.getElementById('room-workspace-pin')?.focus(),30);
  }

  function roomWorkspaceView(roomId){
    const room=findRoom(roomId);
    if(!room) return `<section class="sr-room-workspace sr-room-missing"><div>◎</div><h1>Study room not found</h1><button class="btn btn-primary" data-room-back>Back to My study rooms</button></section>`;
    const stateValue=roomState();
    if(stateValue.active?.roomId!==room.id){
      return `<section class="sr-room-workspace sr-room-missing"><div>${esc(room.accent||'◎')}</div><h1>${esc(room.name)}</h1><p>Join this room from Study Rooms before opening its workspace.</p><button class="btn btn-primary" data-room-back>Back to My study rooms</button></section>`;
    }
    const workspace=getRoomWorkspace(room);
    const completed=normalizeTimer(workspace);
    if(completed) saveRoomWorkspace(room.id,workspace);
    const remaining=currentRemaining(workspace.timer);
    const duration=Math.max(1,workspace.timer.duration);
    const progress=Math.max(0,Math.min(1,remaining/duration));
    const sessionElapsed=Math.max(0,Math.floor((now()-Number(stateValue.active.startedAt||now()))/60000));
    return `<section class="sr-room-workspace" data-room-workspace="${esc(room.id)}">
      <div class="srw-head">
        <button class="btn btn-ghost" id="srw-back">← My study rooms</button>
        <div class="srw-room-title"><span class="srw-room-icon">${esc(room.accent||'◎')}</span><div><div class="eyebrow">Live study room</div><h1>${esc(room.name)}</h1><p>${esc(room.subject)} · ${esc(room.vibe||'Focus')} · ${room.online||1} online</p></div></div>
        <button class="btn btn-ghost srw-leave" id="srw-leave">Leave room</button>
      </div>
      <div class="srw-layout">
        <aside class="srw-focus-card">
          <div class="srw-live-pill"><i></i> SESSION ACTIVE</div>
          <div class="srw-timer-ring" id="srw-timer-ring" style="--timer-progress:${progress*360}deg"><div><strong id="srw-timer-value">${formatDuration(remaining)}</strong><span>focus remaining</span></div></div>
          <div class="srw-timer-actions"><button class="btn btn-primary" id="srw-timer-toggle">${workspace.timer.running?'Pause':'Start'}</button><button class="btn btn-ghost" id="srw-timer-reset">Reset</button></div>
          <label class="srw-duration-label">Reset timer to<select id="srw-duration-select"><option value="1500" ${duration===1500?'selected':''}>25 minutes</option><option value="2700" ${duration===2700?'selected':''}>45 minutes</option><option value="3000" ${duration===3000?'selected':''}>50 minutes</option><option value="3600" ${duration===3600?'selected':''}>60 minutes</option><option value="5400" ${duration===5400?'selected':''}>90 minutes</option><option value="7200" ${duration===7200?'selected':''}>120 minutes</option></select></label>
          <div class="srw-session-stats"><div><strong>${sessionElapsed}m</strong><span>in room</span></div><div><strong>${room.streak||0}d</strong><span>room streak</span></div><div><strong>${room.members||1}</strong><span>members</span></div></div>
          <div class="srw-focus-tip"><span>✦</span><div><strong>Current focus</strong><p>Pick one outcome for this block. Keep chat lightweight until the timer ends.</p></div></div>
        </aside>
        <div class="srw-content-card">
          <div class="srw-tabs"><button class="${workspace.selectedTab==='chat'?'active':''}" data-srw-tab="chat">Chat <span>${workspace.messages.length}</span></button><button class="${workspace.selectedTab==='notes'?'active':''}" data-srw-tab="notes">Notes</button><button class="${workspace.selectedTab==='materials'?'active':''}" data-srw-tab="materials">Materials <span>${workspace.materials.length}</span></button></div>
          <div class="srw-panel">${workspace.selectedTab==='notes'?roomNotesView(workspace):workspace.selectedTab==='materials'?roomMaterialsView(workspace):roomChatView(workspace)}</div>
        </div>
      </div>
    </section>`;
  }

  function roomChatView(workspace){
    return `<div class="srw-chat"><div class="srw-chat-messages" id="srw-chat-messages">${workspace.messages.map(message=>`<div class="srw-chat-row ${message.mine?'mine':''}"><div class="srw-chat-avatar">${message.mine?'Y':esc((message.sender||'S')[0])}</div><div class="srw-chat-copy"><div><strong>${esc(message.mine?'You':message.sender||'Student')}</strong><time>${esc(formatTime(message.at))}</time></div><p>${esc(message.text)}</p></div></div>`).join('')}</div><div class="srw-chat-quick"><button data-srw-quick="My goal this block: ">🎯 Share goal</button><button data-srw-quick="Done with my focus block ✅">✅ Done</button><button data-srw-quick="Can someone explain this part? ">🙋 Ask room</button></div><div class="srw-chat-compose"><textarea id="srw-chat-input" rows="1" maxlength="1600" placeholder="Message the room…"></textarea><button id="srw-chat-send" aria-label="Send room message">➤</button></div></div>`;
  }

  function roomNotesView(workspace){
    return `<div class="srw-notes"><div class="srw-panel-head"><div><h2>Room notes</h2><p>Your private notes for this room. Saved automatically on this device.</p></div><span id="srw-notes-status">Saved</span></div><textarea id="srw-notes-input" maxlength="20000" placeholder="Write formulas, questions, links, key ideas, or your next action…">${esc(workspace.notes)}</textarea><div class="srw-note-prompts"><button data-note-prompt="Goal for this session:\n">＋ Session goal</button><button data-note-prompt="Questions to revisit:\n- ">＋ Questions</button><button data-note-prompt="Key takeaways:\n- ">＋ Takeaways</button></div></div>`;
  }

  function roomMaterialsView(workspace){
    return `<div class="srw-materials"><div class="srw-panel-head"><div><h2>Room materials</h2><p>Keep useful links and small study files attached to this room.</p></div><div class="srw-material-actions"><button class="btn btn-ghost" id="srw-upload-material">⇧ Upload</button><button class="btn btn-primary" id="srw-add-link">＋ Add link</button><input type="file" id="srw-material-file" accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" hidden></div></div>${workspace.materials.length?`<div class="srw-material-grid">${workspace.materials.map(material=>materialCard(material)).join('')}</div>`:`<div class="srw-material-empty"><div>◇</div><h3>No materials yet</h3><p>Add a useful link or upload a small file for this room.</p></div>`}</div>`;
  }

  function materialCard(material){
    const isFile=material.kind==='file';
    const icon=isFile?(material.mime?.startsWith('image/')?'▧':'▤'):'↗';
    const href=isFile?material.data:material.url;
    return `<article class="srw-material"><div class="srw-material-icon">${icon}</div><div class="srw-material-copy"><strong>${esc(material.title||material.name||'Material')}</strong><small>${esc(isFile?(material.name||'Uploaded file'):(material.url||''))}</small></div><div class="srw-material-buttons"><a class="btn btn-ghost" href="${esc(href)}" ${isFile?`download="${esc(material.name||'material')}"`:'target="_blank" rel="noopener noreferrer"'}>${isFile?'Download':'Open'}</a><button class="btn btn-ghost" data-material-delete="${esc(material.id)}">×</button></div></article>`;
  }

  function bindRoomWorkspace(roomId){
    const room=findRoom(roomId);
    document.querySelector('[data-room-back]')?.addEventListener('click',()=>setHash(`study-rooms/${encodeURIComponent('My study rooms')}`));
    if(!room||!document.querySelector('[data-room-workspace]')) return;
    let workspace=getRoomWorkspace(room);
    normalizeTimer(workspace);

    document.getElementById('srw-back').onclick=()=>setHash(`study-rooms/${encodeURIComponent('My study rooms')}`);
    document.getElementById('srw-leave').onclick=()=>leaveRoom(room,workspace);
    document.querySelectorAll('[data-srw-tab]').forEach(button=>button.onclick=()=>{
      workspace.selectedTab=button.dataset.srwTab; saveRoomWorkspace(room.id,workspace); render();
    });

    bindRoomTimer(room,workspace);
    if(workspace.selectedTab==='chat') bindRoomChat(room,workspace);
    if(workspace.selectedTab==='notes') bindRoomNotes(room,workspace);
    if(workspace.selectedTab==='materials') bindRoomMaterials(room,workspace);
  }

  function bindRoomTimer(room,workspace){
    const display=document.getElementById('srw-timer-value');
    const ring=document.getElementById('srw-timer-ring');
    const toggle=document.getElementById('srw-timer-toggle');
    const reset=document.getElementById('srw-timer-reset');
    const select=document.getElementById('srw-duration-select');
    let completedNotice=false;
    const paint=()=>{
      const remaining=currentRemaining(workspace.timer);
      const duration=Math.max(1,workspace.timer.duration);
      if(display)display.textContent=formatDuration(remaining);
      if(ring)ring.style.setProperty('--timer-progress',`${Math.max(0,Math.min(1,remaining/duration))*360}deg`);
      if(remaining<=0&&workspace.timer.running){
        workspace.timer.remaining=0; workspace.timer.running=false; workspace.timer.endsAt=null; saveRoomWorkspace(room.id,workspace);
        if(toggle)toggle.textContent='Start';
        if(!completedNotice){completedNotice=true;showToast('Focus block complete');}
      }
    };
    toggle.onclick=()=>{
      const remaining=currentRemaining(workspace.timer);
      if(workspace.timer.running){
        workspace.timer.remaining=remaining; workspace.timer.running=false; workspace.timer.endsAt=null; toggle.textContent='Start';
      }else{
        workspace.timer.remaining=remaining>0?remaining:workspace.timer.duration; workspace.timer.running=true; workspace.timer.endsAt=now()+workspace.timer.remaining*1000; toggle.textContent='Pause'; completedNotice=false;
      }
      saveRoomWorkspace(room.id,workspace); paint();
    };
    reset.onclick=()=>{
      const seconds=Math.max(60,Number(select.value)||DEFAULT_FOCUS_SECONDS);
      workspace.timer={duration:seconds,remaining:seconds,running:false,endsAt:null};
      saveRoomWorkspace(room.id,workspace); toggle.textContent='Start'; completedNotice=false; paint();
    };
    paint(); roomTimerInterval=setInterval(paint,1000);
  }

  function leaveRoom(room,workspace){
    if(workspace.timer.running){workspace.timer.remaining=currentRemaining(workspace.timer);workspace.timer.running=false;workspace.timer.endsAt=null;saveRoomWorkspace(room.id,workspace);}
    const value=roomState(); if(value.active?.roomId===room.id)value.active=null; saveRoomState(value); setHash(`study-rooms/${encodeURIComponent('My study rooms')}`);
  }

  function bindRoomChat(room,workspace){
    const input=document.getElementById('srw-chat-input');
    const send=()=>{
      const text=input.value.trim(); if(!text)return;
      workspace.messages.push({id:uid('room-msg'),mine:true,sender:'You',text,at:now()});
      if(saveRoomWorkspace(room.id,workspace))render(); else workspace.messages.pop();
    };
    document.getElementById('srw-chat-send').onclick=send;
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send();}});
    input.addEventListener('input',()=>{input.style.height='auto';input.style.height=`${Math.min(120,input.scrollHeight)}px`;});
    document.querySelectorAll('[data-srw-quick]').forEach(button=>button.onclick=()=>{input.value=button.dataset.srwQuick;input.focus();input.setSelectionRange(input.value.length,input.value.length);});
    const messages=document.getElementById('srw-chat-messages'); if(messages)requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight;});
  }

  function bindRoomNotes(room,workspace){
    const input=document.getElementById('srw-notes-input');
    const status=document.getElementById('srw-notes-status');
    let saveDelay=null;
    input.addEventListener('input',()=>{
      workspace.notes=input.value; if(status)status.textContent='Saving…'; clearTimeout(saveDelay);
      saveDelay=setTimeout(()=>{saveRoomWorkspace(room.id,workspace);if(status)status.textContent='Saved';},220);
    });
    document.querySelectorAll('[data-note-prompt]').forEach(button=>button.onclick=()=>{
      const addition=button.dataset.notePrompt; const start=input.selectionStart??input.value.length; input.value=input.value.slice(0,start)+(input.value&&start?`\n\n${addition}`:addition)+input.value.slice(start); input.dispatchEvent(new Event('input')); input.focus(); input.selectionStart=input.selectionEnd=start+addition.length+(input.value&&start?2:0);
    });
  }

  function bindRoomMaterials(room,workspace){
    document.getElementById('srw-add-link').onclick=()=>openMaterialLinkSheet(room,workspace);
    document.getElementById('srw-upload-material').onclick=()=>document.getElementById('srw-material-file').click();
    document.getElementById('srw-material-file').onchange=event=>uploadMaterial(event.target.files?.[0],room,workspace);
    document.querySelectorAll('[data-material-delete]').forEach(button=>button.onclick=()=>{
      const material=workspace.materials.find(item=>item.id===button.dataset.materialDelete); if(!material)return;
      if(!confirm(`Remove ${material.title||material.name||'this material'} from the room?`))return;
      workspace.materials=workspace.materials.filter(item=>item.id!==material.id); saveRoomWorkspace(room.id,workspace); render();
    });
  }

  function openMaterialLinkSheet(room,workspace){
    const root=document.getElementById('overlay-root'); if(!root)return;
    root.innerHTML=`<div class="entity-sheet-overlay" id="srw-material-overlay"><section class="entity-sheet sr-sheet"><div class="entity-sheet-handle"></div><div class="entity-sheet-head"><div><div class="eyebrow">Room materials</div><h2>Add a link</h2></div><button class="icon-btn" id="srw-material-close">×</button></div><form id="srw-material-form"><div class="field"><label>Title</label><input id="srw-material-title" maxlength="100" required placeholder="e.g. Chapter 4 summary"></div><div class="field"><label>URL</label><input id="srw-material-url" type="url" required placeholder="https://…"></div><button class="btn btn-primary entity-submit">Add material</button></form></section></div>`;
    const close=()=>{root.innerHTML='';};
    document.getElementById('srw-material-close').onclick=close;
    document.getElementById('srw-material-overlay').onclick=e=>{if(e.target.id==='srw-material-overlay')close();};
    document.getElementById('srw-material-form').onsubmit=e=>{
      e.preventDefault(); const title=document.getElementById('srw-material-title').value.trim(); const url=document.getElementById('srw-material-url').value.trim();
      if(!title||!/^https?:\/\//i.test(url)){showToast('Enter a valid http(s) link');return;}
      workspace.materials.unshift({id:uid('material'),kind:'link',title,url,addedAt:now()});
      if(saveRoomWorkspace(room.id,workspace)){close();render();}else workspace.materials.shift();
    };
  }

  async function uploadMaterial(file,room,workspace){
    if(!file)return;
    if(file.size>MAX_MATERIAL_BYTES){showToast('Material is too large for browser-only storage (max 900 KB)');return;}
    try{
      const data=await fileToDataUrl(file); const material={id:uid('material'),kind:'file',title:file.name,name:file.name,mime:file.type||'application/octet-stream',data,addedAt:now()}; workspace.materials.unshift(material);
      if(saveRoomWorkspace(room.id,workspace))render(); else workspace.materials.shift();
    }catch{showToast('Could not read that file');}
  }
  function fileToDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});}
})();
