import { useCallback, useEffect, useRef, useState } from "react";

export type GeoStatus = "idle" | "prompt" | "locating" | "granted" | "denied" | "unavailable";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
}

/** Live user location with permission handling + continuous watch. */
export function useGeolocation(auto = true) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus((s) => (s === "granted" ? s : "locating"));
    setError(null);
    stop();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: Number.isFinite(pos.coords.heading as number) ? (pos.coords.heading as number) : null,
        });
        setStatus("granted");
      },
      (err) => {
        setError(err.message);
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [stop]);

  useEffect(() => {
    if (!auto || typeof navigator === "undefined") return;
    let cancelled = false;
    const start = async () => {
      try {
        const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
        if (cancelled) return;
        if (perm?.state === "denied") {
          setStatus("denied");
          return;
        }
        if (perm?.state === "prompt") setStatus("prompt");
      } catch {
        /* permissions API unsupported */
      }
      if (!cancelled) request();
    };
    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [auto, request, stop]);

  return { position, status, error, request, stop };
}
