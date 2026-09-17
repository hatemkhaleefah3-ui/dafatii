import fs from 'node:fs';

const scriptPath = 'scripts/dafaa-domain-refactor.mjs';
let source = fs.readFileSync(scriptPath, 'utf8');

const badLine = /  const value = fs\.readFileSync\(file,'utf8'\)\.replace\(\/OpenCourseWare\/g,''\)\.replace\([^\n]+\);/;
if (!badLine.test(source)) throw new Error('Expected generated-test line was not found.');
source = source.replace(
  badLine,
  "  const value = fs.readFileSync(file,'utf8').replace(/OpenCourseWare/g,'').replace(/https?:[/][/][^\\\\s]+/g,'');"
);
fs.writeFileSync(scriptPath, source);

await import(`./dafaa-domain-refactor.mjs?fixed=${Date.now()}`);
fs.rmSync('scripts/fix-and-run-dafaa-refactor.mjs', { force: true });
try { fs.rmdirSync('scripts'); } catch {}
