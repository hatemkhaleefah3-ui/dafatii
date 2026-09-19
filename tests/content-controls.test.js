const fs=require('node:fs');
const assert=require('node:assert/strict');

const js=fs.readFileSync('content-controls.js','utf8');
const css=fs.readFileSync('content-controls.css','utf8');
const suite=fs.readFileSync('student-suite.js','utf8');
const calendar=fs.readFileSync('calendar.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.ok(js.includes("const isChat = () => /^chat(?:\\/|$)/i.test(routeName())"), 'chat app must be excluded from unified content controls');
assert.ok(js.includes("button.innerHTML = '<span aria-hidden="true">^</span><small>Control</small>'"), 'each eligible page needs the floating up-arrow control button');
assert.ok(js.includes("data-dcc-action="delete"") && js.includes("data-dcc-action="edit"") && js.includes("data-dcc-action="add""), 'control sheet must expose delete, edit, and add');
assert.ok(js.includes("data-dcc-cancel") && js.includes("data-dcc-all") && js.includes("data-dcc-delete"), 'delete mode must expose cancel, select all, and delete controls');
assert.ok(js.includes("exit.textContent = state.mode === 'edit' ? 'Exit edit' : 'Exit'"), 'selection/edit systems need an explicit exit control above the action bar');
assert.ok(js.includes("event.stopImmediatePropagation()") && js.includes("event.target.closest('.dcc-selectable')"), 'mode interactions must own item clicks instead of leaking to page navigation');
assert.ok(js.includes("state.selected = new Set(items)") && js.includes("controls.forEach(control => control.click())"), 'delete mode must support select-all and batch execution');
assert.ok(js.includes("function uniqueAddActions()") && js.includes("Choose what to add"), 'multiple page add methods must be centralized into one add chooser');
assert.ok(js.includes("withSynthetic(() =>") && js.includes("primaryControlFor(item,'edit')"), 'edit mode must route selected items to their existing edit forms');
assert.ok(css.includes('.dcc-native-action{display:none!important}'), 'legacy inline content action buttons must be removed from page surfaces');
assert.ok(css.includes('inset-inline-end:18px') && css.includes('bottom:calc(max(10px,env(safe-area-inset-bottom)) + 78px)'), 'floating control must be direction-aware and above mobile main navigation');
assert.ok(css.includes('.dcc-selection-bar') && css.includes('.dcc-selected'), 'selection mode needs persistent bottom controls and selected-item feedback');
assert.ok(suite.includes('data-content-delete-note') && suite.includes('data-content-delete-resource') && suite.includes('data-content-delete-assignment'), 'suite items without old surface delete buttons must expose hidden delete endpoints to the unified system');
assert.ok(suite.includes('data-content-edit-note'), 'note cards must expose their edit form through unified edit mode');
assert.ok(suite.includes('data-content-delete-deadline'), 'custom deadlines must participate in batch-delete selection');
assert.ok(calendar.includes('data-planner-edit') && calendar.includes("openPlannerEntrySheet('','',button.dataset.plannerEdit)"), 'planner entries must open their edit form from unified edit mode');
assert.ok(calendar.includes('data-calendar-edit-entry') && calendar.includes('data-calendar-delete-entry'), 'schedule and exam timetable cells must expose unified edit/delete endpoints');
assert.ok(calendar.includes('function openTimetableEntrySheet('), 'calendar cell edit mode must open a real edit form instead of deleting on normal click');
assert.ok(index.includes('content-controls.css?v=20260919-1') && index.includes('content-controls.js?v=20260919-1'), 'unified content control assets must load');
assert.ok(index.indexOf('content-controls.js?v=20260919-1') > index.indexOf('admin-console.js?v=20260918-4'), 'content controller must load after feature modules so it can centralize their actions');
assert.ok(index.includes('student-suite.js?v=20260919-3'), 'suite CRUD proxy build must be cache-busted');

console.log('unified content controls tests passed');
