const assert=require('node:assert/strict');
const fs=require('node:fs');

const index=fs.readFileSync('index.html','utf8');
const ui=fs.readFileSync('subject-redesign.js','utf8');
const css=fs.readFileSync('subject-redesign.css','utf8');

assert.match(index,/subject-redesign\.css\?v=20260919-1/,'reference-driven Subjects CSS must load');
assert.match(index,/subject-redesign\.js\?v=20260919-1/,'reference-driven Subjects controller must load');
assert.ok(index.indexOf('subject-redesign.css?v=20260919-1') > index.indexOf('admin-console.css?v=20260918-3'),'Subjects CSS must load after existing presentation layers');
assert.ok(index.indexOf('subject-redesign.js?v=20260919-1') > index.indexOf('admin-console.js?v=20260918-4'),'Subjects controller must wrap the final existing workspace renderer');

assert.ok(ui.includes("MAIN_NAV.subjects = ['All subjects','Lectures','Exams','Assignments'];"),'Subjects navigation must match the supplied four-tab reference');
for(const fn of ['subjectListViewRedesign','subjectOverviewView','subjectLecturesView','subjectExamsView','subjectAssignmentsView']) assert.ok(ui.includes('function '+fn+'('),fn+' missing');
assert.ok(ui.includes("['overview','lectures','exams','assignments']"),'Subject detail must expose Overview, Lectures, Exams, and Assignments');
assert.ok(ui.includes('subject-r-search')&&ui.includes('subject-r-sort'),'My Subjects must include search and filtering controls');
assert.ok(ui.includes('subject-r-progress')&&ui.includes('subject-r-card-meta'),'Subject cards must expose progress and academic metadata');
assert.ok(ui.includes('subject-r-hero')&&ui.includes('subject-r-outline')&&ui.includes('subject-r-results'),'Subject Overview must include hero, chapter outline, and results');
assert.ok(ui.includes('openExamRedesign')&&ui.includes('openAssignmentRedesign')&&ui.includes('openAddContent'),'reference actions must be functional rather than decorative');
assert.ok(ui.includes("const managed = () => typeof schoolManagedWorkspace === 'function' && schoolManagedWorkspace();")&&ui.includes('const editable = () => !managed();'),'managed school workspaces must retain readonly behavior');
assert.ok(ui.includes("window.DafatiiSubjectRedesign = Object.freeze"),'Subjects redesign must expose a stable integration surface');

for(const marker of ['.subject-r-tabs','.subject-r-card','.subject-r-hero','.subject-r-filterbar','.subject-r-wide-action']) assert.ok(css.includes(marker),marker+' style missing');
assert.match(css,/@media\(max-width:620px\)/,'mobile reference layout must have a dedicated breakpoint');
assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/,'desktop metric/tab layout must preserve four-column rhythm');
assert.match(css,/\.workspace:has\(\.subject-redesign-page\)>\.sub-nav\{display:none\}/,'legacy Subjects sub-navigation must not duplicate the reference tabs');

console.log('subject redesign tests passed');
