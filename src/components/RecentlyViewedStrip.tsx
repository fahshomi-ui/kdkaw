import SalePrice from '@/components/SalePrice';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { DbProduct } from '@/hooks/useStore';

interface Props {
  excludeId?: string;
  variant?: 'section' | 'compact';
}

const RecentlyViewedStrip = ({ excludeId, variant = 'section' }: Props) => {
  const { lang } = useLanguage();
  const { ids, clear } = useRecentlyViewed();

  const filtered = ids.filter((id) => id !== excludeId);

  const { data: products } = useQuery({
    queryKey: ['recently-viewed', filtered],
    queryFn: async () => {
      if (!filtered.length) return [] as DbProduct[];
      const { data } = await supabase.from('products').select('*').in('id', filtered);
      // Preserve order from filtered
      return filtered
        .map((id) => data?.find((p: any) => p.id === id))
        .filter(Boolean) as DbProduct[];
    },
    enabled: filtered.length > 0,
  });

  if (!products || products.length === 0) return null;

  return (
    <section className={variant === 'section' ? 'container mx-auto px-4 py-8' : 'py-4'}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="font-cairo font-bold text-base sm:text-lg">
            {lang === 'ar' ? 'شاهدتها مؤخراً' : 'Recently Viewed'}
          </h3>
        </div>
        <button onClick={clear} className="text-xs font-cairo text-muted-foreground hover:text-destructive flex items-center gap-1">
          <X className="w-3 h-3" />
          {lang === 'ar' ? 'مسح' : 'Clear'}
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.id}`}
            className="flex-shrink-0 w-32 sm:w-36 snap-start group"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
              <img
                src={p.image_url || ''}
                alt={lang === 'ar' ? p.name_ar : p.name_en}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            </div>
            <p className="font-cairo text-xs font-semibold line-clamp-1">
              {lang === 'ar' ? p.name_ar : p.name_en}
            </p>
            <SalePrice price={p.price} className="text-xs" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedStrip;
