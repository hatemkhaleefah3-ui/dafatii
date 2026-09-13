PRAGMA foreign_keys = ON;

CREATE TABLE account_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL DEFAULT 'student' CHECK (account_type IN ('student', 'representer')),
  student_stage TEXT NOT NULL DEFAULT 'university' CHECK (student_stage IN ('school', 'university', 'independent')),
  platform_role TEXT NOT NULL DEFAULT 'student' CHECK (platform_role IN ('student', 'admin')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX account_profiles_type_idx ON account_profiles(account_type, platform_role);

CREATE TABLE courses (
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
CREATE INDEX courses_owner_status_idx ON courses(owner_user_id, status, updated_at DESC);
CREATE INDEX courses_discovery_idx ON courses(status, visibility, stage, updated_at DESC);

CREATE TABLE course_memberships (
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
);
CREATE INDEX course_memberships_user_idx ON course_memberships(user_id, status, updated_at DESC);
CREATE INDEX course_memberships_course_idx ON course_memberships(course_id, status, role, updated_at DESC);

CREATE TABLE course_content_records (
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
);
CREATE INDEX course_content_updated_idx ON course_content_records(course_id, updated_at DESC);

CREATE TABLE course_content_mutations (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mutation_id TEXT NOT NULL,
  record_key TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (course_id, user_id, mutation_id)
);
CREATE INDEX course_content_mutations_created_idx ON course_content_mutations(created_at);

CREATE TABLE course_audit_log (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_user_id TEXT REFERENCES users(id),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX course_audit_course_idx ON course_audit_log(course_id, created_at DESC);
CREATE INDEX course_audit_actor_idx ON course_audit_log(actor_user_id, created_at DESC);

ALTER TABLE files ADD COLUMN course_id TEXT REFERENCES courses(id) DEFAULT NULL;
CREATE INDEX files_course_status_idx ON files(course_id, status, created_at DESC);

PRAGMA optimize;
