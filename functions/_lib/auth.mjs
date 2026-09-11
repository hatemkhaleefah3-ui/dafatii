import { hashPassword, randomToken, sha256, verifyPassword } from './crypto.mjs';
import { HttpError, logEvent } from './http.mjs';

const SESSION_SECONDS = 60 * 60 * 24 * 30;
const DUMMY_PASSWORD_HASH = 'pbkdf2-sha256$600000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const normalizeEmail = value => String(value || '').trim().normalize('NFKC').toLowerCase();
export function validateAccountInput(input, signup = false) {
  const email = normalizeEmail(input?.email);
  const password = String(input?.password || '');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'INVALID_CREDENTIALS', 'Email or password is invalid.');
  if (password.length < 12 || password.length > 256) throw new HttpError(400, 'INVALID_CREDENTIALS', signup ? 'Password must be 12–256 characters.' : 'Email or password is invalid.');
  const displayName = String(input?.displayName || input?.name || '').trim().normalize('NFC').slice(0, 100);
  if (signup && !displayName) throw new HttpError(400, 'INVALID_DISPLAY_NAME', 'Display name is required.');
  return { email, password, displayName };
}
function cookieName(request) { return new URL(request.url).protocol === 'https:' ? '__Host-dafatii_session' : 'dafatii_session'; }
function parseCookies(request) {
  return Object.fromEntries(String(request.headers.get('cookie') || '').split(';').map(v => v.trim().split(/=(.*)/s)).filter(parts => parts[0]).map(([key, value]) => [key, value]));
}
export function sessionCookie(request, token, maxAge = SESSION_SECONDS) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${cookieName(request)}=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAge}`;
}
export const clearSessionCookie = request => sessionCookie(request, '', 0);

async function rateKey(request, email, env) {
  const pepper = String(env.RATE_LIMIT_PEPPER || '');
  if (pepper.length < 32) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Authentication configuration is unavailable.');
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  return sha256(`${pepper}\0${ip}\0${email}`);
}
export async function enforceAuthRateLimit(db, request, email, env, now = Date.now()) {
  const attemptLimit = env.AUTH_ATTEMPT_LIMIT === undefined || env.AUTH_ATTEMPT_LIMIT === '' ? 10 : Number(env.AUTH_ATTEMPT_LIMIT);
  if (!Number.isSafeInteger(attemptLimit) || attemptLimit < 1 || attemptLimit > 1000) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Authentication configuration is unavailable.');
  const fingerprint = await rateKey(request, email, env);
  const windowStart = now - 15 * 60 * 1000;
  const count = await db.prepare('SELECT COUNT(*) AS count FROM auth_attempts WHERE fingerprint = ? AND created_at > ?').bind(fingerprint, windowStart).first();
  if (Number(count?.count || 0) >= attemptLimit) throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.');
  await db.prepare('INSERT INTO auth_attempts (id, fingerprint, created_at) VALUES (?, ?, ?)').bind(crypto.randomUUID(), fingerprint, now).run();
  if (crypto.getRandomValues(new Uint8Array(1))[0] < 3) await db.prepare('DELETE FROM auth_attempts WHERE created_at < ?').bind(now - 86400000).run();
  return fingerprint;
}
export async function clearAuthRateLimit(db, fingerprint) { await db.prepare('DELETE FROM auth_attempts WHERE fingerprint = ?').bind(fingerprint).run(); }

export async function createUser(db, input, now = Date.now()) {
  const { email, password, displayName } = validateAccountInput(input, true);
  const existing = await db.prepare('SELECT id FROM users WHERE email_normalized = ?').bind(email).first();
  if (existing) throw new HttpError(409, 'ACCOUNT_UNAVAILABLE', 'An account with these details cannot be created.');
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  try { await db.prepare('INSERT INTO users (id, email_normalized, password_hash, display_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, email, passwordHash, displayName, 'active', now, now).run(); }
  catch (error) { if (/unique|constraint/i.test(String(error))) throw new HttpError(409, 'ACCOUNT_UNAVAILABLE', 'An account with these details cannot be created.'); throw error; }
  return { id, email, displayName };
}
export async function authenticateUser(db, email, password) {
  const user = await db.prepare('SELECT id, email_normalized, password_hash, display_name, status FROM users WHERE email_normalized = ?').bind(normalizeEmail(email)).first();
  const passwordValid = await verifyPassword(String(password || ''), user?.password_hash || DUMMY_PASSWORD_HASH);
  const valid = Boolean(user && user.status === 'active' && passwordValid);
  if (!valid) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is invalid.');
  return { id: user.id, email: user.email_normalized, displayName: user.display_name };
}
export async function createSession(db, userId, request, now = Date.now()) {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = now + SESSION_SECONDS * 1000;
  await db.prepare('INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), userId, tokenHash, now, now, expiresAt).run();
  if (crypto.getRandomValues(new Uint8Array(1))[0] < 3) await db.prepare('DELETE FROM sessions WHERE expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)').bind(now - 86400000, now - 7 * 86400000).run();
  return { token, expiresAt, cookie: sessionCookie(request, token) };
}
export async function requireUser(context) {
  const request = context.request;
  const cookies = parseCookies(request);
  const token = cookies[cookieName(request)];
  if (!token || token.length < 40) throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.');
  const tokenHash = await sha256(token);
  const now = Date.now();
  const row = await context.env.DB.prepare(`SELECT u.id, u.email_normalized, u.display_name, s.id AS session_id, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND u.status = 'active'`).bind(tokenHash, now).first();
  if (!row) { logEvent('warn', 'auth.invalid_session'); throw new HttpError(401, 'INVALID_SESSION', 'Session is invalid or expired.'); }
  const update = context.env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(now, row.session_id).run();
  context.waitUntil?.(update);
  return { id: row.id, email: row.email_normalized, displayName: row.display_name, sessionId: row.session_id };
}
export async function revokeCurrentSession(context) {
  try { const user = await requireUser(context); await context.env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').bind(Date.now(), user.sessionId).run(); return true; }
  catch (error) { if (error.status === 401) return false; throw error; }
}
