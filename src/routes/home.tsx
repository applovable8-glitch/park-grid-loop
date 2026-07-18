import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Layers, LocateFixed, Zap, Clock, MapPin } from "lucide-react";
import { useApp, type ParkingSpot } from "@/lib/parkout-store";
import { MapCanvas } from "@/components/MapCanvas";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/home")({ component: Home });

function Home() {
  const { spots, user } = useApp();
  const nav = useNavigate();
  const [selected, setSelected] = useState<ParkingSpot | null>(null);

  const available = spots.filter((s) => s.status === "available").length;
  const leaving = spots.filter((s) => s.status === "leaving").length;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0">
        <MapCanvas spots={spots} onSpotClick={setSelected} />
      </div>

      {/* Top bar */}
      <div className="relative z-20 px-4 pt-4">
        <div className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-[var(--shadow-card)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-4 w-4" fill="var(--emerald)" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Current area</p>
            <p className="truncate text-sm font-semibold">Downtown Dubai · UAE</p>
          </div>
          <Link to="/profile" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald text-emerald-foreground font-bold text-sm">
            {user?.name?.[0] ?? "U"}
          </Link>
        </div>

        {/* Search pill */}
        <Link to="/search" className="mt-3 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">Where do you want to park?</span>
          <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--emerald)]">{available} live</span>
        </Link>
      </div>

      {/* Floating map controls */}
      <div className="absolute right-4 top-[190px] z-20 flex flex-col gap-2">
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-card)]">
          <Layers className="h-4 w-4" />
        </button>
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-card)]">
          <LocateFixed className="h-4 w-4 text-[color:var(--emerald)]" />
        </button>
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-24 z-20 px-4">
        {selected ? (
          <SpotSheet spot={selected} onClose={() => setSelected(null)} onReserve={() => nav({ to: "/search" })} />
        ) : (
          <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-elevated)] animate-fade-up">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Around you</p>
                <p className="font-[var(--font-display)] text-lg font-bold">Live parking</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 rounded-full bg-emerald/15 px-2.5 py-1 text-[11px] font-semibold text-[color:var(--emerald)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" /> {available} open
                </span>
                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> {leaving} soon
                </span>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
              {spots.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="flex min-w-[180px] shrink-0 flex-col items-start rounded-2xl border border-border bg-background p-3 text-left transition hover:border-[var(--emerald)]"
                >
                  <span className={`mb-2 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    s.status === "available" ? "bg-emerald/15 text-[color:var(--emerald)]" : s.status === "leaving" ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.status === "available" ? "bg-[var(--emerald)]" : s.status === "leaving" ? "bg-orange-500" : "bg-red-500"}`} />
                    {s.status === "available" ? "Available" : s.status === "leaving" ? `In ${Math.ceil(s.leavingIn / 60)}m` : "Reserved"}
                  </span>
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{s.address}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.distance}m</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.eta}min</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* I'm Leaving FAB */}
      <Link
        to="/leaving"
        className="absolute bottom-[220px] right-5 z-30 flex items-center gap-2 rounded-full px-5 py-3.5 font-[var(--font-display)] text-sm font-bold text-white shadow-[var(--shadow-elevated)] pulse-emerald"
        style={{ background: "var(--gradient-emerald)" }}
      >
        <Zap className="h-4 w-4 fill-white" />
        I'm Leaving
      </Link>

      <BottomNav />
    </div>
  );
}

function SpotSheet({ spot, onClose, onReserve }: { spot: ParkingSpot; onClose: () => void; onReserve: () => void }) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-elevated)] animate-fade-up">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            spot.status === "available" ? "bg-emerald/15 text-[color:var(--emerald)]" : spot.status === "leaving" ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${spot.status === "available" ? "bg-[var(--emerald)]" : spot.status === "leaving" ? "bg-orange-500" : "bg-red-500"}`} />
            {spot.status === "available" ? "Available now" : spot.status === "leaving" ? `Leaving in ${Math.ceil(spot.leavingIn / 60)}m` : "Reserved"}
          </span>
          <h3 className="mt-2 font-[var(--font-display)] text-lg font-bold leading-tight">{spot.address}</h3>
        </div>
        <button onClick={onClose} className="text-xs font-medium text-muted-foreground">Close</button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-3">
        <Stat label="Distance" value={`${spot.distance}m`} />
        <Stat label="ETA" value={`${spot.eta}m`} />
        <Stat label="Cost" value={`${spot.cost} pts`} />
      </div>

      <button
        onClick={onReserve}
        className="mt-3 w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
        style={{ background: "var(--gradient-emerald)" }}
      >
        Reserve · 90s lock
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-[var(--font-display)] font-bold">{value}</p>
    </div>
  );
}
