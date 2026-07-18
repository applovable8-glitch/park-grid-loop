import { createFileRoute, Link } from "@tanstack/react-router";
import { ErrorState, Button } from "@/components/kit";

export const Route = createFileRoute("/payments/failed")({ component: () => (
  <div className="min-h-screen bg-background">
    <ErrorState title="Payment failed" description="Your card was declined. Try again or use a different payment method."
      action={<div className="space-y-2">
        <Link to="/payments/checkout"><Button variant="emerald">Try again</Button></Link>
        <Link to="/payments/add"><Button variant="secondary">Use another card</Button></Link>
      </div>} />
  </div>
) });
