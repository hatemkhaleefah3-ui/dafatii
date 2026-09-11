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

  let failSave = true;
  await data.connect({ scope: 'user:a', load: async () => ({ records: [], replaceLocal: true }), save: async () => { if (failSave) throw new Error('offline'); } });
  data.writeJSON('dafatii:notes', [{ id: 'offline-note' }]);
  await data.flush();
  assert.match(context.localStorage.getItem('__dafatii:sync-outbox:v1'), /user:a/);

  data.disconnect();
  await data.connect({ scope: 'user:b', load: async () => ({ records: [{ key: 'dafatii:subjects', format: 'json', value: [{ id: 'biology' }] }], replaceLocal: true }), save: async () => {} });
  assert.equal(data.readJSON('dafatii:notes', null), null, 'another account must not receive user A local records');
  assert.equal(data.readJSON('dafatii:subjects', [])[0].id, 'biology');

  data.disconnect(); failSave = false; const recovered = [];
  await data.connect({ scope: 'user:a', load: async () => ({ records: [], replaceLocal: true }), save: async record => recovered.push(record) });
  assert.equal(recovered[0].key, 'dafatii:notes', 'the durable outbox must replay for its owning account');
  assert.equal(data.readJSON('dafatii:notes', [])[0].id, 'offline-note');
  assert.equal(context.localStorage.getItem('__dafatii:sync-outbox:v1'), null);
}

run().then(() => console.log('data-client tests passed'));
