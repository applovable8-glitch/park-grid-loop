import { createFileRoute } from "@tanstack/react-router";
import { Screen, Badge, Card, EmptyState } from "@/components/kit";
import { MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/leaving/history")({ component: LeavingHistory });

const items = [
  { id: 1, address: "Al Wasl Rd, Jumeirah 1", when: "Today · 14:20", status: "handed off", pts: "+25" },
  { id: 2, address: "Marina Walk, Tower 3", when: "Yesterday · 09:12", status: "handed off", pts: "+20" },
  { id: 3, address: "City Walk, Block A", when: "Sat · 18:44", status: "expired", pts: "+5" },
  { id: 4, address: "Sheikh Zayed Rd", when: "Fri · 11:03", status: "cancelled", pts: "+0" },
];

function LeavingHistory() {
  if (items.length === 0) return <div className="min-h-screen bg-background"><EmptyState icon={MapPin} title="No shares yet" description="Every time you leave a spot, it will show up here." /></div>;
  return (
    <Screen title="My shares" back="/profile">
      <div className="space-y-2">
        {items.map((it) => (
          <Card key={it.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{it.address}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {it.when}</p>
                <div className="mt-2"><Badge tone={it.status === "handed off" ? "emerald" : it.status === "expired" ? "orange" : "red"}>{it.status}</Badge></div>
              </div>
              <p className={`font-[var(--font-display)] text-lg font-bold ${it.pts.startsWith("+") && it.pts !== "+0" ? "text-[color:var(--emerald)]" : "text-muted-foreground"}`}>{it.pts}</p>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
