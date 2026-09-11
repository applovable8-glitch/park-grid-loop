import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGate } from "@/components/admin/AdminGate";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "AndiPark Admin — Operations console" },
      { name: "description", content: "Internal AndiPark operations console: live parking activity, reservations and platform health." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell>
      <AdminGate>
        <Outlet />
      </AdminGate>
    </AdminShell>
  ),
});
