const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function makeStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

async function run() {
  const events = [];
  const context = {
    console,
    CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    localStorage: makeStorage(),
    window: { dispatchEvent: event => events.push(event) }
  };
  context.window.localStorage = context.localStorage;
  vm.runInNewContext(fs.readFileSync('data-client.js', 'utf8'), context);
  const data = context.window.DafatiiData;

  assert.equal(data.readJSON('dafatii:missing', 'fallback'), 'fallback');
  data.writeJSON('dafatii:subjects', [{ id: 'math' }]);
  assert.equal(JSON.stringify(data.readJSON('dafatii:subjects', [])), JSON.stringify([{ id: 'math' }]));
  data.writeString('dafatii:joined', '1');
  assert.equal(data.readString('dafatii:joined'), '1');
  assert.equal(data.isSyncedKey('dafatii:theme'), false);

  const saved = [];
  await data.connect({
    load: async ({ localRecords }) => {
      assert.equal(localRecords.length, 2);
      assert.equal(localRecords.find(record => record.key === 'dafatii:joined').format, 'string');
      return { records: [{ key: 'dafatii:examSchedule', format: 'json', value: [{ id: 'exam-1' }] }] };
    },
    save: async record => saved.push(record)
  });
  assert.equal(data.readJSON('dafatii:examSchedule', [])[0].id, 'exam-1');

  data.writeJSON('dafatii:subjects', [{ id: 'physics' }]);
  await data.flush();
  assert.equal(saved.at(-1).key, 'dafatii:subjects');
  assert.equal(saved.at(-1).format, 'json');
  assert(events.some(event => event.type === 'dafatii:datahydrated'));
}

run().then(() => console.log('data-client tests passed'));
