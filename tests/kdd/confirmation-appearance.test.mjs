import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL(
    "../../client/src/kdd/components/CheckoutConfirmationModal.tsx",
    import.meta.url
  ),
  "utf8"
);
const listStart = source.indexOf('data-testid="confirmation-product-list"');
const list = source.slice(listStart, source.indexOf("</section>", listStart));

test("confirmation panel keeps reference width, rounded border and sticky compact header", () => {
  for (const value of [
    "sm:max-w-md",
    "rounded-2xl",
    "border-border/50",
    "max-h-[85vh]",
  ])
    assert.ok(source.includes(value), value);
  const header = source.match(/<header[\s\S]*?<\/header>/)?.[0];
  for (const value of ["sticky", "px-4", "py-3"])
    assert.ok(header.includes(value), value);
});
test("reference section headings are bold and muted; the product list inherits RTL", () => {
  assert.match(source, /className="[^"]*font-black[^"]*text-muted-foreground/);
  assert.match(
    source,
    /aria-modal="true"[\s\S]*?dir=\{isArabic \? "rtl" : "ltr"\}/
  );
  assert.ok(listStart >= 0);
  assert.doesNotMatch(list, /\bdir\s*=/);
});
test("product list has the 120px cap and a thin scrollbar, with no product photos", () => {
  assert.match(list, /max-h-\[120px\]/);
  assert.match(list, /overflow-y-auto/);
  assert.match(list, /scrollbarWidth:\s*["']thin["']/);
  assert.match(list, /scrollbarColor:/);
  assert.doesNotMatch(list, /<img\b/);
});
test("product row keeps struck original and three-decimal current prices without changing amounts", () => {
  assert.match(list, /originalTotal\.toFixed\(3\)/);
  assert.match(list, /line-through/);
  assert.match(list, /lineTotal\.toFixed\(3\)/);
});
test("campaign discount is green and negative; total uses the existing red brand color", () => {
  const discount = source.match(
    /data-testid="confirmation-discount"[\s\S]*?<\/div>/
  )?.[0];
  const total = source.match(
    /data-testid="confirmation-total"[\s\S]*?<\/div>/
  )?.[0];
  assert.match(
    discount,
    /-\{money\(details\.totals\.campaignDiscount, lang\)\}/
  );
  assert.match(discount, /text-emerald-500/);
  assert.match(total, /text-primary/);
});
test("visual edit/send sizes retain the separate guarded confirmation and no external data access", () => {
  const footer = source.match(/<footer[\s\S]*?<\/footer>/)?.[0];
  assert.match(footer, /className="flex-1/);
  assert.match(footer, /className="flex-\[2\]/);
  assert.match(footer, /onClick=\{onConfirm\}/);
  assert.match(footer, /disabled=\{!canSend \|\| pending\}/);
  assert.doesNotMatch(
    source,
    /\bfetch\s*\(|\b(?:localStorage|sessionStorage)\b|supabase|createOrder/
  );
});
