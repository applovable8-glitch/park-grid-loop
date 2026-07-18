import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { ErrorState, Button } from "@/components/kit";

export const Route = createFileRoute("/reservation-cancelled")({ component: () => (
  <div className="min-h-screen bg-background">
    <ErrorState icon={XCircle} title="Reservation cancelled" description="The spot has been released back to the community."
      action={<Link to="/home"><Button variant="secondary">Back to map</Button></Link>} />
  </div>
) });
