import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/kit";
import { Check } from "lucide-react";

export const Route = createFileRoute("/settings/units")({ component: Units });

function Units() {
  const [distance, setDistance] = useState("metric");
  const [currency, setCurrency] = useState("AED");

  const seg = <T extends string,>(value: T, set: (v: T) => void, options: [T, string][]) => (
    <div className="mt-2 flex rounded-2xl bg-muted p-1">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => set(v)} className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold ${value === v ? "bg-background shadow-[var(--shadow-card)]" : "text-muted-foreground"}`}>
          {value === v && <Check className="h-3 w-3" />} {l}
        </button>
      ))}
    </div>
  );

  return (
    <Screen title="Units" back="/settings">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Distance</p>
      {seg(distance, setDistance, [["metric", "Metric (km)"], ["imperial", "Imperial (mi)"]])}
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Currency</p>
      {seg(currency, setCurrency, [["AED", "AED"], ["USD", "USD"], ["EUR", "EUR"], ["SAR", "SAR"]] as [string, string][])}
    </Screen>
  );
}
