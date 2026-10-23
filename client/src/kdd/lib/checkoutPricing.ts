import type { DbProduct } from "@/kdd/lib/types";

const FILS_PER_KWD = 1000;

type CheckoutItem = {
  product: Pick<DbProduct, "price" | "old_price">;
  quantity: number;
};

export type CheckoutPriceSummary = {
  baseSubtotal: number;
  saleDiscount: number;
  subtotal: number;
  combinedDiscount: number;
};

function toFils(value: number) {
  return Math.round(value * FILS_PER_KWD);
}

function fromFils(value: number) {
  return value / FILS_PER_KWD;
}

function isHalfPriceCampaign(currentFils: number, oldFils: number | null) {
  return (
    oldFils !== null &&
    oldFils > currentFils &&
    currentFils === Math.round(oldFils / 2)
  );
}

export function getCheckoutPriceSummary(
  items: CheckoutItem[],
  couponDiscount = 0
): CheckoutPriceSummary {
  let campaignBaseFils = 0;
  let regularCurrentFils = 0;

  for (const item of items) {
    const quantity = item.quantity;
    const currentFils = toFils(item.product.price);
    const oldFils =
      item.product.old_price === null || item.product.old_price === undefined
        ? null
        : toFils(item.product.old_price);

    if (oldFils !== null && isHalfPriceCampaign(currentFils, oldFils)) {
      campaignBaseFils += oldFils * quantity;
    } else {
      regularCurrentFils += currentFils * quantity;
    }
  }

  const baseTotalFils = campaignBaseFils + regularCurrentFils;
  const promoSavingsFils = Math.round(campaignBaseFils / 2);
  const baseSubtotal = fromFils(baseTotalFils);
  const saleDiscount = fromFils(promoSavingsFils);
  const subtotal = fromFils(baseTotalFils - promoSavingsFils);
  const requestedCouponFils = toFils(couponDiscount);
  const clampedCouponFils = Math.min(
    Math.max(0, requestedCouponFils),
    Math.max(0, baseTotalFils - promoSavingsFils)
  );

  return {
    baseSubtotal,
    saleDiscount,
    subtotal,
    combinedDiscount: saleDiscount + fromFils(clampedCouponFils),
  };
}
