import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const headerPath = resolve(here, "../../client/src/kdd/components/Header.tsx");
const source = readFileSync(headerPath, "utf8");

function between(start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing source marker: ${start}`);
  const to = end ? source.indexOf(end, from) : source.length;
  assert.notEqual(to, -1, `missing source marker: ${end}`);
  return source.slice(from, to);
}

test("mega-menu flyout keeps the full-width centered card structure", () => {
  const flyout = between(
    'data-testid="kdd-products-mega-menu"',
    'data-testid="kdd-products-menu-grid"'
  );
  for (const token of [
    "absolute",
    "inset-x-0",
    "top-full",
    "flex",
    "justify-center",
    "w-[min(95vw,980px)]",
    "rounded-2xl",
    "border",
    "bg-card",
    "p-6",
    "shadow-2xl",
  ]) {
    assert.ok(flyout.includes(token), `missing utility token: ${token}`);
  }
});

test("mega-menu header stays simplified and exposes shop-all", () => {
  const header = between("<h3", 'data-testid="kdd-products-menu-grid"');
  assert.match(header, /font-cairo/);
  assert.match(header, /font-black/);
  assert.match(header, /Shop All|تسوّق الكل/);
  assert.doesNotMatch(header, /kdd-icon-button|h-10/);
  assert.doesNotMatch(header, /subtitle|Categories|الفئات/);
});

test("menu grid preserves four columns, bounded scrolling, and themed scrollbar", () => {
  const grid = between('data-testid="kdd-products-menu-grid"', "{families.map");
  for (const token of [
    "grid",
    "md:grid-cols-4",
    "max-h-[min(60vh,240px)]",
    "overflow-y-scroll",
  ]) {
    assert.ok(grid.includes(token), `missing grid token: ${token}`);
  }
  assert.match(grid, /scrollbarWidth:\s*["']thin["']/);
  assert.match(
    grid,
    /scrollbarColor:\s*["']hsl\(var\(--primary\).*hsl\(var\(--muted\)/
  );
});

test("retain category routes, typography, and close callbacks without counts", () => {
  const menu = between(
    'data-testid="kdd-products-menu-grid"',
    "</div>\n              </div>\n            </div>"
  );
  assert.match(menu, /families\.map\(family/);
  assert.match(menu, /\(family\.children \?\? \[\]\)\.map\(leaf/);
  assert.match(menu, /to=\{`\/category\/\$\{family\.slug\}`\}/);
  assert.match(menu, /to=\{`\/category\/\$\{leaf\.slug\}`\}/);
  assert.match(menu, /labelFor\(family, lang\)/);
  assert.match(menu, /labelFor\(leaf, lang\)/);
  assert.match(menu, /onClick=\{\(\) => setOpenSection\(false\)\}/);
  assert.match(menu, /font-cairo/);
  assert.match(menu, /text-foreground/);
  assert.match(menu, /text-muted-foreground/);
  assert.doesNotMatch(source, /countFor|product_count|getProductCount/);
  assert.match(source, /const \{ totalItems \} = useCart\(\);/);
  assert.match(source, /\{totalItems\}/);
});

test("desktop products navigation keeps a continuous full-height hover region", () => {
  const nav = between(
    '<nav className="hidden',
    '<Link\n            to="/products"'
  );
  assert.match(nav, /self-stretch/);
  assert.match(nav, /onMouseEnter=\{openProductsMenu\}/);
  assert.match(nav, /onMouseLeave=\{scheduleMenuClose\}/);
  assert.match(nav, /className="static flex h-full items-center"/);
  assert.match(nav, /data-testid="kdd-products-mega-menu"/);
  assert.match(nav, /onMouseEnter=\{openProductsMenu\}/);
});

test("products menu close timer is cancelable across re-entry, pathname changes, and unmount", () => {
  const timer = between(
    "const cancelMenuClose = useCallback",
    "const [localPanel"
  );
  assert.match(timer, /clearTimeout\(menuCloseTimer\.current\)/);
  assert.match(timer, /setTimeout\(\(\) => \{/);
  assert.match(timer, /\}, 180\);/);
  assert.match(timer, /const openProductsMenu = useCallback\(\(\) => \{/);
  assert.match(timer, /cancelMenuClose\(\);[\s\S]*setOpenSection\(true\)/);

  const lifecycle = between(
    "useEffect(() => cancelMenuClose, [cancelMenuClose]);",
    "useEffect(() => {\n    try"
  );
  assert.match(
    lifecycle,
    /useEffect\(\(\) => cancelMenuClose, \[cancelMenuClose\]\)/
  );
  assert.match(source, /\}, \[pathname, cancelMenuClose\]\);/);
  assert.match(
    source,
    /useEffect\(\(\) => cancelMenuClose, \[cancelMenuClose\]\)/
  );
});
