PRAGMA foreign_keys = ON;

ALTER TABLE courses ADD COLUMN academic_level TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN academic_stage TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN academic_field TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN learning_field TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN difficulty_level TEXT NOT NULL DEFAULT 'beginner';

CREATE INDEX IF NOT EXISTS courses_learning_discovery_idx
  ON courses(status, visibility, learning_field, difficulty_level, updated_at DESC);
CREATE INDEX IF NOT EXISTS courses_academic_match_idx
  ON courses(status, academic_level, academic_stage, academic_field, updated_at DESC);

PRAGMA optimize;
