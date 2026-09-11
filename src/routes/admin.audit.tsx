import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader, NotConfigured } from "@/components/admin/AdminTable";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit logs — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminAudit,
});

function AdminAudit() {
  return (
    <div>
      <AdminHeader title="Audit logs" subtitle="Administrative actions history" />
      <div className="mt-5">
        <NotConfigured
          title="Audit logging is not configured"
          detail="There is no audit store recording who did what in this console. Once an audit backend exists, this page will list timestamp, admin, action, resource, result and safe metadata with search and filters."
        />
      </div>
    </div>
  );
}
