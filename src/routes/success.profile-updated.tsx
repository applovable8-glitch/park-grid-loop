import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/success/profile-updated")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="Profile updated" description="Your changes have been saved."
      action={<Link to="/profile"><Button variant="emerald">Back to profile</Button></Link>} />
  </div>
) });
