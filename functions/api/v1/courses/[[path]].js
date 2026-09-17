import { dispatchCourseWithEducationGate } from '../../../_lib/course-gate.mjs';
import { assertSameOrigin, fail } from '../../../_lib/http.mjs';

const joinedPath = value => Array.isArray(value) ? value.join('/') : String(value || '');
const coursePath = value => {
  const child = joinedPath(value).replace(/^\/+|\/+$/g, '');
  return child ? `courses/${child}` : 'courses';
};

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    return await dispatchCourseWithEducationGate(context, coursePath(context.params?.path));
  } catch (error) {
    return fail(error);
  }
}
