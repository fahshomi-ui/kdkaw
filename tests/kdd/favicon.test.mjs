import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const indexHtml = fs.readFileSync(path.join(projectRoot, 'client/index.html'), 'utf8');
const publicDir = path.join(projectRoot, 'client/kdd-public');

function iconLinks(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
}

test('declares the KDD PNG and shortcut ICO favicon links with cache queries', () => {
  const links = iconLinks(indexHtml);
  assert.match(
    indexHtml,
    /<link\b[^>]*rel=["']icon["'][^>]*type=["']image\/png["'][^>]*href=["']\/kdd-favicon\.png\?[^"']+["'][^>]*>/i,
  );
  assert.match(
    indexHtml,
    /<link\b[^>]*rel=["']shortcut icon["'][^>]*type=["']image\/x-icon["'][^>]*href=["']\/favicon\.ico\?[^"']+["'][^>]*>/i,
  );
  assert.equal(links.filter((link) => /\brel=["']icon["']/i.test(link)).length, 1);
  assert.equal(links.filter((link) => /\brel=["']shortcut icon["']/i.test(link)).length, 1);
});

test('validates PNG signature and 32x32 IHDR plus ICO header and 16/32/48 entries', () => {
  const png = fs.readFileSync(path.join(publicDir, 'kdd-favicon.png'));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.subarray(12, 16).toString('ascii'), 'IHDR');
  assert.equal(png.readUInt32BE(16), 32);
  assert.equal(png.readUInt32BE(20), 32);

  const ico = fs.readFileSync(path.join(publicDir, 'favicon.ico'));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  const dimensions = [];
  for (let i = 0; i < 3; i += 1) {
    const entry = 6 + i * 16;
    dimensions.push([ico[entry] || 256, ico[entry + 1] || 256]);
  }
  assert.deepEqual(dimensions, [[16, 16], [32, 32], [48, 48]]);
});

test('icon links do not use legacy app paths or external sources', () => {
  const links = iconLinks(indexHtml).filter((link) => /\brel=["'](?:icon|shortcut icon)["']/i.test(link));
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.doesNotMatch(link, /(?:old|bank|admin|Pmnt)/i);
    assert.doesNotMatch(link, /ExternalSource/i);
    assert.doesNotMatch(link, /https?:\/\//i);
    assert.doesNotMatch(link, /\/\//i);
  }
});
