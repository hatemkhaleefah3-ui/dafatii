import { HttpError, ok, readJson } from './http.mjs';

let socialSchemaReady = false;
const KINDS = new Set(['private','group','anonymous']);
const VISIBILITY = new Set(['private','public']);
const POST_TYPES = new Set(['announcement','blog','event']);

const requireUuid = (value, code='INVALID_IDENTIFIER') => {
  const text=String(value||'');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) throw new HttpError(400,code,'Identifier is invalid.');
  return text;
};
const cleanText=(value,max,{required=false}={})=>{
  const text=String(value??'').trim();
  if(required&&!text)throw new HttpError(400,'INVALID_INPUT','A required field is missing.');
  if(text.length>max)throw new HttpError(400,'INVALID_INPUT',`Text exceeds ${max} characters.`);
  return text;
};
const boolInt=value=>value?1:0;

export async function ensureSocialSchema(db){
  if(socialSchemaReady)return;
  const statements=[
    `CREATE TABLE IF NOT EXISTS social_conversations (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('private','group','anonymous')),
      name TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
      owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS social_members (
      conversation_id TEXT NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
      joined_at INTEGER NOT NULL,
      last_read_at INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
      pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),
      muted INTEGER NOT NULL DEFAULT 0 CHECK (muted IN (0,1)),
      PRIMARY KEY (conversation_id,user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS social_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
      sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('text','poll')),
      payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      edited_at INTEGER,
      deleted_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS social_reactions (
      message_id TEXT NOT NULL REFERENCES social_messages(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (message_id,user_id,emoji)
    )`,
    `CREATE TABLE IF NOT EXISTS social_poll_votes (
      message_id TEXT NOT NULL REFERENCES social_messages(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      option_index INTEGER NOT NULL CHECK (option_index >= 0 AND option_index < 8),
      created_at INTEGER NOT NULL,
      PRIMARY KEY (message_id,user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS social_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('announcement','blog','event')),
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS social_post_saves (
      post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (post_id,user_id)
    )`,
    'CREATE INDEX IF NOT EXISTS social_members_user_idx ON social_members(user_id, archived, joined_at DESC)',
    'CREATE INDEX IF NOT EXISTS social_conversations_kind_idx ON social_conversations(kind, visibility, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS social_messages_conversation_idx ON social_messages(conversation_id, created_at)',
    'CREATE INDEX IF NOT EXISTS social_posts_created_idx ON social_posts(created_at DESC)'
  ];
  for(const sql of statements)await db.prepare(sql).run();
  socialSchemaReady=true;
}

const aliasWordsA=['Quiet','Logic','Hidden','Soft','Midnight','Study','Bright','Calm','Swift','Clever','Kind','Blue'];
const aliasWordsB=['Owl','Fox','Byte','Echo','Calc','Phantom','Notebook','Panda','Falcon','Map','Leaf','Comet'];
function anonymousAlias(conversationId,userId){
  let hash=2166136261;
  for(const ch of `${conversationId}:${userId}`){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}
  const n=hash>>>0;
  return aliasWordsA[n%aliasWordsA.length]+aliasWordsB[Math.floor(n/aliasWordsA.length)%aliasWordsB.length];
}
function parsePayload(value){try{return JSON.parse(value)}catch{return {text:''}}}
function messagePreview(type,payload){
  if(type==='poll')return payload?.question||'Poll';
  return payload?.text||'Message';
}

async function rateLimit(db,userId,table,windowMs,limit){
  const since=Date.now()-windowMs;
  const row=await db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${table==='social_conversations'?'owner_user_id':'sender_user_id'} = ? AND created_at > ?`).bind(userId,since).first();
  if(Number(row?.count||0)>=limit)throw new HttpError(429,'SOCIAL_RATE_LIMITED','Too many actions. Please try again later.');
}

async function memberRow(db,userId,conversationId){
  return db.prepare('SELECT * FROM social_members WHERE conversation_id = ? AND user_id = ?').bind(conversationId,userId).first();
}
async function conversationRow(db,conversationId){
  return db.prepare('SELECT * FROM social_conversations WHERE id = ?').bind(conversationId).first();
}
async function requireReadable(db,userId,conversationId){
  const conversation=await conversationRow(db,conversationId);
  if(!conversation)throw new HttpError(404,'CONVERSATION_NOT_FOUND','Conversation was not found.');
  const member=await memberRow(db,userId,conversationId);
  if(!member&&(conversation.kind==='private'||conversation.visibility!=='public'))throw new HttpError(403,'CONVERSATION_ACCESS_DENIED','You do not have access to this conversation.');
  return {conversation,member};
}
async function requireWritable(db,userId,conversationId){
  const access=await requireReadable(db,userId,conversationId);
  if(!access.member){
    const now=Date.now();
    await db.prepare('INSERT OR IGNORE INTO social_members (conversation_id,user_id,role,joined_at,last_read_at) VALUES (?,?,?,?,?)').bind(conversationId,userId,'member',now,now).run();
    access.member=await memberRow(db,userId,conversationId);
  }
  return access;
}

async function people(context,user){
  const q=cleanText(new URL(context.request.url).searchParams.get('q')||'',80);
  if(q.length<2)return ok({people:[]});
  const rows=await context.env.DB.prepare(`SELECT id,display_name FROM users
    WHERE status='active' AND id != ? AND lower(display_name) LIKE lower(?) ORDER BY display_name LIMIT 20`).bind(user.id,`%${q}%`).all();
  return ok({people:rows.results.map(row=>({id:row.id,name:row.display_name}))});
}

async function listConversations(context,user){
  const db=context.env.DB;
  const joined=await db.prepare(`SELECT c.id,c.kind,c.name,c.topic,c.visibility,c.owner_user_id,c.created_at,c.updated_at,
      m.role,m.archived,m.pinned,m.muted,m.last_read_at,
      (SELECT COUNT(*) FROM social_members mm WHERE mm.conversation_id=c.id) AS member_count,
      (SELECT created_at FROM social_messages sm WHERE sm.conversation_id=c.id AND sm.deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT type FROM social_messages sm WHERE sm.conversation_id=c.id AND sm.deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) AS last_message_type,
      (SELECT payload_json FROM social_messages sm WHERE sm.conversation_id=c.id AND sm.deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) AS last_message_payload,
      (SELECT COUNT(*) FROM social_messages sm WHERE sm.conversation_id=c.id AND sm.deleted_at IS NULL AND sm.sender_user_id != ? AND sm.created_at > m.last_read_at) AS unread,
      CASE WHEN c.kind='private' THEN (
        SELECT u.display_name FROM social_members om JOIN users u ON u.id=om.user_id
        WHERE om.conversation_id=c.id AND om.user_id != ? LIMIT 1
      ) ELSE c.name END AS display_name
    FROM social_members m JOIN social_conversations c ON c.id=m.conversation_id
    WHERE m.user_id=? ORDER BY m.pinned DESC, COALESCE(last_message_at,c.updated_at) DESC LIMIT 120`).bind(user.id,user.id,user.id).all();
  const discoverGroups=await db.prepare(`SELECT c.id,c.kind,c.name,c.topic,c.visibility,c.owner_user_id,c.created_at,c.updated_at,
      (SELECT COUNT(*) FROM social_members sm WHERE sm.conversation_id=c.id) AS member_count
    FROM social_conversations c WHERE c.kind='group' AND c.visibility='public'
      AND NOT EXISTS (SELECT 1 FROM social_members m WHERE m.conversation_id=c.id AND m.user_id=?)
    ORDER BY c.updated_at DESC LIMIT 40`).bind(user.id).all();
  const discoverAnonymous=await db.prepare(`SELECT c.id,c.kind,c.name,c.topic,c.visibility,c.owner_user_id,c.created_at,c.updated_at,
      (SELECT COUNT(*) FROM social_members sm WHERE sm.conversation_id=c.id) AS member_count,
      (SELECT created_at FROM social_messages mm WHERE mm.conversation_id=c.id AND mm.deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT payload_json FROM social_messages mm WHERE mm.conversation_id=c.id AND mm.deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) AS last_message_payload,
      (SELECT type FROM social_messages mm WHERE mm.conversation_id=c.id AND mm.deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) AS last_message_type
    FROM social_conversations c WHERE c.kind='anonymous' AND c.visibility='public'
      AND NOT EXISTS (SELECT 1 FROM social_members m WHERE m.conversation_id=c.id AND m.user_id=?)
    ORDER BY COALESCE(last_message_at,c.updated_at) DESC LIMIT 40`).bind(user.id).all();
  const mapJoined=row=>{
    const payload=parsePayload(row.last_message_payload);
    const name=row.kind==='anonymous'?(row.topic||'Anonymous room'):(row.display_name||row.name);
    return {id:row.id,kind:row.kind,name,topic:row.topic,visibility:row.visibility,owner:row.owner_user_id===user.id,role:row.role,
      archived:Boolean(row.archived),pinned:Boolean(row.pinned),muted:Boolean(row.muted),memberCount:Number(row.member_count||0),
      unread:Number(row.unread||0),lastMessageAt:row.last_message_at||null,lastMessage:row.last_message_type?messagePreview(row.last_message_type,payload):'',joined:true};
  };
  const mapDiscover=row=>{
    const payload=parsePayload(row.last_message_payload);
    return {id:row.id,kind:row.kind,name:row.kind==='anonymous'?(row.topic||'Anonymous room'):row.name,topic:row.topic,visibility:row.visibility,
      memberCount:Number(row.member_count||0),unread:0,lastMessageAt:row.last_message_at||null,lastMessage:row.last_message_type?messagePreview(row.last_message_type,payload):'',joined:false};
  };
  return ok({conversations:joined.results.map(mapJoined),discoverGroups:discoverGroups.results.map(mapDiscover),discoverAnonymous:discoverAnonymous.results.map(mapDiscover)});
}

async function createConversation(context,user){
  const input=await readJson(context.request,32768);
  const kind=String(input.kind||'');
  if(!KINDS.has(kind))throw new HttpError(400,'INVALID_CONVERSATION_KIND','Conversation type is invalid.');
  await rateLimit(context.env.DB,user.id,'social_conversations',86400000,30);
  const db=context.env.DB,now=Date.now();
  if(kind==='private'){
    const recipientId=requireUuid(input.recipientId,'INVALID_RECIPIENT');
    if(recipientId===user.id)throw new HttpError(400,'INVALID_RECIPIENT','Choose another person.');
    const recipient=await db.prepare("SELECT id,display_name FROM users WHERE id=? AND status='active'").bind(recipientId).first();
    if(!recipient)throw new HttpError(404,'RECIPIENT_NOT_FOUND','That account is unavailable.');
    const existing=await db.prepare(`SELECT c.id FROM social_conversations c
      WHERE c.kind='private'
      AND EXISTS(SELECT 1 FROM social_members a WHERE a.conversation_id=c.id AND a.user_id=?)
      AND EXISTS(SELECT 1 FROM social_members b WHERE b.conversation_id=c.id AND b.user_id=?)
      AND (SELECT COUNT(*) FROM social_members z WHERE z.conversation_id=c.id)=2 LIMIT 1`).bind(user.id,recipientId).first();
    if(existing)return ok({conversation:{id:existing.id,kind:'private',name:recipient.display_name,joined:true}});
    const id=crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO social_conversations (id,kind,name,topic,visibility,owner_user_id,created_at,updated_at) VALUES (?,'private','Private chat','','private',?,?,?)").bind(id,user.id,now,now),
      db.prepare("INSERT INTO social_members (conversation_id,user_id,role,joined_at,last_read_at) VALUES (?,?,?,?,?)").bind(id,user.id,'owner',now,now),
      db.prepare("INSERT INTO social_members (conversation_id,user_id,role,joined_at,last_read_at) VALUES (?,?,?,?,?)").bind(id,recipientId,'member',now,0)
    ]);
    return ok({conversation:{id,kind:'private',name:recipient.display_name,joined:true}},201);
  }
  const id=crypto.randomUUID();
  const topic=cleanText(input.topic,180,{required:kind==='anonymous'});
  const name=kind==='anonymous'?'Anonymous room':cleanText(input.name,80,{required:true});
  const visibility=VISIBILITY.has(String(input.visibility||''))?String(input.visibility):'private';
  await db.batch([
    db.prepare('INSERT INTO social_conversations (id,kind,name,topic,visibility,owner_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,kind,name,topic,visibility,user.id,now,now),
    db.prepare('INSERT INTO social_members (conversation_id,user_id,role,joined_at,last_read_at) VALUES (?,?,?,?,?)').bind(id,user.id,'owner',now,now)
  ]);
  return ok({conversation:{id,kind,name:kind==='anonymous'?topic:name,topic,visibility,memberCount:1,joined:true}},201);
}

async function joinConversation(context,user,conversationId){
  const id=requireUuid(conversationId);
  const conversation=await conversationRow(context.env.DB,id);
  if(!conversation)throw new HttpError(404,'CONVERSATION_NOT_FOUND','Conversation was not found.');
  if(conversation.kind==='private'||conversation.visibility!=='public')throw new HttpError(403,'CONVERSATION_JOIN_DENIED','This conversation is not open to joining.');
  const now=Date.now();
  await context.env.DB.prepare('INSERT OR IGNORE INTO social_members (conversation_id,user_id,role,joined_at,last_read_at) VALUES (?,?,?,?,?)').bind(id,user.id,'member',now,now).run();
  return ok({joined:true});
}

async function patchConversation(context,user,conversationId){
  const id=requireUuid(conversationId),member=await memberRow(context.env.DB,user.id,id);
  if(!member)throw new HttpError(403,'CONVERSATION_ACCESS_DENIED','Join this conversation first.');
  const input=await readJson(context.request,4096);
  const archived=input.archived===undefined?Boolean(member.archived):Boolean(input.archived);
  const pinned=input.pinned===undefined?Boolean(member.pinned):Boolean(input.pinned);
  const muted=input.muted===undefined?Boolean(member.muted):Boolean(input.muted);
  await context.env.DB.prepare('UPDATE social_members SET archived=?,pinned=?,muted=? WHERE conversation_id=? AND user_id=?').bind(boolInt(archived),boolInt(pinned),boolInt(muted),id,user.id).run();
  return ok({archived,pinned,muted});
}

async function listMessages(context,user,conversationId){
  const id=requireUuid(conversationId),{conversation,member}=await requireReadable(context.env.DB,user.id,id);
  const url=new URL(context.request.url),before=Number(url.searchParams.get('before')||0),limit=Math.min(Math.max(Number(url.searchParams.get('limit')||80),1),120);
  const rows=before>0
    ? await context.env.DB.prepare(`SELECT sm.*,u.display_name FROM social_messages sm JOIN users u ON u.id=sm.sender_user_id WHERE sm.conversation_id=? AND sm.created_at<? ORDER BY sm.created_at DESC LIMIT ?`).bind(id,before,limit).all()
    : await context.env.DB.prepare(`SELECT sm.*,u.display_name FROM social_messages sm JOIN users u ON u.id=sm.sender_user_id WHERE sm.conversation_id=? ORDER BY sm.created_at DESC LIMIT ?`).bind(id,limit).all();
  const ordered=[...rows.results].reverse();
  const ids=ordered.map(row=>row.id);
  const reactionMap=new Map(),pollVoteMap=new Map();
  if(ids.length){
    const placeholders=ids.map(()=>'?').join(',');
    const reactions=await context.env.DB.prepare(`SELECT message_id,emoji,COUNT(*) AS count FROM social_reactions WHERE message_id IN (${placeholders}) GROUP BY message_id,emoji`).bind(...ids).all();
    for(const row of reactions.results){if(!reactionMap.has(row.message_id))reactionMap.set(row.message_id,{});reactionMap.get(row.message_id)[row.emoji]=Number(row.count||0);}
    const votes=await context.env.DB.prepare(`SELECT message_id,option_index,COUNT(*) AS count FROM social_poll_votes WHERE message_id IN (${placeholders}) GROUP BY message_id,option_index`).bind(...ids).all();
    for(const row of votes.results){if(!pollVoteMap.has(row.message_id))pollVoteMap.set(row.message_id,new Map());pollVoteMap.get(row.message_id).set(Number(row.option_index),Number(row.count||0));}
  }
  if(member)await context.env.DB.prepare('UPDATE social_members SET last_read_at=? WHERE conversation_id=? AND user_id=?').bind(Date.now(),id,user.id).run();
  let displayName=conversation.kind==='anonymous'?(conversation.topic||'Anonymous room'):conversation.name;
  if(conversation.kind==='private'){
    const other=await context.env.DB.prepare(`SELECT u.display_name FROM social_members m JOIN users u ON u.id=m.user_id WHERE m.conversation_id=? AND m.user_id != ? LIMIT 1`).bind(id,user.id).first();
    displayName=other?.display_name||'Private chat';
  }
  return ok({conversation:{id:conversation.id,kind:conversation.kind,name:displayName,topic:conversation.topic,visibility:conversation.visibility,memberCount:Number((await context.env.DB.prepare('SELECT COUNT(*) AS count FROM social_members WHERE conversation_id=?').bind(id).first())?.count||0),joined:Boolean(member)},
    messages:ordered.map(row=>{
      let payload=row.deleted_at?null:parsePayload(row.payload_json);
      if(row.type==='poll'&&payload?.options){
        const counts=pollVoteMap.get(row.id)||new Map();
        payload={...payload,options:payload.options.map((option,index)=>({...option,votes:Number(counts.get(index)||0)}))};
      }
      return {id:row.id,type:row.type,payload,deleted:Boolean(row.deleted_at),mine:row.sender_user_id===user.id,
        sender:conversation.kind==='anonymous'?anonymousAlias(id,row.sender_user_id):row.display_name,at:row.created_at,editedAt:row.edited_at||null,reactions:reactionMap.get(row.id)||{}};
    })});
}

async function listMembers(context,user,conversationId){
  const id=requireUuid(conversationId);
  const conversation=await conversationRow(context.env.DB,id);
  if(!conversation)throw new HttpError(404,'CONVERSATION_NOT_FOUND','Conversation was not found.');
  if(conversation.kind==='anonymous')throw new HttpError(403,'ANONYMOUS_MEMBERS_HIDDEN','Anonymous room identities are private.');
  const member=await memberRow(context.env.DB,user.id,id);
  if(!member)throw new HttpError(403,'CONVERSATION_ACCESS_DENIED','Join this conversation before viewing members.');
  const rows=await context.env.DB.prepare(`SELECT u.display_name,m.role,m.joined_at FROM social_members m JOIN users u ON u.id=m.user_id WHERE m.conversation_id=? ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,u.display_name`).bind(id).all();
  return ok({members:rows.results.map(row=>({name:row.display_name,role:row.role,joinedAt:row.joined_at}))});
}

function validateMessage(input){
  const type=String(input.type||'text');
  if(type==='text'){
    const text=cleanText(input.text,5000,{required:true});
    return {type,payload:{text}};
  }
  if(type==='poll'){
    const question=cleanText(input.question,180,{required:true});
    const options=Array.isArray(input.options)?input.options.map(value=>cleanText(value,120,{required:true})).filter(Boolean).slice(0,8):[];
    if(options.length<2)throw new HttpError(400,'INVALID_POLL','A poll needs at least two options.');
    return {type,payload:{question,options:options.map(text=>({text,votes:0}))}};
  }
  throw new HttpError(400,'UNSUPPORTED_MESSAGE_TYPE','Only text messages and polls are currently supported.');
}
async function sendMessage(context,user,conversationId){
  const id=requireUuid(conversationId);
  await requireWritable(context.env.DB,user.id,id);
  await rateLimit(context.env.DB,user.id,'social_messages',3600000,120);
  const input=await readJson(context.request,32768),message=validateMessage(input),messageId=crypto.randomUUID(),at=Date.now();
  await context.env.DB.batch([
    context.env.DB.prepare('INSERT INTO social_messages (id,conversation_id,sender_user_id,type,payload_json,created_at) VALUES (?,?,?,?,?,?)').bind(messageId,id,user.id,message.type,JSON.stringify(message.payload),at),
    context.env.DB.prepare('UPDATE social_conversations SET updated_at=? WHERE id=?').bind(at,id),
    context.env.DB.prepare('UPDATE social_members SET last_read_at=? WHERE conversation_id=? AND user_id=?').bind(at,id,user.id)
  ]);
  return ok({message:{id:messageId,type:message.type,payload:message.payload,mine:true,at,reactions:{}}},201);
}

async function reactMessage(context,user,conversationId,messageId){
  const cid=requireUuid(conversationId),mid=requireUuid(messageId);
  await requireWritable(context.env.DB,user.id,cid);
  const belongs=await context.env.DB.prepare('SELECT id FROM social_messages WHERE id=? AND conversation_id=?').bind(mid,cid).first();
  if(!belongs)throw new HttpError(404,'MESSAGE_NOT_FOUND','Message was not found.');
  const input=await readJson(context.request,2048),emoji=cleanText(input.emoji,16,{required:true});
  const existing=await context.env.DB.prepare('SELECT 1 AS found FROM social_reactions WHERE message_id=? AND user_id=? AND emoji=?').bind(mid,user.id,emoji).first();
  if(existing)await context.env.DB.prepare('DELETE FROM social_reactions WHERE message_id=? AND user_id=? AND emoji=?').bind(mid,user.id,emoji).run();
  else await context.env.DB.prepare('INSERT INTO social_reactions (message_id,user_id,emoji,created_at) VALUES (?,?,?,?)').bind(mid,user.id,emoji,Date.now()).run();
  return ok({active:!existing});
}

async function votePoll(context,user,conversationId,messageId){
  const cid=requireUuid(conversationId),mid=requireUuid(messageId);
  await requireWritable(context.env.DB,user.id,cid);
  const row=await context.env.DB.prepare("SELECT type,payload_json FROM social_messages WHERE id=? AND conversation_id=? AND deleted_at IS NULL").bind(mid,cid).first();
  if(!row||row.type!=='poll')throw new HttpError(404,'POLL_NOT_FOUND','Poll was not found.');
  const payload=parsePayload(row.payload_json),input=await readJson(context.request,2048),index=Number(input.optionIndex);
  if(!Number.isSafeInteger(index)||index<0||index>=Math.min(Array.isArray(payload.options)?payload.options.length:0,8))throw new HttpError(400,'INVALID_POLL_OPTION','Poll option is invalid.');
  await context.env.DB.prepare(`INSERT INTO social_poll_votes (message_id,user_id,option_index,created_at) VALUES (?,?,?,?)
    ON CONFLICT(message_id,user_id) DO UPDATE SET option_index=excluded.option_index,created_at=excluded.created_at`).bind(mid,user.id,index,Date.now()).run();
  return ok({voted:true,optionIndex:index});
}

async function listPosts(context,user){
  const url=new URL(context.request.url),type=String(url.searchParams.get('type')||''),q=cleanText(url.searchParams.get('q')||'',120);
  const clauses=[],values=[];
  if(POST_TYPES.has(type)){clauses.push('p.type=?');values.push(type);}
  if(q){clauses.push('(lower(p.title) LIKE lower(?) OR lower(p.excerpt) LIKE lower(?) OR lower(u.display_name) LIKE lower(?))');values.push(`%${q}%`,`%${q}%`,`%${q}%`);}
  const where=clauses.length?'WHERE '+clauses.join(' AND '):'';
  const rows=await context.env.DB.prepare(`SELECT p.*,u.display_name,
    EXISTS(SELECT 1 FROM social_post_saves s WHERE s.post_id=p.id AND s.user_id=?) AS saved
    FROM social_posts p JOIN users u ON u.id=p.user_id ${where} ORDER BY p.created_at DESC LIMIT 100`).bind(user.id,...values).all();
  return ok({posts:rows.results.map(row=>({id:row.id,type:row.type,title:row.title,excerpt:row.excerpt,tags:parsePayload(row.tags_json),author:row.display_name,at:row.created_at,saved:Boolean(row.saved),mine:row.user_id===user.id}))});
}
async function createPost(context,user){
  const input=await readJson(context.request,32768),type=POST_TYPES.has(String(input.type))?String(input.type):'blog';
  if(type==='announcement'&&!user.isAdmin)throw new HttpError(403,'ADMIN_REQUIRED','Only administrators can publish announcements.');
  const title=cleanText(input.title,140,{required:true}),excerpt=cleanText(input.excerpt,2000,{required:true});
  const tags=Array.isArray(input.tags)?input.tags.map(tag=>cleanText(tag,40)).filter(Boolean).slice(0,8):[];
  const since=Date.now()-86400000;
  const recent=await context.env.DB.prepare('SELECT COUNT(*) AS count FROM social_posts WHERE user_id=? AND created_at>?').bind(user.id,since).first();
  if(Number(recent?.count||0)>=20)throw new HttpError(429,'SOCIAL_RATE_LIMITED','Daily post limit reached.');
  const id=crypto.randomUUID(),at=Date.now();
  await context.env.DB.prepare('INSERT INTO social_posts (id,user_id,type,title,excerpt,tags_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,user.id,type,title,excerpt,JSON.stringify(tags),at,at).run();
  return ok({post:{id,type,title,excerpt,tags,author:user.displayName||user.display_name||'You',at,saved:false,mine:true}},201);
}
async function toggleSavePost(context,user,postId){
  const id=requireUuid(postId),post=await context.env.DB.prepare('SELECT id FROM social_posts WHERE id=?').bind(id).first();
  if(!post)throw new HttpError(404,'POST_NOT_FOUND','Post was not found.');
  const existing=await context.env.DB.prepare('SELECT 1 AS found FROM social_post_saves WHERE post_id=? AND user_id=?').bind(id,user.id).first();
  if(existing)await context.env.DB.prepare('DELETE FROM social_post_saves WHERE post_id=? AND user_id=?').bind(id,user.id).run();
  else await context.env.DB.prepare('INSERT INTO social_post_saves (post_id,user_id,created_at) VALUES (?,?,?)').bind(id,user.id,Date.now()).run();
  return ok({saved:!existing});
}

export async function dispatchSocialRoute(context,method,path,user){
  if(!path.startsWith('social/'))return null;
  await ensureSocialSchema(context.env.DB);
  if(method==='GET'&&path==='social/people')return people(context,user);
  if(method==='GET'&&path==='social/conversations')return listConversations(context,user);
  if(method==='POST'&&path==='social/conversations')return createConversation(context,user);
  if(method==='GET'&&path==='social/posts')return listPosts(context,user);
  if(method==='POST'&&path==='social/posts')return createPost(context,user);
  let match=path.match(/^social\/conversations\/([0-9a-f-]{36})(?:\/(join|messages))?$/i);
  if(match&&method==='POST'&&match[2]==='join')return joinConversation(context,user,match[1]);
  if(match&&method==='PATCH'&&!match[2])return patchConversation(context,user,match[1]);
  if(match&&method==='GET'&&match[2]==='messages')return listMessages(context,user,match[1]);
  if(match&&method==='POST'&&match[2]==='messages')return sendMessage(context,user,match[1]);
  match=path.match(/^social\/conversations\/([0-9a-f-]{36})\/members$/i);
  if(match&&method==='GET')return listMembers(context,user,match[1]);
  match=path.match(/^social\/conversations\/([0-9a-f-]{36})\/messages\/([0-9a-f-]{36})\/reactions$/i);
  if(match&&method==='POST')return reactMessage(context,user,match[1],match[2]);
  match=path.match(/^social\/conversations\/([0-9a-f-]{36})\/messages\/([0-9a-f-]{36})\/poll$/i);
  if(match&&method==='POST')return votePoll(context,user,match[1],match[2]);
  match=path.match(/^social\/posts\/([0-9a-f-]{36})\/save$/i);
  if(match&&method==='POST')return toggleSavePost(context,user,match[1]);
  throw new HttpError(404,'NOT_FOUND','Social API route was not found.');
}
