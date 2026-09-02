import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Hourglass, Check, X } from "lucide-react";
import { Screen, Card, Button, Badge } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import {
  answerExtension,
  cancelRequest,
  clockOf,
  minutesUntil,
  useSpot,
  type LiveRequest,
} from "@/lib/parking-live";

export const Route = createFileRoute("/reservation/$id")({ component: Reservation });

function Reservation() {
  const { id } = useParams({ from: "/reservation/$id" });
  const nav = useNavigate();
  const [req, setReq] = useState<LiveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { spot } = useSpot(req?.spot_id);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id,spot_id,user_id,owner_id,request_status,proposed_leave_at,expires_at,created_at")
        .eq("id", id)
        .maybeSingle();
      if (alive) { setReq((data as LiveRequest) ?? null); setLoading(false); }
    };
    load();
    const ch = supabase
      .channel(`res:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [id]);

  if (loading) return <Screen title="Reservation"><Card><p className="text-sm text-muted-foreground">Loading…</p></Card></Screen>;
  if (!req) return <Screen title="Reservation"><Card><p className="text-sm text-muted-foreground">Request not found.</p></Card></Screen>;

  const exitIso = spot?.planned_leave_at ?? spot?.leave_at ?? null;
  const state = req.request_status;

  const cancel = async () => {
    setBusy(true);
    const { error } = await cancelRequest(req.id);
    setBusy(false);
    if (error) { toast.error(error); return; }
    nav({ to: "/reservation-cancelled" });
  };

  const answer = async (accept: boolean) => {
    setBusy(true);
    const { error } = await answerExtension(req.id, accept);
    setBusy(false);
    if (error) { toast.error(error); return; }
    if (accept) toast.success("Reserved with the new exit time");
    else { toast.message("Request withdrawn — pick another spot"); nav({ to: "/home" }); }
  };

  return (
    <Screen title="Reservation" back="/home">
      <Card className="text-center">
        {state === "pending" && (
          <>
            <Badge tone="orange"><Hourglass className="h-3 w-3" /> Waiting for the driver</Badge>
            <p className="mt-4 font-[var(--font-display)] text-2xl font-bold">{clockOf(exitIso)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Requested exit time · in {Math.max(0, minutesUntil(exitIso))} min</p>
            <p className="mt-4 text-sm text-muted-foreground">The driver was notified. They can approve, or ask to stay longer.</p>
          </>
        )}

        {state === "extension_proposed" && (
          <>
            <Badge tone="blue"><Clock className="h-3 w-3" /> Driver needs more time</Badge>
            <p className="mt-4 text-sm text-muted-foreground">New proposed exit time</p>
            <p className="mt-1 font-[var(--font-display)] text-3xl font-bold">{clockOf(req.proposed_leave_at)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.max(0, minutesUntil(req.proposed_leave_at))} min from now — do you still want this spot?
            </p>
          </>
        )}

        {state === "confirmed" && (
          <>
            <Badge tone="emerald"><Check className="h-3 w-3" /> Reserved for you</Badge>
            <p className="mt-4 font-[var(--font-display)] text-3xl font-bold">{clockOf(exitIso)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Be there around this time · in {Math.max(0, minutesUntil(exitIso))} min</p>
          </>
        )}

        {["declined", "cancelled", "expired", "completed"].includes(state) && (
          <>
            <Badge tone="red"><X className="h-3 w-3" /> {state}</Badge>
            <p className="mt-4 text-sm text-muted-foreground">This request is closed. You can choose another spot.</p>
          </>
        )}

        {spot && <p className="mt-4 text-sm font-semibold">{spot.address ?? "Shared parking spot"}</p>}
      </Card>

      <div className="mt-4 space-y-2">
        {state === "extension_proposed" && (
          <>
            <Button variant="emerald" disabled={busy} onClick={() => answer(true)}>Yes, I&apos;ll wait</Button>
            <Button variant="danger" disabled={busy} onClick={() => answer(false)}>No, find another spot</Button>
          </>
        )}
        {state === "confirmed" && spot && (
          <Button variant="emerald" onClick={() => nav({ to: "/navigate/$id", params: { id: spot.id } })}>Start navigation</Button>
        )}
        {["pending", "extension_proposed", "confirmed"].includes(state) && state !== "extension_proposed" && (
          <Button variant="danger" disabled={busy} onClick={cancel}>Cancel request</Button>
        )}
        {["declined", "cancelled", "expired", "completed"].includes(state) && (
          <Button onClick={() => nav({ to: "/home" })}>Find another spot</Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">You can hold only one parking spot at a time.</p>
    </Screen>
  );
}
