import { ensurePreDafaaCourseSchema } from './_lib/course-schema-restore.mjs';

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;
  if ((pathname === '/api/v1' || pathname.startsWith('/api/v1/')) && context.env?.DB) {
    await ensurePreDafaaCourseSchema(context.env.DB);
  }
  return context.next();
}
