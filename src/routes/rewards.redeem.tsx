import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Coffee, Fuel, Ticket } from "lucide-react";
import { Screen, Card } from "@/components/kit";

export const Route = createFileRoute("/rewards/redeem")({ component: Redeem });

const rewards = [
  { id: "coffee", icon: Coffee, title: "Free coffee", pts: 200, partner: "Blends & Brews" },
  { id: "fuel", icon: Fuel, title: "AED 20 fuel voucher", pts: 800, partner: "ADNOC" },
  { id: "ticket", icon: Ticket, title: "Cinema ticket", pts: 1200, partner: "VOX Cinemas" },
  { id: "gift", icon: Gift, title: "Mystery reward", pts: 500, partner: "AndiPark" },
];

function Redeem() {
  return (
    <Screen title="Redeem rewards" back="/rewards">
      <div className="space-y-2">
        {rewards.map((r) => (
          <Link key={r.id} to="/rewards/reward/$id" params={{ id: r.id }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><r.icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.partner}</p>
                </div>
                <p className="font-[var(--font-display)] text-sm font-bold">{r.pts}<span className="text-xs font-normal text-muted-foreground"> pts</span></p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
