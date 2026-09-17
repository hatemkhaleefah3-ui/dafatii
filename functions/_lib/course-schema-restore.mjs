const MARKER = 'restore_pre_dafaa_course_schema_20260917';

const tableExists = async (db, name) => Boolean(await db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?").bind(name).first());
const columnExists = async (db, table, column) => {
  if (!await tableExists(db, table)) return false;
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  return (result.results || []).some(item => item.name === column);
};
const run = (db, sql) => db.prepare(sql).run();

async function ensureLegacyTables(db) {
  await run(db, `CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    enrollment_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    institution TEXT NOT NULL DEFAULT '',
    stage TEXT NOT NULL DEFAULT 'university' CHECK (stage IN ('school', 'university', 'independent')),
    owner_user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    pricing TEXT NOT NULL DEFAULT 'free' CHECK (pricing IN ('free', 'paid')),
    price_minor INTEGER NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    join_policy TEXT NOT NULL DEFAULT 'approval' CHECK (join_policy IN ('direct', 'approval')),
    access_code_hash TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK ((pricing = 'free' AND price_minor = 0) OR (pricing = 'paid' AND price_minor > 0)),
    CHECK ((visibility = 'public' AND access_code_hash IS NULL) OR (visibility = 'private' AND access_code_hash IS NOT NULL))
  )`);
  await run(db, `CREATE TABLE IF NOT EXISTS course_memberships (
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('owner', 'representer', 'student')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_pending', 'active', 'rejected', 'removed')),
    can_add_content INTEGER NOT NULL DEFAULT 0 CHECK (can_add_content IN (0, 1)),
    can_edit_content INTEGER NOT NULL DEFAULT 0 CHECK (can_edit_content IN (0, 1)),
    can_remove_content INTEGER NOT NULL DEFAULT 0 CHECK (can_remove_content IN (0, 1)),
    can_manage_students INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_students IN (0, 1)),
    can_review_applications INTEGER NOT NULL DEFAULT 0 CHECK (can_review_applications IN (0, 1)),
    can_manage_representers INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_representers IN (0, 1)),
    can_manage_settings INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_settings IN (0, 1)),
    invited_by TEXT REFERENCES users(id),
    application_note TEXT NOT NULL DEFAULT '',
    joined_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (course_id, user_id)
  )`);
  await run(db, `CREATE TABLE IF NOT EXISTS course_content_records (
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    record_key TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('json', 'string')),
    value_json TEXT,
    deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
    revision INTEGER NOT NULL CHECK (revision > 0),
    last_mutation_id TEXT,
    updated_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (course_id, record_key),
    CHECK ((deleted = 1 AND value_json IS NULL) OR (deleted = 0 AND value_json IS NOT NULL))
  )`);
  await run(db, `CREATE TABLE IF NOT EXISTS course_content_mutations (
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mutation_id TEXT NOT NULL,
    record_key TEXT NOT NULL,
    response_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (course_id, user_id, mutation_id)
  )`);
  await run(db, `CREATE TABLE IF NOT EXISTS course_audit_log (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    actor_user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    target_user_id TEXT REFERENCES users(id),
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  )`);
}

async function mirrorDafaaRows(db) {
  if (!await tableExists(db, 'dafat')) return;

  await db.prepare(`INSERT OR IGNORE INTO courses
    (id,enrollment_code,name,description,institution,stage,owner_user_id,status,pricing,price_minor,currency,visibility,join_policy,access_code_hash,created_at,updated_at)
    SELECT id,enrollment_code,name,description,institution,stage,owner_user_id,status,pricing,price_minor,currency,visibility,join_policy,access_code_hash,created_at,updated_at FROM dafat`).run();
  await db.prepare(`UPDATE courses SET
    enrollment_code=(SELECT d.enrollment_code FROM dafat d WHERE d.id=courses.id),
    name=(SELECT d.name FROM dafat d WHERE d.id=courses.id),
    description=(SELECT d.description FROM dafat d WHERE d.id=courses.id),
    institution=(SELECT d.institution FROM dafat d WHERE d.id=courses.id),
    stage=(SELECT d.stage FROM dafat d WHERE d.id=courses.id),
    owner_user_id=(SELECT d.owner_user_id FROM dafat d WHERE d.id=courses.id),
    status=(SELECT d.status FROM dafat d WHERE d.id=courses.id),
    pricing=(SELECT d.pricing FROM dafat d WHERE d.id=courses.id),
    price_minor=(SELECT d.price_minor FROM dafat d WHERE d.id=courses.id),
    currency=(SELECT d.currency FROM dafat d WHERE d.id=courses.id),
    visibility=(SELECT d.visibility FROM dafat d WHERE d.id=courses.id),
    join_policy=(SELECT d.join_policy FROM dafat d WHERE d.id=courses.id),
    access_code_hash=(SELECT d.access_code_hash FROM dafat d WHERE d.id=courses.id),
    created_at=(SELECT d.created_at FROM dafat d WHERE d.id=courses.id),
    updated_at=(SELECT d.updated_at FROM dafat d WHERE d.id=courses.id)
    WHERE id IN (SELECT id FROM dafat)`).run();

  if (await tableExists(db, 'dafaa_memberships')) {
    await db.prepare(`INSERT OR REPLACE INTO course_memberships
      (course_id,user_id,role,status,can_add_content,can_edit_content,can_remove_content,can_manage_students,can_review_applications,can_manage_representers,can_manage_settings,invited_by,application_note,joined_at,created_at,updated_at)
      SELECT dafaa_id,user_id,role,status,can_add_content,can_edit_content,can_remove_content,can_manage_students,can_review_applications,can_manage_representers,can_manage_settings,invited_by,application_note,joined_at,created_at,updated_at
      FROM dafaa_memberships WHERE dafaa_id IN (SELECT id FROM courses)`).run();
  }
  if (await tableExists(db, 'dafaa_content_records')) {
    await db.prepare(`INSERT OR REPLACE INTO course_content_records
      (course_id,record_key,format,value_json,deleted,revision,last_mutation_id,updated_by,created_at,updated_at)
      SELECT dafaa_id,record_key,format,value_json,deleted,revision,last_mutation_id,updated_by,created_at,updated_at
      FROM dafaa_content_records WHERE dafaa_id IN (SELECT id FROM courses)`).run();
  }
  if (await tableExists(db, 'dafaa_content_mutations')) {
    await db.prepare(`INSERT OR REPLACE INTO course_content_mutations
      (course_id,user_id,mutation_id,record_key,response_json,created_at)
      SELECT dafaa_id,user_id,mutation_id,record_key,response_json,created_at
      FROM dafaa_content_mutations WHERE dafaa_id IN (SELECT id FROM courses)`).run();
  }
  if (await tableExists(db, 'dafaa_audit_log')) {
    await db.prepare(`INSERT OR REPLACE INTO course_audit_log
      (id,course_id,actor_user_id,action,target_user_id,metadata_json,created_at)
      SELECT id,dafaa_id,actor_user_id,REPLACE(action,'dafaa.','course.'),target_user_id,REPLACE(metadata_json,'"dafaaId"','"courseId"'),created_at
      FROM dafaa_audit_log WHERE dafaa_id IS NULL OR dafaa_id IN (SELECT id FROM courses)`).run();
  }
}

async function restoreFilesAndRecords(db) {
  if (await tableExists(db, 'files') && !await columnExists(db, 'files', 'course_id')) {
    await run(db, 'ALTER TABLE files ADD COLUMN course_id TEXT REFERENCES courses(id) DEFAULT NULL');
  }
  if (await tableExists(db, 'files') && await columnExists(db, 'files', 'dafaa_id') && await columnExists(db, 'files', 'course_id')) {
    await db.prepare('UPDATE files SET course_id = dafaa_id WHERE dafaa_id IS NOT NULL AND dafaa_id IN (SELECT id FROM courses)').run();
  }

  if (await tableExists(db, 'records')) {
    await db.prepare("DELETE FROM records WHERE record_key = 'dafatii:courses:v1' AND user_id IN (SELECT user_id FROM records WHERE record_key = 'dafatii:dafat:v1')").run();
    await db.prepare("UPDATE records SET record_key = 'dafatii:courses:v1' WHERE record_key = 'dafatii:dafat:v1'").run();
  }
  if (await tableExists(db, 'record_mutations')) {
    await db.prepare("UPDATE record_mutations SET record_key = 'dafatii:courses:v1' WHERE record_key = 'dafatii:dafat:v1'").run();
  }
}

async function restoreIndexesAndSchoolGuards(db) {
  await run(db, 'CREATE INDEX IF NOT EXISTS courses_owner_status_idx ON courses(owner_user_id, status, updated_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS courses_discovery_idx ON courses(status, visibility, stage, updated_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS course_memberships_user_idx ON course_memberships(user_id, status, updated_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS course_memberships_course_idx ON course_memberships(course_id, status, role, updated_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS course_content_updated_idx ON course_content_records(course_id, updated_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS course_content_mutations_created_idx ON course_content_mutations(created_at)');
  await run(db, 'CREATE INDEX IF NOT EXISTS course_audit_course_idx ON course_audit_log(course_id, created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS course_audit_actor_idx ON course_audit_log(actor_user_id, created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS files_course_status_idx ON files(course_id, status, created_at DESC)');
  await run(db, `CREATE TRIGGER IF NOT EXISTS block_school_student_course_insert
    BEFORE INSERT ON course_memberships
    WHEN NEW.role = 'student' AND NEW.status <> 'removed'
      AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_COURSES_DISABLED'); END`);
  await run(db, `CREATE TRIGGER IF NOT EXISTS block_school_student_course_update
    BEFORE UPDATE OF role, status ON course_memberships
    WHEN NEW.role = 'student' AND NEW.status <> 'removed'
      AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_COURSES_DISABLED'); END`);
  await run(db, `CREATE TRIGGER IF NOT EXISTS block_new_school_courses
    BEFORE INSERT ON courses WHEN NEW.stage = 'school'
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_COURSES_REPLACED_BY_TEACHERS'); END`);
  await run(db, `CREATE TRIGGER IF NOT EXISTS block_course_stage_to_school
    BEFORE UPDATE OF stage ON courses WHEN NEW.stage = 'school'
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_COURSES_REPLACED_BY_TEACHERS'); END`);
}

export async function ensurePreDafaaCourseSchema(db) {
  if (!db) return;
  await run(db, 'CREATE TABLE IF NOT EXISTS app_migration_markers (marker TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
  if (await db.prepare('SELECT 1 AS present FROM app_migration_markers WHERE marker = ?').bind(MARKER).first()) return;

  await ensureLegacyTables(db);
  await mirrorDafaaRows(db);
  await restoreFilesAndRecords(db);
  await restoreIndexesAndSchoolGuards(db);
  await db.prepare('INSERT OR IGNORE INTO app_migration_markers (marker, applied_at) VALUES (?, ?)').bind(MARKER, Date.now()).run();
}
