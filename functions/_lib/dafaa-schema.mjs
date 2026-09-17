import { HttpError } from './http.mjs';

const tableExists = async (db, name) => Boolean(await db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?").bind(name).first());
const columnExists = async (db, table, column) => {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  return result.results.some(item => item.name === column);
};
const exec = (db, sql) => db.exec(sql);

export async function ensureDafaaSchema(db) {
  if (!db) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');

  // Rename the legacy production schema in-place. Each step is independently
  // guarded so concurrent first requests can safely converge on the new model.
  if (await tableExists(db, 'courses') && !await tableExists(db, 'dafat')) {
    try { await exec(db, 'ALTER TABLE courses RENAME TO dafat;'); }
    catch (error) { if (!await tableExists(db, 'dafat')) throw error; }
  }
  if (await tableExists(db, 'course_memberships') && !await tableExists(db, 'dafaa_memberships')) {
    try { await exec(db, 'ALTER TABLE course_memberships RENAME TO dafaa_memberships;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_memberships')) throw error; }
  }
  if (await tableExists(db, 'course_content_records') && !await tableExists(db, 'dafaa_content_records')) {
    try { await exec(db, 'ALTER TABLE course_content_records RENAME TO dafaa_content_records;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_content_records')) throw error; }
  }
  if (await tableExists(db, 'course_content_mutations') && !await tableExists(db, 'dafaa_content_mutations')) {
    try { await exec(db, 'ALTER TABLE course_content_mutations RENAME TO dafaa_content_mutations;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_content_mutations')) throw error; }
  }
  if (await tableExists(db, 'course_audit_log') && !await tableExists(db, 'dafaa_audit_log')) {
    try { await exec(db, 'ALTER TABLE course_audit_log RENAME TO dafaa_audit_log;'); }
    catch (error) { if (!await tableExists(db, 'dafaa_audit_log')) throw error; }
  }

  for (const table of ['dafaa_memberships','dafaa_content_records','dafaa_content_mutations','dafaa_audit_log']) {
    if (await tableExists(db, table) && await columnExists(db, table, 'course_id') && !await columnExists(db, table, 'dafaa_id')) {
      try { await exec(db, `ALTER TABLE ${table} RENAME COLUMN course_id TO dafaa_id;`); }
      catch (error) { if (!await columnExists(db, table, 'dafaa_id')) throw error; }
    }
  }
  if (await tableExists(db, 'files') && await columnExists(db, 'files', 'course_id') && !await columnExists(db, 'files', 'dafaa_id')) {
    try { await exec(db, 'ALTER TABLE files RENAME COLUMN course_id TO dafaa_id;'); }
    catch (error) { if (!await columnExists(db, 'files', 'dafaa_id')) throw error; }
  }

  await exec(db, `
    DROP TRIGGER IF EXISTS block_school_student_course_insert;
    DROP TRIGGER IF EXISTS block_school_student_course_update;
    DROP TRIGGER IF EXISTS block_new_school_courses;
    DROP TRIGGER IF EXISTS block_course_stage_to_school;
    DROP INDEX IF EXISTS courses_owner_status_idx;
    DROP INDEX IF EXISTS courses_discovery_idx;
    DROP INDEX IF EXISTS course_memberships_user_idx;
    DROP INDEX IF EXISTS course_memberships_course_idx;
    DROP INDEX IF EXISTS course_content_updated_idx;
    DROP INDEX IF EXISTS course_content_mutations_created_idx;
    DROP INDEX IF EXISTS course_audit_course_idx;
    DROP INDEX IF EXISTS course_audit_actor_idx;
    DROP INDEX IF EXISTS files_course_status_idx;
    CREATE INDEX IF NOT EXISTS dafat_owner_status_idx ON dafat(owner_user_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafat_discovery_idx ON dafat(status, visibility, stage, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_memberships_user_idx ON dafaa_memberships(user_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_memberships_dafaa_idx ON dafaa_memberships(dafaa_id, status, role, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_content_updated_idx ON dafaa_content_records(dafaa_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_content_mutations_created_idx ON dafaa_content_mutations(created_at);
    CREATE INDEX IF NOT EXISTS dafaa_audit_dafaa_idx ON dafaa_audit_log(dafaa_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_audit_actor_idx ON dafaa_audit_log(actor_user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS files_dafaa_status_idx ON files(dafaa_id, status, created_at DESC);
    CREATE TRIGGER IF NOT EXISTS block_school_student_dafaa_insert
    BEFORE INSERT ON dafaa_memberships
    WHEN NEW.role = 'student' AND NEW.status <> 'removed'
      AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
    CREATE TRIGGER IF NOT EXISTS block_school_student_dafaa_update
    BEFORE UPDATE OF role, status ON dafaa_memberships
    WHEN NEW.role = 'student' AND NEW.status <> 'removed'
      AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
    CREATE TRIGGER IF NOT EXISTS block_new_school_dafat
    BEFORE INSERT ON dafat WHEN NEW.stage = 'school'
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;
    CREATE TRIGGER IF NOT EXISTS block_dafaa_stage_to_school
    BEFORE UPDATE OF stage ON dafat WHEN NEW.stage = 'school'
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_DAFAT_REPLACED_BY_TEACHERS'); END;
  `);

  await db.prepare("UPDATE records SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();
  await db.prepare("UPDATE record_mutations SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();
  if (await tableExists(db, 'dafaa_audit_log')) {
    await db.prepare("UPDATE dafaa_audit_log SET action = REPLACE(action, 'course.', 'dafaa.') WHERE action LIKE 'course.%'").run();
    await db.prepare("UPDATE dafaa_audit_log SET metadata_json = REPLACE(metadata_json, '\"courseId\"', '\"dafaaId\"') WHERE metadata_json LIKE '%courseId%'").run();
  }
}
