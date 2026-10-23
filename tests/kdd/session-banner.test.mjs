import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = path =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const banner = source(
  "../../client/src/kdd/components/ShoppingSessionBanner.tsx"
);
const layout = source("../../client/src/kdd/components/Layout.tsx");
const css = source("../../client/src/kdd/styles.css");

test("the shared layout shows a shopping-session timer unrelated to prices or orders", () => {
  assert.match(layout, /<ShoppingSessionBanner\s*\/>/);
  assert.match(banner, /جلسة التسوق/);
  assert.match(banner, /role="timer"/);
  assert.match(banner, /loadShoppingSession\(browserStorage\(\)\)/);
  assert.match(banner, /getSessionCountdown\(session, now\)/);
  assert.match(banner, /setInterval\(update, 1000\)/);
  assert.match(banner, /clearInterval\(timer\)/);
  assert.match(banner, /!visible \|\| expired/);
  assert.doesNotMatch(
    banner,
    /createOrder|socket\.emit|fetch\(|useCart|product\.price|promo_50_deadline_v2/
  );
});

test("reference shimmer and flame motion retain their exact durations and curves", () => {
  assert.match(css, /animation:\s*kdd-shimmer 3s ease-in-out infinite/);
  assert.match(css, /animation:\s*kdd-promo-bounce 1s infinite/);
  assert.match(css, /transform:\s*translateY\(-25%\)/);
  assert.match(css, /cubic-bezier\(0\.8, 0, 1, 1\)/);
  assert.match(css, /cubic-bezier\(0, 0, 0\.2, 1\)/);
  assert.match(css, /background-position:\s*-200% 0/);
  assert.match(css, /background-position:\s*200% 0/);
});
