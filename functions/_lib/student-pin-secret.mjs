import { hashPassword, verifyPassword } from './crypto.mjs';
import { base64url, fromBase64, utf8 } from './encoding.mjs';
import { ensureStudentCredentialsSchema } from './student-identity.mjs';
import { HttpError } from './http.mjs';

const PIN_PREFIX = 'dafatii-pin-credential:';
const DUMMY_PASSWORD_HASH = 'pbkdf2-sha256-p1$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const decoder = new TextDecoder();
let secretSchemaReady = false;

function pepperValue(env = {}) {
  const pepper = String(env.RATE_LIMIT_PEPPER || '');
  if (pepper.length < 32) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Authentication configuration is unavailable.');
  return pepper;
}

async function ensurePinSecretSchema(db) {
  if (secretSchemaReady) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS student_pin_secrets (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sealed_pin TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  secretSchemaReady = true;
}

async function secretKey(pepper) {
  const material = await crypto.subtle.digest('SHA-256', utf8(`${pepper}\0student-pin-secret-v1`));
  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function sealPin(pin, userId, pepper) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name:'AES-GCM', iv, additionalData:utf8(`dafatii:${userId}:pin`) }, await secretKey(pepper), utf8(pin));
  return `v1.${base64url(iv)}.${base64url(encrypted)}`;
}

async function openPin(sealed, userId, pepper) {
  const [version, ivText, cipherText] = String(sealed || '').split('.');
  if (version !== 'v1' || !ivText || !cipherText) throw new HttpError(503, 'PIN_SECRET_UNAVAILABLE', 'PIN secret is unavailable.');
  try {
    const decrypted = await crypto.subtle.decrypt({ name:'AES-GCM', iv:fromBase64(ivText), additionalData:utf8(`dafatii:${userId}:pin`) }, await secretKey(pepper), fromBase64(cipherText));
    const pin = decoder.decode(decrypted);
    if (!/^\d{4}$/.test(pin)) throw new Error('invalid pin payload');
    return pin;
  } catch {
    throw new HttpError(503, 'PIN_SECRET_UNAVAILABLE', 'PIN secret is unavailable.');
  }
}

function newPin() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `${(bytes[0] % 9) + 1}${bytes[1] % 10}${bytes[2] % 10}${bytes[3] % 10}`;
}

export async function revealStudentPin(db, userId, password, env = {}, now = Date.now()) {
  const pepper = pepperValue(env);
  const suppliedPassword = String(password || '');
  if (!suppliedPassword || suppliedPassword.length > 256) throw new HttpError(401, 'INVALID_PASSWORD', 'Password is incorrect.');

  const user = await db.prepare('SELECT password_hash, status FROM users WHERE id = ?').bind(userId).first();
  const passwordValid = await verifyPassword(suppliedPassword, user?.password_hash || DUMMY_PASSWORD_HASH, pepper);
  if (!user || user.status !== 'active' || !passwordValid) throw new HttpError(401, 'INVALID_PASSWORD', 'Password is incorrect.');

  await ensureStudentCredentialsSchema(db);
  await ensurePinSecretSchema(db);
  const credentials = await db.prepare('SELECT pin_hash FROM student_credentials WHERE user_id = ?').bind(userId).first();
  if (!credentials) throw new HttpError(404, 'STUDENT_CREDENTIALS_NOT_FOUND', 'Student credentials are not available for this account.');

  const existing = await db.prepare('SELECT sealed_pin FROM student_pin_secrets WHERE user_id = ?').bind(userId).first();
  if (existing?.sealed_pin) return { pin:await openPin(existing.sealed_pin, userId, pepper), rotated:false };

  const pin = newPin();
  const pinHash = await hashPassword(`${PIN_PREFIX}${pin}`, 100000, pepper);
  const sealedPin = await sealPin(pin, userId, pepper);
  const updateCredentials = db.prepare('UPDATE student_credentials SET pin_hash = ?, updated_at = ? WHERE user_id = ?').bind(pinHash, now, userId);
  const insertSecret = db.prepare('INSERT INTO student_pin_secrets (user_id, sealed_pin, created_at, updated_at) VALUES (?, ?, ?, ?)').bind(userId, sealedPin, now, now);
  const results = await db.batch([updateCredentials, insertSecret]);
  if (!results[0].meta?.changes || !results[1].meta?.changes) throw new HttpError(503, 'PIN_SECRET_UNAVAILABLE', 'PIN could not be prepared.');
  return { pin, rotated:true };
}
