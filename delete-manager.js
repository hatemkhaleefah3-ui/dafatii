(() => {
  'use strict';

  if (window.DafatiiDeleteManager) return;

  const state = {
    active: false,
    busy: false,
    selected: new Set(),
    entries: new Map(),
    hitboxes: new Map(),
    syncQueued: false,
    observer: null
  };

  const IDENTITY_ATTRS = [
    'data-lecture-id','data-subject-id','data-note-id','data-resource-id','data-assignment-id',
    'data-deadline-id','data-room-id','data-planner-entry-id','data-material-id','data-course-id',
    'data-student-id','data-teacher-id','data-content-id','data-entry','data-id'
  ];

  const ENTITY_SELECTOR = [
    ...IDENTITY_ATTRS.map(name => `[${name}]`),
    '.cal-head-button','.cal-cell','article','tr','li'
  ].join(',');

  const scope = () => document.querySelector('.workspace-main') || document.querySelector('.quiet-main') || document.querySelector('.workspace,.quiet-workspace');
  const excluded = el => Boolean(el.closest(
    '.dm-root,.dcc-shell,.dcc-trigger,.dcc-mode-exit,.dcc-mode-hint,.dcc-selection-bar,' +
    '#overlay-root,.entity-sheet-overlay,.main-nav,.bottom-nav,.quiet-toolbar,.quiet-sidebar,.quiet-desktop-tabs,' +
    '.chat-app-page,.chatpro-page'
  ));

  function deleteAction(el) {
    if (!el || excluded(el) || el.disabled) return null;
    for (const attr of [...el.attributes]) {
      if (!attr.name.startsWith('data-')) continue;
      if (!/(delete|remove|archive)/i.test(attr.name)) continue;
      return { name: attr.name, value: attr.value || '' };
    }
    const id = String(el.id || '');
    const cls = String(el.className || '');
    if (/(delete|remove|archive)/i.test(id)) return { name: 'id', value: id };
    if (/(delete|remove|archive)/i.test(cls) && el.matches('button,a,[role="button"]')) {
      return { name: 'class', value: cls };
    }
    return null;
  }

  function entityFor(control) {
    const root = scope();
    if (!root || !control) return null;
    const explicit = control.closest?.(ENTITY_SELECTOR);
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

  function identityFor(item) {
    if (!item) return '';
    for (const name of IDENTITY_ATTRS) {
      const value = item.getAttribute?.(name);
      if (value) return `${name}=${value}`;
    }
    return '';
  }

  function selectorFor(action) {
    if (!action) return '';
    if (action.name === 'id') return `#${window.CSS?.escape ? CSS.escape(action.value) : action.value.replace(/([^a-zA-Z0-9_-])/g,'\\$1')}`;
    if (action.name === 'class') return '';
    const value = String(action.value).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
    return `[${action.name}="${value}"]`;
  }

  function entryKey(action, item) {
    return `${action.name}=${action.value}|${identityFor(item)}`;
  }

  function discover() {
    const root = scope();
    const map = new Map();
    if (!root) return map;

    for (const control of root.querySelectorAll('button,a,[role="button"],label')) {
      const action = deleteAction(control);
      if (!action) continue;
      const item = entityFor(control);
      if (!item || item === root || excluded(item)) continue;
      const key = entryKey(action,item);
      if (map.has(key)) continue;
      map.set(key,{
        key,
        item,
        action,
        selector: selectorFor(action),
        label: item.getAttribute('aria-label') || item.querySelector('h1,h2,h3,strong')?.textContent?.trim() || 'item'
      });
    }
    return map;
  }

  function ensureRoot() {
    let root = document.querySelector('.dm-root');
    if (root) return root;
    root = document.createElement('div');
    root.className = 'dm-root';
    root.innerHTML = `
      <div class="dm-status" role="status" aria-live="polite">
        <span class="dm-status-icon">⌫</span>
        <div><strong>Delete mode</strong><small>Tap items to select them. Items cannot open in this mode.</small></div>
      </div>
      <div class="dm-toolbar" role="toolbar" aria-label="Delete controls">
        <button type="button" data-dm-exit><span>×</span><strong>Exit</strong></button>
        <button type="button" class="danger" data-dm-delete disabled><span>⌫</span><strong>Delete</strong><b>0</b></button>
        <button type="button" data-dm-cancel><span>↶</span><strong>Cancel</strong></button>
        <button type="button" data-dm-all><span>✓</span><strong>Select all</strong></button>
      </div>`;
    document.body.appendChild(root);

    root.querySelector('[data-dm-exit]').addEventListener('click', deactivate);
    root.querySelector('[data-dm-cancel]').addEventListener('click', () => {
      if (state.busy) return;
      state.selected.clear();
      update();
    });
    root.querySelector('[data-dm-all]').addEventListener('click', () => {
      if (state.busy) return;
      state.selected = new Set(state.entries.keys());
      update();
    });
    root.querySelector('[data-dm-delete]').addEventListener('click', deleteSelected);
    return root;
  }

  function ensureHitbox(entry) {
    const root = ensureRoot();
    let hitbox = state.hitboxes.get(entry.key);
    if (!hitbox) {
      hitbox = document.createElement('button');
      hitbox.type = 'button';
      hitbox.className = 'dm-hitbox';
      hitbox.dataset.dmKey = entry.key;
      hitbox.innerHTML = '<span class="dm-check">✓</span>';
      hitbox.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (!state.active || state.busy) return;
        if (state.selected.has(entry.key)) state.selected.delete(entry.key);
        else state.selected.add(entry.key);
        update();
      });
      hitbox.addEventListener('pointerdown', event => {
        event.stopPropagation();
        event.stopImmediatePropagation();
      });
      hitbox.addEventListener('pointerup', event => {
        event.stopPropagation();
        event.stopImmediatePropagation();
      });
      root.appendChild(hitbox);
      state.hitboxes.set(entry.key,hitbox);
    }
    hitbox.setAttribute('aria-label', state.selected.has(entry.key) ? `Deselect ${entry.label}` : `Select ${entry.label} for deletion`);
    hitbox.setAttribute('aria-pressed', state.selected.has(entry.key) ? 'true' : 'false');
    return hitbox;
  }

  function positionHitbox(entry,hitbox) {
    if (!entry.item?.isConnected) {
      hitbox.hidden = true;
      return;
    }
    const rect = entry.item.getBoundingClientRect();
    const vw = window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth;
    const vh = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
    const left = Math.max(0,rect.left), top = Math.max(0,rect.top);
    const right = Math.min(vw,rect.right), bottom = Math.min(vh,rect.bottom);
    const width = Math.max(0,right-left), height = Math.max(0,bottom-top);
    hitbox.hidden = width < 4 || height < 4 || bottom <= 0 || right <= 0 || left >= vw || top >= vh;
    if (hitbox.hidden) return;
    hitbox.style.left = `${Math.round(left)}px`;
    hitbox.style.top = `${Math.round(top)}px`;
    hitbox.style.width = `${Math.round(width)}px`;
    hitbox.style.height = `${Math.round(height)}px`;
    hitbox.style.borderRadius = getComputedStyle(entry.item).borderRadius || '18px';
  }

  function lockPage() {
    const root = scope();
    document.querySelectorAll('.dm-page-locked').forEach(el => {
      if (el !== root) el.classList.remove('dm-page-locked');
    });
    root?.classList.add('dm-page-locked');
    document.body.dataset.deleteManager = 'active';
  }

  function unlockPage() {
    document.querySelectorAll('.dm-page-locked').forEach(el => el.classList.remove('dm-page-locked'));
    delete document.body.dataset.deleteManager;
  }

  function update() {
    if (!state.active) return;
    lockPage();

    const fresh = discover();
    const oldSelected = new Set(state.selected);
    state.entries = fresh;
    state.selected = new Set([...oldSelected].filter(key => fresh.has(key)));

    for (const [key,hitbox] of [...state.hitboxes]) {
      if (!fresh.has(key)) {
        hitbox.remove();
        state.hitboxes.delete(key);
      }
    }

    for (const entry of fresh.values()) {
      const hitbox = ensureHitbox(entry);
      positionHitbox(entry,hitbox);
      hitbox.setAttribute('aria-pressed', state.selected.has(entry.key) ? 'true' : 'false');
    }

    const root = ensureRoot();
    const count = state.selected.size;
    const status = root.querySelector('.dm-status');
    status.querySelector('strong').textContent = count ? `${count} selected` : 'Delete mode';
    status.querySelector('small').textContent = count ? 'Select more items or use an action below.' : 'Tap items to select them. Items cannot open in this mode.';

    const del = root.querySelector('[data-dm-delete]');
    del.disabled = !count || state.busy;
    del.querySelector('b').textContent = String(count);
    root.querySelector('[data-dm-exit]').disabled = state.busy;
    root.querySelector('[data-dm-cancel]').disabled = state.busy;
    root.querySelector('[data-dm-all]').disabled = state.busy || !state.entries.size;
    root.dataset.busy = state.busy ? 'true' : 'false';
  }

  function scheduleUpdate() {
    if (!state.active || state.syncQueued) return;
    state.syncQueued = true;
    requestAnimationFrame(() => {
      state.syncQueued = false;
      update();
    });
  }

  function activate() {
    if (state.active) return true;
    const entries = discover();
    if (!entries.size) return false;

    state.active = true;
    state.busy = false;
    state.entries = entries;
    state.selected.clear();
    ensureRoot();
    lockPage();
    update();

    state.observer?.disconnect();
    state.observer = new MutationObserver(records => {
      if (!state.active) return;
      if (records.some(record => [...record.addedNodes,...record.removedNodes].some(node => node.nodeType === 1))) scheduleUpdate();
    });
    state.observer.observe(document.body,{childList:true,subtree:true});
    window.dispatchEvent(new CustomEvent('dafatii:delete-mode',{detail:{active:true}}));
    return true;
  }

  function deactivate() {
    state.active = false;
    state.busy = false;
    state.selected.clear();
    state.entries.clear();
    state.hitboxes.clear();
    state.observer?.disconnect();
    state.observer = null;
    document.querySelector('.dm-root')?.remove();
    unlockPage();
    window.dispatchEvent(new CustomEvent('dafatii:delete-mode',{detail:{active:false}}));
  }

  function findLiveControl(entry) {
    const root = scope();
    if (!root) return null;
    if (entry.selector) {
      try {
        const exact = root.querySelector(entry.selector);
        if (exact) return exact;
      } catch {}
    }
    for (const control of root.querySelectorAll('button,a,[role="button"],label')) {
      const action = deleteAction(control);
      if (!action) continue;
      if (action.name === entry.action.name && action.value === entry.action.value) return control;
    }
    return null;
  }

  async function deleteSelected() {
    if (!state.active || state.busy || !state.selected.size) return;
    const targets = [...state.selected].map(key => state.entries.get(key)).filter(Boolean);
    if (!targets.length) return;
    if (!window.confirm(`Delete ${targets.length} selected item${targets.length === 1 ? '' : 's'}?`)) return;

    state.busy = true;
    update();
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    let deleted = 0;

    try {
      for (const entry of targets.reverse()) {
        const control = findLiveControl(entry);
        if (!control) continue;
        control.click();
        deleted++;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
    } finally {
      window.confirm = originalConfirm;
      state.busy = false;
    }

    if (deleted) {
      deactivate();
      try { if (typeof showToast === 'function') showToast(`Deleted ${deleted} item${deleted === 1 ? '' : 's'}.`); } catch {}
    } else {
      update();
      try { if (typeof showToast === 'function') showToast('Delete failed. No live delete action was found.'); } catch {}
    }
  }

  document.addEventListener('scroll', scheduleUpdate, true);
  window.addEventListener('resize', scheduleUpdate);
  window.visualViewport?.addEventListener('resize', scheduleUpdate);
  window.visualViewport?.addEventListener('scroll', scheduleUpdate);
  window.addEventListener('hashchange', deactivate);

  window.DafatiiDeleteManager = Object.freeze({
    activate,
    deactivate,
    isActive: () => state.active,
    refresh: scheduleUpdate
  });
})();