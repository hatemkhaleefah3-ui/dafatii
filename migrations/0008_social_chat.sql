PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS social_conversations (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('private','group','anonymous')),
  name TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS social_members (
  conversation_id TEXT NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at INTEGER NOT NULL,
  last_read_at INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),
  muted INTEGER NOT NULL DEFAULT 0 CHECK (muted IN (0,1)),
  PRIMARY KEY (conversation_id,user_id)
);

CREATE TABLE IF NOT EXISTS social_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text','poll')),
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  edited_at INTEGER,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS social_reactions (
  message_id TEXT NOT NULL REFERENCES social_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (message_id,user_id,emoji)
);

CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('announcement','blog','event')),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS social_post_saves (
  post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id,user_id)
);

CREATE INDEX IF NOT EXISTS social_members_user_idx ON social_members(user_id, archived, joined_at DESC);
CREATE INDEX IF NOT EXISTS social_conversations_kind_idx ON social_conversations(kind, visibility, updated_at DESC);
CREATE INDEX IF NOT EXISTS social_messages_conversation_idx ON social_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS social_posts_created_idx ON social_posts(created_at DESC);
