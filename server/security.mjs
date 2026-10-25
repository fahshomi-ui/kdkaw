import crypto from 'node:crypto';

// [fix] مفتاح المتجر — يمنع اختلاط طلبات المتجرين على خادم واحد
const STORE = process.env.STORE_ID || process.env.STORE || 'kdkaw';


export const ADMIN_EMAIL_DOMAIN = 'kdd-admin.local';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const VISITOR_TTL_MS = 180 * 24 * 60 * 60 * 1000;
export const MAX_PAYLOAD_BYTES = 512 * 1024;
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export const now = () => new Date();

export function normalizeAdminUsername(value) {
  let username = String(value ?? '').trim().toLowerCase();
  if (username.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) username = username.slice(0, -(ADMIN_EMAIL_DOMAIN.length + 1));
  return username.replace(/[^a-z0-9._-]/g, '').slice(0, 120);
}

export function usernameToEmail(username) {
  return `${normalizeAdminUsername(username)}@${ADMIN_EMAIL_DOMAIN}`;
}

export function normalizePhone(raw) {
  if (raw === undefined || raw === null) return '';
  let phone = String(raw).replace(/[\s\-()._]/g, '').trim();
  if (!phone) return '';
  if (/[a-zA-Z@]/.test(phone)) return phone.toLowerCase();
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('00')) phone = phone.slice(2);
  if (phone.startsWith('965') && phone.length > 8) phone = phone.slice(3);
  return phone;
}

export function opaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token), 'utf8').digest('hex');
}

export function timingSafeStringEqual(a, b) {
  const aa = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function hashPassword(password) {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(password), salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

function parseScryptHash(encoded) {
  const value = String(encoded ?? '').trim();
  const own = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([^$]+)\$([^$]+)$/.exec(value);
  if (own) return { N: Number(own[1]), r: Number(own[2]), p: Number(own[3]), salt: own[4], digest: own[5] };
  const phc = /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/.exec(value);
  if (phc) return { N: 2 ** Number(phc[1]), r: Number(phc[2]), p: Number(phc[3]), salt: phc[4], digest: phc[5] };
  return null;
}

export function verifyPassword(password, encoded) {
  const parsed = parseScryptHash(encoded);
  if (!parsed || !Number.isSafeInteger(parsed.N) || parsed.N < 1024 || parsed.N > 1_048_576 || parsed.r < 1 || parsed.r > 32 || parsed.p < 1 || parsed.p > 16) return false;
  try {
    const salt = Buffer.from(parsed.salt.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const expected = Buffer.from(parsed.digest.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const actual = crypto.scryptSync(String(password), salt, expected.length, { N: parsed.N, r: parsed.r, p: parsed.p, maxmem: Math.max(64 * 1024 * 1024, 128 * parsed.N * parsed.r + 1024) });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function normalizeContentType(value) {
  return String(value ?? '').split(';', 1)[0].trim().toLowerCase();
}

export function detectImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp' && /^(avif|avis)/.test(buffer.subarray(8, 16).toString('ascii'))) return 'image/avif';
  return null;
}

export function publicError(message, code = 'BAD_REQUEST', status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export function errorShape(error) {
  const safe = error && typeof error === 'object' ? error : {};
  return {
    message: String(safe.publicMessage || safe.message || 'Request failed').replace(/[\r\n]+/g, ' ').slice(0, 240),
    ...(safe.code ? { code: String(safe.code).slice(0, 64) } : {}),
    ...(safe.status ? { status: Number(safe.status) } : {}),
  };
}

export function assertPlainObject(value, message = 'Invalid payload') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw publicError(message, 'INVALID_PAYLOAD');
  return value;
}

export function text(value, field, { required = false, max = 500 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw publicError(`${field} is required`, 'VALIDATION_ERROR');
    return value === null ? null : '';
  }
  if (typeof value !== 'string' || value.length > max) throw publicError(`Invalid ${field}`, 'VALIDATION_ERROR');
  return value.trim();
}

export function finiteNumber(value, field, { min = -Infinity, max = Infinity } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw publicError(`Invalid ${field}`, 'VALIDATION_ERROR');
  return number;
}

export function integer(value, field, { min = -Infinity, max = Infinity } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw publicError(`Invalid ${field}`, 'VALIDATION_ERROR');
  return number;
}
