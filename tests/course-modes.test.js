const fs = require('node:fs');
const assert = require('node:assert/strict');

const js = fs.readFileSync('course-modes.js','utf8');
const css = fs.readFileSync('course-modes.css','utf8');
const index = fs.readFileSync('index.html','utf8');

for (const type of ['dafaa','personal','teaching','language']) {
  assert.ok(js.includes("'"+type+"'"), 'missing course type '+type);
}
for (const level of ['A1','A2','B1','B2','C1']) {
  assert.ok(js.includes("id:'"+level+"'"), 'missing CEFR level '+level);
}
for (const route of ['language-home','language-letters','language-voice','language-grammar','language-review','language-examine']) {
  assert.ok(js.includes(route), 'missing language navigation route '+route);
}
assert.match(js,/5\*5\*26/,'language program must model five levels, five steps and twenty-six boxes');
assert.match(js,/boxUnlocked\(state,li,step,box\)/,'box progression must be explicitly gated');
assert.match(js,/stepUnlocked\(state,li,step\)/,'step progression must be explicitly gated');
assert.match(js,/levelUnlocked\(state,li\)/,'level progression must be explicitly gated');
assert.match(js,/scope==='box'/,'box assessments must exist');
assert.match(js,/scope==='step'/,'step assessments must exist');
assert.match(js,/scope==='level'/,'level assessments must exist');
assert.match(js,/score>=80/,'assessment pass threshold must be enforced');
assert.match(js,/SpeechSynthesisUtterance/,'voice playback must be functional');
assert.match(js,/SpeechRecognition\|\|window\.webkitSpeechRecognition/,'reverse voice-to-text practice must use browser speech recognition when available');
assert.match(js,/language-trace-canvas/,'letters page must include a drawing surface');
assert.match(js,/courseType\(\)==='personal'/,'personal courses must have dedicated behavior');
assert.match(js,/personal-focus-room/,'personal courses must expose exactly one seeded focus room');
assert.match(js,/page==='study-rooms'\)return personalRoomPage/,'personal Study Rooms route must render the single focus studio');
assert.match(js,/data-language-ui-switch/,'language workspace must expose an Arabic-English switcher');
assert.ok(css.includes('.language-course-page') && css.includes('.personal-focus-grid') && css.includes('.course-type-grid'),'course mode styles must be loaded');
assert.ok(index.includes('course-modes.css?v=20260920-1') && index.includes('course-modes.js?v=20260920-1'),'course mode assets must be cache-busted and loaded');
assert.ok(index.indexOf('course-modes.js?v=20260920-1') > index.indexOf('content-controls.js'),'course modes must load after existing workspace wrappers');

console.log('course modes tests passed');