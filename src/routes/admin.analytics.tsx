import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AdminHeader, KpiCard, NotConfigured } from "@/components/admin/AdminTable";
import { AdminPanel } from "@/components/admin/AdminShell";
import { useAnalyticsRows, bucketByDay, activeSince, usePointPurchases } from "@/lib/admin-finance";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminAnalytics,
});

function BarChart({ data, label }: { data: { day: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <p className="py-12 text-center text-sm text-slate-500">Not enough data yet.</p>;
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((d) => (
          <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-slate-400 opacity-0 group-hover:opacity-100">{d.value}</span>
            <div className="w-full rounded-t bg-emerald-500/80 transition-all" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 2 }} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">{label} · last {data.length} days</p>
    </div>
  );
}

function AdminAnalytics() {
  const { users, spots, reservations, loading } = useAnalyticsRows();
  const purchases = usePointPurchases();

  const stats = useMemo(() => {
    const completed = reservations.filter((r) => r.status === "completed").length;
    const cancelled = reservations.filter((r) => r.status === "cancelled" || r.request_status === "cancelled").length;
    const expired = reservations.filter((r) => r.status === "expired").length;
    const activeSpots = spots.filter((s) => ["available", "leaving", "reserved"].includes(s.status)).length;
    return { completed, cancelled, expired, activeSpots };
  }, [reservations, spots]);

  const revenue = purchases.rows.reduce((a, p) => a + (p.amount_total ?? 0), 0);

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Network performance from live data" />

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard index={0} label="Total users" value={loading ? null : users.length} />
        <KpiCard index={1} label="New users (7d)" value={loading ? null : activeSince(users, 7)} />
        <KpiCard index={2} label="Active spots" value={loading ? null : stats.activeSpots} />
        <KpiCard index={3} label="Reservations" value={loading ? null : reservations.length} />
        <KpiCard index={4} label="Successful handoffs" value={loading ? null : stats.completed} />
        <KpiCard index={5} label="Cancellations" value={loading ? null : stats.cancelled} />
        <KpiCard index={6} label="Expired requests" value={loading ? null : stats.expired} hint="Closest available proxy for no-shows" />
        <KpiCard index={7} label="Revenue" value={purchases.rows.length === 0 ? null : (revenue / 100).toFixed(2)} hint={purchases.rows.length === 0 ? "No payment provider connected" : "From recorded purchases"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Reservations per day">
          {loading ? <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" /> : <BarChart data={bucketByDay(reservations)} label="Reservations created" />}
        </AdminPanel>
        <AdminPanel title="Spots shared per day">
          {loading ? <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" /> : <BarChart data={bucketByDay(spots)} label="Spots shared" />}
        </AdminPanel>
      </div>

      <div className="mt-4">
        <NotConfigured
          title="Payment analytics unavailable"
          detail="Revenue, refunds and payment failure rates need a connected payment provider. Nothing is estimated here."
        />
      </div>
    </div>
  );
}
