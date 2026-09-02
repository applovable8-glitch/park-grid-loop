import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- points history ---------------- */
export interface PointsTx {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export function usePointsHistory(userId?: string | null, limit = 50) {
  const [items, setItems] = useState<PointsTx[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("points_transactions")
      .select("id, delta, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    setItems(data ?? []);
    setLoading(false);
  }, [userId, limit]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`pts:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "points_transactions", filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [userId, load]);

  return { items, loading, refresh: load };
}

/* ---------------- parking history (shares) ---------------- */
export interface SharedSpotRow {
  id: string;
  address: string | null;
  status: string;
  created_at: string;
  leave_at: string;
  cost: number;
}

export function useMyShares(userId?: string | null, limit = 50) {
  const [items, setItems] = useState<SharedSpotRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!userId) { setItems([]); setLoading(false); return; }
      setLoading(true);
      const { data } = await supabase
        .from("parking_spots")
        .select("id, address, status, created_at, leave_at, cost")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!ignore) { setItems(data ?? []); setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [userId, limit]);

  return { items, loading };
}

/* ---------------- reservations ---------------- */
export interface ReservationRow {
  id: string;
  spot_id: string;
  request_status: string;
  status: string;
  created_at: string;
  expires_at: string;
  address: string | null;
}

export function useMyReservations(userId?: string | null, limit = 50) {
  const [items, setItems] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("reservations")
      .select("id, spot_id, request_status, status, created_at, expires_at, parking_spots(address)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    setItems((data ?? []).map((r) => {
      const spot = r.parking_spots as { address: string | null } | { address: string | null }[] | null;
      const address = Array.isArray(spot) ? spot[0]?.address ?? null : spot?.address ?? null;
      return {
        id: r.id, spot_id: r.spot_id, request_status: r.request_status,
        status: r.status, created_at: r.created_at, expires_at: r.expires_at, address,
      };
    }));
    setLoading(false);
  }, [userId, limit]);

  useEffect(() => { void load(); }, [load]);

  return { items, loading, refresh: load };
}

/* ---------------- leaderboard ---------------- */
export interface LeaderRow {
  user_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  shared_count: number;
}

export function useLeaderboard(limit = 20) {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, points, shared_count")
        .order("points", { ascending: false })
        .limit(limit);
      if (!ignore) { setRows(data ?? []); setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [limit]);

  return { rows, loading };
}

/* ---------------- weekly activity ---------------- */
export function weeklyBuckets(items: { created_at: string; delta?: number }[]) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return { date: d, count: 0 };
  });
  for (const it of items) {
    const t = new Date(it.created_at);
    t.setHours(0, 0, 0, 0);
    const hit = days.find((d) => d.date.getTime() === t.getTime());
    if (hit) hit.count += 1;
  }
  return days;
}
