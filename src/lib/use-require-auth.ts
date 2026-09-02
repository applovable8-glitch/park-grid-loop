import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/parkout-store";

/** Redirects to /auth when there is no authenticated session. Returns true while auth is still loading or user is unauthenticated. */
export function useRequireAuth() {
  const { session, loading } = useApp();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);
  return { ready: !loading && !!session, loading };
}

/** Profile fields every user must complete before using the app. */
export function isProfileComplete(user: { name?: string | null; phone?: string | null; plate?: string | null } | null | undefined) {
  return !!(user && user.name?.trim() && user.phone?.trim() && user.plate?.trim());
}

/** Redirects to /auth when signed out, and to /create-profile while the required profile info (name, phone, plate) is missing. */
export function useRequireProfile() {
  const { session, user, loading } = useApp();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!session) { nav({ to: "/auth" }); return; }
    if (user && !isProfileComplete(user)) nav({ to: "/create-profile" });
  }, [loading, session, user, nav]);
  return { ready: !loading && !!session && isProfileComplete(user), loading };
}
