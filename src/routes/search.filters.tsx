import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, Toggle, Button, Field } from "@/components/kit";

export const Route = createFileRoute("/search/filters")({ component: Filters });

function Filters() {
  const nav = useNavigate();
  const [radius, setRadius] = useState(800);
  const [avail, setAvail] = useState(true);
  const [leaving, setLeaving] = useState(true);
  const [reserved, setReserved] = useState(false);
  const [maxPts, setMaxPts] = useState(20);
  const [sort, setSort] = useState("distance");

  return (
    <Screen title="Filters" back="/search">
      <Field label={`Search radius · ${radius}m`}>
        <input type="range" min={200} max={3000} step={100} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-[var(--emerald)]" />
      </Field>

      <div className="mt-4 rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label="Available now" hint="Free right now" checked={avail} onChange={setAvail} />
        <Toggle label="Leaving soon" hint="In next 5 minutes" checked={leaving} onChange={setLeaving} />
        <Toggle label="Show reserved" hint="Include spots locked by others" checked={reserved} onChange={setReserved} />
      </div>

      <Field label={`Max cost · ${maxPts} points`}>
        <input type="range" min={0} max={50} step={5} value={maxPts} onChange={(e) => setMaxPts(+e.target.value)} className="w-full accent-[var(--emerald)]" />
      </Field>

      <Field label="Sort by">
        <div className="grid grid-cols-3 gap-2">
          {[["distance", "Nearest"], ["time", "Time left"], ["cost", "Cheapest"]].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setSort(v)} className={`rounded-2xl py-2.5 text-xs font-semibold ${sort === v ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{l}</button>
          ))}
        </div>
      </Field>

      <div className="mt-6"><Button onClick={() => nav({ to: "/search" })}>Apply filters</Button></div>
    </Screen>
  );
}
