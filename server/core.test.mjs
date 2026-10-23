import test from 'node:test';
import assert from 'node:assert/strict';
import { getCartPricing, getProductPricing } from './pricing.mjs';
import { normalizePhone, detectImage } from './security.mjs';
import { validatePreparations } from './preparations.mjs';

test('server retains 50% discount and free delivery in KWD', () => {
  const product = getProductPricing(6, 2);
  assert.equal(product.unitPrice, 3);
  const cart = getCartPricing([{ product: {price: 6}, quantity: 2 }], 0);
  assert.equal(cart.subtotal, 12);
  assert.equal(cart.discount, 6);
  assert.equal(cart.total, 6);
});

test('phone normalization preserves the original Kuwait tracking UX', () => {
  assert.equal(normalizePhone('+965 9123-4567'), '91234567');
});

test('upload detection rejects SVG and HTML bank-like inputs', () => {
  assert.equal(detectImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(detectImage(Buffer.from('<html><input name="card"/></html>')), null);
});

test('dairy products reject unsupported preparation charges', () => {
  assert.deepEqual(validatePreparations([], 'milk', null), []);
  assert.throws(() => validatePreparations(['fillet'], 'milk', null));
});
