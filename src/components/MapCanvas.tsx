import { useEffect, useRef, useState } from "react";
import type { ParkingSpot } from "@/lib/parkout-store";
import { Navigation, MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps, MAPS_KEY, type GAny } from "@/lib/google-maps";
import { useGeolocation } from "@/lib/use-geolocation";

interface Props {
  spots: ParkingSpot[];
  onSpotClick?: (s: ParkingSpot) => void;
  /** Show traffic layer toggle result */
  traffic?: boolean;
  mapType?: "roadmap" | "satellite";
  /** Bumped from parent to re-center on the user */
  recenterSignal?: number;
}

const DEFAULT_CENTER = { lat: 25.1972, lng: 55.2744 }; // Downtown Dubai

const COLORS: Record<ParkingSpot["status"], string> = {
  available: "#10B981",
  leaving: "#F59E0B",
  reserved: "#EF4444",
};

/** Converts the stylized 0-100 spot coordinates into geo offsets around a center. */
export function spotLatLng(s: ParkingSpot, center: { lat: number; lng: number }) {
  return {
    lat: center.lat + (50 - s.lat) * 0.00035,
    lng: center.lng + (s.lng - 50) * 0.00045,
  };
}

const pinIcon = (color: string): GAny => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: color,
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 3,
  scale: 8,
});

export function MapCanvas({ spots, onSpotClick, traffic = false, mapType = "roadmap", recenterSignal = 0 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GAny | null>(null);
  const markersRef = useRef<Record<string, GAny>>({});
  const meRef = useRef<GAny | null>(null);
  const accuracyRef = useRef<GAny | null>(null);
  const trafficRef = useRef<GAny | null>(null);
  const clickRef = useRef(onSpotClick);
  clickRef.current = onSpotClick;

  const { position, status, request } = useGeolocation(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const center = position ?? DEFAULT_CENTER;

  // init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(ref.current, {
          center: DEFAULT_CENTER,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: "greedy",
          clickableIcons: false,
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          ],
        });
        trafficRef.current = new google.maps.TrafficLayer();
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // map type + traffic
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setMapTypeId(mapType);
    trafficRef.current?.setMap(traffic ? mapRef.current : null);
  }, [ready, traffic, mapType]);

  // user location marker
  useEffect(() => {
    if (!ready || !mapRef.current || !position) return;
    const map = mapRef.current;
    const pos = { lat: position.lat, lng: position.lng };
    if (!meRef.current) {
      meRef.current = new google.maps.Marker({
        map,
        position: pos,
        zIndex: 999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#2563EB",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 4,
          scale: 8,
        },
      });
      accuracyRef.current = new google.maps.Circle({
        map,
        center: pos,
        radius: position.accuracy,
        fillColor: "#2563EB",
        fillOpacity: 0.12,
        strokeColor: "#2563EB",
        strokeOpacity: 0.25,
        strokeWeight: 1,
      });
      map.setCenter(pos);
    } else {
      meRef.current.setPosition(pos);
      accuracyRef.current?.setCenter(pos);
      accuracyRef.current?.setRadius(position.accuracy);
    }
  }, [ready, position]);

  // recenter on demand
  useEffect(() => {
    if (!recenterSignal || !mapRef.current) return;
    if (position) {
      mapRef.current.panTo({ lat: position.lat, lng: position.lng });
      mapRef.current.setZoom(17);
    } else {
      request();
    }
  }, [recenterSignal, position, request]);

  // spot markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const seen = new Set<string>();
    spots.forEach((s) => {
      seen.add(s.id);
      const pos = spotLatLng(s, center);
      let m = markersRef.current[s.id];
      if (!m) {
        m = new google.maps.Marker({ map, position: pos, title: s.address, icon: pinIcon(COLORS[s.status]) });
        m.addListener("click", () => clickRef.current?.(s));
        markersRef.current[s.id] = m;
      } else {
        m.setPosition(pos);
        m.setIcon(pinIcon(COLORS[s.status]));
      }
    });
    Object.keys(markersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        markersRef.current[id]?.setMap(null);
        delete markersRef.current[id];
      }
    });
  }, [ready, spots, center.lat, center.lng]);

  if (failed || !MAPS_KEY) return <FallbackMap spots={spots} onSpotClick={onSpotClick} />;

  return (
    <div className="absolute inset-0">
      <div ref={ref} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
          <Loader2 className="h-5 w-5 animate-spin text-[color:var(--emerald)]" />
        </div>
      )}
      {status === "denied" && (
        <div className="pointer-events-auto absolute inset-x-4 top-[260px] z-10 rounded-2xl bg-card/95 p-3 text-center shadow-[var(--shadow-card)] backdrop-blur">
          <p className="text-xs font-semibold">Location permission is off</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Enable location to see live parking around you.</p>
          <button onClick={request} className="mt-2 rounded-xl bg-[var(--emerald)] px-3 py-1.5 text-xs font-semibold text-white">
            Enable location
          </button>
        </div>
      )}
    </div>
  );
}

/** Stylized fallback used when no Maps key or the SDK fails to load. */
function FallbackMap({ spots, onSpotClick }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 30% 0%, #eaf3ef 0%, #e6ecf2 40%, #dfe6ee 100%)" }}
      />
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="streets" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M0 30 H60 M30 0 V60" stroke="#c7d2de" strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#streets)" />
      </svg>
      {spots.map((s) => (
        <button
          key={s.id}
          onClick={() => onSpotClick?.(s)}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${s.lng}%`, top: `${s.lat}%` }}
          aria-label={`${s.status} spot ${s.address}`}
        >
          <span className="relative flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white" style={{ background: COLORS[s.status] }}>
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </button>
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white">
          <Navigation className="h-3 w-3 fill-white text-white" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-2 flex justify-center">
        <span className="flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> Offline map preview
        </span>
      </div>
    </div>
  );
}
