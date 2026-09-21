-- Fully reset the retired language-learning content system.
-- The new language system will be introduced separately from a blank state.
DELETE FROM course_content_mutations
WHERE record_key = 'dafatii:language-content:v1';

DELETE FROM course_content_records
WHERE record_key = 'dafatii:language-content:v1';
