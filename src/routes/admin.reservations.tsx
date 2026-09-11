import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminHeader, AdminSearch, StatusPill, TableShell } from "@/components/admin/AdminTable";
import {
  useAdminReservations, useUserDirectory, useSpotDirectory,
  fmtDateTime, dash, useSearch, shortRef, type AdminReservation,
} from "@/lib/admin-tables";

export const Route = createFileRoute("/admin/reservations")({
  head: () => ({ meta: [{ title: "Reservations — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReservations,
});

function statusView(r: AdminReservation): { tone: "emerald" | "amber" | "red" | "blue" | "slate"; label: string } {
  if (r.status === "completed") return { tone: "emerald", label: "Completed" };
  if (r.status === "cancelled") return { tone: "red", label: "Cancelled" };
  if (r.status === "expired") return { tone: "slate", label: "Expired" };
  switch (r.request_status) {
    case "pending": return { tone: "amber", label: "Pending" };
    case "confirmed": return { tone: "blue", label: "Confirmed" };
    case "extension_proposed": return { tone: "amber", label: "Extension proposed" };
    case "declined": return { tone: "red", label: "Declined" };
    case "cancelled": return { tone: "red", label: "Cancelled" };
    default: return { tone: "slate", label: r.request_status || r.status };
  }
}

function AdminReservations() {
  const { reservations, loading } = useAdminReservations();
  const users = useUserDirectory();
  const spots = useSpotDirectory();
  const [query, setQuery] = useState("");

  const rows = useSearch(reservations, query, (r) => [
    shortRef(r.id), r.status, r.request_status,
    users[r.user_id]?.name, r.owner_id ? users[r.owner_id]?.name : null,
    spots[r.spot_id]?.address,
  ]);

  return (
    <div>
      <AdminHeader title="Reservations" subtitle="Monitor every parking connection" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search reservations" />} />

      <p className="mt-4 text-xs text-slate-400">{loading ? "Loading…" : `${rows.length} of ${reservations.length} reservations`}</p>

      <div className="mt-2">
        <TableShell
          loading={loading}
          empty={rows.length === 0}
          cols={7}
          head={
            <tr>
              {["Reservation", "Requester", "Owner", "Spot", "Created", "Departure", "Status"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
              ))}
            </tr>
          }
        >
          {rows.map((r, i) => {
            const view = statusView(r);
            return (
              <tr key={r.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{shortRef(r.id)}</td>
                <td className="px-4 py-3">{users[r.user_id]?.name || dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{(r.owner_id && users[r.owner_id]?.name) || dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{spots[r.spot_id]?.address || shortRef(r.spot_id)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(r.proposed_leave_at ?? r.expires_at)}</td>
                <td className="px-4 py-3"><StatusPill tone={view.tone}>{view.label}</StatusPill></td>
              </tr>
            );
          })}
        </TableShell>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">Payments are not connected, so no cost column is shown.</p>
    </div>
  );
}
