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
      .select("id,spot_id,sender_id,recipient_id,body,created_at")
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

  return { messages, loading, send, reload: load };
}
