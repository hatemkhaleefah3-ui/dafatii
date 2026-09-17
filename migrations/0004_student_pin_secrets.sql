PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_pin_secrets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sealed_pin TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

PRAGMA optimize;
