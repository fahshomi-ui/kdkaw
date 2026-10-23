import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sourcePath = fileURLToPath(new URL('../../client/src/kdd/components/DeliveryWindowPicker.tsx', import.meta.url));
const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const tempDirectory = await mkdtemp(join(projectRoot, '.kdd-delivery-slot-'));
const outputPath = join(tempDirectory, 'DeliveryWindowPicker.mjs');
const contextStubPath = join(tempDirectory, 'LanguageContext.mjs');

await writeFile(contextStubPath, 'export const useLanguage = () => ({ lang: "en" });\n');

let isDeliverySlotAvailable;
try {
  await build({
    entryPoints: [resolve(sourcePath)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: outputPath,
    external: ['react', 'lucide-react'],
    plugins: [{
      name: 'stub-kdd-language-context',
      setup(buildApi) {
        buildApi.onResolve({ filter: /^@\/kdd\/contexts\/LanguageContext$/ }, () => ({ path: contextStubPath }));
      },
    }],
  });
  ({ isDeliverySlotAvailable } = await import(`${pathToFileURL(outputPath).href}?test=${Date.now()}`));
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}

const localDate = (year, month, day, hour, minute = 0) =>
  new Date(year, month - 1, day, hour, minute, 0, 0);
const slot = (date, window) => ({ date, window });


test('past dates, invalid calendar dates, invalid windows, and null are unavailable', () => {
  const now = localDate(2025, 6, 15, 8);
  assert.equal(isDeliverySlotAvailable(slot('2025-06-14', 'morning'), now), false);
  assert.equal(isDeliverySlotAvailable(slot('2025-02-29', 'morning'), now), false);
  assert.equal(isDeliverySlotAvailable(slot('2025-06-15', 'afternoon'), now), false);
  assert.equal(isDeliverySlotAvailable(null, now), false);
});

test('today closes each window at its local start-hour boundary', () => {
  const date = '2025-06-15';
  assert.equal(isDeliverySlotAvailable(slot(date, 'morning'), localDate(2025, 6, 15, 8, 59)), true);
  assert.equal(isDeliverySlotAvailable(slot(date, 'morning'), localDate(2025, 6, 15, 9)), false);
  assert.equal(isDeliverySlotAvailable(slot(date, 'evening'), localDate(2025, 6, 15, 14, 59)), true);
  assert.equal(isDeliverySlotAvailable(slot(date, 'evening'), localDate(2025, 6, 15, 15)), false);
  assert.equal(isDeliverySlotAvailable(slot(date, 'night'), localDate(2025, 6, 15, 18, 59)), true);
  assert.equal(isDeliverySlotAvailable(slot(date, 'night'), localDate(2025, 6, 15, 19)), false);
});

test('future local dates remain valid regardless of the current hour', () => {
  const now = localDate(2025, 6, 15, 23, 59);
  assert.equal(isDeliverySlotAvailable(slot('2025-06-16', 'morning'), now), true);
  assert.equal(isDeliverySlotAvailable(slot('2025-06-20', 'night'), now), true);
});
