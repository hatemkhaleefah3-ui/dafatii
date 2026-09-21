import { HttpError } from './http.mjs';

export const VIDEO_UNDERSTANDING_RATINGS = Object.freeze(['bad','moderate','good','very good']);

export function validateVideoUnderstandingInput(input) {
  const videoUrl = String(input?.videoUrl || '').trim();
  let parsed;
  try { parsed = new URL(videoUrl); } catch { throw new HttpError(400, 'INVALID_YOUTUBE_URL', 'A valid public YouTube URL is required.'); }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const youtube = host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
  if (parsed.protocol !== 'https:' || !youtube) throw new HttpError(400, 'INVALID_YOUTUBE_URL', 'Only HTTPS YouTube video URLs are accepted.');
  if (host === 'youtu.be' && !parsed.pathname.replace(/^\//, '')) throw new HttpError(400, 'INVALID_YOUTUBE_URL', 'The YouTube video identifier is missing.');
  if ((host === 'youtube.com' || host === 'm.youtube.com') && !(
    (parsed.pathname === '/watch' && parsed.searchParams.get('v')) ||
    /^\/(?:shorts|live)\/[^/]+/.test(parsed.pathname)
  )) throw new HttpError(400, 'INVALID_YOUTUBE_URL', 'Use a direct YouTube video, Shorts, or Live URL.');

  const responseText = String(input?.responseText || '').trim();
  if (responseText.length < 3) throw new HttpError(400, 'VIDEO_RESPONSE_TOO_SHORT', 'Write what you understood before asking for evaluation.');
  if (responseText.length > 6000) throw new HttpError(413, 'VIDEO_RESPONSE_TOO_LONG', 'The understanding response must be 6,000 characters or fewer.');

  const level = String(input?.level || '').trim().toUpperCase();
  if (!['A1','A2','B1','B2','C1'].includes(level)) throw new HttpError(400, 'INVALID_LANGUAGE_LEVEL', 'Language level must be A1, A2, B1, B2, or C1.');
  const step = Number(input?.step), box = Number(input?.box);
  if (!Number.isSafeInteger(step) || step < 1 || step > 5) throw new HttpError(400, 'INVALID_LANGUAGE_STEP', 'Language step must be between 1 and 5.');
  if (!Number.isSafeInteger(box) || box < 1 || box > 25) throw new HttpError(400, 'INVALID_LANGUAGE_BOX', 'Language box must be between 1 and 25.');
  const targetLanguage = String(input?.targetLanguage || 'English').trim().slice(0, 40) || 'English';
  return { videoUrl, responseText, level, step, box, targetLanguage };
}

function interactionText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  const chunks = [];
  for (const step of Array.isArray(payload?.steps) ? payload.steps : []) {
    if (step?.type !== 'model_output') continue;
    for (const item of Array.isArray(step.content) ? step.content : []) {
      if (item?.type === 'text' && typeof item.text === 'string') chunks.push(item.text);
    }
  }
  return chunks.join('\n');
}

export async function gradeVideoUnderstanding(env, input) {
  const value = validateVideoUnderstandingInput(input);
  const key = String(env.GEMINI_API_KEY || '').trim();
  if (!key) throw new HttpError(503, 'GEMINI_NOT_CONFIGURED', 'Gemini video-understanding grading is not configured.');
  const model = String(env.GEMINI_MODEL || 'gemini-3.8-flash').trim() || 'gemini-3.8-flash';

  const rubric = `Grade a language learner's written statement of what they understood from the attached public YouTube video.

Course position: ${value.level}, Step ${value.step}, Box ${value.box}.
Target course language: ${value.targetLanguage}.
Learner response:
---
${value.responseText}
---

Judge ONLY video understanding: semantic accuracy, relevance to the actual video, and amount of correctly understood content appropriate to the learner's level. Do not grade spelling, grammar, accent, writing style, or vocabulary sophistication except when they make the meaning impossible to understand. Do not reward invented details.

Use exactly one rating:
- bad: not meaningfully about the video, mostly incorrect, invented, empty-equivalent, or shows no reliable understanding. NOT accepted.
- moderate: communicates the main topic or at least one meaningful correct idea from the video, even with language mistakes. Accepted.
- good: communicates the main idea plus multiple correct supporting details. Accepted.
- very good: accurate, substantial understanding with well-selected details, relationships, inference, or synthesis appropriate to the level. Accepted.

Return the structured rating only.`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-goog-api-key': key
    },
    body: JSON.stringify({
      model,
      input: [
        { type: 'video', uri: value.videoUrl },
        { type: 'text', text: rubric }
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: { rating: { type: 'string', enum: VIDEO_UNDERSTANDING_RATINGS } },
          required: ['rating'],
          additionalProperties: false
        }
      }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new HttpError(502, 'GEMINI_VIDEO_GRADING_FAILED', 'Gemini could not evaluate this YouTube response. Try again.');
  let parsed;
  try { parsed = JSON.parse(interactionText(payload)); } catch { throw new HttpError(502, 'GEMINI_VIDEO_GRADING_FAILED', 'Gemini returned an invalid grading response. Try again.'); }
  const rating = String(parsed?.rating || '').trim().toLowerCase();
  if (!VIDEO_UNDERSTANDING_RATINGS.includes(rating)) throw new HttpError(502, 'GEMINI_VIDEO_GRADING_FAILED', 'Gemini returned an unsupported grading value. Try again.');
  return { rating };
}
