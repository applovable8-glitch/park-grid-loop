import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader, NotConfigured } from "@/components/admin/AdminTable";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "Admin roles — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminRoles,
});

function AdminRoles() {
  return (
    <div>
      <AdminHeader title="Admin roles & permissions" subtitle="Access control for this console" />
      <div className="mt-5">
        <NotConfigured
          title="Admin roles are not configured yet"
          detail="No roles or permissions store exists, so this console cannot list admin users, roles, status or last activity — and no permission is enforced today. Roles such as Super Admin, Operations, Finance, Support, Marketing and Analyst can be shown here once a roles backend is added."
        />
      </div>
    </div>
  );
}
