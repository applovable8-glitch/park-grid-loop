import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SuccessState, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/payments/success")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  component: PaymentSuccess,
});

function PaymentSuccess() {
  const { refreshProfile } = useApp();

  useEffect(() => {
    // Points are credited by the payment webhook; poll briefly so the balance updates.
    const timers = [1000, 3000, 6000].map((ms) => setTimeout(() => { void refreshProfile(); }, ms));
    return () => timers.forEach(clearTimeout);
  }, [refreshProfile]);

  return (
    <div className="min-h-screen bg-background">
      <SuccessState
        title="Payment successful"
        description="Your points will appear in your balance in a few seconds."
        action={
          <div className="space-y-2">
            <Link to="/rewards"><Button variant="emerald">View balance</Button></Link>
            <Link to="/rewards/history"><Button variant="secondary">See points history</Button></Link>
          </div>
        }
      />
    </div>
  );
}
