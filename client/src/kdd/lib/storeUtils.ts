import type { Catalog, CategoryNode } from "./types";

type IdSource = {
  randomUUID?: () => string;
  getRandomValues?: (bytes: Uint8Array) => Uint8Array;
};

/** An idempotency identifier, not a password or authentication credential. */
export function newRequestId(source: IdSource = globalThis.crypto): string {
  try {
    if (source?.randomUUID) return source.randomUUID();
  } catch {
    /* Older browsers can still produce a valid UUID via random bytes. */
  }
  const bytes = new Uint8Array(16);
  if (source?.getRandomValues) source.getRandomValues(bytes);
  else
    for (let index = 0; index < bytes.length; index++)
      bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function normalizeCatalog(catalog: Catalog): Catalog {
  const flatten = (nodes: CategoryNode[]): CategoryNode[] =>
    nodes.flatMap(node => [node, ...flatten(node.children || [])]);
  const byId = new Map(
    flatten(catalog.categories).map(node => [node.id, node])
  );
  return {
    ...catalog,
    products: catalog.products.map(product => {
      const category = product.category_id
        ? byId.get(product.category_id)
        : undefined;
      return !product.category && category
        ? {
            ...product,
            category: {
              slug: category.slug,
              name_ar: category.name_ar,
              name_en: category.name_en,
            },
          }
        : product;
    }),
  };
}
