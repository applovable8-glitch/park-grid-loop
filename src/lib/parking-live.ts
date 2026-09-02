import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveSpot {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  address: string | null;
  cost: number;
  status: string;
  leave_at: string;
  planned_leave_at: string | null;
  reserved_by: string | null;
  reserved_until: string | null;
}

export interface LiveRequest {
  id: string;
  spot_id: string;
  user_id: string;
  owner_id: string | null;
  request_status: string;
  proposed_leave_at: string | null;
  expires_at: string;
  created_at: string;
}

const OPEN = ["pending", "extension_proposed", "confirmed"];

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** "in 34 min" / "12:40" helper for expected exit time. */
export function minutesUntil(iso: string | null | undefined) {
  if (!iso) return 0;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

export function clockOf(iso: string | null | undefined) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** All active spots, live-updated. */
export function useLiveSpots() {
  const [spots, setSpots] = useState<LiveSpot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("parking_spots")
      .select("id,user_id,lat,lng,address,cost,status,leave_at,planned_leave_at,reserved_by,reserved_until")
      .in("status", ["available", "leaving", "reserved"])
      .order("leave_at", { ascending: true });
    setSpots((data as LiveSpot[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("spots-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return { spots, loading, reload: load };
}

/** The single open request/reservation of the current user (as seeker). */
export function useMyRequest(userId: string | undefined) {
  const [request, setRequest] = useState<LiveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setRequest(null); setLoading(false); return; }
    const { data } = await supabase
      .from("reservations")
      .select("id,spot_id,user_id,owner_id,request_status,proposed_leave_at,expires_at,created_at")
      .eq("user_id", userId)
      .in("request_status", OPEN)
      .maybeSingle();
    setRequest((data as LiveRequest) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const ch = supabase
      .channel(`my-req:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, userId]);

  return { request, loading, reload: load };
}

/** Requests other drivers made on my spots (as owner). */
export function useIncomingRequests(userId: string | undefined) {
  const [requests, setRequests] = useState<LiveRequest[]>([]);

  const load = useCallback(async () => {
    if (!userId) { setRequests([]); return; }
    const { data } = await supabase
      .from("reservations")
      .select("id,spot_id,user_id,owner_id,request_status,proposed_leave_at,expires_at,created_at")
      .eq("owner_id", userId)
      .in("request_status", OPEN)
      .order("created_at", { ascending: false });
    setRequests((data as LiveRequest[]) ?? []);
  }, [userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const ch = supabase
      .channel(`owner-req:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `owner_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, userId]);

  return { requests, reload: load };
}

/** One spot, live. */
export function useSpot(spotId: string | undefined) {
  const [spot, setSpot] = useState<LiveSpot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!spotId) return;
    const { data } = await supabase
      .from("parking_spots")
      .select("id,user_id,lat,lng,address,cost,status,leave_at,planned_leave_at,reserved_by,reserved_until")
      .eq("id", spotId)
      .maybeSingle();
    setSpot((data as LiveSpot) ?? null);
    setLoading(false);
  }, [spotId]);

  useEffect(() => {
    load();
    if (!spotId) return;
    const ch = supabase
      .channel(`spot:${spotId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots", filter: `id=eq.${spotId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, spotId]);

  return { spot, loading, reload: load };
}

/** The current user's own active shared spot (if any). */
export function useMySharedSpot(userId: string | undefined) {
  const [spot, setSpot] = useState<LiveSpot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setSpot(null); setLoading(false); return; }
    const { data } = await supabase
      .from("parking_spots")
      .select("id,user_id,lat,lng,address,cost,status,leave_at,planned_leave_at,reserved_by,reserved_until")
      .eq("user_id", userId)
      .in("status", ["available", "leaving", "reserved"])
      .order("created_at", { ascending: false })
      .limit(1);
    setSpot(((data as LiveSpot[] | null)?.[0]) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const ch = supabase
      .channel(`my-spot:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, userId]);

  return { spot, loading, reload: load };
}

// ---------------- Actions ----------------

function msg(e: unknown) {
  const raw = e instanceof Error ? e.message : String(e);
  const map: Record<string, string> = {
    already_has_open_request: "You already hold a request. Cancel it before choosing another spot.",
    spot_already_requested: "Someone already requested this spot.",
    own_spot: "This is your own spot.",
    invalid_state: "This request is no longer pending.",
    forbidden: "You are not allowed to do that.",
    not_authenticated: "Please sign in first.",
  };
  const key = Object.keys(map).find((k) => raw.includes(k));
  return key ? map[key] : raw;
}

export async function shareSpot(params: { lat: number; lng: number; leaveAt: Date; address?: string; cost?: number }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in first." };
  const iso = params.leaveAt.toISOString();
  const { data, error } = await supabase
    .from("parking_spots")
    .insert({
      user_id: auth.user.id,
      lat: params.lat,
      lng: params.lng,
      address: params.address ?? null,
      cost: params.cost ?? 10,
      leave_at: iso,
      planned_leave_at: iso,
      expires_at: new Date(params.leaveAt.getTime() + 30 * 60000).toISOString(),
      status: params.leaveAt.getTime() - Date.now() < 60000 ? "available" : "leaving",
    })
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.message.includes("parking_spots_one_active_per_user"))
      return { error: "You already shared a spot. Stop that share before creating a new one." };
    return { error: error.message };
  }
  return { id: data?.id as string };
}

export async function setPlannedLeave(spotId: string, leaveAt: Date) {
  const { error } = await supabase.rpc("set_planned_leave", { p_spot_id: spotId, p_leave_at: leaveAt.toISOString() });
  return { error: error ? msg(error) : undefined };
}

export async function requestSpot(spotId: string) {
  const { data, error } = await supabase.rpc("request_spot", { p_spot_id: spotId });
  return { id: data as string | undefined, error: error ? msg(error) : undefined };
}

export async function approveRequest(reservationId: string) {
  const { error } = await supabase.rpc("respond_to_request", { p_reservation_id: reservationId, p_action: "approve" });
  return { error: error ? msg(error) : undefined };
}

export async function proposeExtension(reservationId: string, newLeaveAt: Date) {
  const { error } = await supabase.rpc("respond_to_request", {
    p_reservation_id: reservationId,
    p_action: "extend",
    p_new_leave_at: newLeaveAt.toISOString(),
  });
  return { error: error ? msg(error) : undefined };
}

export async function answerExtension(reservationId: string, accept: boolean) {
  const { error } = await supabase.rpc("answer_extension", { p_reservation_id: reservationId, p_accept: accept });
  return { error: error ? msg(error) : undefined };
}

export async function declineRequest(reservationId: string) {
  const { error } = await supabase.rpc("respond_to_request", { p_reservation_id: reservationId, p_action: "decline" });
  return { error: error ? msg(error) : undefined };
}

export async function cancelRequest(reservationId: string) {
  const { error } = await supabase.rpc("cancel_request", { p_reservation_id: reservationId });
  return { error: error ? msg(error) : undefined };
}

export async function releaseSpot(spotId: string) {
  const { error } = await supabase.from("parking_spots").update({ status: "completed" }).eq("id", spotId);
  return { error: error?.message };
}

export async function completeHandoff(reservationId: string, taken: boolean) {
  const { error } = await supabase.rpc("complete_handoff", { p_reservation_id: reservationId, p_taken: taken });
  return { error: error ? msg(error) : undefined };
}

export async function rateUser(reservationId: string, stars: number, comment?: string) {
  const { error } = await supabase.rpc("rate_user", {
    p_reservation_id: reservationId,
    p_stars: stars,
    p_comment: comment?.trim() ? comment.trim() : null,
  });
  return { error: error ? msg(error) : undefined };
}

export async function takeoverSpot(reservationId: string, leaveAt: Date) {
  const { data, error } = await supabase.rpc("takeover_spot", {
    p_reservation_id: reservationId,
    p_leave_at: leaveAt.toISOString(),
  });
  return { id: data as string | undefined, error: error ? msg(error) : undefined };
}
