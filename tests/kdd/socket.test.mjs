import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, stat, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { io as socketClient } from "socket.io-client";
import {
  createJsonOrderRepository,
  createStoreServer,
} from "../../kdd-socket-server/index.mjs";

const TIMEOUT = 2000;
const TEST_ORIGIN = "http://localhost:3000";
const product = {
  id: "test-pizza",
  name_ar: "بيتزا اختبار",
  name_en: "Test Pizza",
  description_ar: null,
  description_en: null,
  price: 10,
  old_price: null,
  image_url: null,
  category_id: "food",
  weight: null,
  origin: null,
  in_stock: true,
  featured: true,
  category: { slug: "food", name_ar: "طعام", name_en: "Food" },
};
const unavailableProduct = {
  ...product,
  id: "sold-out",
  name_ar: "غير متاح",
  name_en: "Sold out",
  price: 9,
  in_stock: false,
};
const catalog = {
  products: [product, unavailableProduct],
  categories: [
    {
      id: "food",
      slug: "food",
      name_ar: "طعام",
      name_en: "Food",
      parent_id: null,
      sort_order: 1,
      image_url: null,
      icon: null,
      children: [],
    },
  ],
};

let app;
let baseUrl;
let ordersDirectory;

function connect(origin = TEST_ORIGIN) {
  return new Promise((resolve, reject) => {
    const client = socketClient(baseUrl, {
      transports: ["polling"],
      reconnection: false,
      timeout: TIMEOUT,
      forceNew: true,
      extraHeaders: origin === undefined ? {} : { Origin: origin },
    });
    const timer = setTimeout(() => {
      client.close();
      reject(new Error("connection timeout"));
    }, TIMEOUT);
    client.once("connect", () => {
      clearTimeout(timer);
      resolve(client);
    });
    client.once("connect_error", error => {
      clearTimeout(timer);
      client.close();
      reject(error);
    });
  });
}

function call(client, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`ACK timeout for ${event}`)),
      TIMEOUT
    );
    client.emit(event, payload, response => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

function draft(requestId = randomUUID()) {
  return {
    requestId,
    customer: {
      name: "عميل اختبار",
      phone: "0500000000",
      area: "منطقة اختبار",
    },
    items: [{ productId: product.id, quantity: 2, preparations: ["بدون بصل"] }],
    deliverySlot: { date: "2026-12-01", window: "12:00-13:00" },
  };
}

before(async () => {
  ordersDirectory = await mkdtemp(path.join(os.tmpdir(), "kdd-socket-orders-"));
  app = createStoreServer({
    catalog,
    allowedOrigins: [TEST_ORIGIN],
    orderRepository: createJsonOrderRepository(ordersDirectory),
  });
  const address = await app.listen(0, "127.0.0.1");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await app?.close();
  if (ordersDirectory)
    await rm(ordersDirectory, { recursive: true, force: true });
});

test("catalog returns the configured synthetic catalog", async () => {
  const client = await connect();
  try {
    const response = await call(client, "kdd:catalog:get", {});
    assert.deepEqual(response, { ok: true, data: catalog });
  } finally {
    client.close();
  }
});

test("payload whitelist and origin policy reject unsafe requests", async () => {
  const client = await connect();
  try {
    const unknownField = await call(client, "kdd:catalog:get", {
      payment: { cardNumber: "x" },
    });
    assert.equal(unknownField.ok, false);
    assert.match(unknownField.error, /^UNEXPECTED_FIELD:/);

    const paymentField = await call(client, "kdd:order:create", {
      ...draft(),
      bankAccount: "123",
    });
    assert.equal(paymentField.ok, false);
    assert.match(paymentField.error, /^UNEXPECTED_FIELD:/);
  } finally {
    client.close();
  }

  await new Promise(resolve => {
    const client = socketClient(baseUrl, {
      transports: ["polling"],
      reconnection: false,
      timeout: TIMEOUT,
      forceNew: true,
      extraHeaders: { Origin: "https://not-allowed.example" },
    });
    const timer = setTimeout(() => {
      client.close();
      assert.fail("disallowed origin unexpectedly connected");
    }, TIMEOUT);
    client.once("connect_error", error => {
      clearTimeout(timer);
      assert.match(error.message, /ORIGIN_NOT_ALLOWED|xhr poll error/i);
      client.close();
      resolve();
    });
  });
});

test("cart is socket-isolated and validates product availability", async () => {
  const first = await connect();
  const second = await connect();
  try {
    const firstCart = await call(first, "kdd:cart:update", {
      items: [{ productId: product.id, quantity: 2 }],
    });
    assert.deepEqual(firstCart.data, {
      items: [{ productId: product.id, quantity: 2 }],
      subtotal: 20,
      discount: 0,
      deliveryFee: 0,
      total: 20,
    });
    const secondCart = await call(second, "kdd:cart:update", { items: [] });
    assert.deepEqual(secondCart.data, {
      items: [],
      subtotal: 0,
      discount: 0,
      deliveryFee: 0,
      total: 0,
    });

    const unknown = await call(second, "kdd:cart:update", {
      items: [{ productId: "missing", quantity: 1 }],
    });
    assert.deepEqual(unknown, { ok: false, error: "UNKNOWN_PRODUCT" });
    const unavailable = await call(second, "kdd:cart:update", {
      items: [{ productId: unavailableProduct.id, quantity: 1 }],
    });
    assert.deepEqual(unavailable, { ok: false, error: "PRODUCT_UNAVAILABLE" });
  } finally {
    first.close();
    second.close();
  }

  const reconnected = await connect();
  try {
    const freshCart = await call(reconnected, "kdd:cart:update", { items: [] });
    assert.equal(freshCart.ok, true);
    assert.deepEqual(freshCart.data.items, []);
  } finally {
    reconnected.close();
  }
});

test("coupon validation is explicit null without a configured coupon source", async () => {
  const client = await connect();
  try {
    assert.deepEqual(
      await call(client, "kdd:coupon:validate", { code: "ANY-CODE" }),
      { ok: true, data: null }
    );
    const bad = await call(client, "kdd:coupon:validate", {
      code: "ANY-CODE",
      discount_percent: 90,
    });
    assert.equal(bad.ok, false);
    assert.match(bad.error, /^UNEXPECTED_FIELD:/);
  } finally {
    client.close();
  }
});

test("orders are persisted, ACKed after persistence, and idempotent", async () => {
  const client = await connect();
  const requestId = randomUUID();
  const order = draft(requestId);
  order.customer.governorate = "العاصمة";
  try {
    const first = await call(client, "kdd:order:create", order);
    assert.equal(first.ok, true);
    assert.equal(first.data.status, "received");
    assert.equal(first.data.total, 20);
    assert.match(first.data.orderId, /^[0-9a-f-]{36}$/i);

    const files = await readdir(ordersDirectory);
    assert.deepEqual(files, [`${first.data.orderId}.json`]);
    const fileStat = await stat(path.join(ordersDirectory, files[0]));
    assert.equal(fileStat.mode & 0o777, 0o600);
    const persisted = JSON.parse(
      await readFile(path.join(ordersDirectory, files[0]), "utf8")
    );
    assert.equal(persisted.draft.customer.governorate, "العاصمة");
    assert.equal(persisted.requestId, requestId);
    assert.deepEqual(persisted.receipt, first.data);

    const duplicate = await call(client, "kdd:order:create", order);
    assert.deepEqual(duplicate, first);

    const different = await call(client, "kdd:order:create", {
      ...order,
      customer: { ...order.customer, phone: "0511111111" },
    });
    assert.deepEqual(different, {
      ok: false,
      error: "REQUEST_ID_REUSE_DIFFERENT_PAYLOAD",
    });
  } finally {
    client.close();
  }
});

test("order creation is rejected clearly when durable storage is not configured", async () => {
  const noStorage = createStoreServer({
    catalog,
    allowedOrigins: [TEST_ORIGIN],
  });
  const address = await noStorage.listen(0, "127.0.0.1");
  const oldBaseUrl = baseUrl;
  baseUrl = `http://127.0.0.1:${address.port}`;
  const client = await connect();
  try {
    const response = await call(client, "kdd:order:create", draft());
    assert.deepEqual(response, {
      ok: false,
      error: "ORDER_STORAGE_NOT_CONFIGURED",
    });
  } finally {
    client.close();
    await noStorage.close();
    baseUrl = oldBaseUrl;
  }
});

test("distinct preparation lines are valid, fees match the storefront, quantity limit is enforced", async () => {
  const client = await connect();
  try {
    const result = await call(client, "kdd:cart:update", {
      items: [
        { productId: product.id, quantity: 1, preparations: ["skin"] },
        { productId: product.id, quantity: 1, preparations: ["fillet"] },
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.data.total, 20.75);
    const duplicate = await call(client, "kdd:cart:update", {
      items: [
        { productId: product.id, quantity: 1, preparations: ["skin"] },
        { productId: product.id, quantity: 1, preparations: ["skin"] },
      ],
    });
    assert.deepEqual(duplicate, { ok: false, error: "DUPLICATE_PRODUCT" });
    const excessive = await call(client, "kdd:cart:update", {
      items: [{ productId: product.id, quantity: 100 }],
    });
    assert.deepEqual(excessive, { ok: false, error: "INVALID_QUANTITY" });
  } finally {
    client.close();
  }
});

test("KWD catalog prices retain three-decimal precision", async () => {
  const temporaryApp = createStoreServer({
    catalog: { ...catalog, products: [{ ...product, price: 1.235 }] },
    allowedOrigins: [TEST_ORIGIN],
  });
  const address = await temporaryApp.listen(0, "127.0.0.1");
  const previousBaseUrl = baseUrl;
  baseUrl = `http://127.0.0.1:${address.port}`;
  const client = await connect();
  try {
    const result = await call(client, "kdd:cart:update", {
      items: [{ productId: product.id, quantity: 1 }],
    });
    assert.equal(result.ok, true);
    assert.equal(result.data.subtotal, 1.235);
    assert.equal(result.data.total, 1.235);
  } finally {
    client.close();
    await temporaryApp.close();
    baseUrl = previousBaseUrl;
  }
});
