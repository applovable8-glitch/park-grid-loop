import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, MapPin, Car } from "lucide-react";
import { Screen, EmptyState, SkeletonList, Badge } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { useMyShares, useMyReservations } from "@/lib/profile-data";
import { formatDateTime } from "@/lib/points-labels";

export const Route = createFileRoute("/profile/history")({ component: ParkingHistory });

function ParkingHistory() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [tab, setTab] = useState<"shared" | "reserved">("shared");
  const shares = useMyShares(user?.id);
  const reservations = useMyReservations(user?.id);

  return (
    <Screen title={ar ? "سجل المواقف" : "Parking history"} back="/profile">
      <div className="relative flex rounded-2xl bg-muted p-1">
        {(["shared", "reserved"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 ${tab === k ? "bg-card shadow-[var(--shadow-card)]" : "text-muted-foreground"}`}>
            {k === "shared" ? (ar ? "شاركتها" : "Shared by me") : ar ? "حجزتها" : "Reserved by me"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {tab === "shared" && (
          <>
            {shares.loading && <SkeletonList n={4} />}
            {!shares.loading && shares.items.length === 0 && (
              <EmptyState icon={Car} title={ar ? "لم تشارك موقفاً بعد" : "No shared spots yet"}
                description={ar ? "شارك موقفك عند المغادرة واكسب نقاطاً." : "Share your spot when you leave and earn points."}
                action={<Link to="/leaving" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{ar ? "شارك الآن" : "Share now"}</Link>} />
            )}
            {shares.items.map((s) => (
              <div key={s.id} className="animate-fade-in rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold"><MapPin className="h-3.5 w-3.5 text-[color:var(--emerald)]" />{s.address || (ar ? "موقع محدد" : "Pinned location")}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{formatDateTime(s.created_at, ar)}</p>
                  </div>
                  <Badge tone={statusTone(s.status)}>{statusLabel(s.status, ar)}</Badge>
                </div>
                <p className="mt-2 text-xs font-semibold text-[color:var(--emerald)]">+{s.cost} {ar ? "نقطة" : "pts"}</p>
              </div>
            ))}
          </>
        )}

        {tab === "reserved" && (
          <>
            {reservations.loading && <SkeletonList n={4} />}
            {!reservations.loading && reservations.items.length === 0 && (
              <EmptyState icon={MapPin} title={ar ? "لا توجد حجوزات" : "No reservations yet"}
                description={ar ? "ابحث عن موقف قريب واحجزه." : "Find a nearby spot and reserve it."}
                action={<Link to="/home" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{ar ? "افتح الخريطة" : "Open map"}</Link>} />
            )}
            {reservations.items.map((r) => (
              <Link key={r.id} to="/reservation/$id" params={{ id: r.id }}
                className="block animate-fade-in rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition active:scale-[0.98]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.address || (ar ? "موقف محجوز" : "Reserved spot")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.created_at, ar)}</p>
                  </div>
                  <Badge tone={reqTone(r.request_status)}>{reqLabel(r.request_status, ar)}</Badge>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </Screen>
  );
}

function statusTone(s: string) {
  if (s === "available" || s === "leaving") return "emerald" as const;
  if (s === "reserved") return "orange" as const;
  if (s === "cancelled" || s === "expired") return "red" as const;
  return "muted" as const;
}
function statusLabel(s: string, ar: boolean) {
  const en: Record<string, string> = { available: "Available", leaving: "Leaving", reserved: "Reserved", expired: "Expired", completed: "Completed", cancelled: "Cancelled" };
  const a: Record<string, string> = { available: "متاح", leaving: "يغادر", reserved: "محجوز", expired: "منتهي", completed: "مكتمل", cancelled: "ملغي" };
  return (ar ? a : en)[s] ?? s;
}
function reqTone(s: string) {
  if (s === "confirmed") return "emerald" as const;
  if (s === "pending" || s === "extension_proposed") return "orange" as const;
  if (s === "declined" || s === "cancelled") return "red" as const;
  return "muted" as const;
}
function reqLabel(s: string, ar: boolean) {
  const en: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", declined: "Declined", cancelled: "Cancelled", extension_proposed: "Extension" };
  const a: Record<string, string> = { pending: "قيد الانتظار", confirmed: "مؤكد", declined: "مرفوض", cancelled: "ملغي", extension_proposed: "تمديد" };
  return (ar ? a : en)[s] ?? s;
}
