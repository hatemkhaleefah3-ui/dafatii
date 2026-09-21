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
assert.match(js,/return Boolean\(isAdmin\(\) && workspace\(\) && scope\(\) && !isChat\(\) && !isLanguageCourse\(\)\)/,'the content-control access button must be admin-only and absent from language courses');
assert.ok(js.includes("dcc-trigger-icon") && js.includes(">⌃</span>") && js.includes("<strong>Manage</strong>"), 'eligible pages need the premium Manage Content button');
assert.ok(js.includes('data-dcc-action="delete"') && js.includes('data-dcc-action="edit"') && js.includes('data-dcc-action="add"'), 'content sheet must expose delete, edit, and add');
assert.ok(js.includes("window.DafatiiDeleteManager?.activate?.()"), 'Delete must delegate to the replacement delete manager');
assert.match(js,/const isLanguageCourse = \(\) => Boolean\(window\.DafatiiCourseModes\?\.isLanguage\?\.\(\)\)/,'content controls must detect the language shell');
assert.match(js,/!isLanguageCourse\(\)/,'language courses must be excluded from generic content controls');
assert.match(js,/document\.querySelector\('\.dcc-trigger'\)\?\.remove\(\)/,'language course must remove the Manage Content trigger');
assert.doesNotMatch(js,/openLanguageRootSheet|openLanguageContentSelector|openLanguageExamManager|languageAuthoring|dcc-trigger-language-docked/,'language authoring UI must stay deleted');
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

assert.ok(index.includes('content-controls.css?v=20260921-4') && index.includes('content-controls.js?v=20260921-2'), 'new content-control assets must load');
assert.ok(index.includes('delete-manager.css?v=20260919-1') && index.includes('delete-manager.js?v=20260919-1'), 'replacement delete manager assets must load');
assert.ok(index.indexOf('delete-manager.js?v=20260919-1') < index.indexOf('content-controls.js?v=20260921-2'), 'delete manager must load before content controls delegate to it');

console.log('unified content controls tests passed');
