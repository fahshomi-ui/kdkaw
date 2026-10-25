import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

// [fix] مفتاح المتجر — يمنع اختلاط طلبات المتجرين على خادم واحد
const STORE = process.env.STORE_ID || process.env.STORE || 'kdkaw';


const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(HERE, '../src/data/catalog.json');

export function createDatabase(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL is required before the server can become ready');
    error.code = 'DATABASE_CONFIG_MISSING'; error.status = 503; throw error;
  }
  let parsed;
  try { parsed = new URL(databaseUrl); } catch {
    const error = new Error('DATABASE_URL is invalid'); error.code = 'DATABASE_CONFIG_INVALID'; error.status = 503; throw error;
  }
  if (!parsed.hostname || !parsed.pathname.slice(1)) {
    const error = new Error('DATABASE_URL must include a database name'); error.code = 'DATABASE_CONFIG_INVALID'; error.status = 503; throw error;
  }
  const sslSetting = String(parsed.searchParams.get('ssl') || '').toLowerCase();
  const ssl = sslSetting && !['0', 'false', 'disabled'].includes(sslSetting)
    ? { rejectUnauthorized: true }
    : undefined;
  const pool = mysql.createPool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.slice(1)),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0,
    decimalNumbers: true,
    timezone: 'Z',
    charset: 'utf8mb4',
    ...(ssl ? { ssl } : {}),
  });
  return pool;
}

const MIGRATIONS = [
  {
    version: '001-core',
    statements: [
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS categories (
        id CHAR(36) NOT NULL PRIMARY KEY, slug VARCHAR(120) NOT NULL UNIQUE,
        name_ar VARCHAR(255) NOT NULL, name_en VARCHAR(255) NOT NULL,
        parent_id CHAR(36) NULL, image_url VARCHAR(1000) NULL, icon VARCHAR(255) NULL,
        sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_categories_parent (parent_id), INDEX idx_categories_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS products (
        id CHAR(36) NOT NULL PRIMARY KEY, name_ar VARCHAR(255) NOT NULL, name_en VARCHAR(255) NOT NULL,
        description_ar TEXT NULL, description_en TEXT NULL, price DECIMAL(12,3) NOT NULL DEFAULT 0,
        old_price DECIMAL(12,3) NULL, image_url VARCHAR(1000) NULL, category_id CHAR(36) NULL,
        weight VARCHAR(120) NULL, origin VARCHAR(120) NULL, in_stock BOOLEAN NOT NULL DEFAULT TRUE,
        featured BOOLEAN NOT NULL DEFAULT FALSE, stock_quantity INT NOT NULL DEFAULT 0,
        low_stock_threshold INT NOT NULL DEFAULT 5, is_ai_generated_image BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_products_category (category_id), INDEX idx_products_stock (in_stock, stock_quantity), INDEX idx_products_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS product_images (
        id CHAR(36) NOT NULL PRIMARY KEY, product_id CHAR(36) NOT NULL, image_url VARCHAR(1000) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY uq_product_image (product_id, image_url(255)), INDEX idx_product_images_sort (product_id, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS coupons (
        id CHAR(36) NOT NULL PRIMARY KEY, code VARCHAR(80) NOT NULL UNIQUE, discount_percent DECIMAL(5,2) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE, expires_at TIMESTAMP(3) NULL, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id CHAR(36) NOT NULL PRIMARY KEY, token_hash CHAR(64) NOT NULL UNIQUE, kind ENUM('admin','guest') NOT NULL,
        user_id VARCHAR(120) NULL, visitor_id CHAR(36) NULL, expires_at TIMESTAMP(3) NOT NULL,
        revoked_at TIMESTAMP(3) NULL, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        last_seen_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_sessions_expiry (expires_at), INDEX idx_sessions_visitor (visitor_id), INDEX idx_sessions_kind (kind)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS orders (
        id CHAR(36) NOT NULL PRIMARY KEY, order_number VARCHAR(40) NOT NULL UNIQUE,
        visitor_session_id CHAR(36) NULL, customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(80) NOT NULL,
        area VARCHAR(255) NOT NULL, block VARCHAR(120) NULL, street VARCHAR(255) NULL, building VARCHAR(120) NULL,
        floor VARCHAR(120) NULL, apartment VARCHAR(120) NULL, notes TEXT NULL, payment_method ENUM('card','knet') NOT NULL,
        subtotal DECIMAL(12,3) NOT NULL, discount DECIMAL(12,3) NOT NULL DEFAULT 0, prep_fees DECIMAL(12,3) NOT NULL DEFAULT 0,
        total DECIMAL(12,3) NOT NULL, coupon_code VARCHAR(80) NULL, delivery_date DATE NULL,
        delivery_window VARCHAR(120) NULL, location_lat DECIMAL(10,7) NULL, location_lng DECIMAL(10,7) NULL,
        location_label VARCHAR(500) NULL, status VARCHAR(40) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_orders_visitor FOREIGN KEY (visitor_session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        INDEX idx_orders_visitor (visitor_session_id), INDEX idx_orders_phone (customer_phone), INDEX idx_orders_created (created_at), INDEX idx_orders_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id CHAR(36) NOT NULL PRIMARY KEY, order_id CHAR(36) NOT NULL, product_id CHAR(36) NULL,
        product_name_ar VARCHAR(255) NOT NULL, product_name_en VARCHAR(255) NOT NULL, quantity INT NOT NULL,
        unit_price DECIMAL(12,3) NOT NULL, preparations JSON NULL, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        INDEX idx_order_items_order (order_id), INDEX idx_order_items_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS session_order_grants (
        session_id CHAR(36) NOT NULL, order_id CHAR(36) NOT NULL, granted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (session_id, order_id),
        CONSTRAINT fk_grants_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_grants_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS reviews (
        id CHAR(36) NOT NULL PRIMARY KEY, product_id CHAR(36) NOT NULL, visitor_session_id CHAR(36) NULL,
        customer_name VARCHAR(255) NOT NULL, rating TINYINT NOT NULL, comment TEXT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_visitor FOREIGN KEY (visitor_session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        INDEX idx_reviews_product (product_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS order_reviews (
        id CHAR(36) NOT NULL PRIMARY KEY, order_id CHAR(36) NULL, order_number VARCHAR(40) NULL,
        visitor_session_id CHAR(36) NULL, customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(80) NULL,
        rating TINYINT NOT NULL, comment TEXT NULL, photo_urls JSON NOT NULL,
        published BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_order_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        CONSTRAINT fk_order_reviews_visitor FOREIGN KEY (visitor_session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        INDEX idx_order_reviews_public (published, created_at), INDEX idx_order_reviews_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id CHAR(36) NOT NULL PRIMARY KEY, visitor_session_id CHAR(36) NULL, name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NULL, phone VARCHAR(80) NULL, subject VARCHAR(255) NULL, message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_contact_visitor FOREIGN KEY (visitor_session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        INDEX idx_contact_created (created_at), INDEX idx_contact_visitor (visitor_session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS stock_alerts (
        id CHAR(36) NOT NULL PRIMARY KEY, product_id CHAR(36) NOT NULL, visitor_session_id CHAR(36) NULL,
        contact VARCHAR(255) NOT NULL, contact_type ENUM('phone','email') NOT NULL DEFAULT 'phone', lang VARCHAR(8) NOT NULL DEFAULT 'ar',
        notified BOOLEAN NOT NULL DEFAULT FALSE, notified_at TIMESTAMP(3) NULL, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_stock_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_stock_visitor FOREIGN KEY (visitor_session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        UNIQUE KEY uq_stock_subscription (product_id, contact), INDEX idx_stock_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS subscription_plans (
        id CHAR(36) NOT NULL PRIMARY KEY, slug VARCHAR(120) NOT NULL UNIQUE, name_ar VARCHAR(255) NOT NULL, name_en VARCHAR(255) NOT NULL,
        description_ar TEXT NULL, description_en TEXT NULL, frequency VARCHAR(20) NOT NULL,
        discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0, base_price DECIMAL(12,3) NOT NULL DEFAULT 0,
        items JSON NOT NULL, image_url VARCHAR(1000) NULL, active BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_plans_active (active, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id CHAR(36) NOT NULL PRIMARY KEY, visitor_session_id CHAR(36) NULL, plan_id CHAR(36) NOT NULL,
        customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(80) NOT NULL, area VARCHAR(255) NOT NULL,
        block VARCHAR(120) NULL, street VARCHAR(255) NULL, building VARCHAR(120) NULL, notes TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active', next_delivery_date DATE NOT NULL, deliveries_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
        CONSTRAINT fk_sub_visitor FOREIGN KEY (visitor_session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        INDEX idx_sub_visitor (visitor_session_id), INDEX idx_sub_phone (customer_phone), INDEX idx_sub_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS driver_positions (
        id CHAR(36) NOT NULL PRIMARY KEY, order_id CHAR(36) NOT NULL, lat DECIMAL(10,7) NOT NULL, lng DECIMAL(10,7) NOT NULL,
        driver_name VARCHAR(255) NULL, driver_phone VARCHAR(80) NULL, heading DECIMAL(8,3) NULL, speed_kmh DECIMAL(8,3) NULL,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_driver_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, INDEX idx_driver_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS order_requests (
        visitor_session_id CHAR(36) NOT NULL, request_id VARCHAR(160) NOT NULL, order_id CHAR(36) NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (visitor_session_id, request_id),
        CONSTRAINT fk_order_requests_session FOREIGN KEY (visitor_session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_requests_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS media (
        id CHAR(36) NOT NULL PRIMARY KEY, bucket VARCHAR(40) NOT NULL, object_path VARCHAR(500) NOT NULL,
        owner_session_id CHAR(36) NULL, content_type VARCHAR(100) NOT NULL, size_bytes INT UNSIGNED NOT NULL,
        bytes LONGBLOB NOT NULL, public_flag BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_media_object (bucket, object_path), INDEX idx_media_public (public_flag), INDEX idx_media_owner (owner_session_id),
        CONSTRAINT fk_media_owner FOREIGN KEY (owner_session_id) REFERENCES sessions(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ],
  },
];

export async function migrate(pool) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(MIGRATIONS[0].statements[0]);
    for (const migration of MIGRATIONS) {
      const [rows] = await connection.execute('SELECT version FROM schema_migrations WHERE version = ?', [migration.version]);
      if (!rows.length) {
        for (const statement of migration.statements.slice(1)) await connection.query(statement);
        await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', [migration.version]);
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

async function loadCatalog() {
  return JSON.parse(await readFile(CATALOG_PATH, 'utf8'));
}

export async function seedCatalog(pool) {
  const catalog = await loadCatalog();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const seedVersion = 'catalog-2026-10-21-v1';
    const [alreadySeeded] = await connection.execute('SELECT version FROM schema_migrations WHERE version = ?', [seedVersion]);
    if (alreadySeeded.length) {
      await connection.commit();
      return { products: catalog.products.length, categories: catalog.categories.length, product_images: catalog.product_images.length };
    }
    for (const row of catalog.categories || []) {
      await connection.execute(
        `INSERT IGNORE INTO categories (id, slug, name_ar, name_en, parent_id, image_url, icon, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.slug, row.name_ar, row.name_en, row.parent_id ?? null, row.image_url ?? null, row.icon ?? null, row.sort_order ?? 0, row.created_at ? new Date(row.created_at) : new Date()],
      );
    }
    for (const row of catalog.products || []) {
      await connection.execute(
        `INSERT IGNORE INTO products (id, name_ar, name_en, description_ar, description_en, price, old_price, image_url, category_id, weight, origin, in_stock, featured, stock_quantity, low_stock_threshold, is_ai_generated_image, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name_ar, row.name_en, row.description_ar ?? null, row.description_en ?? null, row.price ?? 0, row.old_price ?? null, row.image_url ?? null, row.category_id ?? null, row.weight ?? null, row.origin ?? null, !!row.in_stock, !!row.featured, row.stock_quantity ?? 0, row.low_stock_threshold ?? 5, !!row.is_ai_generated_image, row.created_at ? new Date(row.created_at) : new Date(), row.updated_at ? new Date(row.updated_at) : new Date()],
      );
    }
    for (const row of catalog.product_images || []) {
      await connection.execute(
        `INSERT IGNORE INTO product_images (id, product_id, image_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?)`,
        [row.id || randomUUID(), row.product_id, row.image_url, row.sort_order ?? 0, row.created_at ? new Date(row.created_at) : new Date()],
      );
    }
    await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', [seedVersion]);
    await connection.commit();
    return { products: catalog.products?.length || 0, categories: catalog.categories?.length || 0, product_images: catalog.product_images?.length || 0 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function withTransaction(pool, callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  } finally { connection.release(); }
}

export async function closeDatabase(pool) { if (pool) await pool.end(); }
