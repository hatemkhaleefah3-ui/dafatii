(() => {
  'use strict';

  const DATA_PREFIX = 'dafatii:';
  const LOCAL_ONLY_KEYS = new Set(['dafatii:theme', 'dafatii:direction']);
  const listeners = new Set();
  const pending = new Map();
  let adapter = null;
  let flushPromise = Promise.resolve();

  const isSyncedKey = key => String(key).startsWith(DATA_PREFIX) && !LOCAL_ONLY_KEYS.has(String(key));

  function emit(type, detail = {}) {
    const event = { type, ...detail };
    listeners.forEach(listener => listener(event));
    window.dispatchEvent(new CustomEvent(`dafatii:${type}`, { detail }));
  }

  function readString(key, fallback = null) {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  }

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function enqueue(record) {
    if (!adapter?.save || !isSyncedKey(record.key)) return;
    pending.set(record.key, record);
    void flush();
  }

  function writeString(key, value) {
    localStorage.setItem(key, String(value));
    const record = { key, format: 'string', value: String(value), updatedAt: Date.now() };
    emit('datachange', { record, source: 'local' });
    enqueue(record);
    return value;
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    const record = { key, format: 'json', value, updatedAt: Date.now() };
    emit('datachange', { record, source: 'local' });
    enqueue(record);
    return value;
  }

  function remove(key) {
    localStorage.removeItem(key);
    const record = { key, format: 'json', value: null, deleted: true, updatedAt: Date.now() };
    emit('datachange', { record, source: 'local' });
    enqueue(record);
  }

  function localSnapshot() {
    const records = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!isSyncedKey(key)) continue;
      const raw = localStorage.getItem(key);
      try {
        records.push({ key, format: 'json', value: JSON.parse(raw), updatedAt: null });
      } catch {
        records.push({ key, format: 'string', value: raw, updatedAt: null });
      }
    }
    return records;
  }

  function normalizeRecords(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.records)) return payload.records;
    throw new TypeError('Dafatii adapter load() must return an array or { records: [] }.');
  }

  function applyRemoteRecord(record) {
    if (!record || !isSyncedKey(record.key) || pending.has(record.key)) return;
    if (record.deleted || record.value === null) localStorage.removeItem(record.key);
    else if (record.format === 'string') localStorage.setItem(record.key, String(record.value));
    else localStorage.setItem(record.key, JSON.stringify(record.value));
    emit('datachange', { record, source: 'remote' });
  }

  async function connect(nextAdapter) {
    if (!nextAdapter || (typeof nextAdapter.load !== 'function' && typeof nextAdapter.save !== 'function')) {
      throw new TypeError('A Dafatii data adapter must implement load(), save(), or both.');
    }
    adapter = nextAdapter;
    emit('syncstatus', { status: 'connecting' });
    try {
      if (adapter.load) {
        const payload = await adapter.load({ localRecords: localSnapshot() });
        normalizeRecords(payload).forEach(applyRemoteRecord);
      }
      emit('datahydrated', {});
      emit('syncstatus', { status: 'connected' });
      await flush();
    } catch (error) {
      emit('syncerror', { operation: 'load', error });
      emit('syncstatus', { status: 'offline' });
      throw error;
    }
  }

  function disconnect() {
    adapter = null;
    pending.clear();
    emit('syncstatus', { status: 'local' });
  }

  function flush() {
    if (!adapter?.save || pending.size === 0) return flushPromise;
    flushPromise = flushPromise.then(async () => {
      while (adapter?.save && pending.size) {
        const [key, record] = pending.entries().next().value;
        try {
          await adapter.save(record);
          if (pending.get(key) === record) pending.delete(key);
          emit('datasynced', { record });
        } catch (error) {
          emit('syncerror', { operation: 'save', record, error });
          break;
        }
      }
    });
    return flushPromise;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Subscriber must be a function.');
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.DafatiiData = Object.freeze({
    readString,
    readJSON,
    writeString,
    writeJSON,
    remove,
    localSnapshot,
    connect,
    disconnect,
    flush,
    subscribe,
    isSyncedKey
  });
})();
