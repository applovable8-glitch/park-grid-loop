import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/auth/success")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="You're all set" description="Welcome to AndiPark. Let's find you some parking."
      action={<Link to="/home"><Button variant="emerald">Go to map</Button></Link>} />
  </div>
) });
