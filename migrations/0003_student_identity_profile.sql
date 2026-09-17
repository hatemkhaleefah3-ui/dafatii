PRAGMA foreign_keys = ON;

CREATE TABLE student_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone_normalized TEXT,
  student_id TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'prefer_not')),
  academic_level TEXT NOT NULL CHECK (academic_level IN ('primary', 'middle', 'preparatory', 'institute', 'college', 'postgraduate')),
  academic_stage TEXT NOT NULL,
  academic_field TEXT,
  institution_name TEXT,
  university_name TEXT,
  college_name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX student_accounts_phone_unique_idx
  ON student_accounts(phone_normalized)
  WHERE phone_normalized IS NOT NULL;
CREATE INDEX student_accounts_level_idx ON student_accounts(academic_level, academic_stage);

PRAGMA optimize;
