import { createFileRoute } from "@tanstack/react-router";
import { Screen, Row, RowGroup } from "@/components/kit";
import { Users, Trophy, Crown, Shield, Gift, Sparkles } from "lucide-react";

export const Route = createFileRoute("/community/")({ component: () => (
  <Screen title="Community" back="/profile">
    <RowGroup title="Earn together">
      <Row icon={Users} label="Invite friends" hint="Give 100 pts, get 100 pts" to="/rewards/invite" />
      <Row icon={Gift} label="Referral program" to="/community/referral" />
      <Row icon={Sparkles} label="Daily rewards" to="/rewards/daily" />
    </RowGroup>
    <RowGroup title="Community">
      <Row icon={Trophy} label="Leaderboard" to="/rewards/leaderboard" />
      <Row icon={Crown} label="Top contributors" to="/community/top" />
      <Row icon={Shield} label="Community guidelines" to="/community/guidelines" />
      <Row icon={Shield} label="How reputation works" to="/community/reputation" />
    </RowGroup>
  </Screen>
) });
