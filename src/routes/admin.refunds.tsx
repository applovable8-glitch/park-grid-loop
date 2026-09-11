import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader, NotConfigured } from "@/components/admin/AdminTable";

export const Route = createFileRoute("/admin/refunds")({
  head: () => ({ meta: [{ title: "Refunds — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminRefunds,
});

function AdminRefunds() {
  return (
    <div>
      <AdminHeader title="Refunds" subtitle="Return money to drivers" />
      <div className="mt-4">
        <NotConfigured
          title="Refunds are not available"
          detail="No payment gateway is connected and the database has no refund records, so refunds cannot be issued or listed. Connect payments first — this page will then show refund history."
        />
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-200">What a refund will show later</p>
        <p className="mt-1">Refund reference, related payment, user, amount, reason, status and creation time.</p>
        <button disabled className="mt-3 cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 dark:bg-white/5">
          Issue refund — not configured
        </button>
      </div>
    </div>
  );
}
