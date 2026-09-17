import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
globalThis.crypto ||= webcrypto;
const { assertContentPermissions, fullPermissions, noPermissions, permissionInput, requiredContentPermissions, validateDafaaInput, validateMemberPatch, validateProfileInput } = await import('../functions/_lib/dafat.mjs');

assert.deepEqual(validateProfileInput({accountType:'representer',studentStage:'school'}),{accountType:'representer',studentStage:'school'});
assert.throws(()=>validateProfileInput({accountType:'admin'}),error=>error.code==='INVALID_INPUT');
assert.equal(validateDafaaInput({name:'Biology',pricing:'paid',priceMinor:1250,visibility:'public',joinPolicy:'approval'}).priceMinor,1250);
assert.throws(()=>validateDafaaInput({name:'X'}),error=>error.code==='INVALID_DAFAA_NAME');
assert.deepEqual([...requiredContentPermissions(undefined,[{id:'a'}])],['can_add_content']);
assert.deepEqual([...requiredContentPermissions([{id:'a',name:'A'}],[{id:'a',name:'B'},{id:'b'}])].sort(),['can_add_content','can_edit_content']);
assert.deepEqual([...requiredContentPermissions([{id:'a'}],[])],['can_remove_content']);
const row={membership_status:'active',membership_role:'representer',...noPermissions(),can_add_content:1};
assert.doesNotThrow(()=>assertContentPermissions(row,{isAdmin:false},new Set(['can_add_content'])));
assert.throws(()=>assertContentPermissions(row,{isAdmin:false},new Set(['can_remove_content'])),error=>error.status===403);
assert.equal(Object.values(fullPermissions()).every(Boolean),true);
assert.equal(permissionInput({can_manage_students:true}).can_manage_students,1);
assert.equal(validateMemberPatch({role:'representer',status:'active'}).role,'representer');

const migration=readFileSync(new URL('../migrations/0006_dafaa_domain.sql',import.meta.url),'utf8');
assert.match(migration,/ALTER TABLE course_memberships RENAME TO dafaa_memberships/);
assert.match(readFileSync(new URL('../functions/_lib/dafat.mjs',import.meta.url),'utf8'),/can_manage_representers/);
assert.match(migration,/ALTER TABLE files RENAME COLUMN course_id TO dafaa_id/);
const routes=readFileSync(new URL('../functions/_lib/dafaa-routes.mjs',import.meta.url),'utf8');
assert.match(routes,/requirePermission/);
assert.match(routes,/assertContentPermissions/);
assert.match(routes,/SELF_LOCKOUT_REJECTED/);
console.log('dafaa RBAC tests passed');
