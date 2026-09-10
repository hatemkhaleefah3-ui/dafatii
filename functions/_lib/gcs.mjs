import { importRsaPrivateKey, sha256 } from './crypto.mjs';
import { encodePath, hex, rfc3986, utf8 } from './encoding.mjs';
import { HttpError } from './http.mjs';

const MAX_EXPIRY = 604800;
function timestamp(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function canonicalValue(value) { return String(value).trim().replace(/\s+/g, ' '); }
export function canonicalQuery(parameters) {
  return Object.entries(parameters).flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map(item => [rfc3986(key), rfc3986(item)]))
    .sort(([ak, av], [bk, bv]) => ak < bk ? -1 : ak > bk ? 1 : av < bv ? -1 : av > bv ? 1 : 0).map(([key, value]) => `${key}=${value}`).join('&');
}
export function canonicalizeHeaders(headers) {
  const entries = Object.entries(headers).map(([key, value]) => [key.toLowerCase().trim(), canonicalValue(value)]).sort(([a], [b]) => a.localeCompare(b));
  return { canonical: entries.map(([key, value]) => `${key}:${value}\n`).join(''), signed: entries.map(([key]) => key).join(';') };
}
export async function signV4({ method, bucket, object, clientEmail, privateKey, expires = 600, headers = {}, query = {}, now = new Date() }) {
  if (!bucket || !clientEmail || !privateKey) throw new TypeError('GCS signing configuration is incomplete.');
  if (!Number.isInteger(expires) || expires < 1 || expires > MAX_EXPIRY) throw new RangeError('Signed URL expiry must be 1–604800 seconds.');
  const host = 'storage.googleapis.com';
  const dateTime = timestamp(now);
  const date = dateTime.slice(0, 8);
  const scope = `${date}/auto/storage/goog4_request`;
  const canonicalUri = `/${encodePath(bucket)}/${encodePath(object)}`;
  const normalizedHeaders = canonicalizeHeaders({ ...headers, host });
  const parameters = {
    ...query,
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': `${clientEmail}/${scope}`,
    'X-Goog-Date': dateTime,
    'X-Goog-Expires': String(expires),
    'X-Goog-SignedHeaders': normalizedHeaders.signed
  };
  const queryString = canonicalQuery(parameters);
  const canonicalRequest = `${method.toUpperCase()}\n${canonicalUri}\n${queryString}\n${normalizedHeaders.canonical}\n${normalizedHeaders.signed}\nUNSIGNED-PAYLOAD`;
  const stringToSign = `GOOG4-RSA-SHA256\n${dateTime}\n${scope}\n${await sha256(canonicalRequest)}`;
  const key = await importRsaPrivateKey(privateKey);
  const signature = hex(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(stringToSign)));
  return { url: `https://${host}${canonicalUri}?${queryString}&X-Goog-Signature=${signature}`, canonicalRequest, stringToSign, expires };
}
export const gcsConfig = env => ({ bucket: env.GCS_BUCKET, clientEmail: env.GCS_CLIENT_EMAIL, privateKey: env.GCS_PRIVATE_KEY });
export async function signedObjectUrl(env, object, method, { expires = 600, contentType, contentLength, fileId, query = {} } = {}) {
  const headers = {};
  if (contentType) headers['content-type'] = contentType;
  if (contentLength) headers['content-length'] = String(contentLength);
  if (fileId) headers['x-goog-meta-dafatii-file-id'] = fileId;
  return signV4({ ...gcsConfig(env), object, method, expires, headers, query });
}
export async function inspectObjectPrefix(env, file) {
  const signed = await signedObjectUrl(env, file.object_key, 'GET', { expires: 60 });
  const response = await fetch(signed.url, { headers: { Range: 'bytes=0-511' } });
  if (![200, 206].includes(response.status)) throw new HttpError(502, 'GCS_VERIFICATION_FAILED', 'Storage content verification failed.');
  return new Uint8Array(await response.arrayBuffer());
}
const starts = (bytes, signature) => signature.every((value, index) => bytes[index] === value);
export function verifyMagicBytes(contentType, bytes) {
  const ascii = new TextDecoder('latin1').decode(bytes.slice(0, 16));
  const checks = {
    'application/pdf': () => ascii.startsWith('%PDF-'),
    'image/png': () => starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    'image/jpeg': () => starts(bytes, [0xff, 0xd8, 0xff]),
    'image/gif': () => ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a'),
    'image/webp': () => ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP',
    'application/zip': () => starts(bytes, [0x50, 0x4b, 0x03, 0x04]),
    'application/x-zip-compressed': () => starts(bytes, [0x50, 0x4b, 0x03, 0x04]),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': () => starts(bytes, [0x50, 0x4b, 0x03, 0x04]),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': () => starts(bytes, [0x50, 0x4b, 0x03, 0x04]),
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': () => starts(bytes, [0x50, 0x4b, 0x03, 0x04]),
    'application/msword': () => starts(bytes, [0xd0, 0xcf, 0x11, 0xe0]),
    'application/vnd.ms-excel': () => starts(bytes, [0xd0, 0xcf, 0x11, 0xe0]),
    'application/vnd.ms-powerpoint': () => starts(bytes, [0xd0, 0xcf, 0x11, 0xe0]),
    'audio/ogg': () => ascii.startsWith('OggS'),
    'video/ogg': () => ascii.startsWith('OggS'),
    'audio/wav': () => ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE',
    'video/webm': () => starts(bytes, [0x1a, 0x45, 0xdf, 0xa3]),
    'audio/webm': () => starts(bytes, [0x1a, 0x45, 0xdf, 0xa3]),
    'video/mp4': () => ascii.slice(4, 8) === 'ftyp',
    'audio/mp4': () => ascii.slice(4, 8) === 'ftyp'
  };
  if (contentType === 'audio/mpeg' && !(ascii.startsWith('ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) throw new HttpError(415, 'FILE_CONTENT_MISMATCH', 'File content does not match its declared type.');
  if (checks[contentType] && !checks[contentType]()) throw new HttpError(415, 'FILE_CONTENT_MISMATCH', 'File content does not match its declared type.');
  if (contentType === 'text/plain' || contentType === 'text/csv') {
    if (bytes.some(byte => byte === 0)) throw new HttpError(415, 'FILE_CONTENT_MISMATCH', 'Text file contains binary content.');
  }
  return true;
}
export async function inspectObject(env, file) {
  const signed = await signedObjectUrl(env, file.object_key, 'HEAD', { expires: 60 });
  const response = await fetch(signed.url, { method: 'HEAD' });
  if (response.status === 404) throw new HttpError(409, 'UPLOAD_NOT_FOUND', 'Uploaded object was not found.');
  if (!response.ok) throw new HttpError(502, 'GCS_VERIFICATION_FAILED', 'Storage verification failed.');
  return response.headers;
}
export function verifyCompletedObject(file, headers) {
  const size = Number(headers.get('content-length'));
  const type = String(headers.get('content-type') || '').toLowerCase().split(';')[0];
  const marker = headers.get('x-goog-meta-dafatii-file-id');
  if (size !== Number(file.expected_size) || type !== file.content_type || marker !== file.id) throw new HttpError(409, 'UPLOAD_MISMATCH', 'Uploaded object does not match the authorized upload.');
  return { size, contentType: type, generation: headers.get('x-goog-generation') || null, etag: headers.get('etag') || null };
}
export function completionDisposition(status) {
  if (status === 'available') return 'already_complete';
  if (status === 'pending') return 'verify';
  throw new HttpError(409, 'UPLOAD_NOT_PENDING', 'Upload is not pending.');
}
