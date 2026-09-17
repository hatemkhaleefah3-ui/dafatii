import { dispatchCourseWithEducationGate } from '../../../_lib/course-gate.mjs';
import { assertSameOrigin, fail } from '../../../_lib/http.mjs';

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    return await dispatchCourseWithEducationGate(context, 'courses');
  } catch (error) {
    return fail(error);
  }
}
