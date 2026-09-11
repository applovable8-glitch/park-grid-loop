import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AdminHeader, StatusPill, TableShell } from "@/components/admin/AdminTable";
import { listAdminRoles } from "@/lib/admin-integrations.functions";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "Admin roles — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminRoles,
});

type RoleRow = { userId: string; role: string; createdAt: string; name: string | null };

const TONES: Record<string, "emerald" | "blue" | "purple" | "amber" | "slate"> = {
  super_admin: "emerald",
  admin: "blue",
  moderator: "purple",
  support: "amber",
  analyst: "slate",
};

function AdminRoles() {
  const load = useServerFn(listAdminRoles);
  const [rows, setRows] = useState<RoleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load()
      .then((r) => setRows(r as RoleRow[]))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load roles"));
  }, [load]);

  return (
    <div>
      <AdminHeader title="Admin roles & permissions" subtitle="Who can reach this console" />

      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-500/5 p-4 text-sm text-red-500">{error}</p>}

      {!error && (
        <div className="mt-5">
          <TableShell
            cols={4}
            loading={rows === null}
            empty={rows !== null && rows.length === 0}
            head={
              <tr>
                <th className="px-4 py-3 text-start font-semibold">Member</th>
                <th className="px-4 py-3 text-start font-semibold">Role</th>
                <th className="px-4 py-3 text-start font-semibold">Granted</th>
                <th className="px-4 py-3 text-start font-semibold">User ID</th>
              </tr>
            }
          >
            {(rows ?? []).map((r) => (
              <tr key={`${r.userId}-${r.role}`}>
                <td className="px-4 py-3 font-semibold">{r.name ?? "Unnamed member"}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={TONES[r.role] ?? "slate"}>{r.role.replace("_", " ")}</StatusPill>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{r.userId.slice(0, 8)}…</td>
              </tr>
            ))}
          </TableShell>
          <p className="mt-3 text-[11px] text-slate-400">
            Roles are stored in a dedicated permissions table and enforced server-side. Granting or revoking a role from this console is not
            available yet — the first Super Admin is claimed once, and further grants need a role-management action to be added.
          </p>
        </div>
      )}
    </div>
  );
}
