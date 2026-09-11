import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminHeader, AdminSearch, KpiCard, StatusPill, TableShell, NotConfigured } from "@/components/admin/AdminTable";
import { useReferrals } from "@/lib/admin-finance";
import { useUserDirectory, fmtDateTime, dash, useSearch } from "@/lib/admin-tables";

export const Route = createFileRoute("/admin/referrals")({
  head: () => ({ meta: [{ title: "Referrals — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReferrals,
});

function AdminReferrals() {
  const { rows, loading } = useReferrals();
  const users = useUserDirectory();
  const [query, setQuery] = useState("");
  const list = useSearch(rows, query, (r) => [r.code, users[r.referrer_id]?.name, users[r.referee_id]?.name]);

  const kpis = useMemo(() => ({
    total: rows.length,
    rewarded: rows.filter((r) => r.points_awarded > 0).length,
    points: rows.reduce((a, r) => a + (r.points_awarded ?? 0), 0),
  }), [rows]);

  return (
    <div>
      <AdminHeader title="Referrals" subtitle="How the community grows itself" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search referrals" />} />

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard index={0} label="Total referrals" value={loading ? null : kpis.total} />
        <KpiCard index={1} label="Rewarded referrals" value={loading ? null : kpis.rewarded} />
        <KpiCard index={2} label="Conversion rate" value={loading || kpis.total === 0 ? null : `${Math.round((kpis.rewarded / kpis.total) * 100)}%`} hint="Rewarded ÷ total" />
        <KpiCard index={3} label="Points issued" value={loading ? null : kpis.points} />
      </div>

      <div className="mt-4">
        {!loading && rows.length === 0 ? (
          <NotConfigured title="No referrals yet" detail="Referral codes exist for every profile, but nobody has redeemed one so far." />
        ) : (
          <TableShell
            loading={loading}
            empty={list.length === 0}
            cols={6}
            head={
              <tr>
                {["Referrer", "Referred user", "Code", "Status", "Reward", "Created"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
                ))}
              </tr>
            }
          >
            {list.map((r, i) => (
              <tr key={r.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                <td className="px-4 py-3">{users[r.referrer_id]?.name || dash}</td>
                <td className="px-4 py-3">{users[r.referee_id]?.name || dash}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{r.code}</td>
                <td className="px-4 py-3"><StatusPill tone={r.points_awarded > 0 ? "emerald" : "slate"}>{r.points_awarded > 0 ? "Rewarded" : "Joined"}</StatusPill></td>
                <td className="px-4 py-3 tabular-nums">{r.points_awarded ?? dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(r.created_at)}</td>
              </tr>
            ))}
          </TableShell>
        )}
      </div>
    </div>
  );
}
