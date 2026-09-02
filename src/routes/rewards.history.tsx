import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Gift } from "lucide-react";
import { Screen, EmptyState, SkeletonList } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { usePointsHistory } from "@/lib/profile-data";
import { reasonLabel, formatDateTime } from "@/lib/points-labels";

export const Route = createFileRoute("/rewards/history")({ component: PointsHistory });

function PointsHistory() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { items, loading } = usePointsHistory(user?.id, 100);

  const earned = items.filter((i) => i.delta > 0).reduce((s, i) => s + i.delta, 0);
  const spent = items.filter((i) => i.delta < 0).reduce((s, i) => s + Math.abs(i.delta), 0);

  return (
    <Screen title={ar ? "سجل النقاط" : "Points history"} back="/rewards">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={ar ? "الرصيد" : "Balance"} value={user?.points ?? 0} />
        <Stat label={ar ? "مكتسبة" : "Earned"} value={earned} tone="emerald" />
        <Stat label={ar ? "مصروفة" : "Spent"} value={spent} />
      </div>

      <div className="mt-4 space-y-2">
        {loading && <SkeletonList n={5} />}
        {!loading && items.length === 0 && (
          <EmptyState icon={Gift} title={ar ? "لا توجد حركات بعد" : "No transactions yet"}
            description={ar ? "ستظهر هنا كل نقطة تكسبها أو تصرفها." : "Every point you earn or spend shows up here."} />
        )}
        {items.map((it) => (
          <div key={it.id} className="flex animate-fade-in items-center gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)]">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${it.delta > 0 ? "bg-emerald/15 text-[color:var(--emerald)]" : "bg-muted"}`}>
              {it.delta > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{reasonLabel(it.reason, ar)}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(it.created_at, ar)}</p>
            </div>
            <p className={`font-[var(--font-display)] text-sm font-bold tabular-nums ${it.delta > 0 ? "text-[color:var(--emerald)]" : "text-foreground"}`}>
              {it.delta > 0 ? `+${it.delta}` : it.delta}
            </p>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "emerald" }) {
  return (
    <div className="rounded-2xl bg-card p-3 text-center shadow-[var(--shadow-card)]">
      <p className={`font-[var(--font-display)] text-xl font-bold tabular-nums ${tone === "emerald" ? "text-[color:var(--emerald)]" : ""}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
