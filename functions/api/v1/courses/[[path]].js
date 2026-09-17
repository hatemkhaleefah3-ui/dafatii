import { dispatchCourseWithEducationGate } from '../../../_lib/course-gate.mjs';
import { assertSameOrigin, fail } from '../../../_lib/http.mjs';

const joinedPath = value => Array.isArray(value) ? value.join('/') : String(value || '');

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    return await dispatchCourseWithEducationGate(context, `courses/${joinedPath(context.params?.path)}`);
  } catch (error) {
    return fail(error);
  }
}
