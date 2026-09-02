import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps, MAPS_KEY, type GAny } from "@/lib/google-maps";
import type { LiveSpot } from "@/lib/parking-live";
import { minutesUntil } from "@/lib/parking-live";

interface Props {
  center: { lat: number; lng: number };
  spots: LiveSpot[];
  label?: string;
  onSpotClick?: (spotId: string) => void;
  /** Approximate radius to frame, in meters */
  radius?: number;
  /** compact = small card preview, full = large interactive map */
  variant?: "compact" | "full";
  /** Highlight the marker of this spot */
  activeId?: string | null;
  /** User's real GPS location marker — kept independent of the searched map center. */
  userLocation?: { lat: number; lng: number } | null;
  /** Spot owned by the current user; rendered in blue so it stands out as "my car". */
  ownSpotId?: string | null;
  className?: string;
}

function colorFor(s: LiveSpot, ownSpotId?: string | null) {
  if (s.id === ownSpotId) return "#2563EB";
  if (s.status === "reserved") return "#EF4444";
  return minutesUntil(s.planned_leave_at ?? s.leave_at) <= 1 ? "#10B981" : "#F59E0B";
}

function timeText(s: LiveSpot) {
  if (s.status === "reserved") return "held";
  const m = minutesUntil(s.planned_leave_at ?? s.leave_at);
  if (m <= 0) return "now";
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h`;
}

/** Car-shaped marker with a countdown badge, drawn as an inline SVG data URI. */
function carIcon(color: string, text: string, active: boolean): GAny {
  const w = 78;
  const h = 60;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 78 60">
  <g filter="none">
    <rect x="9" y="4" width="60" height="30" rx="12" fill="${color}" stroke="#ffffff" stroke-width="${active ? 4 : 3}"/>
    <g transform="translate(17,11) scale(0.68)" fill="#ffffff">
      <path d="M4 14 L6.5 6.5 C6.9 5.2 8 4.5 9.3 4.5 H20.7 C22 4.5 23.1 5.2 23.5 6.5 L26 14 H27.5 C28.6 14 29.5 14.9 29.5 16 V21 C29.5 22.1 28.6 23 27.5 23 H2.5 C1.4 23 0.5 22.1 0.5 21 V16 C0.5 14.9 1.4 14 2.5 14 Z"/>
      <circle cx="7" cy="23.5" r="3.2"/><circle cx="23" cy="23.5" r="3.2"/>
    </g>
    <text x="52" y="24" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="13" font-weight="700" fill="#ffffff">${text}</text>
    <path d="M39 34 L45 34 L39 42 L33 34 Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
  </g>
</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(39, 42),
  };
}

/** Real-coordinate map for search results: centers on the searched area, plots live spots as cars. */
export function AreaMap({
  center,
  spots,
  label,
  onSpotClick,
  radius = 1500,
  variant = "compact",
  activeId = null,
  userLocation = null,
  ownSpotId = null,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GAny | null>(null);
  const markersRef = useRef<Record<string, GAny>>({});
  const meRef = useRef<GAny | null>(null);
  const clickRef = useRef(onSpotClick);
  clickRef.current = onSpotClick;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  // refresh countdown badges every 30s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // init
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(ref.current, {
          center,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: variant === "full",
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
    const zoom = Math.min(17, Math.max(11, Math.round(Math.log2((156543 * 400) / radius))));
    mapRef.current.setZoom(zoom);
  }, [ready, center.lat, center.lng, radius]);

  // User's current location marker — never tied to the searched map center.
  useEffect(() => {
    if (!ready || !mapRef.current || variant !== "full") return;
    if (!userLocation) {
      if (meRef.current) {
        meRef.current.setMap(null);
        meRef.current = null;
      }
      return;
    }
    const pos = { lat: userLocation.lat, lng: userLocation.lng };
    if (!meRef.current) {
      meRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: pos,
        zIndex: 1,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#2563EB",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 4,
          scale: 7,
        },
      });
    } else {
      meRef.current.setPosition(pos);
    }
  }, [ready, variant, userLocation?.lat, userLocation?.lng]);

  // markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const seen = new Set<string>();
    spots.forEach((s) => {
      seen.add(s.id);
      const pos = { lat: s.lat, lng: s.lng };
      const icon = carIcon(colorFor(s), timeText(s), activeId === s.id);
      let m = markersRef.current[s.id];
      if (!m) {
        m = new google.maps.Marker({ map, position: pos, title: s.address ?? "Parking spot", icon, zIndex: 10 });
        m.addListener("click", () => clickRef.current?.(s.id));
        markersRef.current[s.id] = m;
      } else {
        m.setPosition(pos);
        m.setIcon(icon);
        m.setZIndex(activeId === s.id ? 50 : 10);
      }
    });
    Object.keys(markersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        markersRef.current[id]?.setMap(null);
        delete markersRef.current[id];
      }
    });
  }, [ready, spots, activeId, tick]);

  const shell =
    variant === "full"
      ? "relative h-full w-full overflow-hidden"
      : "relative h-52 w-full overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-card)]";

  return (
    <div className={className ? `${shell} ${className}` : shell}>
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
        <div className={`absolute inset-x-3 ${variant === "full" ? "top-3" : "bottom-3"} flex justify-center`}>
          <span className="flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-semibold shadow backdrop-blur">
            <MapPin className="h-3 w-3 text-[color:var(--emerald)]" /> {label}
            <span className="text-muted-foreground">· {spots.length} spot{spots.length === 1 ? "" : "s"}</span>
          </span>
        </div>
      )}
    </div>
  );
}
