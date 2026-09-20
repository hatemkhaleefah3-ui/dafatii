import { hashPassword, randomToken, sha256 } from './crypto.mjs';
import { enforceAuthRateLimit, normalizeEmail, validateStrongPassword } from './auth.mjs';
import { HttpError, logEvent } from './http.mjs';

const RESET_LIFETIME_MS = 30 * 60 * 1000;
let schemaReady = false;

export async function ensurePasswordRecoverySchema(db) {
  if (schemaReady) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id, created_at DESC)').run();
  schemaReady = true;
}

function recoveryConfig(env = {}) {
  const apiKey = String(env.RESEND_API_KEY || '');
  const from = String(env.PASSWORD_RESET_FROM || '').trim();
  if (apiKey.length < 20 || !from.includes('@')) throw new HttpError(503, 'PASSWORD_RECOVERY_UNAVAILABLE', 'Password recovery is not configured yet.');
  return { apiKey, from };
}

function validEmail(value) {
  const email = normalizeEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function passwordPepper(env = {}) {
  const pepper = String(env.RATE_LIMIT_PEPPER || '');
  if (pepper.length < 32) throw new HttpError(503, 'CONFIGURATION_ERROR', 'Authentication configuration is unavailable.');
  return pepper;
}

async function sendResetEmail(config, email, link) {
  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ Authorization:`Bearer ${config.apiKey}`, 'Content-Type':'application/json' },
    body:JSON.stringify({
      from:config.from,
      to:[email],
      subject:'Reset your Dafatii password',
      text:`A password reset was requested for your Dafatii account. Open this link within 30 minutes:\n\n${link}\n\nIf you did not request this, ignore this email.`,
      html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h1 style="font-size:24px">Reset your Dafatii password</h1><p>A password reset was requested for your account.</p><p><a href="${link}" style="display:inline-block;background:#111315;color:#fff;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700">Reset password</a></p><p style="color:#667085;font-size:13px">This single-use link expires in 30 minutes. If you did not request it, no action is required.</p></div>`
    })
  });
  if (!response.ok) throw new Error(`email provider status ${response.status}`);
}

export async function requestPasswordRecovery(context, rawEmail, now = Date.now()) {
  const config = recoveryConfig(context.env);
  const email = validEmail(rawEmail);
  const rateIdentifier = `password-recovery:${email || 'invalid'}`;
  await enforceAuthRateLimit(context.env.DB, context.request, rateIdentifier, context.env, now);
  await ensurePasswordRecoverySchema(context.env.DB);
  if (!email) return { accepted:true };

  const user = await context.env.DB.prepare('SELECT id FROM users WHERE email_normalized = ? AND status = ?').bind(email, 'active').first();
  if (!user) return { accepted:true };
  const recent = await context.env.DB.prepare('SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id = ? AND created_at > ?').bind(user.id, now - 60 * 60 * 1000).first();
  if (Number(recent?.count || 0) >= 3) return { accepted:true };

  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const id = crypto.randomUUID();
  await context.env.DB.prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, ?, NULL)').bind(id, user.id, tokenHash, now, now + RESET_LIFETIME_MS).run();
  const origin = new URL(context.request.url).origin;
  const link = `${origin}/#reset-password/${encodeURIComponent(token)}`;
  try {
    await sendResetEmail(config, email, link);
    logEvent('info', 'auth.password_recovery_sent', { userId:user.id });
  } catch (error) {
    await context.env.DB.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').bind(Date.now(), id).run();
    logEvent('error', 'auth.password_recovery_delivery_failed', { userId:user.id, provider:'resend', reason:String(error?.message || 'unknown').slice(0, 80) });
  }
  return { accepted:true };
}

export async function resetPassword(context, rawToken, rawPassword, now = Date.now()) {
  const token = String(rawToken || '');
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) throw new HttpError(400, 'RESET_TOKEN_INVALID', 'This reset link is invalid or expired.');
  const password = String(rawPassword || '');
  validateStrongPassword(password, true);
  const tokenHash = await sha256(token);
  await enforceAuthRateLimit(context.env.DB, context.request, `password-reset:${tokenHash}`, context.env, now);
  await ensurePasswordRecoverySchema(context.env.DB);
  const passwordHash = await hashPassword(password, 100000, passwordPepper(context.env));
  const result = await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE status = 'active' AND id = (
      SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
    )`).bind(passwordHash, now, tokenHash, now),
    context.env.DB.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').bind(now, tokenHash, now),
    context.env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE revoked_at IS NULL AND user_id = (
      SELECT user_id FROM password_reset_tokens WHERE token_hash = ?
    )`).bind(now, tokenHash),
    context.env.DB.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE used_at IS NULL AND user_id = (
      SELECT user_id FROM password_reset_tokens WHERE token_hash = ?
    )`).bind(now, tokenHash)
  ]);
  if (!result[0]?.meta?.changes || !result[1]?.meta?.changes) throw new HttpError(400, 'RESET_TOKEN_INVALID', 'This reset link is invalid or expired.');
  logEvent('info', 'auth.password_reset', { userId:'redacted', sessionsRevoked:Number(result[2]?.meta?.changes || 0) });
  return { reset:true };
}
