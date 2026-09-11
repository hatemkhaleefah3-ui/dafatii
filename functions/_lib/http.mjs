export class HttpError extends Error {
  constructor(status, code, message, details) { super(message); this.status = status; this.code = code; this.details = details; }
}

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff'
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}
export const ok = (data, status = 200, headers = {}) => json({ ok: true, data }, status, headers);
export const fail = error => json({ ok: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.status ? error.message : 'An internal error occurred.', ...(error.details ? { details: error.details } : {}) } }, error.status || 500);

export async function readJson(request, maxBytes = 1048576) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maxBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  if (!String(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'INVALID_JSON', 'Request body is not valid JSON.'); }
}

export function assertSameOrigin(request, env) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  if (!origin) throw new HttpError(403, 'ORIGIN_REQUIRED', 'A valid Origin header is required.');
  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set([requestOrigin, ...String(env.APP_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean)]);
  if (!allowed.has(origin)) throw new HttpError(403, 'ORIGIN_REJECTED', 'Request origin is not allowed.');
}

export function logEvent(level, event, fields = {}) {
  const clean = Object.fromEntries(Object.entries(fields).filter(([key, value]) => value !== undefined && !/password|token|private|signed.?url|secret/i.test(key)));
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](JSON.stringify({ ts: new Date().toISOString(), event, ...clean }));
}
