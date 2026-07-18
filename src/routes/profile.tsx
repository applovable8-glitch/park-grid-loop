import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Star, Share2, CheckCircle2, Settings, Bell, CreditCard, HelpCircle, LogOut, ChevronRight, Shield, Pencil, Car, Clock, Award, Users } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, session, loading, signOut } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  if (loading || !user) return null;

  const onSignOut = async () => { await signOut(); nav({ to: "/auth" }); };

  return (
    <div className="min-h-screen pb-28">
      <div className="relative overflow-hidden px-5 pb-10 pt-8 text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-emerald/25 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="h-16 w-16 rounded-3xl object-cover ring-2 ring-white/20" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald text-emerald-foreground font-[var(--font-display)] text-2xl font-bold ring-2 ring-white/20">
                {user.avatar}
              </div>
            )}
            <Link to="/profile/edit" aria-label="Edit profile"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-md">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-[var(--font-display)] text-2xl font-bold">{user.name || "Driver"}</h1>
            <p className="truncate text-sm text-white/70">{user.email}</p>
            <Link to="/profile/reputation" className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{user.reputation.toFixed(1)}</span>
              <span className="text-white/60">reputation</span>
            </Link>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          <Link to="/rewards"><MiniStat label="Points" value={user.points} /></Link>
          <Link to="/leaving/history"><MiniStat label="Shared" value={user.shared} /></Link>
          <Link to="/profile/reservations"><MiniStat label="Reserved" value={user.reservations} /></Link>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-3xl bg-card p-2 shadow-[var(--shadow-card)]">
          <Link to="/profile/edit"><Row icon={Pencil} label="Edit profile" hint="Name, phone, vehicle plate" /></Link>
          <Link to="/profile/vehicles"><Row icon={Car} label="My vehicles" hint={user.plate ?? "Add your plate"} /></Link>
          <Link to="/profile/history"><Row icon={Clock} label="Parking history" hint="All your shares & reservations" /></Link>
          <Link to="/profile/stats"><Row icon={Award} label="Statistics" hint="Your activity at a glance" /></Link>
        </div>

        <h2 className="mt-6 px-1 font-[var(--font-display)] text-sm font-bold uppercase tracking-wider text-muted-foreground">More</h2>
        <div className="mt-2 rounded-3xl bg-card p-2 shadow-[var(--shadow-card)]">
          <Link to="/settings"><Row icon={Settings} label="Settings" hint={`${user.language.toUpperCase()} · ${user.theme}`} /></Link>
          <Link to="/settings/notifications"><Row icon={Bell} label="Notifications" hint={notifSummary(user.notification_prefs)} /></Link>
          <Link to="/settings/privacy"><Row icon={Shield} label="Privacy & safety" hint={user.location_prefs.share_location ? "Location sharing on" : "Location sharing off"} /></Link>
          <Link to="/payments"><Row icon={CreditCard} label="Payment methods" hint="Cards, invoices, subscriptions" /></Link>
          <Link to="/community"><Row icon={Users} label="Community" hint="Invite, leaderboard, referrals" /></Link>
          <Link to="/help"><Row icon={HelpCircle} label="Help center" hint="FAQ, contact, chat" /></Link>
        </div>

        <h2 className="mt-6 px-1 font-[var(--font-display)] text-sm font-bold uppercase tracking-wider text-muted-foreground">Achievements</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { icon: Share2, label: "Top Sharer", color: "text-[color:var(--emerald)]" },
            { icon: CheckCircle2, label: "10 handoffs", color: "text-blue-500" },
            { icon: Star, label: "5.0 streak", color: "text-yellow-500" },
          ].map((b) => (
            <Link key={b.label} to="/profile/achievements" className="flex flex-col items-center rounded-2xl bg-card p-3 text-center shadow-[var(--shadow-card)]">
              <b.icon className={`h-6 w-6 ${b.color}`} />
              <p className="mt-2 text-[11px] font-semibold">{b.label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link to="/profile/badges" className="rounded-2xl bg-card p-3 text-center text-xs font-semibold shadow-[var(--shadow-card)]">All badges</Link>
          <Link to="/rewards/leaderboard" className="rounded-2xl bg-card p-3 text-center text-xs font-semibold shadow-[var(--shadow-card)]">Leaderboard</Link>
        </div>

        <button onClick={onSignOut} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-semibold text-[color:var(--danger)] shadow-[var(--shadow-card)]">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function notifSummary(p: { push: boolean; nearby_spots: boolean; reservations: boolean; points: boolean }) {
  const on = [p.push && "Push", p.nearby_spots && "Nearby", p.reservations && "Reservations", p.points && "Points"].filter(Boolean);
  return on.length ? on.join(", ") : "All off";
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur-md">
      <p className="font-[var(--font-display)] text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/60">{label}</p>
    </div>
  );
}

function Row({ icon: Icon, label, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-muted">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><Icon className="h-4 w-4" /></div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
