import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("client/src/kdd/lib/checkoutPricing.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { getCheckoutPriceSummary } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

function item(price, quantity = 1, oldPrice) {
  const product = { price };
  if (oldPrice !== undefined) product.old_price = oldPrice;
  return { product, quantity };
}

test("public butter uses original price for the 50% campaign base", () => {
  assert.deepEqual(getCheckoutPriceSummary([item(3.5, 1, 7)]), {
    baseSubtotal: 7,
    saleDiscount: 3.5,
    subtotal: 3.5,
    combinedDiscount: 3.5,
  });
});

test("odd half-fils campaign rounds the aggregate promotion discount first", () => {
  assert.deepEqual(getCheckoutPriceSummary([item(0.298, 3, 0.595)]), {
    baseSubtotal: 1.785,
    saleDiscount: 0.893,
    subtotal: 0.892,
    combinedDiscount: 0.893,
  });
});

test("a regular item without old price uses its current price", () => {
  assert.deepEqual(getCheckoutPriceSummary([item(1.235, 2)]), {
    baseSubtotal: 2.47,
    saleDiscount: 0,
    subtotal: 2.47,
    combinedDiscount: 0,
  });
});

test("mixed campaign, custom discount, and coupon prices remain integer-fils based", () => {
  const items = [
    item(5, 1, 10),
    item(4, 2, 10),
    item(1.235, 2),
    item(6, 1, 10),
  ];

  assert.deepEqual(getCheckoutPriceSummary(items, 1.5), {
    baseSubtotal: 26.47,
    saleDiscount: 5,
    subtotal: 21.47,
    combinedDiscount: 6.5,
  });
  assert.deepEqual(getCheckoutPriceSummary(items, 999), {
    baseSubtotal: 26.47,
    saleDiscount: 5,
    subtotal: 21.47,
    combinedDiscount: 26.47,
  });
});
