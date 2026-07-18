import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, Card, Countdown, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/reservation/$id")({ component: Reservation });

function Reservation() {
  const { id } = useParams({ from: "/reservation/$id" });
  const { spots, reserve } = useApp();
  const nav = useNavigate();
  const spot = spots.find((s) => s.id === id) ?? spots[0];
  const [reserved, setReserved] = useState(false);

  useEffect(() => { if (!reserved && spot) { reserve(spot.id); setReserved(true); } }, [spot, reserve, reserved]);

  if (!spot) return null;
  return (
    <Screen title="Reservation" back={`/parking/${spot.id}`}>
      <Card className="text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Locked for you</p>
        <div className="my-5"><Countdown seconds={90} onEnd={() => { toast.error("Reservation expired"); nav({ to: "/reservation-cancelled" }); }} label="Time remaining" /></div>
        <p className="font-[var(--font-display)] text-lg font-bold">{spot.address}</p>
        <p className="mt-1 text-xs text-muted-foreground">{spot.distance}m · ETA {spot.eta} min</p>
      </Card>
      <div className="mt-4 space-y-2">
        <Button variant="emerald" onClick={() => nav({ to: "/navigate/$id", params: { id: spot.id } })}>Start navigation</Button>
        <Button variant="danger" onClick={() => nav({ to: "/reservation-cancelled" })}>Cancel reservation</Button>
      </div>
    </Screen>
  );
}
