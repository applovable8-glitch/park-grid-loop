import { createFileRoute, Link } from "@tanstack/react-router";
import { SuccessState, Button } from "@/components/kit";

export const Route = createFileRoute("/payments/success")({ component: () => (
  <div className="min-h-screen bg-background">
    <SuccessState title="Payment successful" description="500 points have been added to your balance."
      action={<div className="space-y-2">
        <Link to="/rewards"><Button variant="emerald">View balance</Button></Link>
        <Link to="/payments/history"><Button variant="secondary">See receipt</Button></Link>
      </div>} />
  </div>
) });
