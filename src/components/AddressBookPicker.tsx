import { MapPin, Star, Trash2, Check } from 'lucide-react';
import { useAddressBook, SavedAddressEntry } from '@/hooks/useAddressBook';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface Props {
  onSelect: (addr: SavedAddressEntry) => void;
  selectedId?: string;
}

const AddressBookPicker = ({ onSelect, selectedId }: Props) => {
  const { lang } = useLanguage();
  const { addresses, remove, setDefault } = useAddressBook();

  if (addresses.length === 0) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="font-cairo font-bold text-sm">
          {lang === 'ar' ? `عناويني المحفوظة (${addresses.length})` : `My Addresses (${addresses.length})`}
        </h3>
      </div>
      <div className="space-y-2">
        {addresses.map((a) => (
          <div
            key={a.id}
            className={`relative flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedId === a.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border/50 hover:border-primary/40 bg-muted/20'
            }`}
            onClick={() => onSelect(a)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-cairo font-bold text-sm">{a.label}</p>
                {a.isDefault && (
                  <span className="text-[10px] font-cairo font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    {lang === 'ar' ? 'افتراضي' : 'Default'}
                  </span>
                )}
                {selectedId === a.id && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground font-cairo line-clamp-1">
                {a.area} {a.block && `• ${lang === 'ar' ? 'قطعة' : 'Block'} ${a.block}`} {a.street && `• ${a.street}`}
              </p>
              <p className="text-[11px] text-muted-foreground font-cairo">{a.name} • {a.phone}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {!a.isDefault && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDefault(a.id); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                  aria-label="set default"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); remove(a.id); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressBookPicker;
