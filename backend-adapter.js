(() => {
  'use strict';
  const revisions = new Map();
  const mutationIds = new Map();
  const API = '/api/v1/data';
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  function mutationKey(record) { return `${record.key}:${record.updatedAt}:${record.deleted ? 1 : 0}`; }
  function newMutationId() { return `mut_${crypto.randomUUID()}`; }
  async function call(path, options = {}, retry = true) {
    let attempt = 0;
    for (;;) {
      try {
        const response = await fetch(`${API}/${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) return payload;
        const error = new Error(payload.error?.message || 'Synchronization failed.'); error.status = response.status; error.code = payload.error?.code; error.details = payload.error?.details;
        if (!retry || ![408,429,500,502,503,504].includes(response.status) || attempt >= 4) throw error;
      } catch (error) {
        if (!retry || error.status && ![408,429,500,502,503,504].includes(error.status) || attempt >= 4) throw error;
      }
      const delay = Math.min(4000, 250 * (2 ** attempt)) * (0.75 + Math.random() * 0.5); attempt += 1; await sleep(delay);
    }
  }
  function hydrate(payload) {
    for (const record of payload.records || []) revisions.set(record.key, Number(record.revision || 0));
    return payload;
  }
  const adapter = {
    async load() { return hydrate(await call('sync', { method: 'GET' })); },
    async save(record) {
      const key = mutationKey(record); const mutationId = mutationIds.get(key) || newMutationId(); mutationIds.set(key, mutationId);
      try {
        const result = await call('record', { method: 'PUT', body: JSON.stringify({ ...record, expectedRevision: revisions.get(record.key) || 0, mutationId }) });
        revisions.set(record.key, Number(result.revision)); mutationIds.delete(key); return result;
      } catch (error) {
        if (error.status === 409) window.dispatchEvent(new CustomEvent('dafatii:syncconflict', { detail: { key: record.key, error } }));
        throw error;
      }
    },
    async importLocal(records) { return call('import', { method: 'POST', body: JSON.stringify({ records }) }, false); },
    async refresh() { return hydrate(await call('sync', { method: 'GET' })); }
  };
  window.DafatiiDataRemote = Object.freeze(adapter);
})();
