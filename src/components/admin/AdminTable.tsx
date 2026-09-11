import type { ReactNode } from "react";
import { Search } from "lucide-react";

export function AdminHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

export function AdminSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white ps-9 pe-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 dark:border-white/10 dark:bg-[#0B1120]"
      />
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "emerald" | "amber" | "red" | "blue" | "slate" | "purple"; children: ReactNode }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    slate: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function TableShell({ head, children, empty, loading, cols }: { head: ReactNode; children: ReactNode; empty: boolean; loading: boolean; cols: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827]">
      <table className="w-full min-w-[760px] text-start text-sm">
        <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 dark:border-white/10">
          {head}
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
          {loading ? (
            [0, 1, 2, 3, 4].map((i) => (
              <tr key={i}>
                <td colSpan={cols} className="px-4 py-3">
                  <div className="h-6 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
                </td>
              </tr>
            ))
          ) : empty ? (
            <tr>
              <td colSpan={cols} className="px-4 py-14 text-center text-sm text-slate-500">Nothing to show yet.</td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function NotConfigured({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/15 dark:bg-[#111827]">
      <p className="font-[var(--font-display)] text-base font-bold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export function KpiCard({ label, value, hint, index = 0 }: { label: string; value: string | number | null; hint?: string; index?: number }) {
  return (
    <div className="animate-fade-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]" style={{ animationDelay: `${index * 40}ms` }}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 font-[var(--font-display)] text-3xl font-bold tabular-nums">{value ?? "—"}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
