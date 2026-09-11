import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- users ---------------- */

export interface AdminUser {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  plate: string | null;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  avatar_url: string | null;
  points: number | null;
  reputation: number | null;
  shared_count: number | null;
  reservation_count: number | null;
  created_at: string | null;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select(
        "user_id,name,email,phone,plate,car_make,car_model,car_color,avatar_url,points,reputation,shared_count,reservation_count,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    setUsers((data ?? []) as AdminUser[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { users, loading, reload: load };
}

/** AndiScore derived from the existing reputation value (0-5 → 0-100). */
export function andiScore(reputation: number | null | undefined) {
  if (reputation == null) return null;
  return Math.round((Number(reputation) / 5) * 100);
}

/* ---------------- spots ---------------- */

export interface AdminSpot {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  address: string | null;
  status: string;
  cost: number | null;
  leave_at: string;
  planned_leave_at: string | null;
  expires_at: string;
  reserved_by: string | null;
  created_at: string;
}

export function useAdminSpots() {
  const [spots, setSpots] = useState<AdminSpot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("parking_spots")
      .select("id,user_id,lat,lng,address,status,cost,leave_at,planned_leave_at,expires_at,reserved_by,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    setSpots((data ?? []) as AdminSpot[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("admin-spots-table")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  return { spots, loading, reload: load };
}

/* ---------------- reservations ---------------- */

export interface AdminReservation {
  id: string;
  spot_id: string;
  user_id: string;
  owner_id: string | null;
  status: string;
  request_status: string;
  proposed_leave_at: string | null;
  expires_at: string;
  created_at: string;
}

export function useAdminReservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reservations")
      .select("id,spot_id,user_id,owner_id,status,request_status,proposed_leave_at,expires_at,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    setReservations((data ?? []) as AdminReservation[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("admin-reservations-table")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  return { reservations, loading, reload: load };
}

/* ---------------- shared lookups ---------------- */

export interface DirectoryEntry { name: string | null; plate: string | null; avatar_url: string | null }

/** Minimal user directory for showing names next to spots/reservations. */
export function useUserDirectory() {
  const [map, setMap] = useState<Record<string, DirectoryEntry>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("profiles").select("user_id,name,plate,avatar_url").limit(1000);
      if (cancelled) return;
      const next: Record<string, DirectoryEntry> = {};
      for (const p of data ?? []) next[p.user_id] = { name: p.name, plate: p.plate, avatar_url: p.avatar_url };
      setMap(next);
    })();
    return () => { cancelled = true; };
  }, []);

  return map;
}

export function useSpotDirectory() {
  const [map, setMap] = useState<Record<string, { address: string | null; status: string }>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("parking_spots").select("id,address,status").limit(1000);
      if (cancelled) return;
      const next: Record<string, { address: string | null; status: string }> = {};
      for (const s of data ?? []) next[s.id] = { address: s.address, status: s.status };
      setMap(next);
    })();
    return () => { cancelled = true; };
  }, []);

  return map;
}

/* ---------------- formatting ---------------- */

export const dash = "—";

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return dash;
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return dash;
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { day: "2-digit", month: "short" })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function shortRef(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function useSearch<T>(items: T[], query: string, fields: (item: T) => (string | null | undefined)[]) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => fields(item).some((f) => (f ?? "").toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query]);
}
