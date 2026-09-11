import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AreaMap } from "@/components/AreaMap";
import { AdminPanel } from "@/components/admin/AdminShell";
import { AdminHeader, AdminSearch, StatusPill, TableShell } from "@/components/admin/AdminTable";
import { useAdminSpots, useUserDirectory, fmtDateTime, dash, useSearch, shortRef, type AdminSpot } from "@/lib/admin-tables";
import { haversine, type LiveSpot } from "@/lib/parking-live";
import { distanceLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/parking")({
  head: () => ({ meta: [{ title: "Parking — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminParking,
});

function statusView(s: AdminSpot): { tone: "emerald" | "amber" | "red" | "blue" | "slate"; label: string } {
  switch (s.status) {
    case "available": return { tone: "emerald", label: "Available" };
    case "leaving": return { tone: "amber", label: "Leaving soon" };
    case "reserved": return s.reserved_by ? { tone: "blue", label: "Arriving" } : { tone: "red", label: "Reserved" };
    case "completed": return { tone: "slate", label: "Completed" };
    case "cancelled": return { tone: "slate", label: "Released" };
    case "expired": return { tone: "slate", label: "Expired" };
    default: return { tone: "slate", label: s.status };
  }
}

function AdminParking() {
  const { spots, loading } = useAdminSpots();
  const directory = useUserDirectory();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useSearch(spots, query, (s) => [s.address, s.status, directory[s.user_id]?.name, shortRef(s.id)]);
  const selected = rows.find((s) => s.id === selectedId) ?? null;

  const mapSpots = useMemo<LiveSpot[]>(
    () =>
      rows
        .filter((s) => ["available", "leaving", "reserved"].includes(s.status))
        .map((s) => ({
          id: s.id, user_id: s.user_id, lat: s.lat, lng: s.lng, address: s.address,
          cost: s.cost ?? 0, status: s.status, leave_at: s.leave_at,
          planned_leave_at: s.planned_leave_at, reserved_by: s.reserved_by, reserved_until: null,
        })),
    [rows],
  );

  const center = useMemo(() => {
    if (selected) return { lat: selected.lat, lng: selected.lng };
    if (!mapSpots.length) return { lat: 25.2048, lng: 55.2708 };
    return {
      lat: mapSpots.reduce((a, s) => a + s.lat, 0) / mapSpots.length,
      lng: mapSpots.reduce((a, s) => a + s.lng, 0) / mapSpots.length,
    };
  }, [selected, mapSpots]);

  return (
    <div>
      <AdminHeader title="Parking" subtitle="Monitor shared parking activity" action={<AdminSearch value={query} onChange={setQuery} placeholder="Search parking" />} />

      <div className="mt-4">
        <AdminPanel title={selected ? `Spot ${shortRef(selected.id)}` : "Parking map"}>
          <div className="relative h-[320px] overflow-hidden rounded-lg">
            {loading && <div className="absolute inset-0 z-10 animate-pulse bg-slate-100 dark:bg-white/5" />}
            <AreaMap center={center} spots={mapSpots} variant="full" className="h-full w-full" />
          </div>
        </AdminPanel>
      </div>

      <div className="mt-4">
        <TableShell
          loading={loading}
          empty={rows.length === 0}
          cols={7}
          head={
            <tr>
              {["Status", "Location", "Distance", "Cost", "Driver", "Created", "Departure"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-start font-semibold">{h}</th>
              ))}
            </tr>
          }
        >
          {rows.map((s, i) => {
            const view = statusView(s);
            const dist = selected && selected.id !== s.id ? haversine(selected, s) : null;
            return (
              <tr
                key={s.id}
                onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                className={`animate-fade-up cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${s.id === selectedId ? "bg-emerald-500/5" : ""}`}
                style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
              >
                <td className="px-4 py-3"><StatusPill tone={view.tone}>{view.label}</StatusPill></td>
                <td className="px-4 py-3 font-medium">{s.address || `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{dist == null ? dash : distanceLabel(dist)}</td>
                <td className="px-4 py-3 tabular-nums">{s.cost ?? dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{directory[s.user_id]?.name || dash}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(s.created_at)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDateTime(s.planned_leave_at ?? s.leave_at)}</td>
              </tr>
            );
          })}
        </TableShell>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        Distance is measured from the selected spot. Parking type is not stored in the database, so it is not shown.
      </p>
    </div>
  );
}
