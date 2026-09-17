import { HttpError, json } from './http.mjs';

export const COURSE_STUDY_TYPES = new Set(['chapters','systems','blocks','courses']);
let schemaReady = false;

export function normalizeCourseStudyType(value, fallback = 'courses') {
  const normalized = String(value ?? fallback).trim().toLowerCase();
  if (!COURSE_STUDY_TYPES.has(normalized)) throw new HttpError(400, 'INVALID_STUDY_TYPE', 'Study type must be Chapters, Systems, Blocks, or Courses.');
  return normalized;
}

export async function ensureCourseStudyTypeSchema(db) {
  if (schemaReady) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS course_study_types (
    course_id TEXT PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
    study_type TEXT NOT NULL DEFAULT 'courses' CHECK (study_type IN ('chapters','systems','blocks','courses')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  schemaReady = true;
}

export async function setCourseStudyType(db, courseId, studyType) {
  await ensureCourseStudyTypeSchema(db);
  const normalized = normalizeCourseStudyType(studyType);
  const now = Date.now();
  await db.prepare(`INSERT INTO course_study_types (course_id, study_type, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(course_id) DO UPDATE SET study_type = excluded.study_type, updated_at = excluded.updated_at`)
    .bind(courseId, normalized, now, now).run();
  return normalized;
}

async function studyTypeFor(db, courseId) {
  const row = await db.prepare('SELECT study_type FROM course_study_types WHERE course_id = ?').bind(courseId).first();
  return COURSE_STUDY_TYPES.has(row?.study_type) ? row.study_type : 'courses';
}

export async function attachCourseStudyTypes(db, response) {
  if (!(response instanceof Response) || response.status < 200 || response.status >= 300) return response;
  let payload;
  try { payload = await response.clone().json(); } catch { return response; }
  const data = payload?.data;
  if (!payload?.ok || !data || typeof data !== 'object') return response;

  const targets = [];
  if (data.course?.id) targets.push(data.course);
  if (Array.isArray(data.courses)) targets.push(...data.courses.filter(course => course?.id));
  if (!targets.length) return response;

  await ensureCourseStudyTypeSchema(db);
  for (const course of targets) course.studyType = await studyTypeFor(db, course.id);
  return json(payload, response.status, Object.fromEntries(response.headers.entries()));
}
