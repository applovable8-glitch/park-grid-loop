import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Activity, Map, Users, Car, CalendarCheck, CreditCard,
  Gift, Bell, Globe, BarChart3, LifeBuoy, Settings, Menu, X, ArrowLeft,
  Receipt, RotateCcw, Webhook, UserPlus, Mail, FileText, ShieldCheck, ScrollText,
} from "lucide-react";

type Item = { label: string; icon: typeof Users; to?: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Operations",
    items: [
      { label: "Overview", icon: LayoutDashboard, to: "/admin" },
      { label: "Live Operations", icon: Activity, to: "/admin/live" },
      { label: "Users", icon: Users, to: "/admin/users" },
      { label: "Parking", icon: Car, to: "/admin/parking" },
      { label: "Reservations", icon: CalendarCheck, to: "/admin/reservations" },
      { label: "Map", icon: Map },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", icon: CreditCard, to: "/admin/payments" },
      { label: "Transactions", icon: Receipt, to: "/admin/transactions" },
      { label: "Refunds", icon: RotateCcw, to: "/admin/refunds" },
      { label: "Webhooks", icon: Webhook, to: "/admin/webhooks" },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "Rewards", icon: Gift, to: "/admin/rewards" },
      { label: "Referrals", icon: UserPlus, to: "/admin/referrals" },
    ],
  },
  {
    title: "Communications",
    items: [
      { label: "Notifications", icon: Bell, to: "/admin/notifications" },
      { label: "Email", icon: Mail, to: "/admin/email" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
      { label: "Reports", icon: FileText, to: "/admin/reports" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Website", icon: Globe, to: "/admin/website" },
      { label: "Security", icon: ShieldCheck, to: "/admin/security" },
      { label: "Audit Logs", icon: ScrollText, to: "/admin/audit" },
      { label: "Settings", icon: Settings, to: "/admin/settings" },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#111827]/90">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-[var(--font-display)] text-sm font-bold">AndiPark <span className="text-slate-400">Admin</span></span>
      </div>

      {/* Drawer backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 shrink-0 overflow-y-auto border-e border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 dark:border-white/10 dark:bg-[#111827] ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold tracking-tight">AndiPark</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Admin console</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="px-3 pb-6">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-5">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{g.title}</p>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = it.to === "/admin" ? pathname === "/admin" : !!it.to && pathname.startsWith(it.to);
                  const cls = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                      : it.to
                        ? "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                        : "cursor-not-allowed text-slate-400 dark:text-slate-600"
                  }`;
                  return (
                    <li key={it.label}>
                      {it.to ? (
                        <Link to={it.to} onClick={() => setOpen(false)} className={cls}>
                          <it.icon className="h-4 w-4" /> {it.label}
                        </Link>
                      ) : (
                        <span className={cls} aria-disabled>
                          <it.icon className="h-4 w-4" /> {it.label}
                          <span className="ms-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 dark:bg-white/5">soon</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> Back to app
          </Link>
        </nav>
      </aside>

      <main className="lg:ps-64">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

export function AdminPanel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827] ${className}`}>
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
        <h2 className="text-sm font-bold">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
