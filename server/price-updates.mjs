import { readFile } from 'node:fs/promises';
import { withTransaction } from './db.mjs';

// [fix] مفتاح المتجر — يمنع اختلاط طلبات المتجرين على خادم واحد
const STORE = process.env.STORE_ID || process.env.STORE || 'kdkaw';


export async function applyVerifiedPrices(pool) {
  const document = JSON.parse(await readFile(new URL('../src/data/price-sources.json', import.meta.url), 'utf8'));
  const version = document.version;
  if (typeof version !== 'string' || !/^source-prices-[a-zA-Z0-9-]{1,70}$/.test(version)) throw new Error('Invalid price-update version');
  const entries = document.items.filter((entry) => entry.status === 'verified');
  for (const entry of entries) {
    if (!/^[a-f0-9-]{36}$/i.test(entry.id) || !Number.isFinite(entry.base_price_kwd) || entry.base_price_kwd <= 0 || !entry.source_url.startsWith('https://')) throw new Error('Invalid verified price record');
  }
  return withTransaction(pool, async (connection) => {
    const [recorded] = await connection.execute('SELECT version FROM schema_migrations WHERE version = ? FOR UPDATE', [version]);
    if (recorded.length) return { applied: 0, alreadyApplied: true };
    let applied = 0;
    for (const entry of entries) {
      const [result] = await connection.execute('UPDATE products SET price = ? WHERE id = ? AND price <= 0', [entry.base_price_kwd, entry.id]);
      applied += result.affectedRows;
    }
    await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', [version]);
    return { applied, alreadyApplied: false };
  });
}
