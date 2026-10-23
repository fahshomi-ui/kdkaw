import { describe, expect, it } from 'vitest';
import { getCartPricing, getProductPricing, PRODUCT_DISCOUNT_PERCENT } from '@/lib/pricing';
import { getDeliveryFee } from '@/lib/pricing';
import { KUWAIT_GOVERNORATES } from '@/data/kuwaitGovernorates';

describe('50% discount on all products', () => {
  it('uses the requested 50% rate', () => {
    expect(PRODUCT_DISCOUNT_PERCENT).toBe(50);
  });
  it('halves every product price without modifying the catalog price', () => {
    for (const price of [0, 0.2, 0.75, 1, 4.5, 12]) {
      expect(getProductPricing(price).unitPrice).toBe(price / 2);
      expect(getProductPricing(price).originalUnitPrice).toBe(price);
    }
  });
  it('applies the discount once to every quantity and leaves preparation fees unchanged', () => {
    expect(getCartPricing([{ product: { price: 2 }, quantity: 3 }, { product: { price: 4 }, quantity: 2 }], 0.5)).toEqual({ subtotal: 14, productTotal: 7, discount: 7, total: 7.5 });
  });
  it('provides free delivery to every Kuwait area with no minimum spend', () => {
    const areas = KUWAIT_GOVERNORATES.flatMap(g => g.areas);
    expect(areas.length).toBeGreaterThan(0);
    for (const area of areas) {
      expect(getDeliveryFee(area.ar)).toBe(0);
      expect(getDeliveryFee(area.en)).toBe(0);
    }
    expect(getCartPricing([{ product: { price: 0.44 }, quantity: 1 }]).total).toBe(0.22);
  });
  it('rounds unit prices to the nearest fils consistently for cards and cart', () => {
    expect(getProductPricing(0.125, 3)).toMatchObject({ unitPrice: 0.063, total: 0.189 });
    expect(getCartPricing([{ product: { price: 0.125 }, quantity: 3 }]).productTotal).toBe(0.189);
  });
});