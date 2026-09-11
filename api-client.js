(() => {
  'use strict';
  const BASE = '/api/v1';
  class ApiError extends Error {
    constructor(status, code, message, details) { super(message); this.name = 'DafatiiApiError'; this.status = status; this.code = code; this.details = details; }
  }
  const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  async function request(path, options = {}) {
    const attempts = options.idempotent ? 4 : 1;
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(`${BASE}${path}`, {
          method: options.method || 'GET', credentials: 'include', signal: options.signal,
          headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
          body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const error = new ApiError(response.status, payload?.error?.code || 'HTTP_ERROR', payload?.error?.message || `Request failed (${response.status}).`, payload?.error?.details);
          if (![408, 425, 429].includes(response.status) && response.status < 500) throw error;
          lastError = error;
        } else return payload?.data;
      } catch (error) {
        if (error.name === 'AbortError' || (error instanceof ApiError && error.status < 500 && ![408, 425, 429].includes(error.status))) throw error;
        lastError = error;
      }
      if (attempt + 1 < attempts) await delay(Math.min(4000, 250 * (2 ** attempt)) * (0.75 + Math.random() * 0.5));
    }
    throw lastError;
  }
  window.DafatiiApi = Object.freeze({ request, ApiError });
})();

