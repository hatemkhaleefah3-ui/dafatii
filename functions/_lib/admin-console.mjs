import { createUser, normalizeEmail } from './auth.mjs';
import { HttpError, ok, readJson } from './http.mjs';
import { ensureSchoolTeacherSchema, SCHOOL_SUBJECTS } from './school-teachers.mjs';
import { isUuid } from './policy.mjs';

const ROOM_KEY='dafatii:studyRoomState:v1';
const ROOM_WORKSPACE_KEY='dafatii:studyRoomWorkspace:v1';
let schemaReady=false;

const clean=(value,max=160)=>String(value??'').trim().normalize('NFC').slice(0,max);
const safeJson=value=>{try{return JSON.parse(value);}catch{return null;}};
const randomDigits=length=>{
  const bytes=crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((value,index)=>String(index===0?1+(value%9):value%10)).join('');
};

async function ensureSchema(db){
  if(schemaReady)return;
  await ensureSchoolTeacherSchema(db);
  schemaReady=true;
}

function requireAdmin(actor){
  if(!actor?.isAdmin)throw new HttpError(403,'ADMIN_REQUIRED','Administrator access is required.');
}

function normalizeImageUrl(value){
  const raw=clean(value,2048);
  if(!raw)return '';
  let url;
  try{url=new URL(raw);}catch{throw new HttpError(400,'INVALID_TEACHER_IMAGE','Teacher profile image URL is invalid.');}
  if(!['https:','http:'].includes(url.protocol))throw new HttpError(400,'INVALID_TEACHER_IMAGE','Teacher profile image URL must use http or https.');
  return url.href;
}

function normalizeTeacherContent(input={}){
  const subjects=Array.isArray(input.subjects)?input.subjects:[];
  if(subjects.length>7)throw new HttpError(400,'INVALID_TEACHER_CONTENT','A teacher can have at most seven school subjects.');
  const seen=new Set();
  const normalized=subjects.map((subject,index)=>{
    const id=String(subject?.id||subject?.subject||'').trim();
    if(!SCHOOL_SUBJECTS.includes(id)||seen.has(id))throw new HttpError(400,'INVALID_TEACHER_CONTENT','Teacher subject selection is invalid.');
    seen.add(id);
    const fameScore=Math.max(0,Math.min(100000,Number.isFinite(Number(subject?.fameScore))?Math.trunc(Number(subject.fameScore)):0));
    const chapters=Array.isArray(subject?.chapters)?subject.chapters:[];
    if(chapters.length>40)throw new HttpError(400,'INVALID_TEACHER_CONTENT','A subject can have at most 40 chapters.');
    const cleanChapters=chapters.map((chapter,chapterIndex)=>{
      const name=clean(chapter?.name,120);
      if(name.length<1)throw new HttpError(400,'INVALID_TEACHER_CONTENT','Every teacher chapter needs a name.');
      const lectures=Array.isArray(chapter?.lectures)?chapter.lectures:[];
      if(lectures.length>120)throw new HttpError(400,'INVALID_TEACHER_CONTENT','A chapter can have at most 120 lectures.');
      return {
        id:clean(chapter?.id,80)||`chapter-${index+1}-${chapterIndex+1}`,
        name,
        lectures:lectures.map((lecture,lectureIndex)=>{
          const lectureName=clean(lecture?.name,160);
          if(lectureName.length<1)throw new HttpError(400,'INVALID_TEACHER_CONTENT','Every teacher lecture needs a name.');
          const link=clean(lecture?.link,2048);
          if(link){
            let url;try{url=new URL(link);}catch{throw new HttpError(400,'INVALID_TEACHER_CONTENT','Lecture link is invalid.');}
            if(!['http:','https:'].includes(url.protocol))throw new HttpError(400,'INVALID_TEACHER_CONTENT','Lecture links must use http or https.');
          }
          return {id:clean(lecture?.id,80)||`lecture-${index+1}-${chapterIndex+1}-${lectureIndex+1}`,name:lectureName,link};
        })
      };
    });
    return {id,name:clean(subject?.name,120)||id,fameScore,chapters:cleanChapters};
  });
  return {subjects:normalized};
}

async function syncAssignments(db,teacherId,content,now,status='active'){
  await db.prepare('DELETE FROM school_teacher_assignments WHERE teacher_user_id = ?').bind(teacherId).run();
  for(const subject of content.subjects){
    await db.prepare(`INSERT INTO school_teacher_assignments
      (id, teacher_user_id, subject, academic_level, academic_stage, academic_field, fame_score, status, created_at, updated_at)
      VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(),teacherId,subject.id,subject.fameScore,status,now,now).run();
  }
}

function teacherDto(row){
  const content=safeJson(row.content_json)||{subjects:[]};
  return {
    id:row.teacher_user_id,
    email:row.email_normalized,
    displayName:row.display_name,
    imageUrl:row.image_url||'',
    subjects:Array.isArray(content.subjects)?content.subjects:[],
    status:row.status||'active',
    updatedAt:row.updated_at
  };
}

async function listTeachers(context){
  await ensureSchema(context.env.DB);
  const result=await context.env.DB.prepare(`SELECT p.teacher_user_id, p.image_url, p.content_json, p.status, p.updated_at,
      u.email_normalized, u.display_name
    FROM school_teacher_profiles p JOIN users u ON u.id=p.teacher_user_id
    ORDER BY u.display_name COLLATE NOCASE ASC LIMIT 500`).all();
  return ok({teachers:(result.results||[]).map(teacherDto)});
}

async function createTeacher(context){
  await ensureSchema(context.env.DB);
  const input=await readJson(context.request,262144);
  const email=normalizeEmail(input.email);
  const user=await context.env.DB.prepare("SELECT id,email_normalized,display_name FROM users WHERE email_normalized = ? AND status = 'active'").bind(email).first();
  if(!user)throw new HttpError(404,'USER_NOT_FOUND','Register the teacher account before adding it to the teacher directory.');
  const exists=await context.env.DB.prepare('SELECT 1 AS present FROM school_teacher_profiles WHERE teacher_user_id = ?').bind(user.id).first();
  if(exists)throw new HttpError(409,'TEACHER_EXISTS','This teacher is already in the directory.');
  const displayName=clean(input.displayName,100)||user.display_name;
  const imageUrl=normalizeImageUrl(input.imageUrl);
  const content=normalizeTeacherContent(input);
  const now=Date.now();
  await context.env.DB.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?').bind(displayName,now,user.id).run();
  await context.env.DB.prepare("INSERT INTO school_teacher_profiles (teacher_user_id,image_url,content_json,status,created_at,updated_at) VALUES (?,?,?,'active',?,?)")
    .bind(user.id,imageUrl,JSON.stringify(content),now,now).run();
  await syncAssignments(context.env.DB,user.id,content,now);
  const row=await context.env.DB.prepare(`SELECT p.teacher_user_id,p.image_url,p.content_json,p.status,p.updated_at,u.email_normalized,u.display_name
    FROM school_teacher_profiles p JOIN users u ON u.id=p.teacher_user_id WHERE p.teacher_user_id=?`).bind(user.id).first();
  return ok({teacher:teacherDto(row)},201);
}

async function updateTeacher(context,teacherId){
  await ensureSchema(context.env.DB);
  if(!isUuid(teacherId))throw new HttpError(400,'INVALID_TEACHER','Teacher identifier is invalid.');
  const current=await context.env.DB.prepare('SELECT content_json,image_url,status FROM school_teacher_profiles WHERE teacher_user_id=?').bind(teacherId).first();
  if(!current)throw new HttpError(404,'TEACHER_NOT_FOUND','Teacher was not found.');
  const input=await readJson(context.request,262144);
  const content=input.subjects===undefined?(safeJson(current.content_json)||{subjects:[]}):normalizeTeacherContent(input);
  const existingUser=await context.env.DB.prepare('SELECT display_name FROM users WHERE id=?').bind(teacherId).first();
  const displayName=input.displayName===undefined?existingUser?.display_name:clean(input.displayName,100);
  if(String(displayName||'').length<2)throw new HttpError(400,'INVALID_DISPLAY_NAME','Teacher name is required.');
  const imageUrl=input.imageUrl===undefined?String(current.image_url||''):normalizeImageUrl(input.imageUrl);
  const status=input.status===undefined?String(current.status||'active'):String(input.status);
  if(!['active','removed'].includes(status))throw new HttpError(400,'INVALID_TEACHER_STATUS','Teacher status is invalid.');
  const now=Date.now();
  await context.env.DB.prepare('UPDATE users SET display_name=?,updated_at=? WHERE id=?').bind(displayName,now,teacherId).run();
  await context.env.DB.prepare('UPDATE school_teacher_profiles SET image_url=?,content_json=?,status=?,updated_at=? WHERE teacher_user_id=?')
    .bind(imageUrl,JSON.stringify(content),status,now,teacherId).run();
  await syncAssignments(context.env.DB,teacherId,content,now,status);
  const row=await context.env.DB.prepare(`SELECT p.teacher_user_id,p.image_url,p.content_json,p.status,p.updated_at,u.email_normalized,u.display_name
    FROM school_teacher_profiles p JOIN users u ON u.id=p.teacher_user_id WHERE p.teacher_user_id=?`).bind(teacherId).first();
  return ok({teacher:teacherDto(row)});
}

async function deleteTeacher(context,teacherId){
  await ensureSchema(context.env.DB);
  if(!isUuid(teacherId))throw new HttpError(400,'INVALID_TEACHER','Teacher identifier is invalid.');
  await context.env.DB.batch([
    context.env.DB.prepare('DELETE FROM school_teacher_selections WHERE teacher_user_id=?').bind(teacherId),
    context.env.DB.prepare('DELETE FROM school_teacher_assignments WHERE teacher_user_id=?').bind(teacherId),
    context.env.DB.prepare('DELETE FROM school_teacher_profiles WHERE teacher_user_id=?').bind(teacherId)
  ]);
  return ok({teacherId,deleted:true});
}

async function createStudent(context){
  const input=await readJson(context.request,65536);
  const candidate={...input,studentId:String(input.studentId||randomDigits(12)),pin:String(input.pin||randomDigits(4))};
  const user=await createUser(context.env.DB,candidate,context.env);
  return ok({user,studentId:candidate.studentId,initialPin:candidate.pin},201);
}

async function listStudyRooms(context){
  const result=await context.env.DB.prepare(`SELECT r.user_id,r.value_json,r.updated_at,u.display_name,u.email_normalized
    FROM records r JOIN users u ON u.id=r.user_id
    WHERE r.record_key=? AND r.deleted=0 ORDER BY r.updated_at DESC LIMIT 500`).bind(ROOM_KEY).all();
  const rooms=[];
  for(const row of result.results||[]){
    const state=safeJson(row.value_json);
    for(const room of Array.isArray(state?.customRooms)?state.customRooms:[]){
      rooms.push({
        id:String(room.id||''),ownerUserId:row.user_id,ownerName:row.display_name,ownerEmail:row.email_normalized,
        name:clean(room.name,160),subject:clean(room.subject,120),visibility:clean(room.visibility,32)||'public',
        members:Number(room.members||1),updatedAt:row.updated_at
      });
    }
  }
  return ok({rooms});
}

async function deleteStudyRoom(context,ownerId,roomId){
  if(!isUuid(ownerId))throw new HttpError(400,'INVALID_IDENTIFIER','Owner identifier is invalid.');
  const row=await context.env.DB.prepare('SELECT value_json,revision FROM records WHERE user_id=? AND record_key=? AND deleted=0').bind(ownerId,ROOM_KEY).first();
  if(!row)throw new HttpError(404,'ROOM_NOT_FOUND','Study room was not found.');
  const state=safeJson(row.value_json)||{};
  const before=Array.isArray(state.customRooms)?state.customRooms:[];
  const after=before.filter(room=>String(room.id||'')!==roomId);
  if(after.length===before.length)throw new HttpError(404,'ROOM_NOT_FOUND','Study room was not found.');
  state.customRooms=after;
  if(state.active?.roomId===roomId)state.active=null;
  const now=Date.now();
  await context.env.DB.prepare('UPDATE records SET value_json=?,revision=revision+1,updated_at=? WHERE user_id=? AND record_key=?')
    .bind(JSON.stringify(state),now,ownerId,ROOM_KEY).run();
  const workspace=await context.env.DB.prepare('SELECT value_json FROM records WHERE user_id=? AND record_key=? AND deleted=0').bind(ownerId,ROOM_WORKSPACE_KEY).first();
  if(workspace?.value_json){
    const value=safeJson(workspace.value_json)||{};
    if(Object.prototype.hasOwnProperty.call(value,roomId)){
      delete value[roomId];
      await context.env.DB.prepare('UPDATE records SET value_json=?,revision=revision+1,updated_at=? WHERE user_id=? AND record_key=?')
        .bind(JSON.stringify(value),now,ownerId,ROOM_WORKSPACE_KEY).run();
    }
  }
  return ok({roomId,deleted:true});
}

export async function dispatchAdminConsoleRoute(context,method,path,actor){
  if(!path.startsWith('admin/'))return null;
  requireAdmin(actor);
  if(method==='POST'&&path==='admin/users')return createStudent(context);
  if(method==='GET'&&path==='admin/teachers')return listTeachers(context);
  if(method==='POST'&&path==='admin/teachers')return createTeacher(context);
  const teacher=path.match(/^admin\/teachers\/([0-9a-f-]{36})$/i);
  if(teacher&&method==='PATCH')return updateTeacher(context,teacher[1]);
  if(teacher&&method==='DELETE')return deleteTeacher(context,teacher[1]);
  if(method==='GET'&&path==='admin/study-rooms')return listStudyRooms(context);
  const room=path.match(/^admin\/study-rooms\/([0-9a-f-]{36})\/(.+)$/i);
  if(room&&method==='DELETE')return deleteStudyRoom(context,room[1],decodeURIComponent(room[2]));
  return null;
}
