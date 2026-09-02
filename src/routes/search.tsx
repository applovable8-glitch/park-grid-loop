import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, MapPin, Clock, Navigation2, Zap, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/lib/parkout-store";
import { useGeolocation } from "@/lib/use-geolocation";
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

const FILTERS = ["All", "Free now", "Within 30 min", "Within 1 hour"] as const;

function SearchPage() {
  const { user } = useApp();
  const nav = useNavigate();
  const { position } = useGeolocation();
  const { spots, loading } = useLiveSpots();
  const { request } = useMyRequest(user?.id);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [busy, setBusy] = useState<string | null>(null);

  const list = useMemo(() => {
    return spots
      .filter((s) => s.user_id !== user?.id)
      .filter((s) => (s.address ?? "").toLowerCase().includes(q.toLowerCase()))
      .map((s) => ({
        ...s,
        distance: position ? haversine(position, { lat: s.lat, lng: s.lng }) : null,
        mins: minutesUntil(s.planned_leave_at ?? s.leave_at),
      }))
      .filter((s) => {
        if (filter === "Free now") return s.mins <= 1;
        if (filter === "Within 30 min") return s.mins <= 30;
        if (filter === "Within 1 hour") return s.mins <= 60;
        return true;
      })
      .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  }, [spots, q, filter, position, user?.id]);

  const ask = async (spotId: string) => {
    setBusy(spotId);
    const { id, error } = await requestSpot(spotId);
    setBusy(null);
    if (error || !id) { toast.error(error ?? "Could not send request"); return; }
    toast.success("Request sent to the driver");
    nav({ to: "/reservation/$id", params: { id } });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 bg-background/90 px-4 pt-5 pb-3 backdrop-blur-xl">
        <h1 className="font-[var(--font-display)] text-2xl font-bold">Find parking</h1>
        <p className="text-xs text-muted-foreground">Live spots with their expected exit time</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-[var(--shadow-card)]">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Street, area, landmark…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Link to="/search/filters" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
            <SlidersHorizontal className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{f}</button>
          ))}
        </div>
      </header>

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
          <div className="mt-16 text-center text-sm text-muted-foreground">No live parking spots right now.</div>
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
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {distance === null ? "—" : `${distance}m away`}</span>
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
