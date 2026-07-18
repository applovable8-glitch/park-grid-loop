import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { TrendingUp, Clock, Star, Share2 } from "lucide-react";

export const Route = createFileRoute("/profile/stats")({ component: Stats });

function Stats() {
  const { user } = useApp();
  const stats = [
    { icon: Share2, label: "Total shares", value: user?.shared ?? 0, color: "text-[color:var(--emerald)]" },
    { icon: Clock, label: "Reservations", value: user?.reservations ?? 0, color: "text-blue-500" },
    { icon: Star, label: "Reputation", value: (user?.reputation ?? 5).toFixed(1), color: "text-yellow-500" },
    { icon: TrendingUp, label: "Points earned", value: user?.points ?? 0, color: "text-primary" },
  ];
  return (
    <Screen title="Statistics" back="/profile">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <p className="mt-3 font-[var(--font-display)] text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <p className="text-sm font-semibold">This week</p>
        <div className="mt-3 flex items-end justify-between gap-1 h-24">
          {[30, 55, 45, 80, 60, 90, 40].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md bg-emerald/40" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          {["M","T","W","T","F","S","S"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
      </Card>
    </Screen>
  );
}
