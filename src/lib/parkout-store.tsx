import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Session } from "@supabase/supabase-js";

// ---------------- Types ----------------
export type SpotStatus = "available" | "leaving" | "reserved";
export interface ParkingSpot {
  id: string;
  lat: number; // relative 0-100 for stylized map
  lng: number;
  status: SpotStatus;
  leavingIn: number;
  distance: number;
  eta: number;
  cost: number;
  address: string;
  reservedUntil?: number;
}

export interface NotificationPrefs {
  push: boolean;
  nearby_spots: boolean;
  reservations: boolean;
  points: boolean;
}
export interface LocationPrefs {
  radius_m: number;
  share_location: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatar_url: string | null;
  phone: string | null;
  plate: string | null;
  language: string;
  theme: string;
  notification_prefs: NotificationPrefs;
  location_prefs: LocationPrefs;
  points: number;
  reputation: number;
  shared: number;
  reservations: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: "spot" | "points" | "reserve" | "expire";
  read?: boolean;
}

interface Ctx {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (patch: Partial<Omit<AppUser, "id" | "email" | "avatar">>) => Promise<{ error?: string }>;
  uploadAvatar: (file: File) => Promise<{ error?: string; url?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Legacy in-memory helpers (map/spots slice — real backend wiring comes next)
  spots: ParkingSpot[];
  addLeaving: (leaveInMin: 0 | 2 | 5) => string;
  cancelLeaving: (id: string) => void;
  reserve: (id: string) => void;
  activeLeavingId: string | null;
  activeReservationId: string | null;
  notifications: NotificationItem[];
}

const AppCtx = createContext<Ctx | null>(null);

const seedSpots = (): ParkingSpot[] => [
  { id: "s1", lat: 38, lng: 42, status: "available", leavingIn: 0, distance: 120, eta: 2, cost: 10, address: "Sheikh Zayed Rd, near DIFC" },
  { id: "s2", lat: 55, lng: 60, status: "leaving", leavingIn: 90, distance: 240, eta: 3, cost: 8, address: "Al Wasl Rd, Jumeirah 1" },
  { id: "s3", lat: 28, lng: 70, status: "available", leavingIn: 0, distance: 380, eta: 5, cost: 12, address: "Downtown Blvd, Burj Views" },
  { id: "s4", lat: 68, lng: 30, status: "leaving", leavingIn: 250, distance: 510, eta: 6, cost: 6, address: "Marina Walk, Tower 3" },
  { id: "s5", lat: 45, lng: 25, status: "reserved", leavingIn: 0, distance: 200, eta: 3, cost: 10, address: "City Walk, Block A" },
];

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // spots mock kept for existing UI slices
  const [spots, setSpots] = useState<ParkingSpot[]>(seedSpots);
  const [activeLeavingId, setActiveLeavingId] = useState<string | null>(null);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);

  const loadProfile = useCallback(async (uid: string, email: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
    if (!data) {
      setUser({
        id: uid, name: email.split("@")[0], email, avatar: email[0]?.toUpperCase() ?? "U",
        avatar_url: null, phone: null, plate: null, language: "en", theme: "system",
        notification_prefs: { push: true, nearby_spots: true, reservations: true, points: true },
        location_prefs: { radius_m: 800, share_location: true },
        points: 100, reputation: 5.0, shared: 0, reservations: 0,
      });
      return;
    }
    setUser({
      id: uid,
      name: data.name || email.split("@")[0],
      email: data.email || email,
      avatar: (data.name?.[0] || email[0] || "U").toUpperCase(),
      avatar_url: data.avatar_url,
      phone: data.phone,
      plate: data.plate,
      language: data.language,
      theme: data.theme,
      notification_prefs: data.notification_prefs as unknown as NotificationPrefs,
      location_prefs: data.location_prefs as unknown as LocationPrefs,
      points: data.points,
      reputation: Number(data.reputation),
      shared: data.shared_count,
      reservations: data.reservation_count,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id, session.user.email ?? "");
  }, [session, loadProfile]);

  // Auth bootstrap + subscription
  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        // defer profile load so we don't block the listener
        setTimeout(() => loadProfile(s.user.id, s.user.email ?? ""), 0);
      } else {
        setUser(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id, data.session.user.email ?? "");
      setLoading(false);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  // Load notifications for signed-in user
  useEffect(() => {
    if (!session?.user) { setNotifications([]); return; }
    const uid = session.user.id;
    let ignore = false;
    (async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(30);
      if (ignore || !data) return;
      setNotifications(data.map((n) => ({
        id: n.id, title: n.title, body: n.body,
        icon: (n.icon as NotificationItem["icon"]) ?? "spot",
        read: n.read, time: relTime(n.created_at),
      })));
    })();

    const channel = supabase
      .channel(`notif:${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, (payload) => {
        const n = payload.new as { id: string; title: string; body: string; icon: string; read: boolean; created_at: string };
        setNotifications((prev) => [{ id: n.id, title: n.title, body: n.body, icon: (n.icon as NotificationItem["icon"]) ?? "spot", read: n.read, time: relTime(n.created_at) }, ...prev]);
      })
      .subscribe();
    return () => { ignore = true; supabase.removeChannel(channel); };
  }, [session?.user]);

  // Mock spots countdown (unchanged — replaced in a later slice with realtime DB)
  useEffect(() => {
    const t = setInterval(() => {
      setSpots((prev) => prev.map((s) => {
        if (s.status === "leaving" && s.leavingIn > 0) {
          const next = s.leavingIn - 1;
          return { ...s, leavingIn: next, status: next <= 0 ? "available" : "leaving" };
        }
        if (s.status === "reserved" && s.reservedUntil && Date.now() > s.reservedUntil) {
          return { ...s, status: "available", reservedUntil: undefined };
        }
        return s;
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const value = useMemo<Ctx>(() => ({
    user, session, loading,

    signInWithEmail: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    signUpWithEmail: async (email, password, name) => {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/home`, data: { name } },
      });
      return { error: error?.message };
    },
    signInWithOAuth: async (provider) => {
      const res = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (res.error) return { error: res.error instanceof Error ? res.error.message : String(res.error) };
      return {};
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error?.message };
    },
    updatePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message };
    },
    updateProfile: async (patch) => {
      if (!session?.user) return { error: "Not signed in" };
      const dbPatch = {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.phone !== undefined && { phone: patch.phone }),
        ...(patch.plate !== undefined && { plate: patch.plate }),
        ...(patch.language !== undefined && { language: patch.language }),
        ...(patch.theme !== undefined && { theme: patch.theme }),
        ...(patch.avatar_url !== undefined && { avatar_url: patch.avatar_url }),
        ...(patch.notification_prefs !== undefined && { notification_prefs: patch.notification_prefs as unknown as never }),
        ...(patch.location_prefs !== undefined && { location_prefs: patch.location_prefs as unknown as never }),
      };
      const { error } = await supabase.from("profiles").update(dbPatch).eq("user_id", session.user.id);
      if (error) return { error: error.message };
      await loadProfile(session.user.id, session.user.email ?? "");
      return {};
    },
    uploadAvatar: async (file) => {
      if (!session?.user) return { error: "Not signed in" };
      const uid = session.user.id;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) return { error: upErr.message };
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl;
      if (!url) return { error: "Could not get avatar URL" };
      const { error: pErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", uid);
      if (pErr) return { error: pErr.message };
      await loadProfile(uid, session.user.email ?? "");
      return { url };
    },
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile,

    spots,
    addLeaving: (leaveInMin) => {
      const id = "u-" + Math.random().toString(36).slice(2, 7);
      const newSpot: ParkingSpot = {
        id, lat: 50, lng: 50,
        status: leaveInMin === 0 ? "available" : "leaving",
        leavingIn: leaveInMin * 60, distance: 0, eta: 0, cost: 10,
        address: "Your current location",
      };
      setSpots((p) => [newSpot, ...p]);
      setActiveLeavingId(id);
      return id;
    },
    cancelLeaving: (id) => { setSpots((p) => p.filter((s) => s.id !== id)); setActiveLeavingId(null); },
    reserve: (id) => {
      setSpots((p) => p.map((s) => (s.id === id ? { ...s, status: "reserved", reservedUntil: Date.now() + 90_000 } : s)));
      setActiveReservationId(id);
      setUser((u) => (u ? { ...u, points: Math.max(0, u.points - 10), reservations: u.reservations + 1 } : u));
    },
    activeLeavingId, activeReservationId, notifications,
  }), [user, session, loading, spots, activeLeavingId, activeReservationId, notifications, loadProfile, refreshProfile]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
