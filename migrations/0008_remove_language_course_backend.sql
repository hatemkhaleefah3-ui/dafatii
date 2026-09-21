-- Remove persisted language-course authoring content after retiring the language backend.
DELETE FROM course_content_mutations
WHERE record_key = 'dafatii:language-authoring:v1';

DELETE FROM course_content_records
WHERE record_key = 'dafatii:language-authoring:v1';
