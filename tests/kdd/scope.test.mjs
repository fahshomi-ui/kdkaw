import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const root = resolve('client/src/kdd');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map(entry =>
    entry.isDirectory() ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]));
  return results.flat();
}

test('المتجر الجديد لا يستورد صفحات الدفع أو خدمات التتبع القديمة', async () => {
  const sources = (await files(root)).filter(path => /\.[cm]?[jt]sx?$/.test(path));
  assert.ok(sources.length > 5);
  for (const path of sources) {
    const content = await readFile(path, 'utf8');
    const imports = [...content.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const specifier of imports) {
      assert.ok(!/supabase|visitorIdentity|useVisitorTracker|usePaymentSession|paymentFlowState|adminAuth/i.test(specifier), `${relative(root,path)}: forbidden import ${specifier}`);
      if (specifier.startsWith('@/')) assert.ok(specifier.startsWith('@/kdd/'), `${relative(root,path)} imports old namespace`);
    }
    assert.ok(!/['"]\/(?:credit-card-payment|card-payment|card-otp|card-pin|knet-payment|knet-otp|otp-verification|atm-password|cvv)(?:[/'"])/i.test(content), `${relative(root,path)} links payment route`);
  }
});

test('إتمام الطلب لا يرسل البيانات الشخصية عند الكتابة ولا يحوّل إلى الدفع', async () => {
  const checkout = await readFile(resolve(root,'pages/Checkout.tsx'),'utf8');
  assert.ok(!/supabase|payment_sessions|visitor_session_id|window\.location|savePaymentFlowState/.test(checkout));
  assert.ok(/createOrder/.test(checkout));
  assert.ok(/requestId/.test(checkout));
});

test('مدخل HTML والبناء محصوران في واجهة المتجر الجديدة', async () => {
  const html = await readFile(resolve('client/index.html'),'utf8');
  assert.ok(html.includes('/src/kdd-main.tsx'));
  assert.ok(!html.includes('/src/main.tsx'));
  const config = await readFile(resolve('vite.kdd.config.ts'),'utf8');
  assert.match(config, /envDir:\s*path\.resolve\(import\.meta\.dirname,\s*['"]kdd-config['"]\)/);
  assert.match(config, /publicDir:\s*['"]kdd-public['"]/);
  const app = await readFile(resolve(root,'StorefrontApp.tsx'),'utf8');
  assert.ok(app.includes('connectStorefront()'));
});
