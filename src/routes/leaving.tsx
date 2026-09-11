import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, X, Clock, Check, TimerReset, Radio } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/parkout-store";
import { useGeolocation } from "@/lib/use-geolocation";
import { useAreaName } from "@/lib/use-area-name";
import { PinPicker } from "@/components/PinPicker";
import { useRequireProfile } from "@/lib/use-require-auth";
import { useI18n } from "@/lib/i18n";
import {
  approveRequest,
  declineRequest,
  cancelRequest,
  clockOf,
  proposeExtension,
  releaseSpot,
  shareSpot,
  useIncomingRequests,
  useMySharedSpot,
  useSpot,
  minutesUntil,
} from "@/lib/parking-live";

export const Route = createFileRoute("/leaving")({ component: Leaving });

const PRESETS = [
  { m: 0, en: "Now", ar: "الآن", reward: "+15 pts" },
  { m: 2, en: "2 min", ar: "دقيقتان", reward: "+16 pts" },
  { m: 5, en: "5 min", ar: "5 دقائق", reward: "+18 pts" },
  { m: 10, en: "10 min", ar: "10 دقائق", reward: "+20 pts" },
];

const STR = {
  en: {
    title: "I'm leaving my spot",
    sub: "Help someone park faster.",
    when: "When are you leaving?",
    exact: "Pick an exact time",
    exactSub: "e.g. I'll leave the mall at 8:30",
    where: "Where are you parked?",
    pinSet: "Pin set — drag the map to adjust",
    pinHintGranted: "Drag the map so the pin sits on your parked car.",
    pinHintNoGps: "Enable location or drag the map to pin your car.",
    share: "Share my spot",
    sharing: "Sharing…",
    live: "Your spot is live",
    liveSub: "Drivers nearby can see it now.",
    leavingIn: "Leaving in",
    min: "min",
    helping: "Helping drivers nearby",
    noRequests: "No requests yet — we'll notify you the moment a driver asks.",
    stop: "Stop sharing",
    reserved: "Reserved for a driver",
    reservedSub: "They are on the way for your exit.",
    cancelHandoff: "Cancel handoff",
    waiting: "Waiting for the driver",
    waitingSub: "You asked for more time — they're deciding whether to wait.",
    wantsSpot: "A driver wants your spot",
    wantsSpotSub: "They plan to take it at your exit time.",
    approve: "Approve",
    moreTime: "Need more time",
    decline: "Decline",
    extendBy: "Extend my stay by:",
    backBtn: "Back",
  },
  ar: {
    title: "سأغادر موقفي",
    sub: "ساعد شخصًا على ركن سيارته أسرع.",
    when: "متى ستغادر؟",
    exact: "حدد وقتًا دقيقًا",
    exactSub: "مثلاً: سأغادر المول الساعة 8:30",
    where: "أين أوقفت سيارتك؟",
    pinSet: "تم تثبيت الموقع — اسحب الخريطة للتعديل",
    pinHintGranted: "اسحب الخريطة حتى يقع المؤشر على سيارتك.",
    pinHintNoGps: "فعّل الموقع أو اسحب الخريطة لتثبيت سيارتك.",
    share: "شارك موقفي",
    sharing: "جارٍ المشاركة…",
    live: "موقفك ظاهر الآن",
    liveSub: "السائقون القريبون يرونه الآن.",
    leavingIn: "المغادرة خلال",
    min: "دقيقة",
    helping: "تساعد السائقين القريبين منك",
    noRequests: "لا طلبات بعد — سنُعلمك فور أن يطلب أحد السائقين موقفك.",
    stop: "إيقاف المشاركة",
    reserved: "محجوز لسائق",
    reservedSub: "السائق في طريقه إليك عند وقت خروجك.",
    cancelHandoff: "إلغاء التسليم",
    waiting: "بانتظار رد السائق",
    waitingSub: "طلبت وقتًا إضافيًا — السائق يقرر إن كان سينتظر.",
    wantsSpot: "سائق يريد موقفك",
    wantsSpotSub: "يخطط لأخذه عند وقت خروجك.",
    approve: "موافقة",
    moreTime: "أحتاج وقتًا أطول",
    decline: "رفض",
    extendBy: "مدّد بقائي بـ:",
    backBtn: "رجوع",
  },
} as const;

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Leaving() {
  const nav = useNavigate();
  useRequireProfile();
  const { user } = useApp();
  const { lang } = useI18n();
  const S = STR[lang];
  const { position, status } = useGeolocation();
  const [minutes, setMinutes] = useState<number | "custom">(0);
  const [custom, setCustom] = useState(() => toLocalInput(new Date(Date.now() + 60 * 60000)));
  const [spotId, setSpotId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [, tick] = useState(0);

  const pinName = useAreaName(pin);

  const { spot } = useSpot(spotId ?? undefined);
  const { spot: mySpot } = useMySharedSpot(user?.id);
  const { requests } = useIncomingRequests(user?.id);
  const mine = requests.filter((r) => !spotId || r.spot_id === spotId);

  useEffect(() => {
    if (!spotId && mySpot) setSpotId(mySpot.id);
  }, [mySpot, spotId]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const leaveAt = useMemo(
    () => (minutes === "custom" ? new Date(custom) : new Date(Date.now() + minutes * 60000)),
    [minutes, custom],
  );

  const confirm = async () => {
    if (mySpot || spotId) {
      toast.error("You already shared a spot. Stop that share before creating a new one.");
      setSpotId(mySpot?.id ?? spotId);
      return;
    }
    const loc = pin ?? (position ? { lat: position.lat, lng: position.lng } : null);
    if (!loc) { toast.error("Pin your parking spot on the map first"); return; }
    if (Number.isNaN(leaveAt.getTime())) { toast.error("Pick a valid exit time"); return; }
    setBusy(true);
    const { id, error } = await shareSpot({
      lat: loc.lat,
      lng: loc.lng,
      leaveAt,
      address: pinName ?? "Pinned parking spot",
      cost: 10,
    });
    setBusy(false);
    if (error || !id) { toast.error(error ?? "Could not share the spot"); return; }
    toast.success(`Your car is live on the map · exit at ${clockOf(leaveAt.toISOString())}`);
    nav({ to: "/home" });
  };

  const cancelShare = async () => {
    if (spotId) await releaseSpot(spotId);
    nav({ to: "/home" });
  };

  const exitIso = spot?.planned_leave_at ?? spot?.leave_at ?? null;
  const mins = Math.max(0, minutesUntil(exitIso));

  return (
    <div className="relative flex min-h-screen w-full flex-col text-white" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute -end-16 top-10 h-72 w-72 rounded-full bg-emerald/25 blur-3xl" />
      <div className="absolute -start-16 bottom-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-4 pt-5">
        <button onClick={() => nav({ to: "/home" })} className="press flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">{S.title}</p>
        <div className="h-10 w-10" />
      </header>

      {!spotId ? (
        <>
          <div className="relative z-10 flex flex-1 flex-col px-6 pb-40 pt-6">
            <div className="animate-fade-up">
              <h1 className="font-[var(--font-display)] text-3xl font-bold leading-tight">{S.title}</h1>
              <p className="mt-1 text-sm text-white/70">{S.sub}</p>
            </div>

            <p className="mt-7 mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">{S.when}</p>
            <div className="grid grid-cols-2 gap-2.5 stagger">
              {PRESETS.map((o) => {
                const active = minutes === o.m;
                return (
                  <button
                    key={o.m}
                    onClick={() => setMinutes(o.m)}
                    className={`press flex flex-col items-start gap-1 rounded-3xl p-4 text-start transition-all duration-200 ${
                      active
                        ? "bg-[var(--emerald)] text-white shadow-[var(--shadow-glow)] ring-2 ring-white/40"
                        : "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md"
                    }`}
                  >
                    <span className="font-[var(--font-display)] text-lg font-bold">{lang === "ar" ? o.ar : o.en}</span>
                    <span className={`text-[11px] tabular-nums ${active ? "text-white/85" : "text-white/60"}`}>
                      {clockOf(new Date(Date.now() + o.m * 60000).toISOString())} · {o.reward}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setMinutes("custom")}
              className={`press mt-2.5 flex w-full items-center gap-3 rounded-3xl p-4 text-start transition-all duration-200 ${
                minutes === "custom" ? "bg-[var(--emerald)] text-white ring-2 ring-white/40" : "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md"
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-[var(--font-display)] text-sm font-bold">{S.exact}</p>
                <p className={`text-[11px] ${minutes === "custom" ? "text-white/85" : "text-white/60"}`}>{S.exactSub}</p>
              </div>
            </button>

            {minutes === "custom" && (
              <input
                type="datetime-local"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="animate-fade-in mt-2.5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none"
              />
            )}

            <p className="mt-7 mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">{S.where}</p>
            <div className="overflow-hidden rounded-3xl ring-1 ring-white/15">
              <PinPicker
                initial={position ? { lat: position.lat, lng: position.lng } : null}
                onChange={setPin}
              />
            </div>
            <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur-md">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--emerald)]" />
              {pin
                ? (pinName ?? S.pinSet)
                : status === "granted"
                  ? S.pinHintGranted
                  : S.pinHintNoGps}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 px-6 pb-6 pt-10" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.95) 55%, transparent)" }}>
            <button
              onClick={confirm}
              disabled={busy}
              className="press mx-auto block w-full max-w-sm rounded-2xl py-4 font-[var(--font-display)] text-base font-bold text-white shadow-[var(--shadow-glow)] disabled:opacity-60"
              style={{ background: "var(--gradient-emerald)" }}
            >
              {busy ? S.sharing : `${S.share} · ${Number.isNaN(leaveAt.getTime()) ? "--:--" : clockOf(leaveAt.toISOString())}`}
            </button>
          </div>
        </>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center px-6 py-8">
          <div className="flex w-full max-w-sm flex-col items-center text-center animate-fade-up">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/15 backdrop-blur-xl">
              <div className="absolute inset-2 rounded-full ring-4 ring-[var(--emerald)]/40 pulse-emerald" />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/60">{S.leavingIn}</p>
                <p className="font-[var(--font-display)] text-4xl font-bold tabular-nums">{mins}</p>
                <p className="mt-1 text-[11px] text-white/60">{S.min} · {clockOf(exitIso)}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald)] opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--emerald)]" />
              </span>
              <h2 className="font-[var(--font-display)] text-xl font-bold">{S.live}</h2>
            </div>
            <p className="mt-1 text-sm text-white/70">{S.liveSub}</p>

            <div className="mt-4 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 ring-1 ring-white/10">
              <Radio className="h-3 w-3 text-[var(--emerald)]" />
              {S.helping}
            </div>

            {mine.length === 0 ? (
              <div className="mt-6 w-full rounded-2xl bg-white/10 p-4 text-sm text-white/70 ring-1 ring-white/10 backdrop-blur-md">
                {S.noRequests}
              </div>
            ) : (
              <div className="mt-6 w-full space-y-3">
                {mine.map((r) => (
                  <RequestCard key={r.id} id={r.id} state={r.request_status} exitIso={exitIso} S={S} />
                ))}
              </div>
            )}

            <button onClick={cancelShare} className="press mt-6 flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur-md">
              <X className="h-4 w-4" />
              {S.stop}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({ id, state, exitIso, S }: { id: string; state: string; exitIso: string | null; S: (typeof STR)["en"] }) {
  const [busy, setBusy] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  const approve = async () => {
    setBusy(true);
    const { error } = await approveRequest(id);
    setBusy(false);
    if (error) toast.error(error); else toast.success("Spot reserved for the driver");
  };
  const decline = async () => {
    setBusy(true);
    const { error } = await declineRequest(id);
    setBusy(false);
    if (error) toast.error(error); else toast.message("Request declined");
  };
  const extend = async (extraMin: number) => {
    const base = exitIso ? new Date(exitIso).getTime() : Date.now();
    setBusy(true);
    const { error } = await proposeExtension(id, new Date(base + extraMin * 60000));
    setBusy(false);
    setShowExtend(false);
    if (error) toast.error(error); else toast.success("Asked the driver if they can wait");
  };

  if (state === "confirmed") {
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-start ring-1 ring-white/15 backdrop-blur-md">
        <p className="text-sm font-bold text-[var(--emerald)]">{S.reserved}</p>
        <p className="mt-1 text-xs text-white/70">{S.reservedSub} ({clockOf(exitIso)})</p>
        <button onClick={() => cancelRequest(id)} className="press mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/15">{S.cancelHandoff}</button>
      </div>
    );
  }

  if (state === "extension_proposed") {
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-start ring-1 ring-white/15 backdrop-blur-md">
        <p className="text-sm font-bold">{S.waiting}</p>
        <p className="mt-1 text-xs text-white/70">{S.waitingSub}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up rounded-2xl bg-white p-4 text-start text-foreground shadow-[var(--shadow-elevated)]">
      <p className="font-[var(--font-display)] text-base font-bold">{S.wantsSpot}</p>
      <p className="mt-1 text-xs text-muted-foreground">{S.wantsSpotSub} ({clockOf(exitIso)})</p>
      {!showExtend ? (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={approve} className="press flex items-center justify-center gap-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ background: "var(--gradient-emerald)" }}>
              <Check className="h-4 w-4" /> {S.approve}
            </button>
            <button disabled={busy} onClick={() => setShowExtend(true)} className="press flex items-center justify-center gap-1 rounded-xl bg-muted py-3 text-sm font-bold disabled:opacity-60">
              <TimerReset className="h-4 w-4" /> {S.moreTime}
            </button>
          </div>
          <button disabled={busy} onClick={decline} className="press flex w-full items-center justify-center gap-1 rounded-xl bg-red-50 py-3 text-sm font-bold text-[color:var(--danger)] ring-1 ring-red-200 disabled:opacity-60">
            <X className="h-4 w-4" /> {S.decline}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{S.extendBy}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[10, 20, 30].map((m) => (
              <button key={m} disabled={busy} onClick={() => extend(m)} className="press rounded-xl bg-muted py-2.5 text-sm font-bold disabled:opacity-60">+{m}m</button>
            ))}
          </div>
          <button onClick={() => setShowExtend(false)} className="mt-2 w-full rounded-xl py-2 text-xs font-semibold text-muted-foreground">{S.backBtn}</button>
        </div>
      )}
    </div>
  );
}
