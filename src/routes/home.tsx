import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search as SearchIcon, MapPin, Clock, Navigation2, LocateFixed, X, List, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/parkout-store";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { AreaMap } from "@/components/AreaMap";
import { SpotSheet } from "@/components/SpotSheet";
import { useRequireProfile } from "@/lib/use-require-auth";
import { useI18n } from "@/lib/i18n";
import { useGeolocation } from "@/lib/use-geolocation";
import { useAreaName } from "@/lib/use-area-name";
import { useThreads } from "@/lib/chat";
import { loadGoogleMaps, type GAny } from "@/lib/google-maps";
import {
  clockOf, haversine, minutesUntil, publishSeekerLocation, requestSpot, useIncomingConfirmed, useLiveSpots,
  useMyRequest, useMySharedSpot, type LiveSpot,
} from "@/lib/parking-live";

export const Route = createFileRoute("/home")({ component: Home });

const TIME_FILTERS = [
  { id: "any", label: "Any time", maxMins: Infinity },
  { id: "now", label: "Free now", maxMins: 1 },
  { id: "15", label: "≤ 15 min", maxMins: 15 },
  { id: "30", label: "≤ 30 min", maxMins: 30 },
  { id: "60", label: "≤ 1 hour", maxMins: 60 },
] as const;

const NEAR_ME_KM = 3;
const FALLBACK_CENTER = { lat: 25.2048, lng: 55.2708 }; // Dubai

type TimeFilter = (typeof TIME_FILTERS)[number]["id"];

interface PickedPlace {
  label: string;
  lat: number;
  lng: number;
}

function Home() {
  const { ready } = useRequireProfile();
  const { user } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const { position } = useGeolocation();
  const areaName = useAreaName(position);
  const { totalUnread } = useThreads(user?.id);
  const { spots, loading } = useLiveSpots();
  const { request } = useMyRequest(user?.id);
  const { spot: mySpot } = useMySharedSpot(user?.id);
  const { ping: driverPing } = useIncomingConfirmed(user?.id, mySpot?.id);

  const [q, setQ] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("any");
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; text: string; sub: string }>>([]);
  const tokenRef = useRef<GAny | null>(null);
  const [, setTick] = useState(0);

  // keep the shared-spot countdown ticking
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // While my reservation is confirmed, share my position so the spot owner can follow me.
  useEffect(() => {
    if (!request || request.request_status !== "confirmed" || !position) return;
    void publishSeekerLocation(request.id, position.lat, position.lng);
  }, [request?.id, request?.request_status, position?.lat, position?.lng]);

  // Tell the spot owner (once) that the approved driver started moving — in Notifications, not on the map.
  useEffect(() => {
    if (!driverPing || !user?.id) return;
    const key = `parkout.otw.${driverPing.reservation_id}`;
    if (typeof window === "undefined" || window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    void supabase.from("notifications").insert({
      user_id: user.id,
      title: "Driver on the way",
      body: "The driver you approved is heading to your spot now.",
      icon: "reserve",
      metadata: { kind: "on_the_way", reservation_id: driverPing.reservation_id },
    });
  }, [driverPing?.reservation_id, user?.id]);

  // Places autocomplete — debounced.
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
        setSuggestions([]);
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
      setQ(label);
      setNearMe(false);
      setShowList(false);
      tokenRef.current = null;
      toast.success(`Searching around ${label}`);
    } catch {
      toast.error("Could not locate that place.");
    }
  };

  // Map center: picked area > user location > fallback.
  const center = useMemo(() => {
    if (nearMe || !place) {
      if (position) return { lat: position.lat, lng: position.lng };
      if (mySpot) return { lat: mySpot.lat, lng: mySpot.lng };
      return place ?? FALLBACK_CENTER;
    }
    return { lat: place.lat, lng: place.lng };
  }, [nearMe, place, position, mySpot?.lat, mySpot?.lng]);

  const list = useMemo(() => {
    const preset = TIME_FILTERS.find((f) => f.id === timeFilter) ?? TIME_FILTERS[0];
    return spots
      .filter((s) => s.user_id !== user?.id)
      .filter((s) => (s.address ?? "").toLowerCase().includes(q.toLowerCase()) || !!place || nearMe)
      .map((s) => ({
        ...s,
        distance: haversine(center, { lat: s.lat, lng: s.lng }),
        mins: minutesUntil(s.planned_leave_at ?? s.leave_at),
      }))
      .filter((s) => {
        if (nearMe && s.distance > NEAR_ME_KM * 1000) return false;
        if (preset.maxMins !== Infinity) return s.mins <= preset.maxMins;
        return true;
      })
      .sort((a, b) => a.distance - b.distance);
  }, [spots, q, place, timeFilter, center, nearMe, user?.id]);

  const mapSpots = useMemo<LiveSpot[]>(() => {
    const base: LiveSpot[] = [...list];
    if (mySpot) base.push(mySpot);
    return base;
  }, [list, mySpot]);

  const ask = async (spotId: string) => {
    setBusy(spotId);
    const { id, error } = await requestSpot(spotId);
    setBusy(null);
    if (error || !id) { toast.error(error ?? "Could not send request"); return; }
    setSelectedId(null);
    toast.success("Request sent to the driver");
    nav({ to: "/reservation/$id", params: { id } });
  };

  const enableNearMe = () => {
    if (!position) {
      toast.error("Location unavailable — enable GPS to see spots near you.");
      return;
    }
    setNearMe(true);
    setPlace(null);
    setQ("");
    setShowList(false);
  };

  const recenter = () => {
    setPlace(null);
    setQ("");
    setNearMe(false);
  };

  const driverDistance = driverPing && mySpot
    ? haversine({ lat: mySpot.lat, lng: mySpot.lng }, { lat: driverPing.lat, lng: driverPing.lng })
    : null;
  const driverLabel = driverDistance == null
    ? "arriving"
    : driverDistance >= 1000 ? `${(driverDistance / 1000).toFixed(1)}km` : `${driverDistance}m`;

  const selected = selectedId ? spots.find((s) => s.id === selectedId) ?? null : null;
  const available = list.filter((s) => s.status !== "reserved").length;

  if (!ready) return null;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Full-screen live map */}
      <div className="absolute inset-0">
        <AreaMap
          variant="full"
          center={center}
          userLocation={position}
          ownSpotId={mySpot?.id ?? null}
          driverLocation={driverPing ? { lat: driverPing.lat, lng: driverPing.lng } : null}
          driverLabel={driverLabel}
          spots={mapSpots}
          activeId={selected?.id ?? null}
          radius={nearMe ? NEAR_ME_KM * 1000 : 1800}
          onSpotClick={(id) => { setSelectedId(id); setShowList(false); }}
        />
      </div>

      {/* Top bar: current area + avatar */}
      <div className="relative z-20 px-4 pt-4">
        <div className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-[var(--shadow-card)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-4 w-4" fill="var(--emerald)" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("current_area")}</p>
            <p className="truncate text-sm font-semibold">
              {place ? place.label : (areaName ?? (position ? "Locating…" : "Enable location"))}
            </p>
          </div>
          <Link
            to="/messages"
            aria-label="Messages"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted"
          >
            <MessageCircle className="h-4 w-4" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--emerald)] px-1 text-[9px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </Link>
          <Link to="/profile" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald text-emerald-foreground font-bold text-sm">
            {user?.name?.[0] ?? "U"}
          </Link>
        </div>

        {/* Search input */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); if (place && e.target.value !== place.label) setPlace(null); }}
            placeholder={t("where_park")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {(q || place) && (
            <button onClick={() => { setQ(""); setPlace(null); }} aria-label="Clear search">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--emerald)]">
            {available} {t("live")}
          </span>
        </div>

        {/* Place suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => pickPlace(s)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/60"
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

        {/* Filter chips */}
        <div className="mt-2.5 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={enableNearMe}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-card)] ${nearMe ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            <LocateFixed className="h-3.5 w-3.5" /> Near me · {NEAR_ME_KM} km
          </button>
          {TIME_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-card)] ${timeFilter === f.id ? "bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recenter button */}
      <button
        onClick={recenter}
        aria-label="My location"
        className="absolute end-4 top-[210px] z-20 flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-card)]"
      >
        <LocateFixed className="h-4 w-4 text-[color:var(--emerald)]" />
      </button>

      {/* Show-list toggle */}
      {!selected && (
        <button
          onClick={() => setShowList((v) => !v)}
          className="absolute inset-x-0 bottom-[220px] z-20 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-[var(--shadow-card)]"
        >
          <List className="h-3.5 w-3.5" /> {showList ? t("close") : `${list.length} spots`}
        </button>
      )}

      {/* Reservation and handoff prompts live in Notifications — the map stays clean. */}


      {/* Bottom panel: selected spot or list */}
      <div className="absolute inset-x-0 bottom-24 z-20 px-4">
        {selected ? (
          <SpotSheet
            spot={selected}
            distance={haversine(center, { lat: selected.lat, lng: selected.lng })}
            isMine={selected.user_id === user?.id}
            requestDisabled={!!request || selected.status === "reserved"}
            requestBusy={busy === selected.id}
            onRequest={() => ask(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        ) : showList ? (
          <div className="max-h-[42vh] space-y-3 overflow-y-auto scrollbar-none rounded-3xl animate-fade-up">
            {list.map((s) => (
              <SpotCard
                key={s.id}
                spot={s}
                distance={s.distance}
                mins={s.mins}
                disabled={!!request || s.status === "reserved"}
                busy={busy === s.id}
                onSelect={() => { setSelectedId(s.id); setShowList(false); }}
              />
            ))}
            {!loading && list.length === 0 && (
              <div className="rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)]">
                {nearMe ? `No live spots within ${NEAR_ME_KM} km of you right now.` : "No live parking spots match your search."}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* "I'm Leaving" now lives in the center of the bottom bar. */}


      <BottomNav />
    </div>
  );
}

function SpotCard({ spot, distance, mins, disabled, busy, onSelect }: {
  spot: LiveSpot; distance: number; mins: number; disabled: boolean; busy: boolean; onSelect: () => void;
}) {
  const free = mins <= 1;
  const dot = spot.status === "reserved" ? "bg-red-500" : free ? "bg-[var(--emerald)]" : "bg-orange-500";
  const distLabel = distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance}m`;
  return (
    <button onClick={onSelect} className="w-full rounded-3xl bg-card p-4 text-start shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {spot.status === "reserved" ? "Reserved" : free ? "Free now" : `Driver leaves at ${clockOf(spot.planned_leave_at ?? spot.leave_at)}`}
            </span>
          </div>
          <h3 className="mt-1 font-[var(--font-display)] text-base font-bold leading-tight">{spot.address ?? "Shared parking spot"}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {distLabel}</span>
            <span className="flex items-center gap-1"><Navigation2 className="h-3.5 w-3.5" /> {Math.max(1, Math.round(distance / 400))} min drive</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {free ? "now" : `in ${mins}m`}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-emerald/10 px-2.5 py-1 text-center">
          <p className="font-[var(--font-display)] text-lg font-bold leading-none text-[color:var(--emerald)]">{spot.cost}</p>
          <p className="text-[9px] uppercase tracking-wider text-[color:var(--emerald)]/80">points</p>
        </div>
      </div>
      {disabled && <p className="mt-2 text-[10px] text-muted-foreground">{busy ? "Sending…" : "Unavailable"}</p>}
    </button>
  );
}
