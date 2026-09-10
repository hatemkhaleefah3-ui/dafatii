import { ApiError } from './http.js';
import { bytesToHex } from './crypto.js';

const encoder = new TextEncoder();
const MAX_SIGNED_SECONDS = 900;

function pct(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}
function canonicalPath(bucket, objectKey) {
  return `/${pct(bucket)}/${String(objectKey).split('/').map(pct).join('/')}`;
}
function timestamp(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
function pemBytes(pem) {
  const normalized = String(pem).replace(/\\n/g, '\n');
  const b64 = normalized.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  if (!b64) throw new ApiError(500, 'gcs_configuration_error', 'GCS signing key is not configured.');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
async function digestHex(value) { return bytesToHex(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
async function rsaSign(privateKeyPem, value) {
  const key = await crypto.subtle.importKey('pkcs8', pemBytes(privateKeyPem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(value)));
}

export async function signGcsUrl(env, { method, objectKey, expires = 600, headers = {}, query = {} }) {
  if (!env.GCS_BUCKET || !env.GCS_CLIENT_EMAIL || !env.GCS_PRIVATE_KEY) throw new ApiError(500, 'gcs_configuration_error', 'GCS is not configured.');
  const seconds = Math.max(1, Math.min(Number(expires) || 600, MAX_SIGNED_SECONDS));
  const now = new Date();
  const date = timestamp(now).slice(0, 8);
  const scope = `${date}/auto/storage/goog4_request`;
  const credential = `${env.GCS_CLIENT_EMAIL}/${scope}`;
  const host = 'storage.googleapis.com';
  const normalizedHeaders = { host, ...Object.fromEntries(Object.entries(headers).map(([k,v]) => [k.toLowerCase().trim(), String(v).trim().replace(/\s+/g, ' ')])) };
  const headerNames = Object.keys(normalizedHeaders).sort();
  const canonicalHeaders = headerNames.map(k => `${k}:${normalizedHeaders[k]}\n`).join('');
  const signedHeaders = headerNames.join(';');
  const params = {
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': credential,
    'X-Goog-Date': timestamp(now),
    'X-Goog-Expires': String(seconds),
    'X-Goog-SignedHeaders': signedHeaders,
    ...query
  };
  const canonicalQuery = Object.entries(params).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => `${pct(k)}=${pct(v)}`).join('&');
  const path = canonicalPath(env.GCS_BUCKET, objectKey);
  const canonicalRequest = [method.toUpperCase(), path, canonicalQuery, canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['GOOG4-RSA-SHA256', timestamp(now), scope, await digestHex(canonicalRequest)].join('\n');
  const signature = await rsaSign(env.GCS_PRIVATE_KEY, stringToSign);
  return { url: `https://${host}${path}?${canonicalQuery}&X-Goog-Signature=${signature}`, expiresAt: now.getTime() + seconds * 1000, signedHeaders };
}

export async function headObject(env, file) {
  const signed = await signGcsUrl(env, { method: 'HEAD', objectKey: file.object_key, expires: 60 });
  const response = await fetch(signed.url, { method: 'HEAD' });
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(502, 'storage_unavailable', 'Unable to verify uploaded object.');
  return { size: Number(response.headers.get('content-length')), contentType: response.headers.get('content-type') || '', fileId: response.headers.get('x-goog-meta-dafatii-file-id') || '' };
}

export async function deleteObject(env, objectKey) {
  const signed = await signGcsUrl(env, { method: 'DELETE', objectKey, expires: 60 });
  const response = await fetch(signed.url, { method: 'DELETE' });
  if (response.status !== 404 && !response.ok) throw new ApiError(502, 'storage_delete_failed', 'Object deletion failed.');
}
