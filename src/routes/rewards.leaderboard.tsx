import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Crown } from "lucide-react";
import { Screen, Card } from "@/components/kit";

export const Route = createFileRoute("/rewards/leaderboard")({ component: Leaderboard });

const rows = [
  { rank: 1, name: "Layla H.", pts: 4820, badge: "Legend" },
  { rank: 2, name: "Omar M.", pts: 3980, badge: "Elite" },
  { rank: 3, name: "Priya S.", pts: 3410, badge: "Elite" },
  { rank: 4, name: "You", pts: 1240, badge: "Rising", me: true },
  { rank: 5, name: "Jane D.", pts: 990, badge: "Rising" },
  { rank: 6, name: "Tarek Z.", pts: 810, badge: "Starter" },
];

function Leaderboard() {
  return (
    <Screen title="Leaderboard" back="/rewards">
      <p className="text-xs text-muted-foreground">This week · Dubai</p>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <Card key={r.rank} className={r.me ? "ring-2 ring-[var(--emerald)]" : ""}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl font-[var(--font-display)] font-bold ${r.rank <= 3 ? "bg-emerald/15 text-[color:var(--emerald)]" : "bg-muted"}`}>
                {r.rank <= 3 ? <Crown className="h-4 w-4" /> : r.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.badge}</p>
              </div>
              <div className="text-right">
                <p className="font-[var(--font-display)] font-bold flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-yellow-500" /> {r.pts}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
