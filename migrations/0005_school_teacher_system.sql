PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_academic_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  academic_level TEXT NOT NULL CHECK (academic_level IN ('primary_school','middle_school','preparatory_school')),
  academic_stage TEXT NOT NULL,
  academic_field TEXT,
  institution_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS school_teacher_assignments (
  id TEXT PRIMARY KEY,
  teacher_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('arabic','english','math','chemistry','physics','biology','islamic_book')),
  academic_level TEXT CHECK (academic_level IS NULL OR academic_level IN ('primary_school','middle_school','preparatory_school')),
  academic_stage TEXT,
  academic_field TEXT,
  fame_score INTEGER NOT NULL DEFAULT 0 CHECK (fame_score >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (teacher_user_id, subject, academic_level, academic_stage, academic_field)
);

CREATE TABLE IF NOT EXISTS school_teacher_selections (
  student_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('arabic','english','math','chemistry','physics','biology','islamic_book')),
  teacher_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (student_user_id, subject)
);

CREATE INDEX IF NOT EXISTS school_teacher_assignments_match_idx
  ON school_teacher_assignments(subject, academic_level, academic_stage, academic_field, status, fame_score DESC);
CREATE INDEX IF NOT EXISTS school_teacher_selections_teacher_idx
  ON school_teacher_selections(teacher_user_id, subject);

/* School students use teacher selection, never course enrollment. */
UPDATE course_memberships
SET status = 'removed', updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE role = 'student' AND status <> 'removed'
  AND EXISTS (
    SELECT 1 FROM account_profiles p
    WHERE p.user_id = course_memberships.user_id
      AND p.account_type = 'student'
      AND p.student_stage = 'school'
  );

/* Legacy school courses stay in the database as a migration source for teacher popularity, but are not active courses. */
UPDATE courses SET status = 'archived', updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE stage = 'school' AND status = 'active';

CREATE TRIGGER IF NOT EXISTS block_school_student_course_insert
BEFORE INSERT ON course_memberships
WHEN NEW.role = 'student' AND NEW.status <> 'removed'
  AND EXISTS (
    SELECT 1 FROM account_profiles p
    WHERE p.user_id = NEW.user_id
      AND p.account_type = 'student'
      AND p.student_stage = 'school'
  )
BEGIN
  SELECT RAISE(ABORT, 'SCHOOL_STUDENT_COURSES_DISABLED');
END;

CREATE TRIGGER IF NOT EXISTS block_school_student_course_update
BEFORE UPDATE OF role, status ON course_memberships
WHEN NEW.role = 'student' AND NEW.status <> 'removed'
  AND EXISTS (
    SELECT 1 FROM account_profiles p
    WHERE p.user_id = NEW.user_id
      AND p.account_type = 'student'
      AND p.student_stage = 'school'
  )
BEGIN
  SELECT RAISE(ABORT, 'SCHOOL_STUDENT_COURSES_DISABLED');
END;

CREATE TRIGGER IF NOT EXISTS block_new_school_courses
BEFORE INSERT ON courses
WHEN NEW.stage = 'school'
BEGIN
  SELECT RAISE(ABORT, 'SCHOOL_COURSES_REPLACED_BY_TEACHERS');
END;

CREATE TRIGGER IF NOT EXISTS block_course_stage_to_school
BEFORE UPDATE OF stage ON courses
WHEN NEW.stage = 'school'
BEGIN
  SELECT RAISE(ABORT, 'SCHOOL_COURSES_REPLACED_BY_TEACHERS');
END;

PRAGMA optimize;
