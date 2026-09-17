import { dispatchDafaaWithEducationGate } from '../../_lib/dafaa-gate.mjs';
import { assertSameOrigin, fail, logEvent } from '../../_lib/http.mjs';

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    return await dispatchDafaaWithEducationGate(context, 'dafat');
  } catch (error) {
    if (!error.status) logEvent('error', 'dafat.unhandled', { name:error.name });
    return fail(error);
  }
}
