const assert = require('node:assert/strict');
const fs = require('node:fs');

const ui = fs.readFileSync('dafaa-ui.js', 'utf8');
const client = fs.readFileSync('dafaa-create-v2-client.js', 'utf8');
const legacyRoute = fs.readFileSync('functions/api/v1/dafat.js', 'utf8');
const v2Route = fs.readFileSync('functions/api/v1/dafat/create-v2.js', 'utf8');
const service = fs.readFileSync('functions/_lib/dafaa-create-v2.mjs', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.match(ui, /id="dafaa-create-v2"/, 'the old creator must be replaced by the v2 form');
assert.match(ui, /\/dafat\/create-v2/, 'the new form must submit only to the v2 endpoint');
assert.doesNotMatch(ui, /id="dafaa-form"/, 'the legacy create form must not remain active');
assert.match(ui, /visibility\.addEventListener\('change',sync\)/, 'private access fields must react to visibility');
assert.match(ui, /pricing\.addEventListener\('change',sync\)/, 'price fields must react to pricing mode');
assert.match(ui, /access\.disabled=!privateMode/, 'inactive private access input must be disabled so native validation cannot block public creation');
assert.match(ui, /price\.disabled=!paid/, 'inactive paid price input must be disabled so min validation cannot block free creation');
assert.match(index, /dafaa-ui\.js\?v=20260917-create3/, 'the submit validation fix must be cache-busted');
assert.match(index, /dafaa-ui\.css\?v=20260917-create2/, 'the new creator styles must be cache-busted');
assert.match(index, /dafaa-context\.js[^\n]*\n\s*<script src="dafaa-create-v2-client\.js\?v=20260917-create2"/, 'the v2 client must override creation immediately after the base Dafaa context');

assert.match(client, /DafitiiDafat\.createDafaa\s*=\s*async/, 'all runtime creation calls must be canonicalized on the v2 client');
assert.match(client, /\/dafat\/create-v2/, 'the canonical create method must use the v2 endpoint');
assert.doesNotMatch(client, /request\('\/dafat'\s*,\s*\{\s*method:\s*'POST'/, 'the canonical client must never call legacy POST /dafat');
assert.match(legacyRoute, /DAFAA_CREATE_MOVED/, 'legacy POST /dafat creation must be retired');
assert.match(v2Route, /createDafaaV2/, 'the v2 route must use the isolated creation service');
assert.match(v2Route, /method !== 'POST'/, 'the v2 creation endpoint must reject non-POST methods');
assert.match(service, /ensureDafaaCreateV2Schema/, 'v2 creation needs an independent schema guard');
assert.match(service, /foreignKeyTarget\(db, 'dafaa_memberships', 'dafaa_id'\)/, 'v2 creation must verify the membership foreign key');
assert.match(service, /await db\.batch\(\[insertDafaa, insertOwner\]\)/, 'Dafaa and owner membership must commit atomically');
assert.match(service, /currentActor\.studentStage !== 'university'/, 'school accounts must not create Dafat');
assert.match(service, /apiVersion: 2/, 'the response must identify the new creation contract');

console.log('dafaa create v2 tests passed');
