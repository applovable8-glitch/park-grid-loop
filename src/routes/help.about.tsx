import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/help/about")({ component: () => (
  <Screen title="About AndiPark" back="/help">
    <Card className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground"><MapPin className="h-8 w-8" fill="var(--emerald)" /></div>
      <h2 className="mt-3 font-[var(--font-display)] text-xl font-bold">AndiPark</h2>
      <p className="text-xs text-muted-foreground">Version 1.0.0 · Build 2026.07.18</p>
      <p className="mt-3 text-sm">Community parking, in real time. Made with care for cities that never sleep.</p>
    </Card>
  </Screen>
) });
