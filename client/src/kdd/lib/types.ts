export interface DbProduct {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  category_id: string | null;
  weight: string | null;
  origin: string | null;
  in_stock: boolean;
  featured: boolean;
  category?: { slug: string; name_ar: string; name_en: string } | null;
}

export interface CategoryNode {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  parent_id: string | null;
  sort_order: number;
  image_url: string | null;
  icon: string | null;
  children: CategoryNode[];
  product_count?: number;
}

export interface OrderDraft {
  requestId: string;
  customer: {
    name: string;
    phone: string;
    area: string;
    governorate?: string;
    block?: string;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    notes?: string;
  };
  items: { productId: string; quantity: number; preparations?: string[] }[];
  deliverySlot?: { date?: string; window?: string };
  couponCode?: string;
}

export interface OrderReceipt {
  orderId: string;
  status: "received";
  total: number;
  createdAt: string;
}

export interface Catalog {
  products: DbProduct[];
  categories: CategoryNode[];
}

export interface CartSnapshot {
  items: OrderDraft["items"];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}
