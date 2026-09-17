import { normalizeEmail, requireUser } from './auth.mjs';
import { actorFor } from './dafat.mjs';
import { ensureDafaaSchema } from './dafaa-schema.mjs';
import { ensureSchoolTeacherSchema, SCHOOL_SUBJECTS } from './school-teachers.mjs';
import { HttpError, ok, readJson } from './http.mjs';
import { isUuid } from './policy.mjs';

const RESET_KEY = 'supervision-reset-20260917-v1';
const LEVEL_RULES = Object.freeze({
  primary_school: { stages:['sixth'], fields:[] },
  middle_school: { stages:['third'], fields:[] },
  preparatory_school: { stages:['sixth'], fields:['scientific','literary'] },
  institute: { stages:['first','second'], fields:['medical','technical','mechanical','electrical','chemical','petroleum'] },
  college: { stages:['first','second','third','fourth','fifth','sixth'], fields:['medical','engineering','sciences','education'] },
  primary_studies: { stages:['primary_studies'], fields:[] },
  postgraduate_studies: { stages:['postgraduate_studies'], fields:[] }
});
const USER_STATUSES = new Set(['active','disabled']);
const DAFAA_STATUSES = new Set(['active','archived']);
const TEACHER_STATUSES = new Set(['active','inactive']);
const clean = (value, maximum=160) => String(value ?? '').trim().normalize('NFC').slice(0, maximum);
const validId = value => { if (!isUuid(value)) throw new HttpError(400,'INVALID_IDENTIFIER','Identifier is invalid.'); return value; };

async function requireAdmin(context) {
  const user = await requireUser(context);
  const actor = await actorFor(context.env.DB, user, context.env);
  if (!actor.isAdmin) throw new HttpError(403,'ADMIN_REQUIRED','Administrator access is required.');
  return actor;
}

async function ensureResetTable(db) {
  await db.prepare('CREATE TABLE IF NOT EXISTS system_flags (flag_key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)').run();
}

async function runOneTimeReset(db, actor) {
  await ensureResetTable(db);
  const done = await db.prepare('SELECT value FROM system_flags WHERE flag_key = ?').bind(RESET_KEY).first();
  if (done) return false;
  const now = Date.now();
  await db.batch([
    db.prepare('UPDATE files SET dafaa_id = NULL WHERE dafaa_id IS NOT NULL'),
    db.prepare('DELETE FROM school_teacher_selections'),
    db.prepare('DELETE FROM school_teacher_assignments'),
    db.prepare('DELETE FROM dafat'),
    db.prepare('DELETE FROM users WHERE id <> ?').bind(actor.id),
    db.prepare('INSERT INTO system_flags (flag_key, value, updated_at) VALUES (?, ?, ?)').bind(RESET_KEY, JSON.stringify({ preservedAdminId:actor.id, resetAt:now }), now)
  ]);
  return true;
}

function academicFilter(url, alias='ap') {
  const clauses=[]; const bindings=[];
  for (const [param,column] of [['level','academic_level'],['stage','academic_stage'],['field','academic_field']]) {
    const value=clean(url.searchParams.get(param),80);
    if (value) { clauses.push(`${alias}.${column} = ?`); bindings.push(value); }
  }
  return { clauses, bindings };
}

function searchFilter(url, columns) {
  const q=clean(url.searchParams.get('q'),120).toLowerCase();
  if (!q) return { clause:'', binding:[] };
  return { clause:`(${columns.map(column=>`LOWER(COALESCE(${column}, '')) LIKE ?`).join(' OR ')})`, binding:columns.map(()=>`%${q}%`) };
}

async function listStudents(db, actor, url) {
  const filter=academicFilter(url,'ap');
  const search=searchFilter(url,['u.display_name','u.email_normalized','ap.institution_name']);
  const clauses=['u.id <> ?', "COALESCE(p.platform_role,'student') <> 'admin'", ...filter.clauses];
  const bindings=[actor.id, ...filter.bindings];
  if (search.clause) { clauses.push(search.clause); bindings.push(...search.binding); }
  const result=await db.prepare(`SELECT u.id,u.email_normalized,u.display_name,u.status,u.created_at,
      COALESCE(p.account_type,'student') AS account_type,COALESCE(p.student_stage,'university') AS student_stage,
      ap.academic_level,ap.academic_stage,ap.academic_field,ap.institution_name
    FROM users u LEFT JOIN account_profiles p ON p.user_id=u.id
    LEFT JOIN student_academic_profiles ap ON ap.user_id=u.id
    WHERE ${clauses.join(' AND ')} ORDER BY u.created_at DESC LIMIT 500`).bind(...bindings).all();
  return result.results || [];
}

async function listDafat(db, url) {
  const filter=academicFilter(url,'ap');
  const search=searchFilter(url,['d.name','d.institution','u.display_name','u.email_normalized']);
  const clauses=[...filter.clauses]; const bindings=[...filter.bindings];
  if (search.clause) { clauses.push(search.clause); bindings.push(...search.binding); }
  const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
  const result=await db.prepare(`SELECT d.id,d.name,d.institution,d.stage,d.status,d.visibility,d.pricing,d.owner_user_id,d.created_at,d.updated_at,
      u.display_name AS owner_name,u.email_normalized AS owner_email,
      ap.academic_level,ap.academic_stage,ap.academic_field
    FROM dafat d JOIN users u ON u.id=d.owner_user_id
    LEFT JOIN student_academic_profiles ap ON ap.user_id=u.id
    ${where} ORDER BY d.updated_at DESC LIMIT 500`).bind(...bindings).all();
  return result.results || [];
}

async function listTeachers(db, url) {
  const filter=academicFilter(url,'a');
  const search=searchFilter(url,['u.display_name','u.email_normalized','a.subject']);
  const clauses=[...filter.clauses]; const bindings=[...filter.bindings];
  if (search.clause) { clauses.push(search.clause); bindings.push(...search.binding); }
  const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
  const result=await db.prepare(`SELECT a.id,a.teacher_user_id,a.subject,a.academic_level,a.academic_stage,a.academic_field,a.fame_score,a.status,a.updated_at,
      u.display_name,u.email_normalized,u.status AS account_status
    FROM school_teacher_assignments a JOIN users u ON u.id=a.teacher_user_id
    ${where} ORDER BY a.fame_score DESC,u.display_name COLLATE NOCASE ASC LIMIT 500`).bind(...bindings).all();
  return result.results || [];
}

function academicValue(input, current={}) {
  const level=clean(input.academicLevel ?? current.academic_level,80);
  const rule=LEVEL_RULES[level];
  if (!rule) throw new HttpError(400,'INVALID_ACADEMIC_LEVEL','Academic level is invalid.');
  const stage=clean(input.academicStage ?? current.academic_stage,80);
  if (!rule.stages.includes(stage)) throw new HttpError(400,'INVALID_ACADEMIC_STAGE','Academic stage does not match the selected level.');
  const field=clean(input.academicField ?? current.academic_field,80);
  if (rule.fields.length ? !rule.fields.includes(field) : Boolean(field)) throw new HttpError(400,'INVALID_ACADEMIC_FIELD','Academic field does not match the selected level.');
  return { level, stage, field:field || null };
}

async function updateStudent(context, id) {
  id=validId(id); const input=await readJson(context.request,32768);
  const row=await context.env.DB.prepare(`SELECT u.id,u.display_name,u.status,ap.academic_level,ap.academic_stage,ap.academic_field,ap.institution_name
    FROM users u LEFT JOIN student_academic_profiles ap ON ap.user_id=u.id WHERE u.id=?`).bind(id).first();
  if (!row) throw new HttpError(404,'USER_NOT_FOUND','Student account was not found.');
  const displayName=input.displayName===undefined?row.display_name:clean(input.displayName,100);
  if (displayName.length<2) throw new HttpError(400,'INVALID_DISPLAY_NAME','Full name is required.');
  const status=input.status===undefined?row.status:String(input.status);
  if (!USER_STATUSES.has(status)) throw new HttpError(400,'INVALID_STATUS','Account status is invalid.');
  const academic=academicValue(input,row);
  const institution=input.institutionName===undefined?clean(row.institution_name):clean(input.institutionName);
  if (institution.length<2) throw new HttpError(400,'INVALID_INSTITUTION','Institution name is required.');
  const now=Date.now();
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE users SET display_name=?,status=?,updated_at=? WHERE id=?').bind(displayName,status,now,id),
    context.env.DB.prepare(`INSERT INTO student_academic_profiles (user_id,academic_level,academic_stage,academic_field,institution_name,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET academic_level=excluded.academic_level,academic_stage=excluded.academic_stage,
      academic_field=excluded.academic_field,institution_name=excluded.institution_name,updated_at=excluded.updated_at`)
      .bind(id,academic.level,academic.stage,academic.field,institution,now,now)
  ]);
  return ok({ id, updated:true });
}

async function deleteStudent(context, actor, id) {
  id=validId(id); if (id===actor.id) throw new HttpError(409,'ADMIN_SELF_DELETE_BLOCKED','The active administrator cannot delete their own account.');
  const exists=await context.env.DB.prepare('SELECT id FROM users WHERE id=?').bind(id).first();
  if (!exists) throw new HttpError(404,'USER_NOT_FOUND','Student account was not found.');
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE files SET dafaa_id=NULL WHERE dafaa_id IN (SELECT id FROM dafat WHERE owner_user_id=?)').bind(id),
    context.env.DB.prepare('DELETE FROM dafat WHERE owner_user_id=?').bind(id),
    context.env.DB.prepare('DELETE FROM users WHERE id=?').bind(id)
  ]);
  return ok({ id, deleted:true });
}

async function updateDafaaAdmin(context,id) {
  id=validId(id); const input=await readJson(context.request,32768);
  const row=await context.env.DB.prepare('SELECT * FROM dafat WHERE id=?').bind(id).first();
  if (!row) throw new HttpError(404,'DAFAA_NOT_FOUND','Dafaa was not found.');
  const name=input.name===undefined?row.name:clean(input.name,120); if (name.length<2) throw new HttpError(400,'INVALID_DAFAA_NAME','Dafaa name is required.');
  const institution=input.institution===undefined?row.institution:clean(input.institution,160);
  const status=input.status===undefined?row.status:String(input.status); if (!DAFAA_STATUSES.has(status)) throw new HttpError(400,'INVALID_STATUS','Dafaa status is invalid.');
  const stage=input.stage===undefined?row.stage:String(input.stage); if (!['university','independent'].includes(stage)) throw new HttpError(400,'INVALID_STAGE','Dafaa stage is invalid.');
  await context.env.DB.prepare('UPDATE dafat SET name=?,institution=?,status=?,stage=?,updated_at=? WHERE id=?').bind(name,institution,status,stage,Date.now(),id).run();
  return ok({ id, updated:true });
}

async function deleteDafaaAdmin(context,id) {
  id=validId(id); const exists=await context.env.DB.prepare('SELECT id FROM dafat WHERE id=?').bind(id).first();
  if (!exists) throw new HttpError(404,'DAFAA_NOT_FOUND','Dafaa was not found.');
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE files SET dafaa_id=NULL WHERE dafaa_id=?').bind(id),
    context.env.DB.prepare('DELETE FROM dafat WHERE id=?').bind(id)
  ]);
  return ok({ id, deleted:true });
}

async function updateTeacher(context,id) {
  id=validId(id); const input=await readJson(context.request,32768);
  const row=await context.env.DB.prepare('SELECT * FROM school_teacher_assignments WHERE id=?').bind(id).first();
  if (!row) throw new HttpError(404,'TEACHER_NOT_FOUND','Teacher assignment was not found.');
  const subject=String(input.subject ?? row.subject); if (!SCHOOL_SUBJECTS.includes(subject)) throw new HttpError(400,'INVALID_SUBJECT','Teacher subject is invalid.');
  const academic=academicValue(input,row);
  const fameScore=input.fameScore===undefined?Number(row.fame_score||0):Number(input.fameScore);
  if (!Number.isSafeInteger(fameScore)||fameScore<0||fameScore>1000000) throw new HttpError(400,'INVALID_FAME_SCORE','Teacher fame score is invalid.');
  const status=input.status===undefined?row.status:String(input.status); if (!TEACHER_STATUSES.has(status)) throw new HttpError(400,'INVALID_STATUS','Teacher status is invalid.');
  await context.env.DB.prepare(`UPDATE school_teacher_assignments SET subject=?,academic_level=?,academic_stage=?,academic_field=?,fame_score=?,status=?,updated_at=? WHERE id=?`)
    .bind(subject,academic.level,academic.stage,academic.field,fameScore,status,Date.now(),id).run();
  return ok({ id, updated:true });
}

async function deleteTeacherAssignment(context,id) {
  id=validId(id); const result=await context.env.DB.prepare('DELETE FROM school_teacher_assignments WHERE id=?').bind(id).run();
  if (!result.meta?.changes) throw new HttpError(404,'TEACHER_NOT_FOUND','Teacher assignment was not found.');
  return ok({ id, removed:true });
}

async function deleteTeacherAccount(context,actor,id) {
  id=validId(id); const row=await context.env.DB.prepare('SELECT teacher_user_id FROM school_teacher_assignments WHERE id=?').bind(id).first();
  if (!row) throw new HttpError(404,'TEACHER_NOT_FOUND','Teacher assignment was not found.');
  return deleteStudent(context,actor,row.teacher_user_id);
}

export async function dispatchAdminSupervision(context,method,path) {
  if (!String(path||'').startsWith('admin/supervision')) return null;
  const actor=await requireAdmin(context);
  await ensureDafaaSchema(context.env.DB);
  await ensureSchoolTeacherSchema(context.env.DB);
  const resetApplied=await runOneTimeReset(context.env.DB,actor);
  if (method==='GET' && path==='admin/supervision') {
    const url=new URL(context.request.url);
    const [students,dafat,teachers]=await Promise.all([listStudents(context.env.DB,actor,url),listDafat(context.env.DB,url),listTeachers(context.env.DB,url)]);
    return ok({ resetApplied,students,dafat,teachers,filters:{ levels:Object.keys(LEVEL_RULES),subjects:SCHOOL_SUBJECTS } });
  }
  let match=path.match(/^admin\/supervision\/students\/([0-9a-f-]{36})$/i);
  if (match && method==='PATCH') return updateStudent(context,match[1]);
  if (match && method==='DELETE') return deleteStudent(context,actor,match[1]);
  match=path.match(/^admin\/supervision\/dafat\/([0-9a-f-]{36})$/i);
  if (match && method==='PATCH') return updateDafaaAdmin(context,match[1]);
  if (match && method==='DELETE') return deleteDafaaAdmin(context,match[1]);
  match=path.match(/^admin\/supervision\/teachers\/([0-9a-f-]{36})$/i);
  if (match && method==='PATCH') return updateTeacher(context,match[1]);
  if (match && method==='DELETE') return deleteTeacherAssignment(context,match[1]);
  match=path.match(/^admin\/supervision\/teachers\/([0-9a-f-]{36})\/account$/i);
  if (match && method==='DELETE') return deleteTeacherAccount(context,actor,match[1]);
  throw new HttpError(404,'NOT_FOUND','Supervision route was not found.');
}
