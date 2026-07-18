import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Star, Share2, CheckCircle2, Settings, Bell, CreditCard, HelpCircle, LogOut, ChevronRight, Shield } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, signOut } = useApp();
  const nav = useNavigate();
  if (!user) { nav({ to: "/auth" }); return null; }

  return (
    <div className="min-h-screen pb-28">
      <div className="relative overflow-hidden px-5 pb-10 pt-8 text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-emerald/25 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald text-emerald-foreground font-[var(--font-display)] text-2xl font-bold ring-2 ring-white/20">
            {user.name[0]}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-[var(--font-display)] text-2xl font-bold">{user.name}</h1>
            <p className="truncate text-sm text-white/70">{user.email}</p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{user.reputation}</span>
              <span className="text-white/60">reputation</span>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          <MiniStat label="Points" value={user.points} />
          <MiniStat label="Shared" value={user.shared} />
          <MiniStat label="Reserved" value={user.reservations} />
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-3xl bg-card p-2 shadow-[var(--shadow-card)]">
          <Row icon={Bell} label="Notifications" hint="Push, email, in-app" />
          <Row icon={CreditCard} label="Payment methods" hint="Visa •• 4242" />
          <Row icon={Shield} label="Privacy & safety" hint="Location, data sharing" />
          <Row icon={Settings} label="App preferences" hint="Language, appearance" />
          <Row icon={HelpCircle} label="Help center" hint="Docs, contact us" />
        </div>

        <h2 className="mt-6 px-1 font-[var(--font-display)] text-sm font-bold uppercase tracking-wider text-muted-foreground">Achievements</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { icon: Share2, label: "Top Sharer", color: "text-[color:var(--emerald)]" },
            { icon: CheckCircle2, label: "10 handoffs", color: "text-blue-500" },
            { icon: Star, label: "5.0 streak", color: "text-yellow-500" },
          ].map((b) => (
            <div key={b.label} className="flex flex-col items-center rounded-2xl bg-card p-3 text-center shadow-[var(--shadow-card)]">
              <b.icon className={`h-6 w-6 ${b.color}`} />
              <p className="mt-2 text-[11px] font-semibold">{b.label}</p>
            </div>
          ))}
        </div>

        <button onClick={() => { signOut(); nav({ to: "/auth" }); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-semibold text-[color:var(--danger)] shadow-[var(--shadow-card)]">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur-md">
      <p className="font-[var(--font-display)] text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/60">{label}</p>
    </div>
  );
}

function Row({ icon: Icon, label, hint }: { icon: any; label: string; hint: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-muted">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><Icon className="h-4 w-4" /></div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
