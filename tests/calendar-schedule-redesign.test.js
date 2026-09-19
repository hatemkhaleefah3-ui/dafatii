const fs=require('node:fs');
const assert=require('node:assert/strict');
const ui=fs.readFileSync('calendar.js','utf8');
const css=fs.readFileSync('calendar.css','utf8');
const course=fs.readFileSync('course-context.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.ok(ui.includes("const PLANNER_MODES = ['day','week','month','year']"), 'schedule must expose day/week/month/year time scales');
assert.ok(ui.includes('data-planner-loop="mode"') && ui.includes('data-planner-loop="period"'), 'schedule needs two independent horizontal looping selectors');
assert.ok(ui.includes("[-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7]") && ui.includes('addDate(plannerDate,plannerMode'), 'period selector must generate a wide endless moving window around the selected date');
assert.ok(ui.includes("PLANNER_TABS = ['tasks','schedule','todos','goals','attendance']"), 'each selected period needs task, schedule, todo, goal and attendance content');
assert.ok(ui.includes("const LEGACY_PLANNER_KEY = 'dafatii:schedulePlanner:v1'") && ui.includes("const PLANNER_KEY = 'dafatii:schedulePlanner:v2'") && ui.includes('plannerPersonalKey') && ui.includes('window.DafatiiData.writeJSON(plannerPersonalKey(version),value)') && !course.includes("'dafatii:schedulePlanner:v2'"), 'planner must use a personal per-course synced record instead of shared Course content');
assert.ok(ui.includes('plannerItems()') && ui.includes('savePlannerItems') && ui.includes("date:String(form.get('date')"), 'planner entries must be canonical dated records rather than independent period buckets');
assert.ok(ui.includes('Array.from({length:24}') && ui.includes('Array.from({length:7}') && ui.includes('Array.from({length:30}') && ui.includes('Array.from({length:12}'), 'day/week/month/year views must render 24 hours, 7 days, 30 cells and 12 months');
assert.ok(ui.includes("plannerMode='day'") && ui.includes("plannerMode='month'"), 'aggregate tables must drill into the same dated data across time scales');
assert.ok(ui.includes('centeredPlannerItem') && ui.includes("track.addEventListener('scroll'") && ui.includes("track.addEventListener('scrollend'"), 'scroll position must select the item nearest the center of each rail');
assert.ok(ui.includes("item.style.opacity") && ui.includes("distance/fadeDistance"), 'selection opacity must fall continuously as items move away from the rail center');
assert.ok(!ui.includes('planner-loop-arrow') && !ui.includes('data-planner-mode-step') && !ui.includes('data-planner-period-step'), 'schedule selectors must not render arrow buttons');
assert.ok(ui.includes('function recurringForDate(date)') && ui.includes('const entries=read(SCHEDULE_KEY,[])') && ui.includes("notes:'Recurring weekly timetable'"), 'existing weekly schedule data must project into matching dated schedule cells');
assert.ok(css.includes('.planner-loop-shell{position:relative') && css.includes('border:0') && css.includes('background:transparent') && css.includes('scroll-snap-type:x mandatory'), 'selector rails must be frameless horizontal scroll-snap controls');
assert.ok(css.includes('.planner-content-tabs') && css.includes('.planner-day-table') && css.includes('.planner-week-table') && css.includes('.planner-month-table') && css.includes('.planner-year-table'), 'all four interconnected schedule tables must be styled');
assert.ok(index.includes('calendar.js?v=20260919-5') && index.includes('calendar.css?v=20260918-3'), 'schedule redesign assets must be cache-busted');
console.log('calendar schedule redesign tests passed');

assert.ok(ui.includes('legacyPlannerSnapshot') && ui.includes('__dafatii:course-cache:'), 'planner migration must recover any locally cached pre-fix planner data without resubmitting it as Course content');
