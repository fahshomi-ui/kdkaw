import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { MAX_MEDIA_BYTES, detectImage, normalizeContentType, publicError, text, integer } from './security.mjs';

const BUCKETS = new Set(['product-images', 'review-photos']);
const MEDIA_SECRET = process.env.MEDIA_SIGNING_SECRET || crypto.createHash('sha256').update(String(process.env.DATABASE_URL || 'kdcow-media-secret')).digest('hex');

function assertBucket(bucket) {
  if (!BUCKETS.has(bucket)) throw publicError('Storage bucket is not allowed', 'BUCKET_NOT_ALLOWED', 403);
}

function assertPath(path) {
  const value = text(path, 'path', { required: true, max: 500 });
  if (!/^[a-zA-Z0-9._/-]+$/.test(value) || value.includes('..') || value.startsWith('/') || value.endsWith('/')) throw publicError('Invalid storage path', 'INVALID_PATH');
  return value;
}

function decodeBase64(value) {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_MEDIA_BYTES * 1.4) + 4096) throw publicError('Upload is too large', 'FILE_TOO_LARGE', 413);
  const data = value.includes(',') && /^data:[^;]+;base64,/.test(value) ? value.slice(value.indexOf(',') + 1) : value;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(data)) throw publicError('Invalid upload encoding', 'INVALID_FILE');
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Buffer.from(normalized, 'base64');
  if (!bytes.length || bytes.length > MAX_MEDIA_BYTES) throw publicError('Upload is too large', 'FILE_TOO_LARGE', 413);
  return bytes;
}

function mediaSignature(id, expires) {
  return crypto.createHmac('sha256', MEDIA_SECRET).update(`${id}:${expires}`).digest('base64url');
}

function signedMediaUrl(id, expires) {
  return `/api/media/${id}?expires=${expires}&sig=${mediaSignature(id, expires)}`;
}

function parseRow(row) {
  const result = { ...row };
  for (const [key, value] of Object.entries(result)) if (value instanceof Date) result[key] = value.toISOString();
  return result;
}

export async function upload(pool, body, ctx) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw publicError('Invalid upload payload', 'INVALID_PAYLOAD');
  const bucket = String(body.bucket || ''); assertBucket(bucket);
  if (bucket === 'product-images' && !ctx.admin) throw publicError('Admin access required for product images', 'FORBIDDEN', 403);
  if (bucket === 'review-photos' && !ctx.admin && !ctx.visitorSessionId) throw publicError('Visitor session required', 'SESSION_REQUIRED', 401);
  const objectPath = assertPath(body.path);
  const bytes = decodeBase64(body.base64);
  const detected = detectImage(bytes);
  const contentType = normalizeContentType(body.contentType || detected || '');
  if (!detected || detected !== contentType || contentType === 'image/svg+xml' || contentType === 'text/html') throw publicError('Only real raster image uploads are accepted', 'INVALID_IMAGE', 415);
  const owner = ctx.admin ? null : ctx.visitorSessionId;
  const publicFlag = bucket === 'product-images';
  if (body.upsert) {
    const [existing] = await pool.execute('SELECT id, owner_session_id FROM media WHERE bucket = ? AND object_path = ? LIMIT 1', [bucket, objectPath]);
    if (existing[0] && !ctx.admin && existing[0].owner_session_id !== ctx.visitorSessionId) throw publicError('You do not own this media', 'FORBIDDEN', 403);
    if (existing[0]) {
      await pool.execute('UPDATE media SET content_type = ?, size_bytes = ?, bytes = ?, public_flag = ? WHERE id = ?', [contentType, bytes.length, bytes, publicFlag, existing[0].id]);
      return { path: objectPath };
    }
  }
  await pool.execute('INSERT INTO media (id, bucket, object_path, owner_session_id, content_type, size_bytes, bytes, public_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [randomUUID(), bucket, objectPath, owner, contentType, bytes.length, bytes, publicFlag]);
  const [rows] = await pool.execute('SELECT id FROM media WHERE bucket = ? AND object_path = ? LIMIT 1', [bucket, objectPath]);
  return { path: objectPath, id: rows[0]?.id || null };
}

export async function signedUrl(pool, body, ctx) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw publicError('Invalid signed URL payload', 'INVALID_PAYLOAD');
  const bucket = String(body.bucket || ''); assertBucket(bucket);
  const objectPath = assertPath(body.path);
  const [rows] = await pool.execute('SELECT id, bucket, owner_session_id, public_flag FROM media WHERE bucket = ? AND object_path = ? LIMIT 1', [bucket, objectPath]);
  const media = rows[0];
  if (!media) throw publicError('Media not found', 'NOT_FOUND', 404);
  const allowed = ctx.admin || media.public_flag === 1 || media.public_flag === true || (ctx.visitorSessionId && media.owner_session_id === ctx.visitorSessionId);
  if (!allowed) throw publicError('You do not have access to this media', 'FORBIDDEN', 403);
  if (media.public_flag === 1 || media.public_flag === true) return { signedUrl: `/api/media/${media.id}` };
  const requested = body.expiresIn === undefined ? 3600 : Math.min(integer(body.expiresIn, 'expiresIn', { min: 60, max: 315_360_000 }), 31_536_000);
  const expires = Math.floor(Date.now() / 1000) + requested;
  return { signedUrl: signedMediaUrl(media.id, expires) };
}

export async function getMedia(pool, id, query) {
  if (!/^[a-f0-9-]{20,80}$/i.test(String(id))) return null;
  const [rows] = await pool.execute('SELECT id, content_type, size_bytes, bytes, public_flag FROM media WHERE id = ? LIMIT 1', [id]);
  const media = rows[0]; if (!media) return null;
  const publicFlag = media.public_flag === 1 || media.public_flag === true;
  if (!publicFlag) {
    const expires = Number(query?.expires || 0); const sig = String(query?.sig || '');
    const expected = mediaSignature(media.id, expires);
    if (!expires || expires < Math.floor(Date.now() / 1000) || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  }
  return parseRow(media);
}
