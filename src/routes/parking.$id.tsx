import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { MapPin, Clock, Navigation2, Car, Shield, Star } from "lucide-react";
import { Screen, Card, Badge, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/parking/$id")({ component: ParkingDetails });

function ParkingDetails() {
  const { id } = useParams({ from: "/parking/$id" });
  const { spots } = useApp();
  const spot = spots.find((s) => s.id === id) ?? spots[0];
  if (!spot) return null;

  return (
    <Screen title="Parking spot">
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Car className="h-6 w-6" /></div>
          <div className="flex-1">
            <Badge tone={spot.status === "available" ? "emerald" : spot.status === "leaving" ? "orange" : "red"}>
              {spot.status === "available" ? "Available now" : spot.status === "leaving" ? `Leaving in ${Math.ceil(spot.leavingIn / 60)}m` : "Reserved"}
            </Badge>
            <h2 className="mt-2 font-[var(--font-display)] text-lg font-bold leading-tight">{spot.address}</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-3 text-center">
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p><p className="font-[var(--font-display)] font-bold">{spot.distance}m</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">ETA</p><p className="font-[var(--font-display)] font-bold">{spot.eta}m</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</p><p className="font-[var(--font-display)] font-bold">{spot.cost} pts</p></div>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">S</div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Shared by community</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.9 · 128 handoffs</p>
          </div>
          <Shield className="h-5 w-5 text-[color:var(--emerald)]" />
        </div>
      </Card>

      <div className="mt-4 space-y-2">
        <Link to="/reservation/$id" params={{ id: spot.id }}><Button variant="emerald"><MapPin className="h-4 w-4" /> Reserve · 90s lock</Button></Link>
        <Link to="/navigate/$id" params={{ id: spot.id }}><Button variant="secondary"><Navigation2 className="h-4 w-4" /> Navigate only</Button></Link>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Reservation valid for 90 seconds</p>
    </Screen>
  );
}
