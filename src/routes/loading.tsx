import { createFileRoute } from "@tanstack/react-router";
import { SkeletonList, SkeletonMap, Screen } from "@/components/kit";

export const Route = createFileRoute("/loading")({ component: () => (
  <Screen title="Loading" back="/home">
    <SkeletonMap />
    <div className="mt-4"><SkeletonList n={4} /></div>
  </Screen>
) });
