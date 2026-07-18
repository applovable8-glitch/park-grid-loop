import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/kit";

export const Route = createFileRoute("/help/privacy")({ component: () => (
  <Screen title="Privacy policy" back="/help">
    <article className="prose prose-sm max-w-none space-y-3 text-sm text-foreground/90">
      <p>ParkOut respects your privacy. We collect only what's needed to help you share and find parking.</p>
      <h3 className="font-[var(--font-display)] text-base font-bold">What we collect</h3>
      <p>Account data (name, email), device identifiers, and the parking coordinates you choose to share.</p>
      <h3 className="font-[var(--font-display)] text-base font-bold">How we use it</h3>
      <p>We use your data to match parking opportunities, keep the community safe, and improve the app.</p>
      <h3 className="font-[var(--font-display)] text-base font-bold">Sharing</h3>
      <p>We never sell your data. We share only with service providers essential to running ParkOut.</p>
      <h3 className="font-[var(--font-display)] text-base font-bold">Your rights</h3>
      <p>You can access, correct, or delete your data any time from Settings → Privacy.</p>
    </article>
  </Screen>
) });
