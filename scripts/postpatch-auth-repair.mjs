import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);

let dafat = read('functions/_lib/dafat.mjs');
if (!dafat.includes("import { LEGACY_DAFAT_RECORD_KEY } from './dafaa-schema.mjs';")) {
  dafat = dafat.replace("import { sha256 } from './crypto.mjs';\n", "import { LEGACY_DAFAT_RECORD_KEY } from './dafaa-schema.mjs';\nimport { sha256 } from './crypto.mjs';\n");
}
dafat = dafat.replace(
  "record_key IN ('dafatii:dafat:v1', 'dafatii:courses:v1') AND deleted = 0 LIMIT 1\").bind(user.id).first();",
  "record_key IN ('dafatii:dafat:v1', ?) AND deleted = 0 LIMIT 1\").bind(user.id, LEGACY_DAFAT_RECORD_KEY).first();"
);
write('functions/_lib/dafat.mjs', dafat);

let schema = read('functions/_lib/dafaa-schema.mjs');
if (!schema.includes('LEGACY_DAFAT_RECORD_KEY')) {
  schema = schema.replace(
    "import { HttpError } from './http.mjs';\n",
    "import { HttpError } from './http.mjs';\n\nexport const LEGACY_DAFAT_RECORD_KEY = 'dafatii:courses:v1';\n"
  );
}
write('functions/_lib/dafaa-schema.mjs', schema);

try { fs.rmSync('scripts/postpatch-auth-repair.mjs', { force:true }); } catch {}
try { fs.rmdirSync('scripts'); } catch {}
