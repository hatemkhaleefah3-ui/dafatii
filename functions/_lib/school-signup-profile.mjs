import { ensureSchoolTeacherSchema } from './school-teachers.mjs';

export async function prepareAcademicProfileInsert(db, userId, identity, now = Date.now()) {
  if (!identity?.academicLevel || !identity?.academicStage) return null;
  await ensureSchoolTeacherSchema(db);
  const institutionName = String(identity.institutionName || [identity.universityName, identity.collegeName].filter(Boolean).join(' · ') || '').trim();
  return db.prepare(`INSERT INTO student_academic_profiles
    (user_id, academic_level, academic_stage, academic_field, institution_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET academic_level = excluded.academic_level,
      academic_stage = excluded.academic_stage, academic_field = excluded.academic_field,
      institution_name = excluded.institution_name, updated_at = excluded.updated_at`)
    .bind(
      userId,
      identity.academicLevel,
      identity.academicStage,
      identity.academicField || null,
      institutionName,
      now,
      now
    );
}

export const prepareSchoolAcademicProfileInsert = prepareAcademicProfileInsert;
