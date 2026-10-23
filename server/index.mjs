import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Server } from 'socket.io';
import { migrate, seedCatalog, createDatabase, closeDatabase } from './db.mjs';
import { queryData, mutateData, isOrderAccessible } from './records.mjs';
import { createOrder, relatedProducts, subscriptionUpdate } from './functions.mjs';
import { upload, signedUrl, getMedia } from './storage.mjs';
import { createGuestSession, resolveContext, login, logout, authSession } from './session.mjs';
import { errorShape, publicError } from './security.mjs';
import { invalidateCatalogCache } from './catalog-cache.mjs';
import { applyVerifiedPrices } from './price-updates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_SOCKET_PACKET = 8 * 1024 * 1024;
const PUBLIC_CATALOG = new Set(['products', 'categories', 'product_images']);
const PUBLIC_REALTIME = new Set(['products', 'categories', 'product_images', 'reviews', 'order_reviews', 'subscription_plans']);
const anonymousPublicContext = () => ({ admin: false, visitorSessionId: null, visitorId: null, user: null });

class RateLimiter {
  constructor() { this.buckets = new Map(); }
  check(key, limit, windowMs) {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || current.expires <= now) { this.buckets.set(key, { count: 1, expires: now + windowMs }); return true; }
    if (current.count >= limit) return false;
    current.count += 1; return true;
  }
  prune() {
    const now = Date.now();
    for (const [key, value] of this.buckets) if (value.expires <= now) this.buckets.delete(key);
    if (this.buckets.size > 10_000) this.buckets.clear();
  }
}

function clientIp(socket) {
  return String(socket.handshake.address || 'unknown').slice(0, 100);
}

function acknowledge(ack, data) { if (typeof ack === 'function') ack({ data, error: null }); }
function acknowledgeError(ack, error) { if (typeof ack === 'function') ack({ data: null, error: safeError(error) }); }

const SAFE_CODES = new Set([
  'BAD_REQUEST', 'INVALID_PAYLOAD', 'VALIDATION_ERROR', 'INVALID_FILTER', 'INVALID_ORDER', 'INVALID_SELECT', 'FIELD_NOT_ALLOWED',
  'TABLE_NOT_ALLOWED', 'RELATION_NOT_ALLOWED', 'OPERATION_NOT_ALLOWED', 'FORBIDDEN', 'NOT_FOUND', 'MULTIPLE_ROWS', 'PRODUCT_NOT_FOUND',
  'PRICE_CHANGED', 'PRICE_UNAVAILABLE', 'INSUFFICIENT_STOCK', 'DIRECT_ORDER_WRITE_DISABLED', 'SESSION_REQUIRED', 'INVALID_CREDENTIALS', 'ADMIN_CONFIG_MISSING',
  'INVALID_IMAGE', 'FILE_TOO_LARGE', 'INVALID_FILE', 'INVALID_PATH', 'BUCKET_NOT_ALLOWED', 'COUPON_NOT_SUPPORTED', 'INVALID_PREPARATIONS',
  'SUBSCRIPTION_NOT_FOUND', 'SINGLE_NOT_FOUND', 'RATE_LIMITED', 'MEDIA_NOT_FOUND', 'CONFIG_MISSING', 'REQUEST_TIMEOUT',
]);
function safeError(error) {
  if (error?.code && SAFE_CODES.has(String(error.code))) return errorShape(error);
  return { message: 'Request failed', code: 'INTERNAL_ERROR', status: 500 };
}

function parseRealtimeFilter(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 250) throw publicError('Invalid subscription filter', 'INVALID_FILTER');
  const match = /^([a-zA-Z_][\w]*)=eq\.(.+)$/.exec(value);
  if (!match || match[2].includes('\n')) throw publicError('Invalid subscription filter', 'INVALID_FILTER');
  return { column: match[1], value: match[2] };
}

function filterMatches(row, filter) {
  if (!filter) return true;
  return row && String(row[filter.column] ?? '') === String(filter.value);
}

function safeRealtimeRow(table, row, ctx) {
  if (!row) return null;
  const copy = { ...row };
  if (!ctx.admin) {
    delete copy.visitor_session_id;
    if (table === 'order_reviews') delete copy.customer_phone;
  }
  for (const [key, value] of Object.entries(copy)) if (value instanceof Date) copy[key] = value.toISOString();
  return copy;
}

async function subscriptionAllowed(pool, socket, table, filter, ctx) {
  if (ctx.admin) return true;
  if (['categories', 'products', 'product_images', 'reviews', 'subscription_plans'].includes(table)) return true;
  if (table === 'order_reviews') return true;
  if (!['orders', 'order_items', 'driver_positions'].includes(table)) return false;
  // Subscription filters never grant ownership; each emitted change is re-authorized.
  if (ctx.visitorSessionId && table === 'orders') return true;
  if (ctx.visitorSessionId && filter?.column === 'order_id') return true;
  if (!filter) return false;
  if (filter.column === 'order_id') return isOrderAccessible(pool, ctx, filter.value);
  if (table === 'orders' && filter.column === 'order_number') {
    const [rows] = await pool.execute('SELECT id FROM orders WHERE order_number = ? LIMIT 1', [filter.value]);
    return rows[0] ? isOrderAccessible(pool, ctx, rows[0].id) : false;
  }
  return false;
}

async function canBroadcast(pool, table, row, ctx) {
  if (ctx.admin) return true;
  if (['categories', 'products', 'product_images', 'reviews', 'subscription_plans'].includes(table)) return true;
  if (table === 'order_reviews') return row?.published === 1 || row?.published === true;
  if (table === 'orders' || table === 'order_items' || table === 'driver_positions') {
    const orderId = table === 'orders' ? row?.id : row?.order_id;
    return orderId ? isOrderAccessible(pool, ctx, orderId) : false;
  }
  return false;
}

async function broadcastChange(io, pool, change) {
  invalidateCatalogCache(pool, change.table);
  for (const socket of io.sockets.sockets.values()) {
    const entries = socket.data.realtimeSubscriptions instanceof Map ? [...socket.data.realtimeSubscriptions.entries()] : [];
    if (!entries.length) continue;
    try {
      const ctx = PUBLIC_REALTIME.has(change.table) && !socket.data.adminToken ? anonymousPublicContext() : await resolveContext(pool, socket.data);
      for (const [subscriptionId, subscription] of entries) {
        if (subscription.table !== change.table) continue;
        if (subscription.event !== '*' && subscription.event !== change.eventType) continue;
        const visibleNew = change.new && filterMatches(change.new, subscription.filter) && await canBroadcast(pool, change.table, change.new, ctx);
        const visibleOld = change.old && filterMatches(change.old, subscription.filter) && await canBroadcast(pool, change.table, change.old, ctx);
        if (!visibleNew && !visibleOld) continue;
        socket.emit('realtime:change', {
          subscriptionId,
          payload: {
            eventType: change.eventType,
            table: change.table,
            new: visibleNew ? safeRealtimeRow(change.table, change.new, ctx) : null,
            old: visibleOld ? safeRealtimeRow(change.table, change.old, ctx) : null,
          },
        });
      }
    } catch { /* revoked/expired subscribers are intentionally silent */ }
  }
}

function requestRunner(socket, ack, rate, task) {
  const ip = clientIp(socket);
  if (!rate.check(`socket:${ip}`, 180, 60_000)) { acknowledgeError(ack, publicError('Too many requests', 'RATE_LIMITED', 429)); return; }
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(publicError('Request timed out', 'REQUEST_TIMEOUT', 504)), REQUEST_TIMEOUT_MS); });
  Promise.race([Promise.resolve().then(task), timeout])
    .then((data) => acknowledge(ack, data))
    .catch((error) => acknowledgeError(ack, error))
    .finally(() => clearTimeout(timer));
}

function installSocketHandlers(io, pool) {
  const rate = new RateLimiter();
  const loginRate = new RateLimiter();
  const uploadRate = new RateLimiter();
  setInterval(() => { rate.prune(); loginRate.prune(); uploadRate.prune(); }, 60_000).unref();

  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const guest = await createGuestSession(pool, auth.visitorToken || auth.visitor_token);
      socket.data.visitorToken = guest.token;
      socket.data.visitorSessionId = guest.id;
      socket.data.adminToken = auth.token || auth.access_token || null;
      socket.data.realtimeSubscriptions = new Map();
      next();
    } catch (error) { next(new Error('Session initialization failed')); }
  });

  io.on('connection', (socket) => {
    socket.emit('session:visitor', { token: socket.data.visitorToken });

    socket.on('auth:login', (body, ack) => {
      const key = `login:${clientIp(socket)}`;
      if (!loginRate.check(key, 8, 15 * 60_000)) { acknowledgeError(ack, publicError('Too many login attempts', 'RATE_LIMITED', 429)); return; }
      requestRunner(socket, ack, rate, async () => {
        const input = body && typeof body === 'object' ? body : {};
        const result = await login(pool, input.email, input.password);
        socket.data.adminToken = result.token;
        socket.data.realtimeSubscriptions.clear();
        return { user: result.user, session: result.session };
      });
    });

    socket.on('auth:session', (_body, ack) => requestRunner(socket, ack, rate, async () => authSession(pool, socket.data)));
    socket.on('auth:logout', (_body, ack) => requestRunner(socket, ack, rate, async () => {
      await logout(pool, socket.data.adminToken);
      socket.data.adminToken = null;
      socket.data.realtimeSubscriptions.clear();
      return null;
    }));
    socket.on('auth:role', (body, ack) => requestRunner(socket, ack, rate, async () => {
      const ctx = await resolveContext(pool, socket.data);
      const input = body && typeof body === 'object' ? body : {};
      return !!ctx.admin && input._role === 'admin' && input._user_id === ctx.user.id;
    }));

    socket.on('data:query', (request, ack) => requestRunner(socket, ack, rate, async () => {
      const publicRead = PUBLIC_CATALOG.has(request?.table) && (!request?.operation || request.operation === 'select') && !socket.data.adminToken;
      const ctx = publicRead ? anonymousPublicContext() : await resolveContext(pool, socket.data);
      ctx.emitChange = (change) => broadcastChange(io, pool, change);
      return request?.operation && request.operation !== 'select'
        ? await mutateData(pool, request, ctx)
        : await queryData(pool, request, ctx);
    }));

    socket.on('data:insert', (request, ack) => requestRunner(socket, ack, rate, async () => {
      const ctx = await resolveContext(pool, socket.data); ctx.emitChange = (change) => broadcastChange(io, pool, change);
      return await mutateData(pool, { ...(request || {}), operation: 'insert' }, ctx);
    }));
    socket.on('data:update', (request, ack) => requestRunner(socket, ack, rate, async () => {
      const ctx = await resolveContext(pool, socket.data); ctx.emitChange = (change) => broadcastChange(io, pool, change);
      return await mutateData(pool, { ...(request || {}), operation: 'update' }, ctx);
    }));
    socket.on('data:delete', (request, ack) => requestRunner(socket, ack, rate, async () => {
      const ctx = await resolveContext(pool, socket.data); ctx.emitChange = (change) => broadcastChange(io, pool, change);
      return await mutateData(pool, { ...(request || {}), operation: 'delete' }, ctx);
    }));

    socket.on('data:function', (request, ack) => requestRunner(socket, ack, rate, async () => {
      const input = request && typeof request === 'object' ? request : {};
      const ctx = await resolveContext(pool, socket.data); ctx.emitChange = (change) => broadcastChange(io, pool, change);
      if (input.name === 'related-products') return relatedProducts(pool, input.body || input);
      if (input.name === 'subscription-update') return subscriptionUpdate(pool, input.body || input, ctx);
      if (input.name === 'create-order') {
        const result = await createOrder(pool, input.body || input, ctx, input.requestId);
        if (!result.idempotent) for (const change of result.changes) await ctx.emitChange(change);
        return result.order;
      }
      throw publicError('Function is not allowed', 'OPERATION_NOT_ALLOWED', 403);
    }));

    socket.on('storage:upload', (body, ack) => {
      const key = `upload:${clientIp(socket)}`;
      if (!uploadRate.check(key, 20, 10 * 60_000)) { acknowledgeError(ack, publicError('Too many uploads', 'RATE_LIMITED', 429)); return; }
      requestRunner(socket, ack, rate, async () => {
        const ctx = await resolveContext(pool, socket.data);
        return { path: (await upload(pool, body, ctx)).path };
      });
    });
    socket.on('storage:signed-url', (body, ack) => requestRunner(socket, ack, rate, async () => {
      const ctx = await resolveContext(pool, socket.data);
      return signedUrl(pool, body, ctx);
    }));

    socket.on('realtime:subscribe', (body, ack) => requestRunner(socket, ack, rate, async () => {
      const input = body && typeof body === 'object' ? body : {};
      const table = String(input.table || '');
      const event = input.event || '*';
      if (!/^[a-z_]+$/.test(table) || !['*', 'INSERT', 'UPDATE', 'DELETE'].includes(event)) throw publicError('Invalid subscription', 'VALIDATION_ERROR');
      const filter = parseRealtimeFilter(input.filter);
      const ctx = PUBLIC_REALTIME.has(table) && !socket.data.adminToken ? anonymousPublicContext() : await resolveContext(pool, socket.data);
      if (!(await subscriptionAllowed(pool, socket, table, filter, ctx))) throw publicError('Subscription is not authorized', 'FORBIDDEN', 403);
      const subscriptionId = String(input.subscriptionId || '');
      if (!/^[a-zA-Z0-9._:-]{1,120}$/.test(subscriptionId)) throw publicError('Invalid subscription id', 'VALIDATION_ERROR');
      socket.data.realtimeSubscriptions.set(subscriptionId, { table, event, filter });
      return { subscriptionId };
    }));
    socket.on('realtime:unsubscribe', (body, ack) => requestRunner(socket, ack, rate, async () => {
      const id = String(body?.subscriptionId || '');
      socket.data.realtimeSubscriptions.delete(id);
      return { subscriptionId: id };
    }));

    socket.on('disconnect', () => { socket.data.realtimeSubscriptions?.clear(); });
  });
}

export async function createApp({ databaseUrl = process.env.DATABASE_URL, httpServer } = {}) {
  const pool = createDatabase(databaseUrl);
  let seed;
  try {
    await migrate(pool);
    seed = await seedCatalog(pool);
    await applyVerifiedPrices(pool);
  } catch (error) {
    await closeDatabase(pool);
    throw error;
  }
  const app = express();
  app.disable('x-powered-by');
  app.use(compression());
  app.use(express.json({ limit: '8mb', strict: true }));
  let ready = true;
  app.get('/api/health', (_req, res) => res.status(ready ? 200 : 503).json({ ok: ready, service: 'kdcow-socket', database: ready ? 'ready' : 'not_ready' }));
  app.get('/api/media/:id', async (req, res) => {
    try {
      const media = await getMedia(pool, req.params.id, req.query);
      if (!media) return res.status(404).send('Not found');
      res.setHeader('Content-Type', media.content_type); res.setHeader('Content-Length', String(media.size_bytes));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(media.bytes);
    } catch { return res.status(404).send('Not found'); }
  });
  if (isProduction) {
    const dist = path.resolve(HERE, '../dist');
    app.use('/optimized', express.static(path.join(dist, 'optimized'), { index: false, maxAge: '1y', immutable: true }));
    app.use('/assets', express.static(path.join(dist, 'assets'), { index: false, maxAge: '1y', immutable: true }));
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const vite = await import('vite');
    const devServer = await vite.createServer({ server: { middlewareMode: true, port: PORT, hmr: httpServer ? { server: httpServer, overlay: false } : false }, appType: 'spa' });
    app.use(devServer.middlewares);
  }
  app.use((_error, _req, res, _next) => res.status(500).json({ error: 'Request failed' }));
  return { app, pool, seed };
}

export async function startServer() {
  const httpServer = http.createServer();
  const { app, pool, seed } = await createApp({ httpServer });
  httpServer.on('request', app);
  const io = new Server(httpServer, {
    path: '/socket.io',
    maxHttpBufferSize: MAX_SOCKET_PACKET,
    connectionStateRecovery: { maxDisconnectionDuration: 120_000, skipMiddlewares: false },
    cors: { origin: false },
  });
  installSocketHandlers(io, pool);
  await new Promise((resolve, reject) => { httpServer.once('error', reject); httpServer.listen(PORT, '0.0.0.0', resolve); });
  const address = httpServer.address();
  console.log(`kdcow backend listening on ${typeof address === 'object' && address ? address.port : PORT}; catalog seed checked (${seed.products} products, ${seed.categories} categories, ${seed.product_images} images)`);
  const close = async () => { io.close(); await new Promise((resolve) => httpServer.close(() => resolve())); await closeDatabase(pool); };
  return { app, pool, io, httpServer, close };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer().catch((error) => {
    console.error(error?.code === 'DATABASE_CONFIG_MISSING' ? error.message : 'Server startup failed');
    process.exitCode = 1;
  });
}
