import { useEffect, useRef, useState } from "react";
import { reverseGeocode } from "@/lib/geo.functions";

const cache = new Map<string, string>();

/** Resolves the current coordinates into a friendly area name ("JBR · Dubai, UAE"). */
export function useAreaName(position: { lat: number; lng: number } | null) {
  const [label, setLabel] = useState<string | null>(null);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!position) { setLabel(null); return; }
    // ~100 m grid so small GPS drift doesn't re-geocode
    const key = `${position.lat.toFixed(3)},${position.lng.toFixed(3)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    const hit = cache.get(key);
    if (hit) { setLabel(hit); return; }
    let cancelled = false;
    reverseGeocode({ data: { lat: position.lat, lng: position.lng } })
      .then((r) => {
        if (cancelled || !r?.label) return;
        cache.set(key, r.label);
        setLabel(r.label);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [position]);

  return label;
}
