import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

// Abu Dhabi — bias suggestions to the launch market instead of the gateway's IP location.
const BIAS = {
  circle: { center: { latitude: 24.4539, longitude: 54.3773 }, radius: 50000 },
};

function creds() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const maps = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovable || !maps) throw new Error("maps_not_configured");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": maps,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

async function denied(res: Response): Promise<never> {
  const text = await res.text();
  if (res.status === 403) {
    let reason: string | undefined;
    try {
      reason = (JSON.parse(text)?.error?.details ?? []).find((d: { reason?: string }) => d.reason)?.reason;
    } catch { /* not JSON */ }
    if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") throw new Error("The Google Maps server key is referrer-restricted. Set its application restrictions to None or IP addresses.");
    if (reason === "API_KEY_SERVICE_BLOCKED") throw new Error("The Google Maps server key does not allow the Places API. Add it to the key's allowed APIs.");
    throw new Error("Google Maps denied the request (403). Check the server key restrictions.");
  }
  throw new Error(`Places request failed [${res.status}]: ${text.slice(0, 200)}`);
}

/** Autocomplete suggestions for the map search box. */
export const placeSuggest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      input: z.string().trim().min(2).max(120),
      sessionToken: z.string().max(64).optional(),
      language: z.enum(["en", "ar"]).default("en"),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const locationBias = data.lat != null && data.lng != null
      ? { circle: { center: { latitude: data.lat, longitude: data.lng }, radius: 50000 } }
      : BIAS;
    const res = await fetch(`${GATEWAY}/places/v1/places:autocomplete`, {
      method: "POST",
      headers: {
        ...creds(),
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
      },
      body: JSON.stringify({
        input: data.input,
        languageCode: data.language,
        regionCode: "AE",
        locationBias,
        ...(data.sessionToken ? { sessionToken: data.sessionToken } : {}),
      }),
    });
    if (!res.ok) await denied(res);
    const json = (await res.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string;
          text?: { text?: string };
          structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
        };
      }>;
    };
    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
      .slice(0, 6)
      .map((p) => ({
        id: p.placeId as string,
        text: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
        sub: p.structuredFormat?.secondaryText?.text ?? "",
      }));
  });

/** Coordinates for a selected suggestion. */
export const placeDetails = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      placeId: z.string().trim().min(3).max(300),
      sessionToken: z.string().max(64).optional(),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const qs = new URLSearchParams({ languageCode: data.language });
    if (data.sessionToken) qs.set("sessionToken", data.sessionToken);
    const res = await fetch(`${GATEWAY}/places/v1/places/${encodeURIComponent(data.placeId)}?${qs.toString()}`, {
      headers: { ...creds(), "X-Goog-FieldMask": "id,displayName,formattedAddress,location" },
    });
    if (!res.ok) await denied(res);
    const json = (await res.json()) as {
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    };
    if (json.location?.latitude == null || json.location?.longitude == null) throw new Error("no_location");
    return {
      label: json.displayName?.text ?? json.formattedAddress ?? "",
      address: json.formattedAddress ?? "",
      lat: json.location.latitude,
      lng: json.location.longitude,
    };
  });

/** Free-text search used when autocomplete returns nothing (landmarks, plain addresses). */
export const placeSearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      query: z.string().trim().min(2).max(160),
      language: z.enum(["en", "ar"]).default("en"),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        ...creds(),
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({
        textQuery: data.query,
        languageCode: data.language,
        regionCode: "AE",
        pageSize: 6,
        locationBias: BIAS,
      }),
    });
    if (!res.ok) await denied(res);
    const json = (await res.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
      }>;
    };
    return (json.places ?? [])
      .filter((p) => p.id && p.location?.latitude != null)
      .map((p) => ({
        id: p.id as string,
        text: p.displayName?.text ?? p.formattedAddress ?? "",
        sub: p.formattedAddress ?? "",
        lat: p.location?.latitude as number,
        lng: p.location?.longitude as number,
      }));
  });

/** Reverse geocode for the "you are here" area label. */
export const reverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ lat: z.number(), lng: z.number(), language: z.enum(["en", "ar"]).default("en") }).parse(d),
  )
  .handler(async ({ data }) => {
    const res = await fetch(
      `${GATEWAY}/maps/api/geocode/json?latlng=${data.lat},${data.lng}&language=${data.language}`,
      { headers: creds() },
    );
    if (!res.ok) await denied(res);
    const json = (await res.json()) as {
      results?: Array<{ address_components?: Array<{ long_name: string; types: string[] }>; formatted_address?: string }>;
    };
    const first = json.results?.[0];
    if (!first) return { label: null };
    const pick = (type: string) => first.address_components?.find((c) => c.types.includes(type))?.long_name;
    const neighborhood = pick("neighborhood") ?? pick("sublocality") ?? pick("locality");
    const city = pick("locality") ?? pick("administrative_area_level_1");
    const country = pick("country");
    if (neighborhood && city && neighborhood !== city) return { label: `${neighborhood} · ${city}${country ? `, ${country}` : ""}` };
    if (city) return { label: `${city}${country ? `, ${country}` : ""}` };
    return { label: first.formatted_address ?? null };
  });
