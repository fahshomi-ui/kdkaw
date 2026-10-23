
/**
 * توحيد رقم الهاتف الكويتي لصيغة قياسية (8 أرقام محلية)
 * يحذف المسافات/الشُرَط/الأقواس/الزائد، ويُسقط 00 و+ و965.
 * إذا لم يكن الإدخال هاتفاً (إيميل أو فارغ) يعيد نصاً مُقصوصاً.
 */
export const normalizePhone = (raw?: string | null): string => {
  if (!raw) return '';
  let p = String(raw).replace(/[\s\-()._]/g, '').trim();
  if (!p) return '';
  // إيميل؟ ارجعه كما هو (لاستخدام stock_alerts بنوع email)
  if (/[a-zA-Z@]/.test(p)) return p;
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('965') && p.length > 8) p = p.slice(3);
  return p;
};

export const getVisitorSessionId = (): string | null => null;
// Visitor identity linkage requires a separate protected backend. No payment-session tracking.
export const syncVisitorIdentity = async (_identity: { name?: string | null; phone?: string | null; email?: string | null }) => {};
