PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'deleted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE auth_attempts (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX auth_attempts_window_idx ON auth_attempts(fingerprint, created_at);
CREATE INDEX auth_attempts_created_idx ON auth_attempts(created_at);

CREATE TABLE records (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  record_key TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('json', 'string')),
  value_json TEXT,
  deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
  revision INTEGER NOT NULL CHECK (revision > 0),
  last_mutation_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, record_key),
  CHECK ((deleted = 1 AND value_json IS NULL) OR (deleted = 0 AND value_json IS NOT NULL))
);
CREATE INDEX records_updated_idx ON records(user_id, updated_at);

CREATE TABLE record_mutations (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mutation_id TEXT NOT NULL,
  record_key TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, mutation_id)
);
CREATE INDEX record_mutations_created_idx ON record_mutations(created_at);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX files_owner_status_idx ON files(user_id, status, created_at DESC);
CREATE INDEX files_abandoned_idx ON files(status, upload_expires_at);
