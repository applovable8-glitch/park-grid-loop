import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, type GAny } from "@/lib/google-maps";

const cache = new Map<string, string>();

function labelFrom(result: GAny): string | null {
  const comps: Array<{ long_name: string; types: string[] }> = result?.address_components ?? [];
  const pick = (type: string) => comps.find((c) => c.types.includes(type))?.long_name;
  const neighborhood = pick("neighborhood") ?? pick("sublocality") ?? pick("locality");
  const city = pick("locality") ?? pick("administrative_area_level_1");
  const country = pick("country");
  if (neighborhood && city && neighborhood !== city)
    return `${neighborhood} · ${city}${country ? `, ${country}` : ""}`;
  if (city) return `${city}${country ? `, ${country}` : ""}`;
  return (result?.formatted_address as string) ?? null;
}

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
    loadGoogleMaps()
      .then((g) => new Promise<GAny>((resolve, reject) => {
        const geocoder = new g.maps.Geocoder();
        geocoder.geocode({ location: { lat: position.lat, lng: position.lng } }, (res: GAny, status: string) => {
          if (status === "OK" && res?.[0]) resolve(res[0]);
          else reject(new Error(status));
        });
      }))
      .then((res) => {
        if (cancelled) return;
        const next = labelFrom(res);
        if (!next) return;
        cache.set(key, next);
        setLabel(next);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [position]);

  return label;
}
