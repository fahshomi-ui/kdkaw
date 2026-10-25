import { createServer as createHttpServer } from "node:http";
import { promises as fs, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Server as SocketIOServer } from "socket.io";

// [fix] مفتاح المتجر
const STORE = process.env.STORE_ID || process.env.STORE || 'kdkaw';


const MODULE_FILE = fileURLToPath(import.meta.url);
const DEFAULT_CATALOG = Object.freeze({ products: [], categories: [] });
const MAX_EVENTS_PER_MINUTE = 120;
const MAX_ITEMS = 100;
const MAX_QUANTITY = 99;
const MAX_PREPARATIONS = 20;
const MAX_PREPARATION_LENGTH = 120;
const MAX_EVENT_BYTES = 64 * 1024;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class StoreError extends Error {
  constructor(code) {
    super(code);
    this.name = "StoreError";
    this.code = code;
  }
}

function fail(code) {
  throw new StoreError(code);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertExactKeys(value, allowed, scope) {
  if (!isPlainObject(value)) fail("INVALID_PAYLOAD");
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`UNEXPECTED_FIELD:${scope}.${key}`);
  }
}

function requiredString(value, max, code = "INVALID_STRING") {
  if (typeof value !== "string" || value.length === 0 || value.length > max)
    fail(code);
  return value;
}

function optionalString(value, max, code = "INVALID_STRING") {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > max) fail(code);
  return value;
}

function nullableString(value, max, code = "INVALID_STRING") {
  if (value === null || value === undefined) return null;
  return requiredString(value, max, code);
}

function finiteNonNegative(value, code = "INVALID_NUMBER") {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    fail(code);
  return value;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, stableValue(value[key])])
    );
  }
  return value;
}

function payloadHash(value) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function normalizeCategoryNode(input, depth = 0) {
  if (depth > 20) fail("CATALOG_INVALID");
  assertExactKeys(
    input,
    new Set([
      "id",
      "slug",
      "name_ar",
      "name_en",
      "parent_id",
      "sort_order",
      "image_url",
      "icon",
      "children",
    ]),
    "catalog.category"
  );
  const children = input.children ?? [];
  if (!Array.isArray(children) || children.length > 1000)
    fail("CATALOG_INVALID");
  return {
    id: requiredString(input.id, 128, "CATALOG_INVALID"),
    slug: requiredString(input.slug, 128, "CATALOG_INVALID"),
    name_ar: requiredString(input.name_ar, 256, "CATALOG_INVALID"),
    name_en: requiredString(input.name_en, 256, "CATALOG_INVALID"),
    parent_id:
      input.parent_id === null || input.parent_id === undefined
        ? null
        : requiredString(input.parent_id, 128, "CATALOG_INVALID"),
    sort_order:
      input.sort_order === undefined
        ? 0
        : Number.isInteger(input.sort_order)
          ? input.sort_order
          : fail("CATALOG_INVALID"),
    image_url: nullableString(input.image_url, 2048, "CATALOG_INVALID"),
    icon: nullableString(input.icon, 256, "CATALOG_INVALID"),
    children: children.map(child => normalizeCategoryNode(child, depth + 1)),
  };
}

function normalizeProduct(input) {
  assertExactKeys(
    input,
    new Set([
      "id",
      "name_ar",
      "name_en",
      "description_ar",
      "description_en",
      "price",
      "old_price",
      "image_url",
      "category_id",
      "weight",
      "origin",
      "in_stock",
      "featured",
      "category",
    ]),
    "catalog.product"
  );
  let category = null;
  if (input.category !== null && input.category !== undefined) {
    if (!isPlainObject(input.category)) fail("CATALOG_INVALID");
    assertExactKeys(
      input.category,
      new Set(["slug", "name_ar", "name_en"]),
      "catalog.product.category"
    );
    category = {
      slug: requiredString(input.category.slug, 128, "CATALOG_INVALID"),
      name_ar: requiredString(input.category.name_ar, 256, "CATALOG_INVALID"),
      name_en: requiredString(input.category.name_en, 256, "CATALOG_INVALID"),
    };
  }
  if (
    typeof input.in_stock !== "boolean" ||
    typeof input.featured !== "boolean"
  )
    fail("CATALOG_INVALID");
  return {
    id: requiredString(input.id, 128, "CATALOG_INVALID"),
    name_ar: requiredString(input.name_ar, 256, "CATALOG_INVALID"),
    name_en: requiredString(input.name_en, 256, "CATALOG_INVALID"),
    description_ar: nullableString(
      input.description_ar,
      4000,
      "CATALOG_INVALID"
    ),
    description_en: nullableString(
      input.description_en,
      4000,
      "CATALOG_INVALID"
    ),
    price: finiteNonNegative(input.price, "CATALOG_INVALID"),
    old_price:
      input.old_price === null || input.old_price === undefined
        ? null
        : finiteNonNegative(input.old_price, "CATALOG_INVALID"),
    image_url: nullableString(input.image_url, 2048, "CATALOG_INVALID"),
    category_id: nullableString(input.category_id, 128, "CATALOG_INVALID"),
    weight: nullableString(input.weight, 256, "CATALOG_INVALID"),
    origin: nullableString(input.origin, 256, "CATALOG_INVALID"),
    in_stock: input.in_stock,
    featured: input.featured,
    category,
  };
}

function normalizeCatalog(input) {
  if (!isPlainObject(input)) fail("CATALOG_INVALID");
  assertExactKeys(input, new Set(["products", "categories"]), "catalog");
  if (
    !Array.isArray(input.products) ||
    !Array.isArray(input.categories) ||
    input.products.length > 10000 ||
    input.categories.length > 5000
  ) {
    fail("CATALOG_INVALID");
  }
  const products = input.products.map(normalizeProduct);
  const ids = new Set();
  for (const product of products) {
    if (ids.has(product.id)) fail("CATALOG_INVALID");
    ids.add(product.id);
  }
  return {
    products,
    categories: input.categories.map(category =>
      normalizeCategoryNode(category)
    ),
  };
}

function loadCatalog(options) {
  if (options.catalog !== undefined) return normalizeCatalog(options.catalog);
  const catalogFile =
    process.env.KDD_CATALOG_FILE ||
    new URL("../client/src/kdd/data/catalog.json", import.meta.url);
  try {
    return normalizeCatalog(JSON.parse(readFileSync(catalogFile, "utf8")));
  } catch (error) {
    if (error instanceof StoreError) throw error;
    throw new StoreError("CATALOG_LOAD_FAILED");
  }
}

function parseAllowedOrigins(value) {
  if (Array.isArray(value))
    return value.filter(
      origin => typeof origin === "string" && origin.length > 0
    );
  if (typeof value === "string")
    return value
      .split(",")
      .map(origin => origin.trim())
      .filter(Boolean);
  return [];
}

function resolveAllowedOrigins(options) {
  if (options.allowedOrigins !== undefined)
    return new Set(parseAllowedOrigins(options.allowedOrigins));
  const configured = parseAllowedOrigins(process.env.KDD_ALLOWED_ORIGINS);
  if (configured.length > 0) return new Set(configured);
  return new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
}

function validatePreparations(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > MAX_PREPARATIONS)
    fail("INVALID_PREPARATIONS");
  return value.map(preparation =>
    requiredString(preparation, MAX_PREPARATION_LENGTH, "INVALID_PREPARATIONS")
  );
}

function validateItems(value, productsById) {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) fail("INVALID_ITEMS");
  const seen = new Set();
  return value.map(item => {
    assertExactKeys(
      item,
      new Set(["productId", "quantity", "preparations"]),
      "items"
    );
    const productId = requiredString(item.productId, 128, "INVALID_PRODUCT_ID");

    const product = productsById.get(productId);
    if (!product) fail("UNKNOWN_PRODUCT");
    if (!product.in_stock) fail("PRODUCT_UNAVAILABLE");
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY
    )
      fail("INVALID_QUANTITY");
    const preparations = validatePreparations(item.preparations);
    const lineKey =
      productId + ":" + [...(preparations || [])].sort().join(",");
    if (seen.has(lineKey)) fail("DUPLICATE_PRODUCT");
    seen.add(lineKey);
    const normalized = { productId, quantity: item.quantity };
    if (preparations !== undefined) normalized.preparations = preparations;
    return { normalized, product };
  });
}

function cartResult(items, productsById) {
  let campaignBaseFils = 0;
  let regularCurrentFils = 0;
  const outputItems = items.map(item => {
    const product = productsById.get(item.productId);
    if (!product) fail("UNKNOWN_PRODUCT");
    if (!product.in_stock) fail("PRODUCT_UNAVAILABLE");
    const currentFils = Math.round(product.price * 1000);
    const oldFils =
      product.old_price === null || product.old_price === undefined
        ? null
        : Math.round(product.old_price * 1000);
    if (
      oldFils !== null &&
      oldFils > currentFils &&
      currentFils === Math.round(oldFils / 2)
    )
      campaignBaseFils += oldFils * item.quantity;
    else regularCurrentFils += currentFils * item.quantity;
    return {
      ...item,
      ...(item.preparations ? { preparations: [...item.preparations] } : {}),
    };
  });
  const baseTotalFils = campaignBaseFils + regularCurrentFils;
  const discountFils = Math.round(campaignBaseFils / 2);
  const subtotal = (baseTotalFils - discountFils) / 1000;
  const discount = discountFils / 1000;
  const deliveryFee = 0;
  const preparationPrices = {
    clean: 0,
    skin: 0.25,
    fillet: 0.5,
    slice: 0.25,
    grill_ready: 0.25,
    head_remove: 0.15,
    peel: 0.2,
    devein: 0.5,
  };
  const preparationFee = items.reduce(
    (sum, item) =>
      sum +
      (item.preparations || []).reduce(
        (fee, key) =>
          fee +
          (Object.hasOwn(preparationPrices, key) ? preparationPrices[key] : 0),
        0
      ) *
        item.quantity,
    0
  );
  return {
    items: outputItems,
    subtotal,
    discount,
    deliveryFee,
    total: roundMoney(subtotal + deliveryFee + preparationFee),
  };
}

function normalizeCartPayload(payload, productsById) {
  assertExactKeys(payload, new Set(["items"]), "cart");
  return validateItems(payload.items, productsById).map(
    ({ normalized }) => normalized
  );
}

function normalizeCustomer(input) {
  assertExactKeys(
    input,
    new Set([
      "name",
      "phone",
      "area",
      "governorate",
      "block",
      "street",
      "building",
      "floor",
      "apartment",
      "notes",
    ]),
    "customer"
  );
  const customer = {
    name: requiredString(input.name, 120, "INVALID_CUSTOMER"),
    phone: requiredString(input.phone, 40, "INVALID_CUSTOMER"),
    area: requiredString(input.area, 160, "INVALID_CUSTOMER"),
  };
  for (const field of [
    "governorate",
    "block",
    "street",
    "building",
    "floor",
    "apartment",
    "notes",
  ]) {
    const value = optionalString(
      input[field],
      field === "notes" ? 2000 : 300,
      "INVALID_CUSTOMER"
    );
    if (value !== undefined) customer[field] = value;
  }
  return customer;
}

function normalizeOrderDraft(payload, productsById) {
  assertExactKeys(
    payload,
    new Set(["requestId", "customer", "items", "deliverySlot", "couponCode"]),
    "order"
  );
  if (typeof payload.requestId !== "string" || !UUID_RE.test(payload.requestId))
    fail("INVALID_REQUEST_ID");
  const customer = normalizeCustomer(payload.customer);
  const itemEntries = validateItems(payload.items, productsById);
  const draft = {
    requestId: payload.requestId,
    customer,
    items: itemEntries.map(({ normalized }) => normalized),
  };
  if (payload.deliverySlot !== undefined) {
    assertExactKeys(
      payload.deliverySlot,
      new Set(["date", "window"]),
      "deliverySlot"
    );
    const deliverySlot = {};
    const date = optionalString(
      payload.deliverySlot.date,
      64,
      "INVALID_DELIVERY_SLOT"
    );
    const window = optionalString(
      payload.deliverySlot.window,
      128,
      "INVALID_DELIVERY_SLOT"
    );
    if (date !== undefined) deliverySlot.date = date;
    if (window !== undefined) deliverySlot.window = window;
    draft.deliverySlot = deliverySlot;
  }
  if (payload.couponCode !== undefined) {
    draft.couponCode = requiredString(
      payload.couponCode,
      64,
      "INVALID_COUPON_CODE"
    );
  }
  return { draft, items: draft.items };
}

function extractStoredReceipt(record) {
  if (!record || !isPlainObject(record)) return null;
  const receipt = record.receipt ?? record;
  if (
    !isPlainObject(receipt) ||
    typeof receipt.orderId !== "string" ||
    receipt.status !== "received" ||
    typeof receipt.total !== "number" ||
    typeof receipt.createdAt !== "string"
  ) {
    return null;
  }
  return {
    orderId: receipt.orderId,
    status: "received",
    total: receipt.total,
    createdAt: receipt.createdAt,
  };
}

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  await fs.chmod(directory, 0o700);
}

/**
 * Optional durable repository. It intentionally stores one JSON document per UUID order file.
 * Files contain order PII only when the caller explicitly enables this repository.
 */
export function createJsonOrderRepository(directory) {
  if (typeof directory !== "string" || directory.length === 0)
    fail("INVALID_ORDERS_DIRECTORY");
  const absoluteDirectory = path.resolve(directory);
  const pending = new Map();

  const findByRequestId = async requestId => {
    await ensureDirectory(absoluteDirectory);
    const names = await fs.readdir(absoluteDirectory);
    for (const name of names) {
      if (
        !UUID_RE.test(name.replace(/\.json$/i, "")) ||
        !name.toLowerCase().endsWith(".json")
      )
        continue;
      try {
        const record = JSON.parse(
          await fs.readFile(path.join(absoluteDirectory, name), "utf8")
        );
        if (record?.requestId === requestId) return record;
      } catch {
        // A malformed unrelated file is not an order belonging to this repository.
      }
    }
    return null;
  };

  const saveOrder = async record => {
    const requestId = record.requestId;
    const hash = record.payloadHash;
    const running = pending.get(requestId);
    if (running) {
      if (running.hash !== hash) fail("REQUEST_ID_REUSE_DIFFERENT_PAYLOAD");
      return running.promise;
    }
    const operation = (async () => {
      const existing = await findByRequestId(requestId);
      if (existing) {
        if (existing.payloadHash !== hash)
          fail("REQUEST_ID_REUSE_DIFFERENT_PAYLOAD");
        const receipt = extractStoredReceipt(existing);
        if (!receipt) fail("ORDER_STORAGE_CORRUPT");
        return receipt;
      }
      await ensureDirectory(absoluteDirectory);
      const orderId = record.receipt.orderId;
      const filename = `${orderId}.json`;
      const target = path.join(absoluteDirectory, filename);
      const document = JSON.stringify({
        requestId,
        payloadHash: hash,
        draft: record.draft,
        receipt: record.receipt,
      });
      let handle;
      try {
        handle = await fs.open(target, "wx", 0o600);
        await handle.writeFile(document, "utf8");
        await handle.chmod(0o600);
      } catch (error) {
        try {
          await handle?.close();
        } catch {
          /* best effort */
        }
        try {
          await fs.unlink(target);
        } catch {
          /* best effort */
        }
        throw error;
      } finally {
        try {
          await handle?.close();
        } catch {
          /* best effort */
        }
      }
      return record.receipt;
    })();
    pending.set(requestId, { hash, promise: operation });
    try {
      return await operation;
    } finally {
      pending.delete(requestId);
    }
  };

  return {
    directory: absoluteDirectory,
    findByRequestId,
    saveOrder,
  };
}

async function repositoryFind(repository, requestId) {
  if (typeof repository.findByRequestId === "function")
    return repository.findByRequestId(requestId);
  if (typeof repository.getByRequestId === "function")
    return repository.getByRequestId(requestId);
  return null;
}

async function repositorySave(repository, record) {
  if (typeof repository.saveOrder === "function")
    return repository.saveOrder(record);
  if (typeof repository.createOrder === "function")
    return repository.createOrder(record);
  if (typeof repository.save === "function") return repository.save(record);
  fail("ORDER_REPOSITORY_INVALID");
}

function errorString(error) {
  if (error instanceof StoreError) return error.code;
  if (error?.code === "EACCES" || error?.code === "ENOSPC")
    return "ORDER_STORAGE_FAILED";
  return "INTERNAL_ERROR";
}

export function createStoreServer(options = {}) {
  if (!isPlainObject(options)) fail("INVALID_OPTIONS");
  const catalog = loadCatalog(options);
  const productsById = new Map(
    catalog.products.map(product => [product.id, product])
  );
  const allowedOrigins = resolveAllowedOrigins(options);
  const repository =
    options.orderRepository !== undefined
      ? options.orderRepository
      : process.env.KDD_ORDERS_DIRECTORY
        ? createJsonOrderRepository(process.env.KDD_ORDERS_DIRECTORY)
        : null;
  const httpServer = createHttpServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "GET" && requestUrl.pathname === "/health") {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(JSON.stringify({ ok: true, status: "ok" }));
      return;
    }
    response.writeHead(404, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify({ ok: false, error: "NOT_FOUND" }));
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Non-browser clients have no Origin header; browser origins are explicit only.
        if (!origin || allowedOrigins.has(origin)) callback(null, true);
        else callback(new Error("ORIGIN_NOT_ALLOWED"));
      },
      credentials: false,
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: MAX_EVENT_BYTES,
  });

  const callAck = (ack, result) => {
    if (typeof ack === "function") ack(result);
  };

  const withinRate = socket => {
    const now = Date.now();
    const timestamps = Array.isArray(socket.data.rateTimestamps)
      ? socket.data.rateTimestamps
      : [];
    socket.data.rateTimestamps = timestamps.filter(
      timestamp => now - timestamp < 60_000
    );
    if (socket.data.rateTimestamps.length >= MAX_EVENTS_PER_MINUTE)
      fail("RATE_LIMITED");
    socket.data.rateTimestamps.push(now);
  };

  const bind = (socket, event, handler) => {
    socket.on(event, (payload, ack) => {
      Promise.resolve()
        .then(() => {
          withinRate(socket);
          return handler(payload);
        })
        .then(data => callAck(ack, { ok: true, data }))
        .catch(error => callAck(ack, { ok: false, error: errorString(error) }));
    });
  };

  io.on("connection", socket => {
    socket.data.cartItems = [];
    socket.data.rateTimestamps = [];

    bind(socket, "kdd:catalog:get", payload => {
      assertExactKeys(payload, new Set(), "catalog.get");
      return { products: catalog.products, categories: catalog.categories };
    });

    bind(socket, "kdd:cart:update", payload => {
      const items = normalizeCartPayload(payload, productsById);
      socket.data.cartItems = items;
      return cartResult(items, productsById);
    });

    bind(socket, "kdd:coupon:validate", payload => {
      assertExactKeys(payload, new Set(["code"]), "coupon");
      requiredString(payload.code, 64, "INVALID_COUPON_CODE");
      // No coupon source is configured: never invent a discount.
      return null;
    });

    bind(socket, "kdd:order:create", async payload => {
      const { draft, items } = normalizeOrderDraft(payload, productsById);
      if (!repository) fail("ORDER_STORAGE_NOT_CONFIGURED");
      const total = cartResult(items, productsById).total;
      const receipt = {
        orderId: randomUUID(),
        status: "received",
        total,
        createdAt: new Date().toISOString(),
      };
      const record = {
        requestId: draft.requestId,
        payloadHash: payloadHash(draft),
        draft,
        receipt,
      };
      const existing = await repositoryFind(repository, draft.requestId);
      if (existing) {
        const existingHash =
          existing.payloadHash ??
          payloadHash(existing.draft ?? existing.payload ?? {});
        if (existingHash !== record.payloadHash)
          fail("REQUEST_ID_REUSE_DIFFERENT_PAYLOAD");
        const existingReceipt = extractStoredReceipt(existing);
        if (!existingReceipt) fail("ORDER_STORAGE_CORRUPT");
        return existingReceipt;
      }
      try {
        const stored = await repositorySave(repository, record);
        const storedReceipt = extractStoredReceipt(stored);
        if (!storedReceipt) return receipt;
        return storedReceipt;
      } catch (error) {
        if (error instanceof StoreError) throw error;
        throw new StoreError(
          error?.code === "EACCES" || error?.code === "ENOSPC"
            ? "ORDER_STORAGE_FAILED"
            : "ORDER_STORAGE_FAILED"
        );
      }
    });

    socket.on("disconnect", () => {
      // Cart data is deliberately socket-scoped and is released with the socket.
      delete socket.data.cartItems;
      delete socket.data.rateTimestamps;
    });
  });

  let listening = false;
  const listen = (port = Number(process.env.PORT || 3001), host = "0.0.0.0") =>
    new Promise((resolve, reject) => {
      const onError = error => {
        httpServer.off("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        httpServer.off("error", onError);
        listening = true;
        resolve(httpServer.address());
      };
      httpServer.once("error", onError);
      httpServer.once("listening", onListening);
      httpServer.listen(port, host);
    });

  const close = async () => {
    await new Promise(resolve => io.close(() => resolve()));
    if (httpServer.listening) {
      await new Promise(resolve => httpServer.close(() => resolve()));
    }
    listening = false;
  };

  return {
    httpServer,
    server: httpServer,
    io,
    catalog,
    allowedOrigins: [...allowedOrigins],
    listen,
    close,
    address: () => httpServer.address(),
    get listening() {
      return listening;
    },
  };
}

if (path.resolve(process.argv[1] ?? "") === path.resolve(MODULE_FILE)) {
  const port = Number(process.env.PORT || 3001);
  const app = createStoreServer();
  app
    .listen(port, "0.0.0.0")
    .then(() => {
      console.log(`kdd-socket-server listening on ${port}`);
      const shutdown = async () => {
        await app.close();
        process.exit(0);
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    })
    .catch(error => {
      console.error(`kdd-socket-server failed: ${errorString(error)}`);
      process.exitCode = 1;
    });
}
