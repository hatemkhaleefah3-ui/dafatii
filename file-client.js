(() => {
  'use strict';
  const API = '/api/v1/files';
  async function api(path, options = {}) {
    const response = await fetch(`${API}/${path}`, { credentials: 'same-origin', headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }, ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(payload.error?.message || 'File operation failed.'); error.status=response.status; error.code=payload.error?.code; throw error; }
    return payload;
  }
  async function upload(file, options = {}) {
    if (!(file instanceof File)) throw new TypeError('upload() requires a File.');
    const init = await api('upload-init', { method:'POST', body:JSON.stringify({ name:file.name, size:file.size, contentType:file.type || 'application/octet-stream', ...options }) });
    const response = await fetch(init.upload.url, { method:init.upload.method, headers:init.upload.headers, body:file });
    if (!response.ok) throw new Error(`Direct upload failed (${response.status}).`);
    const completed = await api(`${encodeURIComponent(init.fileId)}/complete`, { method:'POST', body:'{}' });
    return completed.file;
  }
  async function get(fileId) { return (await api(encodeURIComponent(fileId))).file; }
  async function getView(fileId) { return api(`${encodeURIComponent(fileId)}/view`); }
  async function getViewUrl(fileId) { return (await getView(fileId)).url; }
  async function remove(fileId) { return api(encodeURIComponent(fileId), { method:'DELETE' }); }
  window.DafatiiFiles = Object.freeze({ upload, get, getView, getViewUrl, delete:remove });
})();
