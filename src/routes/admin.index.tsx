import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Car, CalendarCheck, CheckCircle2, Activity, Database, Map as MapIcon, Bell, ArrowUpRight } from "lucide-react";
import { useAdminStats, useAdminActivity, activityLabel, shortTime } from "@/lib/admin-data";
import { useLiveSpots } from "@/lib/parking-live";
import { AdminPanel } from "@/components/admin/AdminShell";
import { MAPS_KEY } from "@/lib/google-maps";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function greeting(h: number) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function AdminOverview() {
  const { stats, loading } = useAdminStats();
  const { events, loading: eventsLoading } = useAdminActivity(8);
  const { spots } = useLiveSpots();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const kpis = [
    { label: "Users", value: stats.users, icon: Users },
    { label: "Active spots", value: stats.activeSpots, icon: Car },
    { label: "Reservations", value: stats.reservations, icon: CalendarCheck },
    { label: "Successful handoffs", value: stats.handoffs, icon: CheckCircle2 },
  ];

  return (
    <div>
      <header className="animate-fade-up">
        <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">{greeting(now?.getHours() ?? 9)}, Admin</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          AndiPark Operations
          {now && <span className="ms-2 tabular-nums text-slate-400">· {now.toLocaleDateString()} {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        </p>
      </header>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className="animate-fade-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{k.label}</p>
              <k.icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 font-[var(--font-display)] text-3xl font-bold tabular-nums">
              {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-100 dark:bg-white/5" /> : k.value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Live activity */}
        <AdminPanel
          title="Live activity"
          className="lg:col-span-2"
          action={<Link to="/admin/live" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live operations <ArrowUpRight className="h-3 w-3 rtl:-scale-x-100" /></Link>}
        >
          {eventsLoading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" />)}</div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/10">
              {events.map((e, i) => (
                <li key={e.id} className="animate-fade-up flex items-center gap-3 py-2.5" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <span className="w-12 shrink-0 text-xs tabular-nums text-slate-400">{shortTime(e.at)}</span>
                  <span className="text-sm font-semibold">{activityLabel(e.kind)}</span>
                  <span className="ms-auto truncate text-xs text-slate-500 dark:text-slate-400">{e.description}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel title="System status">
            <ul className="space-y-2.5 text-sm">
              <StatusRow icon={Database} label="Database" ok={stats.users !== null || stats.activeSpots !== null} detail={stats.users !== null || stats.activeSpots !== null ? "Reachable" : "No read access"} />
              <StatusRow icon={MapIcon} label="Maps" ok={Boolean(MAPS_KEY)} detail={MAPS_KEY ? "Key configured" : "Key missing"} />
              <StatusRow icon={Bell} label="Notifications" ok={null} detail="No health check" />
            </ul>
          </AdminPanel>

          <AdminPanel title="Quick actions">
            <div className="space-y-2">
              <Link to="/admin/live" className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                <Activity className="h-4 w-4 text-emerald-500" /> View live map
                <span className="ms-auto text-xs font-normal text-slate-400 tabular-nums">{spots.length} active</span>
              </Link>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ icon: Icon, label, ok, detail }: { icon: React.ComponentType<{ className?: string }>; label: string; ok: boolean | null; detail: string }) {
  const dot = ok === null ? "bg-slate-300" : ok ? "bg-emerald-500" : "bg-red-500";
  return (
    <li className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="font-medium">{label}</span>
      <span className="ms-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span className={`h-2 w-2 rounded-full ${dot}`} /> {detail}
      </span>
    </li>
  );
}
