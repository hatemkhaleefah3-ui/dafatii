import { authenticateUser, clearAuthRateLimit, clearSessionCookie, createSession, createUser, enforceAuthRateLimit, normalizeEmail, requireUser, revokeCurrentSession, sessionCookie, validateAccountInput } from '../../_lib/auth.mjs';
import { accessibleFile, ownedFile, publicFileDto } from '../../_lib/access.mjs';
import { dispatchCourseRoute } from '../../_lib/course-routes.mjs';
import { actorFor, publicActor, requireCourseView, requirePermission } from '../../_lib/courses.mjs';
import { canConvertLegacyOffice, convertLegacyOfficeToPdf, deleteDriveFile, driveObjectId, inspectDrivePrefix, isDriveObject, readDriveMetadata, startDriveUpload, streamDriveFile, validDriveId, verifyDriveMetadata } from '../../_lib/drive.mjs';
import { completionDisposition, inspectObject, inspectObjectPrefix, signedObjectUrl, verifyCompletedObject, verifyMagicBytes } from '../../_lib/gcs.mjs';
import { assertSameOrigin, fail, HttpError, logEvent, ok, readJson } from '../../_lib/http.mjs';
import { isUuid, objectKey, positiveIntegerSetting, sanitizeFilename, validateRecord, validateUpload } from '../../_lib/policy.mjs';
import { requestPasswordRecovery, resetPassword } from '../../_lib/password-recovery.mjs';
import { translateInterfaceText } from '../../_lib/translate.mjs';

const recordDto = row => ({ key: row.record_key, format: row.format, value: row.deleted ? null : JSON.parse(row.value_json), deleted: Boolean(row.deleted), revision: row.revision, updatedAt: row.updated_at });
const requireDb = env => { if (!env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.'); };
const routePath = request => new URL(request.url).pathname.replace(/^\/api\/v1\/?/, '');
const usesDrive = env => String(env.STORAGE_PROVIDER || 'gcs').toLowerCase() === 'drive';
const uploadSessionKey = fileId => `upload-sessions/${fileId}.json`;
const hearingAudioKey = fileId => `r2/hearing-audio/${fileId}`;
const isR2HearingObject = objectKey => String(objectKey || '').startsWith('r2/hearing-audio/');
const HEARING_AUDIO_TYPES = new Set(['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/webm']);
const HEARING_AUDIO_MAX_BYTES = 52428800;
const TEACHER_IMAGE_TYPES = new Set(['image/png','image/jpeg','image/webp','image/gif']);
function validateTeacherProfileUpload(input) {
  const size = Number(input?.size);
  const contentType = String(input?.contentType || '').toLowerCase().split(';')[0].trim();
  if (!Number.isSafeInteger(size) || size <= 0) throw new HttpError(400, 'INVALID_FILE_SIZE', 'File size must be a positive integer.');
  if (!TEACHER_IMAGE_TYPES.has(contentType)) throw new HttpError(415, 'FILE_TYPE_NOT_ALLOWED', 'Teacher profile pictures must be PNG, JPEG, WebP, or GIF.');
  return { size, contentType, filename: sanitizeFilename(input.filename) };
}

async function writeR2Manifest(env, file) {
  if (!env.R2_STORAGE) return;
  await env.R2_STORAGE.put(`files/${file.id}/manifest.json`, JSON.stringify({
    id: file.id, ownerId: file.user_id, courseId: file.course_id || null, filename: file.original_filename,
    contentType: file.content_type, size: Number(file.actual_size ?? file.expected_size), storage: isDriveObject(file.object_key) ? 'google-drive' : 'gcs', updatedAt: Date.now()
  }), { httpMetadata: { contentType: 'application/json' } });
}

async function deleteR2Manifest(env, fileId) { if (env.R2_STORAGE) await env.R2_STORAGE.delete(`files/${fileId}/manifest.json`); }
async function deleteR2Preview(env, fileId) { if (env.R2_STORAGE) await env.R2_STORAGE.delete(`files/${fileId}/preview.pdf`); }
async function deleteUploadSession(env, fileId) { if (env.R2_STORAGE) await env.R2_STORAGE.delete(uploadSessionKey(fileId)); }
async function readUploadSession(env, fileId) { const object = env.R2_STORAGE ? await env.R2_STORAGE.get(uploadSessionKey(fileId)) : null; return object ? object.json() : null; }

async function signup(context) {
  const input = await readJson(context.request, 16384);
  const candidate = validateAccountInput(input, true);
  const fingerprint = await enforceAuthRateLimit(context.env.DB, context.request, candidate.email, context.env);
  try {
    const user = await createUser(context.env.DB, candidate, context.env);
    const session = await createSession(context.env.DB, user.id, context.request);
    await clearAuthRateLimit(context.env.DB, fingerprint);
    logEvent('info', 'auth.signup', { userId: user.id });
    const currentActor = await actorFor(context.env.DB, user, context.env);
    return ok({ user: publicActor(currentActor), expiresAt: session.expiresAt }, 201, { 'Set-Cookie': session.cookie });
  } catch (error) { logEvent('warn', 'auth.signup_failed', { code: error.code }); throw error; }
}

async function login(context) {
  const input = await readJson(context.request, 16384);
  const candidate = validateAccountInput(input, false);
  const fingerprint = await enforceAuthRateLimit(context.env.DB, context.request, candidate.email, context.env);
  try {
    const user = await authenticateUser(context.env.DB, candidate.email, candidate.password, context.env);
    const session = await createSession(context.env.DB, user.id, context.request);
    await clearAuthRateLimit(context.env.DB, fingerprint);
    logEvent('info', 'auth.login', { userId: user.id });
    const currentActor = await actorFor(context.env.DB, user, context.env);
    return ok({ user: publicActor(currentActor), expiresAt: session.expiresAt }, 200, { 'Set-Cookie': session.cookie });
  } catch (error) { logEvent('warn', 'auth.login_failed', { code: error.code }); throw error; }
}

async function session(context) {
  const user = await requireUser(context);
  return ok({ user: publicActor(await actorFor(context.env.DB, user, context.env)), expiresAt: user.expiresAt }, 200, { 'Set-Cookie': sessionCookie(context.request, user.sessionToken) });
}

async function logout(context) {
  await revokeCurrentSession(context);
  return ok({ loggedOut: true }, 200, { 'Set-Cookie': clearSessionCookie(context.request) });
}

async function passwordRecoveryRequest(context) {
  const input = await readJson(context.request, 4096);
  return ok(await requestPasswordRecovery(context, input.email));
}

async function passwordRecoveryReset(context) {
  const input = await readJson(context.request, 8192);
  return ok(await resetPassword(context, input.token, input.password));
}

async function hydrate(context, user) {
  const input = await readJson(context.request, 1048576);
  const localRecords = Array.isArray(input.localRecords) ? input.localRecords : [];
  if (localRecords.length > 200) throw new HttpError(413, 'TOO_MANY_RECORDS', 'At most 200 records can be imported at once.');
  const now = Date.now();
  for (const raw of localRecords) {
    const record = validateRecord(raw);
    await context.env.DB.prepare(`INSERT OR IGNORE INTO records
      (user_id, record_key, format, value_json, deleted, revision, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)`).bind(user.id, record.key, record.format, record.valueJson, record.deleted, now, now).run();
  }
  const result = await context.env.DB.prepare('SELECT record_key, format, value_json, deleted, revision, updated_at FROM records WHERE user_id = ? ORDER BY record_key').bind(user.id).all();
  logEvent('info', 'sync.hydrate', { userId: user.id, imported: localRecords.length, returned: result.results.length });
  return ok({ records: result.results.map(recordDto) });
}

async function mutate(context, user) {
  const input = await readJson(context.request, 300000);
  const mutationId = String(input.mutationId || '');
  if (!isUuid(mutationId)) throw new HttpError(400, 'INVALID_MUTATION_ID', 'Mutation ID must be a UUID.');
  const previous = await context.env.DB.prepare('SELECT response_json FROM record_mutations WHERE user_id = ? AND mutation_id = ?').bind(user.id, mutationId).first();
  if (previous) return ok(JSON.parse(previous.response_json));
  const record = validateRecord(input.record);
  const baseRevision = Number(input.baseRevision);
  if (!Number.isSafeInteger(baseRevision) || baseRevision < 0) throw new HttpError(400, 'INVALID_REVISION', 'Base revision is invalid.');
  const now = Date.now();
  const revision = baseRevision + 1;
  const response = { key: record.key, revision, updatedAt: now };
  let mutationStatement;
  if (baseRevision === 0) {
    mutationStatement = context.env.DB.prepare(`INSERT OR IGNORE INTO records
      (user_id, record_key, format, value_json, deleted, revision, last_mutation_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`).bind(user.id, record.key, record.format, record.valueJson, record.deleted, mutationId, now, now);
  } else {
    mutationStatement = context.env.DB.prepare(`UPDATE records SET format = ?, value_json = ?, deleted = ?, revision = revision + 1, last_mutation_id = ?, updated_at = ?
      WHERE user_id = ? AND record_key = ? AND revision = ?`).bind(record.format, record.valueJson, record.deleted, mutationId, now, user.id, record.key, baseRevision);
  }
  const receiptStatement = context.env.DB.prepare(`INSERT INTO record_mutations (user_id, mutation_id, record_key, response_json, created_at)
    SELECT ?, ?, ?, ?, ? FROM records WHERE user_id = ? AND record_key = ? AND last_mutation_id = ?`)
    .bind(user.id, mutationId, record.key, JSON.stringify(response), now, user.id, record.key, mutationId);
  const results = await context.env.DB.batch([mutationStatement, receiptStatement]);
  if (!results[0].meta?.changes || !results[1].meta?.changes) {
    const current = await context.env.DB.prepare('SELECT record_key, format, value_json, deleted, revision, updated_at FROM records WHERE user_id = ? AND record_key = ?').bind(user.id, record.key).first();
    logEvent('warn', 'sync.conflict', { userId: user.id, key: record.key, baseRevision });
    throw new HttpError(409, 'SYNC_CONFLICT', 'The record changed on another device.', { current: current ? recordDto(current) : null });
  }
  return ok(response);
}

async function uploadInit(context, user) {
  const raw = await readJson(context.request, 32768);
  const purpose = String(raw.purpose || '');
  const teacherProfile = purpose === 'teacher-profile';
  const chatAttachment = purpose === 'chat-attachment';
  const hearingAudio = purpose === 'language-hearing-audio';
  if (teacherProfile && !user.isAdmin) throw new HttpError(403, 'ADMIN_REQUIRED', 'Administrator access is required for teacher profile uploads.');
  const input = teacherProfile ? validateTeacherProfileUpload(raw) : validateUpload(raw, context.env);
  const courseId = raw.courseId ? String(raw.courseId) : null;
  if (hearingAudio) {
    if (!courseId) throw new HttpError(400, 'COURSE_REQUIRED', 'Hearing audio must belong to a Course.');
    if (!HEARING_AUDIO_TYPES.has(input.contentType)) throw new HttpError(415, 'FILE_TYPE_NOT_ALLOWED', 'Hearing audio must be MP3, WAV, OGG, M4A/MP4 audio, or WebM audio.');
    if (input.size > HEARING_AUDIO_MAX_BYTES) throw new HttpError(413, 'FILE_TOO_LARGE', 'Hearing audio files cannot exceed 50 MB.');
    if (!context.env.R2_STORAGE) throw new HttpError(503, 'R2_CONFIGURATION_ERROR', 'Hearing audio storage is not configured.');
  }
  if (teacherProfile && courseId) throw new HttpError(400, 'INVALID_UPLOAD_PURPOSE', 'Teacher profile pictures cannot belong to a Course.');
  if (courseId) { if (!isUuid(courseId)) throw new HttpError(400, 'INVALID_IDENTIFIER', 'Course identifier is invalid.'); await requirePermission(context.env.DB, user, courseId, 'can_add_content'); }
  const uploadLimit = positiveIntegerSetting(context.env.UPLOAD_INIT_LIMIT, 60, { maximum: 10000 });
  const now = Date.now();
  const recent = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM files WHERE user_id = ? AND created_at > ?").bind(user.id, now - 3600000).first();
  if (Number(recent?.count || 0) >= uploadLimit) throw new HttpError(429, 'UPLOAD_RATE_LIMITED', 'Upload initialization limit reached.');
  if (!teacherProfile) {
    const quota = positiveIntegerSetting(context.env.USER_STORAGE_QUOTA_BYTES, 10737418240);
    const usage = await context.env.DB.prepare("SELECT COALESCE(SUM(CASE WHEN status = 'pending' THEN expected_size ELSE actual_size END), 0) AS bytes FROM files WHERE user_id = ? AND status IN ('pending', 'available', 'quarantined', 'delete_failed')").bind(user.id).first();
    if (Number(usage?.bytes || 0) + input.size > quota) throw new HttpError(413, 'STORAGE_QUOTA_EXCEEDED', 'Account storage quota would be exceeded.');
  }
  const fileId = crypto.randomUUID();
  const r2Upload = hearingAudio;
  const driveUpload = !r2Upload && (teacherProfile || chatAttachment || usesDrive(context.env));
  const key = r2Upload ? hearingAudioKey(fileId) : driveUpload ? `drive/pending/${fileId}` : objectKey(user.id, fileId);
  const expiresAt = now + 15 * 60 * 1000;
  await context.env.DB.prepare(`INSERT INTO files
    (id, user_id, course_id, object_key, original_filename, content_type, expected_size, status, upload_expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`).bind(fileId, user.id, courseId, key, input.filename, input.contentType, input.size, expiresAt, now, now).run();
  try {
    if (r2Upload) {
      logEvent('info', 'file.upload_initialized', { userId: user.id, fileId, provider: 'r2-hearing-audio', purpose, size: input.size, contentType: input.contentType });
      return ok({ fileId, upload: { url: `/api/v1/files/${fileId}/upload`, method: 'PUT', provider: 'r2-proxy', expiresAt, headers: { 'Content-Type': input.contentType } } }, 201);
    }
    if (driveUpload) {
      if (!context.env.R2_STORAGE) throw new HttpError(503, 'R2_CONFIGURATION_ERROR', 'R2 upload-session storage is not configured.');
      const file = { id: fileId, user_id: user.id, course_id: courseId, object_key: key, original_filename: input.filename, content_type: input.contentType, expected_size: input.size };
      const uploadUrl = await startDriveUpload(context.env, file, user.id);
      await context.env.R2_STORAGE.put(uploadSessionKey(fileId), JSON.stringify({ uploadUrl, userId: user.id, expiresAt, purpose: purpose || null }), { httpMetadata: { contentType: 'application/json' } });
      logEvent('info', 'file.upload_initialized', { userId: user.id, fileId, provider: 'drive', purpose: purpose || null, size: input.size, contentType: input.contentType });
      return ok({ fileId, upload: { url: `/api/v1/files/${fileId}/upload`, method: 'PUT', provider: 'drive-proxy', chunkSize: 8388608, expiresAt, headers: { 'Content-Type': input.contentType } } }, 201);
    }
    const signed = await signedObjectUrl(context.env, key, 'PUT', { expires: 900, contentType: input.contentType, contentLength: input.size, fileId, query: { ifGenerationMatch: '0' } });
    logEvent('info', 'file.upload_initialized', { userId: user.id, fileId, size: input.size, contentType: input.contentType });
    return ok({ fileId, upload: { url: signed.url, method: 'PUT', expiresAt, headers: { 'Content-Type': input.contentType, 'x-goog-meta-dafatii-file-id': fileId } } }, 201);
  } catch (error) {
    await context.env.DB.prepare("UPDATE files SET status = 'upload_failed', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('storage_init_failed', Date.now(), fileId, user.id).run();
    logEvent('error', 'storage.upload_init_failed', { userId: user.id, fileId, provider: r2Upload ? 'r2-hearing-audio' : driveUpload ? 'drive' : 'gcs' });
    throw error;
  }
}
async function uploadR2HearingAudio(context, user, file) {
  if (!context.env.R2_STORAGE) throw new HttpError(503, 'R2_CONFIGURATION_ERROR', 'Hearing audio storage is not configured.');
  if (!HEARING_AUDIO_TYPES.has(String(file.content_type || '').toLowerCase())) throw new HttpError(415, 'FILE_TYPE_NOT_ALLOWED', 'This upload is not a supported hearing audio file.');
  if (Number(file.expected_size) > HEARING_AUDIO_MAX_BYTES) throw new HttpError(413, 'FILE_TOO_LARGE', 'Hearing audio files cannot exceed 50 MB.');
  if (!context.request.body) throw new HttpError(400, 'UPLOAD_BODY_REQUIRED', 'Audio upload body is missing.');
  await context.env.R2_STORAGE.put(file.object_key, context.request.body, {
    httpMetadata: { contentType: file.content_type },
    customMetadata: { dafatiiFileId: file.id, dafatiiUserId: user.id, dafatiiCourseId: file.course_id || '' }
  });
  const stored = await context.env.R2_STORAGE.head(file.object_key);
  if (!stored || Number(stored.size) !== Number(file.expected_size)) {
    await context.env.R2_STORAGE.delete(file.object_key).catch(() => {});
    throw new HttpError(409, 'UPLOAD_MISMATCH', 'Uploaded hearing audio size does not match the authorized upload.');
  }
  return ok({ complete: true });
}
async function uploadFileContent(context, user, fileId) {
  const file = await ownedFile(context.env.DB, user.id, fileId, ['pending']);
  if (isR2HearingObject(file.object_key)) return uploadR2HearingAudio(context, user, file);
  return uploadDriveChunk(context, user, fileId, file);
}
async function uploadDriveChunk(context, user, fileId, suppliedFile = null) {
  const file = suppliedFile || await ownedFile(context.env.DB, user.id, fileId, ['pending']);
  if (!isDriveObject(file.object_key) || !context.env.R2_STORAGE) throw new HttpError(404, 'UPLOAD_NOT_FOUND', 'Upload session was not found.');
  const session = await readUploadSession(context.env, fileId);
  if (!session) throw new HttpError(410, 'UPLOAD_SESSION_EXPIRED', 'Upload session expired. Start the upload again.');
  if (session.userId !== user.id || Number(session.expiresAt) < Date.now()) throw new HttpError(410, 'UPLOAD_SESSION_EXPIRED', 'Upload session expired. Start the upload again.');
  if (session.driveFileId) return ok({ complete: true, driveFileId: session.driveFileId });
  const match = String(context.request.headers.get('content-range') || '').match(/^bytes (\d+)-(\d+)\/(\d+)$/);
  if (!match) throw new HttpError(400, 'INVALID_CONTENT_RANGE', 'Upload chunk range is missing or invalid.');
  const start = Number(match[1]), end = Number(match[2]), total = Number(match[3]), length = end - start + 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || total !== Number(file.expected_size) || start < 0 || end < start || end >= total || length > 8388608 || (end + 1 < total && length % 262144 !== 0)) throw new HttpError(400, 'INVALID_CONTENT_RANGE', 'Upload chunk range does not match the authorized file.');
  const response = await fetch(session.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.content_type, 'Content-Length': String(length), 'Content-Range': `bytes ${start}-${end}/${total}` }, body: context.request.body });
  if (response.status === 308) return ok({ complete: false, received: response.headers.get('range') || null });
  if (!response.ok) throw new HttpError(502, 'DRIVE_UPLOAD_FAILED', `Google Drive rejected an upload chunk (${response.status}).`);
  const result = await response.json().catch(() => null);
  if (!validDriveId(result?.id)) throw new HttpError(502, 'DRIVE_UPLOAD_FAILED', 'Google Drive did not confirm the uploaded file.');
  await context.env.R2_STORAGE.put(uploadSessionKey(fileId), JSON.stringify({ ...session, driveFileId: result.id }), { httpMetadata: { contentType: 'application/json' } });
  return ok({ complete: true, driveFileId: result.id });
}

async function completeUpload(context, user, fileId) {
  const input = await readJson(context.request, 4096);
  const file = await ownedFile(context.env.DB, user.id, fileId);
  if (completionDisposition(file.status) === 'already_complete') {
    await deleteUploadSession(context.env, fileId);
    await writeR2Manifest(context.env, file);
    return ok(publicFileDto(file));
  }
  if (isR2HearingObject(file.object_key)) {
    if (!context.env.R2_STORAGE) throw new HttpError(503, 'R2_CONFIGURATION_ERROR', 'Hearing audio storage is not configured.');
    const head = await context.env.R2_STORAGE.head(file.object_key);
    const storedType = String(head?.httpMetadata?.contentType || '').toLowerCase().split(';')[0];
    const metadataValid = head && Number(head.size) === Number(file.expected_size) && storedType === file.content_type &&
      head.customMetadata?.dafatiiFileId === file.id && head.customMetadata?.dafatiiUserId === user.id &&
      head.customMetadata?.dafatiiCourseId === (file.course_id || '');
    if (!metadataValid) {
      await context.env.R2_STORAGE.delete(file.object_key).catch(() => {});
      throw new HttpError(409, 'UPLOAD_MISMATCH', 'Uploaded hearing audio does not match the authorized upload.');
    }
    const prefix = await context.env.R2_STORAGE.get(file.object_key, { range: { offset: 0, length: Math.min(512, Number(head.size)) } });
    try { verifyMagicBytes(file.content_type, new Uint8Array(await prefix.arrayBuffer())); }
    catch (error) {
      if (error.code === 'FILE_CONTENT_MISMATCH') await context.env.DB.prepare("UPDATE files SET status = 'quarantined', scan_status = 'rejected', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('content_type_mismatch', Date.now(), fileId, user.id).run();
      await context.env.R2_STORAGE.delete(file.object_key).catch(() => {});
      throw error;
    }
    const now = Date.now();
    const updated = await context.env.DB.prepare(`UPDATE files SET status = 'available', actual_size = ?, etag = ?, available_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND status = 'pending'`).bind(Number(head.size), head.etag || null, now, now, fileId, user.id).run();
    const available = { ...file, status: 'available', actual_size: Number(head.size), etag: head.etag || null, available_at: now };
    if (updated.meta?.changes) await writeR2Manifest(context.env, available);
    const current = updated.meta?.changes ? available : await ownedFile(context.env.DB, user.id, fileId, ['available']);
    logEvent('info', 'file.upload_completed', { userId: user.id, fileId, provider: 'r2-hearing-audio', size: Number(head.size) });
    return ok(publicFileDto(current));
  }
  if (isDriveObject(file.object_key)) {
    const remoteId = String(input.driveFileId || '');
    if (!validDriveId(remoteId)) throw new HttpError(400, 'INVALID_DRIVE_FILE', 'Google Drive upload result is missing or invalid.');
    const metadata = verifyDriveMetadata(context.env, file, await readDriveMetadata(context.env, remoteId), user.id);
    try { verifyMagicBytes(file.content_type, await inspectDrivePrefix(context.env, remoteId)); }
    catch (error) {
      if (error.code === 'FILE_CONTENT_MISMATCH') await context.env.DB.prepare("UPDATE files SET status = 'quarantined', scan_status = 'rejected', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('content_type_mismatch', Date.now(), fileId, user.id).run();
      await deleteDriveFile(context.env, remoteId).catch(() => {});
      await deleteUploadSession(context.env, fileId);
      throw error;
    }
    const now = Date.now();
    const objectKey = `drive/${remoteId}`;
    const updated = await context.env.DB.prepare(`UPDATE files SET object_key = ?, status = 'available', actual_size = ?, etag = ?, available_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND status = 'pending'`).bind(objectKey, metadata.size, metadata.etag, now, now, fileId, user.id).run();
    const available = { ...file, object_key: objectKey, status: 'available', actual_size: metadata.size, etag: metadata.etag, available_at: now };
    if (updated.meta?.changes) await writeR2Manifest(context.env, available);
    await deleteUploadSession(context.env, fileId);
    const current = updated.meta?.changes ? available : await ownedFile(context.env.DB, user.id, fileId, ['available']);
    logEvent('info', 'file.upload_completed', { userId: user.id, fileId, provider: 'drive', size: metadata.size });
    return ok(publicFileDto(current));
  }
  const headers = await inspectObject(context.env, file);
  const metadata = verifyCompletedObject(file, headers);
  try { verifyMagicBytes(file.content_type, await inspectObjectPrefix(context.env, file)); }
  catch (error) {
    if (error.code === 'FILE_CONTENT_MISMATCH') await context.env.DB.prepare("UPDATE files SET status = 'quarantined', scan_status = 'rejected', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('content_type_mismatch', Date.now(), fileId, user.id).run();
    throw error;
  }
  const now = Date.now();
  const updated = await context.env.DB.prepare(`UPDATE files SET status = 'available', actual_size = ?, gcs_generation = ?, etag = ?, available_at = ?, updated_at = ?
    WHERE id = ? AND user_id = ? AND status = 'pending'`).bind(metadata.size, metadata.generation, metadata.etag, now, now, fileId, user.id).run();
  if (!updated.meta?.changes) {
    const current = await ownedFile(context.env.DB, user.id, fileId, ['available']);
    return ok(publicFileDto(current));
  }
  await writeR2Manifest(context.env, { ...file, status: 'available', actual_size: metadata.size, available_at: now });
  logEvent('info', 'file.upload_completed', { userId: user.id, fileId, size: metadata.size });
  return ok({ ...publicFileDto(file), status: 'available', size: metadata.size, availableAt: now });
}

async function fileMetadata(context, user, fileId) { return ok(publicFileDto(await accessibleFile(context.env.DB, user, fileId))); }

async function listFiles(context, user) {
  const url = new URL(context.request.url);
  const requestedLimit = Number(url.searchParams.get('limit') || 50);
  if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) throw new HttpError(400, 'INVALID_LIMIT', 'File list limit is invalid.');
  const limit = Math.min(requestedLimit, 100);
  const courseId = url.searchParams.get('courseId');
  let result;
  if (courseId) {
    if (!isUuid(courseId)) throw new HttpError(400, 'INVALID_IDENTIFIER', 'Course identifier is invalid.');
    await requireCourseView(context.env.DB, user, courseId, { content: true });
    result = await context.env.DB.prepare("SELECT * FROM files WHERE course_id = ? AND status != 'deleted' ORDER BY created_at DESC LIMIT ?").bind(courseId, limit).all();
  } else result = await context.env.DB.prepare("SELECT * FROM files WHERE user_id = ? AND course_id IS NULL AND status != 'deleted' ORDER BY created_at DESC LIMIT ?").bind(user.id, limit).all();
  return ok({ files: result.results.map(publicFileDto) });
}

async function viewFile(context, user, fileId) {
  const file = await accessibleFile(context.env.DB, user, fileId, ['available']);
  const parameters = new URL(context.request.url).searchParams;
  const download = parameters.get('download') === '1';
  if (parameters.get('preview') === '1') {
    if (!isDriveObject(file.object_key) || !canConvertLegacyOffice(file.content_type)) throw new HttpError(415, 'PREVIEW_UNSUPPORTED', 'This file does not require a converted preview.');
    return ok({ url: `/api/v1/files/${file.id}/preview`, expiresAt: null });
  }
  if (isDriveObject(file.object_key) || isR2HearingObject(file.object_key)) return ok({ url: `/api/v1/files/${file.id}/content${download ? '?download=1' : ''}`, expiresAt: null });
  const disposition = `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.original_filename)}`;
  const signed = await signedObjectUrl(context.env, file.object_key, 'GET', { expires: 600, query: { 'response-content-disposition': disposition, 'response-content-type': file.content_type } });
  return ok({ url: signed.url, expiresAt: Date.now() + 600000 });
}

async function previewFile(context, user, fileId) {
  const file = await accessibleFile(context.env.DB, user, fileId, ['available']);
  if (!isDriveObject(file.object_key) || !canConvertLegacyOffice(file.content_type)) throw new HttpError(415, 'PREVIEW_UNSUPPORTED', 'This file cannot be converted for preview.');
  if (!context.env.R2_STORAGE) throw new HttpError(503, 'R2_CONFIGURATION_ERROR', 'Preview cache storage is not configured.');
  const key = `files/${file.id}/preview.pdf`;
  let object = await context.env.R2_STORAGE.get(key);
  if (!object) {
    const bytes = await convertLegacyOfficeToPdf(context.env, file);
    await context.env.R2_STORAGE.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { sourceType: file.content_type } });
    object = await context.env.R2_STORAGE.get(key);
  }
  if (!object) throw new HttpError(502, 'PREVIEW_CACHE_FAILED', 'The converted preview could not be loaded.');
  const filename = String(file.original_filename).replace(/\.[^.]+$/, '') + '.pdf';
  return new Response(object.body, { headers: {
    'Cache-Control': 'private, no-store',
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  } });
}

async function contentFile(context, user, fileId) {
  const file = await accessibleFile(context.env.DB, user, fileId, ['available']);
  if (isDriveObject(file.object_key)) return streamDriveFile(context.env, file, context.request, new URL(context.request.url).searchParams.get('download') === '1');
  if (!isR2HearingObject(file.object_key) || !context.env.R2_STORAGE) throw new HttpError(404, 'NOT_FOUND', 'Content route is unavailable for this storage object.');
  const size = Number(file.actual_size ?? file.expected_size),rangeHeader=String(context.request.headers.get('range')||''),match=rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
  let status=200,options,contentRange=null,contentLength=size;
  if (rangeHeader && !match) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'}});
  if (match) {
    const start=Number(match[1]),requestedEnd=match[2]?Number(match[2]):size-1,end=Math.min(requestedEnd,size-1);
    if (!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'}});
    contentLength=end-start+1;contentRange=`bytes ${start}-${end}/${size}`;options={range:{offset:start,length:contentLength}};status=206;
  }
  const object=await context.env.R2_STORAGE.get(file.object_key,options);
  if (!object) throw new HttpError(404,'FILE_NOT_FOUND','File was not found.');
  const download=new URL(context.request.url).searchParams.get('download')==='1';
  const headers=new Headers({
    'Cache-Control':'private, no-store','Content-Type':file.content_type,
    'Content-Disposition':`${download?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(file.original_filename)}`,
    'Content-Length':String(contentLength),'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
  });
  if(contentRange)headers.set('Content-Range',contentRange);if(object.etag)headers.set('ETag',object.etag);
  return new Response(object.body,{status,headers});
}

async function deleteFile(context, user, fileId) {
  const file = await accessibleFile(context.env.DB, user, fileId, undefined, { remove: true });
  if (file.status === 'deleted') return ok({ id: fileId, deleted: true });
  if (!['pending', 'available', 'upload_failed', 'delete_failed', 'quarantined', 'deleting'].includes(file.status)) throw new HttpError(409, 'FILE_DELETE_IN_PROGRESS', 'File deletion is already in progress.');
  const now = Date.now();
  await context.env.DB.prepare("UPDATE files SET status = 'deleting', updated_at = ? WHERE id = ?").bind(now, fileId).run();
  try {
    if (isDriveObject(file.object_key)) {
      const session = driveObjectId(file.object_key) ? null : await readUploadSession(context.env, fileId);
      await deleteDriveFile(context.env, driveObjectId(file.object_key) || session?.driveFileId);
    }
    else if (isR2HearingObject(file.object_key)) {
      if (!context.env.R2_STORAGE) throw new Error('R2 hearing audio storage is unavailable');
      await context.env.R2_STORAGE.delete(file.object_key);
    }
    else {
      const query = file.gcs_generation ? { ifGenerationMatch: file.gcs_generation } : {};
      const signed = await signedObjectUrl(context.env, file.object_key, 'DELETE', { expires: 60, query });
      const response = await fetch(signed.url, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) throw new Error(`GCS delete status ${response.status}`);
    }
    await deleteR2Manifest(context.env, fileId);
    await deleteR2Preview(context.env, fileId);
    await deleteUploadSession(context.env, fileId);
    await context.env.DB.prepare("UPDATE files SET status = 'deleted', deleted_at = ?, updated_at = ?, last_error = NULL WHERE id = ?").bind(Date.now(), Date.now(), fileId).run();
    return ok({ id: fileId, deleted: true });
  } catch (error) {
    await context.env.DB.prepare("UPDATE files SET status = 'delete_failed', last_error = ?, updated_at = ? WHERE id = ?").bind('storage_delete_failed', Date.now(), fileId).run();
    logEvent('error', 'file.deletion_failed', { userId: user.id, fileId });
    throw new HttpError(502, 'FILE_DELETE_INCOMPLETE', 'Storage deletion failed and can be retried.');
  }
}

async function dispatch(context) {
  requireDb(context.env);
  assertSameOrigin(context.request, context.env);
  const method = context.request.method;
  const path = routePath(context.request);
  if (method === 'POST' && path === 'auth/signup') return signup(context);
  if (method === 'POST' && path === 'auth/login') return login(context);
  if (method === 'POST' && path === 'auth/password-recovery/request') return passwordRecoveryRequest(context);
  if (method === 'POST' && path === 'auth/password-recovery/reset') return passwordRecoveryReset(context);
  if (method === 'GET' && path === 'auth/session') return session(context);
  if (method === 'POST' && path === 'auth/logout') return logout(context);
  const courseResponse = await dispatchCourseRoute(context, method, path);
  if (courseResponse) return courseResponse;
  const user = await actorFor(context.env.DB, await requireUser(context), context.env);
  if (method === 'POST' && path === 'translate') {
    const input = await readJson(context.request, 16384);
    return ok({ translations: await translateInterfaceText(context.env, input) });
  }
  if (method === 'POST' && path === 'sync/hydrate') return hydrate(context, user);
  if (method === 'POST' && path === 'sync/mutations') return mutate(context, user);
  if (method === 'POST' && path === 'files/upload-init') return uploadInit(context, user);
  if (method === 'GET' && path === 'files') return listFiles(context, user);
  const match = path.match(/^files\/([0-9a-f-]{36})(?:\/(complete|view|content|upload|preview))?$/i);
  if (match && method === 'PUT' && match[2] === 'upload') return uploadFileContent(context, user, match[1]);
  if (match && method === 'POST' && match[2] === 'complete') return completeUpload(context, user, match[1]);
  if (match && method === 'GET' && match[2] === 'view') return viewFile(context, user, match[1]);
  if (match && method === 'GET' && match[2] === 'content') return contentFile(context, user, match[1]);
  if (match && method === 'GET' && match[2] === 'preview') return previewFile(context, user, match[1]);
  if (match && method === 'GET' && !match[2]) return fileMetadata(context, user, match[1]);
  if (match && method === 'DELETE' && !match[2]) return deleteFile(context, user, match[1]);
  throw new HttpError(404, 'NOT_FOUND', 'API route was not found.');
}

export async function onRequest(context) {
  try { return await dispatch(context); }
  catch (error) { if (!error.status) logEvent('error', 'api.unhandled', { name: error.name }); return fail(error); }
}
