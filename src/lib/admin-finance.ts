import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Generic list loader against an existing table. `available:false` = table not readable. */
function useTable<T>(table: string, columns: string, limit = 200) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from(table as never)
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) setAvailable(false);
    setRows((data ?? []) as T[]);
    setLoading(false);
  }, [table, columns, limit]);

  useEffect(() => { void load(); }, [load]);
  return { rows, loading, available, reload: load };
}

/* ---------------- point purchases (the only money table in the schema) ---------------- */

export interface PointPurchase {
  id: string;
  user_id: string;
  session_id: string;
  price_id: string;
  points: number;
  amount_total: number | null;
  currency: string | null;
  environment: string;
  created_at: string;
}

export function usePointPurchases() {
  return useTable<PointPurchase>("point_purchases", "id,user_id,session_id,price_id,points,amount_total,currency,environment,created_at");
}

/* ---------------- points ledger ---------------- */

export interface PointsTx {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function usePointsLedger(limit = 200) {
  return useTable<PointsTx>("points_transactions", "id,user_id,delta,reason,metadata,created_at", limit);
}

/* ---------------- referrals ---------------- */

export interface ReferralRow {
  id: string;
  referrer_id: string;
  referee_id: string;
  code: string;
  points_awarded: number;
  created_at: string;
  updated_at: string;
}

export function useReferrals() {
  return useTable<ReferralRow>("referrals", "id,referrer_id,referee_id,code,points_awarded,created_at,updated_at");
}

/* ---------------- notifications ---------------- */

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  icon: string;
  read: boolean;
  created_at: string;
}

export function useAdminNotifications(limit = 200) {
  return useTable<NotificationRow>("notifications", "id,user_id,title,body,icon,read,created_at", limit);
}

/* ---------------- analytics series (computed from real rows only) ---------------- */

export interface DayPoint { day: string; value: number }

export function bucketByDay(rows: { created_at: string }[], days = 14): DayPoint[] {
  const out: DayPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, value: rows.filter((r) => r.created_at?.slice(0, 10) === key).length });
  }
  return out;
}

export interface AnalyticsRows {
  users: { created_at: string }[];
  spots: { created_at: string; status: string }[];
  reservations: { created_at: string; status: string; request_status: string }[];
  loading: boolean;
}

export function useAnalyticsRows(): AnalyticsRows {
  const [state, setState] = useState<AnalyticsRows>({ users: [], spots: [], reservations: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [u, s, r] = await Promise.all([
        supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("parking_spots").select("created_at,status").order("created_at", { ascending: false }).limit(1000),
        supabase.from("reservations").select("created_at,status,request_status").order("created_at", { ascending: false }).limit(1000),
      ]);
      if (cancelled) return;
      setState({
        users: (u.data ?? []) as { created_at: string }[],
        spots: (s.data ?? []) as { created_at: string; status: string }[],
        reservations: (r.data ?? []) as { created_at: string; status: string; request_status: string }[],
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

/** Rows that are unique users active in the last N days, from created_at style rows. */
export function activeSince(rows: { created_at: string }[], days: number) {
  const cutoff = Date.now() - days * 86400000;
  return rows.filter((r) => new Date(r.created_at).getTime() >= cutoff).length;
}

/** Simple, dependency-free CSV export from rows already loaded in the browser. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null)[][]) {
  const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
