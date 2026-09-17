import { dispatchCourseWithEducationGate } from '../../_lib/course-gate.mjs';
import { assertSameOrigin, fail, logEvent } from '../../_lib/http.mjs';

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    return await dispatchCourseWithEducationGate(context, 'courses');
  } catch (error) {
    if (!error.status) logEvent('error', 'courses.unhandled', { name:error.name });
    return fail(error);
  }
}
