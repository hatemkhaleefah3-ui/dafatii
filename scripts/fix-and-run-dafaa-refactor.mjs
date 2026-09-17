import fs from 'node:fs';

const scriptPath = 'scripts/dafaa-domain-refactor.mjs';
let source = fs.readFileSync(scriptPath, 'utf8');

const badValueLine = /  const value = fs\.readFileSync\(file,'utf8'\)\.replace\(\/OpenCourseWare\/g,''\)\.replace\([^\n]+\);/;
if (!badValueLine.test(source)) throw new Error('Expected generated-test value line was not found.');
source = source.replace(
  badValueLine,
  "  const value = fs.readFileSync(file,'utf8').replace(/OpenCourseWare/g,'').replace(/https?:[/][/][^\\\\s]+/g,'');"
);

const badAssertLine = /  assert\.ok\(!\/\\\\bcourse\(s\)\?\\\\b\/i\.test\(value\), `\$\{file\} still contains active Course\/Courses terminology`\);/;
if (!badAssertLine.test(source)) throw new Error('Expected generated-test assertion line was not found.');
source = source.replace(
  badAssertLine,
  "  assert.ok(!/\\\\bcourse(s)?\\\\b/i.test(value), file + ' still contains active Course/Courses terminology');"
);

fs.writeFileSync(scriptPath, source);
await import(`./dafaa-domain-refactor.mjs?fixed=${Date.now()}`);
fs.rmSync('scripts/fix-and-run-dafaa-refactor.mjs', { force: true });
try { fs.rmdirSync('scripts'); } catch {}
