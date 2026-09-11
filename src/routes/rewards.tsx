import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, TrendingUp, Share2, CheckCircle2, Trophy, ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { usePointsHistory } from "@/lib/profile-data";
import { reasonLabel, timeAgo } from "@/lib/points-labels";

export const Route = createFileRoute("/rewards")({ component: Rewards });

function Rewards() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const points = user?.points ?? 0;
  const { items, loading } = usePointsHistory(user?.id, 20);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero */}
      <header className="relative overflow-hidden px-5 pb-7 pt-8 text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -end-12 -top-12 h-52 w-52 rounded-full bg-emerald/25 blur-3xl" />
        <div className="relative animate-fade-up">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            {ar ? "نقاط AndiPark" : "Your AndiPoints"}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-[var(--font-display)] text-[52px] leading-none font-bold tabular-nums transition-all duration-[var(--dur-slow,360ms)]">{points}</span>
            <span className="mb-1.5 text-sm text-white/70">{ar ? "نقطة" : "points"}</span>
          </div>
          <p className="mt-2 text-sm text-white/70">
            {ar ? "ساعد السائقين، واستمر في الكسب." : "Keep helping drivers. Keep earning."}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <HeroStat value={user?.shared ?? 0} label={ar ? "مواقف تمت مشاركتها" : "Spots shared"} />
            <HeroStat value={user?.reservations ?? 0} label={ar ? "عمليات ركن ناجحة" : "Connections"} />
            <HeroStat value={points} label={ar ? "النقاط" : "Points earned"} />
          </div>

          <Link to="/rewards/invite" className="press mt-4 block rounded-2xl bg-white/10 py-3 text-center text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
            <span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" /> {ar ? "دعوة أصدقاء" : "Invite friends"}</span>
          </Link>
        </div>
      </header>

      <div className="px-5 pt-6">
        <div className="grid grid-cols-3 gap-2">
          <QuickLink to="/rewards/redeem" icon={Gift} label={ar ? "استبدال" : "Redeem"} />
          <QuickLink to="/rewards/leaderboard" icon={Trophy} label={ar ? "المتصدرون" : "Leaders"} />
          <QuickLink to="/rewards/daily" icon={TrendingUp} label={ar ? "يومي" : "Daily"} />
        </div>

        {/* Earn more */}
        <h2 className="mt-7 font-[var(--font-display)] text-base font-bold">{ar ? "اكسب المزيد" : "Earn more"}</h2>
        <div className="mt-2 divide-y divide-border/60 rounded-2xl bg-card px-1 shadow-[var(--shadow-card)]">
          <EarnRow icon={Share2} title={ar ? "شارك مكانك" : "Share your parking"} sub={ar ? "‎+15 إلى +25 نقطة" : "+15 to +25 points"} to="/leaving" />
          <EarnRow icon={CheckCircle2} title={ar ? "تسليم ناجح" : "Successful handoff"} sub={ar ? "‎+10 نقاط إضافية" : "+10 bonus points"} to="/rewards/achievements" />
          <EarnRow icon={Gift} title={ar ? "ادعُ صديقاً" : "Invite a friend"} sub={ar ? "‎+100 لك ولصديقك" : "+100 for both of you"} to="/rewards/invite" />
        </div>

        {/* Activity */}
        <div className="mt-7 flex items-baseline justify-between">
          <h2 className="font-[var(--font-display)] text-base font-bold">{ar ? "النشاط" : "Activity"}</h2>
          <Link to="/rewards/history" className="text-xs font-semibold text-[color:var(--emerald)]">{ar ? "الكل" : "See all"}</Link>
        </div>

        {loading ? (
          <div className="mt-3 space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-[color:var(--emerald)]" />
            <p className="mt-3 font-[var(--font-display)] text-sm font-bold">{ar ? "ابدأ بكسب نقاط AndiPark" : "Start earning AndiPoints"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ar ? "شارك أول موقف لك وساعد أحدهم على الركن." : "Share your first spot and help someone park."}
            </p>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-border/60">
            {items.map((a, i) => {
              const up = a.delta > 0;
              return (
                <li key={a.id} className="flex animate-fade-up items-center gap-3 py-3.5" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${up ? "bg-emerald/12 text-[color:var(--emerald)]" : "bg-muted text-muted-foreground"}`}>
                    {up ? <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" /> : <ArrowDownRight className="h-4 w-4 rtl:-scale-x-100" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{reasonLabel(a.reason, ar)}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(a.created_at, ar)}</p>
                  </div>
                  <p className={`font-[var(--font-display)] text-sm font-bold tabular-nums ${up ? "text-[color:var(--emerald)]" : "text-muted-foreground"}`}>
                    {up ? `+${a.delta}` : a.delta}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-2.5 text-center ring-1 ring-white/15 backdrop-blur-md">
      <p className="font-[var(--font-display)] text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-white/60">{label}</p>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="press flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
      <Icon className="h-5 w-5 text-[color:var(--emerald)]" />
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}

function EarnRow({ icon: Icon, title, sub, to }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string; to: string }) {
  return (
    <Link to={to} className="press flex items-center gap-3 px-3 py-3.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald/12 text-[color:var(--emerald)]"><Icon className="h-4.5 w-4.5" /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
    </Link>
  );
}
