import { base64url, fromBase64, hex, utf8 } from './encoding.mjs';

export async function sha256(value) {
  return hex(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? utf8(value) : value));
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64url(value);
}

export async function hashPassword(password, iterations = 600000) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw new TypeError('Password must be 12–256 characters.');
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey('raw', utf8(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return `pbkdf2-sha256$${iterations}$${base64url(salt)}$${base64url(bits)}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, count, saltText, expectedText] = String(encoded).split('$');
    const iterations = Number(count);
    if (algorithm !== 'pbkdf2-sha256' || !Number.isInteger(iterations) || iterations < 100000 || iterations > 2000000) return false;
    const salt = fromBase64(saltText);
    const expected = fromBase64(expectedText);
    const key = await crypto.subtle.importKey('raw', utf8(password), 'PBKDF2', false, ['deriveBits']);
    const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.byteLength * 8));
    if (actual.byteLength !== expected.byteLength) return false;
    let mismatch = 0;
    for (let index = 0; index < actual.byteLength; index += 1) mismatch |= actual[index] ^ expected[index];
    return mismatch === 0;
  } catch { return false; }
}

export async function importRsaPrivateKey(pem) {
  const body = String(pem).replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  if (!body) throw new TypeError('GCS_PRIVATE_KEY is not a PKCS#8 private key.');
  return crypto.subtle.importKey('pkcs8', fromBase64(body), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

