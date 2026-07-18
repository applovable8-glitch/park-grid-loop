import { createFileRoute, useParams } from "@tanstack/react-router";
import { MapPin, Gift, Clock, UserCheck } from "lucide-react";
import { Screen, Card } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/notifications/$id")({ component: Detail });

const iconMap = { spot: MapPin, points: Gift, reserve: UserCheck, expire: Clock } as const;

function Detail() {
  const { id } = useParams({ from: "/notifications/$id" });
  const { notifications } = useApp();
  const n = notifications.find((x) => x.id === id);
  const Icon = n ? iconMap[n.icon] : MapPin;
  return (
    <Screen title="Notification" back="/notifications">
      <Card>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Icon className="h-7 w-7" /></div>
        <h2 className="mt-3 font-[var(--font-display)] text-xl font-bold">{n?.title ?? "Notification"}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{n?.time ?? "just now"}</p>
        <p className="mt-3 text-sm">{n?.body ?? "You'll see full context here when the notification is opened."}</p>
      </Card>
    </Screen>
  );
}
