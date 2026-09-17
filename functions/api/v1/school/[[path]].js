import { requireUser } from '../../../_lib/auth.mjs';
import { actorFor } from '../../../_lib/courses.mjs';
import { assertSameOrigin, fail, HttpError, ok, readJson } from '../../../_lib/http.mjs';
import { schoolTeacherCatalog, selectSchoolTeacher } from '../../../_lib/school-teachers.mjs';

const requireDb = env => { if (!env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.'); };
const routePath = request => new URL(request.url).pathname.replace(/^\/api\/v1\/school\/?/, '');

export async function onRequest(context) {
  try {
    requireDb(context.env);
    assertSameOrigin(context.request, context.env);
    const method = context.request.method;
    const path = routePath(context.request);
    const actor = await actorFor(context.env.DB, await requireUser(context), context.env);

    if (method === 'GET' && path === 'teachers') return ok(await schoolTeacherCatalog(context.env.DB, actor));

    const match = path.match(/^teachers\/(arabic|english|math|chemistry|physics|biology|islamic_book)$/);
    if (method === 'PUT' && match) {
      const input = await readJson(context.request, 8192);
      return ok(await selectSchoolTeacher(context.env.DB, actor, match[1], String(input.teacherId || '')));
    }

    throw new HttpError(404, 'NOT_FOUND', 'School teacher route was not found.');
  } catch (error) {
    return fail(error);
  }
}
