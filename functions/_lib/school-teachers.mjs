import { HttpError } from './http.mjs';
import { isUuid } from './policy.mjs';

export const SCHOOL_SUBJECTS = Object.freeze(['arabic','english','math','chemistry','physics','biology','islamic_book']);
const SUBJECT_SET = new Set(SCHOOL_SUBJECTS);
const SCHOOL_LEVELS = new Set(['primary_school','middle_school','preparatory_school']);
const SUBJECT_ALIASES = Object.freeze({
  arabic:['arabic','العربي','عربي','اللغة العربية'],
  english:['english','انكليزي','انكليزية','الانكليزية','اللغة الانكليزية','إنكليزي','الإنكليزية'],
  math:['math','mathematics','رياضيات','الرياضيات'],
  chemistry:['chemistry','كيمياء','الكيمياء'],
  physics:['physics','فيزياء','الفيزياء'],
  biology:['biology','احياء','أحياء','الاحياء','الأحياء'],
  islamic_book:['islamic','religion','اسلامية','إسلامية','الاسلامية','الإسلامية','التربية الاسلامية','التربية الإسلامية']
});
let schemaReady = false;

const clean = (value, maximum = 160) => String(value || '').trim().normalize('NFC').slice(0, maximum);
const nowMs = () => Date.now();

function normalizeSchoolIdentity(value = {}) {
  const academicLevel = String(value.academicLevel || value.academic_level || '').trim();
  if (!SCHOOL_LEVELS.has(academicLevel)) throw new HttpError(409, 'SCHOOL_PROFILE_REQUIRED', 'A valid school academic profile is required before choosing teachers.');
  const academicStage = String(value.academicStage || value.academic_stage || '').trim();
  const academicField = String(value.academicField || value.academic_field || '').trim();
  if (academicLevel === 'primary_school' && academicStage !== 'sixth') throw new HttpError(409, 'SCHOOL_PROFILE_REQUIRED', 'Primary school students must have the sixth stage profile.');
  if (academicLevel === 'middle_school' && academicStage !== 'third') throw new HttpError(409, 'SCHOOL_PROFILE_REQUIRED', 'Middle school students must have the third stage profile.');
  if (academicLevel === 'preparatory_school' && (academicStage !== 'sixth' || !['scientific','literary'].includes(academicField))) {
    throw new HttpError(409, 'SCHOOL_PROFILE_REQUIRED', 'Preparatory school students must have a sixth-stage scientific or literary profile.');
  }
  return {
    academicLevel,
    academicStage,
    academicField: academicLevel === 'preparatory_school' ? academicField : '',
    institutionName: clean(value.institutionName || value.institution_name)
  };
}

export async function ensureSchoolTeacherSchema(db) {
  if (schemaReady) return;
  const required = new Set(['student_academic_profiles','school_teacher_assignments','school_teacher_selections','school_teacher_profiles']);
  const existing = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('student_academic_profiles','school_teacher_assignments','school_teacher_selections','school_teacher_profiles')").all();
  for (const row of existing.results || []) required.delete(String(row.name));
  await db.prepare('DROP TRIGGER IF EXISTS block_school_student_course_insert').run();
  await db.prepare('DROP TRIGGER IF EXISTS block_school_student_course_update').run();
  if (required.size) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS student_academic_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      academic_level TEXT NOT NULL,
      academic_stage TEXT NOT NULL,
      academic_field TEXT,
      institution_name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS school_teacher_assignments (
      id TEXT PRIMARY KEY,
      teacher_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      academic_level TEXT,
      academic_stage TEXT,
      academic_field TEXT,
      fame_score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS school_teacher_selections (
      student_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      teacher_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (student_user_id, subject)
    )`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS school_teacher_profiles (
      teacher_user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL DEFAULT '',
      content_json TEXT NOT NULL DEFAULT '{"subjects":[]}',
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`).run();
    await db.prepare('CREATE INDEX IF NOT EXISTS school_teacher_assignments_match_idx ON school_teacher_assignments(subject, academic_level, academic_stage, academic_field, status, fame_score DESC)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS school_teacher_selections_teacher_idx ON school_teacher_selections(teacher_user_id, subject)').run();
    await db.prepare(`CREATE TRIGGER IF NOT EXISTS block_new_school_courses
      BEFORE INSERT ON courses WHEN NEW.stage = 'school'
      BEGIN SELECT RAISE(ABORT, 'SCHOOL_COURSES_REPLACED_BY_TEACHERS'); END`).run();
    await db.prepare(`CREATE TRIGGER IF NOT EXISTS block_course_stage_to_school
      BEFORE UPDATE OF stage ON courses WHEN NEW.stage = 'school'
      BEGIN SELECT RAISE(ABORT, 'SCHOOL_COURSES_REPLACED_BY_TEACHERS'); END`).run();
  }
  schemaReady = true;
}
async function academicRecord(db, userId) {
  const row = await db.prepare('SELECT academic_level, academic_stage, academic_field, institution_name FROM student_academic_profiles WHERE user_id = ?').bind(userId).first();
  if (!row) return null;
  return normalizeSchoolIdentity(row);
}

async function profileRecord(db, userId) {
  const row = await db.prepare("SELECT value_json FROM records WHERE user_id = ? AND record_key = 'dafatii:studentProfile:v2' AND deleted = 0 LIMIT 1").bind(userId).first();
  if (!row?.value_json) return null;
  try { return normalizeSchoolIdentity(JSON.parse(row.value_json)); }
  catch (error) { if (error instanceof HttpError) throw error; return null; }
}

export async function ensureSchoolStudentIdentity(db, actor) {
  if (!actor || actor.accountType !== 'student' || actor.studentStage !== 'school') throw new HttpError(403, 'SCHOOL_STUDENT_REQUIRED', 'This feature is only available to school student accounts.');
  await ensureSchoolTeacherSchema(db);
  let identity = await academicRecord(db, actor.id);
  if (!identity) {
    identity = await profileRecord(db, actor.id);
    if (!identity) throw new HttpError(409, 'SCHOOL_PROFILE_REQUIRED', 'Finish your school profile before choosing teachers.');
    const now = nowMs();
    await db.prepare(`INSERT INTO student_academic_profiles
      (user_id, academic_level, academic_stage, academic_field, institution_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET academic_level = excluded.academic_level, academic_stage = excluded.academic_stage,
        academic_field = excluded.academic_field, institution_name = excluded.institution_name, updated_at = excluded.updated_at`)
      .bind(actor.id, identity.academicLevel, identity.academicStage, identity.academicField || null, identity.institutionName, now, now).run();
  }
  return identity;
}

function normalizeSearchText(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[ًٌٍَُِّْـ]/g, '').replace(/\s+/g, ' ').trim();
}

function legacyMatchesSubject(name, subject) {
  const haystack = normalizeSearchText(name);
  return (SUBJECT_ALIASES[subject] || []).some(alias => haystack.includes(normalizeSearchText(alias)));
}

async function candidateMap(db, identity) {
  const [formalResult, legacyResult] = await Promise.all([
    db.prepare(`SELECT a.subject, a.teacher_user_id, u.display_name, a.fame_score,
        COALESCE(p.image_url, '') AS image_url, COALESCE(p.content_json, '{"subjects":[]}') AS content_json,
        COALESCE(sc.selection_count, 0) AS selection_count
      FROM school_teacher_assignments a
      JOIN users u ON u.id = a.teacher_user_id AND u.status = 'active'
      LEFT JOIN school_teacher_profiles p ON p.teacher_user_id = a.teacher_user_id AND p.status = 'active'
      LEFT JOIN (
        SELECT teacher_user_id, subject, COUNT(*) AS selection_count
        FROM school_teacher_selections GROUP BY teacher_user_id, subject
      ) sc ON sc.teacher_user_id = a.teacher_user_id AND sc.subject = a.subject
      WHERE a.status = 'active'
        AND (a.academic_level IS NULL OR a.academic_level = ?)
        AND (a.academic_stage IS NULL OR a.academic_stage = ?)
        AND (a.academic_field IS NULL OR a.academic_field = ?)
      ORDER BY a.subject, a.fame_score DESC, selection_count DESC, u.display_name COLLATE NOCASE ASC`)
      .bind(identity.academicLevel, identity.academicStage, identity.academicField || '').all(),
    db.prepare(`SELECT c.owner_user_id, u.display_name, c.name, c.institution,
        (SELECT COUNT(*) FROM course_memberships cm WHERE cm.course_id = c.id AND cm.status = 'active') AS popularity
      FROM courses c JOIN users u ON u.id = c.owner_user_id AND u.status = 'active'
      WHERE c.stage = 'school' ORDER BY popularity DESC, c.updated_at DESC LIMIT 500`).all()
  ]);

  const bySubject = new Map(SCHOOL_SUBJECTS.map(subject => [subject, new Map()]));
  for (const row of legacyResult.results || []) {
    for (const subject of SCHOOL_SUBJECTS) {
      if (!legacyMatchesSubject(row.name, subject)) continue;
      const bucket = bySubject.get(subject), previous = bucket.get(row.owner_user_id);
      const teacher = {
        id:row.owner_user_id, displayName:row.display_name, fameScore:Number(row.popularity || 0),
        selectionCount:0, institution:row.institution || '', source:'legacy'
      };
      if (!previous || teacher.fameScore > previous.fameScore) bucket.set(teacher.id, teacher);
    }
  }
  for (const row of formalResult.results || []) {
    const subject = String(row.subject || '');
    if (!bySubject.has(subject)) continue;
    let chapters = [];
    try {
      const profile = JSON.parse(row.content_json || '{"subjects":[]}');
      const item = Array.isArray(profile?.subjects) ? profile.subjects.find(entry => entry?.id === subject) : null;
      chapters = Array.isArray(item?.chapters) ? item.chapters : [];
    } catch {}
    const teacher = {
      id:row.teacher_user_id, displayName:row.display_name, imageUrl:row.image_url || '', chapters,
      fameScore:Number(row.fame_score || 0), selectionCount:Number(row.selection_count || 0), source:'directory'
    };
    const bucket = bySubject.get(subject), previous = bucket.get(teacher.id);
    bucket.set(teacher.id, previous ? {
      ...previous, ...teacher,
      fameScore:Math.max(previous.fameScore || 0, teacher.fameScore || 0),
      selectionCount:Math.max(previous.selectionCount || 0, teacher.selectionCount || 0),
      source:'directory'
    } : teacher);
  }
  return new Map([...bySubject].map(([subject,bucket]) => [subject,[...bucket.values()].sort((a,b) =>
    (b.fameScore - a.fameScore) || (b.selectionCount - a.selectionCount) || a.displayName.localeCompare(b.displayName)
  )]));
}

async function candidatesFor(db, identity, subject) {
  return (await candidateMap(db, identity)).get(subject) || [];
}
async function selectionMap(db, studentId) {
  const result = await db.prepare('SELECT subject, teacher_user_id FROM school_teacher_selections WHERE student_user_id = ?').bind(studentId).all();
  return new Map((result.results || []).map(row => [row.subject, row.teacher_user_id]));
}

export async function schoolTeacherCatalog(db, actor) {
  const identity = await ensureSchoolStudentIdentity(db, actor);
  const [selections, candidates] = await Promise.all([selectionMap(db, actor.id), candidateMap(db, identity)]);
  const subjects = SCHOOL_SUBJECTS.map(subject => ({
    subject, selectedTeacherId:selections.get(subject) || null, teachers:candidates.get(subject) || []
  }));
  return {
    mode:'school-teachers',
    identity,
    selectedCount:subjects.filter(item => item.selectedTeacherId).length,
    complete:subjects.every(item => item.selectedTeacherId),
    subjects
  };
}

export async function selectSchoolTeacher(db, actor, subject, teacherId) {
  if (!SUBJECT_SET.has(subject)) throw new HttpError(404, 'SCHOOL_SUBJECT_NOT_FOUND', 'School subject was not found.');
  if (!isUuid(teacherId)) throw new HttpError(400, 'INVALID_TEACHER', 'Teacher identifier is invalid.');
  const identity = await ensureSchoolStudentIdentity(db, actor);
  const teachers = await candidatesFor(db, identity, subject);
  if (!teachers.some(teacher => teacher.id === teacherId)) throw new HttpError(403, 'TEACHER_NOT_ELIGIBLE', 'This teacher is not available for your current school level, stage, and field.');
  const now = nowMs();
  await db.prepare(`INSERT INTO school_teacher_selections (student_user_id, subject, teacher_user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_user_id, subject) DO UPDATE SET teacher_user_id = excluded.teacher_user_id, updated_at = excluded.updated_at`)
    .bind(actor.id, subject, teacherId, now, now).run();
  return schoolTeacherCatalog(db, actor);
}
