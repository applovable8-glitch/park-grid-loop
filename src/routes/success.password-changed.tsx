import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/success/password-changed")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="Password changed" description="Use your new password next time you sign in."
      action={<Link to="/home"><Button variant="emerald">Continue</Button></Link>} />
  </div>
) });
