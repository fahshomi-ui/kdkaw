import { Link } from 'react-router-dom';
import { GitCompare, X, Trash2 } from 'lucide-react';
import { useCompare } from '@/hooks/useCompare';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const CompareBar = () => {
  const { lang } = useLanguage();
  const { ids, count, max, remove, clear } = useCompare();

  // Only fetch the few products that are actually being compared.
  // Avoids pulling the entire products table on every page just to render this bar.
  const { data: items = [] } = useQuery({
    queryKey: ['compare-items', ids.slice().sort().join(',')],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_ar, name_en, image_url')
        .in('id', ids);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:end-4 sm:start-auto z-[55] sm:max-w-md">
      <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-foreground/20 backdrop-blur-md overflow-hidden animate-slide-in-right">
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2 font-cairo font-extrabold text-sm">
            <GitCompare className="w-4 h-4" />
            {lang === 'ar' ? `المقارنة (${count}/${max})` : `Compare (${count}/${max})`}
          </div>
          <button
            onClick={clear}
            aria-label={lang === 'ar' ? 'مسح الكل' : 'Clear all'}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-2 bg-muted/40 rounded-xl p-1.5">
              <img
                src={p.image_url || '/placeholder.svg'}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <span className="font-cairo text-xs font-bold text-foreground line-clamp-2 flex-1 min-w-0">
                {lang === 'ar' ? p.name_ar : p.name_en}
              </span>
              <button
                onClick={() => remove(p.id)}
                aria-label="remove"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 pt-1">
          <Link to="/compare">
            <Button
              disabled={count < 2}
              className="w-full h-10 font-cairo text-sm font-extrabold gap-2 rounded-xl"
            >
              <GitCompare className="w-4 h-4" />
              {count < 2
                ? (lang === 'ar' ? 'أضف منتجاً آخر للمقارنة' : 'Add another to compare')
                : (lang === 'ar' ? 'مقارنة الآن' : 'Compare now')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
