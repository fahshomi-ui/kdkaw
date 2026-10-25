import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedPublicRows, invalidateCatalogCache } from './catalog-cache.mjs';

// [fix] مفتاح المتجر — يمنع اختلاط طلبات المتجرين على خادم واحد
const STORE = process.env.STORE_ID || process.env.STORE || 'kdkaw';


test('public catalog reads coalesce and each caller gets isolated rows', async () => {
  const pool = {}; let reads = 0;
  const loader = async () => { reads++; return [{id:'p1', price:2, category:{slug:'milk'}}]; };
  const [a,b] = await Promise.all([cachedPublicRows(pool,'products',loader),cachedPublicRows(pool,'products',loader)]);
  a[0].price = 0; a[0].category.slug = 'changed';
  assert.equal(b[0].price,2); assert.equal(b[0].category.slug,'milk'); assert.equal(reads,1);
  invalidateCatalogCache(pool,'products');
  await cachedPublicRows(pool,'products',loader);
  assert.equal(reads,2);
});

test('private data is never cached across requests', async () => {
  const pool = {}; let reads = 0;
  const loader = async () => { reads++; return []; };
  await cachedPublicRows(pool,'orders',loader);
  await cachedPublicRows(pool,'orders',loader);
  assert.equal(reads,2);
});
