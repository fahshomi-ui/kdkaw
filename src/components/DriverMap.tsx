import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Truck, Store, MapPin, Navigation, Loader2, Phone } from 'lucide-react';

// Default Makani store location (Kuwait City as fallback)
const STORE: [number, number] = [29.3759, 47.9774];

interface DriverPos {
  lat: number;
  lng: number;
  driver_name: string | null;
  driver_phone: string | null;
  heading: number | null;
  speed_kmh: number | null;
  updated_at: string;
}

interface Props {
  orderId: string;
  customerLat: number | null;
  customerLng: number | null;
  status: string;
}

const truckIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 6px 16px rgba(124,58,237,0.5);border:3px solid white;animation:pulse 2s infinite;">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 17V8a1 1 0 0 1 1-1h11l4 5v5"/></svg>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const storeIcon = L.divIcon({
  html: `<div style="background:hsl(var(--primary));width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:2px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const homeIcon = L.divIcon({
  html: `<div style="background:#10b981;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.4);border:2px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [JSON.stringify(points), map]);
  return null;
};

// Haversine distance in km
const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const DriverMap = ({ orderId, customerLat, customerLng, status }: Props) => {
  const { lang } = useLanguage();
  const [pos, setPos] = useState<DriverPos | null>(null);
  const [loading, setLoading] = useState(true);
  const simIntervalRef = useRef<number | null>(null);

  const customer: [number, number] | null = customerLat && customerLng ? [customerLat, customerLng] : null;

  // Fetch initial position
  useEffect(() => {
    let active = true;
    const fetchPosition = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('driver_positions')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      if (!active) return;
      if (data) setPos(data as DriverPos);
      setLoading(false);
    };

    void fetchPosition();
    const onReconnect = () => { void fetchPosition(); };
    window.addEventListener('kdcow-socket-reconnect', onReconnect);

    const channel = supabase
      .channel(`driver-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_positions', filter: `order_id=eq.${orderId}` },
        (payload) => {
          if (payload.new) setPos(payload.new as DriverPos);
        },
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener('kdcow-socket-reconnect', onReconnect);
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // DEMO simulator: when status === 'out_for_delivery' and no driver yet, simulate movement from STORE to customer
  useEffect(() => {
    if (simIntervalRef.current) {
      window.clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (status !== 'out_for_delivery' || !customer) return;
    if (pos) return; // real driver exists

    let step = 0;
    const totalSteps = 30;
    const start = STORE;
    const end = customer;

    const tick = async () => {
      step++;
      const t = Math.min(1, step / totalSteps);
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      // Local simulation only — write directly to local state to avoid DB writes
      setPos({
        lat, lng,
        driver_name: 'أحمد المحمد',
        driver_phone: '+96599887766',
        heading: 0,
        speed_kmh: 35,
        updated_at: new Date().toISOString(),
      });
      if (t >= 1 && simIntervalRef.current) {
        window.clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
    tick();
    simIntervalRef.current = window.setInterval(tick, 3000);

    return () => {
      if (simIntervalRef.current) window.clearInterval(simIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, customer?.[0], customer?.[1], pos?.driver_name === 'أحمد المحمد' ? null : pos?.lat]);

  const points: [number, number][] = useMemo(() => {
    const arr: [number, number][] = [STORE];
    if (customer) arr.push(customer);
    if (pos) arr.push([Number(pos.lat), Number(pos.lng)]);
    return arr;
  }, [pos, customer]);

  const distanceKm = pos && customer ? haversine([Number(pos.lat), Number(pos.lng)], customer) : null;
  const etaMin = distanceKm ? Math.max(2, Math.round((distanceKm / 35) * 60)) : null;

  if (!customer) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-center text-sm text-muted-foreground">
        {lang === 'ar' ? 'لا يتوفر إحداثيات الموقع لعرض الخريطة' : 'No location coordinates to display map'}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-border">
        <div>
          <h2 className="font-bold text-lg font-cairo flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            {lang === 'ar' ? 'تتبّع السائق المباشر' : 'Live Driver Tracking'}
          </h2>
          {pos && (
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {lang === 'ar' ? 'محدّث الآن' : 'Live now'}
            </div>
          )}
        </div>
        {etaMin !== null && (
          <div className="text-end">
            <div className="text-[10px] text-muted-foreground uppercase">
              {lang === 'ar' ? 'الوصول المتوقّع' : 'ETA'}
            </div>
            <div className="text-lg font-extrabold text-primary font-cairo">
              {etaMin} {lang === 'ar' ? 'دقيقة' : 'min'}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-[320px] md:h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-[400]">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <MapContainer
          center={customer}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />

          <Marker position={STORE} icon={storeIcon}>
            <Popup>
              <div className="font-cairo font-bold">
                {lang === 'ar' ? 'متجر كي دي كاو' : 'KDCow Store'}
              </div>
            </Popup>
          </Marker>

          <Marker position={customer} icon={homeIcon}>
            <Popup>
              <div className="font-cairo font-bold">
                {lang === 'ar' ? 'موقع التوصيل' : 'Delivery location'}
              </div>
            </Popup>
          </Marker>

          {pos && (
            <>
              <Marker position={[Number(pos.lat), Number(pos.lng)]} icon={truckIcon}>
                <Popup>
                  <div className="font-cairo">
                    <div className="font-extrabold">{pos.driver_name || (lang === 'ar' ? 'السائق' : 'Driver')}</div>
                    {pos.driver_phone && (
                      <a href={`tel:${pos.driver_phone}`} className="text-primary text-xs">{pos.driver_phone}</a>
                    )}
                  </div>
                </Popup>
              </Marker>
              <Polyline
                positions={[[Number(pos.lat), Number(pos.lng)], customer]}
                pathOptions={{ color: 'hsl(258, 90%, 60%)', weight: 4, dashArray: '8,8', opacity: 0.7 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Driver info */}
      {pos && (
        <div className="p-4 border-t border-border flex items-center gap-3 bg-muted/30">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold font-cairo truncate">
              {pos.driver_name || (lang === 'ar' ? 'السائق في الطريق' : 'Driver on the way')}
            </div>
            <div className="text-xs text-muted-foreground">
              {distanceKm !== null && (
                <>
                  {distanceKm.toFixed(1)} {lang === 'ar' ? 'كم' : 'km'}
                  {pos.speed_kmh ? ` • ${Math.round(Number(pos.speed_kmh))} ${lang === 'ar' ? 'كم/س' : 'km/h'}` : ''}
                </>
              )}
            </div>
          </div>
          {pos.driver_phone && (
            <a
              href={`tel:${pos.driver_phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'اتصال' : 'Call'}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverMap;
