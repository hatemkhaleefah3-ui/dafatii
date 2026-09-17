import fs from 'node:fs';

const replaceOnce = (path, before, after) => {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(before)) throw new Error(`Expected source not found in ${path}`);
  fs.writeFileSync(path, source.replace(before, after));
};

replaceOnce(
  'functions/_lib/dafaa-schema.mjs',
  `  await db.prepare("UPDATE records SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();\n  await db.prepare("UPDATE record_mutations SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();`,
  `  // A user can legitimately have both the old and new catalog records after a\n  // mixed-version deployment. Updating the legacy key directly would violate\n  // records(user_id, record_key)'s primary key and make every Dafaa request fail.\n  // Prefer the already-canonical record, remove only the duplicate legacy row,\n  // then rename any remaining legacy rows. This sequence is idempotent.\n  await db.prepare(\`DELETE FROM records AS legacy\n    WHERE legacy.record_key = 'dafatii:courses:v1'\n      AND EXISTS (SELECT 1 FROM records AS canonical\n        WHERE canonical.user_id = legacy.user_id\n          AND canonical.record_key = 'dafatii:dafat:v1')\`).run();\n  await db.prepare("UPDATE records SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();\n  await db.prepare("UPDATE record_mutations SET record_key = 'dafatii:dafat:v1' WHERE record_key = 'dafatii:courses:v1'").run();`
);

replaceOnce(
  'tests/dafaa-domain.test.js',
  `assert.ok(schema.includes('ALTER TABLE files ADD COLUMN dafaa_id'), 'files must gain dafaa_id when the legacy course_id column never existed');\n`,
  `assert.ok(schema.includes('ALTER TABLE files ADD COLUMN dafaa_id'), 'files must gain dafaa_id when the legacy course_id column never existed');\nassert.ok(schema.includes('DELETE FROM records AS legacy') && schema.indexOf('DELETE FROM records AS legacy') < schema.indexOf("UPDATE records SET record_key = 'dafatii:dafat:v1'"), 'duplicate legacy catalog rows must be removed before renaming the legacy key');\n`
);
