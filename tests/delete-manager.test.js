const fs=require('node:fs');
const assert=require('node:assert/strict');

const js=fs.readFileSync('delete-manager.js','utf8');
const css=fs.readFileSync('delete-manager.css','utf8');

assert.ok(js.includes("window.DafatiiDeleteManager = Object.freeze"), 'replacement delete manager must expose a stable API');
assert.ok(js.includes("function activate()") && js.includes("function deactivate()") && js.includes("function deleteSelected()"), 'delete lifecycle must be explicit and self-contained');
assert.ok(js.includes("root?.classList.add('dm-page-locked')"), 'activating delete mode must lock the underlying page');
assert.ok(css.includes('.dm-page-locked{') && css.includes('pointer-events:none!important'), 'locked page content must be unable to receive taps or open items');
assert.ok(js.includes("hitbox.className = 'dm-hitbox'") && js.includes("document.body.appendChild(root)"), 'selection hitboxes must live in a body-level overlay, not inside clickable cards');
assert.ok(css.includes('.dm-root{') && css.includes('z-index:10000') && css.includes('.dm-hitbox{') && css.includes('z-index:10001'), 'selection UI must sit above page/card stacking contexts');
assert.ok(js.includes("data-dm-exit") && js.includes("data-dm-delete") && js.includes("data-dm-cancel") && js.includes("data-dm-all"), 'delete mode must expose Exit, Delete, Cancel, and Select all');
assert.ok(js.includes("if (state.selected.has(entry.key)) state.selected.delete(entry.key)") && js.includes("else state.selected.add(entry.key)"), 'item taps must only toggle selection state');
assert.ok(js.includes("getBoundingClientRect()") && js.includes("positionHitbox(entry,hitbox)"), 'overlay hitboxes must follow the visible item geometry');
assert.ok(js.includes("document.addEventListener('scroll', scheduleUpdate, true)") && js.includes("window.visualViewport?.addEventListener('resize', scheduleUpdate)"), 'hitboxes must stay aligned during scroll and mobile viewport changes');
assert.ok(js.includes("state.observer.observe(document.body,{childList:true,subtree:true})"), 'delete mode must survive page rerenders and rebind to live items');
assert.ok(js.includes("findLiveControl(entry)") && js.includes("control.click()"), 'Delete must execute the live underlying delete endpoint for each selected item');
assert.ok(js.includes("window.dispatchEvent(new CustomEvent('dafatii:delete-mode'"), 'delete manager must notify the page-control shell when it activates/deactivates');
assert.ok(!js.includes('dcc-delete-hitbox') && !js.includes('dcc-delete-portal'), 'replacement delete manager must not depend on the retired delete implementation');

console.log('replacement delete manager tests passed');
