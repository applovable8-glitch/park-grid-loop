import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/kit";

export const Route = createFileRoute("/help/terms")({ component: () => (
  <Screen title="Terms & conditions" back="/help">
    <article className="prose prose-sm max-w-none space-y-3 text-sm text-foreground/90">
      <p>By using AndiPark, you agree to these terms.</p>
      <h3 className="font-[var(--font-display)] text-base font-bold">Service</h3>
      <p>AndiPark is a community platform. Parking is shared voluntarily. We are not liable for missed handoffs.</p>
      <h3 className="font-[var(--font-display)] text-base font-bold">Points</h3>
      <p>Points have no cash value and cannot be transferred outside AndiPark.</p>
      <h3 className="font-[var(--font-display)] text-base font-bold">Conduct</h3>
      <p>Behave respectfully. False shares or fake reservations may result in account suspension.</p>
    </article>
  </Screen>
) });
