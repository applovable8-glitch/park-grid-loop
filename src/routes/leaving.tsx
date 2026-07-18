import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Zap, X } from "lucide-react";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/leaving")({ component: Leaving });

type Choice = 0 | 2 | 5;

function Leaving() {
  const nav = useNavigate();
  const { addLeaving, cancelLeaving } = useApp();
  const [choice, setChoice] = useState<Choice>(0);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!confirmedId) return;
    setSeconds(choice * 60);
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [confirmedId, choice]);

  const confirm = () => setConfirmedId(addLeaving(choice));
  const cancel = () => { if (confirmedId) cancelLeaving(confirmedId); nav({ to: "/home" }); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="relative flex min-h-screen w-full flex-col text-white" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-emerald/25 blur-3xl" />
      <div className="absolute -left-16 bottom-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-4 pt-5">
        <button onClick={() => nav({ to: "/home" })} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">Share your spot</p>
        <div className="h-10 w-10" />
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10">
        {!confirmedId ? (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
                <Zap className="h-7 w-7 fill-[var(--emerald)] text-[var(--emerald)]" />
              </div>
              <h1 className="font-[var(--font-display)] text-3xl font-bold">I'm leaving</h1>
              <p className="mt-1 max-w-xs text-sm text-white/70">Let nearby drivers know when your spot is opening up.</p>
            </div>

            <div className="w-full max-w-sm space-y-3">
              {[
                { v: 0 as Choice, title: "Leave Now", sub: "Available immediately", reward: "+15 pts" },
                { v: 2 as Choice, title: "Leave in 2 minutes", sub: "Best match for nearby driver", reward: "+20 pts" },
                { v: 5 as Choice, title: "Leave in 5 minutes", sub: "Give someone extra time", reward: "+25 pts" },
              ].map((o) => {
                const active = choice === o.v;
                return (
                  <button
                    key={o.v}
                    onClick={() => setChoice(o.v)}
                    className={`flex w-full items-center gap-3 rounded-3xl p-4 text-left transition-all ${
                      active ? "bg-white text-foreground shadow-[var(--shadow-elevated)]" : "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${active ? "border-[var(--emerald)] bg-[var(--emerald)]" : "border-white/50"}`}>
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <div className="flex-1">
                      <p className="font-[var(--font-display)] text-base font-bold">{o.title}</p>
                      <p className={`text-xs ${active ? "text-muted-foreground" : "text-white/70"}`}>{o.sub}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-emerald/15 text-[color:var(--emerald)]" : "bg-white/15 text-white"}`}>{o.reward}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex w-full max-w-sm items-center gap-2 rounded-2xl bg-white/10 p-3 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur-md">
              <MapPin className="h-4 w-4 text-[var(--emerald)]" />
              GPS location shared only as an open parking opportunity.
            </div>

            <button
              onClick={confirm}
              className="mt-6 w-full max-w-sm rounded-2xl py-4 font-[var(--font-display)] text-sm font-bold text-white shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-emerald)" }}
            >
              Confirm & share spot
            </button>
          </>
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center text-center animate-fade-up">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/15 backdrop-blur-xl">
              <div className="absolute inset-2 rounded-full ring-4 ring-[var(--emerald)]/40 pulse-emerald" />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/60">Leaving in</p>
                <p className="font-[var(--font-display)] text-4xl font-bold tabular-nums">{mm}:{ss}</p>
              </div>
            </div>
            <h2 className="mt-6 font-[var(--font-display)] text-xl font-bold">Your spot is live</h2>
            <p className="mt-1 text-sm text-white/70">Nearby drivers can now see your parking opportunity.</p>

            <div className="mt-6 grid w-full grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/10 p-3 text-left ring-1 ring-white/10 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-widest text-white/60">Watching</p>
                <p className="mt-1 font-[var(--font-display)] text-xl font-bold">3 drivers</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-left ring-1 ring-white/10 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-widest text-white/60">Reward</p>
                <p className="mt-1 font-[var(--font-display)] text-xl font-bold text-[var(--emerald)]">+{15 + choice * 2}</p>
              </div>
            </div>

            <button onClick={cancel} className="mt-6 flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
              <X className="h-4 w-4" />
              Cancel share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
