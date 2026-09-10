(() => {
  'use strict';
  let user = null;
  const emit = type => window.dispatchEvent(new CustomEvent(`dafatii:auth:${type}`, { detail: { user } }));
  async function current() {
    try { user = (await window.DafatiiApi.request('/auth/session')).user; emit('changed'); return user; }
    catch (error) { if (error.status === 401) { user = null; emit('changed'); return null; } throw error; }
  }
  async function login({ email, password }) {
    const result = await window.DafatiiApi.request('/auth/login', { method: 'POST', body: { email, password } });
    user = result.user; emit('changed');
    try { await window.DafatiiRemoteData?.connect(); } catch (error) { window.dispatchEvent(new CustomEvent('dafatii:sync:offline', { detail: { error } })); }
    return user;
  }
  async function signup({ email, password, displayName }) {
    const result = await window.DafatiiApi.request('/auth/signup', { method: 'POST', body: { email, password, displayName } });
    user = result.user; emit('changed');
    try { await window.DafatiiRemoteData?.connect(); } catch (error) { window.dispatchEvent(new CustomEvent('dafatii:sync:offline', { detail: { error } })); }
    return user;
  }
  async function logout() {
    await window.DafatiiApi.request('/auth/logout', { method: 'POST', body: {} });
    user = null; window.DafatiiData?.disconnect(); emit('changed');
  }
  window.DafatiiAuth = Object.freeze({ current, login, signup, logout, get user() { return user; } });
})();
