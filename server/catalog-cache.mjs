const TABLES = new Set(['products', 'categories', 'product_images']);
const caches = new WeakMap();
const TTL_MS = 10_000;

function cacheFor(pool) {
  let cache = caches.get(pool);
  if (!cache) { cache = new Map(); caches.set(pool, cache); }
  return cache;
}

export async function cachedPublicRows(pool, table, loader) {
  if (!TABLES.has(table)) return loader();
  const cache = cacheFor(pool);
  const existing = cache.get(table);
  if (existing && existing.expiresAt > Date.now()) return structuredClone(await existing.promise);
  const entry = { expiresAt: Date.now() + TTL_MS, promise: Promise.resolve().then(loader) };
  cache.set(table, entry);
  try { return structuredClone(await entry.promise); }
  catch (error) { if (cache.get(table) === entry) cache.delete(table); throw error; }
}

export function invalidateCatalogCache(pool, table) {
  if (TABLES.has(table)) cacheFor(pool).delete(table);
}
