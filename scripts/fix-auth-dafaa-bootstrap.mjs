import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);
const mustReplace = (file, from, to) => {
  const value = read(file);
  if (!value.includes(from)) throw new Error(`Missing expected source in ${file}`);
  write(file, value.replace(from, to));
};

// Authentication must not be blocked by a Dafaa schema migration. Auth is the
// recovery path if the domain schema is missing or partially migrated.
mustReplace(
  'functions/api/v1/[[path]].js',
  `async function dispatch(context) {\n  requireDb(context.env);\n  await ensureDafaaSchema(context.env.DB);\n  assertSameOrigin(context.request, context.env);\n  const method = context.request.method;\n  const path = routePath(context.request);\n  if (method === 'POST' && path === 'auth/signup') return signup(context);\n  if (method === 'POST' && path === 'auth/login') return login(context);\n  if (method === 'GET' && path === 'auth/session') return session(context);\n  if (method === 'POST' && path === 'auth/logout') return logout(context);\n  const dafaaResponse = await dispatchDafaaRoute(context, method, path);`,
  `async function dispatch(context) {\n  requireDb(context.env);\n  assertSameOrigin(context.request, context.env);\n  const method = context.request.method;\n  const path = routePath(context.request);\n  if (method === 'POST' && path === 'auth/signup') return signup(context);\n  if (method === 'POST' && path === 'auth/login') return login(context);\n  if (method === 'GET' && path === 'auth/session') return session(context);\n  if (method === 'POST' && path === 'auth/logout') return logout(context);\n  await ensureDafaaSchema(context.env.DB);\n  const dafaaResponse = await dispatchDafaaRoute(context, method, path);`
);

// Account profiles are part of authentication identity, not the Dafaa domain.
// Bootstrap them independently so actor hydration can succeed even when the
// collaboration schema has never been installed in production.
let dafat = read('functions/_lib/dafat.mjs');
dafat = dafat.replace("import { ensureDafaaSchema } from './dafaa-schema.mjs';\n", '');
const profileAnchor = `export async function ensureAccountProfile(db, user, requested = null, now = Date.now()) {\n  await ensureDafaaSchema(db);`;
if (!dafat.includes(profileAnchor)) throw new Error('Missing ensureAccountProfile anchor');
const profileBootstrap = `async function ensureAccountProfileSchema(db) {\n  await db.prepare(\`CREATE TABLE IF NOT EXISTS account_profiles (\n    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,\n    account_type TEXT NOT NULL DEFAULT 'student' CHECK (account_type IN ('student', 'representer')),\n    student_stage TEXT NOT NULL DEFAULT 'university' CHECK (student_stage IN ('school', 'university', 'independent')),\n    platform_role TEXT NOT NULL DEFAULT 'student' CHECK (platform_role IN ('student', 'admin')),\n    created_at INTEGER NOT NULL,\n    updated_at INTEGER NOT NULL\n  )\`).run();\n  await db.prepare('CREATE INDEX IF NOT EXISTS account_profiles_type_idx ON account_profiles(account_type, platform_role)').run();\n}\n\nexport async function ensureAccountProfile(db, user, requested = null, now = Date.now()) {\n  await ensureAccountProfileSchema(db);`;
dafat = dafat.replace(profileAnchor, profileBootstrap);
dafat = dafat.replace(
  `const legacy = await db.prepare("SELECT 1 AS present FROM records WHERE user_id = ? AND record_key = 'dafatii:dafat:v1' AND deleted = 0 LIMIT 1").bind(user.id).first();`,
  `const legacy = await db.prepare("SELECT 1 AS present FROM records WHERE user_id = ? AND record_key IN ('dafatii:dafat:v1', 'dafatii:courses:v1') AND deleted = 0 LIMIT 1").bind(user.id).first();`
);
write('functions/_lib/dafat.mjs', dafat);

// Make the domain migrator work in both states:
// 1) legacy Course tables exist -> rename them in place;
// 2) legacy migration was never applied -> create the canonical Dafaa schema.
let schema = read('functions/_lib/dafaa-schema.mjs');
const filesRename = `  if (await tableExists(db, 'files') && await columnExists(db, 'files', 'course_id') && !await columnExists(db, 'files', 'dafaa_id')) {\n    try { await exec(db, 'ALTER TABLE files RENAME COLUMN course_id TO dafaa_id;'); }\n    catch (error) { if (!await columnExists(db, 'files', 'dafaa_id')) throw error; }\n  }\n\n  await exec(db, \``;
if (!schema.includes(filesRename)) throw new Error('Missing files migration anchor');
const bootstrapLines = [
  "  if (await tableExists(db, 'files') && await columnExists(db, 'files', 'course_id') && !await columnExists(db, 'files', 'dafaa_id')) {",
  "    try { await exec(db, 'ALTER TABLE files RENAME COLUMN course_id TO dafaa_id;'); }",
  "    catch (error) { if (!await columnExists(db, 'files', 'dafaa_id')) throw error; }",
  "  }",
  "",
  "  // Production may have auth tables without the historical Course RBAC migration.",
  "  // Bootstrap the canonical schema rather than taking authentication down.",
  "  await exec(db, \"CREATE TABLE IF NOT EXISTS account_profiles (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, account_type TEXT NOT NULL DEFAULT 'student' CHECK (account_type IN ('student', 'representer')), student_stage TEXT NOT NULL DEFAULT 'university' CHECK (student_stage IN ('school', 'university', 'independent')), platform_role TEXT NOT NULL DEFAULT 'student' CHECK (platform_role IN ('student', 'admin')), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);\");",
  "  await exec(db, \"CREATE INDEX IF NOT EXISTS account_profiles_type_idx ON account_profiles(account_type, platform_role);\");",
  "  await exec(db, \"CREATE TABLE IF NOT EXISTS dafat (id TEXT PRIMARY KEY, enrollment_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', institution TEXT NOT NULL DEFAULT '', stage TEXT NOT NULL DEFAULT 'university' CHECK (stage IN ('school', 'university', 'independent')), owner_user_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')), pricing TEXT NOT NULL DEFAULT 'free' CHECK (pricing IN ('free', 'paid')), price_minor INTEGER NOT NULL DEFAULT 0 CHECK (price_minor >= 0), currency TEXT NOT NULL DEFAULT 'USD', visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')), join_policy TEXT NOT NULL DEFAULT 'approval' CHECK (join_policy IN ('direct', 'approval')), access_code_hash TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, CHECK ((pricing = 'free' AND price_minor = 0) OR (pricing = 'paid' AND price_minor > 0)), CHECK ((visibility = 'public' AND access_code_hash IS NULL) OR (visibility = 'private' AND access_code_hash IS NOT NULL)));\");",
  "  await exec(db, \"CREATE TABLE IF NOT EXISTS dafaa_memberships (dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('owner', 'representer', 'student')), status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_pending', 'active', 'rejected', 'removed')), can_add_content INTEGER NOT NULL DEFAULT 0 CHECK (can_add_content IN (0, 1)), can_edit_content INTEGER NOT NULL DEFAULT 0 CHECK (can_edit_content IN (0, 1)), can_remove_content INTEGER NOT NULL DEFAULT 0 CHECK (can_remove_content IN (0, 1)), can_manage_students INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_students IN (0, 1)), can_review_applications INTEGER NOT NULL DEFAULT 0 CHECK (can_review_applications IN (0, 1)), can_manage_representers INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_representers IN (0, 1)), can_manage_settings INTEGER NOT NULL DEFAULT 0 CHECK (can_manage_settings IN (0, 1)), invited_by TEXT REFERENCES users(id), application_note TEXT NOT NULL DEFAULT '', joined_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (dafaa_id, user_id));\");",
  "  await exec(db, \"CREATE TABLE IF NOT EXISTS dafaa_content_records (dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE, record_key TEXT NOT NULL, format TEXT NOT NULL CHECK (format IN ('json', 'string')), value_json TEXT, deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)), revision INTEGER NOT NULL CHECK (revision > 0), last_mutation_id TEXT, updated_by TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (dafaa_id, record_key), CHECK ((deleted = 1 AND value_json IS NULL) OR (deleted = 0 AND value_json IS NOT NULL)));\");",
  "  await exec(db, \"CREATE TABLE IF NOT EXISTS dafaa_content_mutations (dafaa_id TEXT NOT NULL REFERENCES dafat(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, mutation_id TEXT NOT NULL, record_key TEXT NOT NULL, response_json TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (dafaa_id, user_id, mutation_id));\");",
  "  await exec(db, \"CREATE TABLE IF NOT EXISTS dafaa_audit_log (id TEXT PRIMARY KEY, dafaa_id TEXT REFERENCES dafat(id) ON DELETE CASCADE, actor_user_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, target_user_id TEXT REFERENCES users(id), metadata_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL);\");",
  "  if (await tableExists(db, 'files') && !await columnExists(db, 'files', 'dafaa_id')) {",
  "    try { await exec(db, 'ALTER TABLE files ADD COLUMN dafaa_id TEXT REFERENCES dafat(id) DEFAULT NULL;'); }",
  "    catch (error) { if (!await columnExists(db, 'files', 'dafaa_id')) throw error; }",
  "  }",
  "",
  "  await exec(db, `"
];
schema = schema.replace(filesRename, bootstrapLines.join('\n'));
write('functions/_lib/dafaa-schema.mjs', schema);

// The standalone Dafat route must explicitly migrate the domain now that
// actorFor no longer carries that side effect.
let gate = read('functions/_lib/dafaa-gate.mjs');
if (!gate.includes("import { requireUser } from './auth.mjs';\n")) throw new Error('Missing gate import anchor');
gate = gate.replace(
  "import { requireUser } from './auth.mjs';\n",
  "import { requireUser } from './auth.mjs';\nimport { ensureDafaaSchema } from './dafaa-schema.mjs';\n"
);
gate = gate.replace(
  `  await ensureSchoolTeacherSchema(context.env.DB);\n  const currentActor = await actorFor(context.env.DB, await requireUser(context), context.env);\n  const method = context.request.method;\n  const schoolStudent = currentActor.accountType === 'student' && currentActor.studentStage === 'school';`,
  `  const user = await requireUser(context);\n  const currentActor = await actorFor(context.env.DB, user, context.env);\n  const method = context.request.method;\n  const schoolStudent = currentActor.accountType === 'student' && currentActor.studentStage === 'school';`
);
gate = gate.replace(
  `  if (schoolStudent) {\n    if (method === 'GET' && path === 'dafat') return ok({ actor:publicActor(currentActor), dafat:[], mode:'school-teachers' });\n    throw new HttpError(403, 'SCHOOL_DAFAT_DISABLED', 'School students choose teachers by subject instead of enrolling in dafat.');\n  }\n\n  if ((method === 'POST' && path === 'dafat')`,
  `  if (schoolStudent) {\n    await ensureSchoolTeacherSchema(context.env.DB);\n    if (method === 'GET' && path === 'dafat') return ok({ actor:publicActor(currentActor), dafat:[], mode:'school-teachers' });\n    throw new HttpError(403, 'SCHOOL_DAFAT_DISABLED', 'School students choose teachers by subject instead of enrolling in dafat.');\n  }\n\n  await ensureDafaaSchema(context.env.DB);\n  await ensureSchoolTeacherSchema(context.env.DB);\n\n  if ((method === 'POST' && path === 'dafat')`
);
write('functions/_lib/dafaa-gate.mjs', gate);

// Regression guard: auth must remain usable even when the Dafaa schema needs repair.
let test = read('tests/dafaa-domain.test.js');
const marker = "console.log('Dafaa domain rename regression tests passed');";
if (!test.includes(marker)) throw new Error('Missing domain test marker');
const additions = `const routerSource = fs.readFileSync('functions/api/v1/[[path]].js','utf8');\nconst dispatchOffset = routerSource.indexOf('async function dispatch(context)');\nconst authOffset = routerSource.indexOf(\"path === 'auth/signup'\", dispatchOffset);\nconst migrateOffset = routerSource.indexOf('await ensureDafaaSchema(context.env.DB)', dispatchOffset);\nassert.ok(dispatchOffset >= 0 && authOffset > dispatchOffset && migrateOffset > authOffset, 'authentication routes must run before Dafaa schema migration');\nassert.ok(!/ensureAccountProfile[\\s\\S]{0,180}ensureDafaaSchema/.test(backend), 'account profile hydration must not depend on Dafaa migration');\nassert.ok(schema.includes('CREATE TABLE IF NOT EXISTS dafat') && schema.includes('CREATE TABLE IF NOT EXISTS dafaa_memberships'), 'Dafaa schema bootstrap must support databases without the legacy Course migration');\nassert.ok(schema.includes('ALTER TABLE files ADD COLUMN dafaa_id'), 'files must gain dafaa_id when the legacy course_id column never existed');\n\n`;
test = test.replace(marker, additions + marker);
write('tests/dafaa-domain.test.js', test);

// Remove this one-shot repair machinery before committing the real fix.
for (const file of ['scripts/fix-auth-dafaa-bootstrap.mjs','.github/workflows/auth-bootstrap-repair.yml']) {
  try { fs.rmSync(file, { force:true }); } catch {}
}
try { fs.rmdirSync('scripts'); } catch {}
