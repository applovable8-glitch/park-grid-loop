import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card, Badge, Button } from "@/components/kit";
import { toast } from "sonner";

export const Route = createFileRoute("/payments/subscriptions")({ component: () => (
  <Screen title="Subscriptions" back="/payments">
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-[var(--font-display)] text-lg font-bold">ParkOut Plus</p>
          <p className="text-xs text-muted-foreground">Unlimited reservations · Priority alerts</p>
        </div>
        <Badge tone="emerald">Active</Badge>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Renews Sep 15 · AED 29 / month</p>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={() => toast.info("Manage on next screen")}>Manage plan</Button>
        <Button variant="danger" onClick={() => toast.success("Subscription cancelled")}>Cancel</Button>
      </div>
    </Card>
  </Screen>
) });
