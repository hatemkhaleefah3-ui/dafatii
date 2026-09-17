import { requireUser } from './auth.mjs';
import { actorFor, publicActor } from './courses.mjs';
import { dispatchCourseRoute } from './course-routes.mjs';
import { HttpError, ok } from './http.mjs';
import { ensureSchoolTeacherSchema } from './school-teachers.mjs';

export async function dispatchCourseWithEducationGate(context, path) {
  if (!context.env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');
  await ensureSchoolTeacherSchema(context.env.DB);
  const currentActor = await actorFor(context.env.DB, await requireUser(context), context.env);
  const method = context.request.method;
  const schoolStudent = currentActor.accountType === 'student' && currentActor.studentStage === 'school';

  if (schoolStudent) {
    if (method === 'GET' && path === 'courses') return ok({ actor:publicActor(currentActor), courses:[], mode:'school-teachers' });
    throw new HttpError(403, 'SCHOOL_COURSES_DISABLED', 'School students choose teachers by subject instead of enrolling in courses.');
  }

  if ((method === 'POST' && path === 'courses') || (method === 'PATCH' && /^courses\/[0-9a-f-]{36}$/i.test(path))) {
    const input = await context.request.clone().json().catch(() => ({}));
    if (input?.stage === 'school') throw new HttpError(400, 'SCHOOL_COURSES_DISABLED', 'School education uses the teacher-selection system. Courses are for post-school education.');
  }

  const response = await dispatchCourseRoute(context, method, path);
  if (!response) throw new HttpError(404, 'NOT_FOUND', 'Course route was not found.');
  return response;
}
