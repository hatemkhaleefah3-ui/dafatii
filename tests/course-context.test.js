const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('course-context.js', 'utf8');

function environment(initial = {}) {
  const values = new Map(Object.entries(initial));
  const events = [];
  const window = {
    DafatiiData: {
      readJSON(key, fallback) { return values.has(key) ? JSON.parse(JSON.stringify(values.get(key))) : fallback; },
      writeJSON(key, value) { values.set(key, JSON.parse(JSON.stringify(value))); return value; },
      remove(key) { values.delete(key); }
    },
    dispatchEvent(event) { events.push(event); }
  };
  const context = vm.createContext({ window, CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }, Date, Math, JSON, Set, String });
  vm.runInContext(source, context);
  return { api: window.DafatiiCourses, values, events };
}

{
  const { api, events } = environment();
  assert.equal(api.list().length, 3);
  assert.equal(api.active().name, 'Computer Science');
  assert.deepEqual(Array.from(api.readJSON('dafatii:subjects', []).map(item => item.name)), ['Programming', 'Data Structures', 'Databases']);
  api.writeJSON('dafatii:subjects', [{ id: 'custom-cs', name: 'Custom CS' }]);
  const medicine = api.list().find(course => course.name === 'Medicine');
  assert.equal(api.switchCourse(medicine.id), true);
  assert.deepEqual(Array.from(api.readJSON('dafatii:subjects', []).map(item => item.name)), ['Anatomy', 'Physiology', 'Pharmacology']);
  api.writeJSON('dafatii:subjects', [{ id: 'custom-med', name: 'Custom Medicine' }]);
  api.switchCourse('starter-computer-science');
  assert.equal(api.readJSON('dafatii:subjects', [])[0].name, 'Custom CS', 'course writes must remain isolated');
  assert.equal(events.filter(event => event.type === 'dafatii:coursechanged').length, 2);
}

{
  const legacySubjects = [{ id: 'legacy-math', name: 'Mathematics', icon: '∑' }];
  const { api, values } = environment({
    'dafatii:subjects': legacySubjects,
    'dafatii:studentSuite:v1': { profile: { course: 'Architecture', school: 'Design School', semester: 'Year 1' }, notes: [] }
  });
  assert.equal(api.list().length, 1);
  assert.equal(api.active().name, 'Architecture');
  assert.equal(api.readJSON('dafatii:subjects', [])[0].id, 'legacy-math');
  assert(values.has(api.scopedKey('dafatii:subjects')), 'legacy data must be copied into the initial course workspace');
}

{
  const { api } = environment();
  const created = api.createCourse({ name: 'Software Engineering — Year 2', templateName: 'Engineering', institution: 'Tech University', term: 'Fall' });
  assert.equal(api.active().id, created.id);
  assert.equal(api.active().template, 'Engineering');
  assert.equal(api.readJSON('dafatii:subjects', [])[0].name, 'Calculus');
  assert.equal(api.readJSON('dafatii:studentSuite:v1', {}).profile.course, 'Software Engineering — Year 2');
  assert.equal(api.roomSeeds()[0].subject, 'Mechanics');
}

console.log('course context tests passed');
