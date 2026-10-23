/** Catalog prices remain unchanged; the promotion is applied once per unit. */
export const PRODUCT_DISCOUNT_PERCENT = 50;
export const getDeliveryFee = (_area?: string) => 0;
export const roundKwd = (amount: number) => Math.round((amount + Number.EPSILON) * 1000) / 1000;

export const getProductPricing = (price: number | string, quantity = 1) => {
  const originalUnitPrice = Math.max(0, Number(price) || 0);
  const unitPrice = roundKwd(originalUnitPrice * (1 - PRODUCT_DISCOUNT_PERCENT / 100));
  const originalTotal = roundKwd(originalUnitPrice * quantity);
  const total = roundKwd(unitPrice * quantity);
  return { originalUnitPrice, unitPrice, originalTotal, total, savings: roundKwd(originalTotal - total) };
};

export const getCartPricing = (items: { product: { price: number }; quantity: number }[], preparationFees = 0) => {
  const lines = items.map(item => getProductPricing(item.product.price, item.quantity));
  const subtotal = roundKwd(lines.reduce((sum, line) => sum + line.originalTotal, 0));
  const productTotal = roundKwd(lines.reduce((sum, line) => sum + line.total, 0));
  return { subtotal, productTotal, discount: roundKwd(subtotal - productTotal), total: roundKwd(productTotal + preparationFees + getDeliveryFee()) };
};