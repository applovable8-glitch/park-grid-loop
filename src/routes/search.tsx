import { createFileRoute, redirect } from "@tanstack/react-router";

// Search is now merged into the home map experience.
export const Route = createFileRoute("/search")({
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
});
