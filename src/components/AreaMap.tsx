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
  /** Spot ids that deserve stronger visual weight (nearest / soonest). */
  emphasisIds?: string[];
  /** User's real GPS location marker — kept independent of the searched map center. */
  userLocation?: { lat: number; lng: number } | null;
  /** Spot owned by the current user; rendered in blue so it stands out as "my car". */
  ownSpotId?: string | null;
  /** Live position of the driver on their way to take my spot. */
  driverLocation?: { lat: number; lng: number } | null;
  /** Label shown on the incoming-driver marker (e.g. "3 min"). */
  driverLabel?: string;
  className?: string;
}

function isDarkTheme() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/** Minimal, label-light map skin for both themes. */
function mapStyles(dark: boolean): GAny[] {
  const base: GAny[] = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "landscape.man_made", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "simplified" }] },
    { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
  ];
  if (!dark) {
    return [
      ...base,
      { elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dcfce7" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#f8fafc" }] },
    ];
  }
  return [
    ...base,
    { elementType: "geometry", stylers: [{ color: "#0b1120" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2233" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1a2b" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#10241f" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0b1120" }] },
  ];
}

function colorFor(s: LiveSpot, ownSpotId?: string | null) {
  if (s.id === ownSpotId) return "#3B82F6";
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

/**
 * Time-first spot marker: the countdown is the marker.
 * `emphasis` (nearest / soonest spots) renders larger, solid and with a soft halo;
 * de-emphasised spots stay small and quiet so the eye lands on the best option.
 */
function spotIcon(color: string, text: string, active: boolean, emphasis: boolean): GAny {
  const strong = active || emphasis;
  const w = strong ? 108 : 92;
  const h = strong ? 62 : 54;
  const pillW = strong ? 76 : 62;
  const pillH = strong ? 32 : 26;
  const x = (w - pillW) / 2;
  const cx = w / 2;
  const font = strong ? 14 : 12;
  const halo = active ? 0.26 : emphasis ? 0.16 : 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="s" x="-40%" y="-40%" width="180%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="${strong ? 3.5 : 2.5}" flood-color="#0f172a" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    ${halo ? `<rect x="${x - 6}" y="1" width="${pillW + 12}" height="${pillH + 12}" rx="${(pillH + 12) / 2}" fill="${color}" opacity="${halo}"/>` : ""}
    <rect x="${x}" y="7" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${color}" stroke="#ffffff" stroke-width="${active ? 3 : 2}"/>
    <circle cx="${x + pillH / 2}" cy="${7 + pillH / 2}" r="${strong ? 5 : 4}" fill="#ffffff" opacity="0.95"/>
    <text x="${x + pillH / 2 + (strong ? 9 : 7)}" y="${7 + pillH / 2 + font / 3}" text-anchor="start" font-family="Plus Jakarta Sans,system-ui,-apple-system,sans-serif" font-size="${font}" font-weight="800" fill="#ffffff">${text}</text>
    <path d="M${cx - 5} ${7 + pillH} L${cx + 5} ${7 + pillH} L${cx} ${7 + pillH + 8} Z" fill="${color}"/>
    <circle cx="${cx}" cy="${7 + pillH + 13}" r="${strong ? 3 : 2.5}" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
  </g>
</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(cx, 7 + pillH + 13),
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
  driverLocation = null,
  driverLabel = "arriving",
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GAny | null>(null);
  const markersRef = useRef<Record<string, GAny>>({});
  const meRef = useRef<GAny | null>(null);
  const driverRef = useRef<GAny | null>(null);
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
          styles: mapStyles(isDarkTheme()),
        });
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the map skin in sync with light/dark mode
  useEffect(() => {
    if (typeof document === "undefined") return;
    const apply = () => mapRef.current?.setOptions({ styles: mapStyles(isDarkTheme()) });
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [ready]);


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

  // Incoming driver on their way to take my spot — purple car marker, live updated.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (!driverLocation) {
      if (driverRef.current) { driverRef.current.setMap(null); driverRef.current = null; }
      return;
    }
    const pos = { lat: driverLocation.lat, lng: driverLocation.lng };
    const icon = spotIcon("#7C3AED", driverLabel, true, true);
    if (!driverRef.current) {
      driverRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: pos,
        icon,
        zIndex: 60,
        title: "Driver on the way",
      });
    } else {
      driverRef.current.setPosition(pos);
      driverRef.current.setIcon(icon);
    }
  }, [ready, driverLocation?.lat, driverLocation?.lng, driverLabel]);

  // markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const seen = new Set<string>();
    spots.forEach((s) => {
      seen.add(s.id);
      const pos = { lat: s.lat, lng: s.lng };
      const icon = spotIcon(
        colorFor(s, ownSpotId),
        timeText(s),
        activeId === s.id,
        s.id === ownSpotId || emphasisIds.includes(s.id),
      );
      let m = markersRef.current[s.id];
      if (!m) {
        m = new google.maps.Marker({ map, position: pos, title: s.address ?? "Parking spot", icon, zIndex: s.id === ownSpotId ? 20 : 10 });
        m.addListener("click", () => clickRef.current?.(s.id));
        markersRef.current[s.id] = m;
      } else {
        m.setPosition(pos);
        m.setIcon(icon);
        m.setZIndex(activeId === s.id ? 50 : s.id === ownSpotId ? 20 : 10);
      }
    });
    Object.keys(markersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        markersRef.current[id]?.setMap(null);
        delete markersRef.current[id];
      }
    });
  }, [ready, spots, activeId, ownSpotId, tick]);

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
