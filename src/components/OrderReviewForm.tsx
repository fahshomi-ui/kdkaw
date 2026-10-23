import { useState, useRef } from 'react';
import { Camera, X, Loader2, Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadReviewPhotos, useSubmitOrderReview } from '@/hooks/useOrderReviews';
import { toast } from 'sonner';

interface Props {
  orderId?: string;
  orderNumber?: string;
  defaultName?: string;
  defaultPhone?: string;
  onSubmitted?: () => void;
}

const MAX_PHOTOS = 6;

const OrderReviewForm = ({ orderId, orderNumber, defaultName, defaultPhone, onSubmitted }: Props) => {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [name, setName] = useState(defaultName || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submit = useSubmitOrderReview();

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    const nextPreviews = [...previews];
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!f.type.startsWith('image/')) continue;
      if (f.size > 5 * 1024 * 1024) {
        toast.error(isAr ? 'حجم الصورة أكبر من 5 ميجا' : 'Image larger than 5MB');
        continue;
      }
      next.push(f);
      nextPreviews.push(URL.createObjectURL(f));
    }
    setFiles(next);
    setPreviews(nextPreviews);
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(files.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(isAr ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const urls = files.length ? await uploadReviewPhotos(files) : [];
      const { normalizePhone, syncVisitorIdentity } = await import('@/lib/visitorIdentity');
      const normalizedPhone = normalizePhone(phone);
      await submit.mutateAsync({
        order_id: orderId || null,
        order_number: orderNumber || null,
        customer_name: name.trim(),
        customer_phone: normalizedPhone || null,
        rating,
        comment: comment.trim() || null,
        photo_urls: urls,
      });
      await syncVisitorIdentity({ name: name.trim(), phone: normalizedPhone });
      toast.success(isAr ? '🎉 شكراً على تقييمك!' : '🎉 Thanks for your review!');
      previews.forEach((p) => URL.revokeObjectURL(p));
      setFiles([]);
      setPreviews([]);
      setComment('');
      setRating(5);
      onSubmitted?.();
    } catch (err: any) {
      toast.error(isAr ? 'تعذر إرسال التقييم' : 'Failed to submit review');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-primary" />
        {isAr ? 'شارك تجربتك مع طلبك' : 'Share your order experience'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            placeholder={isAr ? 'الاسم' : 'Name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
          <Input
            type="tel"
            placeholder={isAr ? 'الهاتف (اختياري)' : 'Phone (optional)'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">
            {isAr ? 'تقييمك' : 'Your rating'}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    n <= (hover || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <Textarea
          placeholder={isAr ? 'اكتب تعليقك (اختياري)' : 'Write your comment (optional)'}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
        />

        <div>
          <label className="text-sm font-medium block mb-2">
            {isAr ? `صور الطلب (حتى ${MAX_PHOTOS})` : `Order photos (up to ${MAX_PHOTOS})`}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                <img src={url} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow"
                  aria-label="remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {previews.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center text-muted-foreground"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px]">{isAr ? 'إضافة' : 'Add'}</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full" size="lg">
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {submitting
            ? isAr ? 'جاري الإرسال...' : 'Submitting...'
            : isAr ? 'إرسال التقييم' : 'Submit Review'}
        </Button>
      </form>
    </Card>
  );
};

export default OrderReviewForm;