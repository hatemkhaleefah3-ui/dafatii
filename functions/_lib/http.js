export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message); this.status = status; this.code = code; this.details = details;
  }
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}

export function errorResponse(error, requestId) {
  const status = error instanceof ApiError ? error.status : 500;
  const code = error instanceof ApiError ? error.code : 'internal_error';
  const message = error instanceof ApiError ? error.message : 'An internal error occurred.';
  return json({ error: { code, message, ...(error.details ? { details: error.details } : {}), requestId } }, status);
}

export async function readJson(request, maxBytes = 262144) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maxBytes) throw new ApiError(413, 'request_too_large', 'Request body is too large.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new ApiError(413, 'request_too_large', 'Request body is too large.');
  try { return text ? JSON.parse(text) : {}; }
  catch { throw new ApiError(400, 'invalid_json', 'Request body must be valid JSON.'); }
}

export function requireSameOrigin(request, env) {
  if (!['POST','PUT','PATCH','DELETE'].includes(request.method)) return;
  const origin = request.headers.get('Origin');
  if (!origin) return;
  const allowed = String(env.APP_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin && !allowed.includes(origin)) throw new ApiError(403, 'origin_rejected', 'Request origin is not allowed.');
}

export function logEvent(event, fields = {}) {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...fields }));
}
