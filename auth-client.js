(() => {
  'use strict';
  async function request(path, options = {}) {
    const response = await fetch(`/api/v1/auth/${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(payload.error?.message || 'Authentication request failed.'); error.code = payload.error?.code; error.status = response.status; throw error; }
    return payload;
  }
  async function connectData({ importLocal = false } = {}) {
    if (!window.DafatiiData || !window.DafatiiDataRemote) return;
    if (importLocal) await window.DafatiiDataRemote.importLocal(window.DafatiiData.localSnapshot());
    try { await window.DafatiiData.connect(window.DafatiiDataRemote); } catch (error) { console.warn('Dafatii data sync unavailable', error); }
  }
  const api = {
    async signup(details) { const result = await request('signup', { method: 'POST', body: JSON.stringify(details) }); await connectData({ importLocal: true }); return result; },
    async login(details) { const result = await request('login', { method: 'POST', body: JSON.stringify(details) }); await connectData(); return result; },
    async current() { try { return await request('session'); } catch (error) { if (error.status === 401) return { user: null }; throw error; } },
    async logout() { const result = await request('logout', { method: 'POST', body: '{}' }); window.DafatiiData?.disconnect(); return result; }
  };
  window.DafatiiAuth = Object.freeze(api);
  api.current().then(result => { if (result.user) connectData(); }).catch(error => console.warn('Session lookup failed', error));
})();
