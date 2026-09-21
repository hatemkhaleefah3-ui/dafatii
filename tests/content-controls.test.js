const fs=require('node:fs');
const assert=require('node:assert/strict');

const js=fs.readFileSync('content-controls.js','utf8');
const css=fs.readFileSync('content-controls.css','utf8');
const suite=fs.readFileSync('student-suite.js','utf8');
const calendar=fs.readFileSync('calendar.js','utf8');
const social=fs.readFileSync('student-social.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.ok(js.includes("const isChat = () => /^chat(?:\\/|$)/i.test(routeName())"), 'chat app must be excluded from unified content controls');
assert.match(js,/const isAdmin = \(\) => \{[\s\S]*platformRole === 'admin'/,'Manage Content access must be determined by the platform admin role');
assert.match(js,/return Boolean\(isAdmin\(\) && workspace\(\) && scope\(\) && !isChat\(\)\)/,'the content-control access button must be admin-only');
assert.ok(js.includes("dcc-trigger-icon") && js.includes(">⌃</span>") && js.includes("<strong>Manage</strong>"), 'eligible pages need the premium Manage Content button');
assert.ok(js.includes('data-dcc-action="delete"') && js.includes('data-dcc-action="edit"') && js.includes('data-dcc-action="add"'), 'content sheet must expose delete, edit, and add');
assert.ok(js.includes("window.DafatiiDeleteManager?.activate?.()"), 'Delete must delegate to the replacement delete manager');
assert.match(js,/data-dcc-language-root="content"/,'language Content Control must offer Control the content');
assert.match(js,/data-dcc-language-root="exam"/,'language Content Control must offer Control the exam');
assert.match(js,/function openLanguageContentSelector\(\)/,'language content selector must exist');
assert.match(js,/language-\(\?:home\|letters\|voice\|grammar\|video\|examine\)/,'language Content Control must recognize the dedicated YouTube route');
assert.match(js,/pages=Array\.isArray\(api\?\.pages\)[\s\S]{0,180}\['letters','voice','grammar','video'\]/,'language lesson-content selector must use only the four pure content lanes');
for (const selector of ['level','step','box','page']) {
  assert.ok(js.includes('data-dcc-language-select="'+selector+'"'),'language content control missing selector '+selector);
}
for (const action of ['edit','delete','empty','add']) {
  assert.ok(js.includes('data-dcc-language-item-action="'+action+'"'),'language item control missing '+action);
}
assert.match(js,/function onLanguageItemClick\(event\)/,'language content selection mode must be item-selective');
assert.match(js,/api\.emptyPage\(selection\)/,'Empty the page must remove all selected page items');
assert.match(js,/api\.saveItem\(selection,next\)/,'item edit/add forms must persist the selected item');
assert.match(js,/api\.deleteItem\(selection,id\)/,'selected language items must be deletable');
assert.match(js,/function openLanguageExamManager\(selection\)/,'Control the exam must open a question manager');
assert.match(js,/api\.saveExamQuestion/,'exam questions must be addable/editable');
assert.match(js,/api\.deleteExamQuestion/,'exam questions must be deletable');
assert.match(js,/api\.emptyExamQuestions/,'exam controls must support emptying an exam');
assert.ok(!js.includes('dcc-delete-hitbox') && !js.includes('dcc-selection-bar') && !js.includes('toggleDeleteSelection'), 'legacy delete-selection implementation must be removed from content-controls.js');
assert.ok(js.includes("function beginEdit()") && js.includes("state.editItems = buildEditItems()"), 'edit mode must remain item-driven');
assert.ok(js.includes("function uniqueAddActions()") && js.includes("route.startsWith('calendar/schedule')") && js.includes("const control=actions.find(candidate=>candidate.dataset?.plannerAddType)") && js.includes("return [{control,label:labels[type]||'Item',type}]"), 'Manage Content Add must open the active planner subpage form directly');
assert.ok(css.includes('.dcc-native-action{display:none!important}'), 'legacy inline CRUD buttons must remain hidden');
assert.ok(css.includes('.dcc-editable') && css.includes('.dcc-edit-hint') && css.includes('.dcc-edit-exit'), 'edit mode must retain its premium highlight/status UI');
assert.ok(!css.includes('.dcc-delete-hitbox') && !css.includes('.dcc-selection-bar') && !css.includes('.dcc-delete-portal'), 'legacy delete styles must be removed from content-controls.css');

assert.ok(suite.includes('data-content-delete-note') && suite.includes('data-content-delete-resource') && suite.includes('data-content-delete-assignment'), 'suite entities must expose internal delete endpoints');
assert.ok(suite.includes('data-content-edit-note'), 'notes must remain editable through unified edit mode');
assert.ok(suite.includes('data-content-delete-deadline'), 'custom deadlines must expose delete endpoints');
assert.ok(calendar.includes('data-planner-edit') && calendar.includes("openPlannerEntrySheet('','',button.dataset.plannerEdit)"), 'planner entries must expose edit forms');
assert.ok(calendar.includes('data-calendar-edit-entry') && calendar.includes('data-calendar-delete-entry'), 'calendar cells must expose edit/delete endpoints');
assert.ok(calendar.includes('data-planner-add-type') && calendar.includes('data-planner-tab-current'), 'planner subpages must expose one active Add proxy and identify the active section');
assert.ok(js.includes("const typeIcons={tasks:'✓',todos:'☑',goals:'◇',schedule:'◷'}") && !js.includes("attendance:'◎'"), 'planner add metadata must include only the four remaining planner sections');
assert.ok(social.includes('data-content-edit-room') && social.includes('data-content-delete-room'), 'user-created study rooms must expose edit/delete endpoints');

assert.ok(index.includes('content-controls.css?v=20260920-3') && index.includes('content-controls.js?v=20260921-1'), 'new content-control assets must load');
assert.ok(index.includes('delete-manager.css?v=20260919-1') && index.includes('delete-manager.js?v=20260919-1'), 'replacement delete manager assets must load');
assert.ok(index.indexOf('delete-manager.js?v=20260919-1') < index.indexOf('content-controls.js?v=20260921-1'), 'delete manager must load before content controls delegate to it');
assert.match(js,/dcc-trigger-language-docked/,'language content controls must dock into the toolbar');

console.log('unified content controls tests passed');
