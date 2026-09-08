import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Clock, Navigation2, Car, Shield, Star, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Screen, Card, Badge, Button } from "@/components/kit";
import { MessageCircle, Phone } from "lucide-react";
import { carLabel, useDriverProfile } from "@/lib/chat";
import { useApp } from "@/lib/parkout-store";
import { cancelRequest, clockOf, minutesUntil, requestSpot, useMyRequest, useSpot } from "@/lib/parking-live";

export const Route = createFileRoute("/parking/$id")({ component: ParkingDetails });

function ParkingDetails() {
  const { id } = useParams({ from: "/parking/$id" });
  const { user } = useApp();
  const nav = useNavigate();
  const { spot, loading } = useSpot(id);
  const { request } = useMyRequest(user?.id);
  const { profile } = useDriverProfile(spot?.user_id);
  const [busy, setBusy] = useState(false);

  if (loading) return <Screen title="Parking spot"><Card><p className="text-sm text-muted-foreground">Loading…</p></Card></Screen>;
  if (!spot) return <Screen title="Parking spot"><Card><p className="text-sm text-muted-foreground">This spot is no longer available.</p></Card></Screen>;

  const exitIso = spot.planned_leave_at ?? spot.leave_at;
  const mins = minutesUntil(exitIso);
  const isMine = spot.user_id === user?.id;
  const holdsOther = request && request.spot_id !== spot.id;
  const holdsThis = request && request.spot_id === spot.id;

  const ask = async () => {
    setBusy(true);
    const { id: rid, error } = await requestSpot(spot.id);
    setBusy(false);
    if (error || !rid) { toast.error(error ?? "Could not send request"); return; }
    toast.success("Request sent to the driver");
    nav({ to: "/reservation/$id", params: { id: rid } });
  };

  const release = async () => {
    if (!request) return;
    setBusy(true);
    const { error } = await cancelRequest(request.id);
    setBusy(false);
    if (error) toast.error(error); else toast.success("Your previous spot was released");
  };

  return (
    <Screen title="Parking spot">
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Car className="h-6 w-6" /></div>
          <div className="flex-1">
            <Badge tone={spot.status === "available" ? "emerald" : spot.status === "leaving" ? "orange" : "red"}>
              {spot.status === "reserved" ? "Reserved" : mins <= 0 ? "Free now" : `Frees up in ${mins}m`}
            </Badge>
            <h2 className="mt-2 font-[var(--font-display)] text-lg font-bold leading-tight">{spot.address ?? "Shared parking spot"}</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-3 text-center">
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Exit time</p><p className="font-[var(--font-display)] font-bold">{clockOf(exitIso)}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">In</p><p className="font-[var(--font-display)] font-bold">{Math.max(0, mins)}m</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</p><p className="font-[var(--font-display)] font-bold">{spot.cost} pts</p></div>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {(profile?.name?.[0] ?? "D").toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.name || "AndiPark driver"}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {profile ? Number(profile.reputation).toFixed(1) : "5.0"} · {profile?.shared_count ?? 0} spots shared
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {carLabel(profile)}{profile?.plate ? ` · ${profile.plate}` : ""}
            </p>
          </div>
          <Shield className="h-5 w-5 text-[color:var(--emerald)]" />
        </div>
        {!isMine && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={profile?.show_phone && profile?.phone ? `tel:${profile.phone.replace(/\s/g, "")}` : undefined}
              className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold ${
                profile?.show_phone && profile?.phone ? "bg-primary text-primary-foreground" : "pointer-events-none bg-muted text-muted-foreground"
              }`}
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <Link to="/chat/$id" params={{ id: spot.user_id }} search={{ spot: spot.id }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-muted py-3 text-sm font-semibold">
              <MessageCircle className="h-4 w-4" /> Chat
            </Link>
          </div>
        )}
      </Card>

      <div className="mt-4 space-y-2">
        {isMine ? (
          <p className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">This is your own shared spot.</p>
        ) : holdsThis ? (
          <Link to="/reservation/$id" params={{ id: request!.id }}><Button variant="emerald">Open my request</Button></Link>
        ) : holdsOther ? (
          <Card className="border border-orange-500/30">
            <p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-orange-500" /> You already hold another spot</p>
            <p className="mt-1 text-xs text-muted-foreground">You can only hold one parking spot at a time. Release it to request this one.</p>
            <div className="mt-3"><Button variant="danger" onClick={release} disabled={busy}>Release my current spot</Button></div>
          </Card>
        ) : spot.status === "reserved" ? (
          <p className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">Already taken by another driver.</p>
        ) : (
          <Button variant="emerald" onClick={ask} disabled={busy}>
            <MapPin className="h-4 w-4" /> {busy ? "Sending…" : `Request for ${clockOf(exitIso)}`}
          </Button>
        )}
        <Link to="/navigate/$id" params={{ id: spot.id }}><Button variant="secondary"><Navigation2 className="h-4 w-4" /> Navigate only</Button></Link>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <Clock className="h-3 w-3" /> The driver must approve your request or ask for more time.
      </p>
    </Screen>
  );
}
