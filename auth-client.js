(() => {
  'use strict';
  let user = null;
  let availability = 'unknown';
  const emit = type => window.dispatchEvent(new CustomEvent(`dafatii:auth:${type}`, { detail: { user } }));
  const setAvailability = value => { if (availability !== value) { availability = value; emit('availability'); } };
  const backendUnavailable = error => !error?.status || error.status >= 500;
  async function current() {
    try { user = (await window.DafatiiApi.request('/auth/session', { idempotent: true })).user; setAvailability('online'); emit('changed'); return user; }
    catch (error) {
      if (error.status === 401) { user = null; setAvailability('online'); emit('changed'); return null; }
      if (backendUnavailable(error)) { user = null; setAvailability('offline'); emit('changed'); return null; }
      throw error;
    }
  }
  async function login(input = {}) {
    const identifier = input.identifier ?? input.email ?? input.phone ?? input.studentId ?? '';
    const credential = input.credential ?? input.password ?? input.pin ?? '';
    let result;
    try { result = await window.DafatiiApi.request('/auth/login', { method: 'POST', body: { identifier, credential } }); setAvailability('online'); }
    catch (error) { if (backendUnavailable(error)) setAvailability('offline'); throw error; }
    user = result.user; emit('changed');
    try { await window.DafatiiRemoteData?.connect({ importLocal: false }); } catch (error) { window.dispatchEvent(new CustomEvent('dafatii:sync:offline', { detail: { error } })); }
    return user;
  }
  async function signup(input = {}) {
    let result;
    try { result = await window.DafatiiApi.request('/auth/signup', { method: 'POST', body: input }); setAvailability('online'); }
    catch (error) { if (backendUnavailable(error)) setAvailability('offline'); throw error; }
    user = result.user; emit('changed');
    try { await window.DafatiiRemoteData?.connect({ importLocal: true }); } catch (error) { window.dispatchEvent(new CustomEvent('dafatii:sync:offline', { detail: { error } })); }
    return user;
  }
  async function logout() {
    await window.DafatiiApi.request('/auth/logout', { method: 'POST', body: {} });
    user = null; window.DafatiiData?.disconnect(); window.DafatiiData?.clearSyncedLocal(); emit('changed');
  }
  window.DafatiiAuth = Object.freeze({ current, login, signup, logout, get user() { return user; }, get availability() { return availability; } });
})();
