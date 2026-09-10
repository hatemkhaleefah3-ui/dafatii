import assert from 'node:assert/strict';
import { generateKeyPairSync, verify as verifySignature, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';

globalThis.crypto ||= webcrypto;
const { requireUser, clearSessionCookie, sessionCookie } = await import('../functions/_lib/auth.mjs');
const { hashPassword, verifyPassword } = await import('../functions/_lib/crypto.mjs');
const { ownedFile } = await import('../functions/_lib/access.mjs');
const { canonicalQuery, completionDisposition, signV4, verifyCompletedObject, verifyMagicBytes } = await import('../functions/_lib/gcs.mjs');
const { encodePath } = await import('../functions/_lib/encoding.mjs');
const { objectKey, sanitizeFilename, validateRecord, validateUpload } = await import('../functions/_lib/policy.mjs');

function statement(firstValue) {
  return { bind(...values) { this.values = values; return this; }, async first() { return typeof firstValue === 'function' ? firstValue(this.values) : firstValue; }, async run() { return { meta: { changes: 1 } }; } };
}
const context = (request, firstValue = null) => ({ request, env: { DB: { prepare: () => statement(firstValue) } }, waitUntil() {} });

await assert.rejects(() => requireUser(context(new Request('https://dafatii.example/api/v1/files/a'))), error => error.status === 401 && error.code === 'AUTHENTICATION_REQUIRED');
await assert.rejects(() => requireUser(context(new Request('https://dafatii.example/api/v1/auth/session', { headers: { cookie: '__Host-dafatii_session=' + 'a'.repeat(43) } }))), error => error.status === 401 && error.code === 'INVALID_SESSION');
const passwordHash = await hashPassword('correct horse battery staple', 100000);
assert.equal(await verifyPassword('correct horse battery staple', passwordHash), true);
assert.equal(await verifyPassword('wrong password', passwordHash), false);

const files = new Map([['file-a:user-a', { id: 'file-a', user_id: 'user-a', status: 'available' }]]);
const db = { prepare: () => statement(values => files.get(`${values[0]}:${values[1]}`) || null) };
assert.equal((await ownedFile(db, 'user-a', 'file-a')).id, 'file-a');
await assert.rejects(() => ownedFile(db, 'user-b', 'file-a'), error => error.status === 404);

assert.throws(() => validateUpload({ filename: 'large.pdf', contentType: 'application/pdf', size: 101 }, { MAX_UPLOAD_BYTES: 100 }), error => error.code === 'FILE_TOO_LARGE');
assert.throws(() => validateUpload({ filename: 'attack.svg', contentType: 'image/svg+xml', size: 20 }), error => error.code === 'FILE_TYPE_NOT_ALLOWED');
assert.equal(sanitizeFilename('../ lecture\u0000.pdf'), '.._ lecture_.pdf');
assert.throws(() => objectKey('../../victim', crypto.randomUUID()));
const uid = crypto.randomUUID(), fid = crypto.randomUUID();
assert.equal(objectKey(uid, fid), `users/${uid}/${fid}/object`);

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const signed = await signV4({ method: 'GET', bucket: 'private bucket', object: 'users/' + uid + '/' + fid + '/محاضرة #1.pdf', clientEmail: 'svc@example.iam.gserviceaccount.com', privateKey: pem, expires: 600, now: new Date('2026-09-10T10:11:12Z'), query: { 'response-content-disposition': "inline; filename*=UTF-8''notes%20%231.pdf" } });
assert.match(signed.url, /X-Goog-Expires=600/);
assert.ok(!signed.url.includes(' '));
assert.match(signed.url, /%D9%85%D8%AD%D8%A7%D8%B6%D8%B1%D8%A9%20%231\.pdf/);
assert.equal(canonicalQuery({ z: 'a b', a: "!*'" }), 'a=%21%2A%27&z=a%20b');
assert.equal(encodePath('folder/a b#c/ملف.pdf'), 'folder/a%20b%23c/%D9%85%D9%84%D9%81.pdf');
assert.match(signed.canonicalRequest, /host:storage\.googleapis\.com\n\nhost\nUNSIGNED-PAYLOAD$/);
const signatureHex = new URL(signed.url).searchParams.get('X-Goog-Signature');
const signature = Uint8Array.from(signatureHex.match(/../g), pair => parseInt(pair, 16));
assert.equal(verifySignature('RSA-SHA256', Buffer.from(signed.stringToSign), publicKey, signature), true);
await assert.rejects(() => signV4({ method: 'GET', bucket: 'x', object: 'x', clientEmail: 'x', privateKey: pem, expires: 604801 }), RangeError);

const headerMap = values => new Headers(values);
const file = { id: fid, expected_size: 42, content_type: 'application/pdf' };
assert.equal(verifyCompletedObject(file, headerMap({ 'content-length': '42', 'content-type': 'application/pdf', 'x-goog-meta-dafatii-file-id': fid })).size, 42);
assert.throws(() => verifyCompletedObject(file, headerMap({ 'content-length': '42', 'content-type': 'application/pdf', 'x-goog-meta-dafatii-file-id': crypto.randomUUID() })), error => error.code === 'UPLOAD_MISMATCH');
assert.equal(verifyMagicBytes('application/pdf', new TextEncoder().encode('%PDF-1.7')), true);
assert.throws(() => verifyMagicBytes('application/pdf', new TextEncoder().encode('<html>')), error => error.code === 'FILE_CONTENT_MISMATCH');
assert.equal(completionDisposition('available'), 'already_complete');
assert.equal(completionDisposition('pending'), 'verify');
assert.throws(() => completionDisposition('upload_failed'), error => error.status === 409);

assert.match(sessionCookie(new Request('https://dafatii.example/'), 'token'), /HttpOnly; Secure; SameSite=Lax/);
assert.match(clearSessionCookie(new Request('https://dafatii.example/')), /Max-Age=0/);
assert.throws(() => validateRecord({ key: 'dafatii:theme', format: 'string', value: 'dark' }), error => error.code === 'INVALID_RECORD_KEY');
assert.equal(validateRecord({ key: 'dafatii:subjects', format: 'json', value: [] }).valueJson, '[]');

const migration = readFileSync(new URL('../migrations/0001_production_backend.sql', import.meta.url), 'utf8');
assert.match(migration, /PRIMARY KEY \(user_id, record_key\)/);
assert.match(migration, /last_mutation_id TEXT/);
assert.match(migration, /object_key TEXT NOT NULL UNIQUE/);
assert.match(migration, /REFERENCES users\(id\) ON DELETE CASCADE/g);
console.log('backend security tests passed');
