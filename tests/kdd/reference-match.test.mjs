import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createStoreServer } from "../../kdd-socket-server/index.mjs";
import { io } from "socket.io-client";

const catalog = JSON.parse(
  await readFile("client/src/kdd/data/catalog.json", "utf8")
);
const reference = JSON.parse(
  await readFile("client/src/kdd/data/reference-prices.json", "utf8")
);
const layout = JSON.parse(
  await readFile("client/src/kdd/data/reference-layout.json", "utf8")
);
const flatten = nodes =>
  nodes.flatMap(node => [node, ...flatten(node.children || [])]);

test("all 159 product identities, names, displayed prices, previous prices and discounts match the reference", () => {
  assert.equal(reference.length, 159);
  assert.deepEqual(
    catalog.products.map(product => product.id),
    layout.allProductOrder
  );
  const actual = new Map(
    catalog.products.map(product => [product.id, product])
  );
  for (const expected of reference) {
    const product = actual.get(expected.id);
    assert.equal(product.name_ar, expected.name_ar);
    assert.equal(product.price.toFixed(3), expected.priceText, expected.id);
    assert.equal(
      product.old_price.toFixed(3),
      expected.oldPriceText,
      expected.id
    );
    assert.equal(
      `-${Math.round((1 - product.price / product.old_price) * 100)}%`,
      expected.discountText,
      expected.id
    );
  }
});

test("all 27 reference categories and six home product sections are retained", () => {
  const categories = flatten(catalog.categories);
  assert.equal(categories.length, 27);
  assert.deepEqual(
    categories.map(category => category.slug),
    layout.categoryLinks.map(link => link.slug)
  );
  assert.deepEqual(
    layout.headerTabs.map(tab => tab.label),
    ["الرئيسية", "منتجات كي دي دي", "كل المنتجات"]
  );
  assert.deepEqual(layout.familyOrder, [
    "kdd-dairy",
    "kdd-juices",
    "kdd-icecream",
    "kdd-cooking",
  ]);
  const ids = new Set(catalog.products.map(product => product.id));
  assert.equal(Object.keys(layout.homeProductSections).length, 6);
  for (const section of Object.values(layout.homeProductSections)) {
    assert.equal(section.length, 12);
    assert.ok(section.every(id => ids.has(id)));
  }
});

test("saved cart product prices are refreshed from the current catalog without a second discount", async () => {
  const context = await readFile(
    "client/src/kdd/contexts/CartContext.tsx",
    "utf8"
  );
  assert.ok(context.includes("productsById.get(item.product.id)"));
  assert.ok(!/item\.product\.price\s*\*\s*0\.5/.test(context));
});

test("Socket.IO default catalog serves the same discounted price as the UI", async () => {
  const app = createStoreServer({ allowedOrigins: ["http://localhost:5173"] });
  const address = await app.listen(0, "127.0.0.1");
  const client = io(`http://127.0.0.1:${address.port}`, {
    transports: ["polling"],
    reconnection: false,
    extraHeaders: { Origin: "http://localhost:5173" },
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Connection timeout")),
        3000
      );
      client.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      client.once("connect_error", error => {
        clearTimeout(timer);
        reject(error);
      });
    });
    const result = await new Promise((resolve, reject) =>
      client
        .timeout(3000)
        .emit("kdd:catalog:get", {}, (error, reply) =>
          error ? reject(error) : resolve(reply)
        )
    );
    assert.equal(result.ok, true);
    assert.equal(result.data.products[0].price, catalog.products[0].price);
    const vanilla = result.data.products.find(
      product => product.id === "57c9139b-ec7e-4d73-8a3e-e864f0df1b31"
    );
    assert.equal(vanilla.price, 1.98);
    assert.equal(vanilla.old_price, 3.96);
  } finally {
    client.close();
    await app.close();
  }
});
