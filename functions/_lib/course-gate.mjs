import { requireUser } from './auth.mjs';
import { actorFor } from './courses.mjs';
import { dispatchCourseRoute } from './course-routes.mjs';
import { attachCourseStudyTypes, ensureCourseStudyTypeSchema, normalizeCourseStudyType, setCourseStudyType } from './course-study-types.mjs';
import { HttpError, ok, readJson } from './http.mjs';
import { ensureSchoolTeacherSchema } from './school-teachers.mjs';

export async function dispatchCourseWithEducationGate(context, path) {
  if (!context.env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');
  await ensureSchoolTeacherSchema(context.env.DB);
  await ensureCourseStudyTypeSchema(context.env.DB);
  const currentActor = await actorFor(context.env.DB, await requireUser(context), context.env);
  const method = context.request.method;
  const createCourse = method === 'POST' && path === 'courses';
  const updateCourse = method === 'PATCH' && /^courses\/[0-9a-f-]{36}$/i.test(path);
  let requestedStudyType = null;
  if (createCourse || updateCourse) {
    const input = await readJson(context.request.clone(), 65536);
    if (input?.stage === 'school') throw new HttpError(400, 'SCHOOL_COURSES_DISABLED', 'School education uses the teacher-selection system. Courses are for post-school education.');
    if (createCourse || Object.prototype.hasOwnProperty.call(input || {}, 'studyType')) requestedStudyType = normalizeCourseStudyType(input?.studyType, 'courses');
  }

  const response = await dispatchCourseRoute(context, method, path);
  if (!response) throw new HttpError(404, 'NOT_FOUND', 'Course route was not found.');

  if (requestedStudyType && response.status >= 200 && response.status < 300) {
    const payload = await response.clone().json().catch(() => null);
    const courseId = payload?.data?.course?.id || (updateCourse ? path.split('/')[1] : '');
    if (courseId) await setCourseStudyType(context.env.DB, courseId, requestedStudyType);
  }

  return attachCourseStudyTypes(context.env.DB, response);
}
