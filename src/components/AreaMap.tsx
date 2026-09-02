import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps, MAPS_KEY, type GAny } from "@/lib/google-maps";
import type { LiveSpot } from "@/lib/parking-live";

interface Props {
  center: { lat: number; lng: number };
  spots: LiveSpot[];
  label?: string;
  onSpotClick?: (spotId: string) => void;
  /** Approximate radius to frame, in meters */
  radius?: number;
}

function colorFor(s: LiveSpot) {
  if (s.status === "reserved") return "#EF4444";
  const t = new Date(s.planned_leave_at ?? s.leave_at).getTime();
  return t - Date.now() <= 60000 ? "#10B981" : "#F59E0B";
}

const pinIcon = (color: string): GAny => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: color,
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 3,
  scale: 8,
});

/** Compact real-coordinate map for search results: centers on the searched area, plots live spots. */
export function AreaMap({ center, spots, label, onSpotClick, radius = 1500 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GAny | null>(null);
  const markersRef = useRef<Record<string, GAny>>({});
  const clickRef = useRef(onSpotClick);
  clickRef.current = onSpotClick;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // init
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(ref.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          ],
        });
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow searched area
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.panTo(center);
    // rough zoom from radius: 156543 m/px at equator at zoom 0
    const zoom = Math.min(17, Math.max(11, Math.round(Math.log2(156543 * 400 / radius))));
    mapRef.current.setZoom(zoom);
  }, [ready, center.lat, center.lng, radius]);

  // markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const seen = new Set<string>();
    spots.forEach((s) => {
      seen.add(s.id);
      const pos = { lat: s.lat, lng: s.lng };
      let m = markersRef.current[s.id];
      if (!m) {
        m = new google.maps.Marker({ map, position: pos, title: s.address ?? "Parking spot", icon: pinIcon(colorFor(s)) });
        m.addListener("click", () => clickRef.current?.(s.id));
        markersRef.current[s.id] = m;
      } else {
        m.setPosition(pos);
        m.setIcon(pinIcon(colorFor(s)));
      }
    });
    Object.keys(markersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        markersRef.current[id]?.setMap(null);
        delete markersRef.current[id];
      }
    });
  }, [ready, spots]);

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-card)]">
      <div ref={ref} className="absolute inset-0" />
      {(!ready || failed || !MAPS_KEY) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
          {failed || !MAPS_KEY ? (
            <>
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">{label ?? "Map preview"} · {spots.length} spots</p>
            </>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--emerald)]" />
          )}
        </div>
      )}
      {label && (
        <div className="absolute inset-x-3 bottom-3 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-semibold shadow backdrop-blur">
            <MapPin className="h-3 w-3 text-[color:var(--emerald)]" /> {label}
            <span className="text-muted-foreground">· {spots.length} spot{spots.length === 1 ? "" : "s"}</span>
          </span>
        </div>
      )}
    </div>
  );
}
