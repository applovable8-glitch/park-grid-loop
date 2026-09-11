import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminTable";
import { useAdminUsers, useAdminSpots, useAdminReservations, andiScore } from "@/lib/admin-tables";
import { usePointsLedger, useReferrals, downloadCsv } from "@/lib/admin-finance";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReports,
});

function Card({ title, detail, count, disabled, onExport }: { title: string; detail: string; count: number | null; disabled?: boolean; onExport?: () => void }) {
  return (
    <div className="animate-fade-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:bg-white/5">{count ?? "—"}</span>
      </div>
      <button
        onClick={onExport}
        disabled={disabled}
        className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
          disabled ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/5" : "bg-emerald-500 text-white hover:bg-emerald-600"
        }`}
      >
        <Download className="h-3.5 w-3.5" /> {disabled ? "Export not available" : "Export CSV"}
      </button>
    </div>
  );
}

function AdminReports() {
  const { users } = useAdminUsers();
  const { spots } = useAdminSpots();
  const { reservations } = useAdminReservations();
  const points = usePointsLedger(300);
  const referrals = useReferrals();

  return (
    <div>
      <AdminHeader title="Reports" subtitle="Export what the console can already read" />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card
          title="Users" detail="Profiles, score, points and activity counters" count={users.length}
          onExport={() => downloadCsv("andipark-users.csv", ["Name", "Email", "Phone", "AndiScore", "Points", "Reservations", "Shared", "Joined"],
            users.map((u) => [u.name, u.email, u.phone, andiScore(u.reputation), u.points, u.reservation_count, u.shared_count, u.created_at]))}
        />
        <Card
          title="Parking" detail="Shared spots with status and timings" count={spots.length}
          onExport={() => downloadCsv("andipark-parking.csv", ["Spot", "Status", "Address", "Lat", "Lng", "Cost", "Created", "Departure"],
            spots.map((s) => [s.id, s.status, s.address, s.lat, s.lng, s.cost, s.created_at, s.planned_leave_at ?? s.leave_at]))}
        />
        <Card
          title="Reservations" detail="Every request and its outcome" count={reservations.length}
          onExport={() => downloadCsv("andipark-reservations.csv", ["Reservation", "Spot", "Requester", "Owner", "Status", "Request status", "Created"],
            reservations.map((r) => [r.id, r.spot_id, r.user_id, r.owner_id, r.status, r.request_status, r.created_at]))}
        />
        <Card
          title="Rewards" detail="Points ledger entries" count={points.rows.length}
          onExport={() => downloadCsv("andipark-rewards.csv", ["Transaction", "User", "Points", "Reason", "Created"],
            points.rows.map((t) => [t.id, t.user_id, t.delta, t.reason, t.created_at]))}
        />
        <Card
          title="Referrals" detail="Redeemed invite codes" count={referrals.rows.length}
          onExport={() => downloadCsv("andipark-referrals.csv", ["Referral", "Referrer", "Referee", "Code", "Points", "Created"],
            referrals.rows.map((r) => [r.id, r.referrer_id, r.referee_id, r.code, r.points_awarded, r.created_at]))}
        />
        <Card title="Payments" detail="Needs a connected payment provider" count={null} disabled />
      </div>

      <p className="mt-3 text-[11px] text-slate-400">Exports are generated in your browser from the data this console already loaded — no server export job runs.</p>
    </div>
  );
}
