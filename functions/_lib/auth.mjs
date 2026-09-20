import { hashPassword, randomToken, sha256, verifyPassword } from './crypto.mjs';
import { validateProfileInput } from './courses.mjs';
import { createStudentCredentials, findStudentLogin, normalizeLoginIdentifier, validateStudentSignup, verifyStudentPin } from './student-identity.mjs';
import { prepareStudentAcademicProfileInsert } from './school-signup-profile.mjs';
import { HttpError, logEvent } from './http.mjs';

const SESSION_SECONDS = 60 * 60 * 24 * 30;
const DUMMY_PASSWORD_HASH = 'pbkdf2-sha256-p1$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const normalizeEmail = value => String(value || '').trim().normalize('NFKC').toLowerCase();

export function validateStrongPassword(password, signup) {
  if (password.length < 12 || password.length > 256) throw new HttpError(400, 'INVALID_CREDENTIALS', signup ? 'Password must be 12–256 characters and at least medium strength.' : 'Identifier or credential is invalid.');
  if (!signup) return;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9\s]/].reduce((count, pattern) => count + Number(pattern.test(password)), 0);
  if (!(classes >= 3 || (password.length >= 16 && classes >= 2) || password.length >= 20)) {
    throw new HttpError(400, 'WEAK_PASSWORD', 'Use a longer password or combine upper/lowercase letters, numbers, and symbols.');
  }
}

export function validateAccountInput(input, signup = false) {
  if (!signup) {
    const identifier = normalizeLoginIdentifier(input?.identifier ?? input?.email ?? input?.phone ?? input?.studentId, normalizeEmail);
    const credential = String(input?.credential ?? input?.password ?? '');
    const pinMode = /^\d{4}$/.test(credential);
    if (!pinMode) validateStrongPassword(credential, false);
    return { email:`${pinMode ? 'pin:' : ''}${identifier.key}`, password:credential, identifier, pinMode };
  }

  const email = normalizeEmail(input?.email);
  const password = String(input?.password || '');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'INVALID_CREDENTIALS', 'Email is invalid.');
  validateStrongPassword(password, true);
  const displayName = String(input?.displayName || input?.name || '').trim().normalize('NFC').slice(0, 100);
  if (displayName.length < 2) throw new HttpError(400, 'INVALID_DISPLAY_NAME', 'Full name is required.');
  const identity = validateStudentSignup(input);
  const profile = validateProfileInput({ accountType:'student', studentStage:identity.studentStage });
  return { email, password, displayName, ...identity, ...profile };
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

async function rateKey(request, identifier, env) {
  const pepper = String(env.RATE_LIMIT_PEPPER || '');
  if (pepper.length < 32) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Authentication configuration is unavailable.');
  const pinMode = String(identifier || '').startsWith('pin:');
  const normalized = pinMode ? String(identifier).slice(4) : String(identifier || '');
  const scope = pinMode ? 'pin-global' : (request.headers.get('CF-Connecting-IP') || 'local');
  return sha256(`${pepper}\0rate\0${scope}\0${normalized}`);
}
export async function enforceAuthRateLimit(db, request, identifier, env, now = Date.now()) {
  const configured = env.AUTH_ATTEMPT_LIMIT === undefined || env.AUTH_ATTEMPT_LIMIT === '' ? 10 : Number(env.AUTH_ATTEMPT_LIMIT);
  if (!Number.isSafeInteger(configured) || configured < 1 || configured > 1000) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Authentication configuration is unavailable.');
  const attemptLimit = String(identifier || '').startsWith('pin:') ? Math.min(5, configured) : configured;
  const fingerprint = await rateKey(request, identifier, env);
  const windowStart = now - 15 * 60 * 1000;
  const count = await db.prepare('SELECT COUNT(*) AS count FROM auth_attempts WHERE fingerprint = ? AND created_at > ?').bind(fingerprint, windowStart).first();
  if (Number(count?.count || 0) >= attemptLimit) throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.');
  await db.prepare('INSERT INTO auth_attempts (id, fingerprint, created_at) VALUES (?, ?, ?)').bind(crypto.randomUUID(), fingerprint, now).run();
  if (crypto.getRandomValues(new Uint8Array(1))[0] < 3) await db.prepare('DELETE FROM auth_attempts WHERE created_at < ?').bind(now - 86400000).run();
  return fingerprint;
}
export async function clearAuthRateLimit(db, fingerprint) { await db.prepare('DELETE FROM auth_attempts WHERE fingerprint = ?').bind(fingerprint).run(); }

function passwordPepper(env = {}) {
  const pepper = String(env.RATE_LIMIT_PEPPER || '');
  if (pepper.length < 32) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Authentication configuration is unavailable.');
  return pepper;
}
export async function createUser(db, input, env = {}, now = Date.now()) {
  const validated = validateAccountInput(input, true);
  const { email, password, displayName, accountType, studentStage } = validated;
  const existing = await db.prepare('SELECT id FROM users WHERE email_normalized = ?').bind(email).first();
  if (existing) throw new HttpError(409, 'ACCOUNT_UNAVAILABLE', 'An account with these details cannot be created.');
  const id = crypto.randomUUID();
  const pepper = passwordPepper(env);
  const passwordHash = await hashPassword(password, 100000, pepper);
  const credentialsInsert = await createStudentCredentials(db, id, validated, pepper, now);
  const academicProfileInsert = await prepareStudentAcademicProfileInsert(db, id, validated, now);
  const onboardingValue = {
    version:1, required:true, primaryComplete:false, recommendationComplete:false,
    completed:false, createdAt:now
  };
  const onboardingInsert = db.prepare(`INSERT INTO records
    (user_id, record_key, format, value_json, deleted, revision, created_at, updated_at)
    VALUES (?, 'dafatii:onboarding:v1', 'json', ?, 0, 1, ?, ?)`)
    .bind(id, JSON.stringify(onboardingValue), now, now);
  try {
    const userInsert = db.prepare('INSERT INTO users (id, email_normalized, password_hash, display_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, email, passwordHash, displayName, 'active', now, now);
    const profileInsert = db.prepare('INSERT INTO account_profiles (user_id, account_type, student_stage, platform_role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, accountType, studentStage, 'student', now, now);
    await db.batch([userInsert, profileInsert, credentialsInsert, ...(academicProfileInsert ? [academicProfileInsert] : []), onboardingInsert]);
  }
  catch (error) { if (/unique|constraint/i.test(String(error))) throw new HttpError(409, 'ACCOUNT_UNAVAILABLE', 'An account with these details cannot be created.'); throw error; }
  return { id, email, displayName, accountType, studentStage, platformRole:'student' };
}
export async function authenticateUser(db, encodedIdentifier, credential, env = {}) {
  const pinMode = String(encodedIdentifier || '').startsWith('pin:');
  const key = pinMode ? String(encodedIdentifier).slice(4) : String(encodedIdentifier || '');
  const separator = key.indexOf(':');
  const type = separator > 0 ? key.slice(0, separator) : '';
  const value = separator > 0 ? key.slice(separator + 1) : '';
  const kind = type === 'email' ? 'email' : type === 'numeric' ? 'numeric' : type === 'phone' ? 'phone' : '';
  const user = kind ? await findStudentLogin(db, { kind, value }) : null;
  const pepper = passwordPepper(env);
  const validCredential = pinMode
    ? await verifyStudentPin(String(credential || ''), user?.pin_hash, pepper)
    : await verifyPassword(String(credential || ''), user?.password_hash || DUMMY_PASSWORD_HASH, pepper);
  const valid = Boolean(user && user.status === 'active' && validCredential);
  if (!valid) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Identifier or credential is invalid.');
  return { id:user.id, email:user.email_normalized, displayName:user.display_name };
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
  const expiresAt = now + SESSION_SECONDS * 1000;
  const update = context.env.DB.prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?').bind(now, expiresAt, row.session_id).run();
  context.waitUntil?.(update);
  return { id:row.id, email:row.email_normalized, displayName:row.display_name, sessionId:row.session_id, sessionToken:token, expiresAt };
}
export async function revokeCurrentSession(context) {
  try { const user = await requireUser(context); await context.env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').bind(Date.now(), user.sessionId).run(); return true; }
  catch (error) { if (error.status === 401) return false; throw error; }
}
