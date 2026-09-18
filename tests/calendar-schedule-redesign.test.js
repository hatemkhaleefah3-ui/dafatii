const fs=require('node:fs');
const assert=require('node:assert/strict');
const ui=fs.readFileSync('calendar.js','utf8');
const css=fs.readFileSync('calendar.css','utf8');
const course=fs.readFileSync('course-context.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.ok(ui.includes("const PLANNER_MODES = ['day','week','month','year']"), 'schedule must expose day/week/month/year time scales');
assert.ok(ui.includes('data-planner-loop="mode"') && ui.includes('data-planner-loop="period"'), 'schedule needs two independent horizontal looping selectors');
assert.ok(ui.includes("[-3,-2,-1,0,1,2,3]") && ui.includes('addDate(plannerDate,plannerMode'), 'period selector must generate an endless moving window around the selected date');
assert.ok(ui.includes("PLANNER_TABS = ['tasks','schedule','todos','goals','attendance']"), 'each selected period needs task, schedule, todo, goal and attendance content');
assert.ok(ui.includes("const PLANNER_KEY = 'dafatii:schedulePlanner:v1'") && course.includes("'dafatii:schedulePlanner:v1'"), 'planner content must be persisted in the active course scope');
assert.ok(ui.includes('savePlannerBucket') && ui.includes('periodKey(plannerMode,plannerDate)'), 'each selected date/range must store its own content bucket');
assert.ok(ui.includes('pointerdown') && ui.includes('pointerup'), 'both selector loops must support horizontal swipe gestures');
assert.ok(ui.includes('recurringSchedule()') && ui.includes('Recurring weekly timetable'), 'existing weekly schedule data must remain visible in the redesigned page');
assert.ok(css.includes('.planner-loop-shell') && css.includes('.planner-date-track') && css.includes('scroll-snap-type:x mandatory'), 'schedule selector loops need enclosed scroll-snap styling');
assert.ok(css.includes('.planner-content-tabs') && css.includes('.planner-content-card'), 'period-specific content must have the requested segmented content design');
assert.ok(index.includes('calendar.js?v=20260918-1') && index.includes('calendar.css?v=20260918-1'), 'schedule redesign assets must be cache-busted');
console.log('calendar schedule redesign tests passed');
