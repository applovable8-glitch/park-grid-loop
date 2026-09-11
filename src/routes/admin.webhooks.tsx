import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader, NotConfigured, StatusPill } from "@/components/admin/AdminTable";

export const Route = createFileRoute("/admin/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminWebhooks,
});

function AdminWebhooks() {
  return (
    <div>
      <AdminHeader title="Webhooks" subtitle="Incoming events from external services" />

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Webhook health</p>
          <StatusPill tone="slate">Not configured</StatusPill>
        </div>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          There is no webhook endpoint or event log in this project, so no health signal can be read.
        </p>
      </div>

      <div className="mt-4">
        <NotConfigured
          title="No webhook events"
          detail="Webhook events are not stored anywhere in the database. Once a payment or email provider is connected and an event log exists, deliveries will appear here with type, reference, status and any error."
        />
      </div>
    </div>
  );
}
