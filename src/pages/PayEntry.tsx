import { useEffect } from 'react';

/** جسر الدفع: يستقبل المبلغ/الخدمة من المتجر ثم يحوّل لصفحة البطاقة. */
export default function PayEntry() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const total = q.get('total') || q.get('amount') || localStorage.getItem('Total') || '0';
    const service = q.get('service') || q.get('kddService') || '';
    localStorage.setItem('Total', total);
    localStorage.setItem('kddAmount', total);
    localStorage.setItem('kddService', service);
    window.location.replace('/card');
  }, []);
  return null;
}
