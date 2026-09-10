import { HttpError } from './http.mjs';

export async function ownedFile(db, userId, fileId, allowedStates) {
  const file = await db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').bind(fileId, userId).first();
  if (!file || (allowedStates && !allowedStates.includes(file.status))) throw new HttpError(404, 'FILE_NOT_FOUND', 'File was not found.');
  return file;
}
export const publicFileDto = file => ({
  id: file.id, filename: file.original_filename, contentType: file.content_type, size: file.actual_size ?? file.expected_size,
  status: file.status, createdAt: file.created_at, availableAt: file.available_at || null
});

