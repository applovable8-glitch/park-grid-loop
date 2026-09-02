import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DriverProfile {
  user_id: string;
  name: string;
  phone: string | null;
  plate: string | null;
  avatar_url: string | null;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  car_type: string | null;
  reputation: number;
  shared_count: number;
  show_phone: boolean;
}

export interface ChatMessage {
  id: string;
  spot_id: string | null;
  sender_id: string;
  recipient_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

const COLS =
  "user_id,name,phone,plate,avatar_url,car_make,car_model,car_color,car_type,reputation,shared_count,show_phone";

/** Public-ish profile of the driver who shared a spot. */
export function useDriverProfile(userId: string | undefined | null) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!userId) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    supabase
      .from("profiles")
      .select(COLS)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setProfile((data as unknown as DriverProfile) ?? null);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [userId]);

  return { profile, loading };
}

export function carLabel(p: DriverProfile | null | undefined) {
  if (!p) return "Vehicle not set";
  const bits = [p.car_color, p.car_make, p.car_model].filter(Boolean);
  return bits.length ? bits.join(" ") : p.car_type ?? "Vehicle not set";
}

/** Live 1:1 thread between the current user and another driver about a spot. */
export function useThread(meId: string | undefined, otherId: string | undefined, spotId?: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!meId || !otherId) { setMessages([]); setLoading(false); return; }
    const { data } = await supabase
      .from("messages")
      .select("id,spot_id,sender_id,recipient_id,body,image_url,created_at")
      .or(`and(sender_id.eq.${meId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${meId})`)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((data as ChatMessage[]) ?? []);
    setLoading(false);
  }, [meId, otherId]);

  useEffect(() => {
    load();
    if (!meId) return;
    const ch = supabase
      .channel(`chat:${meId}:${otherId ?? "none"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, meId, otherId]);

  const send = useCallback(
    async (body: string) => {
      if (!meId || !otherId || !body.trim()) return { error: "Empty message" };
      const { error } = await supabase.from("messages").insert({
        sender_id: meId,
        recipient_id: otherId,
        spot_id: spotId ?? null,
        body: body.trim().slice(0, 1000),
      });
      if (!error) load();
      return { error: error?.message };
    },
    [meId, otherId, spotId, load],
  );

  const sendImage = useCallback(
    async (file: File) => {
      if (!meId || !otherId) return { error: "Not signed in" };
      if (!file.type.startsWith("image/")) return { error: "Only images are allowed" };
      if (file.size > 10 * 1024 * 1024) return { error: "Image is too large (max 10MB)" };
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${meId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-images").upload(path, file, { upsert: false });
      if (upErr) return { error: upErr.message };
      const { data: signed } = await supabase.storage
        .from("chat-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (!signed?.signedUrl) return { error: "Could not prepare the image" };
      const { error } = await supabase.from("messages").insert({
        sender_id: meId,
        recipient_id: otherId,
        spot_id: spotId ?? null,
        body: "",
        image_url: signed.signedUrl,
      });
      if (!error) load();
      return { error: error?.message };
    },
    [meId, otherId, spotId, load],
  );

  return { messages, loading, send, sendImage, reload: load };
}

export interface ThreadSummary {
  otherId: string;
  spotId: string | null;
  lastBody: string;
  lastAt: string;
  unread: number;
  profile: DriverProfile | null;
}

/** All conversations of the current user, newest first, live-updating. */
export function useThreads(meId: string | undefined) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!meId) { setThreads([]); setLoading(false); return; }
    const { data } = await supabase
      .from("messages")
      .select("id,spot_id,sender_id,recipient_id,body,image_url,created_at,read")
      .or(`sender_id.eq.${meId},recipient_id.eq.${meId}`)
      .order("created_at", { ascending: false })
      .limit(300);

    const rows = (data ?? []) as (ChatMessage & { read: boolean })[];
    const map = new Map<string, ThreadSummary>();
    for (const m of rows) {
      const other = m.sender_id === meId ? m.recipient_id : m.sender_id;
      const existing = map.get(other);
      const unreadInc = m.recipient_id === meId && !m.read ? 1 : 0;
      if (!existing) {
        map.set(other, {
          otherId: other,
          spotId: m.spot_id,
          lastBody: m.body || (m.image_url ? "📷 Photo" : ""),
          lastAt: m.created_at,
          unread: unreadInc,
          profile: null,
        });
      } else {
        existing.unread += unreadInc;
      }
    }
    const list = [...map.values()];
    if (list.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select(COLS)
        .in("user_id", list.map((t) => t.otherId));
      const byId = new Map((profs ?? []).map((p) => [(p as unknown as DriverProfile).user_id, p as unknown as DriverProfile]));
      for (const t of list) t.profile = byId.get(t.otherId) ?? null;
    }
    setThreads(list);
    setLoading(false);
  }, [meId]);

  useEffect(() => {
    load();
    if (!meId) return;
    const ch = supabase
      .channel(`threads:${meId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, meId]);

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);
  return { threads, loading, totalUnread, reload: load };
}

/** Mark all messages from `otherId` to me as read. */
export async function markThreadRead(meId: string | undefined, otherId: string | undefined) {
  if (!meId || !otherId) return;
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("recipient_id", meId)
    .eq("sender_id", otherId)
    .eq("read", false);
}
