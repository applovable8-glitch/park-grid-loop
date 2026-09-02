import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Car, Check, Star, X, Clock, Sparkles } from "lucide-react";
import { Screen, Card, Button, Badge } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  clockOf,
  completeHandoff,
  rateUser,
  takeoverSpot,
  useSpot,
  type LiveRequest,
} from "@/lib/parking-live";

export const Route = createFileRoute("/handoff/$id")({ component: Handoff });

const SHARE_PRESETS = [0, 15, 30, 60];

function Handoff() {
  const { id } = useParams({ from: "/handoff/$id" });
  const nav = useNavigate();
  const { t } = useI18n();
  const [req, setReq] = useState<LiveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"ask" | "rate" | "share">("ask");
  const [taken, setTaken] = useState(false);
  const [stars, setStars] = useState(5);
  const [note, setNote] = useState("");
  const { spot } = useSpot(req?.spot_id);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id,spot_id,user_id,owner_id,request_status,proposed_leave_at,expires_at,created_at")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      const r = (data as LiveRequest) ?? null;
      setReq(r);
      if (r && r.request_status === "completed") { setTaken(true); setStep("rate"); }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <Screen title={t("handoff")}><Card><p className="text-sm text-muted-foreground">{t("loading")}</p></Card></Screen>;
  if (!req) return <Screen title={t("handoff")}><Card><p className="text-sm text-muted-foreground">Request not found.</p></Card></Screen>;

  const answer = async (didTake: boolean) => {
    setBusy(true);
    const { error } = await completeHandoff(req.id, didTake);
    setBusy(false);
    if (error) { toast.error(error); return; }
    setTaken(didTake);
    if (didTake) toast.success(`${t("handoff_done")} · ${t("points_charged")}`);
    else toast.message(t("spot_released"));
    setStep("rate");
  };

  const submitRating = async () => {
    setBusy(true);
    const { error } = await rateUser(req.id, stars, note);
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success(t("submit_rating"));
    if (taken) setStep("share"); else nav({ to: "/home" });
  };

  const skipRating = () => { if (taken) setStep("share"); else nav({ to: "/home" }); };

  const share = async (minutes: number) => {
    setBusy(true);
    const { error } = await takeoverSpot(req.id, new Date(Date.now() + minutes * 60000));
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success(t("share_and_earn"));
    nav({ to: "/home" });
  };

  return (
    <Screen title={t("handoff")} back="/home">
      {step === "ask" && (
        <div className="animate-fade-in">
          <Card className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10">
              <Car className="h-6 w-6 text-[color:var(--emerald)]" />
            </div>
            <p className="mt-4 font-[var(--font-display)] text-xl font-bold">{t("did_you_take")}</p>
            {spot && <p className="mt-1 text-sm text-muted-foreground">{spot.address ?? "Shared parking spot"}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              <Clock className="me-1 inline h-3 w-3" />
              {clockOf(spot?.planned_leave_at ?? spot?.leave_at ?? null)}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{t("did_you_take_hint")}</p>
            {spot && <Badge tone="emerald">−{spot.cost} {t("pts")}</Badge>}
          </Card>
          <div className="mt-4 space-y-2">
            <Button variant="emerald" disabled={busy} onClick={() => answer(true)}>
              <Check className="h-4 w-4" /> {t("yes_took_it")}
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => answer(false)}>
              <X className="h-4 w-4" /> {t("no_didnt")}
            </Button>
          </div>
        </div>
      )}

      {step === "rate" && (
        <div className="animate-fade-in">
          <Card className="text-center">
            <p className="font-[var(--font-display)] text-xl font-bold">{t("rate_owner")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("rate_hint")}</p>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`${n} stars`}
                  onClick={() => setStars(n)}
                  className="transition-transform active:scale-90"
                >
                  <Star className={`h-8 w-8 ${n <= stars ? "fill-[color:var(--emerald)] text-[color:var(--emerald)]" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("add_note")}
              rows={3}
              className="mt-5 w-full rounded-2xl bg-muted p-3 text-start text-sm outline-none"
            />
          </Card>
          <div className="mt-4 space-y-2">
            <Button variant="emerald" disabled={busy} onClick={submitRating}>{t("submit_rating")}</Button>
            <Button variant="ghost" disabled={busy} onClick={skipRating}>{t("skip")}</Button>
          </div>
        </div>
      )}

      {step === "share" && (
        <div className="animate-fade-in">
          <Card className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10">
              <Sparkles className="h-6 w-6 text-[color:var(--emerald)]" />
            </div>
            <p className="mt-4 font-[var(--font-display)] text-xl font-bold">{t("share_your_exit")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("share_your_exit_hint")}</p>
            {spot && <p className="mt-3 text-sm font-semibold">{spot.address ?? "Shared parking spot"}</p>}
          </Card>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {SHARE_PRESETS.map((m) => (
              <button
                key={m}
                disabled={busy}
                onClick={() => share(m)}
                className="rounded-2xl bg-card p-4 text-start ring-1 ring-border transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <p className="text-sm font-bold">{m === 0 ? t("available_now") : `${t("leaving_in")} ${m}m`}</p>
                <p className="mt-1 text-xs text-[color:var(--emerald)]">+10 {t("pts")}</p>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="ghost" disabled={busy} onClick={() => nav({ to: "/home" })}>{t("not_now")}</Button>
          </div>
        </div>
      )}
    </Screen>
  );
}
