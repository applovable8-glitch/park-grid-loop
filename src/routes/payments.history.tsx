import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";

export const Route = createFileRoute("/payments/history")({ component: () => (
  <Screen title="Billing history" back="/payments">
    <div className="space-y-2">
      {[
        { d: "Aug 15", desc: "500-point package", amt: "AED 39.00" },
        { d: "Aug 05", desc: "1200-point package", amt: "AED 79.00" },
        { d: "Jul 22", desc: "100-point package", amt: "AED 9.00" },
      ].map((r, i) => (
        <Card key={i}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{r.desc}</p>
              <p className="text-xs text-muted-foreground">{r.d}</p>
            </div>
            <p className="font-[var(--font-display)] font-bold">{r.amt}</p>
          </div>
        </Card>
      ))}
    </div>
  </Screen>
) });
