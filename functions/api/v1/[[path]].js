import { authenticateUser, clearAuthRateLimit, clearSessionCookie, createSession, createUser, enforceAuthRateLimit, normalizeEmail, requireUser, revokeCurrentSession, validateAccountInput } from '../../_lib/auth.mjs';
import { ownedFile, publicFileDto } from '../../_lib/access.mjs';
import { completionDisposition, inspectObject, inspectObjectPrefix, signedObjectUrl, verifyCompletedObject, verifyMagicBytes } from '../../_lib/gcs.mjs';
import { assertSameOrigin, fail, HttpError, logEvent, ok, readJson } from '../../_lib/http.mjs';
import { isUuid, objectKey, positiveIntegerSetting, validateRecord, validateUpload } from '../../_lib/policy.mjs';

const recordDto = row => ({ key: row.record_key, format: row.format, value: row.deleted ? null : JSON.parse(row.value_json), deleted: Boolean(row.deleted), revision: row.revision, updatedAt: row.updated_at });
const requireDb = env => { if (!env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.'); };
const routePath = request => new URL(request.url).pathname.replace(/^\/api\/v1\/?/, '');

async function signup(context) {
  const input = await readJson(context.request, 16384);
  const candidate = validateAccountInput(input, true);
  const fingerprint = await enforceAuthRateLimit(context.env.DB, context.request, candidate.email, context.env);
  try {
    const user = await createUser(context.env.DB, candidate);
    const session = await createSession(context.env.DB, user.id, context.request);
    await clearAuthRateLimit(context.env.DB, fingerprint);
    logEvent('info', 'auth.signup', { userId: user.id });
    return ok({ user, expiresAt: session.expiresAt }, 201, { 'Set-Cookie': session.cookie });
  } catch (error) { logEvent('warn', 'auth.signup_failed', { code: error.code }); throw error; }
}

async function login(context) {
  const input = await readJson(context.request, 16384);
  const candidate = validateAccountInput(input, false);
  const fingerprint = await enforceAuthRateLimit(context.env.DB, context.request, candidate.email, context.env);
  try {
    const user = await authenticateUser(context.env.DB, candidate.email, candidate.password);
    const session = await createSession(context.env.DB, user.id, context.request);
    await clearAuthRateLimit(context.env.DB, fingerprint);
    logEvent('info', 'auth.login', { userId: user.id });
    return ok({ user, expiresAt: session.expiresAt }, 200, { 'Set-Cookie': session.cookie });
  } catch (error) { logEvent('warn', 'auth.login_failed', { code: error.code }); throw error; }
}

async function session(context) {
  const user = await requireUser(context);
  return ok({ user: { id: user.id, email: user.email, displayName: user.displayName } });
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
  const input = validateUpload(await readJson(context.request, 32768), context.env);
  const uploadLimit = positiveIntegerSetting(context.env.UPLOAD_INIT_LIMIT, 60, { maximum: 10000 });
  const quota = positiveIntegerSetting(context.env.USER_STORAGE_QUOTA_BYTES, 10737418240);
  const now = Date.now();
  const recent = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM files WHERE user_id = ? AND created_at > ?").bind(user.id, now - 3600000).first();
  if (Number(recent?.count || 0) >= uploadLimit) throw new HttpError(429, 'UPLOAD_RATE_LIMITED', 'Upload initialization limit reached.');
  const usage = await context.env.DB.prepare("SELECT COALESCE(SUM(CASE WHEN status = 'pending' THEN expected_size ELSE actual_size END), 0) AS bytes FROM files WHERE user_id = ? AND status IN ('pending', 'available', 'quarantined', 'delete_failed')").bind(user.id).first();
  if (Number(usage?.bytes || 0) + input.size > quota) throw new HttpError(413, 'STORAGE_QUOTA_EXCEEDED', 'Account storage quota would be exceeded.');
  const fileId = crypto.randomUUID();
  const key = objectKey(user.id, fileId);
  const expiresAt = now + 15 * 60 * 1000;
  await context.env.DB.prepare(`INSERT INTO files
    (id, user_id, object_key, original_filename, content_type, expected_size, status, upload_expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`).bind(fileId, user.id, key, input.filename, input.contentType, input.size, expiresAt, now, now).run();
  try {
    const signed = await signedObjectUrl(context.env, key, 'PUT', { expires: 900, contentType: input.contentType, contentLength: input.size, fileId, query: { ifGenerationMatch: '0' } });
    logEvent('info', 'file.upload_initialized', { userId: user.id, fileId, size: input.size, contentType: input.contentType });
    return ok({ fileId, upload: { url: signed.url, method: 'PUT', expiresAt, headers: { 'Content-Type': input.contentType, 'x-goog-meta-dafatii-file-id': fileId } } }, 201);
  } catch (error) {
    await context.env.DB.prepare("UPDATE files SET status = 'upload_failed', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('signing_failed', Date.now(), fileId, user.id).run();
    logEvent('error', 'gcs.signing_failed', { userId: user.id, fileId });
    throw error;
  }
}

async function completeUpload(context, user, fileId) {
  await readJson(context.request, 1024);
  const file = await ownedFile(context.env.DB, user.id, fileId);
  if (completionDisposition(file.status) === 'already_complete') return ok(publicFileDto(file));
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
  logEvent('info', 'file.upload_completed', { userId: user.id, fileId, size: metadata.size });
  return ok({ ...publicFileDto(file), status: 'available', size: metadata.size, availableAt: now });
}

async function fileMetadata(context, user, fileId) { return ok(publicFileDto(await ownedFile(context.env.DB, user.id, fileId))); }

async function listFiles(context, user) {
  const url = new URL(context.request.url);
  const requestedLimit = Number(url.searchParams.get('limit') || 50);
  if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) throw new HttpError(400, 'INVALID_LIMIT', 'File list limit is invalid.');
  const limit = Math.min(requestedLimit, 100);
  const result = await context.env.DB.prepare("SELECT * FROM files WHERE user_id = ? AND status != 'deleted' ORDER BY created_at DESC LIMIT ?").bind(user.id, limit).all();
  return ok({ files: result.results.map(publicFileDto) });
}

async function viewFile(context, user, fileId) {
  const file = await ownedFile(context.env.DB, user.id, fileId, ['available']);
  const download = new URL(context.request.url).searchParams.get('download') === '1';
  const disposition = `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.original_filename)}`;
  const signed = await signedObjectUrl(context.env, file.object_key, 'GET', { expires: 600, query: { 'response-content-disposition': disposition, 'response-content-type': file.content_type } });
  return ok({ url: signed.url, expiresAt: Date.now() + 600000 });
}

async function deleteFile(context, user, fileId) {
  const file = await ownedFile(context.env.DB, user.id, fileId);
  if (file.status === 'deleted') return ok({ id: fileId, deleted: true });
  if (!['pending', 'available', 'upload_failed', 'delete_failed', 'quarantined', 'deleting'].includes(file.status)) throw new HttpError(409, 'FILE_DELETE_IN_PROGRESS', 'File deletion is already in progress.');
  const now = Date.now();
  await context.env.DB.prepare("UPDATE files SET status = 'deleting', updated_at = ? WHERE id = ? AND user_id = ?").bind(now, fileId, user.id).run();
  try {
    const query = file.gcs_generation ? { ifGenerationMatch: file.gcs_generation } : {};
    const signed = await signedObjectUrl(context.env, file.object_key, 'DELETE', { expires: 60, query });
    const response = await fetch(signed.url, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) throw new Error(`GCS delete status ${response.status}`);
    await context.env.DB.prepare("UPDATE files SET status = 'deleted', deleted_at = ?, updated_at = ?, last_error = NULL WHERE id = ? AND user_id = ?").bind(Date.now(), Date.now(), fileId, user.id).run();
    return ok({ id: fileId, deleted: true });
  } catch (error) {
    await context.env.DB.prepare("UPDATE files SET status = 'delete_failed', last_error = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind('storage_delete_failed', Date.now(), fileId, user.id).run();
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
  const user = await requireUser(context);
  if (method === 'POST' && path === 'sync/hydrate') return hydrate(context, user);
  if (method === 'POST' && path === 'sync/mutations') return mutate(context, user);
  if (method === 'POST' && path === 'files/upload-init') return uploadInit(context, user);
  if (method === 'GET' && path === 'files') return listFiles(context, user);
  const match = path.match(/^files\/([0-9a-f-]{36})(?:\/(complete|view))?$/i);
  if (match && method === 'POST' && match[2] === 'complete') return completeUpload(context, user, match[1]);
  if (match && method === 'GET' && match[2] === 'view') return viewFile(context, user, match[1]);
  if (match && method === 'GET' && !match[2]) return fileMetadata(context, user, match[1]);
  if (match && method === 'DELETE' && !match[2]) return deleteFile(context, user, match[1]);
  throw new HttpError(404, 'NOT_FOUND', 'API route was not found.');
}

export async function onRequest(context) {
  try { return await dispatch(context); }
  catch (error) { if (!error.status) logEvent('error', 'api.unhandled', { name: error.name }); return fail(error); }
}
