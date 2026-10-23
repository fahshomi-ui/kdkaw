import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, Loader2, Instagram, Facebook, Twitter } from 'lucide-react';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizePhone, syncVisitorIdentity, getVisitorSessionId } from '@/lib/visitorIdentity';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(100),
  email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  subject: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Message too short').max(2000),
});

const Contact = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  useEffect(() => {
    document.title = lang === 'ar' ? 'تواصل معنا - كي دي كاو' : 'Contact Us - KDCow';
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(
        lang === 'ar'
          ? 'الرجاء إدخال البيانات بشكل صحيح (الاسم والرسالة مطلوبة)'
          : 'Please enter valid data (name & message required)'
      );
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(parsed.data.phone);
      const { error } = await supabase.from('contact_messages').insert({
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: normalizedPhone || null,
        subject: parsed.data.subject || null,
        message: parsed.data.message,
        visitor_session_id: getVisitorSessionId(),
      } as any);
      if (error) throw error;
      // مزامنة هوية الزائر مع جلسته الحالية ليظهر فوراً في بطاقة الزائر
      await syncVisitorIdentity({ name: parsed.data.name, phone: normalizedPhone, email: parsed.data.email || undefined });
      toast.success(
        lang === 'ar' ? '✅ تم إرسال رسالتك بنجاح! سنتواصل معك قريباً' : '✅ Message sent successfully! We will contact you soon'
      );
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      toast.error(lang === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Error occurred, please try again');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      titleAr: 'الهاتف',
      titleEn: 'Phone',
      value: '+965 1234 5678',
      href: 'tel:+96512345678',
    },
    {
      icon: Mail,
      titleAr: 'البريد الإلكتروني',
      titleEn: 'Email',
      value: 'info@kdcow.com',
      href: 'mailto:info@kdcow.com',
    },
    {
      icon: MapPin,
      titleAr: 'العنوان',
      titleEn: 'Address',
      value: lang === 'ar' ? 'مدينة الكويت، الكويت' : 'Kuwait City, Kuwait',
      href: '#',
    },
    {
      icon: Clock,
      titleAr: 'ساعات العمل',
      titleEn: 'Working Hours',
      value: lang === 'ar' ? 'يومياً 8 ص - 11 م' : 'Daily 8 AM - 11 PM',
      href: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-10 sm:py-14">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-cairo font-bold text-foreground mb-3">
              {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h1>
            <p className="text-base text-muted-foreground font-cairo max-w-2xl mx-auto">
              {lang === 'ar'
                ? 'نحن هنا للإجابة على استفساراتك. لا تتردد في التواصل معنا في أي وقت.'
                : "We're here to answer your questions. Feel free to reach out anytime."}
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-3">
                {contactInfo.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <a
                      key={i}
                      href={c.href}
                      className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground font-cairo">
                          {lang === 'ar' ? c.titleAr : c.titleEn}
                        </div>
                        <div className="text-sm font-cairo font-semibold text-foreground truncate">{c.value}</div>
                      </div>
                    </a>
                  );
                })}

                {/* Social */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="text-xs text-muted-foreground font-cairo mb-3">
                    {lang === 'ar' ? 'تابعنا على' : 'Follow us'}
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
                      { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
                      { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                    ].map(({ Icon, href, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary flex items-center justify-center transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
                  <h2 className="text-xl font-cairo font-bold text-foreground">
                    {lang === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message'}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="font-cairo text-xs">
                        {lang === 'ar' ? 'الاسم *' : 'Name *'}
                      </Label>
                      <Input
                        id="name"
                        required
                        maxLength={100}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="font-cairo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="font-cairo text-xs">
                        {lang === 'ar' ? 'الهاتف' : 'Phone'}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        maxLength={30}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="font-cairo"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="font-cairo text-xs">
                      {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      maxLength={255}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="font-cairo"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="font-cairo text-xs">
                      {lang === 'ar' ? 'الموضوع' : 'Subject'}
                    </Label>
                    <Input
                      id="subject"
                      maxLength={200}
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="font-cairo"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="font-cairo text-xs">
                      {lang === 'ar' ? 'الرسالة *' : 'Message *'}
                    </Label>
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      maxLength={2000}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="font-cairo resize-none"
                    />
                    <div className="text-[10px] text-muted-foreground font-cairo text-end">
                      {form.message.length}/2000
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full font-cairo gap-2">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {lang === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
