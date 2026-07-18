import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card, EmptyState } from "@/components/kit";
import { CalendarClock } from "lucide-react";

export const Route = createFileRoute("/profile/reservations")({ component: Reservations });

const items = [
  { addr: "DIFC · Gate 3", when: "Today 14:20", status: "completed" },
  { addr: "City Walk · Block A", when: "Aug 12", status: "expired" },
];

function Reservations() {
  if (items.length === 0) return <div className="min-h-screen bg-background"><EmptyState icon={CalendarClock} title="No reservations yet" description="Reserve a spot from the map to see it here." /></div>;
  return (
    <Screen title="Reservations" back="/profile">
      <div className="space-y-2">
        {items.map((r, i) => (
          <Card key={i}>
            <p className="text-sm font-semibold">{r.addr}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.when} · {r.status}</p>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
