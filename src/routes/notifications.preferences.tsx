import { createFileRoute } from "@tanstack/react-router";
import { Screen, Row, RowGroup } from "@/components/kit";
import { Bell, MapPin, CalendarClock, Megaphone, Info } from "lucide-react";

export const Route = createFileRoute("/notifications/preferences")({ component: () => (
  <Screen title="Notification preferences" back="/notifications">
    <RowGroup title="Types">
      <Row icon={MapPin} label="Parking alerts" hint="Live spots near you" to="/settings/notifications" />
      <Row icon={CalendarClock} label="Reservation alerts" hint="Handoffs & 90s timer" to="/settings/notifications" />
      <Row icon={Megaphone} label="Promotions" hint="Deals and packs" to="/settings/notifications" />
      <Row icon={Info} label="System notifications" hint="App updates" to="/settings/notifications" />
    </RowGroup>
    <RowGroup title="Delivery">
      <Row icon={Bell} label="All settings" to="/settings/notifications" />
    </RowGroup>
  </Screen>
) });
