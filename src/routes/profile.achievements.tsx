import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/kit";
import { Award } from "lucide-react";

export const Route = createFileRoute("/profile/achievements")({ component: () => (
  <Screen title="Achievements" back="/profile">
    <Link to="/profile/badges" className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Award className="h-6 w-6" /></div>
      <div>
        <p className="text-sm font-semibold">See all badges</p>
        <p className="text-xs text-muted-foreground">Track every milestone you've unlocked</p>
      </div>
    </Link>
  </Screen>
) });
