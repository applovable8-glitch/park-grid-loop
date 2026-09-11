import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { AdminHeader, AdminSearch, StatusPill, TableShell } from "@/components/admin/AdminTable";
import { useAdminUsers, andiScore, fmtDate, dash, useSearch, type AdminUser } from "@/lib/admin-tables";
import { maskPlate } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminUsers,
});

function vehicleOf(u: AdminUser) {
  const parts = [u.car_color, u.car_make, u.car_model].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function AdminUsers() {
  const { users, loading } = useAdminUsers();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const rows = useSearch(users, query, (u) => [u.name, u.email, u.phone, u.plate, vehicleOf(u)]);

  return (
    <div>
      <AdminHeader title="Users" subtitle="Manage the AndiPark community" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search users" />} />

      <p className="mt-4 text-xs text-slate-400">{loading ? "Loading…" : `${rows.length} of ${users.length} users`}</p>

      <div className="mt-2">
        <TableShell
          loading={loading}
          empty={rows.length === 0}
          cols={8}
          head={
            <tr className="text-start">
              {["User", "Phone / Email", "Vehicle", "AndiScore", "Points", "Reservations", "Status", "Joined"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
              ))}
            </tr>
          }
        >
          {rows.map((u, i) => {
            const score = andiScore(u.reputation);
            return (
              <tr
                key={u.user_id}
                onClick={() => setSelected(u)}
                className="animate-fade-up cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" /> : (u.name?.[0] ?? "?").toUpperCase()}
                    </span>
                    <span className="font-medium">{u.name || dash}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.phone || u.email || dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{vehicleOf(u) ?? dash}</td>
                <td className="px-4 py-3 tabular-nums">{score ?? dash}</td>
                <td className="px-4 py-3 tabular-nums">{u.points ?? dash}</td>
                <td className="px-4 py-3 tabular-nums">{u.reservation_count ?? dash}</td>
                <td className="px-4 py-3"><StatusPill tone="emerald">Active</StatusPill></td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(u.created_at)}</td>
              </tr>
            );
          })}
        </TableShell>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        Suspended / banned / pending states are not stored in the database yet, so every account reads as Active.
      </p>

      {selected && <UserDrawer user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm dark:border-white/10">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium">{value ?? dash}</span>
    </div>
  );
}

function UserDrawer({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50" onClick={onClose} />
      <aside className="animate-sheet-up fixed inset-y-0 end-0 z-50 w-full max-w-md overflow-y-auto border-s border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111827]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 font-bold text-emerald-600">
              {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : (user.name?.[0] ?? "?").toUpperCase()}
            </span>
            <div>
              <p className="font-[var(--font-display)] text-lg font-bold">{user.name || dash}</p>
              <p className="text-xs text-slate-400">Joined {fmtDate(user.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5">
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={user.phone} />
          <Row label="Vehicle" value={vehicleOf(user)} />
          <Row label="Plate" value={maskPlate(user.plate)} />
          <Row label="AndiScore" value={andiScore(user.reputation)} />
          <Row label="Points" value={user.points} />
          <Row label="Reservations" value={user.reservation_count} />
          <Row label="Shared spots" value={user.shared_count} />
          <Row label="Account status" value="Active" />
        </div>

        <p className="mt-4 text-[11px] text-slate-400">Account actions (suspend, ban) are not available — no status field exists in the database yet.</p>
      </aside>
    </>
  );
}
