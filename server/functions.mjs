import { randomUUID } from 'node:crypto';
import { withTransaction } from './db.mjs';
import { getCartPricing, getProductPricing, roundKwd } from './pricing.mjs';
import { getPrepFeesForItem, validatePreparations } from './preparations.mjs';
import { normalizePhone, publicError, assertPlainObject, text, finiteNumber, integer } from './security.mjs';
import { isOrderAccessible } from './records.mjs';

function parseRow(row) {
  const result = { ...row };
  for (const key of ['preparations', 'photo_urls', 'items']) {
    if (typeof result[key] === 'string') { try { result[key] = JSON.parse(result[key]); } catch { result[key] = []; } }
  }
  for (const [key, value] of Object.entries(result)) if (value instanceof Date) result[key] = value.toISOString();
  return result;
}

async function orderWithItems(pool, orderId) {
  const [orders] = await pool.execute(`SELECT id, order_number, visitor_session_id, customer_name, customer_phone, area, block, street, building, floor, apartment, notes, payment_method, subtotal, discount, prep_fees, total, coupon_code, delivery_date, delivery_window, location_lat, location_lng, location_label, status, created_at, updated_at FROM orders WHERE id = ? LIMIT 1`, [orderId]);
  if (!orders[0]) return null;
  const [items] = await pool.execute(`SELECT id, order_id, product_id, product_name_ar, product_name_en, quantity, unit_price, preparations, created_at FROM order_items WHERE order_id = ? ORDER BY created_at ASC`, [orderId]);
  return { ...parseRow(orders[0]), order_items: items.map(parseRow) };
}

function compareMoney(actual, expected, field) {
  if (!Number.isFinite(Number(actual)) || !Number.isFinite(Number(expected)) || Math.abs(Number(actual) - Number(expected)) > 0.0001) throw publicError(`Prices changed; please review your cart (${field})`, 'PRICE_CHANGED', 409);
}

function validDate(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const date = text(value, field, { max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) throw publicError(`Invalid ${field}`, 'VALIDATION_ERROR');
  return date;
}

export async function createOrder(pool, body, ctx, requestId) {
  if (!ctx.visitorSessionId) throw publicError('Visitor session is required', 'SESSION_REQUIRED', 401);
  const input = assertPlainObject(body);
  const items = input.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw publicError('The order must contain items', 'VALIDATION_ERROR');
  const customerName = text(input.customer_name, 'customer_name', { required: true, max: 255 });
  const customerPhone = normalizePhone(text(input.customer_phone, 'customer_phone', { required: true, max: 80 }));
  const area = text(input.area, 'area', { required: true, max: 255 });
  if (!customerPhone) throw publicError('customer_phone is required', 'VALIDATION_ERROR');
  if (!['card', 'knet'].includes(input.payment_method)) throw publicError('Invalid payment method', 'VALIDATION_ERROR');
  if (input.coupon_code) throw publicError('Coupons are not enabled for this order flow', 'COUPON_NOT_SUPPORTED', 400);
  const idempotencyKey = requestId === undefined || requestId === null ? '' : text(requestId, 'requestId', { max: 160 });
  if (idempotencyKey) {
    const [existingRows] = await pool.execute('SELECT order_id FROM order_requests WHERE visitor_session_id = ? AND request_id = ? LIMIT 1', [ctx.visitorSessionId, idempotencyKey]);
    if (existingRows[0]) {
      const existingOrder = await orderWithItems(pool, existingRows[0].order_id);
      if (existingOrder) return { order: existingOrder, changes: [], idempotent: true };
    }
  }
  const result = await withTransaction(pool, async (connection) => {
    if (idempotencyKey) {
      await connection.execute('SELECT id FROM sessions WHERE id = ? FOR UPDATE', [ctx.visitorSessionId]);
      const [existingRows] = await connection.execute('SELECT order_id FROM order_requests WHERE visitor_session_id = ? AND request_id = ? LIMIT 1 FOR UPDATE', [ctx.visitorSessionId, idempotencyKey]);
      if (existingRows[0]) {
        const existing = await orderWithItems(connection, existingRows[0].order_id);
        if (existing) return { order: existing, changes: [], idempotent: true };
      }
    }
    const ids = [...new Set(items.map((item) => text(item?.product_id, 'product_id', { required: true, max: 80 })) )];
    const marks = ids.map(() => '?').join(',');
    const [products] = await connection.execute(
      `SELECT p.id, p.name_ar, p.name_en, p.price, p.stock_quantity, p.in_stock, c.slug AS category_slug, c.parent_id AS category_parent_id, pc.slug AS parent_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN categories pc ON pc.id = c.parent_id WHERE p.id IN (${marks}) FOR UPDATE`,
      ids,
    );
    const productMap = new Map(products.map((product) => [product.id, parseRow(product)]));
    if (productMap.size !== ids.length) throw publicError('One or more products were not found', 'PRODUCT_NOT_FOUND', 404);
    const quantities = new Map();
    const pricedItems = [];
    for (const item of items) {
      const product = productMap.get(String(item.product_id));
      const quantity = integer(item.quantity, 'quantity', { min: 1, max: 999 });
      const preparations = validatePreparations(item.preparations, product.category_slug, product.parent_slug);
      quantities.set(product.id, (quantities.get(product.id) || 0) + quantity);
      if (!(product.in_stock === 1 || product.in_stock === true) || Number(product.stock_quantity) < quantities.get(product.id)) throw publicError(`Insufficient stock for ${product.name_en}`, 'INSUFFICIENT_STOCK', 409);
      if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) throw publicError(`Price unavailable for ${product.name_en}`, 'PRICE_UNAVAILABLE', 409);
      const pricing = getProductPricing(product.price, quantity);
      if (item.unit_price !== undefined) compareMoney(item.unit_price, pricing.unitPrice, 'unit_price');
      pricedItems.push({ product, quantity, preparations, unit_price: pricing.unitPrice });
    }
    const preparationFees = roundKwd(pricedItems.reduce((sum, item) => sum + getPrepFeesForItem(item.preparations, item.quantity), 0));
    const pricing = getCartPricing(pricedItems.map((item) => ({ product: item.product, quantity: item.quantity })), preparationFees, area);
    compareMoney(input.subtotal, pricing.subtotal, 'subtotal');
    compareMoney(input.discount, pricing.discount, 'discount');
    if (input.prep_fees !== undefined) compareMoney(input.prep_fees, preparationFees, 'prep_fees');
    compareMoney(input.total, pricing.total, 'total');
    const orderId = randomUUID();
    let orderNumber;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      orderNumber = `MF-${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
      const [same] = await connection.execute('SELECT id FROM orders WHERE order_number = ? LIMIT 1', [orderNumber]);
      if (!same[0]) break;
    }
    const order = {
      id: orderId, order_number: orderNumber, visitor_session_id: ctx.visitorSessionId,
      customer_name: customerName, customer_phone: customerPhone, area,
      block: input.block == null ? null : text(input.block, 'block', { max: 120 }),
      street: input.street == null ? null : text(input.street, 'street', { max: 255 }),
      building: input.building == null ? null : text(input.building, 'building', { max: 120 }),
      floor: input.floor == null ? null : text(input.floor, 'floor', { max: 120 }),
      apartment: input.apartment == null ? null : text(input.apartment, 'apartment', { max: 120 }),
      notes: input.notes == null ? null : text(input.notes, 'notes', { max: 4000 }),
      payment_method: input.payment_method, subtotal: pricing.subtotal, discount: pricing.discount,
      prep_fees: preparationFees, total: pricing.total, coupon_code: null,
      delivery_date: validDate(input.delivery_date, 'delivery_date'),
      delivery_window: input.delivery_window == null ? null : text(input.delivery_window, 'delivery_window', { max: 120 }),
      location_lat: input.location_lat == null ? null : finiteNumber(input.location_lat, 'location_lat', { min: -90, max: 90 }),
      location_lng: input.location_lng == null ? null : finiteNumber(input.location_lng, 'location_lng', { min: -180, max: 180 }),
      location_label: input.location_label == null ? null : text(input.location_label, 'location_label', { max: 500 }),
      status: 'pending',
    };
    await connection.execute(
      `INSERT INTO orders (id, order_number, visitor_session_id, customer_name, customer_phone, area, block, street, building, floor, apartment, notes, payment_method, subtotal, discount, prep_fees, total, coupon_code, delivery_date, delivery_window, location_lat, location_lng, location_label, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.order_number, order.visitor_session_id, order.customer_name, order.customer_phone, order.area, order.block, order.street, order.building, order.floor, order.apartment, order.notes, order.payment_method, order.subtotal, order.discount, order.prep_fees, order.total, order.coupon_code, order.delivery_date, order.delivery_window, order.location_lat, order.location_lng, order.location_label, order.status],
    );
    const changes = [];
    for (const item of pricedItems) {
      const itemId = randomUUID();
      await connection.execute(
        `INSERT INTO order_items (id, order_id, product_id, product_name_ar, product_name_en, quantity, unit_price, preparations) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, order.id, item.product.id, item.product.name_ar, item.product.name_en, item.quantity, item.unit_price, JSON.stringify(item.preparations)],
      );
    }
    for (const [productId, quantity] of quantities) {
      const [updated] = await connection.execute('UPDATE products SET in_stock = (stock_quantity - ?) > 0, stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?', [quantity, quantity, productId, quantity]);
      if (updated.affectedRows !== 1) throw publicError('Stock changed; please retry', 'INSUFFICIENT_STOCK', 409);
      const [rows] = await connection.execute(`SELECT id, name_ar, name_en, description_ar, description_en, price, old_price, image_url, category_id, weight, origin, in_stock, featured, stock_quantity, low_stock_threshold, is_ai_generated_image, created_at, updated_at FROM products WHERE id = ?`, [productId]);
      changes.push({ eventType: 'UPDATE', table: 'products', new: parseRow(rows[0]), old: null });
    }
    if (idempotencyKey) {
      try { await connection.execute('INSERT INTO order_requests (visitor_session_id, request_id, order_id) VALUES (?, ?, ?)', [ctx.visitorSessionId, idempotencyKey, order.id]); }
      catch (error) { if (error?.code !== 'ER_DUP_ENTRY') throw error; }
    }
    const saved = await orderWithItems(connection, order.id);
    changes.unshift({ eventType: 'INSERT', table: 'orders', new: saved, old: null });
    for (const item of saved.order_items) changes.push({ eventType: 'INSERT', table: 'order_items', new: item, old: null });
    return { order: saved, changes, idempotent: false };
  });
  return result;
}

export async function relatedProducts(pool, body) {
  const input = assertPlainObject(body);
  const productId = text(input.productId || input.product_id || input.id, 'productId', { required: true, max: 80 });
  const [rows] = await pool.execute('SELECT category_id FROM products WHERE id = ? LIMIT 1', [productId]);
  if (!rows[0]) return { productIds: [] };
  const [related] = await pool.execute('SELECT id FROM products WHERE category_id = ? AND id <> ? ORDER BY featured DESC, created_at DESC LIMIT 4', [rows[0].category_id, productId]);
  return { productIds: related.map((row) => row.id) };
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function subscriptionUpdate(pool, body, ctx) {
  const input = assertPlainObject(body);
  const id = text(input.subscription_id, 'subscription_id', { required: true, max: 80 });
  const action = text(input.action, 'action', { required: true, max: 20 });
  if (!['pause', 'resume', 'cancel', 'skip'].includes(action)) throw publicError('Invalid subscription action', 'VALIDATION_ERROR');
  const [rows] = await pool.execute(
    `SELECT s.*, p.frequency, p.name_ar, p.name_en FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id WHERE s.id = ? LIMIT 1`,
    [id],
  );
  const subscription = rows[0];
  if (!subscription) throw publicError('Subscription not found', 'NOT_FOUND', 404);
  if (!ctx.admin && subscription.visitor_session_id !== ctx.visitorSessionId) throw publicError('Subscription is not owned by this visitor', 'FORBIDDEN', 403);
  if (!ctx.admin && input.customer_phone && normalizePhone(input.customer_phone) !== normalizePhone(subscription.customer_phone)) throw publicError('Subscription is not owned by this visitor', 'FORBIDDEN', 403);
  let patch;
  if (action === 'pause') patch = { status: 'paused' };
  else if (action === 'resume') patch = { status: 'active' };
  else if (action === 'cancel') patch = { status: 'cancelled' };
  else {
    const days = subscription.frequency === 'monthly' ? 30 : subscription.frequency === 'biweekly' ? 14 : 7;
    const baseDate = subscription.next_delivery_date instanceof Date
      ? subscription.next_delivery_date.toISOString().slice(0, 10)
      : String(subscription.next_delivery_date).slice(0, 10);
    patch = { next_delivery_date: addDays(baseDate, days) };
  }
  const fields = Object.keys(patch);
  await pool.execute(`UPDATE subscriptions SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE id = ?`, [...fields.map((field) => patch[field]), id]);
  const [updatedRows] = await pool.execute(`SELECT s.*, p.id AS plan_id_join, p.slug AS plan_slug, p.name_ar AS plan_name_ar, p.name_en AS plan_name_en, p.frequency AS plan_frequency FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id WHERE s.id = ? LIMIT 1`, [id]);
  const updated = updatedRows[0] ? parseRow(updatedRows[0]) : null;
  if (updated) await ctx.emitChange({ eventType: 'UPDATE', table: 'subscriptions', new: updated, old: parseRow(subscription) });
  return { subscription: updated };
}
