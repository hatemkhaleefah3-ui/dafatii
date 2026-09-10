(() => {
  'use strict';
  async function upload(file, options = {}) {
    if (!(file instanceof File)) throw new TypeError('upload() requires a File.');
    const initialized = await window.DafatiiApi.request('/files/upload-init', { method: 'POST', body: { filename: file.name, contentType: file.type || 'application/octet-stream', size: file.size } });
    let response;
    try { response = await fetch(initialized.upload.url, { method: initialized.upload.method, headers: initialized.upload.headers, body: file, signal: options.signal }); }
    catch (error) { void remove(initialized.fileId).catch(() => {}); throw error; }
    if (!response.ok) { void remove(initialized.fileId).catch(() => {}); throw new Error(`Storage upload failed (${response.status}).`); }
    options.onProgress?.({ loaded: file.size, total: file.size, ratio: 1 });
    return window.DafatiiApi.request(`/files/${initialized.fileId}/complete`, { method: 'POST', body: {}, idempotent: true });
  }
  const get = fileId => window.DafatiiApi.request(`/files/${encodeURIComponent(fileId)}`);
  const list = options => window.DafatiiApi.request(`/files?limit=${Math.min(options?.limit || 50, 100)}`);
  async function getViewUrl(fileId, options = {}) {
    const suffix = options.download ? '?download=1' : '';
    return (await window.DafatiiApi.request(`/files/${encodeURIComponent(fileId)}/view${suffix}`)).url;
  }
  const remove = fileId => window.DafatiiApi.request(`/files/${encodeURIComponent(fileId)}`, { method: 'DELETE', body: {}, idempotent: true });
  async function open(fileId) {
    const metadata = await get(fileId);
    if (metadata.contentType === 'application/pdf' && window.DafatiiPdf) return window.DafatiiPdf.open(fileId, metadata);
    return window.DafatiiMedia.open(fileId, metadata);
  }
  window.DafatiiFiles = Object.freeze({ upload, get, list, getViewUrl, delete: remove, open });
})();
