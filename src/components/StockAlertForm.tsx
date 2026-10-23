import { useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStockAlert } from '@/hooks/useStockAlert';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  productId: string;
  variant?: 'card' | 'inline';
}

const StockAlertForm = ({ productId, variant = 'inline' }: Props) => {
  const { lang } = useLanguage();
  const { subscribe, submitting, subscribed } = useStockAlert(productId, lang);
  const [contact, setContact] = useState('');
  const [open, setOpen] = useState(variant === 'inline');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await subscribe(contact);
  };

  if (subscribed) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs font-cairo font-bold">
        <Check className="w-4 h-4" />
        {lang === 'ar' ? 'سنُبلّغك عند توفّره' : "We'll notify you"}
      </div>
    );
  }

  if (variant === 'card' && !open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="w-full gap-1.5 font-cairo text-xs h-9 rounded-xl border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
      >
        <Bell className="w-3.5 h-3.5" />
        {lang === 'ar' ? 'أبلغني عند التوفّر' : 'Notify when available'}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1.5 text-[11px] font-cairo text-muted-foreground">
        <Bell className="w-3.5 h-3.5 text-amber-500" />
        <span>{lang === 'ar' ? 'اتركني أُبلّغك عند توفّره' : 'Get notified when back in stock'}</span>
      </div>
      <div className="flex gap-1.5">
        <Input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={lang === 'ar' ? 'هاتف أو بريد إلكتروني' : 'Phone or email'}
          className="h-9 text-xs font-cairo rounded-xl"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting || contact.trim().length < 5}
          className="h-9 px-3 rounded-xl font-cairo text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
          {lang === 'ar' ? 'تنبيه' : 'Alert'}
        </Button>
      </div>
    </form>
  );
};

export default StockAlertForm;
