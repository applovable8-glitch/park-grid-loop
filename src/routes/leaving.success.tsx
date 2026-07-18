import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/leaving/success")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="Spot shared" description="Your parking is live. You'll earn points when a driver takes it."
      action={<div className="space-y-2">
        <Link to="/leaving/history"><Button variant="emerald">See my shares</Button></Link>
        <Link to="/home"><Button variant="secondary">Back to map</Button></Link>
      </div>} />
  </div>
) });
