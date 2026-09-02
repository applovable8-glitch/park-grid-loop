import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Crown } from "lucide-react";
import { Screen, SkeletonList, EmptyState } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { useLeaderboard } from "@/lib/profile-data";

export const Route = createFileRoute("/rewards/leaderboard")({ component: Leaderboard });

const MEDAL = ["text-yellow-500", "text-slate-400", "text-amber-700"];

function Leaderboard() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { rows, loading } = useLeaderboard(30);
  const myRank = rows.findIndex((r) => r.user_id === user?.id);

  return (
    <Screen title={ar ? "لوحة المتصدرين" : "Leaderboard"} back="/rewards">
      <div className="rounded-3xl p-5 text-white" style={{ background: "var(--gradient-hero)" }}>
        <Trophy className="h-6 w-6 text-yellow-400" />
        <p className="mt-2 font-[var(--font-display)] text-lg font-bold">
          {myRank >= 0 ? (ar ? `ترتيبك #${myRank + 1}` : `You're #${myRank + 1}`) : ar ? "ابدأ المشاركة للدخول" : "Share a spot to rank up"}
        </p>
        <p className="text-xs text-white/70">{user?.points ?? 0} {ar ? "نقطة" : "points"}</p>
      </div>

      <div className="mt-4 space-y-2">
        {loading && <SkeletonList n={6} />}
        {!loading && rows.length === 0 && <EmptyState icon={Trophy} title={ar ? "لا يوجد متصدرون بعد" : "No leaders yet"} />}
        {rows.map((r, i) => {
          const me = r.user_id === user?.id;
          return (
            <div key={r.user_id}
              className={`flex animate-fade-in items-center gap-3 rounded-2xl p-3 shadow-[var(--shadow-card)] ${me ? "bg-emerald/10 ring-1 ring-[var(--emerald)]" : "bg-card"}`}>
              <span className="w-6 text-center font-[var(--font-display)] text-sm font-bold tabular-nums">
                {i < 3 ? <Crown className={`mx-auto h-4 w-4 ${MEDAL[i]}`} /> : i + 1}
              </span>
              {r.avatar_url
                ? <img src={r.avatar_url} alt={r.name} className="h-10 w-10 rounded-2xl object-cover" />
                : <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-sm font-bold">{(r.name || "?").charAt(0).toUpperCase()}</div>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name || (ar ? "سائق" : "Driver")}{me && ` · ${ar ? "أنت" : "you"}`}</p>
                <p className="text-xs text-muted-foreground">{r.shared_count} {ar ? "مشاركة" : "shares"}</p>
              </div>
              <p className="font-[var(--font-display)] text-sm font-bold tabular-nums text-[color:var(--emerald)]">{r.points}</p>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
