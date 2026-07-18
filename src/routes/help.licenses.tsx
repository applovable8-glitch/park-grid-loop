import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";

export const Route = createFileRoute("/help/licenses")({ component: () => (
  <Screen title="Licenses" back="/help">
    <p className="text-xs text-muted-foreground">Open-source packages that power ParkOut.</p>
    <div className="mt-3 space-y-2">
      {[
        { n: "React", v: "19", l: "MIT" },
        { n: "TanStack Router / Start", v: "1", l: "MIT" },
        { n: "TanStack Query", v: "5", l: "MIT" },
        { n: "Tailwind CSS", v: "4", l: "MIT" },
        { n: "lucide-react", v: "latest", l: "ISC" },
        { n: "sonner", v: "latest", l: "MIT" },
      ].map((p) => (
        <Card key={p.n}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{p.n}</p>
              <p className="text-xs text-muted-foreground">v{p.v}</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{p.l}</span>
          </div>
        </Card>
      ))}
    </div>
  </Screen>
) });
