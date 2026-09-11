import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Car, ChevronDown, Clock, Footprints, MessageCircle, Navigation2, Phone, Star, X, Zap } from "lucide-react";
import { carLabel, useDriverProfile } from "@/lib/chat";
import { clockOf, minutesUntil, type LiveSpot } from "@/lib/parking-live";
import { distanceLabel, driveMinutes, maskPlate, walkMinutes } from "@/lib/format";
import { Skeleton } from "@/components/kit";
import { useI18n } from "@/lib/i18n";

const STR = {
  en: {
    requestThis: "Request this spot", requestQ: "Request this spot?", request: "Request spot", cancel: "Cancel",
    sending: "Sending…", alreadyReserved: "Already reserved", ownSpot: "This is your own shared spot.",
    leavingIn: (m: number) => `Leaving in ${m} min`, freeNow: "Free now", reserved: "Reserved",
    moreDetails: "More details", fullDetails: "Full details", call: "Call", chat: "Chat",
  },
  ar: {
    requestThis: "اطلب هذا الموقف", requestQ: "أتطلب هذا الموقف؟", request: "اطلب الموقف", cancel: "إلغاء",
    sending: "جارٍ الإرسال…", alreadyReserved: "محجوز مسبقًا", ownSpot: "هذا موقفك الذي شاركته.",
    leavingIn: (m: number) => `يغادر خلال ${m} دقيقة`, freeNow: "متاح الآن", reserved: "محجوز",
    moreDetails: "تفاصيل أكثر", fullDetails: "كل التفاصيل", call: "اتصال", chat: "دردشة",
  },
} as const;

interface Props {
  spot: LiveSpot;
  distance?: number | null;
  onClose: () => void;
  onRequest?: () => void;
  requestDisabled?: boolean;
  requestBusy?: boolean;
  isMine?: boolean;
}

/** Modern bottom sheet: one clear answer first, details on demand. */
export function SpotSheet({ spot, distance, onClose, onRequest, requestDisabled, requestBusy, isMine }: Props) {
  const { profile, loading } = useDriverProfile(spot.user_id);
  const { lang } = useI18n();
  const S = STR[lang];
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const exitIso = spot.planned_leave_at ?? spot.leave_at;
  const mins = minutesUntil(exitIso);
  const phone = profile?.show_phone ? profile?.phone : null;
  const plate = maskPlate(profile?.plate);

  const reserved = spot.status === "reserved";
  const headline = reserved ? S.reserved : mins <= 0 ? S.freeNow : S.leavingIn(mins);
  const tone = reserved ? "var(--danger)" : mins <= 2 ? "var(--emerald)" : "var(--warning)";

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-label="Parking spot details">
      <button className="animate-fade-in absolute inset-0 bg-[#0f172a]/45" onClick={onClose} aria-label="Close" />
      <div className="animate-sheet relative z-10 max-h-[86vh] w-full overflow-y-auto scrollbar-none rounded-t-[28px] bg-card p-5 pb-8 shadow-[var(--shadow-elevated)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <button onClick={onClose} className="press absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        {/* One answer, loud and clear */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: tone }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tone }}>
            {headline}
          </span>
        </div>
        <h2 className="mt-1.5 truncate text-xl font-extrabold leading-tight">{spot.address ?? "Shared parking spot"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {distance == null ? "Distance unknown" : `~${driveMinutes(distance)} min away · ${distanceLabel(distance)}`}
        </p>

        {/* Key facts only */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Fact icon={Navigation2} label="Distance" value={distanceLabel(distance)} />
          <Fact icon={Footprints} label="Walk" value={distance == null ? "—" : `${walkMinutes(distance)} min`} />
          <Fact icon={Clock} label="Exit" value={clockOf(exitIso)} />
        </div>

        {/* Trust signal, before the decision */}
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
          {loading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {(profile?.name?.[0] ?? "D").toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.name || "AndiPark driver"}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-[var(--warning)] text-[var(--warning)]" />
              {profile ? Number(profile.reputation).toFixed(1) : "5.0"} AndiScore · {profile?.shared_count ?? 0} shared
            </p>
          </div>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-[color:var(--emerald)]">
            {spot.cost} pts
          </span>
        </div>

        {/* Single CTA — the decision comes before the details */}
        <div className="mt-4">
          {isMine ? (
            <p className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">{S.ownSpot}</p>
          ) : !confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={requestDisabled || requestBusy}
              className={`press flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold ${
                requestDisabled ? "bg-muted text-muted-foreground" : "text-white shadow-[var(--shadow-glow)]"
              }`}
              style={requestDisabled ? undefined : { background: "var(--gradient-emerald)" }}
            >
              <Zap className="h-4 w-4" />
              {reserved ? S.alreadyReserved : requestBusy ? S.sending : S.requestThis}
            </button>
          ) : (
            <div className="animate-fade-up rounded-2xl border border-border bg-muted/60 p-4">
              <p className="text-center font-[var(--font-display)] text-base font-bold">{S.requestQ}</p>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {headline} · {spot.cost} pts · {distance == null ? "" : `${distanceLabel(distance)} · `}{clockOf(exitIso)}
              </p>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button
                  onClick={onRequest}
                  disabled={requestBusy}
                  className="press flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-[var(--shadow-glow)] disabled:opacity-60"
                  style={{ background: "var(--gradient-emerald)" }}
                >
                  <Zap className="h-4 w-4" />
                  {requestBusy ? S.sending : S.request}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={requestBusy}
                  className="press rounded-2xl bg-card px-5 py-3.5 text-sm font-semibold ring-1 ring-border"
                >
                  {S.cancel}
                </button>
              </div>
            </div>
          )}
          {!isMine && !requestDisabled && !confirming && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {spot.cost} pts · {clockOf(exitIso)}
            </p>
          )}
        </div>

        {/* Progressive disclosure */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="press mt-3 flex w-full items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm font-semibold"
          aria-expanded={open}
        >
          {S.moreDetails}
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="animate-fade-up mt-3 space-y-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vehicle</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Car className="h-5 w-5 text-[color:var(--emerald)]" />
                </span>
                <div className="min-w-0">
                  {loading ? (
                    <>
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="mt-2 h-3 w-20" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold">{carLabel(profile)}</p>
                      <p className="text-xs text-muted-foreground">
                        {plate ? `Plate ${plate}` : "Plate hidden"}
                        {profile?.car_type ? ` · ${profile.car_type}` : ""}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Driver</p>
              <div className="mt-2 flex items-center gap-3">
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
                    <Star className="h-3 w-3 fill-[var(--warning)] text-[var(--warning)]" />
                    {profile ? Number(profile.reputation).toFixed(1) : "5.0"} · {profile?.shared_count ?? 0} spots shared
                  </p>
                </div>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-[color:var(--emerald)]">
                  {spot.cost} pts
                </span>
              </div>

              {!isMine && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={phone ? `tel:${phone.replace(/\s/g, "")}` : undefined}
                    aria-disabled={!phone}
                    className={`press flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold ${
                      phone ? "bg-primary text-primary-foreground" : "pointer-events-none bg-muted text-muted-foreground"
                    }`}
                  >
                    <Phone className="h-4 w-4" />{S.call}
                  </a>
                  <Link
                    to="/chat/$id"
                    params={{ id: spot.user_id }}
                    search={{ spot: spot.id }}
                    className="press flex items-center justify-center gap-2 rounded-2xl bg-muted py-3 text-sm font-semibold"
                  >
                    <MessageCircle className="h-4 w-4" />{S.chat}
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/parking/$id"
              params={{ id: spot.id }}
              className="press flex w-full items-center justify-center rounded-2xl bg-muted py-3 text-sm font-semibold"
            >
              {S.fullDetails}
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-2 py-3 text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <p className="mt-1.5 text-sm font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
