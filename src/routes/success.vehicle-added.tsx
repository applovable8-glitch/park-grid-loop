import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/success/vehicle-added")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="Vehicle added" description="Your plate is now linked to this account."
      action={<Link to="/profile/vehicles"><Button variant="emerald">See vehicles</Button></Link>} />
  </div>
) });
