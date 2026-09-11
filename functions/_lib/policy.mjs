import { HttpError } from './http.mjs';

const ACTIVE_TYPES = new Set(['text/html', 'application/xhtml+xml', 'image/svg+xml', 'text/javascript', 'application/javascript']);
const ALLOWED_PREFIXES = ['image/', 'audio/', 'video/'];
const ALLOWED_TYPES = new Set([
  'application/pdf', 'application/octet-stream', 'application/zip', 'application/x-zip-compressed', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

export function sanitizeFilename(value) {
  const cleaned = String(value || 'file').normalize('NFC').replace(/[\u0000-\u001F\u007F/\\]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 180);
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : 'file';
}
export function positiveIntegerSetting(value, fallback, { maximum = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Server limits are misconfigured.');
  return Math.min(parsed, maximum);
}
export const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
export function validateUpload(input, env = {}) {
  const size = Number(input?.size);
  const maxSize = positiveIntegerSetting(env.MAX_UPLOAD_BYTES, 536870912, { maximum: 5368709120 });
  const contentType = String(input?.contentType || '').toLowerCase().split(';')[0].trim();
  if (!Number.isSafeInteger(size) || size <= 0) throw new HttpError(400, 'INVALID_FILE_SIZE', 'File size must be a positive integer.');
  if (size > maxSize) throw new HttpError(413, 'FILE_TOO_LARGE', `File exceeds the ${maxSize}-byte limit.`);
  if (!contentType || ACTIVE_TYPES.has(contentType) || !(ALLOWED_TYPES.has(contentType) || ALLOWED_PREFIXES.some(prefix => contentType.startsWith(prefix)))) {
    throw new HttpError(415, 'FILE_TYPE_NOT_ALLOWED', 'This file type is not allowed.');
  }
  return { size, contentType, filename: sanitizeFilename(input.filename) };
}
export function objectKey(userId, fileId) {
  if (!isUuid(userId) || !isUuid(fileId)) throw new TypeError('Invalid internal identifier.');
  return `users/${userId}/${fileId}/object`;
}
export function validateRecord(record) {
  if (!record || !/^dafatii:[A-Za-z0-9:_.-]{1,180}$/.test(String(record.key)) || ['dafatii:theme', 'dafatii:direction'].includes(record.key)) throw new HttpError(400, 'INVALID_RECORD_KEY', 'Record key is invalid or device-only.');
  if (!['json', 'string'].includes(record.format)) throw new HttpError(400, 'INVALID_RECORD_FORMAT', 'Record format is invalid.');
  const valueJson = record.deleted ? null : JSON.stringify(record.value);
  if (!record.deleted && new TextEncoder().encode(valueJson).byteLength > 262144) throw new HttpError(413, 'RECORD_TOO_LARGE', 'Record exceeds 256 KiB.');
  return { key: record.key, format: record.format, valueJson, deleted: record.deleted ? 1 : 0 };
}
