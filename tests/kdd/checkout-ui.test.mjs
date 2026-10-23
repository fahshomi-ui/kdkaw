import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkoutUrl = new URL(
  "../../client/src/kdd/pages/Checkout.tsx",
  import.meta.url
);

test("checkout keeps reference delivery layout, linked location selects and mobile controls", async () => {
  const source = await readFile(checkoutUrl, "utf8");
  for (const marker of [
    "h-[160px] md:h-[260px]",
    "lg:grid-cols-3",
    "lg:col-span-2",
    "معلومات التوصيل",
    "البيانات الشخصية",
    "تفاصيل العنوان",
    "وقت التوصيل",
    "طريقة الدفع",
    "KUWAIT_GOVERNORATES",
    "selectedGov.areas",
    "disabled={!governorate}",
    "DeliveryWindowPicker",
    "checkout-mobile-bar",
    "checkout-form",
  ])
    assert.ok(source.includes(marker), marker);
  for (const marker of [
    "checkout-base-subtotal",
    "checkout-promotion-discount",
    "checkout-total",
    "getCheckoutPriceSummary",
  ])
    assert.ok(source.includes(marker), marker);
  assert.match(source, /Navigate\s+to="\/cart"\s+replace/);
});

test("checkout does not read source address records, track typing, or collect card credentials", async () => {
  const source = await readFile(checkoutUrl, "utf8");
  assert.doesNotMatch(
    source,
    /supabase|visitorIdentity|useAddressBook|AddressBookPicker|savePaymentFlowState|localStorage|sessionStorage|\/card-payment|\/credit-card|\/knet-payment|cardNumber|cvv|expiry|otp/i
  );
  assert.match(source, /payment-preview-note/);
  assert.match(source, /طرق الدفع للمعاينة فقط/);
  assert.match(
    source,
    /if\s*\(pending\s*\|\|\s*!showConfirmation\s*\|\|\s*!reviewedOrder\)/
  );
  assert.match(source, /if\s*\(!serverReady\)/);
  assert.equal((source.match(/await createOrder\(/g) || []).length, 1);
  assert.match(source, /setReviewedOrder\(snapshot\)/);
  assert.match(source, /JSON\.stringify\(reviewedOrder\)/);
  const modal = await readFile(
    new URL(
      "../../client/src/kdd/components/CheckoutConfirmationModal.tsx",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(modal, /checkout-confirm-send/);
  assert.doesNotMatch(
    modal,
    /createOrder|supabase|localStorage|sessionStorage|cardNumber|cvv|otp/i
  );
});

test("checkout does not re-label the campaign discount as a coupon and retains governorate", async () => {
  const source = await readFile(checkoutUrl, "utf8");
  assert.doesNotMatch(source, /getCheckoutPriceSummary\(items,\s*discount\)/);
  assert.match(source, /const couponDiscount =/);
  assert.match(source, /couponDiscount > 0/);
  assert.match(source, /money\(couponDiscount\)/);
  assert.match(source, /governorate: selectedGov/);
  assert.match(source, /isDeliverySlotAvailable\(deliverySlot\)/);
  assert.match(source, /isDeliverySlotAvailable\(reviewedOrder\.deliverySlot/);
});

test("cart subtotal displayed with a campaign is its original basis, not the discounted subtotal", async () => {
  const source = await readFile(
    new URL("../../client/src/kdd/contexts/CartContext.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /const subtotal = pricing\.baseSubtotal;/);
});
