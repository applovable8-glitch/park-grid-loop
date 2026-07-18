import { createFileRoute } from "@tanstack/react-router";
import { Star, Shield, TrendingUp } from "lucide-react";
import { Screen, Card, Badge } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/profile/reputation")({ component: Rep });

function Rep() {
  const { user } = useApp();
  const rep = user?.reputation ?? 5.0;
  return (
    <Screen title="Reputation" back="/profile">
      <Card className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald/15 text-[color:var(--emerald)]"><Shield className="h-8 w-8" /></div>
        <p className="mt-3 font-[var(--font-display)] text-5xl font-bold">{rep.toFixed(1)}</p>
        <div className="mt-2 flex items-center justify-center gap-1">
          {[1,2,3,4,5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= Math.round(rep) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Top 8% in Dubai</p>
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-semibold">How reputation grows</p>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[color:var(--emerald)]" /> Successful handoffs</li>
          <li className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Positive driver ratings</li>
          <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" /> No cancellations or reports</li>
        </ul>
        <div className="mt-3 flex gap-2">
          <Badge tone="emerald">128 handoffs</Badge>
          <Badge tone="blue">0 disputes</Badge>
        </div>
      </Card>
    </Screen>
  );
}
