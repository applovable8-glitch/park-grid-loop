import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "./parkout-store";

/** Short two-tone chime rendered with the Web Audio API — no asset needed. */
export function playChime(volume = 0.5) {
  if (typeof window === "undefined") return;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    void ctx.resume();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume) * 0.35, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.13);
      osc.connect(gain);
      osc.start(now + i * 0.13);
      osc.stop(now + i * 0.13 + 0.3);
    });

    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* audio unavailable — stay silent */
  }
}

function vibrate() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate([30, 40, 30]);
}

/**
 * Plays an in-app sound whenever a new notification row lands for the signed-in user.
 * Respects the profile's sound / haptics / push preferences.
 */
export function NotificationSound() {
  const { user } = useApp();
  const prefs = useRef({ sound: true, haptics: true, enabled: true });
  prefs.current = {
    sound: user?.app_prefs?.sound !== false,
    haptics: user?.app_prefs?.haptics !== false,
    enabled: user?.notification_prefs?.push !== false,
  };

  useEffect(() => {
    if (!user?.id) return;
    const started = Date.now();
    const ch = supabase
      .channel(`notif-sound:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { created_at?: string } | undefined;
          // ignore backfilled rows that predate this session
          if (row?.created_at && new Date(row.created_at).getTime() < started - 60000) return;
          if (!prefs.current.enabled) return;
          if (prefs.current.sound) playChime();
          if (prefs.current.haptics) vibrate();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return null;
}
