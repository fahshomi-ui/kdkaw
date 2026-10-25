export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          name_ar: string
          name_en: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          name_ar: string
          name_en: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          name_ar?: string
          name_en?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string | null
          visitor_session_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
          visitor_session_id?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_percent: number
          expires_at: string | null
          id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_percent: number
          expires_at?: string | null
          id?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
        }
        Relationships: []
      }
      driver_positions: {
        Row: {
          driver_name: string | null
          driver_phone: string | null
          heading: number | null
          id: string
          lat: number
          lng: number
          order_id: string
          speed_kmh: number | null
          updated_at: string
        }
        Insert: {
          driver_name?: string | null
          driver_phone?: string | null
          heading?: number | null
          id?: string
          lat: number
          lng: number
          order_id: string
          speed_kmh?: number | null
          updated_at?: string
        }
        Update: {
          driver_name?: string | null
          driver_phone?: string | null
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          order_id?: string
          speed_kmh?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          preparations: string[] | null
          product_id: string | null
          product_name_ar: string
          product_name_en: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          preparations?: string[] | null
          product_id?: string | null
          product_name_ar: string
          product_name_en: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          preparations?: string[] | null
          product_id?: string | null
          product_name_ar?: string
          product_name_en?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          order_id: string | null
          order_number: string | null
          photo_urls: string[]
          published: boolean
          rating: number
          visitor_session_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          order_id?: string | null
          order_number?: string | null
          photo_urls?: string[]
          published?: boolean
          rating: number
          visitor_session_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          order_id?: string | null
          order_number?: string | null
          photo_urls?: string[]
          published?: boolean
          rating?: number
          visitor_session_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          apartment: string | null
          area: string
          block: string | null
          building: string | null
          coupon_code: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_date: string | null
          delivery_window: string | null
          discount: number
          floor: string | null
          id: string
          location_label: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          order_number: string
          payment_method: string
          prep_fees: number
          status: string
          street: string | null
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          apartment?: string | null
          area: string
          block?: string | null
          building?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_date?: string | null
          delivery_window?: string | null
          discount?: number
          floor?: string | null
          id?: string
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          order_number: string
          payment_method: string
          prep_fees?: number
          status?: string
          street?: string | null
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          apartment?: string | null
          area?: string
          block?: string | null
          building?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_date?: string | null
          delivery_window?: string | null
          discount?: number
          floor?: string | null
          id?: string
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          prep_fees?: number
          status?: string
          street?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }

      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          id: string
          image_url: string | null
          in_stock: boolean
          is_ai_generated_image: boolean
          low_stock_threshold: number
          name_ar: string
          name_en: string
          old_price: number | null
          origin: string | null
          price: number
          stock_quantity: number
          updated_at: string
          weight: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_ai_generated_image?: boolean
          low_stock_threshold?: number
          name_ar: string
          name_en: string
          old_price?: number | null
          origin?: string | null
          price: number
          stock_quantity?: number
          updated_at?: string
          weight?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_ai_generated_image?: boolean
          low_stock_threshold?: number
          name_ar?: string
          name_en?: string
          old_price?: number | null
          origin?: string | null
          price?: number
          stock_quantity?: number
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name: string
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          contact: string
          contact_type: string
          created_at: string
          id: string
          lang: string
          notified: boolean
          notified_at: string | null
          product_id: string
          visitor_session_id: string | null
        }
        Insert: {
          contact: string
          contact_type?: string
          created_at?: string
          id?: string
          lang?: string
          notified?: boolean
          notified_at?: string | null
          product_id: string
          visitor_session_id?: string | null
        }
        Update: {
          contact?: string
          contact_type?: string
          created_at?: string
          id?: string
          lang?: string
          notified?: boolean
          notified_at?: string | null
          product_id?: string
          visitor_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          description_ar: string | null
          description_en: string | null
          discount_percent: number
          frequency: string
          id: string
          image_url: string | null
          items: Json
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          discount_percent?: number
          frequency: string
          id?: string
          image_url?: string | null
          items?: Json
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          discount_percent?: number
          frequency?: string
          id?: string
          image_url?: string | null
          items?: Json
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          area: string
          block: string | null
          building: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          deliveries_count: number
          id: string
          next_delivery_date: string
          notes: string | null
          plan_id: string
          status: string
          street: string | null
          updated_at: string
        }
        Insert: {
          area: string
          block?: string | null
          building?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          deliveries_count?: number
          id?: string
          next_delivery_date: string
          notes?: string | null
          plan_id: string
          status?: string
          street?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          block?: string | null
          building?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          deliveries_count?: number
          id?: string
          next_delivery_date?: string
          notes?: string | null
          plan_id?: string
          status?: string
          street?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const


// [fix] حارس منع تكرار البطاقات
const __seenEvents = new Map();
export function __dedupeGuard(sock){
  const __on = sock.on.bind(sock);
  sock.on = (ev, fn) => __on(ev, (payload, ...rest) => {
    try {
      if (payload && typeof payload === "object" && payload.id != null) {
        const k = ev + "|" + payload.id + "|" + (payload.status || "");
        const now = Date.now();
        if (__seenEvents.has(k) && now - __seenEvents.get(k) < 120000) return;
        __seenEvents.set(k, now);
      }
    } catch (e) {}
    return fn(payload, ...rest);
  });
  return sock;
}


// [fix] حارس منع تكرار البطاقات — مفتاحه visitorId/id/orderId + بصمة الحمولة
const __seenFull=new Map(), __seenId=new Map();
export function __dedupeGuard2(sock){
  const __on = sock.on.bind(sock);
  sock.on = (ev, fn) => __on(ev, (payload, ...rest) => {
    try{ if(payload && typeof payload==="object"){
      const now=Date.now();
      const id = payload.id!=null?payload.id:(payload.visitorId!=null?payload.visitorId:(payload.orderId!=null?payload.orderId:null));
      const full = ev+"|"+JSON.stringify(payload);
      const f=__seenFull.get(full); if(f && now-f<2000) return; __seenFull.set(full,now);
      if(id!=null){ const ik=ev+"|"+id; const i=__seenId.get(ik); if(i && now-i<250) return; __seenId.set(ik,now); }
      if(__seenFull.size>800)__seenFull.clear(); if(__seenId.size>800)__seenId.clear();
    } }catch(e){}
    return fn(payload, ...rest);
  });
  return sock;
}
