import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MapPin, Gift, Clock, UserCheck, Check, X, TimerReset, Bell } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { localizeNotification } from "@/lib/notif-i18n";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, SkeletonList } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import {
  approveRequest,
  declineRequest,
  proposeExtension,
  answerExtension,
  clockOf,
  type LiveRequest,
} from "@/lib/parking-live";

export const Route = createFileRoute("/notifications")({ component: Notifs });

interface DbNotification {
  id: string;
  title: string;
  body: string;
  icon: string;
  read: boolean;
  created_at: string;
  metadata: { reservation_id?: string; spot_id?: string; kind?: string } | null;
}

const iconMap: Record<string, { Icon: typeof MapPin; color: string }> = {
  spot: { Icon: MapPin, color: "bg-emerald/15 text-[color:var(--emerald)]" },
  points: { Icon: Gift, color: "bg-yellow-100 text-yellow-700" },
  reserve: { Icon: UserCheck, color: "bg-blue-100 text-blue-700" },
  expire: { Icon: Clock, color: "bg-red-100 text-red-700" },
};

function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function Notifs() {
  const { user } = useApp();
  const { t, lang } = useI18n();
  const [items, setItems] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,icon,read,created_at,metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    setItems((data as unknown as DbNotification[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
    if (!user?.id) return;
    const ch = supabase
      .channel(`notifs:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, user?.id]);

  useEffect(() => {
    const unread = items.filter((n) => !n.read).map((n) => n.id);
    if (!unread.length) return;
    supabase.from("notifications").update({ read: true }).in("id", unread).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold">{t("notifications")}</h1>
        <p className="text-xs text-muted-foreground">{t("notifs_sub")}</p>
      </header>

      <div className="mt-4 space-y-2 px-4">
        {loading ? (
          <SkeletonList n={3} />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title={t("no_notifs")} description={t("no_notifs_hint")} />
        ) : (
          items.map((n) => {
            const { Icon, color } = iconMap[n.icon] ?? iconMap["spot"]!;
            const copy = localizeNotification(lang, n.metadata?.kind, n.title, n.body);
            return (
              <div key={n.id} className={`rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)] animate-fade-up ${n.read ? "" : "ring-1 ring-[var(--emerald)]/30"}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{copy.title}</p>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{copy.body}</p>
                  </div>
                </div>
                {n.metadata?.reservation_id && (
                  <RequestActions reservationId={n.metadata.reservation_id} notifId={n.id} />
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}

/** Inline approve / decline / extend (owner) or accept-extension (seeker). */
function RequestActions({ reservationId, notifId }: { reservationId: string; notifId: string }) {
  const { user } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const [req, setReq] = useState<LiveRequest | null>(null);
  const [exitIso, setExitIso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reservations")
      .select("id,spot_id,user_id,owner_id,request_status,proposed_leave_at,expires_at,created_at")
      .eq("id", reservationId)
      .maybeSingle();
    const r = (data as LiveRequest) ?? null;
    setReq(r);
    if (r) {
      const { data: s } = await supabase
        .from("parking_spots")
        .select("planned_leave_at,leave_at")
        .eq("id", r.spot_id)
        .maybeSingle();
      setExitIso((s?.planned_leave_at as string | null) ?? (s?.leave_at as string | null) ?? null);
    }
  }, [reservationId]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`notif-res:${reservationId}:${notifId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `id=eq.${reservationId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, reservationId, notifId]);

  if (!req || !user) return null;
  const isOwner = req.owner_id === user.id;
  const state = req.request_status;

  const run = async (fn: () => Promise<{ error?: string }>, ok: string) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    setShowExtend(false);
    if (error) toast.error(error); else toast.success(ok);
  };

  if (isOwner && state === "pending") {
    return (
      <div className="mt-3 space-y-2">
        {!showExtend ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={busy} onClick={() => run(() => approveRequest(req.id), "Spot reserved for the driver")}
                className="flex items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: "var(--gradient-emerald)" }}>
                <Check className="h-4 w-4" /> {t("approve")}
              </button>
              <button disabled={busy} onClick={() => setShowExtend(true)}
                className="flex items-center justify-center gap-1 rounded-xl bg-muted py-2.5 text-sm font-bold disabled:opacity-60">
                <TimerReset className="h-4 w-4" /> {t("more_time")}
              </button>
            </div>
            <button disabled={busy} onClick={() => run(() => declineRequest(req.id), "Request declined")}
              className="flex w-full items-center justify-center gap-1 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-[color:var(--danger)] ring-1 ring-red-200 disabled:opacity-60">
              <X className="h-4 w-4" /> {t("decline")}
            </button>
          </>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">{t("extend_by")}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[10, 20, 30].map((m) => (
                <button key={m} disabled={busy}
                  onClick={() => run(
                    () => proposeExtension(req.id, new Date((exitIso ? new Date(exitIso).getTime() : Date.now()) + m * 60000)),
                    "Asked the driver if they can wait",
                  )}
                  className="rounded-xl bg-muted py-2.5 text-sm font-bold disabled:opacity-60">+{m}m</button>
              ))}
            </div>
            <button onClick={() => setShowExtend(false)} className="mt-2 w-full rounded-xl py-2 text-xs font-semibold text-muted-foreground">{t("back")}</button>
          </div>
        )}
      </div>
    );
  }

  if (!isOwner && state === "extension_proposed") {
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">{t("new_exit_time")} <span className="font-semibold text-foreground">{clockOf(req.proposed_leave_at)}</span></p>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={busy} onClick={() => run(() => answerExtension(req.id, true), "Reserved with the new exit time")}
            className="flex items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: "var(--gradient-emerald)" }}>
            <Check className="h-4 w-4" /> {t("ill_wait")}
          </button>
          <button disabled={busy} onClick={() => run(() => answerExtension(req.id, false), "Request withdrawn")}
            className="flex items-center justify-center gap-1 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-[color:var(--danger)] ring-1 ring-red-200 disabled:opacity-60">
            <X className="h-4 w-4" /> {t("no_thanks")}
          </button>
        </div>
      </div>
    );
  }

  if (state === "confirmed") {
    // The seeker confirms the handoff right here instead of on the map.
    if (!isOwner) {
      return (
        <button onClick={() => nav({ to: "/handoff/$id", params: { id: req.id } })}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white"
          style={{ background: "var(--gradient-emerald)" }}>{t("took_the_spot_q")}</button>
      );
    }
    return (
      <button onClick={() => nav({ to: "/reservation/$id", params: { id: req.id } })}
        className="mt-3 w-full rounded-xl bg-muted py-2.5 text-sm font-semibold">{t("view_reservation")}</button>
    );
  }

  return null;
}
