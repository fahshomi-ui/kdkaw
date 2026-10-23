import SalePrice from '@/components/SalePrice';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { DbProduct } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Check } from 'lucide-react';
import BrandedImage from '@/components/BrandedImage';
import { Link } from 'react-router-dom';

interface Props {
  /** Seed product ids — single product page or full cart */
  seedIds: string[];
  /** Visual variant */
  variant?: 'detail' | 'cart';
  limit?: number;
}

const RelatedProducts = ({ seedIds, variant = 'detail', limit = 4 }: Props) => {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  // Step 1: ask the edge function for related ids
  const { data: relatedIds } = useQuery({
    queryKey: ['related-ids', seedIds.slice().sort().join(','), limit],
    enabled: seedIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('related-products', {
        body: { productIds: seedIds, limit },
      });
      if (error) throw error;
      return (data?.productIds || []) as string[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Step 2: hydrate full product rows
  const { data: products } = useQuery({
    queryKey: ['related-products', relatedIds],
    enabled: !!relatedIds && relatedIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(slug, name_ar, name_en)')
        .in('id', relatedIds!);
      if (error) throw error;
      // Preserve order from edge function
      const map = new Map((data as DbProduct[]).map((p) => [p.id, p]));
      return relatedIds!.map((id) => map.get(id)).filter(Boolean) as DbProduct[];
    },
  });

  if (!products || products.length === 0) return null;

  const handleAdd = (p: DbProduct) => {
    addItem(p, 1);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section
      className={`${variant === 'detail' ? 'mt-10 pt-8 border-t border-border' : 'mt-6'}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-cairo font-extrabold text-base sm:text-lg text-foreground leading-tight">
            {lang === 'ar' ? 'يُشترى معاً عادةً' : 'Frequently Bought Together'}
          </h3>
          <p className="text-[11px] text-muted-foreground font-cairo">
            {lang === 'ar' ? 'أضفها بنقرة واحدة' : 'Add with one tap'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map((p) => {
          const name = lang === 'ar' ? p.name_ar : p.name_en;
          const isAdded = addedId === p.id;
          return (
            <div
              key={p.id}
              className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <Link to={`/product/${p.id}`} className="block">
                <BrandedImage
                  src={p.image_url || '/placeholder.svg'}
                  alt={name}
                  className="w-full h-28 sm:h-32 object-cover"
                  lang={lang}
                  isAiGenerated={(p as any).is_ai_generated_image ?? false}
                />
              </Link>
              <div className="p-2.5 space-y-2">
                <Link to={`/product/${p.id}`}>
                  <h4 className="font-cairo font-bold text-xs leading-tight line-clamp-2 min-h-[2rem] hover:text-primary transition-colors">
                    {name}
                  </h4>
                </Link>
                <div className="flex items-center justify-between gap-1.5">
                  <SalePrice price={p.price} className="text-sm" />
                  <Button
                    size="sm"
                    onClick={() => handleAdd(p)}
                    disabled={!p.in_stock}
                    className={`h-7 w-7 p-0 rounded-lg transition-all ${
                      isAdded ? 'bg-green-600 hover:bg-green-600' : ''
                    }`}
                    aria-label={t('products.addToCart')}
                  >
                    {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedProducts;