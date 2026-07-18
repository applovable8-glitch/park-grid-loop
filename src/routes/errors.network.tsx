import { createFileRoute, Link } from "@tanstack/react-router";
import { OfflineState, Button } from "@/components/kit";

export const Route = createFileRoute("/errors/network")({ component: () => (
  <div className="min-h-screen bg-background">
    <OfflineState action={<Link to="/home"><Button variant="emerald">Retry</Button></Link>} />
  </div>
) });
