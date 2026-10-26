import assert from 'node:assert/strict';
import { createDatabase, closeDatabase } from './db.mjs';
import { createOrder } from './functions.mjs';
import { getCartPricing, getProductPricing } from './pricing.mjs';

const pool = createDatabase();
try {
  const [sessions] = await pool.query("SELECT id FROM sessions WHERE kind='guest' AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1");
  assert.ok(sessions[0], 'Run the Socket.IO smoke test first to establish a guest session');
  const [products] = await pool.query('SELECT id, price, stock_quantity, in_stock FROM products WHERE in_stock = TRUE AND stock_quantity > 0 LIMIT 1');
  const product = products[0];
  const pricing = getCartPricing([{product,quantity:1}],0);
  let rolledBack = false;
  const transactionalPool = {
    execute: (...args) => pool.execute(...args),
    getConnection: async () => {
      const connection = await pool.getConnection();
      return {
        beginTransaction: () => connection.beginTransaction(),
        execute: (...args) => connection.execute(...args),
        query: (...args) => connection.query(...args),
        commit: async () => { await connection.rollback(); rolledBack = true; },
        rollback: () => connection.rollback(),
        release: () => connection.release(),
      };
    },
  };
  const result = await createOrder(transactionalPool, {
    customer_name:'Transaction rollback check', customer_phone:'00000000', area:'Test', payment_method:'knet',
    subtotal:pricing.subtotal,discount:pricing.discount,total:pricing.total,prep_fees:0,
    items:[{product_id:product.id,quantity:1,unit_price:getProductPricing(product.price).unitPrice,preparations:[]}],
  }, {visitorSessionId:sessions[0].id}, `rollback-check-${Date.now()}`);
  assert.ok(rolledBack);
  assert.equal(result.order.status, 'pending');
  assert.equal(result.order.total, pricing.total);
  assert.equal(result.order.order_items.length,1);
  assert.ok(result.changes.some(change=>change.table==='products'));
  const [savedOrders] = await pool.execute('SELECT id FROM orders WHERE id = ?', [result.order.id]);
  const [currentStock] = await pool.execute('SELECT stock_quantity FROM products WHERE id = ?', [product.id]);
  assert.equal(savedOrders.length,0);
  assert.equal(currentStock[0].stock_quantity,product.stock_quantity);
  console.log('PASS: valid order, items, repricing and inventory work in one transaction; rollback left no saved order or stock change');
} finally {await closeDatabase(pool);}
