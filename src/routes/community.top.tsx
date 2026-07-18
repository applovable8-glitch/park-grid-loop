import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";
import { Crown, Trophy } from "lucide-react";

export const Route = createFileRoute("/community/top")({ component: () => (
  <Screen title="Top contributors" back="/community">
    <p className="text-xs text-muted-foreground">All-time top sharers in Dubai.</p>
    <div className="mt-3 space-y-2">
      {[
        { n: "Layla H.", shares: 812 },
        { n: "Omar M.", shares: 640 },
        { n: "Priya S.", shares: 588 },
        { n: "Tarek Z.", shares: 401 },
      ].map((r, i) => (
        <Card key={r.n}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Crown className="h-4 w-4" /></div>
            <div className="flex-1"><p className="text-sm font-semibold">{r.n}</p><p className="text-xs text-muted-foreground">Rank #{i + 1}</p></div>
            <p className="flex items-center gap-1 font-[var(--font-display)] font-bold"><Trophy className="h-3.5 w-3.5 text-yellow-500" /> {r.shares}</p>
          </div>
        </Card>
      ))}
    </div>
  </Screen>
) });
