(() => {
  'use strict';

  if (window.__dafatiiContentControlsV2) return;
  window.__dafatiiContentControlsV2 = true;

  const state = {
    sheetOpen: false,
    editMode: false,
    syncQueued: false,
    actions: { add: [], edit: [], delete: [] },
    editItems: new Map(),
    languageAuthoring: '',
    languageSelection: null,
    languageSelectedItem: '',
    languageExamSelection: null,
    languageSelectedExam: ''
  };

  const routeName = () => {
    try { if (typeof route === 'function') return String(route() || ''); } catch {}
    return decodeURIComponent(String(location.hash || '').replace(/^#/, ''));
  };
  const isChat = () => /^chat(?:\/|$)/i.test(routeName());
  const isAdmin = () => {
    const actor = window.DafatiiCourses?.actor || window.DafatiiAuth?.user;
    return actor?.platformRole === 'admin';
  };
  const workspace = () => document.querySelector('.workspace,.quiet-workspace');
  const scope = () => document.querySelector('.workspace-main') || document.querySelector('.quiet-main') || workspace();

  const UI_EXCLUDE = [
    '#overlay-root','.entity-sheet-overlay','.dcc-shell','.dcc-trigger','.dcc-edit-exit','.dcc-edit-hint',
    '.dm-root','.main-nav','.settings-nav','.sub-nav','.sidebar','.bottom-nav','.quiet-toolbar',
    '.quiet-sidebar','.quiet-desktop-tabs','.chat-app-page','.chatpro-page'
  ].join(',');
  const excluded = el => Boolean(el?.closest?.(UI_EXCLUDE));

  const ENTITY_OWNER_SELECTOR = [
    '[data-lecture-id]','[data-subject-id]','[data-note-id]','[data-resource-id]',
    '[data-assignment-id]','[data-deadline-id]','[data-room-id]','[data-planner-entry-id]',
    '[data-material-id]','[data-course-id]','[data-student-id]','[data-teacher-id]',
    '.cal-head-button','.cal-cell','article','tr','li'
  ].join(',');

  function explicitTokens(el) {
    const parts = [el.id || '', el.className || ''];
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('data-')) parts.push(attr.name, attr.value || '');
    }
    return parts.join(' ').toLowerCase();
  }

  function readableLabel(el) {
    const raw = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '';
    return String(raw).replace(/[+＋⌃^×⋮↗⇧⇩✎]/g,' ').replace(/\s+/g,' ').trim().slice(0,100);
  }

  function kindOf(el) {
    if (!el || excluded(el) || el.disabled) return '';
    const explicit = explicitTokens(el);
    const label = readableLabel(el).toLowerCase();

    if (/(^|[-_\s])(delete|remove|archive)([-_\s]|$)/.test(explicit)) return 'delete';
    if (/(^|[-_\s])edit([-_\s]|$)/.test(explicit)) return 'edit';
    if (/(^|[-_\s])(add|create|new|upload|import)([-_\s]|$)/.test(explicit)) return 'add';

    if (!el.closest('form')) {
      if (/^(edit|edit\s)/.test(label)) return 'edit';
      if (/^(add|create|new|upload|import)\b/.test(label)) return 'add';
    }
    return '';
  }

  function shouldHide(el,kind) {
    if (excluded(el) || el.matches('input,textarea,select')) return false;
    if (el.closest('form') && kind !== 'delete') return false;
    const explicit = explicitTokens(el);
    if (kind === 'delete') return /(delete|remove|archive)/.test(explicit);
    if (kind === 'edit') return /edit/.test(explicit);
    if (kind === 'add') return /(add|create|new|upload|import)/.test(explicit) || /^(add|create|new|upload|import)\b/i.test(readableLabel(el));
    return false;
  }

  function entityFor(control) {
    const root = scope();
    if (!root || !control) return null;
    const explicit = control.closest?.(ENTITY_OWNER_SELECTOR);
    if (explicit && explicit !== root && root.contains(explicit)) return explicit;

    let node = control.parentElement;
    while (node && node !== root && node !== document.body) {
      const cls = String(node.className || '');
      const entityLike = /(?:^|\s)[^\s]*(?:card|row|item|entry|tile|record)(?:\s|$)/i.test(cls);
      const substructure = /(?:^|[-_\s])(top|head|header|footer|copy|meta|actions?|toolbar|controls?|icon|body|content)(?:$|[-_\s])/i.test(cls);
      if (entityLike && !substructure) return node;
      node = node.parentElement;
    }
    return null;
  }

  function selfEditableItems(root) {
    if (!root) return [];
    return [...root.querySelectorAll('[data-note-id],[data-material-type][data-material-id],[data-deadline-source="custom"]')]
      .filter(el => !excluded(el));
  }

  function collectActions() {
    const root = scope();
    const actions = { add: [], edit: [], delete: [] };
    if (!root) {
      state.actions = actions;
      return actions;
    }

    for (const el of root.querySelectorAll('button,a,label,[role="button"]')) {
      const kind = kindOf(el);
      if (!kind) continue;
      actions[kind].push(el);
      if (shouldHide(el,kind)) el.classList.add('dcc-native-action');
    }
    state.actions = actions;
    return actions;
  }

  function buildEditItems() {
    const map = new Map();
    for (const control of state.actions.edit || []) {
      const item = entityFor(control);
      if (item && !map.has(item)) map.set(item,control);
    }
    for (const item of selfEditableItems(scope())) if (!map.has(item)) map.set(item,null);
    return map;
  }

  function uniqueAddActions() {
    const route = routeName().toLowerCase();
    const actions = state.actions.add || [];

    if (route.startsWith('calendar/schedule')) {
      const control=actions.find(candidate=>candidate.dataset?.plannerAddType);
      if(!control)return [];
      const type=String(control.dataset.plannerAddType||'schedule');
      const labels={tasks:'Task',todos:'To-do',goals:'Goal',schedule:'Schedule item'};
      return [{control,label:labels[type]||'Item',type}];
    }

    const contextual = control => control.matches?.('.planner-cell-add,.planner-inline-add,.cal-add-axis,[data-planner-cell-add],[data-add-axis]');
    const seen = new Set(), result = [];
    for (const control of actions) {
      if (contextual(control)) continue;
      const label = readableLabel(control) || 'Add';
      const normalized = label.replace(/\b(at|for)\s+\d{1,2}:\d{2}\s*(am|pm)?\b/ig,'').replace(/\s+/g,' ').trim();
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ control, label:normalized || 'Add' });
    }
    return result;
  }

  function ensureTrigger() {
    let button = document.querySelector('.dcc-trigger');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'dcc-trigger';
      button.innerHTML = '<span class="dcc-trigger-glow" aria-hidden="true"></span><span class="dcc-trigger-icon" aria-hidden="true">⌃</span><span class="dcc-trigger-copy"><strong>Manage</strong><small>Content</small></span>';
      button.setAttribute('aria-label','Open page content controls');
      button.setAttribute('aria-expanded','false');
      button.addEventListener('click',() => state.sheetOpen ? closeSheet() : openSheet());
      document.body.appendChild(button);
    }
    return button;
  }

  function ensureEditUi() {
    let exit = document.querySelector('.dcc-edit-exit');
    if (!exit) {
      exit = document.createElement('button');
      exit.type = 'button';
      exit.className = 'dcc-edit-exit';
      exit.innerHTML = '<span aria-hidden="true">×</span><strong>Exit edit</strong>';
      exit.addEventListener('click',exitEdit);
      document.body.appendChild(exit);
    }

    let hint = document.querySelector('.dcc-edit-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'dcc-edit-hint';
      hint.innerHTML = '<span>✎</span><div><strong>Edit mode</strong><small>Tap a highlighted item to open its edit form.</small></div>';
      document.body.appendChild(hint);
    }
    return { exit,hint };
  }

  function clearEditMarks() {
    document.querySelectorAll('.dcc-editable').forEach(item => item.classList.remove('dcc-editable'));
  }

  function refreshEdit() {
    clearEditMarks();
    if (!state.editMode) return;
    collectActions();
    state.editItems = buildEditItems();
    for (const item of state.editItems.keys()) if (item?.isConnected) item.classList.add('dcc-editable');
    const { exit,hint } = ensureEditUi();
    exit.hidden = false;
    hint.hidden = false;
  }

  function beginEdit() {
    collectActions();
    const items = buildEditItems();
    if (!items.size) {
      if (state.actions.edit.length === 1) {
        closeSheet();
        state.actions.edit[0].click();
        return;
      }
      toast('There are no editable items on this page.');
      return;
    }
    closeSheet();
    state.editMode = true;
    state.editItems = items;
    document.body.dataset.contentControlMode = 'edit';
    refreshEdit();
    sync();
  }

  function exitEdit() {
    state.editMode = false;
    state.editItems.clear();
    delete document.body.dataset.contentControlMode;
    clearEditMarks();
    document.querySelector('.dcc-edit-exit')?.setAttribute('hidden','');
    document.querySelector('.dcc-edit-hint')?.setAttribute('hidden','');
    sync();
  }

  function onEditClick(event) {
    if (!state.editMode) return;
    if (event.target.closest(UI_EXCLUDE)) return;
    const item = event.target.closest('.dcc-editable');
    if (!item) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const control = state.editItems.get(item);
    if (control?.isConnected) control.click();
    else item.click();
  }


  const languageApi = () => window.DafatiiCourseModes?.languageAuthoring || null;
  const isLanguageCourse = () => Boolean(window.DafatiiCourseModes?.isLanguage?.());
  const isLanguageRoute = () => /^language-(?:home|letters|voice|grammar|review|examine)(?:\/|$)/i.test(routeName());

  function sheetFrame(title,subtitle,body,note=''){
    return '<button class="dcc-sheet-backdrop" type="button" aria-label="Close content controls"></button>'+
      '<section class="dcc-sheet dcc-language-sheet" role="dialog" aria-modal="true" aria-label="'+escapeHtml(title)+'">'+
      '<div class="dcc-sheet-handle" aria-hidden="true"></div>'+
      '<header><div><small>'+escapeHtml(subtitle)+'</small><h2>'+escapeHtml(title)+'</h2></div><button type="button" class="dcc-close" aria-label="Close">×</button></header>'+
      body+(note?'<div class="dcc-sheet-note">'+escapeHtml(note)+'</div>':'')+'</section>';
  }
  function mountSheet(html){
    closeSheet();
    const shell=document.createElement('div');
    shell.className='dcc-shell';
    shell.innerHTML=html;
    document.body.appendChild(shell);
    state.sheetOpen=true;
    ensureTrigger().setAttribute('aria-expanded','true');
    shell.querySelector('.dcc-sheet-backdrop')?.addEventListener('click',closeSheet);
    shell.querySelector('.dcc-close')?.addEventListener('click',closeSheet);
    return shell;
  }
  function openLanguageRootSheet(){
    const body='<div class="dcc-sheet-actions dcc-language-root-actions">'+
      '<button type="button" class="primary" data-dcc-language-root="content"><span class="dcc-action-icon">▦</span><span class="dcc-action-copy"><strong>Control the content</strong><small>Select level, step, box and page, then manage its individual items</small></span><b>›</b></button>'+
      '<button type="button" data-dcc-language-root="exam"><span class="dcc-action-icon">✓</span><span class="dcc-action-copy"><strong>Control the exam</strong><small>Select the assessment location and manage its questions</small></span><b>›</b></button>'+
    '</div>';
    const shell=mountSheet(sheetFrame('English course controls','Language authoring',body,'Home is intentionally excluded from lesson-content editing.'));
    shell.querySelector('[data-dcc-language-root="content"]')?.addEventListener('click',openLanguageContentSelector);
    shell.querySelector('[data-dcc-language-root="exam"]')?.addEventListener('click',openLanguageExamSelector);
  }
  function levelOptions(selected=0){
    return ['A1','A2','B1','B2','C1'].map((level,index)=>'<option value="'+index+'" '+(index===selected?'selected':'')+'>'+level+'</option>').join('');
  }
  function stepOptions(selected=1){
    return [1,2,3,4,5].map(step=>'<option value="'+step+'" '+(step===selected?'selected':'')+'>Step '+step+'</option>').join('');
  }
  function boxOptions(li,selected=1){
    const count=window.DafatiiCourseModes?.boxCount?.(li)||(li===0?26:25);
    return Array.from({length:count},(_,index)=>index+1).map(box=>'<option value="'+box+'" '+(box===selected?'selected':'')+'>Box '+box+'</option>').join('');
  }
  function pageOptions(li,selected='letters'){
    const api=languageApi();
    return ['letters','voice','grammar','review','examine'].map(page=>'<option value="'+page+'" '+(page===selected?'selected':'')+'>'+escapeHtml(api?.pageName?.(page,li)||page)+'</option>').join('');
  }
  function selectorGrid(mode,selection){
    const content=mode==='content';
    return '<div class="dcc-language-selector">'+
      '<label><span>1. Select the level</span><select data-dcc-language-select="level">'+levelOptions(selection.li)+'</select></label>'+
      '<label><span>2. Select the step</span><select data-dcc-language-select="step">'+stepOptions(selection.step)+'</select></label>'+
      '<label><span>3. Select the box</span><select data-dcc-language-select="box">'+boxOptions(selection.li,selection.box)+'</select></label>'+
      (content?'<label><span>4. Select the page</span><select data-dcc-language-select="page">'+pageOptions(selection.li,selection.page)+'</select></label>':'')+
    '</div><button type="button" class="dcc-language-open-target" data-dcc-language-open="'+mode+'">'+(content?'Open selected page':'Open selected exam')+'</button>';
  }
  function readSelector(shell,mode){
    return {
      li:Number(shell.querySelector('[data-dcc-language-select="level"]')?.value||0),
      step:Number(shell.querySelector('[data-dcc-language-select="step"]')?.value||1),
      box:Number(shell.querySelector('[data-dcc-language-select="box"]')?.value||1),
      page:mode==='content'?String(shell.querySelector('[data-dcc-language-select="page"]')?.value||'letters'):''
    };
  }
  function bindSelectorRefresh(shell,mode){
    const level=()=>shell.querySelector('[data-dcc-language-select="level"]');
    level()?.addEventListener('change',()=>{
      const li=Number(level().value||0);
      const box=shell.querySelector('[data-dcc-language-select="box"]');
      if(box)box.innerHTML=boxOptions(li,1);
      const page=shell.querySelector('[data-dcc-language-select="page"]');
      if(page)page.innerHTML=pageOptions(li,page.value||'letters');
    });
    shell.querySelector('[data-dcc-language-open="'+mode+'"]')?.addEventListener('click',()=>{
      const selection=readSelector(shell,mode);
      if(mode==='content'){
        languageApi()?.begin?.(selection);
        closeSheet();
        activateLanguageContentBar(selection);
      }else{
        state.languageExamSelection=selection;
        openLanguageExamManager(selection);
      }
    });
  }
  function openLanguageContentSelector(){
    const previous=state.languageSelection||{li:0,step:1,box:1,page:'letters'};
    const shell=mountSheet(sheetFrame('Control the content','English course',selectorGrid('content',previous),'After opening the page, tap an item box to select it. The four item controls remain available while selection mode is active.'));
    bindSelectorRefresh(shell,'content');
  }
  function openLanguageExamSelector(){
    const previous=state.languageExamSelection||{li:0,step:1,box:1};
    const shell=mountSheet(sheetFrame('Control the exam','English course',selectorGrid('exam',previous),'The selected location resolves automatically to its box, step, level or whole-language assessment.'));
    bindSelectorRefresh(shell,'exam');
  }
  function removeLanguageBar(){
    document.querySelector('.dcc-language-control-bar')?.remove();
    document.querySelectorAll('.dcc-language-item-selected').forEach(node=>node.classList.remove('dcc-language-item-selected'));
  }
  function refreshLanguageSelectedItem(){
    document.querySelectorAll('.dcc-language-item-selected').forEach(node=>node.classList.remove('dcc-language-item-selected'));
    if(!state.languageSelectedItem)return;
    const item=[...document.querySelectorAll('[data-language-content-item]')].find(node=>node.dataset.languageContentItem===state.languageSelectedItem);
    item?.classList.add('dcc-language-item-selected');
  }
  function activateLanguageContentBar(selection){
    state.languageAuthoring='content';
    state.languageSelection={...selection};
    state.languageSelectedItem='';
    removeLanguageBar();
    const bar=document.createElement('div');
    bar.className='dcc-language-control-bar';
    bar.innerHTML='<div class="dcc-language-control-copy"><small>Selection mode</small><strong>'+escapeHtml(['A1','A2','B1','B2','C1'][selection.li])+' · Step '+selection.step+' · Box '+selection.box+' · '+escapeHtml(languageApi()?.pageName?.(selection.page,selection.li)||selection.page)+'</strong><span data-dcc-language-selection-status>Tap an item box to select it</span></div>'+
      '<div class="dcc-language-control-actions">'+
        '<button type="button" data-dcc-language-item-action="edit" disabled>✎ <span>Edit item</span></button>'+
        '<button type="button" data-dcc-language-item-action="delete" disabled>⌫ <span>Delete item</span></button>'+
        '<button type="button" data-dcc-language-item-action="empty">∅ <span>Empty the page</span></button>'+
        '<button type="button" data-dcc-language-item-action="add">＋ <span>Add item</span></button>'+
      '</div><button type="button" class="dcc-language-control-exit" aria-label="Exit content control">×</button>';
    document.body.appendChild(bar);
    bar.querySelector('[data-dcc-language-item-action="edit"]').addEventListener('click',()=>openSelectedLanguageItemForm());
    bar.querySelector('[data-dcc-language-item-action="delete"]').addEventListener('click',deleteSelectedLanguageItem);
    bar.querySelector('[data-dcc-language-item-action="empty"]').addEventListener('click',emptySelectedLanguagePage);
    bar.querySelector('[data-dcc-language-item-action="add"]').addEventListener('click',openLanguageItemTypeChooser);
    bar.querySelector('.dcc-language-control-exit').addEventListener('click',exitLanguageAuthoring);
    sync();
  }
  function setLanguageSelectedItem(id){
    state.languageSelectedItem=id||'';
    refreshLanguageSelectedItem();
    const bar=document.querySelector('.dcc-language-control-bar');
    if(!bar)return;
    const item=languageApi()?.getItems?.(state.languageSelection)?.find(candidate=>candidate.id===state.languageSelectedItem);
    bar.querySelectorAll('[data-dcc-language-item-action="edit"],[data-dcc-language-item-action="delete"]').forEach(button=>button.disabled=!item);
    const status=bar.querySelector('[data-dcc-language-selection-status]');
    if(status)status.textContent=item?(item.title||item.eyebrow||item.type||'Selected item'):'Tap an item box to select it';
  }
  function onLanguageItemClick(event){
    if(state.languageAuthoring!=='content')return;
    const item=event.target.closest?.('[data-language-content-item]');
    if(!item)return;
    if(event.target.closest('button,input,textarea,select,a'))return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    setLanguageSelectedItem(item.dataset.languageContentItem);
  }
  function languageFieldMarkup(field,value){
    const safe=value==null?'':value;
    if(field.kind==='textarea')return '<label><span>'+escapeHtml(field.label)+'</span><textarea name="'+escapeHtml(field.name)+'" rows="5">'+escapeHtml(safe)+'</textarea></label>';
    if(field.kind==='lines'){
      const text=Array.isArray(safe)?safe.join('\n'):String(safe||'');
      return '<label><span>'+escapeHtml(field.label)+'</span><textarea name="'+escapeHtml(field.name)+'" rows="6">'+escapeHtml(text)+'</textarea></label>';
    }
    if(field.kind==='select')return '<label><span>'+escapeHtml(field.label)+'</span><select name="'+escapeHtml(field.name)+'">'+(field.options||[]).map(option=>'<option '+(String(option)===String(safe)?'selected':'')+'>'+escapeHtml(option)+'</option>').join('')+'</select></label>';
    return '<label><span>'+escapeHtml(field.label)+'</span><input name="'+escapeHtml(field.name)+'" value="'+escapeHtml(safe)+'"></label>';
  }
  function openLanguageItemTypeChooser(){
    const api=languageApi(),selection=state.languageSelection;if(!api||!selection)return;
    const schemas=api.getSchemas(selection.page,selection.li)||[];
    const body='<div class="dcc-sheet-actions">'+schemas.map((schema,index)=>'<button type="button" data-dcc-language-item-type="'+index+'"><span class="dcc-action-icon">＋</span><span class="dcc-action-copy"><strong>'+escapeHtml(schema.label)+'</strong><small>Add this item design to the selected page</small></span><b>›</b></button>').join('')+'</div>';
    const shell=mountSheet(sheetFrame('Add item','Content control',body,'Every item has its own filled fields and remains independently editable or deletable.'));
    shell.querySelectorAll('[data-dcc-language-item-type]').forEach(button=>button.addEventListener('click',()=>{
      const schema=schemas[Number(button.dataset.dccLanguageItemType)];if(!schema)return;
      const item=api.createItem(selection,schema.type);
      openLanguageItemForm(selection,item,true);
    }));
  }
  function openSelectedLanguageItemForm(){
    const api=languageApi(),selection=state.languageSelection;if(!api||!selection||!state.languageSelectedItem)return;
    const item=api.getItems(selection).find(candidate=>candidate.id===state.languageSelectedItem);if(!item)return;
    openLanguageItemForm(selection,item,false);
  }
  function openLanguageItemForm(selection,item,isNew){
    const api=languageApi(),schemas=api?.getSchemas(selection.page,selection.li)||[],schema=schemas.find(entry=>entry.type===item.type)||schemas[0];
    if(!schema)return;
    const fields=schema.fields.map(field=>languageFieldMarkup(field,item[field.name])).join('');
    const body='<form class="dcc-language-item-form"><div class="dcc-language-form-type">'+escapeHtml(schema.label)+'</div>'+fields+'<button class="dcc-language-form-save" type="submit">'+(isNew?'Add item':'Save item')+'</button></form>';
    const shell=mountSheet(sheetFrame(isNew?'Add item':'Edit item',['A1','A2','B1','B2','C1'][selection.li]+' · Step '+selection.step+' · Box '+selection.box,body,'Page: '+api.pageName(selection.page,selection.li)));
    shell.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();
      const data=new FormData(event.currentTarget),next={...item};
      schema.fields.forEach(field=>{
        const value=String(data.get(field.name)||'');
        next[field.name]=field.kind==='lines'?value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean):value;
      });
      api.saveItem(selection,next);
      state.languageSelectedItem=next.id;
      closeSheet();api.begin(selection);setTimeout(()=>{refreshLanguageSelectedItem();setLanguageSelectedItem(next.id);},0);
    });
  }
  function deleteSelectedLanguageItem(){
    const api=languageApi(),selection=state.languageSelection,id=state.languageSelectedItem;if(!api||!selection||!id)return;
    if(!window.confirm('Delete the selected item from this page?'))return;
    api.deleteItem(selection,id);state.languageSelectedItem='';api.begin(selection);setTimeout(()=>setLanguageSelectedItem(''),0);
  }
  function emptySelectedLanguagePage(){
    const api=languageApi(),selection=state.languageSelection;if(!api||!selection)return;
    if(!window.confirm('Remove all items from this selected page?'))return;
    api.emptyPage(selection);state.languageSelectedItem='';api.begin(selection);setTimeout(()=>setLanguageSelectedItem(''),0);
  }
  function exitLanguageAuthoring(){
    languageApi()?.end?.();
    state.languageAuthoring='';state.languageSelection=null;state.languageSelectedItem='';
    removeLanguageBar();sync();
  }

  function examQuestionMarkup(question,index,selected){
    return '<button type="button" class="dcc-exam-question-card '+(selected?'selected':'')+'" data-dcc-exam-question="'+escapeHtml(question.id||('q-'+index))+'"><small>Question '+(index+1)+'</small><strong>'+escapeHtml(question.prompt||'Untitled question')+'</strong><span>Correct: '+escapeHtml(question.correct||'')+'</span></button>';
  }
  function openLanguageExamManager(selection){
    const api=languageApi();if(!api)return;
    state.languageExamSelection={...selection};
    const ctx=api.examContext(selection),questions=api.getExamQuestions(selection);
    const selected=questions.some(q=>q.id===state.languageSelectedExam)?state.languageSelectedExam:'';
    state.languageSelectedExam=selected;
    const body='<div class="dcc-exam-context"><span>'+escapeHtml(ctx.scope.toUpperCase())+'</span><strong>'+escapeHtml(['A1','A2','B1','B2','C1'][selection.li])+' · Step '+selection.step+' · Box '+selection.box+'</strong></div>'+
      '<div class="dcc-exam-question-list">'+(questions.length?questions.map((q,i)=>examQuestionMarkup(q,i,q.id===selected)).join(''):'<div class="dcc-language-empty">This exam has no questions.</div>')+'</div>'+
      '<div class="dcc-language-exam-actions">'+
        '<button type="button" data-dcc-exam-action="edit" '+(selected?'':'disabled')+'>Edit question</button>'+
        '<button type="button" data-dcc-exam-action="delete" '+(selected?'':'disabled')+'>Delete question</button>'+
        '<button type="button" data-dcc-exam-action="empty">Empty exam</button>'+
        '<button type="button" data-dcc-exam-action="add">Add question</button>'+
      '</div>';
    const shell=mountSheet(sheetFrame('Control the exam','English course',body,'Changes apply to the assessment resolved from this level, step and box.'));
    shell.querySelectorAll('[data-dcc-exam-question]').forEach(button=>button.addEventListener('click',()=>{state.languageSelectedExam=button.dataset.dccExamQuestion;openLanguageExamManager(selection);}));
    shell.querySelector('[data-dcc-exam-action="edit"]')?.addEventListener('click',()=>openExamQuestionForm(false));
    shell.querySelector('[data-dcc-exam-action="delete"]')?.addEventListener('click',()=>{
      if(!state.languageSelectedExam||!window.confirm('Delete this exam question?'))return;
      api.deleteExamQuestion(selection,state.languageSelectedExam);state.languageSelectedExam='';openLanguageExamManager(selection);
    });
    shell.querySelector('[data-dcc-exam-action="empty"]')?.addEventListener('click',()=>{
      if(!window.confirm('Remove every question from this exam?'))return;
      api.emptyExamQuestions(selection);state.languageSelectedExam='';openLanguageExamManager(selection);
    });
    shell.querySelector('[data-dcc-exam-action="add"]')?.addEventListener('click',()=>openExamQuestionForm(true));
  }
  function openExamQuestionForm(isNew){
    const api=languageApi(),selection=state.languageExamSelection;if(!api||!selection)return;
    const existing=isNew?null:api.getExamQuestions(selection).find(q=>q.id===state.languageSelectedExam);
    if(!isNew&&!existing)return;
    const question=existing||{id:'',prompt:'',correct:'',options:['','','','']};
    const body='<form class="dcc-language-item-form dcc-exam-item-form">'+
      '<label><span>Question</span><textarea name="prompt" rows="4">'+escapeHtml(question.prompt||'')+'</textarea></label>'+
      '<label><span>Correct answer</span><textarea name="correct" rows="2">'+escapeHtml(question.correct||'')+'</textarea></label>'+
      '<label><span>Answer options · one per line</span><textarea name="options" rows="7">'+escapeHtml((question.options||[]).join('\n'))+'</textarea></label>'+
      '<button class="dcc-language-form-save" type="submit">'+(isNew?'Add question':'Save question')+'</button></form>';
    const shell=mountSheet(sheetFrame(isNew?'Add exam question':'Edit exam question','Exam control',body,'Include the correct answer among the answer options.'));
    shell.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();
      const data=new FormData(event.currentTarget),correct=String(data.get('correct')||'').trim();
      let options=String(data.get('options')||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
      if(correct&&!options.includes(correct))options.unshift(correct);
      const saved={...question,prompt:String(data.get('prompt')||'').trim(),correct,options};
      api.saveExamQuestion(selection,saved);state.languageSelectedExam=saved.id||state.languageSelectedExam;openLanguageExamManager(selection);
    });
  }

  function openSheet() {
    if (!eligible()) return;
    if (isLanguageCourse() && isLanguageRoute()) {
      openLanguageRootSheet();
      return;
    }
    closeSheet();
    collectActions();
    const editCount = buildEditItems().size;
    const addCount = uniqueAddActions().length;
    const deleteCount = state.actions.delete.length;

    const shell = document.createElement('div');
    shell.className = 'dcc-shell';
    shell.innerHTML = `
      <button class="dcc-sheet-backdrop" type="button" aria-label="Close content controls"></button>
      <section class="dcc-sheet" role="dialog" aria-modal="true" aria-label="Content controls">
        <div class="dcc-sheet-handle" aria-hidden="true"></div>
        <header><div><small>Page controls</small><h2>Content controls</h2></div><button type="button" class="dcc-close" aria-label="Close">×</button></header>
        <div class="dcc-sheet-actions">
          <button type="button" class="danger" data-dcc-action="delete" ${deleteCount?'':'disabled'}><span class="dcc-action-icon">⌫</span><span class="dcc-action-copy"><strong>Delete</strong><small>Select items without opening them</small></span><b>›</b></button>
          <button type="button" data-dcc-action="edit" ${editCount?'':'disabled'}><span class="dcc-action-icon">✎</span><span class="dcc-action-copy"><strong>Edit</strong><small>Tap an item to open its form</small></span><b>›</b></button>
          <button type="button" class="primary" data-dcc-action="add" ${addCount?'':'disabled'}><span class="dcc-action-icon">＋</span><span class="dcc-action-copy"><strong>Add</strong><small>Open the page add form</small></span><b>›</b></button>
        </div>
        <div class="dcc-sheet-note">One control surface for this page. Inline CRUD controls stay hidden.</div>
      </section>`;

    document.body.appendChild(shell);
    state.sheetOpen = true;
    ensureTrigger().setAttribute('aria-expanded','true');

    shell.querySelector('.dcc-sheet-backdrop').addEventListener('click',closeSheet);
    shell.querySelector('.dcc-close').addEventListener('click',closeSheet);
    shell.querySelector('[data-dcc-action="edit"]')?.addEventListener('click',beginEdit);
    shell.querySelector('[data-dcc-action="add"]')?.addEventListener('click',beginAdd);
    shell.querySelector('[data-dcc-action="delete"]')?.addEventListener('click',() => {
      closeSheet();
      exitEdit();
      const ok = window.DafatiiDeleteManager?.activate?.();
      if (!ok) toast('There are no deletable items on this page.');
      sync();
    });
  }

  function closeSheet() {
    document.querySelector('.dcc-shell')?.remove();
    state.sheetOpen = false;
    document.querySelector('.dcc-trigger')?.setAttribute('aria-expanded','false');
  }

  function beginAdd() {
    collectActions();
    const adds = uniqueAddActions();
    if (!adds.length) {
      toast('There is nothing to add on this page.');
      return;
    }
    if (adds.length === 1) {
      const control = adds[0].control;
      closeSheet();
      control.click();
      return;
    }

    const sheet = document.querySelector('.dcc-sheet');
    if (!sheet) return;
    const actions = sheet.querySelector('.dcc-sheet-actions');
    const typeIcons={tasks:'✓',todos:'☑',goals:'◇',schedule:'◷'};
    actions.innerHTML = adds.slice(0,6).map((entry,index) =>
      `<button type="button" class="dcc-add-choice" data-dcc-add-index="${index}"><span class="dcc-action-icon">${escapeHtml(typeIcons[entry.type]||'＋')}</span><span class="dcc-action-copy"><strong>${escapeHtml(entry.label)}</strong><small>${entry.type?'Create '+escapeHtml(entry.label.toLowerCase()):'Open form'}</small></span><b>›</b></button>`
    ).join('');
    const scheduleChooser=routeName().toLowerCase().startsWith('calendar/schedule');
    sheet.querySelector('header h2').textContent = scheduleChooser ? 'Add to this section' : 'Choose what to add';
    sheet.querySelector('.dcc-sheet-note').textContent = scheduleChooser ? 'The active planner section controls which form opens.' : 'Choose one add form for this page.';
    actions.querySelectorAll('[data-dcc-add-index]').forEach(button => button.addEventListener('click',() => {
      const entry = adds[Number(button.dataset.dccAddIndex)];
      if (!entry) return;
      closeSheet();
      entry.control.click();
    }));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g,ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function toast(message) {
    try { if (typeof showToast === 'function') showToast(message); } catch {}
  }

  function eligible() {
    return Boolean(isAdmin() && workspace() && scope() && !isChat());
  }

  function sync() {
    state.syncQueued = false;
    const trigger = ensureTrigger();
    const deleteActive = Boolean(window.DafatiiDeleteManager?.isActive?.());
    if (!eligible()) {
      trigger.hidden = true;
      closeSheet();
      if (state.editMode) exitEdit();
      return;
    }
    trigger.hidden = deleteActive || state.editMode || state.languageAuthoring==='content';
    collectActions();
    if (state.editMode) refreshEdit();
    if(state.languageAuthoring==='content')refreshLanguageSelectedItem();
  }

  function scheduleSync() {
    if (state.syncQueued) return;
    state.syncQueued = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener('click',onLanguageItemClick,true);
  document.addEventListener('click',onEditClick,true);
  window.addEventListener('hashchange',() => {
    closeSheet();
    exitEdit();
    if(state.languageAuthoring==='content'&&state.languageSelection){
      const expected={letters:'language-letters',voice:'language-voice',grammar:'language-grammar',review:'language-review',examine:'language-examine'}[state.languageSelection.page];
      if(routeName().split('/')[0]!==expected)exitLanguageAuthoring();
    }
    scheduleSync();
  });
  window.addEventListener('dafatii:delete-mode',scheduleSync);
  window.addEventListener('dafatii:auth:changed',scheduleSync);
  window.addEventListener('dafatii:coursesloaded',scheduleSync);
  window.addEventListener('dafatii:coursechanged',scheduleSync);
  window.addEventListener('DOMContentLoaded',scheduleSync,{once:true});

  const observer = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes,...record.removedNodes].some(node => node.nodeType === 1))) scheduleSync();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.DafatiiContentControls = Object.freeze({
    refresh:scheduleSync,
    exit:exitEdit,
    open:openSheet
  });
})();