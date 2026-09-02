import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const REF_KEY = "parkout.ref";

export interface ReferredFriend {
  id: string;
  name: string;
  avatar_url: string | null;
  points_awarded: number;
  created_at: string;
}

export function referralLink(code: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://park-grid-loop.lovable.app";
  return `${origin}/auth?ref=${code}`;
}

/** Store a ?ref= code from the URL so we can redeem it after sign-up. */
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("ref");
  if (code && /^[A-Za-z0-9]{4,12}$/.test(code)) {
    window.localStorage.setItem(REF_KEY, code.toUpperCase());
  }
}

export function pendingReferralCode() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REF_KEY);
}

export function clearPendingReferral() {
  if (typeof window !== "undefined") window.localStorage.removeItem(REF_KEY);
}

export async function redeemReferral(code: string): Promise<{ error?: string }> {
  const { error } = await supabase.rpc("redeem_referral", { p_code: code.trim().toUpperCase() });
  if (!error) { clearPendingReferral(); return {}; }
  const msg = error.message || "";
  if (msg.includes("invalid_code")) return { error: "invalid_code" };
  if (msg.includes("own_code")) return { error: "own_code" };
  if (msg.includes("already_referred")) return { error: "already_referred" };
  return { error: msg };
}

/** Redeem a stored invite code once, right after the profile is created. */
export async function redeemPendingReferral() {
  const code = pendingReferralCode();
  if (!code) return { skipped: true } as const;
  const res = await redeemReferral(code);
  clearPendingReferral();
  return { skipped: false, ...res } as const;
}

export function useReferral(userId?: string | null) {
  const [code, setCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<ReferredFriend[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const [{ data: prof }, { data: refs }] = await Promise.all([
      supabase.from("profiles").select("referral_code").eq("user_id", userId).maybeSingle(),
      supabase.from("referrals").select("id, referee_id, points_awarded, created_at").eq("referrer_id", userId).order("created_at", { ascending: false }),
    ]);
    setCode(prof?.referral_code ?? null);

    const ids = (refs ?? []).map((r) => r.referee_id);
    let names: Record<string, { name: string; avatar_url: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", ids);
      names = Object.fromEntries((profs ?? []).map((p) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]));
    }
    setFriends((refs ?? []).map((r) => ({
      id: r.id,
      name: names[r.referee_id]?.name || "New driver",
      avatar_url: names[r.referee_id]?.avatar_url ?? null,
      points_awarded: r.points_awarded,
      created_at: r.created_at,
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  return { code, link: code ? referralLink(code) : null, friends, loading, refresh: load };
}
