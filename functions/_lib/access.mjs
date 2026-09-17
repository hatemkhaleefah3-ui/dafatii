import { HttpError } from './http.mjs';
import { can, dafaaWithMembership } from './dafat.mjs';

export async function ownedFile(db, userId, fileId, allowedStates) {
  const file = await db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').bind(fileId, userId).first();
  if (!file || (allowedStates && !allowedStates.includes(file.status))) throw new HttpError(404, 'FILE_NOT_FOUND', 'File was not found.');
  return file;
}
export const publicFileDto = file => ({
  id: file.id, filename: file.original_filename, contentType: file.content_type, size: file.actual_size ?? file.expected_size,
  status: file.status, dafaaId: file.dafaa_id || null, createdAt: file.created_at, availableAt: file.available_at || null
});

export async function accessibleFile(db, actor, fileId, allowedStates, { remove = false } = {}) {
  const file = await db.prepare('SELECT * FROM files WHERE id = ?').bind(fileId).first();
  if (!file || (allowedStates && !allowedStates.includes(file.status))) throw new HttpError(404, 'FILE_NOT_FOUND', 'File was not found.');
  if (file.user_id === actor.id && !file.dafaa_id) return file;
  if (!file.dafaa_id) throw new HttpError(404, 'FILE_NOT_FOUND', 'File was not found.');
  const dafaa = await dafaaWithMembership(db, file.dafaa_id, actor.id);
  const allowed = actor.isAdmin || (dafaa?.status === 'active' && dafaa.membership_status === 'active' && (!remove || can(dafaa, actor, 'can_remove_content')));
  if (!allowed) throw new HttpError(404, 'FILE_NOT_FOUND', 'File was not found.');
  return file;
}
