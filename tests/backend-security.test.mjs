import assert from 'node:assert/strict';
import { generateKeyPairSync, verify as verifySignature, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';

globalThis.crypto ||= webcrypto;
const { requireUser, clearSessionCookie, enforceAuthRateLimit, sessionCookie } = await import('../functions/_lib/auth.mjs');
const { hashPassword, verifyPassword } = await import('../functions/_lib/crypto.mjs');
const { ownedFile } = await import('../functions/_lib/access.mjs');
const { canonicalQuery, completionDisposition, signV4, verifyCompletedObject, verifyMagicBytes } = await import('../functions/_lib/gcs.mjs');
const { canConvertLegacyOffice, convertLegacyOfficeToPdf, driveObjectId, isDriveObject, startDriveUpload, streamDriveFile, validDriveId, verifyDriveMetadata } = await import('../functions/_lib/drive.mjs');
const { encodePath } = await import('../functions/_lib/encoding.mjs');
const { isUuid, objectKey, positiveIntegerSetting, sanitizeFilename, validateRecord, validateUpload } = await import('../functions/_lib/policy.mjs');
const { translateInterfaceText, validateTranslationInput } = await import('../functions/_lib/translate.mjs');

function statement(firstValue) {
  return { bind(...values) { this.values = values; return this; }, async first() { return typeof firstValue === 'function' ? firstValue(this.values) : firstValue; }, async run() { return { meta: { changes: 1 } }; } };
}
const context = (request, firstValue = null) => ({ request, env: { DB: { prepare: () => statement(firstValue) } }, waitUntil() {} });

await assert.rejects(() => requireUser(context(new Request('https://dafatii.example/api/v1/files/a'))), error => error.status === 401 && error.code === 'AUTHENTICATION_REQUIRED');
await assert.rejects(() => requireUser(context(new Request('https://dafatii.example/api/v1/auth/session', { headers: { cookie: '__Host-dafatii_session=' + 'a'.repeat(43) } }))), error => error.status === 401 && error.code === 'INVALID_SESSION');
const passwordHash = await hashPassword('correct horse battery staple', 100000);
assert.equal(await verifyPassword('correct horse battery staple', passwordHash), true);
assert.equal(await verifyPassword('wrong password', passwordHash), false);
await assert.rejects(() => hashPassword('correct horse battery staple', 600000), /100000/);
const passwordPepper = 'preview-pepper-that-is-at-least-32-characters';
const pepperedHash = await hashPassword('correct horse battery staple', 100000, passwordPepper);
assert.equal(await verifyPassword('correct horse battery staple', pepperedHash, passwordPepper), true);
assert.equal(await verifyPassword('correct horse battery staple', pepperedHash, 'different-pepper-that-is-at-least-32-characters'), false);

const files = new Map([['file-a:user-a', { id: 'file-a', user_id: 'user-a', status: 'available' }]]);
const db = { prepare: () => statement(values => files.get(`${values[0]}:${values[1]}`) || null) };
assert.equal((await ownedFile(db, 'user-a', 'file-a')).id, 'file-a');
await assert.rejects(() => ownedFile(db, 'user-b', 'file-a'), error => error.status === 404);

assert.throws(() => validateUpload({ filename: 'large.pdf', contentType: 'application/pdf', size: 101 }, { MAX_UPLOAD_BYTES: 100 }), error => error.code === 'FILE_TOO_LARGE');
assert.throws(() => validateUpload({ filename: 'attack.svg', contentType: 'image/svg+xml', size: 20 }), error => error.code === 'FILE_TYPE_NOT_ALLOWED');
assert.throws(() => validateUpload({ filename: 'large.pdf', contentType: 'application/pdf', size: 101 }, { MAX_UPLOAD_BYTES: 'not-a-number' }), error => error.code === 'CONFIGURATION_ERROR');
assert.throws(() => positiveIntegerSetting('0', 10), error => error.code === 'CONFIGURATION_ERROR');
assert.deepEqual(validateTranslationInput({ texts: ['Dashboard'], source: 'en', target: 'ar' }), { texts: ['Dashboard'], source: 'en', target: 'ar' });
assert.throws(() => validateTranslationInput({ texts: Array(41).fill('x') }), error => error.code === 'INVALID_TRANSLATION_BATCH');
assert.equal(sanitizeFilename('../ lecture\u0000.pdf'), '.._ lecture_.pdf');
assert.throws(() => objectKey('../../victim', crypto.randomUUID()));
const uid = crypto.randomUUID(), fid = crypto.randomUUID();
assert.equal(isUuid(uid), true);
assert.equal(isUuid('------------------------------------'), false);
assert.equal(objectKey(uid, fid), `users/${uid}/${fid}/object`);
await assert.rejects(() => enforceAuthRateLimit({}, new Request('https://dafatii.example/api/v1/auth/login'), 'user@example.com', {}), error => error.code === 'CONFIGURATION_ERROR');

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

const driveEnv = { GOOGLE_DRIVE_CLIENT_ID: 'client-id', GOOGLE_DRIVE_CLIENT_SECRET: 'client-secret', GOOGLE_DRIVE_REFRESH_TOKEN: 'refresh-token', GOOGLE_DRIVE_FOLDER_ID: 'folder-1234567890' };
const driveDbFile = { id: fid, user_id: uid, course_id: null, object_key: `drive/pending/${fid}`, original_filename: 'lecture.pdf', content_type: 'application/pdf', expected_size: 42 };
const originalFetch = globalThis.fetch;
let driveCalls = [];
globalThis.fetch = async (url, init = {}) => {
  driveCalls.push({ url: String(url), init });
  if (String(url).includes('oauth2.googleapis.com')) return new Response(JSON.stringify({ access_token: 'short-lived-access', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (String(url).includes('/upload/drive/v3/files')) return new Response(null, { status: 200, headers: { Location: 'https://www.googleapis.com/upload/session-safe-id' } });
  if (String(url).includes('/upload/session-safe-id')) return new Response(JSON.stringify({ id: 'converted-file-1234567890', mimeType: 'application/vnd.google-apps.presentation' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (String(url).includes('/export?')) return new Response(new TextEncoder().encode('%PDF-preview'), { status: 200, headers: { 'Content-Type': 'application/pdf' } });
  if (init.method === 'DELETE') return new Response(null, { status: 204 });
  if (String(url).includes('alt=media')) return new Response(new TextEncoder().encode('%PDF-1.7'), { status: 206, headers: { 'Content-Range': 'bytes 0-7/42', 'Content-Length': '8' } });
  throw new Error(`Unexpected Drive test request: ${url}`);
};
const driveUploadUrl = await startDriveUpload(driveEnv, driveDbFile, uid);
assert.equal(driveUploadUrl, 'https://www.googleapis.com/upload/session-safe-id');
assert.equal(driveCalls[1].init.headers.get('Authorization'), 'Bearer short-lived-access');
assert.ok(!driveCalls[1].init.body.includes('client-secret'));
const driveMetadata = { id: 'drive-file-1234567890', size: '42', mimeType: 'application/pdf', parents: [driveEnv.GOOGLE_DRIVE_FOLDER_ID], trashed: false, appProperties: { dafatiiFileId: fid, dafatiiUserId: uid, dafatiiCourseId: '' } };
assert.equal(verifyDriveMetadata(driveEnv, driveDbFile, driveMetadata, uid).size, 42);
assert.throws(() => verifyDriveMetadata(driveEnv, driveDbFile, { ...driveMetadata, parents: ['another-folder'] }, uid), error => error.code === 'UPLOAD_MISMATCH');
assert.equal(isDriveObject('drive/drive-file-1234567890'), true);
assert.equal(driveObjectId('drive/drive-file-1234567890'), 'drive-file-1234567890');
assert.equal(driveObjectId(`drive/pending/${fid}`), null);
assert.equal(validDriveId('drive-file-1234567890'), true);
const streamed = await streamDriveFile(driveEnv, { ...driveDbFile, object_key: 'drive/drive-file-1234567890' }, new Request('https://dafatii.example/file', { headers: { Range: 'bytes=0-7' } }));
assert.equal(streamed.status, 206);
assert.equal(streamed.headers.get('content-type'), 'application/pdf');
assert.match(streamed.headers.get('content-disposition'), /lecture\.pdf/);
assert.equal(canConvertLegacyOffice('application/vnd.ms-powerpoint'), true);
assert.equal(canConvertLegacyOffice('application/vnd.openxmlformats-officedocument.presentationml.presentation'), false);
const previewBytes = await convertLegacyOfficeToPdf(driveEnv, { ...driveDbFile, object_key: 'drive/drive-file-1234567890', original_filename: 'lecture.ppt', content_type: 'application/vnd.ms-powerpoint', expected_size: 8 });
assert.equal(new TextDecoder().decode(previewBytes), '%PDF-preview');
assert.equal(driveCalls.some(call => call.url.includes('/export?mimeType=application%2Fpdf')), true);
assert.equal(driveCalls.some(call => call.init.method === 'DELETE' && call.url.includes('converted-file-1234567890')), true);
globalThis.fetch = originalFetch;

globalThis.fetch = async (url, init) => {
  assert.match(String(url), /^https:\/\/translation\.googleapis\.com\/language\/translate\/v2\?key=/);
  assert.equal(JSON.parse(init.body).target, 'ar');
  return new Response(JSON.stringify({ data: { translations: [{ translatedText: 'لوحة التحكم' }] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
assert.deepEqual(await translateInterfaceText({ GOOGLE_TRANSLATE_API_KEY: 'secret-translation-key' }, { texts: ['Dashboard'], source: 'en', target: 'ar' }), ['لوحة التحكم']);
await assert.rejects(() => translateInterfaceText({}, { texts: ['Dashboard'], source: 'en', target: 'ar' }), error => error.code === 'TRANSLATION_NOT_CONFIGURED');
globalThis.fetch = originalFetch;

assert.match(sessionCookie(new Request('https://dafatii.example/'), 'token'), /HttpOnly; Secure; SameSite=Lax/);
assert.match(clearSessionCookie(new Request('https://dafatii.example/')), /Max-Age=0/);
assert.throws(() => validateRecord({ key: 'dafatii:theme', format: 'string', value: 'dark' }), error => error.code === 'INVALID_RECORD_KEY');
assert.equal(validateRecord({ key: 'dafatii:subjects', format: 'json', value: [] }).valueJson, '[]');

const migration = readFileSync(new URL('../migrations/0001_production_backend.sql', import.meta.url), 'utf8');
assert.match(migration, /PRIMARY KEY \(user_id, record_key\)/);
assert.match(migration, /last_mutation_id TEXT/);
assert.match(migration, /object_key TEXT NOT NULL UNIQUE/);
assert.match(migration, /REFERENCES users\(id\) ON DELETE CASCADE/g);
const apiRouter = readFileSync(new URL('../functions/api/v1/[[path]].js', import.meta.url), 'utf8');
assert.match(apiRouter, /const chatAttachment = purpose === 'chat-attachment'/, 'chat attachments must be recognized as a dedicated storage purpose');
assert.match(apiRouter, /const hearingAudio = purpose === 'language-hearing-audio'/, 'hearing audio must have a dedicated upload purpose');
assert.match(apiRouter, /const r2Upload = hearingAudio/, 'hearing audio must bypass Drive and use R2');
assert.match(apiRouter, /const driveUpload = !r2Upload && \(teacherProfile \|\| chatAttachment \|\| usesDrive\(context\.env\)\)/, 'all non-hearing uploads must preserve the existing Drive provider behavior');
assert.match(apiRouter, /isR2HearingObject\(file\.object_key\)[\s\S]*uploadR2HearingAudio/, 'hearing audio upload requests must be handled by R2');
assert.match(apiRouter, /provider: 'r2-proxy'/, 'hearing audio must use the authenticated same-origin R2 upload route');
assert.match(apiRouter, /verifyMagicBytes\(file\.content_type,[\s\S]*prefix\.arrayBuffer/, 'R2 hearing audio must be magic-byte verified before publication');
assert.match(apiRouter, /isDriveObject\(file\.object_key\) \|\| isR2HearingObject\(file\.object_key\)/, 'view URLs must support both Drive and R2 hearing audio');
assert.match(apiRouter, /Accept-Ranges':'bytes'/, 'R2 hearing audio playback must support browser range requests');
assert.doesNotMatch(apiRouter, /language\/video-understanding|language\/pronunciation|gradeVideoUnderstanding|gradePronunciation/, 'retired language grading routes must stay deleted');
const courseLibrarySource = readFileSync(new URL('../functions/_lib/courses.mjs', import.meta.url), 'utf8');
const courseContentKeysSource = courseLibrarySource.match(/COURSE_CONTENT_KEYS = new Set\(\[([\s\S]*?)\]\)/)?.[1] || '';
assert.doesNotMatch(courseContentKeysSource, /dafatii:language-(?:learning|content|authoring)/, 'removed language records must not be accepted by the course backend');
assert.match(courseLibrarySource, /async function purgeRetiredCourseProduct\(db\)/, 'retired course product data cleanup must remain active');
assert.match(courseLibrarySource, /UPDATE files SET course_id = NULL WHERE course_id = \?/, 'retired course cleanup must detach files before deleting courses');
assert.match(courseLibrarySource, /DELETE FROM courses WHERE id = \?/, 'retired course cleanup must delete the course root');
const courseRoutesSource = readFileSync(new URL('../functions/_lib/course-routes.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(courseRoutesSource, /languageCourse|language course/i, 'course enrollment must not contain language-course special behavior');
assert.doesNotMatch(readFileSync(new URL('../course-modes.js', import.meta.url), 'utf8'), /GEMINI_API_KEY|gradeVideoUnderstanding|gradePronunciation|language-home|language-learning|Create Language course/, 'removed language course frontend must stay out of the browser bundle');
const headers = readFileSync(new URL('../_headers', import.meta.url), 'utf8');
assert.match(headers, /Content-Security-Policy:/);
assert.match(headers, /frame-ancestors 'none'/);
console.log('backend security tests passed');
