import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon, MapPin, Clock, Navigation2, Zap, SlidersHorizontal, LocateFixed, X } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { AreaMap } from "@/components/AreaMap";
import { SpotSheet } from "@/components/SpotSheet";
import { useApp } from "@/lib/parkout-store";
import { useGeolocation } from "@/lib/use-geolocation";
import { loadGoogleMaps, type GAny } from "@/lib/google-maps";
import {
  clockOf,
  haversine,
  minutesUntil,
  requestSpot,
  useLiveSpots,
  useMyRequest,
  type LiveSpot,
} from "@/lib/parking-live";

export const Route = createFileRoute("/search")({ component: SearchPage });

const TIME_FILTERS = [
  { id: "any", label: "Any time", maxMins: Infinity },
  { id: "now", label: "Free now", maxMins: 1 },
  { id: "15", label: "Within 15 min", maxMins: 15 },
  { id: "30", label: "Within 30 min", maxMins: 30 },
  { id: "60", label: "Within 1 hour", maxMins: 60 },
  { id: "custom", label: "Pick a time…", maxMins: Infinity },
] as const;

const NEAR_ME_KM = 3;

type TimeFilter = (typeof TIME_FILTERS)[number]["id"];

interface PickedPlace {
  label: string;
  lat: number;
  lng: number;
}

function SearchPage() {
  const { user } = useApp();
  const nav = useNavigate();
  const { position } = useGeolocation();
  const { spots, loading } = useLiveSpots();
  const { request } = useMyRequest(user?.id);

  const [q, setQ] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("any");
  const [customTime, setCustomTime] = useState("");
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forceList, setForceList] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; text: string; sub: string }>>([]);
  const tokenRef = useRef<GAny | null>(null);

  // Places API (New) autocomplete — debounced suggestions for any area.
  useEffect(() => {
    if (!q.trim() || (place && q === place.label)) { setSuggestions([]); return; }
    const handle = setTimeout(async () => {
      try {
        const google = await loadGoogleMaps();
        const lib = (await google.maps.importLibrary("places")) as GAny;
        if (!tokenRef.current) tokenRef.current = new lib.AutocompleteSessionToken();
        const { suggestions: s } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: tokenRef.current,
        });
        setSuggestions(
          (s ?? [])
            .filter((x: GAny) => x.placePrediction)
            .map((x: GAny) => ({
              id: x.placePrediction.placeId,
              text: x.placePrediction.text?.text ?? "",
              sub: x.placePrediction.secondaryText?.text ?? "",
            }))
            .slice(0, 5),
        );
      } catch {
        setSuggestions([]); // key missing — address text filter still works
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [q, place]);

  const pickPlace = async (s: { id: string; text: string }) => {
    setSuggestions([]);
    try {
      const google = await loadGoogleMaps();
      const lib = (await google.maps.importLibrary("places")) as GAny;
      const p = new lib.Place({ id: s.id });
      await p.fetchFields({ fields: ["location", "displayName", "formattedAddress"] });
      const loc = p.location;
      if (!loc) throw new Error("no location");
      const label = p.displayName ?? s.text;
      setPlace({ label, lat: loc.lat(), lng: loc.lng() });
      setForceList(false);
      setQ(label);
      setNearMe(false);
      tokenRef.current = null; // end autocomplete session
      toast.success(`Searching around ${label}`);
    } catch {
      toast.error("Could not locate that place.");
    }
  };

  // Center used for distance math: picked area > user location.
  const center = useMemo(() => {
    if (nearMe) return position ? { lat: position.lat, lng: position.lng } : null;
    if (place) return { lat: place.lat, lng: place.lng };
    return position ? { lat: position.lat, lng: position.lng } : null;
  }, [nearMe, place, position]);

  const customDeadline = useMemo(() => {
    if (timeFilter !== "custom" || !customTime) return null;
    const [h, m] = customTime.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }, [timeFilter, customTime]);

  const list = useMemo(() => {
    const preset = TIME_FILTERS.find((f) => f.id === timeFilter) ?? TIME_FILTERS[0];
    return spots
      .filter((s) => s.user_id !== user?.id)
      .filter((s) => (s.address ?? "").toLowerCase().includes(q.toLowerCase()) || !!place)
      .map((s) => ({
        ...s,
        distance: center ? haversine(center, { lat: s.lat, lng: s.lng }) : null,
        mins: minutesUntil(s.planned_leave_at ?? s.leave_at),
      }))
      .filter((s) => {
        if (nearMe && (s.distance === null || s.distance > NEAR_ME_KM * 1000)) return false;
        if (timeFilter === "custom") {
          if (customDeadline === null) return true;
          const t = new Date(s.planned_leave_at ?? s.leave_at).getTime();
          return t <= customDeadline;
        }
        if (preset.maxMins !== Infinity) return s.mins <= preset.maxMins;
        return true;
      })
      .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  }, [spots, q, place, timeFilter, customDeadline, center, nearMe, user?.id]);

  const ask = async (spotId: string) => {
    setBusy(spotId);
    const { id, error } = await requestSpot(spotId);
    setBusy(null);
    if (error || !id) { toast.error(error ?? "Could not send request"); return; }
    toast.success("Request sent to the driver");
    nav({ to: "/reservation/$id", params: { id } });
  };

  const mapMode = (!!place || nearMe) && !forceList;
  const selected = selectedId ? spots.find((s) => s.id === selectedId) ?? null : null;

  const enableNearMe = () => {
    if (!position) {
      toast.error("Location unavailable — enable GPS to see spots near you.");
      return;
    }
    setNearMe(true);
    setForceList(false);
    setPlace(null);
    setQ("");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 bg-background/90 px-4 pt-5 pb-3 backdrop-blur-xl">
        <h1 className="font-[var(--font-display)] text-2xl font-bold">Find parking</h1>
        <p className="text-xs text-muted-foreground">Search any area, or spots near you within {NEAR_ME_KM} km</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-[var(--shadow-card)]">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); if (place && e.target.value !== place.label) setPlace(null); }}
              placeholder="Search an area, mall, street…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {(q || place) && (
              <button onClick={() => { setQ(""); setPlace(null); }} aria-label="Clear search">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Link to="/search/filters" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
            <SlidersHorizontal className="h-4 w-4" />
          </Link>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => pickPlace(s)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
              >
                <MapPin className="h-4 w-4 shrink-0 text-[color:var(--emerald)]" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{s.text}</span>
                  {s.sub && <span className="block truncate text-[11px] text-muted-foreground">{s.sub}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={enableNearMe}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${nearMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          >
            <LocateFixed className="h-3.5 w-3.5" /> Near me · {NEAR_ME_KM} km
          </button>
          {place && !nearMe && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" /> {place.label}
            </span>
          )}
          {TIME_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${timeFilter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {timeFilter === "custom" && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">I need a spot that frees up by</span>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="rounded-lg bg-muted px-2 py-1 text-sm outline-none"
            />
          </div>
        )}
      </header>

      {mapMode && center && (
        <div className="relative h-[calc(100vh-260px)] min-h-[380px] w-full">
          <AreaMap
            variant="full"
            center={center}
            spots={list}
            activeId={selected?.id ?? null}
            label={nearMe ? `Within ${NEAR_ME_KM} km of you` : place?.label}
            radius={nearMe ? NEAR_ME_KM * 1000 : 1500}
            onSpotClick={(id) => setSelectedId(id)}
          />
          <button
            onClick={() => setForceList(true)}
            className="absolute inset-x-0 bottom-24 mx-auto w-fit rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-[var(--shadow-card)]"
          >
            Show list · {list.length}
          </button>
        </div>
      )}

      {selected && (
        <SpotSheet
          spot={selected}
          distance={center ? haversine(center, { lat: selected.lat, lng: selected.lng }) : null}
          isMine={selected.user_id === user?.id}
          requestDisabled={!!request || selected.status === "reserved"}
          requestBusy={busy === selected.id}
          onRequest={() => ask(selected.id)}
          onClose={() => setSelectedId(null)}
        />
      )}


      {request && (
        <div className="mx-4 mt-3 rounded-2xl bg-emerald/10 p-3 text-xs text-[color:var(--emerald)]">
          You already hold a spot request.{" "}
          <Link to="/reservation/$id" params={{ id: request.id }} className="font-bold underline">Open it</Link> — release it before choosing another.
        </div>
      )}

      <div className="space-y-3 px-4 pt-3">
        {list.map((s) => (
          <SpotCard
            key={s.id}
            spot={s}
            distance={s.distance}
            mins={s.mins}
            disabled={!!request || s.status === "reserved"}
            busy={busy === s.id}
            onReserve={() => ask(s.id)}
          />
        ))}
        {!loading && list.length === 0 && (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            {nearMe ? `No live spots within ${NEAR_ME_KM} km of you right now.` : "No live parking spots match your search."}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function SpotCard({ spot, distance, mins, disabled, busy, onReserve }: {
  spot: LiveSpot; distance: number | null; mins: number; disabled: boolean; busy: boolean; onReserve: () => void;
}) {
  const free = mins <= 1;
  const dot = spot.status === "reserved" ? "bg-red-500" : free ? "bg-[var(--emerald)]" : "bg-orange-500";
  const distLabel = distance === null ? "—" : distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance}m`;
  return (
    <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {spot.status === "reserved" ? "Reserved" : free ? "Free now" : `Driver leaves at ${clockOf(spot.planned_leave_at ?? spot.leave_at)}`}
            </span>
          </div>
          <Link to="/parking/$id" params={{ id: spot.id }}>
            <h3 className="mt-1 font-[var(--font-display)] text-base font-bold leading-tight">{spot.address ?? "Shared parking spot"}</h3>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {distLabel} away</span>
            <span className="flex items-center gap-1"><Navigation2 className="h-3.5 w-3.5" /> {distance === null ? "—" : `${Math.max(1, Math.round(distance / 400))} min drive`}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {free ? "now" : `in ${mins}m`}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-2xl bg-emerald/10 px-2.5 py-1 text-center">
            <p className="font-[var(--font-display)] text-lg font-bold text-[color:var(--emerald)] leading-none">{spot.cost}</p>
            <p className="text-[9px] uppercase tracking-wider text-[color:var(--emerald)]/80">points</p>
          </div>
        </div>
      </div>

      <button
        onClick={onReserve}
        disabled={disabled || busy}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all ${
          disabled ? "bg-muted text-muted-foreground" : "text-white shadow-[var(--shadow-glow)] active:scale-[0.98]"
        }`}
        style={disabled ? undefined : { background: "var(--gradient-emerald)" }}
      >
        <Zap className="h-4 w-4" />
        {spot.status === "reserved" ? "Unavailable" : busy ? "Sending…" : disabled ? "One spot at a time" : "Request this spot"}
      </button>
    </div>
  );
}
