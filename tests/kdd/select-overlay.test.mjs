import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL(
  "../../client/src/kdd/styles.css",
  import.meta.url
);
const selectPath = new URL(
  "../../client/src/kdd/components/ui/select.tsx",
  import.meta.url
);

function scopeBlock(source, selector) {
  const match = source.match(
    new RegExp(`${selector.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*\\{([\\s\\S]*?)\\}`)
  );
  assert.ok(match, `${selector} scope must exist in styles.css`);
  return match[1];
}

function assertToken(scope, token, value, label) {
  assert.match(
    scope,
    new RegExp(`--${token}\\s*:\\s*${value}\\s*;`),
    `${label} must define --${token}: ${value}`
  );
}

test("KDD select overlay has opaque light and dark popup theme tokens", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const root = scopeBlock(styles, ":root");
  const dark = scopeBlock(styles, ".dark");

  assertToken(root, "popover", "0 0% 100%", ":root");
  assertToken(root, "popover-foreground", "355 30% 12%", ":root");
  assertToken(dark, "popover", "0 0% 8%", ".dark");
  assertToken(dark, "popover-foreground", "0 0% 92%", ".dark");
});

test("KDD Tailwind theme registers both popup colors", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const theme = styles.match(/@theme\s+inline\s*\{([\s\S]*?)\}/)?.[1];

  assert.ok(theme, "styles.css must define an inline @theme block");
  assert.match(theme, /--color-popover\s*:\s*hsl\(var\(--popover\)\)\s*;/);
  assert.match(
    theme,
    /--color-popover-foreground\s*:\s*hsl\(var\(--popover-foreground\)\)\s*;/
  );
});

test("SelectContent remains a portaled, opaque, high-layer popup", async () => {
  const select = await readFile(selectPath, "utf8");
  const content = select.match(
    /const SelectContent[\s\S]*?SelectContent\.displayName/
  )?.[0];

  assert.ok(content, "SelectContent source must exist");
  assert.match(content, /<SelectPrimitive\.Portal>/);
  assert.match(
    content,
    /relative\s+z-50[\s\S]*\bbg-popover\b[\s\S]*\btext-popover-foreground\b/
  );
});
