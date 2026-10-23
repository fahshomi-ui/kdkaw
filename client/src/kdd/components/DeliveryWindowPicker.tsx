import { useEffect, useMemo, useState } from 'react';
import { Clock, Sun, Sunset, Moon, Calendar as CalendarIcon } from 'lucide-react';
import { useLanguage } from '@/kdd/contexts/LanguageContext';

export type DeliveryWindow = 'morning' | 'evening' | 'night';

export interface DeliverySlot {
  date: string; // YYYY-MM-DD
  window: DeliveryWindow;
}

interface Props {
  value: DeliverySlot | null;
  onChange: (slot: DeliverySlot | null) => void;
  /** How many days ahead to offer (default 5). Today is included. */
  daysAhead?: number;
}

const WINDOWS: { v: DeliveryWindow; ar: string; en: string; hours: string; Icon: typeof Sun; startHour: number }[] = [
  { v: 'morning', ar: 'صباحاً', en: 'Morning', hours: '9 AM – 12 PM', Icon: Sun, startHour: 9 },
  { v: 'evening', ar: 'مساءً', en: 'Evening', hours: '3 PM – 6 PM', Icon: Sunset, startHour: 15 },
  { v: 'night', ar: 'ليلاً', en: 'Night', hours: '7 PM – 10 PM', Icon: Moon, startHour: 19 },
];

const formatDate = (d: Date) => {
  const y = String(d.getFullYear()).padStart(4, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDateKey = (dateKey: string): Date | null => {
  if (typeof dateKey !== 'string') return null;
  const match = DATE_KEY.exec(dateKey);
  if (!match) return null;

  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
};

/** Return whether a delivery slot is still selectable in the browser's local time zone. */
export const isDeliverySlotAvailable = (slot: DeliverySlot | null, now: Date = new Date()): boolean => {
  if (!slot || !(now instanceof Date) || Number.isNaN(now.getTime())) return false;
  const slotDate = parseDateKey(slot.date);
  const window = WINDOWS.find((candidate) => candidate.v === slot.window);
  if (!slotDate || !window) return false;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (slotDate.getTime() < today.getTime()) return false;
  return slotDate.getTime() !== today.getTime() || now.getHours() < window.startHour;
};

const DeliveryWindowPicker = ({ value, onChange, daysAhead = 5 }: Props) => {
  const { lang } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (value && !isDeliverySlotAvailable(value, now)) onChange(null);
  }, [now, onChange, value]);

  const todayKey = formatDate(now);
  const days = useMemo(() => {
    const today = parseDateKey(todayKey)!;
    return Array.from({ length: daysAhead }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, [daysAhead, todayKey]);

  const dayLabel = (d: Date, i: number) => {
    if (i === 0) return lang === 'ar' ? 'اليوم' : 'Today';
    if (i === 1) return lang === 'ar' ? 'غداً' : 'Tomorrow';
    return d.toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const selectedDate = value?.date || formatDate(days[0]);

  // For "today", disable windows whose start hour has already passed.
  const isWindowAvailable = (window: typeof WINDOWS[number], dateStr: string): boolean => {
    return isDeliverySlotAvailable({ date: dateStr, window: window.v }, now);
  };

  const handleDateClick = (dateStr: string) => {
    // Pick the first available window for that date if the current selection is unavailable.
    const currentWindow = WINDOWS.find((w) => w.v === value?.window);
    if (currentWindow && isWindowAvailable(currentWindow, dateStr)) {
      onChange({ date: dateStr, window: currentWindow.v });
    } else {
      const firstAvailable = WINDOWS.find((w) => isWindowAvailable(w, dateStr));
      if (firstAvailable) onChange({ date: dateStr, window: firstAvailable.v });
    }
  };

  const handleWindowClick = (w: DeliveryWindow) => {
    const window = WINDOWS.find((candidate) => candidate.v === w);
    if (!window || !isWindowAvailable(window, selectedDate)) return;
    onChange({ date: selectedDate, window: w });
  };

  return (
    <div className="space-y-4">
      {/* Date row */}
      <div>
        <span className="font-cairo font-bold text-sm mb-2 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          {lang === 'ar' ? 'تاريخ التوصيل' : 'Delivery date'}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {days.map((d, i) => {
            const dateStr = formatDate(d);
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                type="button"
                disabled={dateStr < todayKey}
                onClick={() => handleDateClick(dateStr)}
                className={`flex-shrink-0 min-w-[80px] px-3 py-2.5 rounded-xl border-2 font-cairo text-center transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="text-[11px] opacity-80">{dayLabel(d, i)}</div>
                <div className="text-base font-extrabold tabular-nums mt-0.5">{d.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Window row */}
      <div>
        <span className="font-cairo font-bold text-sm mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          {lang === 'ar' ? 'وقت التوصيل' : 'Delivery time'}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {WINDOWS.map((w) => {
            const Icon = w.Icon;
            const available = isWindowAvailable(w, selectedDate);
            const isSelected = value?.window === w.v && value?.date === selectedDate;
            return (
              <button
                key={w.v}
                type="button"
                disabled={!available}
                onClick={() => handleWindowClick(w.v)}
                className={`p-3 rounded-xl border-2 font-cairo text-center transition-all ${
                  !available
                    ? 'border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed'
                    : isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/40 text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-primary' : ''}`} />
                <div className="font-bold text-sm">{lang === 'ar' ? w.ar : w.en}</div>
                <div className="text-[10px] opacity-70 mt-0.5 tabular-nums">{w.hours}</div>
                {!available && (
                  <div className="text-[9px] text-destructive mt-0.5">
                    {lang === 'ar' ? 'انتهى' : 'Closed'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DeliveryWindowPicker;

/** Helper to format a slot for display. */
export const formatSlot = (slot: DeliverySlot, lang: string): string => {
  const w = WINDOWS.find((x) => x.v === slot.window);
  if (!w) return '';
  const d = new Date(slot.date);
  const dateStr = d.toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return `${dateStr} • ${lang === 'ar' ? w.ar : w.en} (${w.hours})`;
};
