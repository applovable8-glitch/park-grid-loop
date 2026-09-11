import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminHeader, AdminSearch, KpiCard, StatusPill, TableShell } from "@/components/admin/AdminTable";
import { useAdminNotifications } from "@/lib/admin-finance";
import { useUserDirectory, fmtDateTime, dash, useSearch } from "@/lib/admin-tables";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminNotifs,
});

function AdminNotifs() {
  const { rows, loading } = useAdminNotifications(300);
  const users = useUserDirectory();
  const [query, setQuery] = useState("");
  const list = useSearch(rows, query, (n) => [n.title, n.body, n.icon, users[n.user_id]?.name]);

  const kpis = useMemo(() => ({
    total: rows.length,
    read: rows.filter((n) => n.read).length,
    unread: rows.filter((n) => !n.read).length,
    users: new Set(rows.map((n) => n.user_id)).size,
  }), [rows]);

  return (
    <div>
      <AdminHeader title="Notifications" subtitle="Everything the app has told drivers" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search notifications" />} />

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard index={0} label="Created" value={loading ? null : kpis.total} hint="Latest 300 records" />
        <KpiCard index={1} label="Opened" value={loading ? null : kpis.read} />
        <KpiCard index={2} label="Unopened" value={loading ? null : kpis.unread} />
        <KpiCard index={3} label="Recipients" value={loading ? null : kpis.users} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Broadcast not configured</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Notifications are created only by in-app events. There is no server capability to send a message to all users, so broadcasting is unavailable.
            </p>
          </div>
          <button disabled className="cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 dark:bg-white/5">Send broadcast</button>
        </div>
      </div>

      <div className="mt-4">
        <TableShell
          loading={loading}
          empty={list.length === 0}
          cols={5}
          head={
            <tr>
              {["User", "Type", "Title", "Status", "Created"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
              ))}
            </tr>
          }
        >
          {list.map((n, i) => (
            <tr key={n.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
              <td className="px-4 py-3">{users[n.user_id]?.name || dash}</td>
              <td className="px-4 py-3 capitalize text-slate-500 dark:text-slate-400">{n.icon}</td>
              <td className="px-4 py-3 font-medium">{n.title}</td>
              <td className="px-4 py-3"><StatusPill tone={n.read ? "emerald" : "amber"}>{n.read ? "Opened" : "Unopened"}</StatusPill></td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(n.created_at)}</td>
            </tr>
          ))}
        </TableShell>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Delivery states (delivered / failed / pending) are not stored — only creation and read state exist.</p>
    </div>
  );
}
