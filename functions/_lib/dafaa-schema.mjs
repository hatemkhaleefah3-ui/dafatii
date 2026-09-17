import { HttpError } from './http.mjs';

export const LEGACY_DAFAT_RECORD_KEY = 'dafatii:courses:v1';

const tableExists = async (db, name) => Boolean(await db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?").bind(name).first());
const tableColumns = async (db, table) => {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  return new Set((result.results || []).map(item => item.name));
};
const columnExists = async (db, table, column) => (await tableColumns(db, table)).has(column);
const foreignKeyTarget = async (db, table, column) => {
  if (!await tableExists(db, table)) return null;
  const result = await db.prepare(`PRAGMA foreign_key_list(${table})`).all();
  return (result.results || []).find(item => item.from === column)?.table || null;
};
const exec = (db, sql) => db.exec(sql);

const DAFAA_COLUMNS = [
  'id','enrollment_code','name','description','institution','stage','owner_user_id','status',
  'pricing','price_minor','currency','visibility','join_policy','access_code_hash','created_at','updated_at'
];

async function mergeLegacyDafat(db) {
  if (!await tableExists(db, 'courses') || !await tableExists(db, 'dafat')) return;
  const columns = await tableColumns(db, 'courses');
  if (!DAFAA_COLUMNS.every(column => columns.has(column))) return;
  await db.prepare(`INSERT OR IGNORE INTO dafat
    (id,enrollment_code,name,description,institution,stage,owner_user_id,status,pricing,price_minor,currency,visibility,join_policy,access_code_hash,created_at,updated_at)
    SELECT c.id,c.enrollment_code,c.name,c.description,c.institution,c.stage,c.owner_user_id,c.status,c.pricing,c.price_minor,c.currency,c.visibility,c.join_policy,c.access_code_hash,c.created_at,c.updated_at
    FROM courses c WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = c.owner_user_id)`).run();
}

async function repairMembershipForeignKey(db) {
  if (await foreignKeyTarget(db, 'dafaa_memberships', 'dafaa_id') === 'dafat') return;
  const required = ['dafaa_id','user_id','role','status','can_add_content','can_edit_content','can_remove_content','can_manage_students','can_review_applications','can_manage_representers','can_manage_settings','invited_by','application_note','joined_at','created_at','updated_at'];
  const columns = await tableColumns(db, 'dafaa_memberships');
  if (!required.every(column => columns.has(column))) throw new HttpError(503, 'DAFAA_MEMBERSHIP_SCHEMA_INCOMPATIBLE', 'The Dafaa membership database schema needs repair.');
  await exec(db, `
    DROP TRIGGER IF EXISTS block_school_student_dafaa_insert;
    DROP TRIGGER IF EXISTS block_school_student_dafaa_update;
    DROP INDEX IF EXISTS dafaa_memberships_user_idx;
    DROP INDEX IF EXISTS dafaa_memberships_dafaa_idx;
    DROP TABLE IF EXISTS dafaa_memberships_repaired;
    CREATE TABLE dafaa_memberships_repaired (
      dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE,
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
      PRIMARY KEY (dafaa_id, user_id)
    );
    INSERT OR IGNORE INTO dafaa_memberships_repaired
      (dafaa_id,user_id,role,status,can_add_content,can_edit_content,can_remove_content,can_manage_students,can_review_applications,can_manage_representers,can_manage_settings,invited_by,application_note,joined_at,created_at,updated_at)
    SELECT m.dafaa_id,m.user_id,m.role,m.status,m.can_add_content,m.can_edit_content,m.can_remove_content,m.can_manage_students,m.can_review_applications,m.can_manage_representers,m.can_manage_settings,
      CASE WHEN m.invited_by IS NULL OR EXISTS (SELECT 1 FROM users iu WHERE iu.id = m.invited_by) THEN m.invited_by ELSE NULL END,
      m.application_note,m.joined_at,m.created_at,m.updated_at
    FROM dafaa_memberships m
    WHERE EXISTS (SELECT 1 FROM dafat d WHERE d.id = m.dafaa_id)
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);
    DROP TABLE dafaa_memberships;
    ALTER TABLE dafaa_memberships_repaired RENAME TO dafaa_memberships;
  `);
}

async function repairContentRecordsForeignKey(db) {
  if (await foreignKeyTarget(db, 'dafaa_content_records', 'dafaa_id') === 'dafat') return;
  const required = ['dafaa_id','record_key','format','value_json','deleted','revision','last_mutation_id','updated_by','created_at','updated_at'];
  const columns = await tableColumns(db, 'dafaa_content_records');
  if (!required.every(column => columns.has(column))) throw new HttpError(503, 'DAFAA_CONTENT_SCHEMA_INCOMPATIBLE', 'The Dafaa content database schema needs repair.');
  await exec(db, `
    DROP INDEX IF EXISTS dafaa_content_updated_idx;
    DROP TABLE IF EXISTS dafaa_content_records_repaired;
    CREATE TABLE dafaa_content_records_repaired (
      dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE,
      record_key TEXT NOT NULL,
      format TEXT NOT NULL CHECK (format IN ('json', 'string')),
      value_json TEXT,
      deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
      revision INTEGER NOT NULL CHECK (revision > 0),
      last_mutation_id TEXT,
      updated_by TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (dafaa_id, record_key),
      CHECK ((deleted = 1 AND value_json IS NULL) OR (deleted = 0 AND value_json IS NOT NULL))
    );
    INSERT OR IGNORE INTO dafaa_content_records_repaired
      (dafaa_id,record_key,format,value_json,deleted,revision,last_mutation_id,updated_by,created_at,updated_at)
    SELECT r.dafaa_id,r.record_key,r.format,r.value_json,r.deleted,r.revision,r.last_mutation_id,r.updated_by,r.created_at,r.updated_at
    FROM dafaa_content_records r
    WHERE EXISTS (SELECT 1 FROM dafat d WHERE d.id = r.dafaa_id)
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = r.updated_by);
    DROP TABLE dafaa_content_records;
    ALTER TABLE dafaa_content_records_repaired RENAME TO dafaa_content_records;
  `);
}

async function repairContentMutationsForeignKey(db) {
  if (await foreignKeyTarget(db, 'dafaa_content_mutations', 'dafaa_id') === 'dafat') return;
  const required = ['dafaa_id','user_id','mutation_id','record_key','response_json','created_at'];
  const columns = await tableColumns(db, 'dafaa_content_mutations');
  if (!required.every(column => columns.has(column))) throw new HttpError(503, 'DAFAA_MUTATION_SCHEMA_INCOMPATIBLE', 'The Dafaa mutation database schema needs repair.');
  await exec(db, `
    DROP INDEX IF EXISTS dafaa_content_mutations_created_idx;
    DROP TABLE IF EXISTS dafaa_content_mutations_repaired;
    CREATE TABLE dafaa_content_mutations_repaired (
      dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mutation_id TEXT NOT NULL,
      record_key TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (dafaa_id, user_id, mutation_id)
    );
    INSERT OR IGNORE INTO dafaa_content_mutations_repaired
      (dafaa_id,user_id,mutation_id,record_key,response_json,created_at)
    SELECT m.dafaa_id,m.user_id,m.mutation_id,m.record_key,m.response_json,m.created_at
    FROM dafaa_content_mutations m
    WHERE EXISTS (SELECT 1 FROM dafat d WHERE d.id = m.dafaa_id)
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);
    DROP TABLE dafaa_content_mutations;
    ALTER TABLE dafaa_content_mutations_repaired RENAME TO dafaa_content_mutations;
  `);
}

async function repairAuditForeignKey(db) {
  if (await foreignKeyTarget(db, 'dafaa_audit_log', 'dafaa_id') === 'dafat') return;
  const required = ['id','dafaa_id','actor_user_id','action','target_user_id','metadata_json','created_at'];
  const columns = await tableColumns(db, 'dafaa_audit_log');
  if (!required.every(column => columns.has(column))) throw new HttpError(503, 'DAFAA_AUDIT_SCHEMA_INCOMPATIBLE', 'The Dafaa audit database schema needs repair.');
  await exec(db, `
    DROP INDEX IF EXISTS dafaa_audit_dafaa_idx;
    DROP INDEX IF EXISTS dafaa_audit_actor_idx;
    DROP TABLE IF EXISTS dafaa_audit_log_repaired;
    CREATE TABLE dafaa_audit_log_repaired (
      id TEXT PRIMARY KEY,
      dafaa_id TEXT REFERENCES dafat(id) ON DELETE CASCADE,
      actor_user_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      target_user_id TEXT REFERENCES users(id),
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO dafaa_audit_log_repaired
      (id,dafaa_id,actor_user_id,action,target_user_id,metadata_json,created_at)
    SELECT a.id,a.dafaa_id,a.actor_user_id,a.action,
      CASE WHEN a.target_user_id IS NULL OR EXISTS (SELECT 1 FROM users tu WHERE tu.id = a.target_user_id) THEN a.target_user_id ELSE NULL END,
      a.metadata_json,a.created_at
    FROM dafaa_audit_log a
    WHERE (a.dafaa_id IS NULL OR EXISTS (SELECT 1 FROM dafat d WHERE d.id = a.dafaa_id))
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = a.actor_user_id);
    DROP TABLE dafaa_audit_log;
    ALTER TABLE dafaa_audit_log_repaired RENAME TO dafaa_audit_log;
  `);
}

async function repairFilesForeignKey(db) {
  if (!await tableExists(db, 'files') || !await columnExists(db, 'files', 'dafaa_id')) return;
  if (await foreignKeyTarget(db, 'files', 'dafaa_id') === 'dafat') return;
  const required = ['id','user_id','dafaa_id','object_key','original_filename','content_type','expected_size','actual_size','status','upload_expires_at','gcs_generation','etag','scan_status','last_error','created_at','updated_at','available_at','deleted_at'];
  const columns = await tableColumns(db, 'files');
  if (!required.every(column => columns.has(column))) throw new HttpError(503, 'DAFAA_FILE_SCHEMA_INCOMPATIBLE', 'The Dafaa file database schema needs repair.');
  await exec(db, `
    DROP INDEX IF EXISTS files_owner_status_idx;
    DROP INDEX IF EXISTS files_abandoned_idx;
    DROP INDEX IF EXISTS files_dafaa_status_idx;
    DROP TABLE IF EXISTS files_dafaa_repaired;
    CREATE TABLE files_dafaa_repaired (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      dafaa_id TEXT REFERENCES dafat(id) DEFAULT NULL,
      object_key TEXT NOT NULL UNIQUE,
      original_filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      expected_size INTEGER NOT NULL CHECK (expected_size > 0),
      actual_size INTEGER,
      status TEXT NOT NULL CHECK (status IN ('pending', 'available', 'upload_failed', 'quarantined', 'deleting', 'delete_failed', 'deleted')),
      upload_expires_at INTEGER NOT NULL,
      gcs_generation TEXT,
      etag TEXT,
      scan_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (scan_status IN ('not_configured', 'pending', 'clean', 'rejected')),
      last_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      available_at INTEGER,
      deleted_at INTEGER
    );
    INSERT OR IGNORE INTO files_dafaa_repaired
      (id,user_id,dafaa_id,object_key,original_filename,content_type,expected_size,actual_size,status,upload_expires_at,gcs_generation,etag,scan_status,last_error,created_at,updated_at,available_at,deleted_at)
    SELECT f.id,f.user_id,
      CASE WHEN f.dafaa_id IS NULL OR EXISTS (SELECT 1 FROM dafat d WHERE d.id = f.dafaa_id) THEN f.dafaa_id ELSE NULL END,
      f.object_key,f.original_filename,f.content_type,f.expected_size,f.actual_size,f.status,f.upload_expires_at,f.gcs_generation,f.etag,f.scan_status,f.last_error,f.created_at,f.updated_at,f.available_at,f.deleted_at
    FROM files f WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = f.user_id);
    DROP TABLE files;
    ALTER TABLE files_dafaa_repaired RENAME TO files;
  `);
}

async function repairDafaaForeignKeys(db) {
  await repairMembershipForeignKey(db);
  await repairContentRecordsForeignKey(db);
  await repairContentMutationsForeignKey(db);
  await repairAuditForeignKey(db);
  await repairFilesForeignKey(db);
}

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

  // Production may have auth tables without the historical Course RBAC migration.
  // Bootstrap the canonical schema rather than taking authentication down.
  await exec(db, "CREATE TABLE IF NOT EXISTS account_profiles (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, account_type TEXT NOT NULL DEFAULT 'student' CHECK (account_type IN ('student', 'representer')), student_stage TEXT NOT NULL DEFAULT 'university' CHECK (student_stage IN ('school', 'university', 'independent')), platform_role TEXT NOT NULL DEFAULT 'student' CHECK (platform_role IN ('student', 'admin')), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);");
  await exec(db, "CREATE INDEX IF NOT EXISTS account_profiles_type_idx ON account_profiles(account_type, platform_role);");
  await exec(db, "CREATE TABLE IF NOT EXISTS dafat (id TEXT PRIMARY KEY, enrollment_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', institution TEXT NOT NULL DEFAULT '', stage TEXT NOT NULL DEFAULT 'university' CHECK (stage IN ('school', 'university', 'independent')), owner_user_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')), pricing TEXT NOT NULL DEFAULT 'free' CHECK (pricing IN ('free', 'paid')), price_minor INTEGER NOT NULL DEFAULT 0 CHECK (price_minor >= 0), currency TEXT NOT NULL DEFAULT 'USD', visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')), join_policy TEXT NOT NULL DEFAULT 'approval' CHECK (join_policy IN ('direct', 'approval')), access_code_hash TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, CHECK ((pricing = 'free' AND price_minor = 0) OR (pricing = 'paid' AND price_minor > 0)), CHECK ((visibility = 'public' AND access_code_hash IS NULL) OR (visibility = 'private' AND access_code_hash IS NOT NULL)));");
  await exec(db, "CREATE TABLE IF NOT EXISTS dafaa_memberships (dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('owner', 'representer', 'student')), status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_pending', 'active', 'rejected', 'removed')), can_add_content INTEGER NOT NULL DEFAULT 0 CHECK (can_add_content IN (0, 1)), can_edit_content INTEGER NOT NULL DEFAULT 0 CHECK (can_edit_content IN (0, 1)), can_remove_content INTEGER NOT NULL DEFAULT 0 CHECK (can_remove_content IN (0, 1)), can_manage_students INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_students IN (0, 1)), can_review_applications INTEGER NOT NULL DEFAULT 0 CHECK (can_review_applications IN (0, 1)), can_manage_representers INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_representers IN (0, 1)), can_manage_settings INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_settings IN (0, 1)), invited_by TEXT REFERENCES users(id), application_note TEXT NOT NULL DEFAULT '', joined_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (dafaa_id, user_id));");
  await exec(db, "CREATE TABLE IF NOT EXISTS dafaa_content_records (dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE, record_key TEXT NOT NULL, format TEXT NOT NULL CHECK (format IN ('json', 'string')), value_json TEXT, deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)), revision INTEGER NOT NULL CHECK (revision > 0), last_mutation_id TEXT, updated_by TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (dafaa_id, record_key), CHECK ((deleted = 1 AND value_json IS NULL) OR (deleted = 0 AND value_json IS NOT NULL)));");
  await exec(db, "CREATE TABLE IF NOT EXISTS dafaa_content_mutations (dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, mutation_id TEXT NOT NULL, record_key TEXT NOT NULL, response_json TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (dafaa_id, user_id, mutation_id));");
  await exec(db, "CREATE TABLE IF NOT EXISTS dafaa_audit_log (id TEXT PRIMARY KEY, dafaa_id TEXT REFERENCES dafat(id) ON DELETE CASCADE, actor_user_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, target_user_id TEXT REFERENCES users(id), metadata_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL);");
  if (await tableExists(db, 'files') && !await columnExists(db, 'files', 'dafaa_id')) {
    try { await exec(db, 'ALTER TABLE files ADD COLUMN dafaa_id TEXT REFERENCES dafat(id) DEFAULT NULL;'); }
    catch (error) { if (!await columnExists(db, 'files', 'dafaa_id')) throw error; }
  }

  // Mixed deployments can contain both legacy and canonical parent tables. In
  // that state renamed child tables can still reference legacy courses, which
  // makes a new Dafaa row fail when its owner membership is inserted. Merge any
  // surviving legacy rows first, then rebuild every Dafaa child FK canonically.
  await mergeLegacyDafat(db);
  await repairDafaaForeignKeys(db);

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
    CREATE INDEX IF NOT EXISTS files_owner_status_idx ON files(user_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS files_abandoned_idx ON files(status, upload_expires_at);
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

  // A user can legitimately have both the old and new catalog records after a
  // mixed-version deployment. Updating the legacy key directly would violate
  // records(user_id, record_key)'s primary key and make every Dafaa request fail.
  // Prefer the already-canonical record, remove only the duplicate legacy row,
  // then rename any remaining legacy rows. This sequence is idempotent.
  await db.prepare(`DELETE FROM records AS legacy
    WHERE legacy.record_key = 'dafatii:courses:v1'
      AND EXISTS (SELECT 1 FROM records AS canonical
        WHERE canonical.user_id = legacy.user_id
          AND canonical.record_key = 'dafatii:dafat:v1')`).run();
  await db.prepare("UPDATE records SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();
  await db.prepare("UPDATE record_mutations SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();
  if (await tableExists(db, 'dafaa_audit_log')) {
    await db.prepare("UPDATE dafaa_audit_log SET action = REPLACE(action, 'course.', 'dafaa.') WHERE action LIKE 'course.%'").run();
    await db.prepare("UPDATE dafaa_audit_log SET metadata_json = REPLACE(metadata_json, '\"courseId\"', '\"dafaaId\"') WHERE metadata_json LIKE '%courseId%'").run();
  }
}
