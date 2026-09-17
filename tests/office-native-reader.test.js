const assert = require('node:assert/strict');
const fs = require('node:fs');

const client = fs.readFileSync('file-client.js', 'utf8');
const viewer = fs.readFileSync('office-viewer.js', 'utf8');
const headers = fs.readFileSync('_headers', 'utf8');

for (const mime of [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]) {
  assert.match(viewer, new RegExp(mime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${mime} must be handled by the native Office reader`);
}

assert.match(client, /DafatiiOffice\?\.types\.includes\(contentType\)/, 'Office formats must route to DafatiiOffice');
assert.doesNotMatch(client, /getViewUrl\(fileId,\s*\{\s*preview:\s*true\s*\}\)/, 'Office files must not request converted previews');
assert.doesNotMatch(client, /contentType:\s*['"]application\/pdf['"]/, 'Office files must not be relabeled as PDF');
assert.match(viewer, /getViewUrl\(fileId\)/, 'the native reader must fetch the original file URL');
assert.match(viewer, /new File\(\[buffer\],\s*title/, 'the native reader must pass the original bytes to the browser renderer');
assert.match(viewer, /@file-viewer\/web-full@\$\{RUNTIME_VERSION\}/, 'the browser-native Office runtime must be version-pinned');
assert.match(headers, /script-src[^\n]*'wasm-unsafe-eval'[^\n]*https:\/\/cdn\.jsdelivr\.net/, 'CSP must allow the native PPT WASM runtime');
assert.match(headers, /connect-src[^\n]*https:\/\/cdn\.jsdelivr\.net/, 'CSP must allow lazy native reader assets');

console.log('office native reader boundary checks passed');
