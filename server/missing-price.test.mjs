import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrder } from './functions.mjs';

test('an unpriced product is never treated as free and the order is rolled back', async () => {
  let rolledBack = false;
  const connection = {
    beginTransaction: async () => {},
    commit: async () => { throw new Error('Must not commit an unpriced order'); },
    rollback: async () => { rolledBack = true; },
    release: () => {},
    execute: async (sql) => {
      if (sql.startsWith('SELECT p.id')) return [[{id:'missing-price',name_ar:'منتج ناقص السعر',name_en:'Unpriced product',price:0,stock_quantity:20,in_stock:1,category_slug:'new',parent_slug:null}]];
      throw new Error('Must not write anything for an unpriced product');
    },
  };
  const pool = { getConnection: async () => connection };
  await assert.rejects(createOrder(pool, {
    customer_name:'Test',customer_phone:'91234567',area:'Test',payment_method:'knet',subtotal:0,discount:0,total:0,
    items:[{product_id:'missing-price',quantity:1,unit_price:0,preparations:[]}],
  }, {visitorSessionId:'guest'}), {code:'PRICE_UNAVAILABLE'});
  assert.equal(rolledBack,true);
});
