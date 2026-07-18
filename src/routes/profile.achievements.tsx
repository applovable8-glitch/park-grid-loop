import { createFileRoute } from "@tanstack/react-router";
import { Rewards } from "@/routes/rewards.achievements";
export const Route = createFileRoute("/profile/achievements")({ component: Rewards });
