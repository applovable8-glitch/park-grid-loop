import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navigation2, MapPin, Clock } from "lucide-react";
import { Card, Button } from "@/components/kit";
import { MapCanvas } from "@/components/MapCanvas";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/navigate/$id")({ component: NavigateScreen });

function NavigateScreen() {
  const { id } = useParams({ from: "/navigate/$id" });
  const { spots } = useApp();
  const nav = useNavigate();
  const spot = spots.find((s) => s.id === id) ?? spots[0];
  const [eta, setEta] = useState(spot?.eta ?? 3);
  const [dist, setDist] = useState(spot?.distance ?? 200);
  useEffect(() => {
    const t = setInterval(() => {
      setEta((v) => Math.max(0, v - 1));
      setDist((v) => Math.max(0, v - 50));
    }, 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (eta === 0) nav({ to: "/navigate/completed" }); }, [eta, nav]);
  if (!spot) return null;
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0"><MapCanvas spots={spots} onSpotClick={() => {}} /></div>

      <div className="relative z-10 px-4 pt-4">
        <div className="glass rounded-3xl px-4 py-3 shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald text-emerald-foreground"><Navigation2 className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Heading to</p>
              <p className="truncate text-sm font-semibold">{spot.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-10">
        <Card>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">ETA</p><p className="font-[var(--font-display)] text-xl font-bold">{eta}m</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p><p className="font-[var(--font-display)] text-xl font-bold">{dist}m</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Route</p><p className="font-[var(--font-display)] text-xl font-bold">Best</p></div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link to="/navigate/completed" className="flex-1"><Button variant="emerald"><MapPin className="h-4 w-4" /> Arrived</Button></Link>
            <Link to="/home" className="flex-1"><Button variant="secondary"><Clock className="h-4 w-4" /> Later</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
