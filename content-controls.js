(() => {
  'use strict';

  if (window.__dafatiiContentControlsV2) return;
  window.__dafatiiContentControlsV2 = true;

  const state = {
    sheetOpen: false,
    editMode: false,
    syncQueued: false,
    actions: { add: [], edit: [], delete: [] },
    editItems: new Map()
  };

  const routeName = () => {
    try { if (typeof route === 'function') return String(route() || ''); } catch {}
    return decodeURIComponent(String(location.hash || '').replace(/^#/, ''));
  };
  const isChat = () => /^chat(?:\/|$)/i.test(routeName());
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

  function openSheet() {
    if (!eligible()) return;
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
    return Boolean(workspace() && scope() && !isChat());
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
    trigger.hidden = deleteActive || state.editMode;
    collectActions();
    if (state.editMode) refreshEdit();
  }

  function scheduleSync() {
    if (state.syncQueued) return;
    state.syncQueued = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener('click',onEditClick,true);
  window.addEventListener('hashchange',() => {
    closeSheet();
    exitEdit();
    scheduleSync();
  });
  window.addEventListener('dafatii:delete-mode',scheduleSync);
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