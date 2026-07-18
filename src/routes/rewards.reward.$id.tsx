import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { Screen, Card, Button, Badge } from "@/components/kit";

export const Route = createFileRoute("/rewards/reward/$id")({ component: Detail });

function Detail() {
  const { id } = useParams({ from: "/rewards/reward/$id" });
  const nav = useNavigate();
  return (
    <Screen title="Reward" back="/rewards/redeem">
      <Card>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald/15 text-[color:var(--emerald)]"><Gift className="h-8 w-8" /></div>
        <h2 className="mt-3 font-[var(--font-display)] text-xl font-bold">Reward · {id}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Redeem your points for a real-world reward. You'll receive a code by email.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="emerald">200 points</Badge>
          <Badge tone="muted">Expires in 30 days</Badge>
        </div>
      </Card>
      <div className="mt-4"><Button variant="emerald" onClick={() => { toast.success("Reward redeemed!"); nav({ to: "/rewards" }); }}>Redeem now</Button></div>
    </Screen>
  );
}
