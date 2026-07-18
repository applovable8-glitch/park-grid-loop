import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { ErrorState, Button } from "@/components/kit";

export const Route = createFileRoute("/errors/gps")({ component: () => (
  <div className="min-h-screen bg-background">
    <ErrorState icon={MapPin} title="GPS is disabled" description="Turn on GPS to see live parking around you."
      action={<Link to="/settings/permissions"><Button variant="emerald">Open settings</Button></Link>} />
  </div>
) });
