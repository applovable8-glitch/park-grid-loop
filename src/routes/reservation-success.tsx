import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/reservation-success")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="Reserved!" description="Head there before the timer runs out."
      action={<Link to="/home"><Button variant="emerald">Open map</Button></Link>} />
  </div>
) });
