import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, Card, EmptyState } from "@/components/kit";
import { UserX } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/reports/blocked")({ component: Blocked });

function Blocked() {
  const [list, setList] = useState(["Anonymous · Driver 8A2X", "Anonymous · Driver 3F91"]);
  if (list.length === 0) return <div className="min-h-screen bg-background"><EmptyState icon={UserX} title="No blocked users" description="Nobody has been blocked from your account." /></div>;
  return (
    <Screen title="Blocked users" back="/settings/privacy">
      <div className="space-y-2">
        {list.map((n, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><UserX className="h-4 w-4" /></div>
              <p className="flex-1 text-sm font-semibold">{n}</p>
              <button onClick={() => { setList((l) => l.filter((x) => x !== n)); toast.success("Unblocked"); }} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">Unblock</button>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
