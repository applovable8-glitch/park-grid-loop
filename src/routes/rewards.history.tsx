import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { Screen, Card, Badge } from "@/components/kit";

export const Route = createFileRoute("/rewards/history")({ component: History });

const items = [
  { title: "Handoff bonus · Al Wasl Rd", pts: +25, time: "Today 14:22", type: "earn" },
  { title: "Reserved · City Walk", pts: -10, time: "Today 12:04", type: "spend" },
  { title: "Daily streak reward", pts: +5, time: "Yesterday", type: "earn" },
  { title: "Purchased pack · 500 pts", pts: +500, time: "Aug 12", type: "purchase" },
  { title: "Redeemed · Free coffee", pts: -200, time: "Aug 09", type: "redeem" },
];

function History() {
  return (
    <Screen title="Points history" back="/rewards">
      <div className="space-y-2">
        {items.map((a, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><Gift className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className={`font-[var(--font-display)] text-sm font-bold ${a.pts > 0 ? "text-[color:var(--emerald)]" : "text-foreground"}`}>{a.pts > 0 ? `+${a.pts}` : a.pts}</p>
                <Badge tone={a.type === "earn" || a.type === "purchase" ? "emerald" : "muted"}>{a.type}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
