import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader, StatusPill } from "@/components/admin/AdminTable";

export const Route = createFileRoute("/admin/email")({
  head: () => ({ meta: [{ title: "Email — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminEmail,
});

function Line({ label, value, tone }: { label: string; value: string; tone: "emerald" | "slate" }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm last:border-0 dark:border-white/10">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <StatusPill tone={tone}>{value}</StatusPill>
    </div>
  );
}

function AdminEmail() {
  return (
    <div>
      <AdminHeader title="Email" subtitle="Sender setup and delivery" />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
          <p className="text-sm font-bold">Sender status</p>
          <div className="mt-2">
            <Line label="Sender domain" value="Not configured" tone="slate" />
            <Line label="Sending host" value="Not configured" tone="slate" />
            <Line label="From address" value="Not configured" tone="slate" />
            <Line label="Last test email" value="Never" tone="slate" />
            <Line label="Email templates" value="0" tone="slate" />
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            No sender domain is set up for this project, so the app cannot send email yet. Sign-in emails currently use the platform default sender.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
          <p className="text-sm font-bold">Test email</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sending a test requires a verified sender domain and a server-side send route. Neither exists yet, so this action is unavailable.
          </p>
          <input disabled placeholder="admin@example.com" className="mt-3 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5" />
          <button disabled className="mt-2 w-full cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 dark:bg-white/5">
            Send test email — not configured
          </button>
          <p className="mt-3 text-[11px] text-slate-400">Credentials and passwords are never exposed in this console.</p>
        </section>
      </div>
    </div>
  );
}
