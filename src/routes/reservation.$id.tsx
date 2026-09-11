import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Hourglass, MapPin, Navigation2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/kit";
import { useI18n } from "@/lib/i18n";
import {
  answerExtension,
  cancelRequest,
  clockOf,
  minutesUntil,
  useSpot,
  type LiveRequest,
} from "@/lib/parking-live";

export const Route = createFileRoute("/reservation/$id")({ component: Reservation });

const STR = {
  en: {
    title: "Reservation",
    requested: "Spot requested",
    waiting: "Waiting for the driver",
    waitingSub: "The driver was notified. They can approve, or ask to stay longer.",
    minFromNow: "min from now",
    exitAt: "Driver leaves at",
    moreTime: "Driver needs more time",
    moreTimeSub: "Do you still want this spot at the new exit time?",
    yesWait: "Yes, I'll wait",
    noOther: "No, find another spot",
    youreIn: "You're in.",
    reservedForYou: "The spot is reserved for you.",
    beThere: "Be there around this time",
    navigate: "Navigate to spot",
    tookSpot: "Did you take the parking spot?",
    cancelRequest: "Cancel request",
    cancelQ: "Cancel this request?",
    keepRequest: "Keep request",
    expired: "Request expired",
    closed: "This spot is no longer available.",
    findAnother: "Find another spot",
    notFound: "Request not found.",
    oneAtTime: "You can hold only one parking spot at a time.",
    declined: "Request declined",
    cancelled: "Request cancelled",
    completed: "Completed",
  },
  ar: {
    title: "الحجز",
    requested: "تم إرسال الطلب",
    waiting: "بانتظار السائق",
    waitingSub: "تم إشعار السائق. يمكنه الموافقة أو طلب وقت أطول.",
    minFromNow: "دقيقة من الآن",
    exitAt: "السائق يغادر الساعة",
    moreTime: "السائق يحتاج وقتًا أطول",
    moreTimeSub: "هل ما زلت تريد الموقف في وقت الخروج الجديد؟",
    yesWait: "نعم، سأنتظر",
    noOther: "لا، ابحث عن موقف آخر",
    youreIn: "تم حجز الموقف لك",
    reservedForYou: "الموقف محجوز لك الآن.",
    beThere: "كن هناك قرب هذا الوقت",
    navigate: "انتقل إلى الموقف",
    tookSpot: "هل أخذت الموقف؟",
    cancelRequest: "إلغاء الطلب",
    cancelQ: "أتلغي هذا الطلب؟",
    keepRequest: "الاحتفاظ بالطلب",
    expired: "انتهت صلاحية الطلب",
    closed: "هذا الموقف لم يعد متاحًا.",
    findAnother: "ابحث عن موقف آخر",
    notFound: "الطلب غير موجود.",
    oneAtTime: "يمكنك حجز موقف واحد فقط في كل مرة.",
    declined: "تم رفض الطلب",
    cancelled: "تم إلغاء الطلب",
    completed: "مكتمل",
  },
} as const;

type Strings = Record<keyof (typeof STR)["en"], string>;

function Reservation() {
  const { id } = useParams({ from: "/reservation/$id" });
  const nav = useNavigate();
  const { lang } = useI18n();
  const S: Strings = STR[lang];
  const [req, setReq] = useState<LiveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [, tick] = useState(0);
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
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => { alive = false; supabase.removeChannel(ch); clearInterval(t); };
  }, [id]);

  const exitIso = spot?.planned_leave_at ?? spot?.leave_at ?? null;
  const state = req?.request_status;

  const cancel = async () => {
    if (!req) return;
    setBusy(true);
    const { error } = await cancelRequest(req.id);
    setBusy(false);
    if (error) { toast.error(error); return; }
    nav({ to: "/reservation-cancelled" });
  };

  const answer = async (accept: boolean) => {
    if (!req) return;
    setBusy(true);
    const { error } = await answerExtension(req.id, accept);
    setBusy(false);
    if (error) { toast.error(error); return; }
    if (accept) toast.success("Reserved with the new exit time");
    else { toast.message("Request withdrawn — pick another spot"); nav({ to: "/home" }); }
  };

  const closedLabel =
    state === "declined" ? S.declined :
    state === "cancelled" ? S.cancelled :
    state === "completed" ? S.completed :
    S.expired;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 pt-5">
        <button onClick={() => nav({ to: "/home" })} className="press flex h-10 w-10 items-center justify-center rounded-2xl bg-muted" aria-label={STR.en.title}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{S.title}</p>
        <div className="h-10 w-10" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-8">
        {loading ? (
          <div className="w-full max-w-sm space-y-4">
            <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            <Skeleton className="mx-auto h-6 w-40" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        ) : !req ? (
          <p className="text-sm text-muted-foreground">{S.notFound}</p>
        ) : (
          <div key={state} className="animate-fade-up flex w-full max-w-sm flex-col items-center text-center">
            {/* Status visual */}
            {state === "pending" && (
              <>
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[var(--warning)]/15" style={{ animationDuration: "1.8s" }} />
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--warning)]/10 ring-1 ring-[var(--warning)]/30">
                    <Hourglass className="h-9 w-9 text-[color:var(--warning)]" />
                  </div>
                </div>
                <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold">{S.requested}</h1>
                <p className="mt-1 text-sm font-semibold text-[color:var(--warning)]">{S.waiting}</p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{S.waitingSub}</p>
                <p className="mt-4 font-[var(--font-display)] text-3xl font-bold tabular-nums">{clockOf(exitIso)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{S.exitAt} · {Math.max(0, minutesUntil(exitIso))} {S.minFromNow}</p>
              </>
            )}

            {state === "extension_proposed" && (
              <>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--info)]/10 ring-1 ring-[var(--info)]/30">
                  <Clock className="h-9 w-9 text-[color:var(--info)]" />
                </div>
                <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold">{S.moreTime}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{S.moreTimeSub}</p>
                <p className="mt-4 font-[var(--font-display)] text-3xl font-bold tabular-nums">{clockOf(req.proposed_leave_at)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{Math.max(0, minutesUntil(req.proposed_leave_at))} {S.minFromNow}</p>
                <div className="mt-6 w-full space-y-2">
                  <button onClick={() => answer(true)} disabled={busy} className="press w-full rounded-2xl py-4 text-sm font-bold text-white shadow-[var(--shadow-glow)] disabled:opacity-60" style={{ background: "var(--gradient-emerald)" }}>
                    {S.yesWait}
                  </button>
                  <button onClick={() => answer(false)} disabled={busy} className="press w-full rounded-2xl bg-muted py-4 text-sm font-bold disabled:opacity-60">
                    {S.noOther}
                  </button>
                </div>
              </>
            )}

            {state === "confirmed" && (
              <>
                <div className="animate-scale-in flex h-24 w-24 items-center justify-center rounded-full text-white shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-emerald)" }}>
                  <Check className="h-10 w-10" strokeWidth={3} />
                </div>
                <h1 className="mt-6 font-[var(--font-display)] text-3xl font-bold">{S.youreIn}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{S.reservedForYou}</p>
                <p className="mt-4 font-[var(--font-display)] text-3xl font-bold tabular-nums">{clockOf(exitIso)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{S.beThere} · {Math.max(0, minutesUntil(exitIso))} {S.minFromNow}</p>
              </>
            )}

            {state && ["declined", "cancelled", "expired"].includes(state) && (
              <>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--danger)]/10 ring-1 ring-[var(--danger)]/30">
                  <X className="h-9 w-9 text-[color:var(--danger)]" />
                </div>
                <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold">{closedLabel}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{S.closed}</p>
              </>
            )}

            {state === "completed" && (
              <>
                <div className="animate-scale-in flex h-24 w-24 items-center justify-center rounded-full text-white shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-emerald)" }}>
                  <Check className="h-10 w-10" strokeWidth={3} />
                </div>
                <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold">{S.completed}</h1>
              </>
            )}

            {/* Spot context */}
            {spot && (
              <div className="mt-6 flex w-full items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-start">
                <MapPin className="h-4 w-4 shrink-0 text-[color:var(--emerald)]" />
                <p className="truncate text-sm font-semibold">{spot.address ?? "Shared parking spot"}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 w-full space-y-2">
              {state === "confirmed" && spot && (
                <>
                  <button
                    onClick={() => nav({ to: "/navigate/$id", params: { id: spot.id } })}
                    className="press flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-[var(--shadow-glow)]"
                    style={{ background: "var(--gradient-emerald)" }}
                  >
                    <Navigation2 className="h-4 w-4" /> {S.navigate}
                  </button>
                  <button
                    onClick={() => nav({ to: "/handoff/$id", params: { id: req.id } })}
                    className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-muted py-4 text-sm font-bold"
                  >
                    <Check className="h-4 w-4" /> {S.tookSpot}
                  </button>
                </>
              )}

              {state && ["pending", "confirmed"].includes(state) && !confirmCancel && (
                <button onClick={() => setConfirmCancel(true)} className="press w-full rounded-2xl py-3 text-sm font-semibold text-muted-foreground">
                  {S.cancelRequest}
                </button>
              )}

              {confirmCancel && ["pending", "confirmed"].includes(state ?? "") && (
                <div className="animate-fade-up rounded-2xl border border-border bg-muted/60 p-4">
                  <p className="text-sm font-bold">{S.cancelQ}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => setConfirmCancel(false)} className="press rounded-2xl bg-card py-3 text-sm font-semibold ring-1 ring-border">
                      {S.keepRequest}
                    </button>
                    <button onClick={cancel} disabled={busy} className="press rounded-2xl bg-[var(--danger)] py-3 text-sm font-bold text-white disabled:opacity-60">
                      {S.cancelRequest}
                    </button>
                  </div>
                </div>
              )}

              {state && ["declined", "cancelled", "expired", "completed"].includes(state) && (
                <button onClick={() => nav({ to: "/home" })} className="press w-full rounded-2xl py-4 text-sm font-bold text-white" style={{ background: "var(--gradient-emerald)" }}>
                  {S.findAnother}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">{S.oneAtTime}</p>
          </div>
        )}
      </div>
    </div>
  );
}
