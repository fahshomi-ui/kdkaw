import { describe, expect, it } from 'vitest';
import { normalizePaymentPricing } from '@/lib/paymentFlowState';

describe('unfinished checkout pricing', () => {
  it('replaces a cached delivery charge with free delivery and the current discount', () => {
    const result = normalizePaymentPricing({ items: [{ product: { price: 0.44 }, quantity: 1 }], subtotal: 0.44, discount: 0, deliveryFee: 1, total: 1.44 });
    expect(result).toMatchObject({ subtotal: 0.44, discount: 0.22, deliveryFee: 0, total: 0.22 });
  });
  it('preserves a completed order snapshot', () => {
    const completed = { orderNumber: 'TEST-ORDER', items: [{ product: { price: 0.44 }, quantity: 1 }], deliveryFee: 1, total: 1.44 };
    expect(normalizePaymentPricing(completed)).toEqual(completed);
  });
});