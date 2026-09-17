import { requireUser } from './auth.mjs';
import { accessCodeHash, actorFor, enrollmentCode, fullPermissions, PERMISSIONS, validateDafaaInput } from './dafat.mjs';
import { HttpError, ok, readJson } from './http.mjs';

const REQUIRED_DAFAA_COLUMNS = [
  'id','enrollment_code','name','description','institution','stage','owner_user_id','status',
  'pricing','price_minor','currency','visibility','join_policy','access_code_hash','created_at','updated_at'
];
const REQUIRED_MEMBER_COLUMNS = [
  'dafaa_id','user_id','role','status','can_add_content','can_edit_content','can_remove_content',
  'can_manage_students','can_review_applications','can_manage_representers','can_manage_settings',
  'invited_by','application_note','joined_at','created_at','updated_at'
];

async function columns(db, table) {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  return new Set((result.results || []).map(row => row.name));
}

async function foreignKeyTarget(db, table, column) {
  const result = await db.prepare(`PRAGMA foreign_key_list(${table})`).all();
  return (result.results || []).find(row => row.from === column)?.table || null;
}

async function rebuildMembershipTable(db) {
  const existing = await columns(db, 'dafaa_memberships');
  if (!REQUIRED_MEMBER_COLUMNS.every(column => existing.has(column))) {
    throw new HttpError(503, 'DAFAA_CREATE_SCHEMA_INCOMPATIBLE', 'The Dafaa membership store needs administrator repair before a Dafaa can be created.');
  }

  await db.exec(`
    DROP TRIGGER IF EXISTS block_school_student_dafaa_insert;
    DROP TRIGGER IF EXISTS block_school_student_dafaa_update;
    DROP INDEX IF EXISTS dafaa_memberships_user_idx;
    DROP INDEX IF EXISTS dafaa_memberships_dafaa_idx;
    DROP TABLE IF EXISTS dafaa_memberships_v2_rebuild;
    CREATE TABLE dafaa_memberships_v2_rebuild (
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
    INSERT OR IGNORE INTO dafaa_memberships_v2_rebuild
      (dafaa_id,user_id,role,status,can_add_content,can_edit_content,can_remove_content,can_manage_students,can_review_applications,can_manage_representers,can_manage_settings,invited_by,application_note,joined_at,created_at,updated_at)
    SELECT m.dafaa_id,m.user_id,m.role,m.status,m.can_add_content,m.can_edit_content,m.can_remove_content,m.can_manage_students,m.can_review_applications,m.can_manage_representers,m.can_manage_settings,
      CASE WHEN m.invited_by IS NULL OR EXISTS (SELECT 1 FROM users iu WHERE iu.id = m.invited_by) THEN m.invited_by ELSE NULL END,
      m.application_note,m.joined_at,m.created_at,m.updated_at
    FROM dafaa_memberships m
    WHERE EXISTS (SELECT 1 FROM dafat d WHERE d.id = m.dafaa_id)
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);
    DROP TABLE dafaa_memberships;
    ALTER TABLE dafaa_memberships_v2_rebuild RENAME TO dafaa_memberships;
  `);
}

export async function ensureDafaaCreateV2Schema(db) {
  if (!db) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS dafat (
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
    );
    CREATE TABLE IF NOT EXISTS dafaa_memberships (
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
  `);

  const dafaaColumns = await columns(db, 'dafat');
  if (!REQUIRED_DAFAA_COLUMNS.every(column => dafaaColumns.has(column))) {
    throw new HttpError(503, 'DAFAA_CREATE_SCHEMA_INCOMPATIBLE', 'The Dafaa store needs administrator repair before a Dafaa can be created.');
  }

  const memberColumns = await columns(db, 'dafaa_memberships');
  if (!REQUIRED_MEMBER_COLUMNS.every(column => memberColumns.has(column))) {
    throw new HttpError(503, 'DAFAA_CREATE_SCHEMA_INCOMPATIBLE', 'The Dafaa membership store needs administrator repair before a Dafaa can be created.');
  }

  if (await foreignKeyTarget(db, 'dafaa_memberships', 'dafaa_id') !== 'dafat') {
    await rebuildMembershipTable(db);
  }

  await db.exec(`
    CREATE INDEX IF NOT EXISTS dafat_owner_status_idx ON dafat(owner_user_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafat_discovery_idx ON dafat(status, visibility, stage, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_memberships_user_idx ON dafaa_memberships(user_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS dafaa_memberships_dafaa_idx ON dafaa_memberships(dafaa_id, status, role, updated_at DESC);
    CREATE TRIGGER IF NOT EXISTS block_school_student_dafaa_insert
    BEFORE INSERT ON dafaa_memberships
    WHEN NEW.role = 'student' AND NEW.status <> 'removed'
      AND EXISTS (SELECT 1 FROM account_profiles p WHERE p.user_id = NEW.user_id AND p.account_type = 'student' AND p.student_stage = 'school')
    BEGIN SELECT RAISE(ABORT, 'SCHOOL_STUDENT_DAFAT_DISABLED'); END;
  `);
}

async function uniqueEnrollmentCode(db) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = enrollmentCode(7);
    const used = await db.prepare('SELECT 1 AS present FROM dafat WHERE enrollment_code = ?').bind(code).first();
    if (!used) return code;
  }
  throw new HttpError(503, 'DAFAA_CODE_UNAVAILABLE', 'A Dafaa enrollment code could not be allocated.');
}

export async function createDafaaV2(context) {
  const db = context.env.DB;
  if (!db) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');

  const user = await requireUser(context);
  const currentActor = await actorFor(db, user, context.env);
  if (!currentActor.isAdmin && currentActor.studentStage !== 'university') {
    throw new HttpError(403, 'HIGHER_EDUCATION_REQUIRED', 'Only post-school students can create a Dafaa.');
  }

  await ensureDafaaCreateV2Schema(db);
  const input = await readJson(context.request, 65536);
  const value = validateDafaaInput({ ...input, stage: 'university' });
  if (value.pricing === 'free') value.priceMinor = 0;
  if (value.pricing === 'paid' && value.priceMinor < 1) {
    throw new HttpError(400, 'INVALID_PRICE', 'Paid Dafat require a positive price.');
  }

  const dafaaId = crypto.randomUUID();
  const code = await uniqueEnrollmentCode(db);
  let codeHash = null;
  if (value.visibility === 'private') codeHash = await accessCodeHash(dafaaId, value.accessCode, context.env);

  const now = Date.now();
  const permissions = fullPermissions();
  const insertDafaa = db.prepare(`INSERT INTO dafat
    (id,enrollment_code,name,description,institution,stage,owner_user_id,status,pricing,price_minor,currency,visibility,join_policy,access_code_hash,created_at,updated_at)
    VALUES (?,?,?,?,?,? ,?,'active',?,?,?,?,?,?,?,?)`)
    .bind(dafaaId, code, value.name, value.description, value.institution, 'university', currentActor.id, value.pricing, value.priceMinor, value.currency, value.visibility, value.joinPolicy, codeHash, now, now);
  const insertOwner = db.prepare(`INSERT INTO dafaa_memberships
    (dafaa_id,user_id,role,status,can_add_content,can_edit_content,can_remove_content,can_manage_students,can_review_applications,can_manage_representers,can_manage_settings,invited_by,application_note,joined_at,created_at,updated_at)
    VALUES (?,?,'owner','active',?,?,?,?,?,?,?,?,'',?,?,?)`)
    .bind(dafaaId, currentActor.id, ...PERMISSIONS.map(permission => permissions[permission]), currentActor.id, now, now, now);

  await db.batch([insertDafaa, insertOwner]);

  return ok({
    dafaa: {
      id: dafaaId,
      enrollmentCode: code,
      name: value.name,
      description: value.description,
      institution: value.institution,
      stage: 'university',
      status: 'active',
      pricing: value.pricing,
      priceMinor: value.priceMinor,
      currency: value.currency,
      visibility: value.visibility,
      joinPolicy: value.joinPolicy,
      hasAccessCode: Boolean(codeHash),
      ownerUserId: currentActor.id,
      memberCount: 1,
      applicationCount: 0,
      membership: {
        userId: currentActor.id,
        role: 'owner',
        status: 'active',
        permissions: Object.fromEntries(PERMISSIONS.map(permission => [permission.replace(/^can_/, ''), true])),
        applicationNote: '',
        joinedAt: now,
        updatedAt: now
      },
      createdAt: now,
      updatedAt: now
    },
    apiVersion: 2
  }, 201);
}
