import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const useReviews = (productId: string) =>
  useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });





/**
 * Returns { avg, count } directly (destructured) for inline product card display.
 */
export const useProductRating = (productId: string) => {
  const { data } = useQuery({
    queryKey: ['product-rating', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);
      if (error) throw error;
      const list = (data || []) as { rating: number }[];
      if (list.length === 0) return { avg: 0, count: 0 };
      const sum = list.reduce((s, r) => s + r.rating, 0);
      return { avg: sum / list.length, count: list.length };
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
  return { avg: data?.avg ?? 0, count: data?.count ?? 0 };
};