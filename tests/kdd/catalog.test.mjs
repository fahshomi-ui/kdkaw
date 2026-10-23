import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createStoreServer } from "../../kdd-socket-server/index.mjs";
import { io } from "socket.io-client";

const catalog = JSON.parse(
  await readFile("client/src/kdd/data/catalog.json", "utf8")
);
const gallery = JSON.parse(
  await readFile("client/src/kdd/data/product-images.json", "utf8")
);
const info = JSON.parse(
  await readFile("client/src/kdd/data/catalog-info.json", "utf8")
);
const flatten = nodes =>
  nodes.flatMap(node => [node, ...flatten(node.children || [])]);

test("approved catalog includes 159 real products and 27 category nodes", () => {
  assert.equal(catalog.products.length, 159);
  assert.equal(flatten(catalog.categories).length, 27);
  assert.equal(new Set(catalog.products.map(product => product.id)).size, 159);
  for (const product of catalog.products) {
    assert.ok(product.name_ar && product.name_en);
    assert.equal(typeof product.price, "number");
    assert.ok(Number.isFinite(product.price) && product.price >= 0);
    assert.ok(product.category?.slug && product.category_id);
  }
  assert.deepEqual(info.tablesRead, [
    "products",
    "categories",
    "product_images",
  ]);
  assert.equal(info.imageFailures.length, 0);
});

test("all approved catalog images are local files and no credentials are exported", async () => {
  const rows = [
    ...catalog.products,
    ...flatten(catalog.categories),
    ...gallery,
  ];
  const images = new Set(rows.map(row => row.image_url).filter(Boolean));
  for (const image of images) {
    assert.match(
      image,
      /^\/catalog\/images\/[a-f0-9]+\.(?:png|jpg|webp|gif|avif|svg)$/
    );
    assert.ok(
      (await stat(resolve("client/kdd-public", image.slice(1)))).size > 0
    );
  }
  assert.ok(images.size > 100);
  assert.equal(gallery.length, 159);
  assert.ok(
    !/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.|sb_(?:secret|publishable)_/.test(
      JSON.stringify(catalog)
    )
  );
});

test("frontend bootstraps the saved catalog and uses Socket.IO only when connected", async () => {
  const hooks = await readFile("client/src/kdd/hooks/useStore.ts", "utf8");
  assert.match(hooks, /initialData:\s*initialCatalog/);
  assert.match(hooks, /enabled:\s*connection\s*===\s*['"]connected['"]/);
  for (const page of ["Index", "Products", "Category", "ProductDetail"]) {
    const source = await readFile(`client/src/kdd/pages/${page}.tsx`, "utf8");
    assert.ok(
      !/if\s*\(connection\s*===\s*['"]not-configured['"]\)/.test(source),
      `${page} must not hide saved products`
    );
  }
});

test("new Socket.IO server returns the shipped real catalog by default", async () => {
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
    assert.equal(result.data.products.length, 159);
    assert.equal(flatten(result.data.categories).length, 27);
  } finally {
    client.close();
    await app.close();
  }
});
