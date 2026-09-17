import { clearAuthRateLimit, enforceAuthRateLimit, requireUser } from '../../../_lib/auth.mjs';
import { assertSameOrigin, fail, HttpError, logEvent, ok, readJson } from '../../../_lib/http.mjs';
import { revealStudentPin } from '../../../_lib/student-pin-secret.mjs';

export async function onRequest(context) {
  try {
    if (!context.env.DB) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database binding is unavailable.');
    if (context.request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use POST for this endpoint.');
    assertSameOrigin(context.request, context.env);
    const user = await requireUser(context);
    const input = await readJson(context.request, 4096);
    const fingerprint = await enforceAuthRateLimit(context.env.DB, context.request, `pin:reveal:${user.id}`, context.env);
    try {
      const result = await revealStudentPin(context.env.DB, user.id, input.password, context.env);
      await clearAuthRateLimit(context.env.DB, fingerprint);
      logEvent('info', 'auth.pin_revealed', { userId:user.id, rotated:result.rotated });
      return ok(result);
    } catch (error) {
      logEvent('warn', 'auth.pin_reveal_failed', { userId:user.id, code:error.code });
      throw error;
    }
  } catch (error) {
    if (!error.status) logEvent('error', 'auth.pin_reveal_unhandled', { name:error.name });
    return fail(error);
  }
}
