/* eslint-disable @typescript-eslint/no-explicit-any */
/** Loads the Google Maps JS API once, asynchronously. */
export type GAny = any;

let promise: Promise<GAny> | null = null;

export const MAPS_KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined;
const CHANNEL = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as string | undefined;

export function loadGoogleMaps(): Promise<GAny> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (promise) return promise;
  if (!MAPS_KEY) return Promise.reject(new Error("Missing Google Maps browser key"));

  promise = new Promise<GAny>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    if ((w["google"] as GAny)?.maps?.Map) {
      resolve(w["google"] as GAny);
      return;
    }
    const cb = "__parkoutInitMap";
    w[cb] = () => resolve(w["google"] as GAny);
    const s = document.createElement("script");
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&loading=async&callback=${cb}` +
      (CHANNEL ? `&channel=${CHANNEL}` : "");
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return promise;
}
