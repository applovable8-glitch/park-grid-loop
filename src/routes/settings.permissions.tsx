import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Bell, Camera, Contact } from "lucide-react";
import { toast } from "sonner";
import { Screen, Row, RowGroup, Badge } from "@/components/kit";

export const Route = createFileRoute("/settings/permissions")({ component: Perms });

const asked = () => toast.info("Open your device settings to change permissions");

function Perms() {
  return (
    <Screen title="Permissions" back="/settings">
      <RowGroup>
        <Row icon={MapPin} label="Location" hint="Required for parking" right={<Badge tone="emerald">Allowed</Badge>} onClick={asked} />
        <Row icon={Bell} label="Notifications" hint="Real-time alerts" right={<Badge tone="emerald">Allowed</Badge>} onClick={asked} />
        <Row icon={Camera} label="Camera" hint="Photo & QR handoffs" right={<Badge tone="muted">Ask</Badge>} onClick={asked} />
        <Row icon={Contact} label="Contacts" hint="Invite friends" right={<Badge tone="muted">Off</Badge>} onClick={asked} />
      </RowGroup>
    </Screen>
  );
}
