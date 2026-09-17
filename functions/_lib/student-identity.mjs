import { hashPassword, verifyPassword } from './crypto.mjs';
import { HttpError } from './http.mjs';

const PIN_PREFIX = 'dafatii-pin-credential:';
const DUMMY_HASH = 'pbkdf2-sha256-p1$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const LEVELS = Object.freeze({
  primary_school: { stages:new Set(['sixth']), fields:null, legacy:'school', organization:'institution' },
  middle_school: { stages:new Set(['third']), fields:null, legacy:'school', organization:'institution' },
  preparatory_school: { stages:new Set(['sixth']), fields:new Set(['scientific','literary']), legacy:'school', organization:'institution' },
  institute: { stages:new Set(['first','second']), fields:new Set(['medical','technical','mechanical','electrical','chemical','petroleum']), legacy:'university', organization:'institution' },
  college: { stages:new Set(['first','second','third','fourth','fifth','sixth']), fields:new Set(['medical','engineering','sciences','education']), legacy:'university', organization:'college' },
  primary_studies: { stages:new Set(['primary_studies']), fields:null, legacy:'university', organization:'institution' },
  postgraduate_studies: { stages:new Set(['postgraduate_studies']), fields:null, legacy:'university', organization:'institution' }
});
const GENDERS = new Set(['male','female','prefer_not_to_say']);
let schemaReady = false;

const clean = (value, maximum = 160) => String(value || '').trim().normalize('NFC').slice(0, maximum);
export const normalizePhone = value => {
  let phone = String(value || '').trim().normalize('NFKC').replace(/[\s().-]/g, '');
  if (!phone) return '';
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  return /^\+\d{8,15}$/.test(phone) || /^\d{8,15}$/.test(phone) ? phone : '';
};

function birthDate(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new HttpError(400, 'INVALID_BIRTH_DATE', 'Birth date is invalid.');
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || year < 1900 || text > new Date().toISOString().slice(0, 10)) {
    throw new HttpError(400, 'INVALID_BIRTH_DATE', 'Birth date is invalid.');
  }
  return text;
}

export function validateStudentSignup(input = {}) {
  const academicLevel = String(input.academicLevel || '').trim();
  const rule = LEVELS[academicLevel];
  if (!rule) throw new HttpError(400, 'INVALID_ACADEMIC_LEVEL', 'Academic level is invalid.');
  const academicStage = String(input.academicStage || '').trim();
  if (!rule.stages.has(academicStage)) throw new HttpError(400, 'INVALID_ACADEMIC_STAGE', 'Academic stage does not match the selected level.');
  const academicField = String(input.academicField || '').trim();
  if (rule.fields ? !rule.fields.has(academicField) : Boolean(academicField)) throw new HttpError(400, 'INVALID_ACADEMIC_FIELD', 'Academic field does not match the selected level.');

  let institutionName = clean(input.institutionName);
  let universityName = clean(input.universityName);
  let collegeName = clean(input.collegeName);
  if (rule.organization === 'college') {
    if (universityName.length < 2 || collegeName.length < 2) throw new HttpError(400, 'INVALID_INSTITUTION', 'University and college names are required.');
    institutionName = '';
  } else {
    if (institutionName.length < 2) throw new HttpError(400, 'INVALID_INSTITUTION', 'School or institution name is required.');
    universityName = '';
    collegeName = '';
  }

  const gender = String(input.gender || '').trim();
  if (!GENDERS.has(gender)) throw new HttpError(400, 'INVALID_GENDER', 'Gender selection is invalid.');
  const rawPhone = String(input.phone || '').trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : '';
  if (rawPhone && !phone) throw new HttpError(400, 'INVALID_PHONE', 'Phone number is invalid. Include a country code when possible.');
  const studentId = String(input.studentId || '').trim();
  if (!/^\d{12}$/.test(studentId)) throw new HttpError(400, 'INVALID_STUDENT_ID', 'Student ID must contain exactly 12 digits.');
  const pin = String(input.pin || '').trim();
  if (!/^\d{4}$/.test(pin)) throw new HttpError(400, 'INVALID_PIN', 'PIN must contain exactly 4 digits.');

  return {
    birthDate:birthDate(input.birthDate), gender, phone, studentId, pin,
    academicLevel, academicStage, academicField, institutionName, universityName, collegeName,
    studentStage:rule.legacy
  };
}

export function normalizeLoginIdentifier(value, normalizeEmail) {
  const raw = String(value || '').trim().normalize('NFKC');
  const email = normalizeEmail(raw);
  if (raw.includes('@') && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { kind:'email', value:email, key:`email:${email}` };
  if (/^\d{12}$/.test(raw)) return { kind:'studentId', value:raw, key:`sid:${raw}` };
  const phone = normalizePhone(raw);
  if (phone) return { kind:'phone', value:phone, key:`phone:${phone}` };
  throw new HttpError(400, 'INVALID_CREDENTIALS', 'Identifier or credential is invalid.');
}

export async function ensureStudentCredentialsSchema(db) {
  if (schemaReady) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS student_credentials (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL UNIQUE CHECK (length(student_id) = 12),
    phone_normalized TEXT UNIQUE,
    pin_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  schemaReady = true;
}

const pinMaterial = pin => `${PIN_PREFIX}${String(pin || '')}`;
export async function createStudentCredentials(db, userId, identity, pepper, now = Date.now()) {
  await ensureStudentCredentialsSchema(db);
  const existingId = await db.prepare('SELECT user_id FROM student_credentials WHERE student_id = ?').bind(identity.studentId).first();
  const existingPhone = identity.phone ? await db.prepare('SELECT user_id FROM student_credentials WHERE phone_normalized = ?').bind(identity.phone).first() : null;
  if (existingId || existingPhone) throw new HttpError(409, 'ACCOUNT_UNAVAILABLE', 'An account with these details cannot be created.');
  const pinHash = await hashPassword(pinMaterial(identity.pin), 100000, pepper);
  return db.prepare('INSERT INTO student_credentials (user_id, student_id, phone_normalized, pin_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(userId, identity.studentId, identity.phone || null, pinHash, now, now);
}

export async function findStudentLogin(db, login) {
  await ensureStudentCredentialsSchema(db);
  if (login.kind === 'email') {
    return db.prepare(`SELECT u.id, u.email_normalized, u.password_hash, u.display_name, u.status, c.pin_hash
      FROM users u LEFT JOIN student_credentials c ON c.user_id = u.id WHERE u.email_normalized = ?`).bind(login.value).first();
  }
  if (login.kind === 'studentId') {
    return db.prepare(`SELECT u.id, u.email_normalized, u.password_hash, u.display_name, u.status, c.pin_hash
      FROM student_credentials c JOIN users u ON u.id = c.user_id WHERE c.student_id = ?`).bind(login.value).first();
  }
  if (login.kind === 'phone') {
    return db.prepare(`SELECT u.id, u.email_normalized, u.password_hash, u.display_name, u.status, c.pin_hash
      FROM student_credentials c JOIN users u ON u.id = c.user_id WHERE c.phone_normalized = ?`).bind(login.value).first();
  }
  return null;
}

export async function verifyStudentPin(pin, hash, pepper) {
  return verifyPassword(pinMaterial(pin), hash || DUMMY_HASH, pepper);
}
