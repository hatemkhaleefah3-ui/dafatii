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
    return await dispatchDafaaWithEducationGate(context, 'dafat');
  } catch (error) {
    if (error.status) return fail(error);

    const phase = String(error?.dafaaPhase || 'UNCLASSIFIED');
    const category = classifyDatabaseFailure(error);
    logEvent('error', 'dafat.unhandled', { name:error?.name || 'Error', phase, category });

    if (context.request.method === 'POST') {
      const code = `DAFAA_${phase}_${category}`;
      const phaseLabel = phase.toLowerCase().replaceAll('_', ' ');
      const categoryLabel = category.toLowerCase().replaceAll('_', ' ');
      return fail(new HttpError(500, code, `Dafaa creation failed at ${phaseLabel} (${categoryLabel}).`, { phase, category }));
    }

    return fail(error);
  }
}
