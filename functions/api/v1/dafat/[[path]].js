import { dispatchDafaaWithEducationGate } from '../../../_lib/dafaa-gate.mjs';
import { assertSameOrigin, fail } from '../../../_lib/http.mjs';

const joinedPath = value => Array.isArray(value) ? value.join('/') : String(value || '');

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    return await dispatchDafaaWithEducationGate(context, `dafat/${joinedPath(context.params?.path)}`);
  } catch (error) {
    return fail(error);
  }
}
