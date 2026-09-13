import { authenticateUser, clearAuthRateLimit, clearSessionCookie, createSession, createUser, enforceAuthRateLimit, normalizeEmail, requireUser, revokeCurrentSession, sessionCookie, validateAccountInput } from '../../_lib/auth.mjs';
import { accessibleFile, ownedFile, publicFileDto } from '../../_lib/access.mjs';
import { dispatchCourseRoute } from '../../_lib/course-routes.mjs';
import { actorFor, publicActor, requireCourseView, requirePermission } from '../../_lib/courses.mjs';
import { deleteDriveFile, driveObjectId, inspectDrivePrefix, isDriveObject, readDriveMetadata, startDriveUpload, streamDriveFile, validDriveId, verifyDriveMetadata } from '../../_lib/drive.mjs';
import { completionDisposition, inspectObject, inspectObjectPrefix, signedObjectUrl, verifyCompletedObject, verifyMagicBytes } from '../../_lib/gcs.mjs';
import { assertSameOrigin, fail, HttpError, logEvent, ok, readJson } from '../../_lib/http.mjs';
import { isUuid, objectKey, positiveIntegerSetting, validateRecord, validateUpload } from '../../_lib/policy.mjs';

const recordDto = row => ({ key: row.record_key, format: row.format, value: row.deleted ? null : JSON.parse(row.value_json), deleted: Boolean(row.deleted), revision: row.revision, updatedAt: row.updated_at });
const requireDb = env => { if (!env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.'); };
const routePath = request => new URL(request.url).pathname.replace(/^\/api\/v1\/?/, '');
const usesDrive = env => String(env.STORAGE_PROVIDER || 'gcs').toLowerCase() === 'drive';

async function writeR2Manifest(env, file) {
  if (!env.R2_STORAGE) return;
  await env.R2_STORAGE.put(`files/${file.id}/manifest.json`, JSON.stringify({
    id: file.id, ownerId: file.user_id, courseId: file.course_id || null, filename: file.original_filename,
    contentType: file.content_type, size: Number(file.actual_size ?? file.expected_size), storage: isDriveObject(file.object_key) ? 'google-drive' : 'gcs', updatedAt: Date.now()
  }), { httpMetadata: { contentType: 'application/json' } });
}

async function deleteR2Manifest(env, fileId) { if (env.R2_STORAGE) await env.R2_STORAGE.delete(`files/${fileId}/manifest.json`); }

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
  const input = validateUpload(raw, context.env);
  const courseId = raw.courseId ? String(raw.courseId) : null;
  if (courseId) { if (!isUuid(courseId)) throw new HttpError(400, 'INVALID_IDENTIFIER', 'Course identifier is invalid.'); await requirePermission(context.env.DB, user, courseId, 'can_add_content'); }
  const uploadLimit = positiveIntegerSetting(context.env.UPLOAD_INIT_LIMIT, 60, { maximum: 10000 });
  const quota = positiveIntegerSetting(context.env.USER_STORAGE_QUOTA_BYTES, 10737418240);
  const now = Date.now();
  const recent = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM files WHERE user_id = ? AND created_at > ?").bind(user.id, now - 3600000).first();
  if (Number(recent?.count || 0) >= uploadLimit) throw new HttpError(429, 'UPLOAD_RATE_LIMITED', 'Upload initialization limit reached.');
  const usage = await context.env.DB.prepare("SELECT COALESCE(SUM(CASE WHEN status = 'pending' THEN expected_size ELSE actual_size END), 0) AS bytes FROM files WHERE user_id = ? AND status IN ('pending', 'available', 'quarantined', 'delete_failed')").bind(user.id).first();
  if (Number(usage?.bytes || 0) + input.size > quota) throw new HttpError(413, 'STORAGE_QUOTA_EXCEEDED', 'Account storage quota would be exceeded.');
  const fileId = crypto.randomUUID();
  const key = usesDrive(context.env) ? `drive/pending/${fileId}` : objectKey(user.id, fileId);
  const expiresAt = now + 15 * 60 * 1000;
  await context.env.DB.prepare(`INSERT INTO files
    (id, user_id, course_id, object_key, original_filename, content_type, expected_size, status, upload_expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`).bind(fileId, user.id, courseId, key, input.filename, input.contentType, input.size, expiresAt, now, now).run();
  try {
    if (usesDrive(context.env)) {
      const file = { id: fileId, user_id: user.id, course_id: courseId, object_key: key, original_filename: input.filename, content_type: input.contentType, expected_size: input.size };
      const uploadUrl = await startDriveUpload(context.env, file, user.id);
      logEvent('info', 'file.upload_initialized', { userId: user.id, fileId, provider: 'drive', size: input.size, contentType: input.contentType });
      return ok({ fileId, upload: { url: uploadUrl, method: 'PUT', provider: 'drive', expiresAt, headers: { 'Content-Type': input.contentType } } }, 201);
    }
    const signed = await signedObjectUrl(context.env, key, 'PUT', { expires: 900, contentType: input.contentType, contentLength: input.size, fileId, query: { ifGenerationMatch: '0' } });
    logEvent('info', 'file.upload_initialized', { userId: user.id, fileId, size: input.size, contentType: input.contentType });
    return ok({ fileId, upload: { url: signed.url, method: 'PUT', expiresAt, headers: { 'Content-Type': input.contentType, 'x-goog-meta-dafatii-file-id': fileId } } }, 201);
  } catch (error) {
    await context.env.DB.prepare("UPDATE files SET status = 'upload_failed', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('storage_init_failed', Date.now(), fileId, user.id).run();
    logEvent('error', 'storage.upload_init_failed', { userId: user.id, fileId, provider: usesDrive(context.env) ? 'drive' : 'gcs' });
    throw error;
  }
}

async function completeUpload(context, user, fileId) {
  const input = await readJson(context.request, 4096);
  const file = await ownedFile(context.env.DB, user.id, fileId);
  if (completionDisposition(file.status) === 'already_complete') {
    await writeR2Manifest(context.env, file);
    return ok(publicFileDto(file));
  }
  if (isDriveObject(file.object_key)) {
    const remoteId = String(input.driveFileId || '');
    if (!validDriveId(remoteId)) throw new HttpError(400, 'INVALID_DRIVE_FILE', 'Google Drive upload result is missing or invalid.');
    const metadata = verifyDriveMetadata(context.env, file, await readDriveMetadata(context.env, remoteId), user.id);
    try { verifyMagicBytes(file.content_type, await inspectDrivePrefix(context.env, remoteId)); }
    catch (error) {
      if (error.code === 'FILE_CONTENT_MISMATCH') await context.env.DB.prepare("UPDATE files SET status = 'quarantined', scan_status = 'rejected', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('content_type_mismatch', Date.now(), fileId, user.id).run();
      throw error;
    }
    const now = Date.now();
    const objectKey = `drive/${remoteId}`;
    const updated = await context.env.DB.prepare(`UPDATE files SET object_key = ?, status = 'available', actual_size = ?, etag = ?, available_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND status = 'pending'`).bind(objectKey, metadata.size, metadata.etag, now, now, fileId, user.id).run();
    const available = { ...file, object_key: objectKey, status: 'available', actual_size: metadata.size, etag: metadata.etag, available_at: now };
    if (updated.meta?.changes) await writeR2Manifest(context.env, available);
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
  const download = new URL(context.request.url).searchParams.get('download') === '1';
  if (isDriveObject(file.object_key)) return ok({ url: `/api/v1/files/${file.id}/content${download ? '?download=1' : ''}`, expiresAt: null });
  const disposition = `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.original_filename)}`;
  const signed = await signedObjectUrl(context.env, file.object_key, 'GET', { expires: 600, query: { 'response-content-disposition': disposition, 'response-content-type': file.content_type } });
  return ok({ url: signed.url, expiresAt: Date.now() + 600000 });
}

async function contentFile(context, user, fileId) {
  const file = await accessibleFile(context.env.DB, user, fileId, ['available']);
  if (!isDriveObject(file.object_key)) throw new HttpError(404, 'NOT_FOUND', 'Content route is unavailable for this storage object.');
  return streamDriveFile(context.env, file, context.request, new URL(context.request.url).searchParams.get('download') === '1');
}

async function deleteFile(context, user, fileId) {
  const file = await accessibleFile(context.env.DB, user, fileId, undefined, { remove: true });
  if (file.status === 'deleted') return ok({ id: fileId, deleted: true });
  if (!['pending', 'available', 'upload_failed', 'delete_failed', 'quarantined', 'deleting'].includes(file.status)) throw new HttpError(409, 'FILE_DELETE_IN_PROGRESS', 'File deletion is already in progress.');
  const now = Date.now();
  await context.env.DB.prepare("UPDATE files SET status = 'deleting', updated_at = ? WHERE id = ?").bind(now, fileId).run();
  try {
    if (isDriveObject(file.object_key)) await deleteDriveFile(context.env, driveObjectId(file.object_key));
    else {
      const query = file.gcs_generation ? { ifGenerationMatch: file.gcs_generation } : {};
      const signed = await signedObjectUrl(context.env, file.object_key, 'DELETE', { expires: 60, query });
      const response = await fetch(signed.url, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) throw new Error(`GCS delete status ${response.status}`);
    }
    await deleteR2Manifest(context.env, fileId);
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
  if (method === 'GET' && path === 'auth/session') return session(context);
  if (method === 'POST' && path === 'auth/logout') return logout(context);
  const courseResponse = await dispatchCourseRoute(context, method, path);
  if (courseResponse) return courseResponse;
  const user = await actorFor(context.env.DB, await requireUser(context), context.env);
  if (method === 'POST' && path === 'sync/hydrate') return hydrate(context, user);
  if (method === 'POST' && path === 'sync/mutations') return mutate(context, user);
  if (method === 'POST' && path === 'files/upload-init') return uploadInit(context, user);
  if (method === 'GET' && path === 'files') return listFiles(context, user);
  const match = path.match(/^files\/([0-9a-f-]{36})(?:\/(complete|view|content))?$/i);
  if (match && method === 'POST' && match[2] === 'complete') return completeUpload(context, user, match[1]);
  if (match && method === 'GET' && match[2] === 'view') return viewFile(context, user, match[1]);
  if (match && method === 'GET' && match[2] === 'content') return contentFile(context, user, match[1]);
  if (match && method === 'GET' && !match[2]) return fileMetadata(context, user, match[1]);
  if (match && method === 'DELETE' && !match[2]) return deleteFile(context, user, match[1]);
  throw new HttpError(404, 'NOT_FOUND', 'API route was not found.');
}

export async function onRequest(context) {
  try { return await dispatch(context); }
  catch (error) { if (!error.status) logEvent('error', 'api.unhandled', { name: error.name }); return fail(error); }
}
