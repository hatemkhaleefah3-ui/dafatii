import { dispatchDafaaWithEducationGate } from '../../_lib/dafaa-gate.mjs';
import { assertSameOrigin, fail, HttpError, logEvent } from '../../_lib/http.mjs';

function classifyDatabaseFailure(error) {
  const message = String(error?.message || '');
  if (/foreign key constraint failed/i.test(message)) return 'FOREIGN_KEY';
  if (/unique constraint failed/i.test(message)) return 'UNIQUE';
  if (/not null constraint failed/i.test(message)) return 'NOT_NULL';
  if (/check constraint failed/i.test(message)) return 'CHECK';
  if (/no such table/i.test(message)) return 'MISSING_TABLE';
  if (/no such column|has no column named/i.test(message)) return 'MISSING_COLUMN';
  if (/database is locked|database busy|sqlite_busy/i.test(message)) return 'BUSY';
  return 'UNKNOWN';
}

export async function onRequest(context) {
  try {
    assertSameOrigin(context.request, context.env);
    if (context.request.method === 'POST') {
      throw new HttpError(410, 'DAFAA_CREATE_MOVED', 'Dafaa creation moved to the new create-v2 endpoint. Refresh the app and try again.');
    }
    return await dispatchDafaaWithEducationGate(context, 'dafat');
  } catch (error) {
    if (error.status) return fail(error);

    const phase = String(error?.dafaaPhase || 'UNCLASSIFIED');
    const category = classifyDatabaseFailure(error);
    logEvent('error', 'dafat.unhandled', { name:error?.name || 'Error', phase, category });
    return fail(error);
  }
}