import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/community/guidelines")({ component: () => (
  <Screen title="Community guidelines" back="/community">
    <p className="text-sm">AndiPark works because drivers help each other. Here's what we expect from everyone.</p>
    <Card className="mt-4">
      <p className="text-sm font-semibold text-[color:var(--emerald)]">Do</p>
      <ul className="mt-2 space-y-2 text-sm">
        {["Share your spot only when you're actually leaving", "Respect the 90s reservation window", "Rate honestly after every handoff", "Report suspicious activity"].map((x) => (
          <li key={x} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[color:var(--emerald)]" /> <span>{x}</span></li>
        ))}
      </ul>
    </Card>
    <Card className="mt-3">
      <p className="text-sm font-semibold text-[color:var(--danger)]">Don't</p>
      <ul className="mt-2 space-y-2 text-sm">
        {["Share fake parking to farm points", "Reserve without intending to arrive", "Harass other drivers", "Reveal license plates publicly"].map((x) => (
          <li key={x} className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 text-[color:var(--danger)]" /> <span>{x}</span></li>
        ))}
      </ul>
    </Card>
  </Screen>
) });
