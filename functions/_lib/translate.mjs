import { HttpError } from './http.mjs';

export function validateTranslationInput(input) {
  const texts = Array.isArray(input?.texts) ? input.texts.map(value => String(value || '').trim()) : [];
  if (!texts.length || texts.length > 40) throw new HttpError(400, 'INVALID_TRANSLATION_BATCH', 'Provide between 1 and 40 text items.');
  if (texts.some(text => !text || text.length > 2000)) throw new HttpError(400, 'INVALID_TRANSLATION_TEXT', 'Each translation item must contain 1 to 2,000 characters.');
  if (texts.reduce((sum, text) => sum + text.length, 0) > 12000) throw new HttpError(413, 'TRANSLATION_BATCH_TOO_LARGE', 'Translation batch exceeds 12,000 characters.');
  const source = input?.source === 'ar' ? 'ar' : 'en';
  const target = input?.target === 'en' ? 'en' : 'ar';
  if (source === target) return { texts, source, target };
  return { texts, source, target };
}

export async function translateInterfaceText(env, input) {
  const { texts, source, target } = validateTranslationInput(input);
  if (source === target) return texts;
  const key = String(env.GOOGLE_TRANSLATE_API_KEY || '').trim();
  if (!key) throw new HttpError(503, 'TRANSLATION_NOT_CONFIGURED', 'Google Cloud Translation is not configured.');
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ q: texts, source, target, format: 'text' })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new HttpError(502, 'TRANSLATION_FAILED', 'Google Cloud Translation rejected the request.');
  const translations = payload?.data?.translations;
  if (!Array.isArray(translations) || translations.length !== texts.length) throw new HttpError(502, 'TRANSLATION_FAILED', 'Google Cloud Translation returned an invalid response.');
  return translations.map(item => String(item.translatedText || ''));
}
