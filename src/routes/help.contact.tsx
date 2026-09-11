import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MessageSquare } from "lucide-react";
import { Screen, RowGroup, Row } from "@/components/kit";

export const Route = createFileRoute("/help/contact")({ component: () => (
  <Screen title="Contact support" back="/help">
    <RowGroup>
      <Row icon={Mail} label="Email" hint="support@andipark.app" onClick={() => (window.location.href = "mailto:support@andipark.app")} />
      <Row icon={Phone} label="Phone" hint="+971 800 727 568" onClick={() => (window.location.href = "tel:+9718007275")} />
      <Row icon={MessageSquare} label="Live chat" hint="24/7 · Avg reply 3 min" to="/help/chat" />
    </RowGroup>
  </Screen>
) });
