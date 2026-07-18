import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Gift, Clock, UserCheck } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/notifications")({ component: Notifs });

const iconMap = {
  spot: { Icon: MapPin, color: "bg-emerald/15 text-[color:var(--emerald)]" },
  points: { Icon: Gift, color: "bg-yellow-100 text-yellow-700" },
  reserve: { Icon: UserCheck, color: "bg-blue-100 text-blue-700" },
  expire: { Icon: Clock, color: "bg-red-100 text-red-700" },
} as const;

function Notifs() {
  const { notifications } = useApp();
  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold">Notifications</h1>
        <p className="text-xs text-muted-foreground">Real-time updates from your parking network</p>
      </header>

      <div className="mt-4 space-y-2 px-4">
        {notifications.map((n) => {
          const { Icon, color } = iconMap[n.icon];
          return (
            <div key={n.id} className="flex items-start gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)] animate-fade-up">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
