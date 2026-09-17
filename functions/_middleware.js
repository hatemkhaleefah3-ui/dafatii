import { ensurePreDafaaCourseSchema } from './_lib/course-schema-restore.mjs';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  if ((pathname === '/api/v1' || pathname.startsWith('/api/v1/')) && context.env?.DB) {
    try {
      await ensurePreDafaaCourseSchema(context.env.DB);
    } catch (error) {
      if (url.searchParams.get('__rollback_diag') === '1') {
        return new Response(JSON.stringify({
          error: 'COURSE_SCHEMA_RESTORE_FAILED',
          name: String(error?.name || 'Error').slice(0, 64),
          message: String(error?.message || 'Unknown restore error').slice(0, 180)
        }), { status:503, headers:{ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' } });
      }
      throw error;
    }
  }
  return context.next();
}
