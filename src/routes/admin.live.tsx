import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AreaMap } from "@/components/AreaMap";
import { AdminPanel } from "@/components/admin/AdminShell";
import { useLiveSpots, minutesUntil, type LiveSpot } from "@/lib/parking-live";
import { useAdminActivity, activityLabel, shortTime } from "@/lib/admin-data";
import { ABU_DHABI } from "@/lib/geo-defaults";

export const Route = createFileRoute("/admin/live")({ component: LiveOps });

type Bucket = "available" | "soon" | "reserved" | "arriving";

function bucketOf(s: LiveSpot): Bucket {
  if (s.reserved_by) return s.status === "reserved" ? "reserved" : "arriving";
  const mins = minutesUntil(s.planned_leave_at ?? s.leave_at);
  return mins <= 5 ? "soon" : "available";
}

const LEGEND: { key: Bucket; label: string; dot: string }[] = [
  { key: "available", label: "Available", dot: "bg-emerald-500" },
  { key: "soon", label: "Leaving soon", dot: "bg-amber-500" },
  { key: "reserved", label: "Reserved", dot: "bg-red-500" },
  { key: "arriving", label: "Arriving", dot: "bg-blue-500" },
];

function LiveOps() {
  const { spots, loading } = useLiveSpots();
  const { events, loading: eventsLoading } = useAdminActivity(20);

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { available: 0, soon: 0, reserved: 0, arriving: 0 };
    for (const s of spots) c[bucketOf(s)] += 1;
    return c;
  }, [spots]);

  const center = useMemo(() => {
    if (!spots.length) return ABU_DHABI;
    const lat = spots.reduce((a, s) => a + s.lat, 0) / spots.length;
    const lng = spots.reduce((a, s) => a + s.lng, 0) / spots.length;
    return { lat, lng };
  }, [spots]);

  return (
    <div>
      <header className="animate-fade-up">
        <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">Live Operations</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Real-time view of every active parking spot on the network.
        </p>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {LEGEND.map((l, i) => (
          <div key={l.key} className="animate-fade-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{l.label}</p>
            </div>
            <p className="mt-2 font-[var(--font-display)] text-3xl font-bold tabular-nums">{loading ? "—" : counts[l.key]}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <AdminPanel title="Operations map" className="lg:col-span-2">
          <div className="relative h-[460px] overflow-hidden rounded-lg">
            {loading && <div className="absolute inset-0 z-10 animate-pulse bg-slate-100 dark:bg-white/5" />}
            <AreaMap center={center} spots={spots} variant="full" className="h-full w-full" />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {LEGEND.map((l) => (
              <span key={l.key} className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className={`h-2 w-2 rounded-full ${l.dot}`} /> {l.label}
              </span>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Live activity">
          {eventsLoading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" />)}</div>
          ) : events.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No live events right now.</p>
          ) : (
            <ul className="max-h-[440px] divide-y divide-slate-100 overflow-y-auto dark:divide-white/10">
              {events.map((e, i) => (
                <li key={e.id} className="animate-fade-up py-2.5" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-slate-400">{shortTime(e.at)}</span>
                    <span className="text-sm font-semibold">{activityLabel(e.kind)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{e.description}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
