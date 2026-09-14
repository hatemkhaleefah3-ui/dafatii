import { normalizeEmail, requireUser } from './auth.mjs';
import {
  PERMISSIONS, accessCodeHash, actorFor, assertContentPermissions, audit, can, courseDto,
  courseWithMembership, enrollmentCode, fullPermissions, noPermissions, permissionInput, publicActor,
  requireCourseView, requirePermission, requiredContentPermissions, validateCourseInput,
  validateCourseRecord, validateMemberPatch
} from './courses.mjs';
import { HttpError, logEvent, ok, readJson } from './http.mjs';
import { isUuid } from './policy.mjs';

const COURSE_SELECT = `SELECT c.*, m.user_id AS membership_user_id, m.role AS membership_role, m.status AS membership_status,
  m.can_add_content, m.can_edit_content, m.can_remove_content, m.can_manage_students,
  m.can_review_applications, m.can_manage_representers, m.can_manage_settings,
  m.application_note, m.joined_at, m.updated_at AS membership_updated_at,
  (SELECT COUNT(*) FROM course_memberships cm WHERE cm.course_id = c.id AND cm.status = 'active') AS member_count,
  (SELECT COUNT(*) FROM course_memberships ca WHERE ca.course_id = c.id AND ca.status IN ('pending','payment_pending')) AS application_count
  FROM courses c LEFT JOIN course_memberships m ON m.course_id = c.id AND m.user_id = ?`;

const memberRowDto = row => ({
  userId: row.user_id, email: row.email_normalized, displayName: row.display_name,
  accountType: row.account_type || 'student', studentStage: row.student_stage || 'university',
  role: row.role, status: row.status, applicationNote: row.application_note || '',
  permissions: Object.fromEntries(PERMISSIONS.map(permission => [permission.replace(/^can_/, ''), Boolean(row[permission])])),
  joinedAt: row.joined_at || null, createdAt: row.created_at, updatedAt: row.updated_at
});

const recordDto = row => ({ key: row.record_key, format: row.format, value: row.deleted ? null : JSON.parse(row.value_json), deleted: Boolean(row.deleted), revision: row.revision, updatedAt: row.updated_at });
const parseJson = value => { try { return JSON.parse(value); } catch { return null; } };
const validId = value => { if (!isUuid(value)) throw new HttpError(400, 'INVALID_IDENTIFIER', 'Identifier is invalid.'); return value; };
const activeOwner = row => row?.membership_status === 'active' && row?.membership_role === 'owner';
const oneOfPermissions = (row, actor, permissions) => actor.isAdmin || permissions.some(permission => can(row, actor, permission));
const equalDigest = (left, right) => {
  const a = String(left || ''), b = String(right || '');
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a.charCodeAt(index % Math.max(a.length, 1)) || 0) ^ (b.charCodeAt(index % Math.max(b.length, 1)) || 0);
  return difference === 0;
};

async function actor(context) {
  const user = await requireUser(context);
  return actorFor(context.env.DB, user, context.env);
}

async function uniqueEnrollmentCode(db) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = enrollmentCode(7);
    if (!await db.prepare('SELECT 1 AS present FROM courses WHERE enrollment_code = ?').bind(code).first()) return code;
  }
  throw new HttpError(503, 'COURSE_CODE_UNAVAILABLE', 'A course code could not be allocated.');
}

async function ensureRepresenterAccount(db, userId, now = Date.now()) {
  await db.prepare(`INSERT INTO account_profiles (user_id, account_type, student_stage, platform_role, created_at, updated_at)
    VALUES (?, 'representer', 'university', 'student', ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET account_type = 'representer', updated_at = excluded.updated_at`).bind(userId, now, now).run();
}

async function listCourses(context, currentActor) {
  const url = new URL(context.request.url);
  const scope = url.searchParams.get('scope') || 'available';
  const showArchived = currentActor.isAdmin && scope === 'admin';
  const conditions = [showArchived ? '1 = 1' : "c.status = 'active'"];
  const bindings = [currentActor.id];
  if (!currentActor.isAdmin || scope !== 'admin') {
    if (scope === 'mine') conditions.push('m.user_id IS NOT NULL');
    else if (scope === 'discover') conditions.push("c.visibility = 'public'");
    else if (!currentActor.isAdmin) conditions.push("(c.visibility = 'public' OR m.user_id IS NOT NULL)");
  }
  const result = await context.env.DB.prepare(`${COURSE_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY CASE WHEN m.status = 'active' THEN 0 WHEN m.user_id IS NOT NULL THEN 1 ELSE 2 END, c.updated_at DESC LIMIT 250`).bind(...bindings).all();
  return ok({ actor: publicActor(currentActor), courses: result.results.map(courseDto) });
}

async function getCourse(context, currentActor, courseId) {
  await requireCourseView(context.env.DB, currentActor, validId(courseId));
  const row = await context.env.DB.prepare(`${COURSE_SELECT} WHERE c.id = ?`).bind(currentActor.id, courseId).first();
  return ok({ course: courseDto(row), actor: publicActor(currentActor) });
}

async function createCourse(context, currentActor) {
  if (!currentActor.isAdmin && currentActor.accountType !== 'representer') throw new HttpError(403, 'REPRESENTER_ACCOUNT_REQUIRED', 'A representer account is required to create a course.');
  const input = await readJson(context.request, 65536);
  const value = validateCourseInput(input);
  const owner = currentActor.isAdmin && input.ownerEmail ? await context.env.DB.prepare('SELECT id, email_normalized, display_name FROM users WHERE email_normalized = ? AND status = ?').bind(normalizeEmail(input.ownerEmail), 'active').first() : currentActor;
  if (!owner) throw new HttpError(404, 'USER_NOT_FOUND', 'The selected owner account was not found.');
  const courseId = crypto.randomUUID(), code = await uniqueEnrollmentCode(context.env.DB);
  if (value.pricing === 'free') value.priceMinor = 0;
  if (value.pricing === 'paid' && value.priceMinor < 1) throw new HttpError(400, 'INVALID_PRICE', 'Paid courses require a positive price.');
  let codeHash = null;
  if (value.visibility === 'private') codeHash = await accessCodeHash(courseId, value.accessCode, context.env);
  const now = Date.now(), permissions = fullPermissions();
  const insertCourse = context.env.DB.prepare(`INSERT INTO courses
    (id, enrollment_code, name, description, institution, stage, owner_user_id, status, pricing, price_minor, currency, visibility, join_policy, access_code_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)`).bind(courseId, code, value.name, value.description, value.institution, value.stage, owner.id, value.pricing, value.priceMinor, value.currency, value.visibility, value.joinPolicy, codeHash, now, now);
  const insertOwner = context.env.DB.prepare(`INSERT INTO course_memberships
    (course_id, user_id, role, status, can_add_content, can_edit_content, can_remove_content, can_manage_students, can_review_applications, can_manage_representers, can_manage_settings, invited_by, joined_at, created_at, updated_at)
    VALUES (?, ?, 'owner', 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(courseId, owner.id, ...PERMISSIONS.map(permission => permissions[permission]), currentActor.id, now, now, now);
  await context.env.DB.batch([insertCourse, insertOwner]);
  await ensureRepresenterAccount(context.env.DB, owner.id, now);
  await audit(context.env.DB, currentActor.id, 'course.created', { courseId, targetUserId: owner.id, metadata: { pricing: value.pricing, visibility: value.visibility, joinPolicy: value.joinPolicy } });
  const row = await context.env.DB.prepare(`${COURSE_SELECT} WHERE c.id = ?`).bind(currentActor.id, courseId).first();
  logEvent('info', 'course.created', { userId: currentActor.id, courseId });
  return ok({ course: courseDto(row) }, 201);
}

async function updateCourse(context, currentActor, courseId) {
  courseId = validId(courseId);
  const current = await requirePermission(context.env.DB, currentActor, courseId, 'can_manage_settings');
  const input = await readJson(context.request, 65536), patch = validateCourseInput(input, { partial: true });
  const next = {
    name: patch.name ?? current.name, description: patch.description ?? current.description,
    institution: patch.institution ?? current.institution, stage: patch.stage ?? current.stage,
    pricing: patch.pricing ?? current.pricing, priceMinor: patch.priceMinor ?? current.price_minor,
    currency: patch.currency ?? current.currency, visibility: patch.visibility ?? current.visibility,
    joinPolicy: patch.joinPolicy ?? current.join_policy
  };
  if (next.pricing === 'free') next.priceMinor = 0;
  if (next.pricing === 'paid' && next.priceMinor < 1) throw new HttpError(400, 'INVALID_PRICE', 'Paid courses require a positive price.');
  let codeHash = current.access_code_hash;
  if (next.visibility === 'public') codeHash = null;
  else if (patch.accessCode !== undefined) codeHash = await accessCodeHash(courseId, patch.accessCode, context.env);
  else if (!codeHash) throw new HttpError(400, 'ACCESS_CODE_REQUIRED', 'A private course requires an access code.');
  await context.env.DB.prepare(`UPDATE courses SET name = ?, description = ?, institution = ?, stage = ?, pricing = ?, price_minor = ?, currency = ?, visibility = ?, join_policy = ?, access_code_hash = ?, updated_at = ? WHERE id = ?`)
    .bind(next.name, next.description, next.institution, next.stage, next.pricing, next.priceMinor, next.currency, next.visibility, next.joinPolicy, codeHash, Date.now(), courseId).run();
  await audit(context.env.DB, currentActor.id, 'course.updated', { courseId, metadata: { pricing: next.pricing, visibility: next.visibility, joinPolicy: next.joinPolicy, accessCodeChanged: patch.accessCode !== undefined } });
  const row = await context.env.DB.prepare(`${COURSE_SELECT} WHERE c.id = ?`).bind(currentActor.id, courseId).first();
  return ok({ course: courseDto(row) });
}

async function archiveCourse(context, currentActor, courseId) {
  courseId = validId(courseId);
  const row = await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  if (!currentActor.isAdmin && !activeOwner(row)) throw new HttpError(403, 'COURSE_OWNER_REQUIRED', 'Only the course owner or an administrator can archive a course.');
  await context.env.DB.prepare("UPDATE courses SET status = 'archived', updated_at = ? WHERE id = ?").bind(Date.now(), courseId).run();
  await audit(context.env.DB, currentActor.id, 'course.archived', { courseId });
  return ok({ id: courseId, status: 'archived' });
}

async function enroll(context, currentActor, identifier) {
  const input = await readJson(context.request, 32768);
  const key = String(identifier || input.course || '').trim().toUpperCase();
  const course = await context.env.DB.prepare("SELECT * FROM courses WHERE status = 'active' AND (id = ? OR enrollment_code = ?)").bind(String(identifier || input.course || ''), key).first();
  if (!course) throw new HttpError(404, 'COURSE_NOT_FOUND', 'Course was not found.');
  if (course.visibility === 'private') {
    const supplied = await accessCodeHash(course.id, input.accessCode, context.env);
    if (!equalDigest(supplied, course.access_code_hash)) throw new HttpError(403, 'INVALID_ACCESS_CODE', 'The course access code is invalid.');
  }
  const existing = await context.env.DB.prepare('SELECT role, status FROM course_memberships WHERE course_id = ? AND user_id = ?').bind(course.id, currentActor.id).first();
  if (existing?.status === 'active') return ok({ courseId: course.id, status: 'active', role: existing.role });
  if (existing && ['owner','representer'].includes(existing.role)) throw new HttpError(409, 'MEMBERSHIP_CONFLICT', 'This course role cannot submit a student enrollment.');
  const status = course.pricing === 'paid' ? 'payment_pending' : course.join_policy === 'direct' ? 'active' : 'pending';
  const note = String(input.note || '').trim().normalize('NFC').slice(0, 500), now = Date.now();
  await context.env.DB.prepare(`INSERT INTO course_memberships (course_id, user_id, role, status, application_note, joined_at, created_at, updated_at)
    VALUES (?, ?, 'student', ?, ?, ?, ?, ?)
    ON CONFLICT(course_id, user_id) DO UPDATE SET role = 'student', status = excluded.status, application_note = excluded.application_note, joined_at = excluded.joined_at, updated_at = excluded.updated_at`)
    .bind(course.id, currentActor.id, status, note, status === 'active' ? now : null, now, now).run();
  await audit(context.env.DB, currentActor.id, 'enrollment.submitted', { courseId: course.id, targetUserId: currentActor.id, metadata: { status } });
  return ok({ courseId: course.id, status, role: 'student', paymentRequired: status === 'payment_pending', priceMinor: course.price_minor, currency: course.currency }, status === 'active' ? 200 : 202);
}

async function listMembers(context, currentActor, courseId) {
  courseId = validId(courseId);
  const course = await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  if (!oneOfPermissions(course, currentActor, ['can_manage_students','can_review_applications','can_manage_representers'])) throw new HttpError(403, 'COURSE_PERMISSION_REQUIRED', 'Member management permission is required.');
  const result = await context.env.DB.prepare(`SELECT m.*, u.email_normalized, u.display_name, p.account_type, p.student_stage
    FROM course_memberships m JOIN users u ON u.id = m.user_id LEFT JOIN account_profiles p ON p.user_id = u.id
    WHERE m.course_id = ? ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'representer' THEN 1 ELSE 2 END, CASE m.status WHEN 'pending' THEN 0 WHEN 'payment_pending' THEN 1 WHEN 'active' THEN 2 ELSE 3 END, u.display_name`).bind(courseId).all();
  return ok({ course: courseDto({ ...course, member_count: result.results.filter(row => row.status === 'active').length, application_count: result.results.filter(row => ['pending','payment_pending'].includes(row.status)).length }), members: result.results.map(memberRowDto) });
}

async function addMember(context, currentActor, courseId) {
  courseId = validId(courseId);
  const course = await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  const input = await readJson(context.request, 32768), email = normalizeEmail(input.email), role = input.role === 'representer' ? 'representer' : 'student';
  if (!email) throw new HttpError(400, 'INVALID_EMAIL', 'A valid account email is required.');
  const needed = role === 'representer' ? 'can_manage_representers' : 'can_manage_students';
  if (!can(course, currentActor, needed)) throw new HttpError(403, 'COURSE_PERMISSION_REQUIRED', 'You do not have permission to add this member.');
  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email_normalized = ? AND status = 'active'").bind(email).first();
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'No active account exists for that email.');
  const existing = await context.env.DB.prepare('SELECT role FROM course_memberships WHERE course_id = ? AND user_id = ?').bind(courseId, user.id).first();
  if (existing?.role === 'owner') throw new HttpError(409, 'OWNER_MEMBERSHIP_IMMUTABLE', 'The course owner membership cannot be replaced.');
  let permissions = noPermissions();
  if (role === 'representer' && input.permissions && (currentActor.isAdmin || activeOwner(course))) permissions = permissionInput(input.permissions);
  const now = Date.now();
  await context.env.DB.prepare(`INSERT INTO course_memberships
    (course_id, user_id, role, status, can_add_content, can_edit_content, can_remove_content, can_manage_students, can_review_applications, can_manage_representers, can_manage_settings, invited_by, joined_at, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(course_id, user_id) DO UPDATE SET role = excluded.role, status = 'active', can_add_content = excluded.can_add_content,
    can_edit_content = excluded.can_edit_content, can_remove_content = excluded.can_remove_content, can_manage_students = excluded.can_manage_students,
    can_review_applications = excluded.can_review_applications, can_manage_representers = excluded.can_manage_representers,
    can_manage_settings = excluded.can_manage_settings, invited_by = excluded.invited_by, joined_at = excluded.joined_at, updated_at = excluded.updated_at`)
    .bind(courseId, user.id, role, ...PERMISSIONS.map(permission => permissions[permission]), currentActor.id, now, now, now).run();
  if (role === 'representer') await ensureRepresenterAccount(context.env.DB, user.id, now);
  await audit(context.env.DB, currentActor.id, 'membership.added', { courseId, targetUserId: user.id, metadata: { role } });
  return ok({ courseId, userId: user.id, role, status: 'active' }, 201);
}

async function patchMember(context, currentActor, courseId, targetUserId) {
  courseId = validId(courseId);targetUserId = validId(targetUserId);
  const course = await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  const target = await context.env.DB.prepare('SELECT * FROM course_memberships WHERE course_id = ? AND user_id = ?').bind(courseId, targetUserId).first();
  if (!target) throw new HttpError(404, 'MEMBERSHIP_NOT_FOUND', 'Course membership was not found.');
  if (target.role === 'owner') throw new HttpError(409, 'OWNER_MEMBERSHIP_IMMUTABLE', 'Course ownership cannot be changed through member permissions.');
  const input = validateMemberPatch(await readJson(context.request, 32768));
  const nextRole = input.role ?? target.role, nextStatus = input.status ?? target.status;
  const managingRepresentative = target.role === 'representer' || nextRole === 'representer';
  const needed = managingRepresentative ? 'can_manage_representers' : ['pending','payment_pending','rejected'].includes(target.status) && ['active','rejected'].includes(nextStatus) ? 'can_review_applications' : 'can_manage_students';
  if (!can(course, currentActor, needed)) throw new HttpError(403, 'COURSE_PERMISSION_REQUIRED', 'You do not have permission to change this membership.');
  if (nextRole === 'owner') throw new HttpError(409, 'OWNER_MEMBERSHIP_IMMUTABLE', 'Use a dedicated ownership transfer workflow to change the course owner.');
  let permissions = Object.fromEntries(PERMISSIONS.map(permission => [permission, target[permission]]));
  if (input.permissions) {
    if (!currentActor.isAdmin && !activeOwner(course)) throw new HttpError(403, 'COURSE_OWNER_REQUIRED', 'Only the course creator or an administrator can change representer advantages.');
    permissions = input.permissions;
  }
  if (nextRole === 'student') permissions = noPermissions();
  if (nextRole === 'owner') permissions = fullPermissions();
  const now = Date.now();
  await context.env.DB.prepare(`UPDATE course_memberships SET role = ?, status = ?, can_add_content = ?, can_edit_content = ?, can_remove_content = ?, can_manage_students = ?, can_review_applications = ?, can_manage_representers = ?, can_manage_settings = ?, joined_at = CASE WHEN ? = 'active' THEN COALESCE(joined_at, ?) ELSE joined_at END, updated_at = ? WHERE course_id = ? AND user_id = ?`)
    .bind(nextRole, nextStatus, ...PERMISSIONS.map(permission => permissions[permission]), nextStatus, now, now, courseId, targetUserId).run();
  if (nextRole === 'representer') await ensureRepresenterAccount(context.env.DB, targetUserId, now);
  await audit(context.env.DB, currentActor.id, 'membership.updated', { courseId, targetUserId, metadata: { role: nextRole, status: nextStatus, permissionsChanged: Boolean(input.permissions) } });
  return ok({ courseId, userId: targetUserId, role: nextRole, status: nextStatus });
}

async function removeMember(context, currentActor, courseId, targetUserId) {
  courseId = validId(courseId);targetUserId = validId(targetUserId);
  const course = await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  const target = await context.env.DB.prepare('SELECT role FROM course_memberships WHERE course_id = ? AND user_id = ?').bind(courseId, targetUserId).first();
  if (!target) throw new HttpError(404, 'MEMBERSHIP_NOT_FOUND', 'Course membership was not found.');
  if (target.role === 'owner') throw new HttpError(409, 'OWNER_MEMBERSHIP_IMMUTABLE', 'The course owner cannot be removed.');
  if (targetUserId === currentActor.id) throw new HttpError(409, 'SELF_REMOVAL_REJECTED', 'You cannot remove your own management membership here.');
  const permission = target.role === 'student' ? 'can_manage_students' : 'can_manage_representers';
  if (!can(course, currentActor, permission)) throw new HttpError(403, 'COURSE_PERMISSION_REQUIRED', 'You do not have permission to remove this member.');
  await context.env.DB.prepare("UPDATE course_memberships SET status = 'removed', updated_at = ? WHERE course_id = ? AND user_id = ?").bind(Date.now(), courseId, targetUserId).run();
  await audit(context.env.DB, currentActor.id, 'membership.removed', { courseId, targetUserId, metadata: { role: target.role } });
  return ok({ courseId, userId: targetUserId, status: 'removed' });
}

async function hydrateContent(context, currentActor, courseId) {
  courseId = validId(courseId);await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  const result = await context.env.DB.prepare('SELECT record_key, format, value_json, deleted, revision, updated_at FROM course_content_records WHERE course_id = ? ORDER BY record_key').bind(courseId).all();
  return ok({ courseId, records: result.results.map(recordDto) });
}

async function mutateContent(context, currentActor, courseId) {
  courseId = validId(courseId);
  const course = await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  const input = await readJson(context.request, 300000), mutationId = String(input.mutationId || '');
  if (!isUuid(mutationId)) throw new HttpError(400, 'INVALID_MUTATION_ID', 'Mutation ID must be a UUID.');
  const priorReceipt = await context.env.DB.prepare('SELECT response_json FROM course_content_mutations WHERE course_id = ? AND user_id = ? AND mutation_id = ?').bind(courseId, currentActor.id, mutationId).first();
  if (priorReceipt) return ok(JSON.parse(priorReceipt.response_json));
  const record = validateCourseRecord(input.record), baseRevision = Number(input.baseRevision);
  if (!Number.isSafeInteger(baseRevision) || baseRevision < 0) throw new HttpError(400, 'INVALID_REVISION', 'Base revision is invalid.');
  const existing = await context.env.DB.prepare('SELECT value_json, deleted, revision FROM course_content_records WHERE course_id = ? AND record_key = ?').bind(courseId, record.key).first();
  const previousValue = existing && !existing.deleted ? parseJson(existing.value_json) : undefined;
  const nextValue = record.deleted ? undefined : parseJson(record.valueJson);
  const required = requiredContentPermissions(previousValue, nextValue, Boolean(record.deleted));
  assertContentPermissions(course, currentActor, required);
  const now = Date.now(), revision = baseRevision + 1, response = { key: record.key, revision, updatedAt: now };
  let mutation;
  if (baseRevision === 0) mutation = context.env.DB.prepare(`INSERT OR IGNORE INTO course_content_records
    (course_id, record_key, format, value_json, deleted, revision, last_mutation_id, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`).bind(courseId, record.key, record.format, record.valueJson, record.deleted, mutationId, currentActor.id, now, now);
  else mutation = context.env.DB.prepare(`UPDATE course_content_records SET format = ?, value_json = ?, deleted = ?, revision = revision + 1, last_mutation_id = ?, updated_by = ?, updated_at = ?
    WHERE course_id = ? AND record_key = ? AND revision = ?`).bind(record.format, record.valueJson, record.deleted, mutationId, currentActor.id, now, courseId, record.key, baseRevision);
  const receipt = context.env.DB.prepare(`INSERT INTO course_content_mutations (course_id, user_id, mutation_id, record_key, response_json, created_at)
    SELECT ?, ?, ?, ?, ?, ? FROM course_content_records WHERE course_id = ? AND record_key = ? AND last_mutation_id = ?`)
    .bind(courseId, currentActor.id, mutationId, record.key, JSON.stringify(response), now, courseId, record.key, mutationId);
  const results = await context.env.DB.batch([mutation, receipt]);
  if (!results[0].meta?.changes || !results[1].meta?.changes) {
    const current = await context.env.DB.prepare('SELECT record_key, format, value_json, deleted, revision, updated_at FROM course_content_records WHERE course_id = ? AND record_key = ?').bind(courseId, record.key).first();
    throw new HttpError(409, 'COURSE_CONTENT_CONFLICT', 'Course content changed on another device.', { current: current ? recordDto(current) : null });
  }
  logEvent('info', 'course.content_mutated', { userId: currentActor.id, courseId, key: record.key, changes: [...required].join(',') });
  return ok(response);
}

async function auditLog(context, currentActor, courseId) {
  courseId = validId(courseId);
  const course = await requireCourseView(context.env.DB, currentActor, courseId, { content: true });
  if (!oneOfPermissions(course, currentActor, ['can_manage_students','can_review_applications','can_manage_representers','can_manage_settings'])) throw new HttpError(403, 'COURSE_PERMISSION_REQUIRED', 'Course management permission is required.');
  const result = await context.env.DB.prepare(`SELECT a.id, a.action, a.target_user_id, a.metadata_json, a.created_at, u.display_name AS actor_name
    FROM course_audit_log a JOIN users u ON u.id = a.actor_user_id WHERE a.course_id = ? ORDER BY a.created_at DESC LIMIT 100`).bind(courseId).all();
  return ok({ events: result.results.map(row => ({ id: row.id, action: row.action, targetUserId: row.target_user_id, metadata: parseJson(row.metadata_json) || {}, actorName: row.actor_name, createdAt: row.created_at })) });
}

async function adminOverview(context, currentActor) {
  if (!currentActor.isAdmin) throw new HttpError(403, 'ADMIN_REQUIRED', 'Administrator access is required.');
  const [users, courses, memberships, pending] = await Promise.all([
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM courses WHERE status = 'active'").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM course_memberships WHERE status = 'active'").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM course_memberships WHERE status IN ('pending','payment_pending')").first()
  ]);
  return ok({ users: Number(users?.count || 0), courses: Number(courses?.count || 0), memberships: Number(memberships?.count || 0), pending: Number(pending?.count || 0) });
}

async function adminUsers(context, currentActor) {
  if (!currentActor.isAdmin) throw new HttpError(403, 'ADMIN_REQUIRED', 'Administrator access is required.');
  const result = await context.env.DB.prepare(`SELECT u.id, u.email_normalized, u.display_name, u.status, u.created_at,
    COALESCE(p.account_type, 'student') AS account_type, COALESCE(p.student_stage, 'university') AS student_stage,
    COALESCE(p.platform_role, 'student') AS platform_role,
    (SELECT COUNT(*) FROM course_memberships m WHERE m.user_id = u.id AND m.status = 'active') AS course_count
    FROM users u LEFT JOIN account_profiles p ON p.user_id = u.id ORDER BY u.created_at DESC LIMIT 500`).all();
  return ok({ users: result.results.map(row => ({ id: row.id, email: row.email_normalized, displayName: row.display_name, status: row.status, accountType: row.account_type, studentStage: row.student_stage, platformRole: row.platform_role, courseCount: Number(row.course_count || 0), createdAt: row.created_at })) });
}

async function adminPatchUser(context, currentActor, targetUserId) {
  if (!currentActor.isAdmin) throw new HttpError(403, 'ADMIN_REQUIRED', 'Administrator access is required.');
  targetUserId = validId(targetUserId);
  const input = await readJson(context.request, 32768), now = Date.now();
  const status = input.status === undefined ? null : String(input.status);
  if (status && !['active','disabled','deleted'].includes(status)) throw new HttpError(400, 'INVALID_USER_STATUS', 'User status is invalid.');
  if (targetUserId === currentActor.id && status && status !== 'active') throw new HttpError(409, 'SELF_LOCKOUT_REJECTED', 'You cannot disable or delete your current administrator account.');
  if (status) await context.env.DB.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').bind(status, now, targetUserId).run();
  const accountType = input.accountType === 'representer' ? 'representer' : input.accountType === 'student' ? 'student' : null;
  const studentStage = ['school','university','independent'].includes(input.studentStage) ? input.studentStage : null;
  const platformRole = ['student','admin'].includes(input.platformRole) ? input.platformRole : null;
  if (targetUserId === currentActor.id && platformRole === 'student') throw new HttpError(409, 'SELF_LOCKOUT_REJECTED', 'You cannot remove your current administrator access.');
  await context.env.DB.prepare(`INSERT INTO account_profiles (user_id, account_type, student_stage, platform_role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET account_type = COALESCE(?, account_type), student_stage = COALESCE(?, student_stage), platform_role = COALESCE(?, platform_role), updated_at = ?`)
    .bind(targetUserId, accountType || 'student', studentStage || 'university', platformRole || 'student', now, now, accountType, studentStage, platformRole, now).run();
  if (status && status !== 'active') await context.env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').bind(now, targetUserId).run();
  await audit(context.env.DB, currentActor.id, 'admin.user_updated', { targetUserId, metadata: { status, accountType, studentStage, platformRole } });
  return ok({ userId: targetUserId, updated: true });
}

export async function dispatchCourseRoute(context, method, path) {
  if (!path.startsWith('courses') && !path.startsWith('admin')) return null;
  const currentActor = await actor(context);
  if (method === 'GET' && path === 'courses') return listCourses(context, currentActor);
  if (method === 'POST' && path === 'courses') return createCourse(context, currentActor);
  if (method === 'POST' && path === 'courses/enroll') return enroll(context, currentActor, '');
  if (method === 'GET' && path === 'admin/overview') return adminOverview(context, currentActor);
  if (method === 'GET' && path === 'admin/users') return adminUsers(context, currentActor);
  const adminUser = path.match(/^admin\/users\/([0-9a-f-]{36})$/i);
  if (adminUser && method === 'PATCH') return adminPatchUser(context, currentActor, adminUser[1]);
  const match = path.match(/^courses\/([0-9a-f-]{36})(?:\/(content|members|audit|enroll))?(?:\/([0-9a-f-]{36}))?$/i);
  if (!match) throw new HttpError(404, 'NOT_FOUND', 'API route was not found.');
  const [, courseId, section, targetUserId] = match;
  if (!section && method === 'GET') return getCourse(context, currentActor, courseId);
  if (!section && method === 'PATCH') return updateCourse(context, currentActor, courseId);
  if (!section && method === 'DELETE') return archiveCourse(context, currentActor, courseId);
  if (section === 'enroll' && method === 'POST') return enroll(context, currentActor, courseId);
  if (section === 'content' && method === 'GET') return hydrateContent(context, currentActor, courseId);
  if (section === 'content' && method === 'PUT') return mutateContent(context, currentActor, courseId);
  if (section === 'members' && !targetUserId && method === 'GET') return listMembers(context, currentActor, courseId);
  if (section === 'members' && !targetUserId && method === 'POST') return addMember(context, currentActor, courseId);
  if (section === 'members' && targetUserId && method === 'PATCH') return patchMember(context, currentActor, courseId, targetUserId);
  if (section === 'members' && targetUserId && method === 'DELETE') return removeMember(context, currentActor, courseId, targetUserId);
  if (section === 'audit' && method === 'GET') return auditLog(context, currentActor, courseId);
  throw new HttpError(404, 'NOT_FOUND', 'API route was not found.');
}
