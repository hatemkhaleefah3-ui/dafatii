PRAGMA foreign_keys = ON;

DROP TRIGGER IF EXISTS block_school_student_course_insert;
DROP TRIGGER IF EXISTS block_school_student_course_update;
DROP TRIGGER IF EXISTS block_new_school_courses;
DROP TRIGGER IF EXISTS block_course_stage_to_school;

ALTER TABLE courses RENAME TO dafat;
ALTER TABLE course_memberships RENAME TO dafaa_memberships;
ALTER TABLE course_content_records RENAME TO dafaa_content_records;
ALTER TABLE course_content_mutations RENAME TO dafaa_content_mutations;
ALTER TABLE course_audit_log RENAME TO dafaa_audit_log;
ALTER TABLE dafaa_memberships RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE dafaa_content_records RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE dafaa_content_mutations RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE dafaa_audit_log RENAME COLUMN course_id TO dafaa_id;
ALTER TABLE files RENAME COLUMN course_id TO dafaa_id;

DROP INDEX IF EXISTS courses_owner_status_idx;
DROP INDEX IF EXISTS courses_discovery_idx;
DROP INDEX IF EXISTS course_memberships_user_idx;
DROP INDEX IF EXISTS course_memberships_course_idx;
DROP INDEX IF EXISTS course_content_updated_idx;
DROP INDEX IF EXISTS course_content_mutations_created_idx;
DROP INDEX IF EXISTS course_audit_course_idx;
DROP INDEX IF EXISTS course_audit_actor_idx;
DROP INDEX IF EXISTS files_course_status_idx;
CREATE INDEX dafat_owner_status_idx ON dafat(owner_user_id, status, updated_at DESC);
CREATE INDEX dafat_discovery_idx ON dafat(status, visibility, stage, updated_at DESC);
CREATE INDEX dafaa_memberships_user_idx ON dafaa_memberships(user_id, status, updated_at DESC);
CREATE INDEX dafaa_memberships_dafaa_idx ON dafaa_memberships(dafaa_id, status, role, updated_at DESC);
CREATE INDEX dafaa_content_updated_idx ON dafaa_content_records(dafaa_id, updated_at DESC);
CREATE INDEX dafaa_content_mutations_created_idx ON dafaa_content_mutations(created_at);
CREATE INDEX dafaa_audit_dafaa_idx ON dafaa_audit_log(dafaa_id, created_at DESC);
CREATE INDEX dafaa_audit_actor_idx ON dafaa_audit_log(actor_user_id, created_at DESC);
CREATE INDEX files_dafaa_status_idx ON files(dafaa_id, status, created_at DESC);

UPDATE records SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1';
UPDATE record_mutations SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1';
UPDATE dafaa_audit_log SET action = REPLACE(action, 'course.', 'dafaa.') WHERE action LIKE 'course.%';
UPDATE dafaa_audit_log SET metadata_json = REPLACE(metadata_json, '"courseId"', '"dafaaId"') WHERE metadata_json LIKE '%courseId%';

CREATE TRIGGER block_school_student_dafaa_insert
BEFORE INSERT ON dafaa_memberships
WHEN NEW.role = 'student' AND NEW.status <> 'removed'
  AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
CREATE TRIGGER block_school_student_dafaa_update
BEFORE UPDATE OF role, status ON dafaa_memberships
WHEN NEW.role = 'student' AND NEW.status <> 'removed'
  AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
CREATE TRIGGER block_new_school_dafat
BEFORE INSERT ON dafat WHEN NEW.stage = 'school'
BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;
CREATE TRIGGER block_dafaa_stage_to_school
BEFORE UPDATE OF stage ON dafat WHEN NEW.stage = 'school'
BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;

PRAGMA optimize;
