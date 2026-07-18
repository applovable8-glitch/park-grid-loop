import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card, Badge } from "@/components/kit";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin/roles")({ component: () => (
  <Screen title="Role management" back="/admin">
    <p className="text-xs text-muted-foreground">Assign roles to workspace members. Only admins can modify.</p>
    <div className="mt-3 space-y-2">
      {[{ n: "Alex Driver", r: "admin" }, { n: "Priya S.", r: "moderator" }, { n: "Omar M.", r: "user" }].map((u) => (
        <Card key={u.n}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><Shield className="h-4 w-4" /></div>
            <p className="flex-1 text-sm font-semibold">{u.n}</p>
            <Badge tone={u.r === "admin" ? "emerald" : u.r === "moderator" ? "blue" : "muted"}>{u.r}</Badge>
          </div>
        </Card>
      ))}
    </div>
  </Screen>
) });
