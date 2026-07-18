import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoState, Button } from "@/components/kit";

export const Route = createFileRoute("/parking-released")({ component: () => (
  <div className="min-h-screen bg-background">
    <InfoState title="Spot released" description="Your shared parking has been marked available for the next driver."
      action={<Link to="/home"><Button variant="emerald">Done</Button></Link>} />
  </div>
) });
