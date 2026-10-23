import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pageUrl = new URL(
  "../../client/src/kdd/pages/Checkout.tsx",
  import.meta.url
);
const modalUrl = new URL(
  "../../client/src/kdd/components/CheckoutConfirmationModal.tsx",
  import.meta.url
);

test("Confirm order always opens a local review, including incomplete fields, without native hidden-select validation blocking it", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert.match(
    page,
    /id="checkout-form"\s+noValidate\s+onSubmit=\{handleReview\}/
  );
  const handler = page.slice(
    page.indexOf("const handleReview ="),
    page.indexOf("// This is the only network submission")
  );
  assert.match(handler, /event\.preventDefault\(\)/);
  assert.match(handler, /setReviewedOrder\(snapshot\)/);
  assert.match(handler, /setShowConfirmation\(true\)/);
  assert.match(handler, /const missingDetails =/);
  assert.equal(
    (handler.match(/return;/g) || []).length,
    1,
    "only pending or empty-cart early return is allowed"
  );
  assert.doesNotMatch(handler, /createOrder|fetch\(|emit\(/);
  assert.match(page, /reviewedOrder\.customer\.governorate\?\.trim/);
  assert.match(page, /if\s*\(!serverReady\)/);
});

test("review uses immutable item names, quantities, amounts and chosen payment preview instead of live cart values", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert.match(page, /setReviewDetails\(\{/);
  assert.match(page, /lines:\s*items\.map/);
  for (const marker of [
    "quantity: item.quantity",
    "lineTotal:",
    "originalTotal:",
    "paymentMethod,",
    "campaignDiscount: pricing.saleDiscount",
    "details={reviewDetails}",
    "customer={reviewedOrder.customer}",
  ])
    assert.ok(page.includes(marker), marker);
  const modal = await readFile(modalUrl, "utf8");
  assert.doesNotMatch(
    modal,
    /useCart|createOrder|fetch\(|emit\(|localStorage|sessionStorage|supabase|cardNumber|cvv|\/card-payment|\/knet-payment/i
  );
});

test("reference modal retains delivery, products, payment preview, totals, edit and close with guarded confirmation", async () => {
  const modal = await readFile(modalUrl, "utf8");
  for (const marker of [
    "تأكيد المعلومات والدفع",
    "معلومات التوصيل",
    "طريقة الدفع",
    "confirmation-products",
    "confirmation-payment",
    "confirmation-subtotal",
    "confirmation-discount",
    "confirmation-total",
    "checkout-confirm-send",
    "checkout-confirm-modal",
    "backdrop-blur-sm",
    "bg-black/50",
    "sm:max-w-md",
    "createPortal",
    "Escape",
    "Tab",
    "تعديل",
  ])
    assert.ok(modal.includes(marker), marker);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /onClick=\{onConfirm\}/);
  assert.match(
    modal,
    /disabled=\{(?:pending\s*\|\|\s*!canSend|!canSend\s*\|\|\s*pending)\}/
  );
});
