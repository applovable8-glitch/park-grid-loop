import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, MessageSquare, Bug, Lightbulb, FileText, Shield, Info, ScrollText, LifeBuoy } from "lucide-react";
import { Screen, RowGroup, Row } from "@/components/kit";

export const Route = createFileRoute("/help/")({ component: () => (
  <Screen title="Help center" back="/profile">
    <RowGroup title="Get help">
      <Row icon={HelpCircle} label="FAQ" to="/help/faq" />
      <Row icon={LifeBuoy} label="Contact support" to="/help/contact" />
      <Row icon={MessageSquare} label="Live chat" to="/help/chat" />
      <Row icon={FileText} label="Submit a ticket" to="/help/ticket" />
    </RowGroup>
    <RowGroup title="Feedback">
      <Row icon={Bug} label="Report a bug" to="/help/bug" />
      <Row icon={Lightbulb} label="Request a feature" to="/help/feature" />
    </RowGroup>
    <RowGroup title="Legal & about">
      <Row icon={Shield} label="Privacy policy" to="/help/privacy" />
      <Row icon={ScrollText} label="Terms & conditions" to="/help/terms" />
      <Row icon={Info} label="About AndiPark" to="/help/about" />
      <Row icon={FileText} label="Open-source licenses" to="/help/licenses" />
    </RowGroup>
  </Screen>
) });
