import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  discount_percent: number;
  base_price: number;
  items: Array<{ name_ar: string; name_en: string }>;
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  plan_id: string;
  customer_name: string;
  customer_phone: string;
  area: string;
  block: string | null;
  street: string | null;
  building: string | null;
  notes: string | null;
  status: 'active' | 'paused' | 'cancelled';
  next_delivery_date: string;
  deliveries_count: number;
  created_at: string;
  plan?: SubscriptionPlan;
}

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ['subscription_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as SubscriptionPlan[];
    },
  });

export const useMySubscriptions = (phone: string) =>
  useQuery({
    queryKey: ['subscriptions', phone],
    queryFn: async () => {
      if (!phone) return [];
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Subscription[];
    },
    enabled: !!phone,
  });

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      plan: SubscriptionPlan;
      customer_name: string;
      customer_phone: string;
      area: string;
      block?: string;
      street?: string;
      building?: string;
      notes?: string;
    }) => {
      const days = input.plan.frequency === 'monthly' ? 30 : input.plan.frequency === 'biweekly' ? 14 : 7;
      const next = new Date();
      next.setDate(next.getDate() + days);

      const { data, error } = await supabase.from('subscriptions').insert({
        plan_id: input.plan.id,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        area: input.area,
        block: input.block ?? null,
        street: input.street ?? null,
        building: input.building ?? null,
        notes: input.notes ?? null,
        next_delivery_date: next.toISOString().slice(0, 10),
      }).select().single();
      if (error) throw error;
      return data as unknown as Subscription;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subscriptions', vars.customer_phone] });
      toast.success('تم تفعيل اشتراكك بنجاح! 🎉');
    },
    onError: (e: any) => toast.error(e?.message || 'تعذّر تفعيل الاشتراك'),
  });
};

export const useSubscriptionAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      subscription_id: string;
      customer_phone: string;
      action: 'pause' | 'resume' | 'cancel' | 'skip';
    }) => {
      const { data, error } = await supabase.functions.invoke('subscription-update', { body: input });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as any).subscription as Subscription;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subscriptions', vars.customer_phone] });
      const messages: Record<string, string> = {
        pause: 'تم إيقاف الاشتراك مؤقتاً',
        resume: 'تم استئناف الاشتراك ✅',
        cancel: 'تم إلغاء الاشتراك',
        skip: 'تم تأجيل التوصيلة القادمة',
      };
      toast.success(messages[vars.action] || 'تم التحديث');
    },
    onError: (e: any) => toast.error(e?.message || 'تعذّر التحديث'),
  });
};