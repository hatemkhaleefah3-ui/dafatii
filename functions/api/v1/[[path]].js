import { ApiError, errorResponse, json, logEvent, readJson, requireSameOrigin } from '../../_lib/http.js';
import { clearSessionCookie, login, logout, requireUser, sessionCookie, signup } from '../../_lib/auth.js';
import { deleteObject, headObject, signGcsUrl } from '../../_lib/gcs.js';
import { randomId } from '../../_lib/crypto.js';

const MAX_FILE_SIZE = 512 * 1024 * 1024;
const BLOCKED_TYPES = new Set(['text/html','application/xhtml+xml','image/svg+xml','application/javascript','text/javascript']);
const ALLOWED_PREFIXES = ['image/','audio/','video/','application/pdf','application/zip','application/x-zip-compressed','application/msword','application/vnd.openxmlformats-officedocument','application/vnd.ms-','text/plain','text/csv'];

function safeName(name) {
  return String(name || 'file').normalize('NFC').replace(/[\u0000-\u001f\u007f/\\]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 180) || 'file';
}
function allowedType(type) { return type && !BLOCKED_TYPES.has(type) && ALLOWED_PREFIXES.some(v => type === v || type.startsWith(v)); }
function pathParts(context) {
  const value = context.params.path;
  return (Array.isArray(value) ? value : String(value || '').split('/')).filter(Boolean).map(decodeURIComponent);
}
async function getOwnedFile(env, userId, fileId, includeDeleted = false) {
  const row = await env.DB.prepare(`SELECT * FROM files WHERE id=? AND user_id=?${includeDeleted ? '' : " AND status!='deleted'"}`).bind(fileId,userId).first();
  if (!row) throw new ApiError(404, 'file_not_found', 'File not found.');
  return row;
}
function fileDto(row) { return { id: row.id, name: row.original_name, contentType: row.content_type, size: row.actual_size ?? row.expected_size, status: row.status, createdAt: row.created_at, completedAt: row.completed_at }; }

async function authRoute(context, parts) {
  const { request, env } = context;
  if (parts[1] === 'signup' && request.method === 'POST') {
    const result = await signup(request, env, await readJson(request, 16384));
    const user = await requireUser(new Request(request.url, { headers: { Cookie: `__Host-dafatii_session=${result.token}` } }), env);
    return json({ user, expiresAt: result.expiresAt }, 201, { 'Set-Cookie': sessionCookie(result.token) });
  }
  if (parts[1] === 'login' && request.method === 'POST') {
    const result = await login(request, env, await readJson(request, 16384));
    const user = await requireUser(new Request(request.url, { headers: { Cookie: `__Host-dafatii_session=${result.token}` } }), env);
    return json({ user, expiresAt: result.expiresAt }, 200, { 'Set-Cookie': sessionCookie(result.token) });
  }
  if (parts[1] === 'session' && request.method === 'GET') return json({ user: await requireUser(request, env) });
  if (parts[1] === 'logout' && request.method === 'POST') { await logout(request, env); return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() }); }
  throw new ApiError(404, 'route_not_found', 'API route not found.');
}

async function dataRoute(context, parts) {
  const { request, env } = context; const user = await requireUser(request, env);
  if (parts[1] === 'sync' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT record_key,format,value_json,deleted,revision,updated_at FROM records WHERE user_id=? ORDER BY record_key').bind(user.id).all();
    return json({ records: results.map(r => ({ key:r.record_key, format:r.format, value:r.deleted ? null : JSON.parse(r.value_json), deleted:Boolean(r.deleted), revision:r.revision, updatedAt:r.updated_at })) });
  }
  if (parts[1] === 'import' && request.method === 'POST') {
    const body = await readJson(request, 1024 * 1024); const records = Array.isArray(body.records) ? body.records.slice(0, 250) : [];
    let imported = 0; const now = Date.now();
    for (const record of records) {
      const key = String(record.key || ''); if (!key.startsWith('dafatii:') || ['dafatii:theme','dafatii:direction'].includes(key)) continue;
      const format = record.format === 'string' ? 'string' : 'json'; const valueJson = JSON.stringify(record.value ?? null);
      const result = await env.DB.prepare('INSERT OR IGNORE INTO records(user_id,record_key,format,value_json,deleted,revision,mutation_id,client_updated_at,updated_at) VALUES(?,?,?,?,0,1,?,?,?)').bind(user.id,key,format,valueJson,randomId('imp'),record.updatedAt || null,now).run();
      imported += Number(result.meta?.changes || 0);
    }
    await env.DB.prepare('UPDATE users SET imported_at=COALESCE(imported_at,?), updated_at=? WHERE id=?').bind(now,now,user.id).run();
    logEvent('data_import', { userId:user.id, imported }); return json({ imported });
  }
  if (parts[1] === 'record' && request.method === 'PUT') {
    const body = await readJson(request, 512 * 1024); const key = String(body.key || '');
    if (!key.startsWith('dafatii:') || ['dafatii:theme','dafatii:direction'].includes(key)) throw new ApiError(400,'invalid_record','Record key is not synchronizable.');
    const mutationId = String(body.mutationId || ''); if (!mutationId || mutationId.length > 100) throw new ApiError(400,'invalid_mutation','A mutation ID is required.');
    const duplicate = await env.DB.prepare('SELECT revision FROM records WHERE user_id=? AND mutation_id=?').bind(user.id,mutationId).first();
    if (duplicate) return json({ ok:true, revision:duplicate.revision, duplicate:true });
    const current = await env.DB.prepare('SELECT revision FROM records WHERE user_id=? AND record_key=?').bind(user.id,key).first();
    const expected = body.expectedRevision == null ? 0 : Number(body.expectedRevision);
    if (Number(current?.revision || 0) !== expected) { logEvent('sync_conflict',{userId:user.id,key}); throw new ApiError(409,'revision_conflict','Record has a newer server revision.',{currentRevision:Number(current?.revision||0)}); }
    const revision = expected + 1, now = Date.now(), format = body.format === 'string' ? 'string' : 'json', deleted = body.deleted ? 1 : 0;
    await env.DB.prepare(`INSERT INTO records(user_id,record_key,format,value_json,deleted,revision,mutation_id,client_updated_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,record_key) DO UPDATE SET format=excluded.format,value_json=excluded.value_json,deleted=excluded.deleted,revision=excluded.revision,mutation_id=excluded.mutation_id,client_updated_at=excluded.client_updated_at,updated_at=excluded.updated_at`).bind(user.id,key,format,JSON.stringify(body.value ?? null),deleted,revision,mutationId,body.updatedAt||null,now).run();
    return json({ ok:true, revision });
  }
  throw new ApiError(404,'route_not_found','API route not found.');
}

async function filesRoute(context, parts) {
  const { request, env } = context; const user = await requireUser(request, env);
  if (parts[1] === 'upload-init' && request.method === 'POST') {
    const body = await readJson(request, 16384), size = Number(body.size), type = String(body.contentType || '').toLowerCase().split(';')[0].trim();
    if (!Number.isSafeInteger(size) || size <= 0 || size > Number(env.MAX_UPLOAD_BYTES || MAX_FILE_SIZE)) throw new ApiError(413,'file_too_large','File size is invalid or exceeds the upload limit.');
    if (!allowedType(type)) throw new ApiError(415,'file_type_rejected','This file type is not allowed.');
    const id = randomId('fil'), objectKey = `users/${user.id}/${id}/object`, name = safeName(body.name), now = Date.now();
    await env.DB.prepare('INSERT INTO files(id,user_id,object_key,original_name,content_type,expected_size,status,created_at,updated_at) VALUES(?,?,?,?,?,?,\'pending\',?,?)').bind(id,user.id,objectKey,name,type,size,now,now).run();
    const signed = await signGcsUrl(env,{method:'PUT',objectKey,expires:600,headers:{'content-type':type,'x-goog-meta-dafatii-file-id':id}});
    logEvent('upload_init',{userId:user.id,fileId:id,size,type});
    return json({ fileId:id, upload:{ url:signed.url, method:'PUT', expiresAt:signed.expiresAt, headers:{'Content-Type':type,'x-goog-meta-dafatii-file-id':id} } },201);
  }
  const fileId = parts[1]; if (!fileId) throw new ApiError(404,'route_not_found','API route not found.');
  const file = await getOwnedFile(env,user.id,fileId);
  if (parts[2] === 'complete' && request.method === 'POST') {
    if (file.status === 'available') return json({ file:fileDto(file), duplicate:true });
    if (file.status !== 'pending') throw new ApiError(409,'invalid_file_state','File cannot be completed from its current state.');
    const object = await headObject(env,file); if (!object) throw new ApiError(409,'upload_incomplete','Uploaded object is not present yet.');
    if (object.fileId !== file.id || object.size !== Number(file.expected_size) || object.contentType.toLowerCase().split(';')[0] !== file.content_type) throw new ApiError(409,'upload_mismatch','Uploaded object metadata does not match the authorized upload.');
    const now=Date.now(); await env.DB.prepare("UPDATE files SET status='available',actual_size=?,completed_at=?,updated_at=? WHERE id=? AND user_id=? AND status='pending'").bind(object.size,now,now,file.id,user.id).run();
    const updated=await getOwnedFile(env,user.id,file.id); logEvent('upload_complete',{userId:user.id,fileId:file.id,size:object.size}); return json({file:fileDto(updated)});
  }
  if (parts[2] === 'view' && request.method === 'GET') {
    if (file.status !== 'available') throw new ApiError(409,'file_unavailable','File is not available.');
    const signed=await signGcsUrl(env,{method:'GET',objectKey:file.object_key,expires:600,query:{'response-content-disposition':`inline; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,'response-content-type':file.content_type}});
    return json({file:fileDto(file),url:signed.url,expiresAt:signed.expiresAt});
  }
  if (request.method === 'GET' && !parts[2]) return json({file:fileDto(file)});
  if (request.method === 'DELETE' && !parts[2]) {
    if (file.status === 'deleted') return json({ok:true,duplicate:true});
    await env.DB.prepare("UPDATE files SET status='delete_pending',updated_at=? WHERE id=? AND user_id=?").bind(Date.now(),file.id,user.id).run();
    try { await deleteObject(env,file.object_key); } catch (error) { logEvent('file_delete_failure',{userId:user.id,fileId:file.id}); throw error; }
    const now=Date.now(); await env.DB.prepare("UPDATE files SET status='deleted',deleted_at=?,updated_at=? WHERE id=? AND user_id=?").bind(now,now,file.id,user.id).run(); return json({ok:true});
  }
  throw new ApiError(404,'route_not_found','API route not found.');
}

export async function onRequest(context) {
  const requestId = crypto.randomUUID();
  try {
    requireSameOrigin(context.request, context.env);
    const parts = pathParts(context);
    if (parts[0] === 'auth') return await authRoute(context, parts);
    if (parts[0] === 'data') return await dataRoute(context, parts);
    if (parts[0] === 'files') return await filesRoute(context, parts);
    throw new ApiError(404,'route_not_found','API route not found.');
  } catch (error) {
    if (!(error instanceof ApiError)) console.error(JSON.stringify({event:'api_error',requestId,message:error?.message || 'unknown'}));
    return errorResponse(error,requestId);
  }
}
