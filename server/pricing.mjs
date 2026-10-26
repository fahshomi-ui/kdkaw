
function storeOf(s){try{var h=(s&&s.handshake)||{},q=String((h.query&&h.query.store)||""),o=String(h.origin||h.referer||"");return /kdd/i.test(q||o)?"KDD":"kdkaw"}catch(e){return "kdkaw"}}


export const PRODUCT_DISCOUNT_PERCENT = 50;
export const roundKwd = (amount) => Math.round((Number(amount) + Number.EPSILON) * 1000) / 1000;
export const getDeliveryFee = (_area) => 0;

export function getProductPricing(price, quantity = 1) {
  const originalUnitPrice = Math.max(0, Number(price) || 0);
  const unitPrice = roundKwd(originalUnitPrice * (1 - PRODUCT_DISCOUNT_PERCENT / 100));
  const originalTotal = roundKwd(originalUnitPrice * quantity);
  const total = roundKwd(unitPrice * quantity);
  return { originalUnitPrice, unitPrice, originalTotal, total, savings: roundKwd(originalTotal - total) };
}

export function getCartPricing(items, preparationFees = 0, area) {
  const lines = items.map((item) => getProductPricing(item.product.price, item.quantity));
  const subtotal = roundKwd(lines.reduce((sum, line) => sum + line.originalTotal, 0));
  const productTotal = roundKwd(lines.reduce((sum, line) => sum + line.total, 0));
  return {
    subtotal,
    productTotal,
    discount: roundKwd(subtotal - productTotal),
    total: roundKwd(productTotal + Number(preparationFees || 0) + getDeliveryFee(area)),
  };
}
