import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile('client/src/kdd/lib/storeUtils.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { newRequestId, normalizeCatalog } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

for (const mode of ['native', 'fallback', 'no-crypto']) {
  test(`request identifier remains valid UUID: ${mode}`, () => {
    const idSource = mode === 'native' ? { randomUUID: () => '00000000-0000-4000-8000-000000000000' }
      : mode === 'fallback' ? { randomUUID: () => { throw new Error('unsupported'); }, getRandomValues: bytes => { bytes.fill(10); return bytes; } } : {};
    assert.match(newRequestId(idSource), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
}

test('category metadata is resolved from category_id without modifying the source', () => {
  const input = { products: [{ id: 'test', category_id: 'dairy', category: null }], categories: [{ id: 'dairy', slug: 'dairy', name_ar: 'ألبان اختبار', name_en: 'Test dairy', children: [] }] };
  const normalized = normalizeCatalog(input);
  assert.equal(normalized.products[0].category.slug, 'dairy');
  assert.equal(input.products[0].category, null);
});
