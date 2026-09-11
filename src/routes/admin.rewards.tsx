import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminHeader, AdminSearch, KpiCard, StatusPill, TableShell } from "@/components/admin/AdminTable";
import { usePointsLedger } from "@/lib/admin-finance";
import { useUserDirectory, fmtDateTime, dash, useSearch, shortRef } from "@/lib/admin-tables";

export const Route = createFileRoute("/admin/rewards")({
  head: () => ({ meta: [{ title: "Points & Rewards — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminRewards,
});

function typeOf(reason: string, delta: number) {
  if (reason.startsWith("referral")) return { label: "Referral", tone: "purple" as const };
  if (reason.includes("bonus")) return { label: "Bonus", tone: "blue" as const };
  if (delta >= 0) return { label: "Earned", tone: "emerald" as const };
  return { label: "Redeemed", tone: "amber" as const };
}

function AdminRewards() {
  const { rows, loading } = usePointsLedger(300);
  const users = useUserDirectory();
  const [query, setQuery] = useState("");
  const list = useSearch(rows, query, (t) => [shortRef(t.id), users[t.user_id]?.name, t.reason]);

  const kpis = useMemo(() => {
    const issued = rows.filter((r) => r.delta > 0).reduce((a, r) => a + r.delta, 0);
    const redeemed = rows.filter((r) => r.delta < 0).reduce((a, r) => a + Math.abs(r.delta), 0);
    const active = new Set(rows.map((r) => r.user_id)).size;
    return { issued, redeemed, outstanding: issued - redeemed, active };
  }, [rows]);

  return (
    <div>
      <AdminHeader title="Points & Rewards" subtitle="AndiPoints across the community" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search rewards" />} />

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard index={0} label="Points issued" value={loading ? null : kpis.issued} hint="From the latest 300 ledger entries" />
        <KpiCard index={1} label="Points redeemed" value={loading ? null : kpis.redeemed} />
        <KpiCard index={2} label="Outstanding" value={loading ? null : kpis.outstanding} />
        <KpiCard index={3} label="Active reward users" value={loading ? null : kpis.active} />
      </div>

      <div className="mt-4">
        <TableShell
          loading={loading}
          empty={list.length === 0}
          cols={6}
          head={
            <tr>
              {["User", "Type", "Points", "Reason", "Reference", "Date"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
              ))}
            </tr>
          }
        >
          {list.map((t, i) => {
            const kind = typeOf(t.reason, t.delta);
            const meta = t.metadata ?? {};
            const ref = (meta["reservation_id"] ?? meta["spot_id"] ?? meta["referee_id"] ?? meta["referrer_id"]) as string | undefined;
            return (
              <tr key={t.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                <td className="px-4 py-3">{users[t.user_id]?.name || dash}</td>
                <td className="px-4 py-3"><StatusPill tone={kind.tone}>{kind.label}</StatusPill></td>
                <td className={`px-4 py-3 tabular-nums font-semibold ${t.delta >= 0 ? "text-emerald-600" : "text-amber-600"}`}>{t.delta >= 0 ? "+" : ""}{t.delta}</td>
                <td className="px-4 py-3 capitalize text-slate-500 dark:text-slate-400">{t.reason.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{ref ? shortRef(ref) : dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(t.created_at)}</td>
              </tr>
            );
          })}
        </TableShell>
      </div>
    </div>
  );
}
