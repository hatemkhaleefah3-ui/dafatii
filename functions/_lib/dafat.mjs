import { LEGACY_DAFAT_RECORD_KEY } from './dafaa-schema.mjs';
import { sha256 } from './crypto.mjs';
import { HttpError } from './http.mjs';
import { validateRecord } from './policy.mjs';

export const DAFAA_CONTENT_KEYS = new Set([
  'dafatii:subjects','dafatii:lectures','dafatii:weeklySchedule','dafatii:scheduleNotes',
  'dafatii:examSchedule','dafatii:examNotes','dafatii:scheduleDays','dafatii:schedulePeriods',
  'dafatii:examDays','dafatii:examPeriods','dafatii:studentSuite:v1','dafatii:studyRoomState:v1',
  'dafatii:studyRoomWorkspace:v1','dafatii:chatState:v1','dafatii:chatProState:v1',
  'dafatii:materialFiles:v1'
]);

export const PERMISSIONS = [
  'can_add_content','can_edit_content','can_remove_content','can_manage_students',
  'can_review_applications','can_manage_representers','can_manage_settings'
];

const stages = new Set(['school','university','independent']);
const accountTypes = new Set(['student','representer']);
const dafaaRoles = new Set(['owner','representer','student']);
const memberStatuses = new Set(['pending','payment_pending','active','rejected','removed']);
const pricingModes = new Set(['free','paid']);
const visibilities = new Set(['public','private']);
const joinPolicies = new Set(['direct','approval']);

const text = (value, maximum, fallback = '') => String(value ?? fallback).trim().normalize('NFC').slice(0, maximum);
const enumValue = (value, allowed, fallback, code = 'INVALID_INPUT') => {
  const normalized = String(value ?? fallback);
  if (!allowed.has(normalized)) throw new HttpError(400, code, 'A supplied value is invalid.');
  return normalized;
};
const booleanInt = value => value ? 1 : 0;
const parseJson = value => { try { return JSON.parse(value); } catch { return null; } };

export function validateProfileInput(input = {}) {
  return {
    accountType: enumValue(input.accountType, accountTypes, 'student'),
    studentStage: enumValue(input.studentStage, stages, 'university')
  };
}

async function ensureAccountProfileSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS account_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL DEFAULT 'student' CHECK (account_type IN ('student', 'representer')),
    student_stage TEXT NOT NULL DEFAULT 'university' CHECK (student_stage IN ('school', 'university', 'independent')),
    platform_role TEXT NOT NULL DEFAULT 'student' CHECK (platform_role IN ('student', 'admin')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS account_profiles_type_idx ON account_profiles(account_type, platform_role)').run();
}

export async function ensureAccountProfile(db, user, requested = null, now = Date.now()) {
  await ensureAccountProfileSchema(db);
  let row = await db.prepare('SELECT account_type, student_stage, platform_role FROM account_profiles WHERE user_id = ?').bind(user.id).first();
  if (!row) {
    let profile = requested ? validateProfileInput(requested) : null;
    if (!profile) {
      const legacy = await db.prepare("SELECT 1 AS present FROM records WHERE user_id = ? AND record_key IN ('dafatii:dafat:v1', ?) AND deleted = 0 LIMIT 1").bind(user.id, LEGACY_DAFAT_RECORD_KEY).first();
      profile = { accountType: legacy ? 'representer' : 'student', studentStage: 'university' };
    }
    await db.prepare('INSERT OR IGNORE INTO account_profiles (user_id, account_type, student_stage, platform_role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(user.id, profile.accountType, profile.studentStage, 'student', now, now).run();
    row = await db.prepare('SELECT account_type, student_stage, platform_role FROM account_profiles WHERE user_id = ?').bind(user.id).first();
  }
  return { accountType: row.account_type, studentStage: row.student_stage, platformRole: row.platform_role };
}

export function isAdminEmail(email, env = {}) {
  const configured = String(env.ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  return configured.includes(String(email || '').trim().toLowerCase());
}

export async function actorFor(db, user, env = {}) {
  const profile = await ensureAccountProfile(db, user);
  return { ...user, ...profile, isAdmin: profile.platformRole === 'admin' || isAdminEmail(user.email, env) };
}

export function publicActor(actor) {
  return { id: actor.id, email: actor.email, displayName: actor.displayName, accountType: actor.accountType, studentStage: actor.studentStage, platformRole: actor.isAdmin ? 'admin' : actor.platformRole };
}

export function enrollmentCode(bytes = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = crypto.getRandomValues(new Uint8Array(bytes));
  return [...random].map(value => alphabet[value % alphabet.length]).join('');
}

export async function accessCodeHash(dafaaId, code, env) {
  const pepper = String(env.RATE_LIMIT_PEPPER || '');
  if (pepper.length < 32) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Dafaa access configuration is unavailable.');
  const normalized = String(code || '').trim();
  if (normalized.length < 6 || normalized.length > 64) throw new HttpError(400, 'INVALID_ACCESS_CODE', 'Private dafaa access codes must be 6–64 characters.');
  return sha256(`${pepper}\0${dafaaId}\0${normalized}`);
}

export function validateDafaaInput(input = {}, { partial = false } = {}) {
  const value = {};
  if (!partial || input.name !== undefined) {
    value.name = text(input.name, 120);
    if (value.name.length < 2) throw new HttpError(400, 'INVALID_DAFAA_NAME', 'Dafaa name must contain at least two characters.');
  }
  if (!partial || input.description !== undefined) value.description = text(input.description, 1000);
  if (!partial || input.institution !== undefined) value.institution = text(input.institution, 160);
  if (!partial || input.stage !== undefined) value.stage = enumValue(input.stage, stages, 'university');
  if (!partial || input.pricing !== undefined) value.pricing = enumValue(input.pricing, pricingModes, 'free');
  if (!partial || input.visibility !== undefined) value.visibility = enumValue(input.visibility, visibilities, 'public');
  if (!partial || input.joinPolicy !== undefined) value.joinPolicy = enumValue(input.joinPolicy, joinPolicies, 'approval');
  if (!partial || input.currency !== undefined) {
    value.currency = text(input.currency, 3, 'USD').toUpperCase();
    if (!/^[A-Z]{3}$/.test(value.currency)) throw new HttpError(400, 'INVALID_CURRENCY', 'Currency must be a three-letter code.');
  }
  if (!partial || input.priceMinor !== undefined || input.pricing !== undefined) {
    const priceMinor = Number(input.priceMinor || 0);
    if (!Number.isSafeInteger(priceMinor) || priceMinor < 0 || priceMinor > 100000000) throw new HttpError(400, 'INVALID_PRICE', 'Dafaa price is invalid.');
    value.priceMinor = priceMinor;
  }
  if (input.accessCode !== undefined) value.accessCode = String(input.accessCode || '').trim();
  return value;
}

export const fullPermissions = () => Object.fromEntries(PERMISSIONS.map(permission => [permission, 1]));
export const noPermissions = () => Object.fromEntries(PERMISSIONS.map(permission => [permission, 0]));
export function permissionInput(input = {}, defaults = {}) {
  return Object.fromEntries(PERMISSIONS.map(permission => [permission, booleanInt(input[permission] ?? defaults[permission])]));
}

export function membershipDto(row) {
  if (!row || !row.membership_user_id) return null;
  return {
    userId: row.membership_user_id, role: row.membership_role, status: row.membership_status,
    permissions: Object.fromEntries(PERMISSIONS.map(permission => [permission.replace(/^can_/, ''), Boolean(row[permission])])),
    applicationNote: row.application_note || '', joinedAt: row.joined_at || null, updatedAt: row.membership_updated_at
  };
}

export function dafaaDto(row) {
  return {
    id: row.id, enrollmentCode: row.enrollment_code, name: row.name, description: row.description,
    institution: row.institution, stage: row.stage, status: row.status, pricing: row.pricing,
    priceMinor: row.price_minor, currency: row.currency, visibility: row.visibility,
    joinPolicy: row.join_policy, hasAccessCode: Boolean(row.access_code_hash), ownerUserId: row.owner_user_id,
    memberCount: Number(row.member_count || 0), applicationCount: Number(row.application_count || 0),
    membership: membershipDto(row), createdAt: row.created_at, updatedAt: row.updated_at
  };
}

export async function dafaaWithMembership(db, dafaaId, userId) {
  return db.prepare(`SELECT c.*, m.user_id AS membership_user_id, m.role AS membership_role, m.status AS membership_status,
    m.can_add_content, m.can_edit_content, m.can_remove_content, m.can_manage_students,
    m.can_review_applications, m.can_manage_representers, m.can_manage_settings,
    m.application_note, m.joined_at, m.updated_at AS membership_updated_at
    FROM dafat c LEFT JOIN dafaa_memberships m ON m.dafaa_id = c.id AND m.user_id = ? WHERE c.id = ?`).bind(userId, dafaaId).first();
}

export function can(row, actor, permission) {
  if (actor.isAdmin) return true;
  if (!row || row.membership_status !== 'active') return false;
  if (row.membership_role === 'owner') return true;
  return row.membership_role === 'representer' && Boolean(row[permission]);
}

export async function requireDafaaView(db, actor, dafaaId, { content = false } = {}) {
  const row = await dafaaWithMembership(db, dafaaId, actor.id);
  if (!row || row.status !== 'active') throw new HttpError(404, 'DAFAA_NOT_FOUND', 'Dafaa was not found.');
  const activeMember = row.membership_status === 'active';
  if (content ? !activeMember && !actor.isAdmin : row.visibility !== 'public' && !activeMember && !actor.isAdmin) throw new HttpError(404, 'DAFAA_NOT_FOUND', 'Dafaa was not found.');
  return row;
}

export async function requirePermission(db, actor, dafaaId, permission) {
  const row = await requireDafaaView(db, actor, dafaaId, { content: true });
  if (!can(row, actor, permission)) throw new HttpError(403, 'DAFAA_PERMISSION_REQUIRED', 'You do not have permission for this dafaa action.');
  return row;
}

export function validateDafaaRecord(record) {
  const normalized = validateRecord(record);
  if (!DAFAA_CONTENT_KEYS.has(normalized.key)) throw new HttpError(400, 'INVALID_DAFAA_RECORD', 'This record type cannot be stored as dafaa content.');
  return normalized;
}

function collectionMap(value) {
  if (Array.isArray(value) && value.every(item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string')) return new Map(value.map(item => [item.id, item]));
  return null;
}

function analyze(previous, next, result, depth = 0) {
  if (depth > 8) { result.add('add'); result.add('edit'); result.add('remove'); return; }
  if (previous === undefined) { result.add('add'); return; }
  if (next === undefined) { result.add('remove'); return; }
  if (Object.is(previous, next)) return;
  const beforeCollection = collectionMap(previous), afterCollection = collectionMap(next);
  if (beforeCollection && afterCollection) {
    for (const key of beforeCollection.keys()) if (!afterCollection.has(key)) result.add('remove');
    for (const [key, value] of afterCollection) beforeCollection.has(key) ? analyze(beforeCollection.get(key), value, result, depth + 1) : result.add('add');
    return;
  }
  if (previous && next && typeof previous === 'object' && typeof next === 'object' && !Array.isArray(previous) && !Array.isArray(next)) {
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
    for (const key of keys) analyze(previous[key], next[key], result, depth + 1);
    return;
  }
  result.add('edit');
}

export function requiredContentPermissions(previousValue, nextValue, deleted = false) {
  if (deleted) return new Set(['can_remove_content']);
  if (previousValue === undefined) return new Set(['can_add_content']);
  const changes = new Set();
  analyze(previousValue, nextValue, changes);
  return new Set([...changes].map(change => `can_${change}_content`));
}

export function assertContentPermissions(row, actor, required) {
  for (const permission of required) if (!can(row, actor, permission)) throw new HttpError(403, 'DAFAA_PERMISSION_REQUIRED', 'You do not have permission for this content change.');
}

export async function audit(db, actorId, action, { dafaaId = null, targetUserId = null, metadata = {} } = {}) {
  await db.prepare('INSERT INTO dafaa_audit_log (id, dafaa_id, actor_user_id, action, target_user_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), dafaaId, actorId, action, targetUserId, JSON.stringify(metadata), Date.now()).run();
}

export function validateMemberPatch(input = {}) {
  const value = {};
  if (input.role !== undefined) value.role = enumValue(input.role, dafaaRoles, 'student');
  if (input.status !== undefined) value.status = enumValue(input.status, memberStatuses, 'active');
  if (input.permissions !== undefined) value.permissions = permissionInput(input.permissions);
  return value;
}

export { accountTypes, stages, memberStatuses };
