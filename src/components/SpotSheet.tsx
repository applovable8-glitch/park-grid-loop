import { Link } from "@tanstack/react-router";
import { Car, Clock, MapPin, MessageCircle, Phone, Shield, Star, X, Zap } from "lucide-react";
import { carLabel, useDriverProfile } from "@/lib/chat";
import { clockOf, minutesUntil, type LiveSpot } from "@/lib/parking-live";

interface Props {
  spot: LiveSpot;
  distance?: number | null;
  onClose: () => void;
  onRequest?: () => void;
  requestDisabled?: boolean;
  requestBusy?: boolean;
  isMine?: boolean;
}

/** Bottom sheet with full car + driver details, and direct contact actions. */
export function SpotSheet({ spot, distance, onClose, onRequest, requestDisabled, requestBusy, isMine }: Props) {
  const { profile, loading } = useDriverProfile(spot.user_id);
  const exitIso = spot.planned_leave_at ?? spot.leave_at;
  const mins = minutesUntil(exitIso);
  const distLabel = distance == null ? "—" : distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`;
  const phone = profile?.show_phone ? profile?.phone : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-label="Parking spot details">
      <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-8 shadow-[var(--shadow-card)] animate-fade-up">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
        <button onClick={onClose} className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]">
            <Car className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-[var(--font-display)] text-lg font-bold leading-tight">
              {spot.address ?? "Shared parking spot"}
            </h2>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {distLabel}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {spot.status === "reserved" ? "Reserved" : mins <= 0 ? "Free now" : `leaves in ${mins}m`}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-3 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Exit time</p>
            <p className="font-[var(--font-display)] font-bold">{clockOf(exitIso)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In</p>
            <p className="font-[var(--font-display)] font-bold">{Math.max(0, mins)}m</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</p>
            <p className="font-[var(--font-display)] font-bold">{spot.cost} pts</p>
          </div>
        </div>

        {/* Vehicle */}
        <div className="mt-4 rounded-2xl border border-border p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vehicle</p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: profile?.car_color ? "color-mix(in srgb, var(--emerald) 15%, transparent)" : "var(--muted)" }}
            >
              <Car className="h-5 w-5 text-[color:var(--emerald)]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{loading ? "Loading…" : carLabel(profile)}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.plate ? `Plate ${profile.plate}` : "Plate not set"}
                {profile?.car_type ? ` · ${profile.car_type}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Driver */}
        <div className="mt-3 rounded-2xl border border-border p-4">
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
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {profile ? Number(profile.reputation).toFixed(1) : "5.0"} · {profile?.shared_count ?? 0} spots shared
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{phone ?? "Phone hidden"}</p>
            </div>
            <Shield className="h-5 w-5 text-[color:var(--emerald)]" />
          </div>

          {!isMine && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={phone ? `tel:${phone.replace(/\s/g, "")}` : undefined}
                aria-disabled={!phone}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold ${
                  phone ? "bg-primary text-primary-foreground" : "pointer-events-none bg-muted text-muted-foreground"
                }`}
              >
                <Phone className="h-4 w-4" /> Call
              </a>
              <Link
                to="/chat/$id"
                params={{ id: spot.user_id }}
                search={{ spot: spot.id }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-muted py-3 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" /> Chat
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {isMine ? (
            <p className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">This is your own shared spot.</p>
          ) : (
            <button
              onClick={onRequest}
              disabled={requestDisabled || requestBusy}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
                requestDisabled ? "bg-muted text-muted-foreground" : "text-white shadow-[var(--shadow-glow)] active:scale-[0.98]"
              }`}
              style={requestDisabled ? undefined : { background: "var(--gradient-emerald)" }}
            >
              <Zap className="h-4 w-4" />
              {spot.status === "reserved" ? "Already reserved" : requestBusy ? "Sending…" : `Request for ${clockOf(exitIso)}`}
            </button>
          )}
          <Link
            to="/parking/$id"
            params={{ id: spot.id }}
            className="flex w-full items-center justify-center rounded-2xl bg-muted py-3 text-sm font-semibold"
          >
            Full details
          </Link>
        </div>
      </div>
    </div>
  );
}
