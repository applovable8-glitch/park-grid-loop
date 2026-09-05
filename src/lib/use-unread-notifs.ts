import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Live count of unread notifications for the badge on the bell tab. */
export function useUnreadNotifs(userId?: string | null) {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!userId) { setUnread(0); return; }
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    setUnread(count ?? 0);
  }, [userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const ch = supabase
      .channel(`notif-badge:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, userId]);

  return unread;
}
