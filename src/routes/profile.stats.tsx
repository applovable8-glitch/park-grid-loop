import { createFileRoute, Link } from "@tanstack/react-router";
import { Share2, MapPin, Star, Coins, TrendingUp } from "lucide-react";
import { Screen, Card } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { usePointsHistory, weeklyBuckets } from "@/lib/profile-data";

export const Route = createFileRoute("/profile/stats")({ component: Stats });

function Stats() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { items } = usePointsHistory(user?.id, 200);
  const week = weeklyBuckets(items);
  const max = Math.max(1, ...week.map((d) => d.count));

  const earned = items.filter((i) => i.delta > 0).reduce((s, i) => s + i.delta, 0);

  return (
    <Screen title={ar ? "الإحصائيات" : "Statistics"} back="/profile">
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Share2} label={ar ? "مشاركات" : "Spots shared"} value={user?.shared ?? 0} />
        <Tile icon={MapPin} label={ar ? "حجوزات" : "Reservations"} value={user?.reservations ?? 0} />
        <Tile icon={Coins} label={ar ? "نقاط مكتسبة" : "Points earned"} value={earned} tone />
        <Tile icon={Star} label={ar ? "التقييم" : "Reputation"} value={Number((user?.reputation ?? 5).toFixed(1))} />
      </div>

      <Card className="mt-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-[color:var(--emerald)]" /> {ar ? "نشاط آخر 7 أيام" : "Last 7 days activity"}</p>
        <div className="mt-4 flex h-28 items-end gap-2">
          {week.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-[var(--emerald)] transition-all duration-500"
                  style={{ height: `${Math.max(6, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {d.date.toLocaleDateString(ar ? "ar" : "en", { weekday: "narrow" })}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/rewards/history" className="rounded-2xl bg-card p-3 text-center text-xs font-semibold shadow-[var(--shadow-card)] transition active:scale-95">{ar ? "سجل النقاط" : "Points history"}</Link>
        <Link to="/profile/history" className="rounded-2xl bg-card p-3 text-center text-xs font-semibold shadow-[var(--shadow-card)] transition active:scale-95">{ar ? "سجل المواقف" : "Parking history"}</Link>
      </div>
    </Screen>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone?: boolean }) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone ? "bg-emerald/15 text-[color:var(--emerald)]" : "bg-muted"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-[var(--font-display)] text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
