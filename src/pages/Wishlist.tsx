import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import PageHero from '@/components/PageHero';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/integrations/supabase/client';
import { DbProduct } from '@/hooks/useStore';
import { Heart, ShoppingBag, Trash2, Share2, Check, Copy } from 'lucide-react';
import heroDairy from '@/assets/kdd-hero-dairy.jpg';
import { Button } from '@/components/ui/button';
import { decodeWishlist, buildWishlistShareUrl } from '@/lib/wishlistShare';
import { toast } from '@/hooks/use-toast';

const Wishlist = () => {
  const { lang } = useLanguage();
  const { ids, clear, toggle } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const sharedParam = searchParams.get('shared');
  const [copied, setCopied] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // Import shared wishlist on mount
  useEffect(() => {
    if (!sharedParam) return;
    const sharedIds = decodeWishlist(sharedParam);
    if (sharedIds.length > 0) {
      let added = 0;
      sharedIds.forEach((id) => {
        if (!ids.includes(id)) {
          toggle(id);
          added++;
        }
      });
      setImportedCount(added);
      // Clean URL
      searchParams.delete('shared');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedParam]);

  const handleShare = async () => {
    const url = buildWishlistShareUrl(ids);
    const shareText = lang === 'ar' ? 'شوف منتجاتي المفضلة من كي دي كاو!' : 'Check out my favorite products from KDCow!';
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url });
        return;
      } catch { /* fallthrough to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied' });
    } catch {
      toast({ title: lang === 'ar' ? 'تعذّر نسخ الرابط' : 'Could not copy', variant: 'destructive' });
    }
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist-products', ids],
    queryFn: async () => {
      if (!ids.length) return [] as DbProduct[];
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(slug, name_ar, name_en)')
        .in('id', ids);
      if (error) throw error;
      return data as DbProduct[];
    },
  });

  return (
    <Layout>
      <PageHero
        bgImage={heroDairy}
        lang={lang as 'ar' | 'en'}
        icons={<Heart className="w-6 h-6 fill-current" />}
        titleAr="قائمة المفضلة"
        titleEn="My Wishlist"
        subtitleAr="منتجاتك المختارة في مكان واحد"
        subtitleEn="Your favorite products in one place"
      />
      <section className="container mx-auto px-4 py-10">
        {importedCount !== null && (
          <div className="mb-6 max-w-2xl mx-auto bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl p-3 text-sm font-cairo text-center">
            {lang === 'ar'
              ? `تم استيراد ${importedCount} منتج من قائمة مشاركة 🎁`
              : `Imported ${importedCount} products from a shared wishlist 🎁`}
          </div>
        )}
        {!ids.length ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-5">
              <Heart className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="font-cairo font-extrabold text-xl mb-2">
              {lang === 'ar' ? 'قائمتك فارغة' : 'Your wishlist is empty'}
            </h2>
            <p className="text-sm text-muted-foreground font-cairo mb-6">
              {lang === 'ar'
                ? 'اضغط على ❤️ في أي منتج لإضافته هنا'
                : 'Tap the ❤️ on any product to save it here'}
            </p>
            <Link to="/products">
              <Button className="font-cairo gap-2">
                <ShoppingBag className="w-4 h-4" />
                {lang === 'ar' ? 'تسوّق الآن' : 'Browse Products'}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="font-cairo text-sm text-muted-foreground">
                {lang === 'ar' ? `${ids.length} منتج محفوظ` : `${ids.length} saved items`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="font-cairo gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied
                    ? (lang === 'ar' ? 'تم النسخ' : 'Copied')
                    : (lang === 'ar' ? 'مشاركة' : 'Share')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="font-cairo text-destructive hover:text-destructive gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'حذف الكل' : 'Clear all'}
                </Button>
              </div>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-80 bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products?.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
};

export default Wishlist;