PRAGMA foreign_keys = ON;

-- School students keep their prepared seven-subject teacher course, but may also enroll in ordinary Dafatii Courses.
DROP TRIGGER IF EXISTS block_school_student_course_insert;
DROP TRIGGER IF EXISTS block_school_student_course_update;

PRAGMA optimize;
