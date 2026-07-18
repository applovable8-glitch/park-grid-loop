import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card } from "@/components/kit";
import { Award, Star, Shield, Zap, Users, MapPin } from "lucide-react";

export const Route = createFileRoute("/profile/badges")({ component: Badges });

const badges = [
  { icon: Star, name: "5-Star Driver", tone: "text-yellow-500" },
  { icon: Zap, name: "Speed Sharer", tone: "text-[color:var(--emerald)]" },
  { icon: Shield, name: "Trusted", tone: "text-blue-500" },
  { icon: Users, name: "Community Hero", tone: "text-pink-500" },
  { icon: MapPin, name: "Neighborhood Legend", tone: "text-purple-500" },
  { icon: Award, name: "Top 10", tone: "text-orange-500" },
];

function Badges() {
  return (
    <Screen title="Badges" back="/profile">
      <div className="grid grid-cols-3 gap-3">
        {badges.map((b) => (
          <Card key={b.name} className="text-center">
            <b.icon className={`mx-auto h-8 w-8 ${b.tone}`} />
            <p className="mt-2 text-[11px] font-semibold">{b.name}</p>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
