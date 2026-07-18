import { createFileRoute } from "@tanstack/react-router";
import { Screen, Row, RowGroup, Card } from "@/components/kit";
import { Shield, Users, Flag } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: () => (
  <Screen title="Admin" back="/profile">
    <Card>
      <p className="text-sm font-semibold">Admin console</p>
      <p className="text-xs text-muted-foreground">Only visible to accounts with the admin role.</p>
    </Card>
    <RowGroup>
      <Row icon={Shield} label="Role management" to="/admin/roles" />
      <Row icon={Users} label="User moderation" to="/admin/moderator" />
      <Row icon={Flag} label="Open reports" hint="Reports queue · coming soon" />
    </RowGroup>
  </Screen>
) });
