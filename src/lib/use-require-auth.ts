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
