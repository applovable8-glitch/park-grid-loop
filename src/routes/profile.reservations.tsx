import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { Screen, EmptyState, SkeletonList, Badge } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { useMyReservations } from "@/lib/profile-data";
import { formatDateTime } from "@/lib/points-labels";

export const Route = createFileRoute("/profile/reservations")({ component: MyReservations });

function MyReservations() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { items, loading } = useMyReservations(user?.id);

  const active = items.filter((r) => ["pending", "extension_proposed", "confirmed"].includes(r.request_status));
  const past = items.filter((r) => !["pending", "extension_proposed", "confirmed"].includes(r.request_status));

  return (
    <Screen title={ar ? "حجوزاتي" : "My reservations"} back="/profile">
      {loading && <SkeletonList n={4} />}
      {!loading && items.length === 0 && (
        <EmptyState icon={MapPin} title={ar ? "لا توجد حجوزات" : "No reservations yet"}
          description={ar ? "اعثر على موقف قريب واطلبه من صاحبه." : "Find a nearby spot and request it from the owner."}
          action={<Link to="/home" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{ar ? "افتح الخريطة" : "Open map"}</Link>} />
      )}

      {active.length > 0 && (
        <>
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "نشطة" : "Active"}</h3>
          <div className="mt-2 space-y-2">{active.map((r) => <Item key={r.id} r={r} ar={ar} />)}</div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h3 className="mt-6 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "سابقة" : "Past"}</h3>
          <div className="mt-2 space-y-2">{past.map((r) => <Item key={r.id} r={r} ar={ar} />)}</div>
        </>
      )}
    </Screen>
  );
}

function Item({ r, ar }: { r: { id: string; address: string | null; request_status: string; created_at: string }; ar: boolean }) {
  const tone = r.request_status === "confirmed" ? "emerald" : ["pending", "extension_proposed"].includes(r.request_status) ? "orange" : "red";
  const en: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", declined: "Declined", cancelled: "Cancelled", extension_proposed: "Extension" };
  const a: Record<string, string> = { pending: "قيد الانتظار", confirmed: "مؤكد", declined: "مرفوض", cancelled: "ملغي", extension_proposed: "تمديد" };
  return (
    <Link to="/reservation/$id" params={{ id: r.id }}
      className="block animate-fade-in rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition active:scale-[0.98]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold"><MapPin className="h-3.5 w-3.5 text-[color:var(--emerald)]" />{r.address || (ar ? "موقف" : "Parking spot")}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{formatDateTime(r.created_at, ar)}</p>
        </div>
        <Badge tone={tone as "emerald" | "orange" | "red"}>{(ar ? a : en)[r.request_status] ?? r.request_status}</Badge>
      </div>
    </Link>
  );
}
