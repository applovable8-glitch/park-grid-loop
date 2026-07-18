import { createFileRoute } from "@tanstack/react-router";
import { Gift, TrendingUp, Share2, CheckCircle2, Sparkles, CreditCard } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/rewards")({ component: Rewards });

function Rewards() {
  const { user } = useApp();
  const points = user?.points ?? 0;

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden px-5 pb-8 pt-8 text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-emerald/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Your balance</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-[var(--font-display)] text-5xl font-bold tabular-nums">{points}</span>
            <span className="mb-1 text-sm text-white/70">points</span>
          </div>
          <p className="mt-1 text-xs text-white/60">Reputation {user?.reputation ?? 5.0} · Top 8% in Dubai</p>

          <div className="mt-5 flex gap-2">
            <button className="flex-1 rounded-2xl bg-white py-3 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4" /> Buy points</span>
            </button>
            <button className="flex-1 rounded-2xl bg-white/10 py-3 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
              <span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" /> Invite friends</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        <h2 className="font-[var(--font-display)] text-lg font-bold">Earn more points</h2>
        <div className="mt-3 space-y-2">
          {[
            { icon: Share2, title: "Share your parking", sub: "+15 to +25 points per share", cta: "Share now" },
            { icon: CheckCircle2, title: "Successful handoff", sub: "+10 bonus when a driver takes your spot", cta: "Learn" },
            { icon: TrendingUp, title: "Daily activity streak", sub: "+5 every day you're active", cta: "Streak: 4d" },
          ].map((it) => (
            <div key={it.title} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]">
                <it.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.sub}</p>
              </div>
              <button className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">{it.cta}</button>
            </div>
          ))}
        </div>

        <h2 className="mt-6 font-[var(--font-display)] text-lg font-bold">Point packages</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { pts: 100, price: "AED 9", tag: null },
            { pts: 500, price: "AED 39", tag: "Popular" },
            { pts: 1200, price: "AED 79", tag: "Best value" },
            { pts: 3000, price: "AED 179", tag: null },
          ].map((p) => (
            <button key={p.pts} className="relative rounded-3xl bg-card p-4 text-left shadow-[var(--shadow-card)] ring-1 ring-transparent hover:ring-[var(--emerald)]">
              {p.tag && <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">{p.tag}</span>}
              <Sparkles className="h-4 w-4 text-[color:var(--emerald)]" />
              <p className="mt-2 font-[var(--font-display)] text-2xl font-bold">{p.pts}</p>
              <p className="text-xs text-muted-foreground">points</p>
              <p className="mt-2 text-sm font-semibold">{p.price}</p>
            </button>
          ))}
        </div>

        <h2 className="mt-6 font-[var(--font-display)] text-lg font-bold">Recent activity</h2>
        <div className="mt-3 space-y-2">
          {[
            { title: "Handoff bonus · Al Wasl Rd", pts: +25, time: "2h ago" },
            { title: "Reserved · City Walk", pts: -10, time: "yesterday" },
            { title: "Daily streak reward", pts: +5, time: "yesterday" },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><Gift className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
              <p className={`font-[var(--font-display)] text-sm font-bold ${a.pts > 0 ? "text-[color:var(--emerald)]" : "text-foreground"}`}>{a.pts > 0 ? `+${a.pts}` : a.pts}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
