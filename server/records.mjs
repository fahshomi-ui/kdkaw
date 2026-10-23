import { randomUUID } from 'node:crypto';
import { normalizePhone, publicError, assertPlainObject, text, finiteNumber, integer } from './security.mjs';
import { cachedPublicRows } from './catalog-cache.mjs';

const INTERNAL_FIELDS = new Set(['visitor_session_id']);

export const TABLE_DEFINITIONS = Object.freeze({
  categories: { fields: ['id', 'slug', 'name_ar', 'name_en', 'parent_id', 'image_url', 'icon', 'sort_order', 'created_at'], public: true, guestInsert: false },
  products: { fields: ['id', 'name_ar', 'name_en', 'description_ar', 'description_en', 'price', 'old_price', 'image_url', 'category_id', 'weight', 'origin', 'in_stock', 'featured', 'stock_quantity', 'low_stock_threshold', 'is_ai_generated_image', 'created_at', 'updated_at'], public: true, guestInsert: false },
  product_images: { fields: ['id', 'product_id', 'image_url', 'sort_order', 'created_at'], public: true, guestInsert: false },
  coupons: { fields: ['id', 'code', 'discount_percent', 'active', 'expires_at', 'created_at'], public: true, guestInsert: false },
  orders: { fields: ['id', 'order_number', 'visitor_session_id', 'customer_name', 'customer_phone', 'area', 'block', 'street', 'building', 'floor', 'apartment', 'notes', 'payment_method', 'subtotal', 'discount', 'prep_fees', 'total', 'coupon_code', 'delivery_date', 'delivery_window', 'location_lat', 'location_lng', 'location_label', 'status', 'created_at', 'updated_at'], public: false, guestInsert: false },
  order_items: { fields: ['id', 'order_id', 'product_id', 'product_name_ar', 'product_name_en', 'quantity', 'unit_price', 'preparations', 'created_at'], public: false, guestInsert: false },
  reviews: { fields: ['id', 'product_id', 'visitor_session_id', 'customer_name', 'rating', 'comment', 'created_at'], public: true, guestInsert: true },
  order_reviews: { fields: ['id', 'order_id', 'order_number', 'visitor_session_id', 'customer_name', 'customer_phone', 'rating', 'comment', 'photo_urls', 'published', 'created_at'], public: true, guestInsert: true },
  contact_messages: { fields: ['id', 'visitor_session_id', 'name', 'email', 'phone', 'subject', 'message', 'is_read', 'created_at'], public: false, guestInsert: true },
  stock_alerts: { fields: ['id', 'product_id', 'visitor_session_id', 'contact', 'contact_type', 'lang', 'notified', 'notified_at', 'created_at'], public: false, guestInsert: true },
  subscription_plans: { fields: ['id', 'slug', 'name_ar', 'name_en', 'description_ar', 'description_en', 'frequency', 'discount_percent', 'base_price', 'items', 'image_url', 'active', 'sort_order', 'created_at', 'updated_at'], public: true, guestInsert: false },
  subscriptions: { fields: ['id', 'visitor_session_id', 'plan_id', 'customer_name', 'customer_phone', 'area', 'block', 'street', 'building', 'notes', 'status', 'next_delivery_date', 'deliveries_count', 'created_at', 'updated_at'], public: false, guestInsert: true },
  driver_positions: { fields: ['id', 'order_id', 'lat', 'lng', 'driver_name', 'driver_phone', 'heading', 'speed_kmh', 'updated_at'], public: false, guestInsert: false },
});

const TABLE_NAMES = new Set(Object.keys(TABLE_DEFINITIONS));
const ADMIN_UPDATE_FIELDS = Object.freeze({
  categories: new Set(['slug', 'name_ar', 'name_en', 'parent_id', 'image_url', 'icon', 'sort_order']),
  products: new Set(['name_ar', 'name_en', 'description_ar', 'description_en', 'price', 'old_price', 'image_url', 'category_id', 'weight', 'origin', 'in_stock', 'featured', 'stock_quantity', 'low_stock_threshold', 'is_ai_generated_image']),
  product_images: new Set(['product_id', 'image_url', 'sort_order']), coupons: new Set(['code', 'discount_percent', 'active', 'expires_at']),
  subscription_plans: new Set(['slug', 'name_ar', 'name_en', 'description_ar', 'description_en', 'frequency', 'discount_percent', 'base_price', 'items', 'image_url', 'active', 'sort_order']),
  orders: new Set(['status']), order_reviews: new Set(['published']), contact_messages: new Set(['is_read']),
  stock_alerts: new Set(['notified', 'notified_at']), subscriptions: new Set(['status', 'next_delivery_date', 'deliveries_count']),
  driver_positions: new Set(['order_id', 'lat', 'lng', 'driver_name', 'driver_phone', 'heading', 'speed_kmh']), reviews: new Set([]),
});
const ORDER_STATUSES = new Set(['pending', 'approved', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'rejected', 'cancelled']);
const SUBSCRIPTION_STATUSES = new Set(['active', 'paused', 'cancelled']);
const FREQUENCIES = new Set(['weekly', 'biweekly', 'monthly']);

function assertTable(table) {
  if (!TABLE_NAMES.has(table)) throw publicError('Unsupported collection', 'TABLE_NOT_ALLOWED', 403);
  return TABLE_DEFINITIONS[table];
}

function splitTopLevel(value) {
  const result = [];
  let start = 0; let depth = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '(') depth += 1;
    else if (value[i] === ')') depth -= 1;
    else if (value[i] === ',' && depth === 0) { result.push(value.slice(start, i).trim()); start = i + 1; }
  }
  if (value.slice(start).trim()) result.push(value.slice(start).trim());
  return result;
}

function parseSelect(select, table) {
  const definition = assertTable(table);
  const value = typeof select === 'string' && select.trim() ? select.trim() : '*';
  if (value.length > 3000) throw publicError('Selection is too large', 'INVALID_SELECT');
  const base = new Set();
  const relations = [];
  for (const token of splitTopLevel(value)) {
    if (token === '*') { definition.fields.forEach((field) => base.add(field)); continue; }
    const relationMatch = /^([a-zA-Z_][\w]*)(?::([a-zA-Z_][\w]*))?\((.*)\)$/.exec(token);
    if (relationMatch) {
      const [, first, aliasOrInner, maybeInner] = relationMatch;
      if (aliasOrInner === undefined) relations.push({ alias: first, target: first, select: maybeInner });
      else relations.push({ alias: first, target: aliasOrInner, select: maybeInner });
      continue;
    }
    if (!definition.fields.includes(token)) throw publicError('Selection field is not allowed', 'FIELD_NOT_ALLOWED');
    base.add(token);
  }
  if (!base.size && !relations.length) throw publicError('Selection is empty', 'INVALID_SELECT');
  return { base, relations };
}

function parseJsonField(row, table) {
  const jsonFields = new Set(['preparations', 'photo_urls', 'items']);
  const booleanFields = ['in_stock', 'featured', 'is_ai_generated_image', 'published', 'active', 'is_read', 'notified'];
  for (const field of booleanFields) if (field in row) row[field] = row[field] === 1 || row[field] === true;
  for (const field of jsonFields) {
    if (!(field in row) || row[field] === null || typeof row[field] !== 'string') continue;
    try { row[field] = JSON.parse(row[field]); } catch { row[field] = field === 'items' || field === 'photo_urls' || field === 'preparations' ? [] : null; }
  }
  for (const [key, value] of Object.entries(row)) if (value instanceof Date) row[key] = value.toISOString();
  return row;
}

function publicRow(table, row, admin) {
  const result = { ...row };
  if (!admin) {
    delete result.visitor_session_id;
    if (table === 'order_reviews') delete result.customer_phone;
    if (table === 'order_reviews' && !result.published) return null;
  }
  return result;
}

function nestedValue(row, key) {
  const parts = String(key).split('.');
  if (parts[0] === 'categories' && row.category) parts[0] = 'category';
  if (parts[0] === 'subscription_plans' && !row.subscription_plans && row.plan) parts[0] = 'plan';
  let value = row;
  for (const part of parts) value = value == null ? undefined : value[part];
  return value;
}

function matchFilter(row, filter) {
  if (!filter || typeof filter !== 'object' || !['eq', 'in'].includes(filter.op)) throw publicError('Invalid filter', 'INVALID_FILTER');
  const actual = nestedValue(row, filter.column);
  if (filter.op === 'eq') return String(actual ?? '') === String(filter.value ?? '');
  if (!Array.isArray(filter.value) || filter.value.length > 200) throw publicError('Invalid in filter', 'INVALID_FILTER');
  return filter.value.some((value) => String(actual ?? '') === String(value ?? ''));
}

function matchOr(row, value) {
  if (typeof value !== 'string' || value.length > 2000) throw publicError('Invalid or filter', 'INVALID_FILTER');
  return value.split(',').some((part) => {
    const match = /^([a-zA-Z_][\w.]*)\.(eq|in)\.(.*)$/.exec(part.trim());
    if (!match) return false;
    const values = match[2] === 'in' ? match[3].replace(/^\(|\)$/g, '').split(',') : match[3];
    return matchFilter(row, { column: match[1], op: match[2], value: values });
  });
}

function sortRows(rows, orders) {
  if (!Array.isArray(orders)) return rows;
  if (orders.length > 5) throw publicError('Too many order clauses', 'INVALID_ORDER');
  for (const order of [...orders].reverse()) {
    if (!order || typeof order.column !== 'string' || !order.column.match(/^[a-zA-Z_][\w.]*$/) || typeof order.ascending !== 'boolean') throw publicError('Invalid order', 'INVALID_ORDER');
    rows.sort((a, b) => {
      const av = nestedValue(a, order.column); const bv = nestedValue(b, order.column);
      const left = av == null ? '' : av; const right = bv == null ? '' : bv;
      const result = left > right ? 1 : left < right ? -1 : 0;
      return order.ascending ? result : -result;
    });
  }
  return rows;
}

function assertFilterColumn(table, column) {
  if (column === 'categories.slug' && table === 'products') return;
  if (column === 'subscription_plans.slug' && table === 'subscriptions') return;
  if (column === 'order_items.product_id' && table === 'orders') return;
  const allowed = TABLE_DEFINITIONS[table].fields;
  if (!allowed.includes(column)) throw publicError('Filter field is not allowed', 'FIELD_NOT_ALLOWED');
}

async function fetchRaw(pool, table) {
  const definition = assertTable(table);
  const columns = definition.fields.map((field) => `\`${field}\``).join(', ');
  return cachedPublicRows(pool, table, async () => {
    const [rows] = await pool.query(`SELECT ${columns} FROM \`${table}\` LIMIT 5000`);
    return rows.map((row) => parseJsonField({ ...row }, table));
  });
}

async function attachRelations(pool, table, rows, relations) {
  for (const relation of relations) {
    if (table === 'products' && relation.target === 'categories' && relation.alias === 'category') {
      const cats = await fetchRaw(pool, 'categories');
      const byId = new Map(cats.map((row) => [row.id, row]));
      for (const row of rows) row.category = byId.get(row.category_id) || null;
    } else if (table === 'orders' && relation.target === 'order_items' && relation.alias === 'order_items') {
      const ids = rows.map((row) => row.id);
      const grouped = new Map(ids.map((id) => [id, []]));
      if (ids.length) {
        const marks = ids.map(() => '?').join(',');
        const [items] = await pool.execute(`SELECT id, order_id, product_id, product_name_ar, product_name_en, quantity, unit_price, preparations, created_at FROM order_items WHERE order_id IN (${marks})`, ids);
        for (const item of items) grouped.get(item.order_id)?.push(parseJsonField({ ...item }, 'order_items'));
      }
      for (const row of rows) row.order_items = grouped.get(row.id) || [];
    } else if (table === 'subscriptions' && relation.target === 'subscription_plans' && (relation.alias === 'plan' || relation.alias === 'subscription_plans')) {
      const ids = [...new Set(rows.map((row) => row.plan_id).filter(Boolean))];
      const byId = new Map();
      if (ids.length) {
        const marks = ids.map(() => '?').join(',');
        const [plans] = await pool.execute(`SELECT id, slug, name_ar, name_en, description_ar, description_en, frequency, discount_percent, base_price, items, image_url, active, sort_order, created_at, updated_at FROM subscription_plans WHERE id IN (${marks})`, ids);
        for (const plan of plans) byId.set(plan.id, parseJsonField({ ...plan }, 'subscription_plans'));
      }
      for (const row of rows) row[relation.alias] = byId.get(row.plan_id) || null;
    } else if (table === 'stock_alerts' && relation.target === 'products' && relation.alias === 'products') {
      const ids = [...new Set(rows.map((row) => row.product_id).filter(Boolean))];
      const byId = new Map();
      if (ids.length) {
        const marks = ids.map(() => '?').join(',');
        const [products] = await pool.execute(`SELECT id, name_ar, name_en FROM products WHERE id IN (${marks})`, ids);
        for (const product of products) byId.set(product.id, product);
      }
      for (const row of rows) row.products = byId.get(row.product_id) || null;
    } else {
      throw publicError('Relation is not allowed', 'RELATION_NOT_ALLOWED', 403);
    }
  }
}

function projectRow(table, row, selection, admin) {
  const result = {};
  for (const field of selection.base) if (field in row) result[field] = row[field];
  for (const relation of selection.relations) if (relation.alias in row) {
    if (Array.isArray(row[relation.alias])) result[relation.alias] = row[relation.alias].map((item) => projectRelation(item, relation.select));
    else result[relation.alias] = row[relation.alias] ? projectRelation(row[relation.alias], relation.select) : null;
  }
  const safe = publicRow(table, result, admin);
  return safe;
}

function projectRelation(row, select) {
  if (!select || select.trim() === '*') return { ...row };
  const fields = new Set(splitTopLevel(select).filter((x) => /^[a-zA-Z_][\w]*$/.test(x)));
  const result = {};
  for (const field of fields) if (field in row) result[field] = row[field];
  return result;
}

async function accessibleOrderIds(pool, ctx) {
  if (ctx.admin) return null;
  const [rows] = await pool.execute(
    `SELECT id FROM orders WHERE visitor_session_id = ? UNION SELECT order_id AS id FROM session_order_grants WHERE session_id = ?`,
    [ctx.visitorSessionId, ctx.visitorSessionId],
  );
  return new Set(rows.map((row) => row.id));
}

async function maybeGrantExactOrder(pool, ctx, table, filters) {
  if (ctx.admin || table !== 'orders' || !ctx.visitorSessionId) return;
  const number = filters.find((filter) => filter.column === 'order_number' && filter.op === 'eq')?.value;
  const phone = filters.find((filter) => filter.column === 'customer_phone' && filter.op === 'eq')?.value;
  if (!number || !phone) return;
  const [rows] = await pool.execute('SELECT id FROM orders WHERE order_number = ? AND customer_phone = ? LIMIT 1', [String(number), normalizePhone(phone)]);
  if (rows[0]) await pool.execute('INSERT IGNORE INTO session_order_grants (session_id, order_id) VALUES (?, ?)', [ctx.visitorSessionId, rows[0].id]);
}

function canReadRow(table, row, ctx, orderIds) {
  if (ctx.admin) return true;
  if (table === 'orders') return orderIds?.has(row.id) || false;
  if (table === 'order_items' || table === 'driver_positions') return orderIds?.has(row.order_id) || false;
  if (table === 'order_reviews') return row.published === 1 || row.published === true;
  if (table === 'subscriptions') return row.visitor_session_id === ctx.visitorSessionId;
  if (TABLE_DEFINITIONS[table].public) return true;
  return false;
}

export async function queryData(pool, request, ctx) {
  assertPlainObject(request);
  const table = String(request.table || '');
  const definition = assertTable(table);
  const operation = request.operation || 'select';
  if (operation !== 'select') throw publicError('Use the matching write operation', 'OPERATION_NOT_ALLOWED', 405);
  if (!ctx.admin && !definition.public && !['orders', 'order_items', 'driver_positions', 'subscriptions'].includes(table)) throw publicError('Private collection requires admin access', 'FORBIDDEN', 403);
  const filters = Array.isArray(request.filters) ? request.filters : [];
  if (filters.length > 12) throw publicError('Too many filters', 'INVALID_FILTER');
  for (const filter of filters) assertFilterColumn(table, filter?.column);
  await maybeGrantExactOrder(pool, ctx, table, filters);
  let rows = await fetchRaw(pool, table);
  await attachRelations(pool, table, rows, parseSelect(request.select, table).relations);
  const orderIds = ['orders', 'order_items', 'driver_positions'].includes(table) ? await accessibleOrderIds(pool, ctx) : null;
  if (!ctx.admin && table === 'subscription_plans') rows = rows.filter((row) => row.active === 1 || row.active === true);
  if (!ctx.admin && table === 'order_reviews') rows = rows.filter((row) => row.published === 1 || row.published === true);
  rows = rows.filter((row) => canReadRow(table, row, ctx, orderIds));
  rows = rows.filter((row) => filters.every((filter) => matchFilter(row, filter)));
  if (request.or) rows = rows.filter((row) => matchOr(row, request.or));
  sortRows(rows, request.orders);
  const limit = request.limit === undefined ? 500 : integer(request.limit, 'limit', { min: 1, max: 500 });
  rows = rows.slice(0, limit);
  const selection = parseSelect(request.select, table);
  const projected = rows.map((row) => projectRow(table, row, selection, !!ctx.admin)).filter(Boolean);
  if (request.single === 'single') {
    if (projected.length !== 1) throw publicError(projected.length ? 'Expected one row' : 'Row not found', projected.length ? 'MULTIPLE_ROWS' : 'NOT_FOUND', projected.length ? 409 : 404);
    return projected[0];
  }
  if (request.single === 'maybe' || request.single === 'maybeSingle') return projected[0] || null;
  return projected;
}

function allowedPayload(table, payload, mode) {
  const definition = assertTable(table);
  const input = assertPlainObject(payload);
  const disallowed = Object.keys(input).filter((key) => !definition.fields.includes(key) || ['id', 'created_at', 'updated_at', 'visitor_session_id'].includes(key));
  if (disallowed.length) throw publicError('Payload field is not allowed', 'FIELD_NOT_ALLOWED');
  const output = { ...input };
  if (table === 'products') {
    if ('name_ar' in output) output.name_ar = text(output.name_ar, 'name_ar', { required: true, max: 255 });
    if ('name_en' in output) output.name_en = text(output.name_en, 'name_en', { required: true, max: 255 });
    for (const field of ['price', 'old_price']) if (field in output && output[field] !== null) output[field] = finiteNumber(output[field], field, { min: 0, max: 1_000_000 });
    for (const field of ['stock_quantity', 'low_stock_threshold']) if (field in output) output[field] = integer(output[field], field, { min: 0, max: 10_000_000 });
  }
  if (table === 'categories') {
    for (const field of ['name_ar', 'name_en', 'slug']) if (field in output) output[field] = text(output[field], field, { required: true, max: 255 });
    if ('sort_order' in output) output.sort_order = integer(output.sort_order, 'sort_order', { min: -1_000_000, max: 1_000_000 });
  }
  if (table === 'reviews') {
    if ('customer_name' in output) output.customer_name = text(output.customer_name, 'customer_name', { required: true, max: 255 });
    if ('comment' in output) output.comment = output.comment == null ? null : text(output.comment, 'comment', { max: 4000 });
    if ('rating' in output) output.rating = integer(output.rating, 'rating', { min: 1, max: 5 });
  }
  if (table === 'order_reviews') {
    if ('customer_name' in output) output.customer_name = text(output.customer_name, 'customer_name', { required: true, max: 255 });
    if ('comment' in output) output.comment = output.comment == null ? null : text(output.comment, 'comment', { max: 4000 });
    if ('rating' in output) output.rating = integer(output.rating, 'rating', { min: 1, max: 5 });
    if (mode === 'insert' && output.photo_urls === undefined) output.photo_urls = [];
    if ('photo_urls' in output) {
      if (!Array.isArray(output.photo_urls) || output.photo_urls.length > 5 || output.photo_urls.some((url) => typeof url !== 'string' || url.length > 1000)) throw publicError('Invalid photo_urls', 'VALIDATION_ERROR');
      output.photo_urls = JSON.stringify(output.photo_urls);
    }
  }
  if (table === 'contact_messages') {
    if ('name' in output) output.name = text(output.name, 'name', { required: true, max: 100 });
    if ('message' in output) output.message = text(output.message, 'message', { required: true, max: 2000 });
    for (const field of ['email', 'phone', 'subject']) if (field in output && output[field] != null) output[field] = text(output[field], field, { max: 255 });
  }
  if (table === 'stock_alerts') {
    output.product_id = text(output.product_id, 'product_id', { required: true, max: 80 });
    output.contact = text(output.contact, 'contact', { required: true, max: 255 });
    output.contact_type = output.contact_type === 'email' ? 'email' : 'phone';
    output.lang = output.lang === 'en' ? 'en' : 'ar';
  }
  if (table === 'subscriptions') {
    if ('customer_name' in output) output.customer_name = text(output.customer_name, 'customer_name', { required: mode === 'insert', max: 255 });
    if ('customer_phone' in output) output.customer_phone = normalizePhone(text(output.customer_phone, 'customer_phone', { required: mode === 'insert', max: 80 }));
    if ('area' in output) output.area = text(output.area, 'area', { required: mode === 'insert', max: 255 });
    if (mode === 'insert') { output.status = 'active'; output.deliveries_count = 0; }
    if ('status' in output && !SUBSCRIPTION_STATUSES.has(output.status)) throw publicError('Invalid subscription status', 'VALIDATION_ERROR');
    if ('deliveries_count' in output) output.deliveries_count = integer(output.deliveries_count, 'deliveries_count', { min: 0, max: 100000 });
    if ('next_delivery_date' in output) output.next_delivery_date = text(output.next_delivery_date, 'next_delivery_date', { required: mode === 'insert', max: 20 });
  }
  if (table === 'subscription_plans') {
    for (const field of ['name_ar', 'name_en', 'slug', 'frequency']) if (field in output) output[field] = text(output[field], field, { required: mode === 'insert', max: field === 'frequency' ? 20 : field === 'slug' ? 120 : 255 });
    if ('frequency' in output && !FREQUENCIES.has(output.frequency)) throw publicError('Invalid plan frequency', 'VALIDATION_ERROR');
    if ('base_price' in output) output.base_price = finiteNumber(output.base_price, 'base_price', { min: 0, max: 1_000_000 });
    if ('discount_percent' in output) output.discount_percent = finiteNumber(output.discount_percent ?? 0, 'discount_percent', { min: 0, max: 100 });
    if ('items' in output) { if (!Array.isArray(output.items)) throw publicError('Invalid plan items', 'VALIDATION_ERROR'); output.items = JSON.stringify(output.items); }
  }
  if (table === 'orders') {
    if (output.payment_method && !['card', 'knet'].includes(output.payment_method)) throw publicError('Invalid payment method', 'VALIDATION_ERROR');
    if (output.status && !ORDER_STATUSES.has(output.status)) throw publicError('Invalid order status', 'VALIDATION_ERROR');
  }
  if (table === 'driver_positions') {
    output.lat = finiteNumber(output.lat, 'lat', { min: -90, max: 90 }); output.lng = finiteNumber(output.lng, 'lng', { min: -180, max: 180 });
  }
  if (mode === 'insert' && ['reviews', 'order_reviews', 'contact_messages', 'stock_alerts', 'subscriptions'].includes(table)) {
    if (!ctxlessVisitorAllowed(table)) throw publicError('Guest insert is not allowed', 'FORBIDDEN', 403);
  }
  return output;
}

function ctxlessVisitorAllowed(table) { return ['reviews', 'order_reviews', 'contact_messages', 'stock_alerts', 'subscriptions'].includes(table); }

function dbValue(table, field, value) {
  if (['preparations', 'photo_urls', 'items'].includes(field) && value !== null && typeof value !== 'string') return JSON.stringify(value);
  return value;
}

async function fetchOne(pool, table, id) {
  const definition = assertTable(table);
  const [rows] = await pool.execute(`SELECT ${definition.fields.map((field) => `\`${field}\``).join(', ')} FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? parseJsonField({ ...rows[0] }, table) : null;
}

function insertRequired(table, row) {
  const required = {
    categories: ['name_ar', 'name_en', 'slug'], products: ['name_ar', 'name_en', 'price'], reviews: ['product_id', 'customer_name', 'rating'],
    order_reviews: ['customer_name', 'rating'], contact_messages: ['name', 'message'], stock_alerts: ['product_id', 'contact'], subscriptions: ['plan_id', 'customer_name', 'customer_phone', 'area', 'next_delivery_date'],
    subscription_plans: ['name_ar', 'name_en', 'slug', 'frequency', 'base_price'], driver_positions: ['order_id', 'lat', 'lng'],
  }[table] || [];
  for (const field of required) if (row[field] === undefined || row[field] === null || row[field] === '') throw publicError(`${field} is required`, 'VALIDATION_ERROR');
}

export async function insertData(pool, table, payload, ctx) {
  const definition = assertTable(table);
  if (table === 'orders' || table === 'order_items') throw publicError('Orders must be created through data:function create-order', 'DIRECT_ORDER_WRITE_DISABLED', 403);
  if (!ctx.admin && !definition.guestInsert) throw publicError('Admin access required', 'FORBIDDEN', 403);
  const payloads = Array.isArray(payload) ? payload : [payload];
  if (!payloads.length || payloads.length > 50) throw publicError('Invalid insert batch', 'VALIDATION_ERROR');
  const inserted = [];
  for (const original of payloads) {
    const safeInput = { ...assertPlainObject(original) };
    delete safeInput.visitor_session_id;
    const row = allowedPayload(table, safeInput, 'insert');
    insertRequired(table, row);
    if (!ctx.admin && table === 'order_reviews') row.published = false;
    if (!ctx.admin && table === 'reviews') row.visitor_session_id = ctx.visitorSessionId;
    if (!ctx.admin && table === 'order_reviews') row.visitor_session_id = ctx.visitorSessionId;
    if (!ctx.admin && table === 'contact_messages') row.visitor_session_id = ctx.visitorSessionId;
    if (!ctx.admin && table === 'stock_alerts') row.visitor_session_id = ctx.visitorSessionId;
    if (!ctx.admin && table === 'subscriptions') row.visitor_session_id = ctx.visitorSessionId;
    if (table === 'reviews') {
      const product = await fetchOne(pool, 'products', row.product_id); if (!product) throw publicError('Product not found', 'NOT_FOUND', 404);
    }
    if (table === 'stock_alerts') {
      const product = await fetchOne(pool, 'products', row.product_id); if (!product) throw publicError('Product not found', 'NOT_FOUND', 404);
    }
    if (table === 'subscriptions') {
      const plan = await fetchOne(pool, 'subscription_plans', row.plan_id); if (!plan || !(plan.active === 1 || plan.active === true)) throw publicError('Subscription plan is unavailable', 'NOT_FOUND', 404);
    }
    const id = randomUUID();
    row.id = id;
    const fields = Object.keys(row).filter((field) => definition.fields.includes(field) && field !== 'updated_at' && field !== 'created_at');
    const columns = fields.map((field) => `\`${field}\``).join(', ');
    const marks = fields.map(() => '?').join(', ');
    await pool.execute(`INSERT INTO \`${table}\` (${columns}) VALUES (${marks})`, fields.map((field) => dbValue(table, field, row[field])));
    const current = await fetchOne(pool, table, id);
    inserted.push(current);
    await ctx.emitChange({ eventType: 'INSERT', table, new: current, old: null });
  }
  return inserted.length === 1 && !Array.isArray(payload) ? inserted[0] : inserted;
}

export async function updateData(pool, table, filters, payload, ctx) {
  assertTable(table);
  if (!ctx.admin) throw publicError('Admin access required', 'FORBIDDEN', 403);
  if (table === 'orders' && payload?.status && !ORDER_STATUSES.has(payload.status)) throw publicError('Invalid order status', 'VALIDATION_ERROR');
  if (table === 'subscriptions' && payload?.status && !SUBSCRIPTION_STATUSES.has(payload.status)) throw publicError('Invalid subscription status', 'VALIDATION_ERROR');
  const patch = allowedPayload(table, payload, 'update');
  const allowedUpdateFields = ADMIN_UPDATE_FIELDS[table] || new Set();
  if (Object.keys(patch).some((field) => !allowedUpdateFields.has(field))) throw publicError('Update field is not allowed', 'FIELD_NOT_ALLOWED');
  const rows = await queryData(pool, { table, operation: 'select', filters, select: '*', limit: 500 }, ctx);
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const fields = Object.keys(patch).filter((field) => TABLE_DEFINITIONS[table].fields.includes(field) && !['id', 'created_at', 'updated_at', 'visitor_session_id'].includes(field));
  if (!fields.length) throw publicError('Empty update', 'VALIDATION_ERROR');
  const assignments = fields.map((field) => `\`${field}\` = ?`).join(', ');
  for (const id of ids) {
    const old = await fetchOne(pool, table, id);
    await pool.execute(`UPDATE \`${table}\` SET ${assignments} WHERE id = ?`, [...fields.map((field) => dbValue(table, field, patch[field])), id]);
    const current = await fetchOne(pool, table, id);
    if (table === 'order_reviews' && patch.published !== undefined) await syncReviewMedia(pool, current);
    await ctx.emitChange({ eventType: 'UPDATE', table, new: current, old });
  }
  return (Array.isArray(filters) && filters.length === 1 && filters[0].op === 'eq' && filters[0].column === 'id') ? await fetchOne(pool, table, ids[0]) : Promise.all(ids.map((id) => fetchOne(pool, table, id)));
}

async function syncReviewMedia(pool, review) {
  if (!review || !Array.isArray(review.photo_urls)) return;
  const publicFlag = review.published === 1 || review.published === true;
  for (const url of review.photo_urls) {
    const match = /\/api\/media\/([a-f0-9-]{20,})$/i.exec(String(url));
    if (match) await pool.execute('UPDATE media SET public_flag = ? WHERE id = ?', [publicFlag, match[1]]);
  }
}

export async function deleteData(pool, table, filters, ctx) {
  assertTable(table);
  if (!ctx.admin) throw publicError('Admin access required', 'FORBIDDEN', 403);
  const rows = await queryData(pool, { table, operation: 'select', filters, select: '*', limit: 200 }, ctx);
  for (const row of rows) {
    await pool.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [row.id]);
    await ctx.emitChange({ eventType: 'DELETE', table, new: null, old: row });
  }
  return rows;
}

export async function mutateData(pool, request, ctx) {
  assertPlainObject(request);
  const table = String(request.table || '');
  const operation = request.operation;
  if (operation === 'insert') return insertData(pool, table, request.payload, ctx);
  if (operation === 'update') return updateData(pool, table, request.filters || [], request.payload, ctx);
  if (operation === 'delete') return deleteData(pool, table, request.filters || [], ctx);
  throw publicError('Unsupported operation', 'OPERATION_NOT_ALLOWED', 405);
}

export async function isOrderAccessible(pool, ctx, orderId) {
  if (ctx.admin) return true;
  if (!ctx.visitorSessionId) return false;
  const [rows] = await pool.execute(
    `SELECT id FROM orders WHERE id = ? AND visitor_session_id = ? UNION SELECT order_id AS id FROM session_order_grants WHERE order_id = ? AND session_id = ? LIMIT 1`,
    [orderId, ctx.visitorSessionId, orderId, ctx.visitorSessionId],
  );
  return !!rows[0];
}
