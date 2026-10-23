import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getVisitorSessionId } from '@/lib/visitorIdentity';

export type OrderReview = {
  id: string;
  order_id: string | null;
  order_number: string | null;
  customer_name: string;
  customer_phone: string | null;
  rating: number;
  comment: string | null;
  photo_urls: string[];
  published: boolean;
  created_at: string;
};

export const useOrderReviews = (limit = 30) => {
  return useQuery({
    queryKey: ['order_reviews', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_reviews')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as OrderReview[];
    },
  });
};

export const uploadReviewPhotos = async (files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('FILE_TOO_LARGE');
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `reviews/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('review-photos')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data, error: urlError } = await supabase.storage
      .from('review-photos')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (urlError || !data) throw urlError ?? new Error('URL_FAILED');
    urls.push(data.signedUrl);
  }
  return urls;
};

type SubmitInput = {
  order_id?: string | null;
  order_number?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  rating: number;
  comment?: string | null;
  photo_urls: string[];
};

export const useSubmitOrderReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitInput) => {
      const { data, error } = await supabase
        .from('order_reviews')
        .insert({ ...input, visitor_session_id: getVisitorSessionId() } as any)
        .select()
        .single();
      if (error) throw error;
      return data as OrderReview;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order_reviews'] }),
  });
};