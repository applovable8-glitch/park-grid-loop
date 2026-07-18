import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldOff } from "lucide-react";
import { ErrorState, Button } from "@/components/kit";

export const Route = createFileRoute("/errors/location")({ component: () => (
  <div className="min-h-screen bg-background">
    <ErrorState icon={ShieldOff} title="Location permission denied" description="ParkOut needs your location to find parking near you."
      action={<Link to="/settings/permissions"><Button variant="emerald">Grant permission</Button></Link>} />
  </div>
) });
