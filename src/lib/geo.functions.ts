import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Reverse-geocode coordinates to a friendly area label via the Google Maps gateway. */
export const reverseGeocode = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ lat: z.number(), lng: z.number() }).parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !connKey) return { label: null as string | null };

    const res = await fetch(
      `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=${data.lat},${data.lng}`,
      { headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey } },
    );
    if (!res.ok) {
      console.error(`Geocode failed [${res.status}]: ${await res.text()}`);
      return { label: null as string | null };
    }
    const json = (await res.json()) as {
      results?: Array<{ formatted_address: string; address_components: Array<{ long_name: string; types: string[] }> }>;
    };
    const first = json.results?.[0];
    if (!first) return { label: null as string | null };

    const pick = (type: string) =>
      first.address_components.find((c) => c.types.includes(type))?.long_name;
    const neighborhood = pick("neighborhood") ?? pick("sublocality") ?? pick("locality");
    const city = pick("locality") ?? pick("administrative_area_level_1");
    const country = pick("country");
    const label =
      neighborhood && city && neighborhood !== city
        ? `${neighborhood} · ${city}${country ? `, ${country}` : ""}`
        : city
          ? `${city}${country ? `, ${country}` : ""}`
          : first.formatted_address;
    return { label };
  });
