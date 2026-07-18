import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon, MapPin, Clock, Navigation2, Zap, SlidersHorizontal } from "lucide-react";
import { useApp, type ParkingSpot } from "@/lib/parkout-store";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/search")({ component: SearchPage });

function SearchPage() {
  const { spots, reserve } = useApp();
  const [q, setQ] = useState("");
  const [reservedId, setReservedId] = useState<string | null>(null);
  const filtered = spots.filter((s) => s.address.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 bg-background/90 px-4 pt-5 pb-3 backdrop-blur-xl">
        <h1 className="font-[var(--font-display)] text-2xl font-bold">Find parking</h1>
        <p className="text-xs text-muted-foreground">Live opportunities within 800m</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-[var(--shadow-card)]">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Street, area, landmark…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {["All", "Available", "Leaving soon", "< 5 pts", "Covered", "24/7"].map((f, i) => (
            <button key={f} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{f}</button>
          ))}
        </div>
      </header>

      <div className="space-y-3 px-4 pt-3">
        {filtered.map((s) => (
          <SpotCard key={s.id} spot={s} reserved={reservedId === s.id} onReserve={() => { reserve(s.id); setReservedId(s.id); }} />
        ))}
        {filtered.length === 0 && (
          <div className="mt-16 text-center text-sm text-muted-foreground">No parking matches "{q}"</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function SpotCard({ spot, reserved, onReserve }: { spot: ParkingSpot; reserved: boolean; onReserve: () => void }) {
  const dot = spot.status === "available" ? "bg-[var(--emerald)]" : spot.status === "leaving" ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {spot.status === "available" ? "Available now" : spot.status === "leaving" ? `Leaving in ${Math.ceil(spot.leavingIn/60)}m ${spot.leavingIn%60}s` : "Reserved"}
            </span>
          </div>
          <h3 className="mt-1 font-[var(--font-display)] text-base font-bold leading-tight">{spot.address}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {spot.distance}m away</span>
            <span className="flex items-center gap-1"><Navigation2 className="h-3.5 w-3.5" /> {spot.eta} min drive</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 90s lock</span>
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
        disabled={reserved || spot.status === "reserved"}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all ${
          reserved || spot.status === "reserved" ? "bg-muted text-muted-foreground" : "text-white shadow-[var(--shadow-glow)] active:scale-[0.98]"
        }`}
        style={reserved || spot.status === "reserved" ? undefined : { background: "var(--gradient-emerald)" }}
      >
        <Zap className="h-4 w-4" />
        {reserved ? "Reserved · navigate now" : spot.status === "reserved" ? "Unavailable" : "Reserve"}
      </button>
    </div>
  );
}
