import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminHeader, AdminSearch, StatusPill, TableShell, NotConfigured } from "@/components/admin/AdminTable";
import { usePointPurchases } from "@/lib/admin-finance";
import { useUserDirectory, fmtDateTime, dash, useSearch, shortRef } from "@/lib/admin-tables";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPayments,
});

export function money(amount: number | null, currency: string | null) {
  if (amount == null) return dash;
  return `${(amount / 100).toFixed(2)} ${currency?.toUpperCase() ?? ""}`.trim();
}

function AdminPayments() {
  const { rows, loading } = usePointPurchases();
  const users = useUserDirectory();
  const [query, setQuery] = useState("");
  const list = useSearch(rows, query, (p) => [shortRef(p.id), users[p.user_id]?.name, p.price_id, p.currency]);

  return (
    <div>
      <AdminHeader title="Payments" subtitle="Point purchases recorded in the database" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search payments" />} />

      <div className="mt-4">
        {!loading && rows.length === 0 ? (
          <NotConfigured
            title="No payment provider connected"
            detail="No payment gateway is connected to this project, so no payment records exist. This page will populate automatically once payments are enabled."
          />
        ) : (
          <TableShell
            loading={loading}
            empty={list.length === 0}
            cols={8}
            head={
              <tr>
                {["Payment", "User", "Package", "Points", "Amount", "Environment", "Status", "Created"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
                ))}
              </tr>
            }
          >
            {list.map((p, i) => (
              <tr key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{shortRef(p.id)}</td>
                <td className="px-4 py-3">{users[p.user_id]?.name || dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.price_id}</td>
                <td className="px-4 py-3 tabular-nums">{p.points}</td>
                <td className="px-4 py-3 tabular-nums">{money(p.amount_total, p.currency)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.environment}</td>
                <td className="px-4 py-3"><StatusPill tone="emerald">Paid</StatusPill></td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(p.created_at)}</td>
              </tr>
            ))}
          </TableShell>
        )}
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        Only successful purchases are stored, so pending, failed, refunded and cancelled states have no records in the database.
      </p>
    </div>
  );
}
