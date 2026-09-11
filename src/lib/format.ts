/** Presentation helpers — no business logic. */

/** Masks a plate for public display: "A 12345" -> "A 12•••". */
export function maskPlate(plate?: string | null) {
  const value = (plate ?? "").trim();
  if (!value) return null;
  if (value.length <= 3) return value;
  const keep = Math.max(3, Math.ceil(value.length / 2));
  return `${value.slice(0, keep)}${"•".repeat(Math.min(3, value.length - keep))}`;
}

/** "820 m" / "1.4 km" */
export function distanceLabel(meters?: number | null) {
  if (meters == null) return "—";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

/** Rough walking time from meters (~80 m/min). */
export function walkMinutes(meters?: number | null) {
  if (meters == null) return null;
  return Math.max(1, Math.round(meters / 80));
}

/** Rough driving time from meters (~400 m/min in city traffic). */
export function driveMinutes(meters?: number | null) {
  if (meters == null) return null;
  return Math.max(1, Math.round(meters / 400));
}
