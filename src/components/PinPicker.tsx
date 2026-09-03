import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps, MAPS_KEY, type GAny } from "@/lib/google-maps";

interface Props {
  /** Initial center, e.g. the user's GPS position */
  initial: { lat: number; lng: number } | null;
  /** Called whenever the user moves the map; the pin is the map center */
  onChange: (pos: { lat: number; lng: number }) => void;
  className?: string;
}

/** Manual parking-pin picker: drag the map, the car pin stays fixed at the center. */
export function PinPicker({ initial, onChange, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GAny | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || mapRef.current) return;
        const map = new google.maps.Map(ref.current, {
          center: initial ?? { lat: 25.2048, lng: 55.2708 },
          zoom: initial ? 17 : 12,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          ],
        });
        mapRef.current = map;
        const report = () => {
          const c = map.getCenter();
          if (c) changeRef.current({ lat: c.lat(), lng: c.lng() });
        };
        map.addListener("idle", report);
        report();
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (initial && mapRef.current) {
      mapRef.current.panTo(initial);
      mapRef.current.setZoom(17);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ring-1 ring-white/20 ${className ?? "h-56"}`}>
      <div ref={ref} className="absolute inset-0" />

      {/* Fixed center pin: car in a parking badge */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="-translate-y-3 drop-shadow-lg">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--emerald)] ring-4 ring-white">
            <svg viewBox="0 0 30 30" className="h-5 w-5 fill-white">
              <path d="M4 14 L6.5 6.5 C6.9 5.2 8 4.5 9.3 4.5 H20.7 C22 4.5 23.1 5.2 23.5 6.5 L26 14 H27.5 C28.6 14 29.5 14.9 29.5 16 V21 C29.5 22.1 28.6 23 27.5 23 H2.5 C1.4 23 0.5 22.1 0.5 21 V16 C0.5 14.9 1.4 14 2.5 14 Z" />
              <circle cx="7" cy="23.5" r="3.2" /><circle cx="23" cy="23.5" r="3.2" />
            </svg>
          </div>
          <div className="mx-auto h-3 w-1.5 rounded-b bg-[var(--emerald)]" />
        </div>
      </div>

      {/* Use my location */}
      {initial && (
        <button
          onClick={useMyLocation}
          aria-label="Use my current location"
          className="absolute bottom-3 end-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-foreground shadow-[var(--shadow-card)]"
        >
          <LocateFixed className="h-4 w-4 text-[color:var(--emerald)]" />
        </button>
      )}

      {(!ready || failed || !MAPS_KEY) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-foreground">
          {failed || !MAPS_KEY ? (
            <>
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">Map unavailable — your GPS location will be used</p>
            </>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--emerald)]" />
          )}
        </div>
      )}
    </div>
  );
}
