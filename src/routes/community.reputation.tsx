import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";

export const Route = createFileRoute("/community/reputation")({ component: () => (
  <Screen title="How reputation works" back="/community">
    <Card>
      <p className="text-sm">Your reputation score reflects how reliable and helpful you are. It's a number between 1.0 and 5.0.</p>
      <ul className="mt-3 space-y-2 text-sm">
        <li>• Every successful handoff nudges your score up.</li>
        <li>• Cancelled shares or expired reservations lower it slightly.</li>
        <li>• Reports from other drivers are reviewed by the trust team.</li>
        <li>• Reputation above 4.8 unlocks priority alerts.</li>
      </ul>
    </Card>
  </Screen>
) });
