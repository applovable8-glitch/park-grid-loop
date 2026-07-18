import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card, Badge } from "@/components/kit";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/profile/history")({ component: History });

const history = [
  { addr: "Sheikh Zayed Rd", when: "Today 14:20", type: "used", pts: -10 },
  { addr: "Al Wasl Rd, Jumeirah 1", when: "Today 09:12", type: "shared", pts: +25 },
  { addr: "Marina Walk, Tower 3", when: "Yesterday", type: "shared", pts: +20 },
  { addr: "City Walk, Block A", when: "Aug 10", type: "used", pts: -8 },
];

function History() {
  return (
    <Screen title="Parking history" back="/profile">
      <div className="space-y-2">
        {history.map((h, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{h.addr}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {h.when}</p>
                <div className="mt-2"><Badge tone={h.type === "shared" ? "emerald" : "blue"}>{h.type}</Badge></div>
              </div>
              <p className={`font-[var(--font-display)] text-lg font-bold ${h.pts > 0 ? "text-[color:var(--emerald)]" : ""}`}>{h.pts > 0 ? `+${h.pts}` : h.pts}</p>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
