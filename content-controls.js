(() => {
  'use strict';

  const state = {
    mode: '',
    selected: new Set(),
    sheetOpen: false,
    synthetic: false,
    syncQueued: false,
    deleting: false,
    itemActions: new Map(),
    actions: { add: [], edit: [], delete: [] }
  };

  const routeName = () => {
    try { if (typeof route === 'function') return String(route() || ''); } catch {}
    return decodeURIComponent(String(location.hash || '').replace(/^#/, ''));
  };
  const isChat = () => /^chat(?:\/|$)/i.test(routeName());
  const workspace = () => document.querySelector('.workspace,.quiet-workspace');
  const scope = () => document.querySelector('.workspace-main') || document.querySelector('.quiet-main') || workspace();
  const excluded = el => Boolean(el.closest(
    '#overlay-root,.entity-sheet-overlay,.dcc-shell,.dcc-trigger,.dcc-mode-exit,.dcc-selection-bar,' +
    '.main-nav,.settings-nav,.sub-nav,.sidebar,.bottom-nav,.quiet-toolbar,.quiet-sidebar,.quiet-desktop-tabs,' +
    '.chat-app-page,.chatpro-page'
  ));

  function explicitTokens(el) {
    const parts = [el.id || '', el.className || ''];
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('data-')) parts.push(attr.name, attr.value || '');
    }
    return parts.join(' ').toLowerCase();
  }

  function readableLabel(el) {
    const raw = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '';
    return String(raw).replace(/[+＋⌃^×⋮↗⇧⇩✎]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
  }

  function kindOf(el) {
    if (!el || excluded(el)) return '';
    if (el.closest('form') && !/(delete|remove|edit|add|create|new|upload|import)/i.test(explicitTokens(el))) return '';
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

  function shouldHide(el, kind) {
    if (excluded(el)) return false;
    if (el.matches('input,textarea,select')) return false;
    if (el.closest('form') && kind !== 'delete') return false;
    const explicit = explicitTokens(el);
    if (kind === 'delete') return /(delete|remove|archive)/.test(explicit);
    if (kind === 'edit') return /edit/.test(explicit);
    if (kind === 'add') return /(add|create|new|upload|import)/.test(explicit) || /^(add|create|new|upload|import)\b/i.test(readableLabel(el));
    return false;
  }

  function isIdentityNode(node) {
    if (!(node instanceof Element)) return false;
    if (node.matches('article,tr,li,.cal-head-button,.cal-cell')) return true;
    if ([...node.attributes].some(attr => /^data-(?!dcc-).*(?:id|key|user|subject|lecture|note|resource|assignment|deadline|material|teacher|student|room|course)$/i.test(attr.name))) return true;
    const cls = String(node.className || '');
    return /(?:^|\s)[^\s]*(?:card|row|item|entry|tile|record)(?:\s|$)/i.test(cls) && !/(actions?|toolbar|controls?)/i.test(cls);
  }

  function itemFor(control) {
    const root = scope();
    if (!root || !control) return null;
    if (control.matches?.('.cal-head-button,.cal-cell')) return control;
    let node = control.parentElement;
    while (node && node !== root && node !== document.body) {
      if (isIdentityNode(node)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function selfEditableItems(root) {
    if (!root) return [];
    return [...root.querySelectorAll(
      '[data-note-id],[data-material-type][data-material-id],[data-deadline-source="custom"]'
    )].filter(el => !excluded(el));
  }

  function collectActions() {
    const root = scope();
    const actions = { add: [], edit: [], delete: [] };
    if (!root) return actions;
    const candidates = root.querySelectorAll('button,a,label,[role="button"]');
    for (const el of candidates) {
      const kind = kindOf(el);
      if (!kind || el.disabled) continue;
      actions[kind].push(el);
      if (shouldHide(el, kind)) el.classList.add('dcc-native-action');
    }
    state.actions = actions;
    return actions;
  }

  function actionItems(kind) {
    const map = new Map();
    for (const control of state.actions[kind] || []) {
      const item = itemFor(control);
      if (item && !map.has(item)) map.set(item, control);
    }
    if (kind === 'edit') {
      for (const item of selfEditableItems(scope())) if (!map.has(item)) map.set(item, null);
    }
    return map;
  }

  function clearItemClasses() {
    document.querySelectorAll('.dcc-selectable,.dcc-selected,.dcc-editable').forEach(el => {
      el.classList.remove('dcc-selectable','dcc-selected','dcc-editable');
      el.removeAttribute('data-dcc-selected');
    });
  }

  function modeItems() {
    if (!state.mode) return new Map();
    return state.itemActions.size ? state.itemActions : actionItems(state.mode);
  }

  function refreshMode() {
    clearItemClasses();
    if (!state.mode) return;
    const items = modeItems();
    for (const item of items.keys()) {
      item.classList.add('dcc-selectable', state.mode === 'edit' ? 'dcc-editable' : '');
      if (state.selected.has(item)) {
        item.classList.add('dcc-selected');
        item.dataset.dccSelected = 'true';
      }
    }
    updateModeUi();
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
      button.addEventListener('click', () => state.sheetOpen ? closeSheet() : openSheet());
      document.body.appendChild(button);
    }
    return button;
  }

  function ensureModeUi() {
    let exit = document.querySelector('.dcc-mode-exit');
    if (!exit) {
      exit = document.createElement('button');
      exit.type = 'button';
      exit.className = 'dcc-mode-exit';
      exit.innerHTML = '<span aria-hidden="true">×</span><strong>Exit</strong>';
      exit.onclick = exitMode;
      document.body.appendChild(exit);
    }

    let hint = document.querySelector('.dcc-mode-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'dcc-mode-hint';
      hint.innerHTML = '<span class="dcc-mode-hint-icon" aria-hidden="true"></span><div><strong></strong><small></small></div>';
      document.body.appendChild(hint);
    }

    let bar = document.querySelector('.dcc-selection-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'dcc-selection-bar';
      bar.innerHTML = '<button type="button" data-dcc-cancel><span>×</span><strong>Cancel</strong></button><button type="button" data-dcc-all><span>✓</span><strong>Select all</strong></button><button type="button" class="danger" data-dcc-delete disabled><span class="dcc-trash">⌫</span><strong>Delete</strong><b>0</b></button>';
      bar.querySelector('[data-dcc-cancel]').onclick = () => { state.selected.clear(); refreshMode(); };
      bar.querySelector('[data-dcc-all]').onclick = () => {
        state.selected = new Set([...state.itemActions.keys()]);
        refreshMode();
      };
      bar.querySelector('[data-dcc-delete]').onclick = deleteSelected;
      document.body.appendChild(bar);
    }
    return { exit, hint, bar };
  }

  function updateModeUi() {
    const { exit, hint, bar } = ensureModeUi();
    const active = Boolean(state.mode);
    exit.hidden = !active;
    hint.hidden = !active;
    bar.hidden = state.mode !== 'delete';
    exit.querySelector('strong').textContent = state.mode === 'edit' ? 'Exit edit' : 'Exit delete';
    hint.dataset.mode = state.mode || '';
    const hintStrong = hint.querySelector('strong');
    const hintSmall = hint.querySelector('small');
    const hintIcon = hint.querySelector('.dcc-mode-hint-icon');
    if (state.mode === 'edit') {
      hintIcon.textContent = '✎';
      hintStrong.textContent = 'Edit mode';
      hintSmall.textContent = 'Tap a highlighted item to open its edit form.';
    } else if (state.mode === 'delete') {
      const count = state.selected.size;
      hintIcon.textContent = '⌫';
      hintStrong.textContent = count ? `${count} selected` : 'Delete mode';
      hintSmall.textContent = count ? 'Select more items or delete the selection.' : 'Tap items to select them safely.';
      const del = bar.querySelector('[data-dcc-delete]');
      del.disabled = count === 0 || state.deleting;
      del.querySelector('b').textContent = String(count);
      bar.querySelector('[data-dcc-all]').disabled = state.itemActions.size === 0 || state.deleting;
      bar.querySelector('[data-dcc-cancel]').disabled = state.deleting;
      bar.dataset.busy = state.deleting ? 'true' : 'false';
    }
  }

  function openSheet() {
    if (!eligible()) return;
    closeSheet();
    state.sheetOpen = true;
    collectActions();
    const shell = document.createElement('div');
    shell.className = 'dcc-shell';
    shell.innerHTML = `
      <button class="dcc-sheet-backdrop" type="button" aria-label="Close content controls"></button>
      <section class="dcc-sheet" role="dialog" aria-modal="true" aria-label="Content controls">
        <div class="dcc-sheet-handle" aria-hidden="true"></div>
        <header><div><small>Page controls</small><h2>Content controls</h2></div><button type="button" class="dcc-close" aria-label="Close">×</button></header>
        <div class="dcc-sheet-actions">
          <button type="button" class="danger" data-dcc-action="delete"><span class="dcc-action-icon">⌫</span><span class="dcc-action-copy"><strong>Delete</strong><small>Select one or many items</small></span><b>›</b></button>
          <button type="button" data-dcc-action="edit"><span class="dcc-action-icon">✎</span><span class="dcc-action-copy"><strong>Edit</strong><small>Choose an item, then open its form</small></span><b>›</b></button>
          <button type="button" class="primary" data-dcc-action="add"><span class="dcc-action-icon">＋</span><span class="dcc-action-copy"><strong>Add</strong><small>Open the page add form</small></span><b>›</b></button>
        </div>
        <div class="dcc-sheet-note"></div>
      </section>`;
    document.body.appendChild(shell);
    ensureTrigger().setAttribute('aria-expanded','true');
    shell.querySelector('.dcc-sheet-backdrop').onclick = closeSheet;
    shell.querySelector('.dcc-close').onclick = closeSheet;
    shell.querySelector('[data-dcc-action="delete"]').onclick = () => beginMode('delete');
    shell.querySelector('[data-dcc-action="edit"]').onclick = () => beginMode('edit');
    shell.querySelector('[data-dcc-action="add"]').onclick = beginAdd;
    updateSheetAvailability(shell);
  }

  function updateSheetAvailability(shell = document.querySelector('.dcc-shell')) {
    if (!shell) return;
    collectActions();
    const deleteCount = actionItems('delete').size;
    const editCount = Math.max(actionItems('edit').size, state.actions.edit.length ? 1 : 0);
    const addCount = uniqueAddActions().length;
    const counts = { delete: deleteCount, edit: editCount, add: addCount };
    for (const kind of ['delete','edit','add']) {
      const button = shell.querySelector(`[data-dcc-action="${kind}"]`);
      if (!button) continue;
      button.disabled = counts[kind] === 0;
      button.dataset.count = String(counts[kind]);
    }
    const note = shell.querySelector('.dcc-sheet-note');
    note.textContent = deleteCount || editCount || addCount
      ? 'Use one control surface for this page. Existing inline content controls are hidden.'
      : 'This page has no editable content actions.';
  }

  function closeSheet() {
    document.querySelector('.dcc-shell')?.remove();
    state.sheetOpen = false;
    document.querySelector('.dcc-trigger')?.setAttribute('aria-expanded','false');
  }

  function beginMode(mode) {
    collectActions();
    closeSheet();
    state.mode = mode;
    state.deleting = false;
    state.selected.clear();
    state.itemActions = actionItems(mode);
    document.body.dataset.contentControlMode = mode;
    if (!state.itemActions.size) {
      if (mode === 'edit' && state.actions.edit.length === 1) {
        withSynthetic(() => state.actions.edit[0].click());
        exitMode();
        return;
      }
      toast(mode === 'delete' ? 'There are no deletable items on this page.' : 'There are no editable items on this page.');
      exitMode();
      return;
    }
    refreshMode();
  }

  function exitMode() {
    state.mode = '';
    state.deleting = false;
    state.selected.clear();
    state.itemActions = new Map();
    delete document.body.dataset.contentControlMode;
    clearItemClasses();
    const exit = document.querySelector('.dcc-mode-exit');
    const hint = document.querySelector('.dcc-mode-hint');
    const bar = document.querySelector('.dcc-selection-bar');
    if (exit) exit.hidden = true;
    if (hint) hint.hidden = true;
    if (bar) bar.hidden = true;
  }

  function withSynthetic(fn) {
    state.synthetic = true;
    try { fn(); } finally { queueMicrotask(() => { state.synthetic = false; }); }
  }

  function primaryControlFor(item, kind) {
    if (state.mode === kind && state.itemActions.has(item)) return state.itemActions.get(item) || null;
    return actionItems(kind).get(item) || null;
  }

  function onCapturedClick(event) {
    if (!state.mode || state.synthetic) return;
    if (event.target.closest('.dcc-shell,.dcc-trigger,.dcc-mode-exit,.dcc-selection-bar,#overlay-root')) return;
    const item = event.target.closest('.dcc-selectable');
    if (!item) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (state.mode === 'delete') {
      if (state.selected.has(item)) state.selected.delete(item);
      else state.selected.add(item);
      refreshMode();
      return;
    }

    if (state.mode === 'edit') {
      const control = primaryControlFor(item,'edit');
      withSynthetic(() => {
        if (control) control.click();
        else item.click();
      });
    }
  }

  function uniqueAddActions() {
    const route = routeName().toLowerCase();
    const actions = state.actions.add || [];

    if (route.startsWith('calendar/schedule')) {
      const canonical = actions.find(control => control.matches?.('.planner-add,[data-planner-add]'));
      return canonical ? [{ control: canonical, label: 'Add schedule item' }] : [];
    }

    const contextual = control => control.matches?.(
      '.planner-cell-add,.planner-inline-add,.cal-add-axis,[data-planner-cell-add],[data-add-axis]'
    );
    const seen = new Set(), result = [];
    for (const control of actions) {
      if (contextual(control)) continue;
      const label = readableLabel(control) || 'Add';
      const normalized = label.replace(/\b(at|for)\s+\d{1,2}:\d{2}\s*(am|pm)?\b/ig,'').replace(/\s+/g,' ').trim();
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ control, label: normalized || 'Add' });
    }
    return result;
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
      withSynthetic(() => control.click());
      return;
    }
    const sheet = document.querySelector('.dcc-sheet');
    if (!sheet) return;
    const actions = sheet.querySelector('.dcc-sheet-actions');
    actions.innerHTML = adds.slice(0, 6).map((entry, index) =>
      `<button type="button" class="dcc-add-choice" data-dcc-add-index="${index}"><span class="dcc-action-icon">＋</span><span class="dcc-action-copy"><strong>${escapeHtml(entry.label)}</strong><small>Open form</small></span><b>›</b></button>`
    ).join('');
    sheet.querySelector('header h2').textContent = 'Choose what to add';
    sheet.querySelector('.dcc-sheet-note').textContent = 'All add methods for this page are centralized here.';
    actions.querySelectorAll('[data-dcc-add-index]').forEach(button => button.onclick = () => {
      const entry = adds[Number(button.dataset.dccAddIndex)];
      if (!entry) return;
      closeSheet();
      withSynthetic(() => entry.control.click());
    });
  }

  function domOrderReverse(a,b) {
    if (a === b) return 0;
    const relation = a.compareDocumentPosition?.(b) || 0;
    if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return 1;
    if (relation & Node.DOCUMENT_POSITION_PRECEDING) return -1;
    return 0;
  }

  function fireControl(control) {
    if (!control) return false;
    try {
      if (typeof control.click === 'function') control.click();
      else control.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
      return true;
    } catch {
      return false;
    }
  }

  async function deleteSelected() {
    if (state.deleting) return;
    const items = [...state.selected].filter(item => state.itemActions.has(item));
    if (!items.length) return;
    const entries = items
      .map(item => ({ item, control: state.itemActions.get(item) }))
      .filter(entry => entry.control)
      .sort((a,b) => domOrderReverse(a.item,b.item));
    if (!entries.length) {
      toast('No delete action is available for the selected items.');
      return;
    }
    if (!confirm(`Delete ${entries.length} selected item${entries.length === 1 ? '' : 's'}?`)) return;

    state.deleting = true;
    updateModeUi();
    const originalConfirm = window.confirm;
    let fired = 0;
    window.confirm = () => true;
    try {
      state.synthetic = true;
      for (const entry of entries) {
        if (fireControl(entry.control)) fired++;
        await Promise.resolve();
      }
    } finally {
      state.synthetic = false;
      window.confirm = originalConfirm;
      state.deleting = false;
    }

    if (!fired) {
      toast('Delete failed. No item action could be executed.');
      updateModeUi();
      return;
    }
    toast(`Deleted ${fired} item${fired === 1 ? '' : 's'}.`);
    exitMode();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function toast(message) {
    if (typeof showToast === 'function') showToast(message);
  }

  function eligible() {
    return Boolean(workspace() && scope() && !isChat());
  }

  function sync() {
    state.syncQueued = false;
    const trigger = ensureTrigger();
    if (!eligible()) {
      trigger.hidden = true;
      closeSheet();
      exitMode();
      return;
    }
    trigger.hidden = false;
    collectActions();
    if (state.sheetOpen) updateSheetAvailability();
    if (state.mode) refreshMode();
  }

  function scheduleSync() {
    if (state.syncQueued) return;
    state.syncQueued = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener('click', onCapturedClick, true);
  window.addEventListener('hashchange', () => { exitMode(); closeSheet(); scheduleSync(); });
  window.addEventListener('DOMContentLoaded', scheduleSync, { once: true });

  const observer = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1))) scheduleSync();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.DafatiiContentControls = Object.freeze({
    refresh: scheduleSync,
    exit: exitMode,
    open: openSheet
  });
})();