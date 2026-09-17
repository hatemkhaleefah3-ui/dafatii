PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_credentials (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL UNIQUE CHECK (length(student_id) = 12),
  phone_normalized TEXT UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS student_credentials_phone_idx ON student_credentials(phone_normalized) WHERE phone_normalized IS NOT NULL;

PRAGMA optimize;
