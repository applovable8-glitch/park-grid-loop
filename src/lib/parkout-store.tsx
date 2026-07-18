import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SpotStatus = "available" | "leaving" | "reserved";
export interface ParkingSpot {
  id: string;
  lat: number; // relative 0-100 for stylized map
  lng: number;
  status: SpotStatus;
  leavingIn: number; // seconds until leave, 0 = now
  distance: number; // meters
  eta: number; // minutes
  cost: number; // points
  address: string;
  reservedUntil?: number; // timestamp
}

export interface AppUser {
  name: string;
  email: string;
  avatar: string;
  points: number;
  reputation: number;
  shared: number;
  reservations: number;
}

interface Ctx {
  user: AppUser | null;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
  spots: ParkingSpot[];
  addLeaving: (leaveInMin: 0 | 2 | 5) => string;
  cancelLeaving: (id: string) => void;
  reserve: (id: string) => void;
  activeLeavingId: string | null;
  activeReservationId: string | null;
  notifications: { id: string; title: string; body: string; time: string; icon: "spot" | "points" | "reserve" | "expire" }[];
}

const AppCtx = createContext<Ctx | null>(null);

const seedSpots = (): ParkingSpot[] => [
  { id: "s1", lat: 38, lng: 42, status: "available", leavingIn: 0, distance: 120, eta: 2, cost: 10, address: "Sheikh Zayed Rd, near DIFC" },
  { id: "s2", lat: 55, lng: 60, status: "leaving", leavingIn: 90, distance: 240, eta: 3, cost: 8, address: "Al Wasl Rd, Jumeirah 1" },
  { id: "s3", lat: 28, lng: 70, status: "available", leavingIn: 0, distance: 380, eta: 5, cost: 12, address: "Downtown Blvd, Burj Views" },
  { id: "s4", lat: 68, lng: 30, status: "leaving", leavingIn: 250, distance: 510, eta: 6, cost: 6, address: "Marina Walk, Tower 3" },
  { id: "s5", lat: 45, lng: 25, status: "reserved", leavingIn: 0, distance: 200, eta: 3, cost: 10, address: "City Walk, Block A" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("parkout-user");
    return raw ? JSON.parse(raw) : null;
  });
  const [spots, setSpots] = useState<ParkingSpot[]>(seedSpots);
  const [activeLeavingId, setActiveLeavingId] = useState<string | null>(null);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Ctx["notifications"]>([
    { id: "n1", title: "Parking available nearby", body: "A spot just opened on Al Wasl Rd — 240m away", time: "now", icon: "spot" },
    { id: "n2", title: "You earned 15 points", body: "Successful parking handoff. Thanks for sharing!", time: "12m", icon: "points" },
    { id: "n3", title: "Reservation expiring soon", body: "Your reservation ends in 30 seconds", time: "1h", icon: "expire" },
    { id: "n4", title: "Someone reserved your parking", body: "A driver is on their way. ETA 2 min", time: "3h", icon: "reserve" },
  ]);

  useEffect(() => {
    if (user) localStorage.setItem("parkout-user", JSON.stringify(user));
    else localStorage.removeItem("parkout-user");
  }, [user]);

  // countdown tick
  useEffect(() => {
    const t = setInterval(() => {
      setSpots((prev) =>
        prev.map((s) => {
          if (s.status === "leaving" && s.leavingIn > 0) {
            const next = s.leavingIn - 1;
            return { ...s, leavingIn: next, status: next <= 0 ? "available" : "leaving" };
          }
          if (s.status === "reserved" && s.reservedUntil && Date.now() > s.reservedUntil) {
            return { ...s, status: "available", reservedUntil: undefined };
          }
          return s;
        }),
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      signIn: (email, name) =>
        setUser({
          name: name || email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
          email,
          avatar: "",
          points: 120,
          reputation: 4.9,
          shared: 12,
          reservations: 7,
        }),
      signOut: () => setUser(null),
      spots,
      addLeaving: (leaveInMin) => {
        const id = "u-" + Math.random().toString(36).slice(2, 7);
        const newSpot: ParkingSpot = {
          id,
          lat: 50,
          lng: 50,
          status: leaveInMin === 0 ? "available" : "leaving",
          leavingIn: leaveInMin * 60,
          distance: 0,
          eta: 0,
          cost: 10,
          address: "Your current location",
        };
        setSpots((p) => [newSpot, ...p]);
        setActiveLeavingId(id);
        return id;
      },
      cancelLeaving: (id) => {
        setSpots((p) => p.filter((s) => s.id !== id));
        setActiveLeavingId(null);
      },
      reserve: (id) => {
        setSpots((p) =>
          p.map((s) => (s.id === id ? { ...s, status: "reserved", reservedUntil: Date.now() + 90_000 } : s)),
        );
        setActiveReservationId(id);
        setUser((u) => (u ? { ...u, points: Math.max(0, u.points - 10), reservations: u.reservations + 1 } : u));
      },
      activeLeavingId,
      activeReservationId,
      notifications,
    }),
    [user, spots, activeLeavingId, activeReservationId, notifications],
  );

  // suppress unused-setter warnings
  void setNotifications;

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
