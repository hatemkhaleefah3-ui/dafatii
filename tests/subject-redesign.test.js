const assert=require('node:assert/strict');
const fs=require('node:fs');

const index=fs.readFileSync('index.html','utf8');
const ui=fs.readFileSync('subject-redesign.js','utf8');
const css=fs.readFileSync('subject-redesign.css','utf8');

assert.match(index,/subject-redesign\.css\?v=20260919-3/,'reference-driven Subjects CSS must load');
assert.match(index,/subject-redesign\.js\?v=20260919-3/,'reference-driven Subjects controller must load');
assert.ok(index.indexOf('subject-redesign.css?v=20260919-3') > index.indexOf('admin-console.css?v=20260918-3'),'Subjects CSS must load after existing presentation layers');
assert.ok(index.indexOf('subject-redesign.js?v=20260919-3') > index.indexOf('admin-console.js?v=20260918-4'),'Subjects controller must wrap the final existing workspace renderer');

assert.ok(ui.includes("MAIN_NAV.subjects = ['All subjects','Lectures','Exams','Assignments'];"),'Subjects navigation must match the supplied four-tab reference');
for(const fn of ['subjectListViewRedesign','subjectOverviewView','subjectLecturesView','subjectExamsView','subjectAssignmentsView']) assert.ok(ui.includes('function '+fn+'('),fn+' missing');
assert.ok(ui.includes("['overview','lectures','exams','assignments']"),'Subject detail must expose Overview, Lectures, Exams, and Assignments');
assert.ok(ui.includes('subject-r-search')&&ui.includes('subject-r-sort'),'My Subjects must include search and filtering controls');
assert.ok(ui.includes('subject-r-progress')&&ui.includes('subject-r-card-meta'),'Subject cards must expose progress and academic metadata');
assert.ok(ui.includes('subject-r-hero')&&ui.includes('subject-r-outline')&&ui.includes('subject-r-results'),'Subject Overview must include hero, chapter outline, and results');
assert.ok(ui.includes('openExamRedesign')&&ui.includes('openAssignmentRedesign')&&ui.includes('openAddContent'),'reference actions must be functional rather than decorative');
assert.ok(ui.includes("[['all','All'],['recorded','Recorded']]"),'Lectures must only expose All and Recorded filters');
assert.ok(!ui.includes("[['all','All'],['upcoming','Upcoming'],['completed','Completed'],['recorded','Recorded']]"),'Upcoming and Completed lecture filters must stay removed');
const lectureCardSource=ui.slice(ui.indexOf('function lectureCard('),ui.indexOf('function subjectExamsView('));
assert.ok(!lectureCardSource.includes('subject-r-status'),'Lecture cards must not render Upcoming or Completed status badges');
assert.ok(ui.includes("const canContent = permission => !managed()")&&ui.includes("const canPlan = permission => schoolProgram()"),'Subjects actions must be gated by real course permissions while school personal planning stays writable');
assert.ok(ui.includes("if(canContent('edit_content')){openLectureSheet")&&ui.includes('openLectureDetails(s,lecture)'),'readonly lectures must open a real detail view instead of a dead control');
assert.ok(ui.includes('function openChapterSheet(')&&ui.includes('data-edit-chapter'),'chapter control must edit and persist the subject chapter');
assert.ok(ui.includes('function openExamDetails(')&&ui.includes('function openAssignmentDetails('),'readonly exam and assignment rows must open useful detail sheets');
assert.ok(ui.includes("canPlan('remove_content')"),'delete controls must require remove permission rather than generic edit access');
assert.ok(ui.includes("ASSIGNMENT_PROGRESS_KEY = 'dafatii:assignmentProgress:v1'"),'student assignment progress must use a personal synced record instead of mutating shared course content');
assert.ok(ui.includes('function effectiveAssignment(')&&ui.includes('function openAssignmentProgress('),'student assignment rows must merge and edit personal progress');
assert.ok(ui.includes('saveAssignmentProgress(assignment.id'),'assignment Open/Submit controls must persist student status and submission notes');
assert.ok(ui.includes("tracksPersonalAssignmentProgress())&&!assignmentDone(a)"),'students with active course membership must receive a functional assignment Open control');
assert.ok(ui.includes("degree:schoolProgram()?(rawDegree===''?null:Number(rawDegree)):null"),'shared course exams must not store one student degree in the course-wide exam definition');
assert.ok(ui.includes("const status=schoolProgram()?(statusInput?.value||'todo'):'todo'"),'shared course assignments must not store one student submission state in the shared definition');
assert.ok(ui.includes('Each student tracks their own progress separately'),'shared assignment editor must explain the personal-progress boundary');
assert.ok(ui.includes('tabindex="0" role="button"')&&ui.includes("e.target===el&&(e.key==='Enter'||e.key===' ')"),'lecture, exam, and assignment cards must support keyboard activation without duplicate nested-button actions');
assert.ok(ui.includes("window.DafatiiSubjectRedesign = Object.freeze"),'Subjects redesign must expose a stable integration surface');

for(const marker of ['.subject-r-tabs','.subject-r-card','.subject-r-hero','.subject-r-filterbar','.subject-r-wide-action','.subject-r-chapter-button','.subject-r-readonly','.subject-r-field-note']) assert.ok(css.includes(marker),marker+' style missing');
assert.match(css,/@media\(max-width:620px\)/,'mobile reference layout must have a dedicated breakpoint');
assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/,'desktop metric/tab layout must preserve four-column rhythm');
assert.match(css,/\.workspace:has\(\.subject-redesign-page\)>\.sub-nav\{display:none\}/,'legacy Subjects sub-navigation must not duplicate the reference tabs');

console.log('subject redesign tests passed');
