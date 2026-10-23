import { normalizeCatalog } from "../lib/storeUtils";
import { useEffect, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCatalog,
  validateCoupon,
  submitOrder,
  subscribeConnection,
  getConnectionStatus,
  subscribeCatalog,
} from "../lib/socketClient";
import type { Catalog, CategoryNode, OrderDraft } from "../lib/types";
import catalogSnapshot from "../data/catalog.json";
import gallerySnapshot from "../data/product-images.json";
export type {
  DbProduct,
  CategoryNode,
  OrderDraft,
  OrderReceipt,
} from "../lib/types";

const initialCatalog = normalizeCatalog(catalogSnapshot as Catalog);

export const useConnectionStatus = () =>
  useSyncExternalStore(
    subscribeConnection,
    getConnectionStatus,
    () => "not-configured" as const
  );

function useCatalog() {
  const connection = useConnectionStatus();
  const client = useQueryClient();
  useEffect(
    () =>
      subscribeCatalog(() => {
        void client.invalidateQueries({ queryKey: ["kdd-catalog"] });
      }),
    [client]
  );
  return useQuery({
    queryKey: ["kdd-catalog"],
    queryFn: async () => normalizeCatalog(await getCatalog()),
    initialData: initialCatalog,
    initialDataUpdatedAt: 0,
    retry: false,
    enabled: connection === "connected",
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap(node => [node, ...flatten(node.children || [])]);
}

export function useProducts(category?: string) {
  const query = useCatalog();
  const root =
    category &&
    query.data &&
    flatten(query.data.categories).find(c => c.slug === category);
  const ids = new Set(root ? flatten([root]).map(c => c.id) : []);
  return {
    ...query,
    data: query.data?.products.filter(
      p =>
        !category ||
        category === "all" ||
        p.category?.slug === category ||
        (p.category_id && ids.has(p.category_id))
    ),
    isLoading: query.isLoading && query.fetchStatus !== "idle",
  };
}
export function useProduct(id: string) {
  const query = useCatalog();
  return {
    ...query,
    data: query.data?.products.find(p => p.id === id),
    isLoading: query.isLoading && query.fetchStatus !== "idle",
  };
}
export function useProductImages(id: string) {
  const query = useProduct(id);
  const saved = gallerySnapshot
    .filter(image => image.product_id === id)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const primary = query.data?.image_url;
  const images =
    primary && !saved.some(image => image.image_url === primary)
      ? [
          {
            id: `${id}-image`,
            product_id: id,
            image_url: primary,
            sort_order: -1,
          },
          ...saved,
        ]
      : saved;
  return { ...query, data: images };
}
export function useCategories() {
  const query = useCatalog();
  return {
    ...query,
    data: query.data ? flatten(query.data.categories) : undefined,
    isLoading: query.isLoading && query.fetchStatus !== "idle",
  };
}
export function useCategoryTree() {
  const query = useCatalog();
  return {
    ...query,
    data: query.data?.categories,
    isLoading: query.isLoading && query.fetchStatus !== "idle",
  };
}
export function useCategoryBySlug(slug?: string) {
  const query = useCategories();
  return {
    ...query,
    data: query.data?.find(category => category.slug === slug) ?? null,
  };
}
export function useCategoryProducts(slug?: string) {
  const query = useCatalog();
  const root =
    query.data && flatten(query.data.categories).find(c => c.slug === slug);
  const ids = new Set(root ? flatten([root]).map(c => c.id) : []);
  return {
    ...query,
    data: query.data?.products.filter(
      p =>
        p.category?.slug === slug || (p.category_id && ids.has(p.category_id))
    ),
    isLoading: query.isLoading && query.fetchStatus !== "idle",
  };
}
export function useCoupon() {
  return { validateCoupon };
}
export const createOrder = (draft: OrderDraft) => submitOrder(draft);
