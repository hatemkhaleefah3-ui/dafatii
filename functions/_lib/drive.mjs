import { HttpError } from './http.mjs';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const PDF = 'application/pdf';
const LEGACY_OFFICE_TARGETS = Object.freeze({
  'application/msword': 'application/vnd.google-apps.document',
  'application/vnd.ms-excel': 'application/vnd.google-apps.spreadsheet',
  'application/vnd.ms-powerpoint': 'application/vnd.google-apps.presentation'
});
let cachedToken;

function requireDriveConfig(env) {
  const config = {
    clientId: String(env.GOOGLE_DRIVE_CLIENT_ID || '').trim(),
    clientSecret: String(env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim(),
    refreshToken: String(env.GOOGLE_DRIVE_REFRESH_TOKEN || '').trim(),
    folderId: String(env.GOOGLE_DRIVE_FOLDER_ID || '').trim()
  };
  if (Object.values(config).some(value => !value)) throw new HttpError(503, 'DRIVE_CONFIGURATION_ERROR', 'Google Drive storage is not configured.');
  return config;
}

async function accessToken(env) {
  const config = requireDriveConfig(env);
  if (cachedToken?.clientId === config.clientId && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token'
  });
  const response = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new HttpError(502, 'DRIVE_AUTHENTICATION_FAILED', 'Google Drive authentication failed.');
  const payload = await response.json();
  if (!payload.access_token) throw new HttpError(502, 'DRIVE_AUTHENTICATION_FAILED', 'Google Drive did not return an access token.');
  cachedToken = { clientId: config.clientId, value: payload.access_token, expiresAt: Date.now() + Math.max(60, Number(payload.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

async function driveFetch(env, url, init = {}) {
  const token = await accessToken(env);
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

const fields = 'id,name,mimeType,size,parents,trashed,appProperties,md5Checksum,modifiedTime';
const encodedId = value => encodeURIComponent(String(value));
export const isDriveObject = objectKey => String(objectKey || '').startsWith('drive/');
export const driveObjectId = objectKey => isDriveObject(objectKey) && !String(objectKey).startsWith('drive/pending/') ? String(objectKey).slice(6) : null;
export function validDriveId(value) { return /^[A-Za-z0-9_-]{10,200}$/.test(String(value || '')); }
export const canConvertLegacyOffice = contentType => Boolean(LEGACY_OFFICE_TARGETS[String(contentType || '').toLowerCase().split(';')[0]]);

export async function startDriveUpload(env, file, userId) {
  const config = requireDriveConfig(env);
  const url = `${DRIVE_UPLOAD_API}/files?uploadType=resumable&supportsAllDrives=true&fields=${encodeURIComponent(fields)}`;
  const metadata = {
    name: file.original_filename,
    mimeType: file.content_type,
    parents: [config.folderId],
    appProperties: { dafatiiFileId: file.id, dafatiiUserId: userId, dafatiiDafaaId: file.dafaa_id || '' }
  };
  const response = await driveFetch(env, url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Upload-Content-Type': file.content_type,
      'X-Upload-Content-Length': String(file.expected_size)
    },
    body: JSON.stringify(metadata)
  });
  const uploadUrl = response.headers.get('location');
  if (!response.ok || !uploadUrl) throw new HttpError(502, 'DRIVE_UPLOAD_INIT_FAILED', 'Google Drive could not start the upload.');
  return uploadUrl;
}

export async function readDriveMetadata(env, fileId) {
  if (!validDriveId(fileId)) throw new HttpError(400, 'INVALID_DRIVE_FILE', 'Google Drive file identifier is invalid.');
  const response = await driveFetch(env, `${DRIVE_API}/files/${encodedId(fileId)}?supportsAllDrives=true&fields=${encodeURIComponent(fields)}`);
  if (response.status === 404) throw new HttpError(409, 'UPLOAD_NOT_FOUND', 'Uploaded file was not found in Google Drive.');
  if (!response.ok) throw new HttpError(502, 'DRIVE_VERIFICATION_FAILED', 'Google Drive file verification failed.');
  return response.json();
}

export function verifyDriveMetadata(env, file, metadata, userId) {
  const config = requireDriveConfig(env);
  const properties = metadata?.appProperties || {};
  const type = String(metadata?.mimeType || '').toLowerCase().split(';')[0];
  const valid = !metadata?.trashed && Number(metadata?.size) === Number(file.expected_size) && type === file.content_type &&
    Array.isArray(metadata?.parents) && metadata.parents.includes(config.folderId) && properties.dafatiiFileId === file.id &&
    properties.dafatiiUserId === userId && properties.dafatiiDafaaId === (file.dafaa_id || '');
  if (!valid) throw new HttpError(409, 'UPLOAD_MISMATCH', 'Uploaded file does not match the authorized upload.');
  return { size: Number(metadata.size), etag: metadata.md5Checksum || null };
}

export async function inspectDrivePrefix(env, fileId) {
  const response = await driveFetch(env, `${DRIVE_API}/files/${encodedId(fileId)}?alt=media&supportsAllDrives=true`, { headers: { Range: 'bytes=0-511' } });
  if (![200, 206].includes(response.status)) throw new HttpError(502, 'DRIVE_VERIFICATION_FAILED', 'Google Drive content verification failed.');
  return new Uint8Array(await response.arrayBuffer());
}

function contentDisposition(filename, download) {
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encoded}`;
}

export async function streamDriveFile(env, file, request, download = false) {
  const fileId = driveObjectId(file.object_key);
  if (!fileId) throw new HttpError(409, 'FILE_NOT_AVAILABLE', 'The Google Drive file is not available.');
  const headers = {};
  const range = request.headers.get('range');
  if (range) headers.Range = range;
  const response = await driveFetch(env, `${DRIVE_API}/files/${encodedId(fileId)}?alt=media&supportsAllDrives=true`, { headers });
  if (![200, 206, 416].includes(response.status)) throw new HttpError(response.status === 404 ? 404 : 502, response.status === 404 ? 'FILE_NOT_FOUND' : 'DRIVE_READ_FAILED', response.status === 404 ? 'File was not found.' : 'Google Drive could not read the file.');
  const outputHeaders = new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Type': file.content_type,
    'Content-Disposition': contentDisposition(file.original_filename, download),
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  for (const name of ['content-length', 'content-range', 'etag', 'last-modified']) {
    const value = response.headers.get(name); if (value) outputHeaders.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers: outputHeaders });
}

export async function convertLegacyOfficeToPdf(env, file) {
  const sourceId = driveObjectId(file.object_key);
  const sourceType = String(file.content_type || '').toLowerCase().split(';')[0];
  const targetType = LEGACY_OFFICE_TARGETS[sourceType];
  if (!sourceId || !targetType) throw new HttpError(415, 'PREVIEW_UNSUPPORTED', 'This file cannot be converted for preview.');
  const size = Number(file.actual_size ?? file.expected_size);
  if (!Number.isSafeInteger(size) || size < 1) throw new HttpError(409, 'FILE_NOT_AVAILABLE', 'The source file size is invalid.');

  const config = requireDriveConfig(env);
  const createUrl = `${DRIVE_UPLOAD_API}/files?uploadType=resumable&supportsAllDrives=true&fields=id%2CmimeType`;
  const created = await driveFetch(env, createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Upload-Content-Type': sourceType,
      'X-Upload-Content-Length': String(size)
    },
    body: JSON.stringify({
      name: `.dafatii-preview-${file.id}`,
      mimeType: targetType,
      parents: [config.folderId],
      appProperties: { dafatiiPreviewOf: file.id }
    })
  });
  const uploadUrl = created.headers.get('location');
  if (!created.ok || !uploadUrl) throw new HttpError(502, 'PREVIEW_CONVERSION_FAILED', 'Google Drive could not start the file preview conversion.');

  let convertedId;
  try {
    const source = await driveFetch(env, `${DRIVE_API}/files/${encodedId(sourceId)}?alt=media&supportsAllDrives=true`);
    if (!source.ok || !source.body) throw new HttpError(502, 'DRIVE_READ_FAILED', 'Google Drive could not read the source file.');
    const uploaded = await driveFetch(env, uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': sourceType, 'Content-Length': String(size) },
      body: source.body
    });
    if (!uploaded.ok) throw new HttpError(422, 'PREVIEW_CONVERSION_FAILED', 'The legacy Office file could not be converted for preview.');
    const converted = await uploaded.json();
    convertedId = converted.id;
    if (!validDriveId(convertedId) || converted.mimeType !== targetType) throw new HttpError(422, 'PREVIEW_CONVERSION_FAILED', 'Google Drive did not create a readable preview.');

    const exported = await driveFetch(env, `${DRIVE_API}/files/${encodedId(convertedId)}/export?mimeType=${encodeURIComponent(PDF)}`);
    if (!exported.ok) throw new HttpError(422, 'PREVIEW_CONVERSION_FAILED', 'The converted file could not be exported as PDF.');
    const bytes = await exported.arrayBuffer();
    if (bytes.byteLength < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new HttpError(422, 'PREVIEW_CONVERSION_FAILED', 'The converted preview is not a valid PDF.');
    return bytes;
  } finally {
    if (convertedId) await deleteDriveFile(env, convertedId).catch(() => {});
  }
}

export async function deleteDriveFile(env, fileId) {
  if (!fileId) return;
  const response = await driveFetch(env, `${DRIVE_API}/files/${encodedId(fileId)}?supportsAllDrives=true`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new HttpError(502, 'DRIVE_DELETE_FAILED', 'Google Drive could not delete the file.');
}
