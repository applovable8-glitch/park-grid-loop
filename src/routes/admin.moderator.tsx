import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";
import { Users } from "lucide-react";

export const Route = createFileRoute("/admin/moderator")({ component: () => (
  <Screen title="Moderator" back="/admin">
    <Card className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Users className="h-7 w-7" /></div>
      <p className="mt-3 font-semibold">Moderator queue</p>
      <p className="mt-1 text-sm text-muted-foreground">Review flagged shares, users, and appeals from here. Coming soon.</p>
    </Card>
  </Screen>
) });
