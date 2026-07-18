import { createFileRoute } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { Screen, Card, EmptyState } from "@/components/kit";

export const Route = createFileRoute("/search/saved")({ component: Saved });

const saved = [
  { name: "Home", area: "Downtown Dubai · 800m radius" },
  { name: "Office", area: "DIFC · 500m radius" },
  { name: "Gym", area: "City Walk · 600m radius" },
];

function Saved() {
  if (saved.length === 0) return <div className="min-h-screen bg-background"><EmptyState icon={Bookmark} title="No saved searches" description="Save a favorite area to check it in one tap." /></div>;
  return (
    <Screen title="Saved searches" back="/search">
      <div className="space-y-2">
        {saved.map((s) => (
          <Card key={s.name}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Bookmark className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.area}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
