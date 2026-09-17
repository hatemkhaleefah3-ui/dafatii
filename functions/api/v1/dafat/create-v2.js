import { createDafaaV2 } from '../../../_lib/dafaa-create-v2.mjs';
import { assertSameOrigin, fail, HttpError, logEvent } from '../../../_lib/http.mjs';

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    if (context.request.method !== 'POST') {
      throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'This endpoint only accepts POST requests.');
    }
    return await createDafaaV2(context);
  } catch (error) {
    if (!error?.status) {
      logEvent('error', 'dafaa.create_v2_unhandled', { name: error?.name || 'Error' });
    }
    return fail(error);
  }
}
