import { requireUser } from './auth.mjs';
import { ensureDafaaSchema } from './dafaa-schema.mjs';
import { actorFor, publicActor } from './dafat.mjs';
import { dispatchDafaaRoute } from './dafaa-routes.mjs';
import { HttpError, ok } from './http.mjs';
import { ensureSchoolTeacherSchema } from './school-teachers.mjs';

export async function dispatchDafaaWithEducationGate(context, path) {
  if (!context.env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');
  const user = await requireUser(context);
  const currentActor = await actorFor(context.env.DB, user, context.env);
  const method = context.request.method;
  const schoolStudent = currentActor.accountType === 'student' && currentActor.studentStage === 'school';

  if (schoolStudent) {
    await ensureSchoolTeacherSchema(context.env.DB);
    if (method === 'GET' && path === 'dafat') return ok({ actor:publicActor(currentActor), dafat:[], mode:'school-teachers' });
    throw new HttpError(403, 'SCHOOL_DAFAT_DISABLED', 'School students choose teachers by subject instead of enrolling in dafat.');
  }

  await ensureDafaaSchema(context.env.DB);
  await ensureSchoolTeacherSchema(context.env.DB);

  if ((method === 'POST' && path === 'dafat') || (method === 'PATCH' && /^dafat\/[0-9a-f-]{36}$/i.test(path))) {
    const input = await context.request.clone().json().catch(() => ({}));
    if (input?.stage === 'school') throw new HttpError(400, 'SCHOOL_DAFAT_DISABLED', 'School education uses the teacher-selection system. Dafat are for post-school education.');
  }

  const response = await dispatchDafaaRoute(context, method, path);
  if (!response) throw new HttpError(404, 'NOT_FOUND', 'Dafaa route was not found.');
  return response;
}
