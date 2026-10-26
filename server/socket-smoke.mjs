import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

function storeOf(s){try{var h=(s&&s.handshake)||{},q=String((h.query&&h.query.store)||""),o=String(h.origin||h.referer||"");return /kdd/i.test(q||o)?"KDD":"kdkaw"}catch(e){return "kdkaw"}}


const origin = process.env.SOCKET_TEST_URL || 'http://127.0.0.1:3000';
const client = io(origin, { autoConnect: false, timeout: 10_000, reconnection: false });
const ack = (event, payload) => new Promise((resolve, reject) => {
  client.timeout(15_000).emit(event, payload, (error, result) => error ? reject(error) : resolve(result));
});
let visitorToken;
client.on('session:visitor', ({ token }) => { visitorToken = token; });
try {
  await new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
    client.connect();
  });
  const products = await ack('data:query', { table: 'products', operation: 'select', select: '*, category:categories(slug, name_ar, name_en)', filters: [], orders: [] });
  assert.equal(products.error, null);
  assert.equal(products.data.length, 130);
  assert.equal(typeof products.data[0].in_stock, 'boolean');
  assert.ok(products.data[0].category?.slug);
  console.log('PASS: Socket catalog, 130 original products, relation and booleans');
  const categories = await ack('data:query', { table: 'categories', operation: 'select', filters: [], orders: [] });
  assert.equal(categories.error, null);
  assert.equal(categories.data.length, 10);
  console.log('PASS: 10 original categories');
  const privateData = await ack('data:query', { table: 'contact_messages', operation: 'select', filters: [], orders: [] });
  assert.equal(privateData.error?.code, 'FORBIDDEN');
  const privateOrders = await ack('data:query', { table: 'orders', operation: 'select', filters: [{ column: 'customer_phone', op: 'eq', value: '00000000' }], orders: [] });
  assert.equal(privateOrders.error, null);
  assert.deepEqual(privateOrders.data, []);
  console.log('PASS: private collections denied; phone alone grants no order access');
  const deniedWrite = await ack('data:query', { table: 'products', operation: 'update', payload: { stock_quantity: 100 }, filters: [{column: 'id', op: 'eq', value: products.data[0].id}] });
  assert.equal(deniedWrite.error?.code, 'FORBIDDEN');
  const invalidMessage = await ack('data:query', { table: 'contact_messages', operation: 'insert', payload: { name: '', message: '', visitor_session_id: 'untrusted-identity' }, filters: [] });
  assert.equal(invalidMessage.error?.code, 'VALIDATION_ERROR');
  console.log('PASS: data:query mutation routes correctly; catalog writes fail closed');
  const original = products.data.find((product) => product.price > 0 && product.in_stock && product.stock_quantity > 0);
  const invalidOrder = await ack('data:function', {
    name: 'create-order', requestId: 'smoke-invalid-price',
    body: { customer_name: 'Smoke validation', customer_phone: '00000000', area: 'Test', payment_method: 'knet', subtotal: original.price, discount: original.price / 2, total: -1, items: [{ product_id: original.id, quantity: 1, unit_price: Number((original.price / 2).toFixed(3)), preparations: [] }] },
  });
  assert.equal(invalidOrder.error?.code, 'PRICE_CHANGED');
  console.log('PASS: invalid order rejected before insertion; server verifies prices');
  const subscription = await ack('realtime:subscribe', { subscriptionId: 'smoke-catalog', table: 'products', event: '*' });
  assert.equal(subscription.error, null);
  assert.equal((await ack('realtime:unsubscribe', { subscriptionId: 'smoke-catalog' })).error, null);
  assert.equal((await ack('auth:session', {})).data.user, null);
  assert.ok(visitorToken?.length >= 40);
  console.log('PASS: realtime subscription, no user account, durable guest session');
  client.disconnect();
  client.auth = { visitorToken };
  await new Promise((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject); client.connect(); });
  assert.equal((await ack('data:query', { table: 'products', operation: 'select', filters: [], orders: [], limit: 1 })).error, null);
  console.log('PASS: reconnect and fresh server read');
} finally {
  client.disconnect();
}
