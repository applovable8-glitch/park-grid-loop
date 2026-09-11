import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Counts read straight from the existing tables. `null` = not readable, shown as "—". */
export interface AdminStats {
  users: number | null;
  activeSpots: number | null;
  reservations: number | null;
  handoffs: number | null;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({ users: null, activeSpots: null, reservations: null, handoffs: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [users, activeSpots, reservations, handoffs] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("parking_spots").select("id", { count: "exact", head: true }).in("status", ["available", "leaving", "reserved"]),
      supabase.from("reservations").select("id", { count: "exact", head: true }),
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ]);
    const val = (r: { count: number | null; error: unknown }) => (r.error ? null : r.count ?? null);
    setStats({ users: val(users), activeSpots: val(activeSpots), reservations: val(reservations), handoffs: val(handoffs) });
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { stats, loading, reload: load };
}

/* ---------------- live activity ---------------- */
export type ActivityKind = "spot_shared" | "spot_completed" | "res_requested" | "res_accepted" | "res_cancelled";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  at: string;
  description: string;
}

const shortId = (id: string) => id.slice(0, 6).toUpperCase();

export function useAdminActivity(limit = 20) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [spotsRes, resvRes] = await Promise.all([
      supabase.from("parking_spots").select("id,status,created_at,address").order("created_at", { ascending: false }).limit(limit),
      supabase.from("reservations").select("id,status,request_status,created_at").order("created_at", { ascending: false }).limit(limit),
    ]);

    const out: ActivityEvent[] = [];
    for (const s of spotsRes.data ?? []) {
      out.push({
        id: `spot-${s.id}`,
        kind: "spot_shared",
        at: s.created_at,
        description: s.address ? String(s.address) : `Spot ${shortId(s.id)}`,
      });
    }
    for (const r of resvRes.data ?? []) {
      const rs = String(r.request_status ?? "");
      const kind: ActivityKind =
        r.status === "completed" ? "spot_completed"
        : rs === "confirmed" ? "res_accepted"
        : rs === "cancelled" || rs === "declined" ? "res_cancelled"
        : "res_requested";
      out.push({ id: `res-${r.id}`, kind, at: r.created_at, description: `Reservation ${shortId(r.id)}` });
    }

    out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    setEvents(out.slice(0, limit));
    setLoading(false);
  }, [limit]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("admin-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  return { events, loading, reload: load };
}

export function activityLabel(kind: ActivityKind) {
  switch (kind) {
    case "spot_shared": return "Spot shared";
    case "spot_completed": return "Spot completed";
    case "res_requested": return "Reservation requested";
    case "res_accepted": return "Reservation accepted";
    case "res_cancelled": return "Reservation cancelled";
  }
}

export function shortTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
