import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Zap, X, Clock, Check, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/parkout-store";
import { useGeolocation } from "@/lib/use-geolocation";
import { useAreaName } from "@/lib/use-area-name";
import { PinPicker } from "@/components/PinPicker";
import {
  approveRequest,
  cancelRequest,
  clockOf,
  proposeExtension,
  releaseSpot,
  shareSpot,
  useIncomingRequests,
  useMySharedSpot,
  useSpot,
  minutesUntil,
} from "@/lib/parking-live";

export const Route = createFileRoute("/leaving")({ component: Leaving });

const PRESETS = [
  { m: 0, title: "Leaving now", sub: "Available immediately", reward: "+15 pts" },
  { m: 15, title: "In 15 minutes", sub: "Quick errand", reward: "+18 pts" },
  { m: 30, title: "In 30 minutes", sub: "Coffee or a short stop", reward: "+20 pts" },
  { m: 60, title: "In 1 hour", sub: "Shopping at the mall", reward: "+25 pts" },
];

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Leaving() {
  const nav = useNavigate();
  const { user } = useApp();
  const { position, status } = useGeolocation();
  const [minutes, setMinutes] = useState<number | "custom">(0);
  const [custom, setCustom] = useState(() => toLocalInput(new Date(Date.now() + 60 * 60000)));
  const [spotId, setSpotId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [, tick] = useState(0);

  const pinName = useAreaName(pin);

  const { spot } = useSpot(spotId ?? undefined);
  const { spot: mySpot } = useMySharedSpot(user?.id);
  const { requests } = useIncomingRequests(user?.id);
  const mine = requests.filter((r) => !spotId || r.spot_id === spotId);

  useEffect(() => {
    if (!spotId && mySpot) setSpotId(mySpot.id);
  }, [mySpot, spotId]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const leaveAt = useMemo(
    () => (minutes === "custom" ? new Date(custom) : new Date(Date.now() + minutes * 60000)),
    [minutes, custom],
  );

  const confirm = async () => {
    const loc = pin ?? (position ? { lat: position.lat, lng: position.lng } : null);
    if (!loc) { toast.error("Pin your parking spot on the map first"); return; }
    if (Number.isNaN(leaveAt.getTime())) { toast.error("Pick a valid exit time"); return; }
    setBusy(true);
    const { id, error } = await shareSpot({
      lat: loc.lat,
      lng: loc.lng,
      leaveAt,
      address: pinName ?? "Pinned parking spot",
      cost: 10,
    });
    setBusy(false);
    if (error || !id) { toast.error(error ?? "Could not share the spot"); return; }
    toast.success(`Your car is live on the map · exit at ${clockOf(leaveAt.toISOString())}`);
    nav({ to: "/home" });
  };

  const cancelShare = async () => {
    if (spotId) await releaseSpot(spotId);
    nav({ to: "/home" });
  };

  const exitIso = spot?.planned_leave_at ?? spot?.leave_at ?? null;
  const mins = Math.max(0, minutesUntil(exitIso));

  return (
    <div className="relative flex min-h-screen w-full flex-col text-white" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-emerald/25 blur-3xl" />
      <div className="absolute -left-16 bottom-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-4 pt-5">
        <button onClick={() => nav({ to: "/home" })} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">Share your spot</p>
        <div className="h-10 w-10" />
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8">
        {!spotId ? (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
                <Zap className="h-7 w-7 fill-[var(--emerald)] text-[var(--emerald)]" />
              </div>
              <h1 className="font-[var(--font-display)] text-3xl font-bold">Share your spot</h1>
              <p className="mt-1 max-w-xs text-sm text-white/70">Pin where your car is parked, then pick when you&apos;ll leave — your car appears on the map with that countdown.</p>
            </div>

            <div className="w-full max-w-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">1 · Pin your parking spot</p>
              <PinPicker
                initial={position ? { lat: position.lat, lng: position.lng } : null}
                onChange={setPin}
              />
              <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur-md">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--emerald)]" />
                {pin
                  ? (pinName ?? "Pin set — drag the map to adjust")
                  : status === "granted"
                    ? "Drag the map so the pin sits on your parked car."
                    : "Enable location or drag the map to pin your car."}
              </div>
            </div>

            <p className="mt-5 mb-2 w-full max-w-sm text-xs font-semibold uppercase tracking-wider text-white/70">2 · When will you leave?</p>
            <div className="w-full max-w-sm space-y-3">
              {PRESETS.map((o) => {
                const active = minutes === o.m;
                return (
                  <button
                    key={o.m}
                    onClick={() => setMinutes(o.m)}
                    className={`flex w-full items-center gap-3 rounded-3xl p-4 text-left transition-all ${
                      active ? "bg-white text-foreground shadow-[var(--shadow-elevated)]" : "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${active ? "border-[var(--emerald)] bg-[var(--emerald)]" : "border-white/50"}`}>
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <div className="flex-1">
                      <p className="font-[var(--font-display)] text-base font-bold">{o.title}</p>
                      <p className={`text-xs ${active ? "text-muted-foreground" : "text-white/70"}`}>
                        {o.sub} · {clockOf(new Date(Date.now() + o.m * 60000).toISOString())}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-emerald/15 text-[color:var(--emerald)]" : "bg-white/15 text-white"}`}>{o.reward}</span>
                  </button>
                );
              })}

              <button
                onClick={() => setMinutes("custom")}
                className={`flex w-full items-center gap-3 rounded-3xl p-4 text-left transition-all ${
                  minutes === "custom" ? "bg-white text-foreground shadow-[var(--shadow-elevated)]" : "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${minutes === "custom" ? "border-[var(--emerald)] bg-[var(--emerald)]" : "border-white/50"}`}>
                  {minutes === "custom" && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <div className="flex-1">
                  <p className="font-[var(--font-display)] text-base font-bold">Pick an exact time</p>
                  <p className={`text-xs ${minutes === "custom" ? "text-muted-foreground" : "text-white/70"}`}>e.g. I&apos;ll leave the mall at 8:30</p>
                </div>
                <Clock className="h-4 w-4" />
              </button>

              {minutes === "custom" && (
                <input
                  type="datetime-local"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none"
                />
              )}
            </div>

            <button
              onClick={confirm}
              disabled={busy}
              className="mt-6 w-full max-w-sm rounded-2xl py-4 font-[var(--font-display)] text-sm font-bold text-white shadow-[var(--shadow-glow)] disabled:opacity-60"
              style={{ background: "var(--gradient-emerald)" }}
            >
              {busy ? "Sharing…" : `Confirm · exit at ${Number.isNaN(leaveAt.getTime()) ? "--:--" : clockOf(leaveAt.toISOString())}`}
            </button>
          </>
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center text-center animate-fade-up">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/15 backdrop-blur-xl">
              <div className="absolute inset-2 rounded-full ring-4 ring-[var(--emerald)]/40 pulse-emerald" />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/60">Leaving at</p>
                <p className="font-[var(--font-display)] text-3xl font-bold tabular-nums">{clockOf(exitIso)}</p>
                <p className="mt-1 text-[11px] text-white/60">in {mins} min</p>
              </div>
            </div>
            <h2 className="mt-6 font-[var(--font-display)] text-xl font-bold">Your spot is live</h2>
            <p className="mt-1 text-sm text-white/70">Drivers can now request it for your exit time.</p>

            {mine.length === 0 ? (
              <div className="mt-6 w-full rounded-2xl bg-white/10 p-4 text-sm text-white/70 ring-1 ring-white/10 backdrop-blur-md">
                No requests yet — we&apos;ll notify you the moment a driver asks.
              </div>
            ) : (
              <div className="mt-6 w-full space-y-3">
                {mine.map((r) => (
                  <RequestCard key={r.id} id={r.id} state={r.request_status} exitIso={exitIso} />
                ))}
              </div>
            )}

            <button onClick={cancelShare} className="mt-6 flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
              <X className="h-4 w-4" />
              Stop sharing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ id, state, exitIso }: { id: string; state: string; exitIso: string | null }) {
  const [busy, setBusy] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  const approve = async () => {
    setBusy(true);
    const { error } = await approveRequest(id);
    setBusy(false);
    if (error) toast.error(error); else toast.success("Spot reserved for the driver");
  };
  const extend = async (extraMin: number) => {
    const base = exitIso ? new Date(exitIso).getTime() : Date.now();
    setBusy(true);
    const { error } = await proposeExtension(id, new Date(base + extraMin * 60000));
    setBusy(false);
    setShowExtend(false);
    if (error) toast.error(error); else toast.success("Asked the driver if they can wait");
  };

  if (state === "confirmed") {
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/15 backdrop-blur-md">
        <p className="text-sm font-bold text-[var(--emerald)]">Reserved for a driver</p>
        <p className="mt-1 text-xs text-white/70">They are on the way for your {clockOf(exitIso)} exit.</p>
        <button onClick={() => cancelRequest(id)} className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/15">Cancel handoff</button>
      </div>
    );
  }

  if (state === "extension_proposed") {
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/15 backdrop-blur-md">
        <p className="text-sm font-bold">Waiting for the driver</p>
        <p className="mt-1 text-xs text-white/70">You asked for more time — they&apos;re deciding whether to wait.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 text-left text-foreground shadow-[var(--shadow-elevated)]">
      <p className="font-[var(--font-display)] text-base font-bold">A driver wants your spot</p>
      <p className="mt-1 text-xs text-muted-foreground">They plan to take it at your {clockOf(exitIso)} exit time.</p>
      {!showExtend ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button disabled={busy} onClick={approve} className="flex items-center justify-center gap-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ background: "var(--gradient-emerald)" }}>
            <Check className="h-4 w-4" /> Approve
          </button>
          <button disabled={busy} onClick={() => setShowExtend(true)} className="flex items-center justify-center gap-1 rounded-xl bg-muted py-3 text-sm font-bold disabled:opacity-60">
            <TimerReset className="h-4 w-4" /> Need more time
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">Extend my stay by:</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[10, 20, 30].map((m) => (
              <button key={m} disabled={busy} onClick={() => extend(m)} className="rounded-xl bg-muted py-2.5 text-sm font-bold disabled:opacity-60">+{m}m</button>
            ))}
          </div>
          <button onClick={() => setShowExtend(false)} className="mt-2 w-full rounded-xl py-2 text-xs font-semibold text-muted-foreground">Back</button>
        </div>
      )}
    </div>
  );
}
