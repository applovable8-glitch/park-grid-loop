import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/navigate/completed")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="You've arrived" description="Enjoy your spot. Don't forget to share when you leave — you'll earn points."
      action={<div className="space-y-2">
        <Link to="/leaving"><Button variant="emerald">Share when I leave</Button></Link>
        <Link to="/home"><Button variant="secondary">Back to map</Button></Link>
      </div>} />
  </div>
) });
