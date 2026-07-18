import { createFileRoute, Link } from "@tanstack/react-router";
import { ErrorState, Button } from "@/components/kit";

export const Route = createFileRoute("/errors/unknown")({ component: () => (
  <div className="min-h-screen bg-background">
    <ErrorState title="Something went wrong" description="We couldn't complete your request. Please try again."
      action={<Link to="/home"><Button variant="emerald">Back home</Button></Link>} />
  </div>
) });
