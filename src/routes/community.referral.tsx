import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, Card, Button } from "@/components/kit";
import { Gift } from "lucide-react";

export const Route = createFileRoute("/community/referral")({ component: () => (
  <Screen title="Referral program" back="/community">
    <Card>
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald/15 text-[color:var(--emerald)]"><Gift className="h-7 w-7" /></div>
      <h2 className="mt-3 font-[var(--font-display)] text-lg font-bold">Refer 5 friends · Unlock ParkOut Plus</h2>
      <p className="mt-1 text-sm text-muted-foreground">You've referred 2 out of 5 friends.</p>
      <div className="mt-3 h-2 w-full rounded-full bg-muted">
        <div className="h-full rounded-full bg-[var(--emerald)]" style={{ width: "40%" }} />
      </div>
    </Card>
    <Link to="/rewards/invite"><Button className="mt-4" variant="emerald">Invite more friends</Button></Link>
  </Screen>
) });
