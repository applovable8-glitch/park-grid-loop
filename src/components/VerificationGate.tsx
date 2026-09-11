import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/parkout-store";
import { getVerificationSettings } from "@/lib/auth-settings.functions";

const EXEMPT = ["/auth", "/verify-email", "/onboarding", "/admin", "/reset-password"];

/**
 * Enforces the verification policy configured by admins. When email verification is
 * required, a signed-in user with an unconfirmed email cannot reach app screens.
 */
export function VerificationGate() {
  const nav = useNavigate();
  const { session, loading } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: policy } = useQuery({
    queryKey: ["auth", "verification-policy"],
    queryFn: () => getVerificationSettings(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (loading || !session?.user || !policy?.emailVerification) return;
    if (EXEMPT.some((p) => pathname.startsWith(p))) return;
    if (!session.user.email_confirmed_at) nav({ to: "/verify-email" });
  }, [loading, session, policy, pathname, nav]);

  return null;
}
