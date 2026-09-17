import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeCourseStudyType } from '../functions/_lib/course-study-types.mjs';

for (const value of ['chapters','systems','blocks','courses']) assert.equal(normalizeCourseStudyType(value),value);
assert.equal(normalizeCourseStudyType(undefined),'courses');
assert.throws(()=>normalizeCourseStudyType('semester'),error=>error.code==='INVALID_STUDY_TYPE'&&error.status===400);

const helper=readFileSync(new URL('../functions/_lib/course-study-types.mjs',import.meta.url),'utf8');
const gate=readFileSync(new URL('../functions/_lib/course-gate.mjs',import.meta.url),'utf8');
assert.match(helper,/CREATE TABLE IF NOT EXISTS course_study_types/);
assert.match(helper,/ON CONFLICT\(course_id\) DO UPDATE SET study_type/);
assert.match(helper,/course\.studyType = await studyTypeFor/);
assert.match(gate,/ensureCourseStudyTypeSchema/);
assert.match(gate,/requestedStudyType = normalizeCourseStudyType/);
assert.match(gate,/setCourseStudyType/);
assert.match(gate,/attachCourseStudyTypes/);

console.log('course study type tests passed');
