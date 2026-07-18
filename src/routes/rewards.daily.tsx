import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Gift, Zap } from "lucide-react";
import { Screen, Card, Button } from "@/components/kit";

export const Route = createFileRoute("/rewards/daily")({ component: Daily });

const days = [1, 2, 3, 4, 5, 6, 7];

function Daily() {
  const streak = 4;
  return (
    <Screen title="Daily rewards" back="/rewards">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Zap className="h-6 w-6" /></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Streak</p>
            <p className="font-[var(--font-display)] text-2xl font-bold">{streak} days</p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div key={d} className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-bold ${d <= streak ? "bg-[var(--emerald)] text-white" : "bg-muted text-muted-foreground"}`}>
            <Gift className="h-3.5 w-3.5" />
            <span className="mt-1">+{d * 5}</span>
          </div>
        ))}
      </div>

      <Button className="mt-6" variant="emerald" onClick={() => toast.success(`+${(streak + 1) * 5} points!`)}>Claim today's reward</Button>
    </Screen>
  );
}
