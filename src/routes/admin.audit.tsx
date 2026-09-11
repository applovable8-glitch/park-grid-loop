import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AdminHeader, TableShell } from "@/components/admin/AdminTable";
import { listAuditLog } from "@/lib/admin-integrations.functions";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit logs — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminAudit,
});

type Entry = { id: string; actorId: string | null; action: string; target: string | null; meta: string; createdAt: string };

function AdminAudit() {
  const load = useServerFn(listAuditLog);
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load()
      .then((r) => setRows(r as Entry[]))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load the audit log"));
  }, [load]);

  return (
    <div>
      <AdminHeader title="Audit logs" subtitle="Administrative actions recorded server-side" />

      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-500/5 p-4 text-sm text-red-500">{error}</p>}

      {!error && (
        <div className="mt-5">
          <TableShell
            cols={4}
            loading={rows === null}
            empty={rows !== null && rows.length === 0}
            head={
              <tr>
                <th className="px-4 py-3 text-start font-semibold">When</th>
                <th className="px-4 py-3 text-start font-semibold">Action</th>
                <th className="px-4 py-3 text-start font-semibold">Target</th>
                <th className="px-4 py-3 text-start font-semibold">Details</th>
              </tr>
            }
          >
            {(rows ?? []).map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold">{r.action}</td>
                <td className="px-4 py-3 text-slate-500">{r.target ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{r.meta === "{}" ? "—" : r.meta}</td>
              </tr>
            ))}
          </TableShell>
          <p className="mt-3 text-[11px] text-slate-400">
            Credential values are never written to this log — only which integration changed, which secret fields were replaced or removed, and the
            result of connection tests.
          </p>
        </div>
      )}
    </div>
  );
}
