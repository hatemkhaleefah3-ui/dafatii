(() => {
  'use strict';
  const revisions = new Map();
  let connecting = null;
  function adapter() {
    return {
      async load({ localRecords }) {
        const result = await window.DafatiiApi.request('/sync/hydrate', { method: 'POST', body: { localRecords }, idempotent: true });
        result.records.forEach(record => revisions.set(record.key, record.revision));
        return result;
      },
      async save(record) {
        const mutationId = crypto.randomUUID();
        try {
          const result = await window.DafatiiApi.request('/sync/mutations', {
            method: 'POST', idempotent: true, body: { mutationId, baseRevision: revisions.get(record.key) || 0, record }
          });
          revisions.set(record.key, result.revision);
          return result;
        } catch (error) {
          if (error.status === 401) window.dispatchEvent(new CustomEvent('dafatii:auth:required'));
          if (error.status === 409) window.dispatchEvent(new CustomEvent('dafatii:sync:conflict', { detail: { record, current: error.details?.current } }));
          throw error;
        }
      }
    };
  }
  async function connect() {
    if (connecting) return connecting;
    connecting = (async () => {
      const user = window.DafatiiAuth.user || await window.DafatiiAuth.current();
      if (!user) return false;
      revisions.clear();
      await window.DafatiiData.connect(adapter());
      return true;
    })().finally(() => { connecting = null; });
    return connecting;
  }
  window.DafatiiRemoteData = Object.freeze({ connect });
  window.addEventListener('DOMContentLoaded', () => { void connect().catch(error => console.warn('Dafatii synchronization is offline.', error.code || error.message)); });
})();

