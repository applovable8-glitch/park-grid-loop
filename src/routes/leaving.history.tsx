import { createFileRoute } from "@tanstack/react-router";
import { Screen, EmptyState } from "@/components/kit";
import { Share2 } from "lucide-react";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/leaving/history")({ component: History });

function History() {
  const { user } = useApp();
  if (!user || user.shared === 0) return <div className="min-h-screen bg-background"><EmptyState icon={Share2} title="No shared spots yet" description="When you share your first spot, it appears here." /></div>;
  return (
    <Screen title="Shared parking" back="/profile">
      <p className="text-xs text-muted-foreground">Your last {user.shared} shares. Detailed history syncs from the cloud.</p>
    </Screen>
  );
}
