import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/success/parking-shared")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="Parking shared" description="Your spot is live. You'll earn points on handoff."
      action={<Link to="/home"><Button variant="emerald">Back to map</Button></Link>} />
  </div>
) });
