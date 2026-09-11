import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminHeader, AdminSearch, StatusPill, TableShell } from "@/components/admin/AdminTable";
import { usePointsLedger } from "@/lib/admin-finance";
import { useUserDirectory, fmtDateTime, dash, useSearch, shortRef } from "@/lib/admin-tables";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({ meta: [{ title: "Transactions — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTransactions,
});

const FILTERS = ["all", "earned", "redeemed"] as const;

function AdminTransactions() {
  const { rows, loading } = usePointsLedger(300);
  const users = useUserDirectory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const searched = useSearch(rows, query, (t) => [shortRef(t.id), users[t.user_id]?.name, t.reason]);
  const list = searched.filter((t) => (filter === "all" ? true : filter === "earned" ? t.delta > 0 : t.delta < 0));

  return (
    <div>
      <AdminHeader title="Transactions" subtitle="Every points movement in the network" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search transactions" />} />

      <div className="mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f ? "bg-emerald-500 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-[#111827] dark:text-slate-400 dark:ring-white/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <TableShell
          loading={loading}
          empty={list.length === 0}
          cols={6}
          head={
            <tr>
              {["Transaction", "User", "Type", "Points", "Reason", "Created"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
              ))}
            </tr>
          }
        >
          {list.map((t, i) => (
            <tr key={t.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
              <td className="px-4 py-3 font-mono text-xs font-semibold">{shortRef(t.id)}</td>
              <td className="px-4 py-3">{users[t.user_id]?.name || dash}</td>
              <td className="px-4 py-3">
                <StatusPill tone={t.delta >= 0 ? "emerald" : "amber"}>{t.delta >= 0 ? "Earned" : "Redeemed"}</StatusPill>
              </td>
              <td className={`px-4 py-3 tabular-nums font-semibold ${t.delta >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {t.delta >= 0 ? "+" : ""}{t.delta}
              </td>
              <td className="px-4 py-3 text-slate-500 capitalize dark:text-slate-400">{t.reason.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(t.created_at)}</td>
            </tr>
          ))}
        </TableShell>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">Currency transactions require a payment gateway; only the points ledger exists today.</p>
    </div>
  );
}
