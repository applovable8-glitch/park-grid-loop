import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, TrendingUp, Share2, CheckCircle2, Sparkles, Trophy, History as HistoryIcon, ChevronRight } from "lucide-react";
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
  const { items } = usePointsHistory(user?.id, 5);

  return (
    <div className="min-h-screen pb-28">
      <div className="relative overflow-hidden px-5 pb-8 pt-8 text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -end-10 -top-10 h-56 w-56 animate-pulse rounded-full bg-emerald/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{ar ? "رصيدك" : "Your balance"}</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-[var(--font-display)] text-5xl font-bold tabular-nums">{points}</span>
            <span className="mb-1 text-sm text-white/70">{ar ? "نقطة" : "points"}</span>
          </div>
          <p className="mt-1 text-xs text-white/60">
            {ar ? "التقييم" : "Reputation"} {(user?.reputation ?? 5).toFixed(1)} · {user?.shared ?? 0} {ar ? "مشاركة" : "shares"}
          </p>

          <div className="mt-5">
            <Link to="/rewards/invite" className="block rounded-2xl bg-white/10 py-3 text-center text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition active:scale-95">
              <span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" /> {ar ? "دعوة أصدقاء" : "Invite friends"}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        <div className="grid grid-cols-3 gap-2">
          <QuickLink to="/rewards/redeem" icon={Gift} label={ar ? "استبدال" : "Redeem"} />
          <QuickLink to="/rewards/leaderboard" icon={Trophy} label={ar ? "المتصدرون" : "Leaders"} />
          <QuickLink to="/rewards/daily" icon={TrendingUp} label={ar ? "يومي" : "Daily"} />
        </div>

        <h2 className="mt-6 font-[var(--font-display)] text-lg font-bold">{ar ? "اكسب المزيد" : "Earn more points"}</h2>
        <div className="mt-3 space-y-2">
          <EarnRow icon={Share2} title={ar ? "شارك مكانك" : "Share your parking"} sub={ar ? "‎+15 إلى +25 نقطة لكل مشاركة" : "+15 to +25 points per share"} cta={ar ? "شارك الآن" : "Share now"} to="/leaving" />
          <EarnRow icon={CheckCircle2} title={ar ? "تسليم ناجح" : "Successful handoff"} sub={ar ? "مكافأة عند استلام سائق لمكانك" : "+10 bonus when a driver takes your spot"} cta={ar ? "التفاصيل" : "Learn"} to="/rewards/achievements" />
          <EarnRow icon={Gift} title={ar ? "ادعُ صديقاً" : "Invite a friend"} sub={ar ? "‎+100 نقطة لك ولصديقك" : "+100 points for you and your friend"} cta={ar ? "ادعُ" : "Invite"} to="/rewards/invite" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-lg font-bold">{ar ? "آخر النشاطات" : "Recent activity"}</h2>
          <Link to="/rewards/history" className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--emerald)]">
            <HistoryIcon className="h-3.5 w-3.5" /> {ar ? "الكل" : "All"}
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {items.length === 0 && (
            <p className="rounded-2xl bg-card p-4 text-center text-xs text-muted-foreground shadow-[var(--shadow-card)]">
              {ar ? "لا يوجد نشاط بعد — شارك مكانك لتكسب نقاطك الأولى." : "No activity yet — share a spot to earn your first points."}
            </p>
          )}
          {items.map((a) => (
            <div key={a.id} className="flex animate-fade-in items-center justify-between rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><Gift className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold">{reasonLabel(a.reason, ar)}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(a.created_at, ar)}</p>
                </div>
              </div>
              <p className={`font-[var(--font-display)] text-sm font-bold tabular-nums ${a.delta > 0 ? "text-[color:var(--emerald)]" : "text-foreground"}`}>
                {a.delta > 0 ? `+${a.delta}` : a.delta}
              </p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)] transition active:scale-95">
      <Icon className="h-5 w-5 text-[color:var(--emerald)]" />
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}

function EarnRow({ icon: Icon, title, sub, cta, to }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string; cta: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)] transition active:scale-[0.98]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Icon className="h-5 w-5" /></div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">
        {cta} <ChevronRight className="h-3 w-3 rtl:rotate-180" />
      </span>
    </Link>
  );
}
