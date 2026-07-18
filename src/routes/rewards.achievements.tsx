import { createFileRoute } from "@tanstack/react-router";
import { Award, Share2, CheckCircle2, Star, Zap, MapPin } from "lucide-react";
import { Screen, Card } from "@/components/kit";

export const Route = createFileRoute("/rewards/achievements")({ component: Ach });

const list = [
  { icon: Share2, title: "First share", desc: "Share your first parking", done: true },
  { icon: CheckCircle2, title: "10 handoffs", desc: "10 successful spot handoffs", done: true },
  { icon: Star, title: "5-star driver", desc: "Reach 5.0 reputation", done: true },
  { icon: Zap, title: "Speed sharer", desc: "Share within 30s of leaving", done: false },
  { icon: MapPin, title: "City explorer", desc: "Share from 10 different areas", done: false },
  { icon: Award, title: "Top 10 in city", desc: "Rank top 10 in your city", done: false },
];

function Ach() {
  return (
    <Screen title="Achievements" back="/rewards">
      <div className="grid grid-cols-2 gap-3">
        {list.map((a) => (
          <Card key={a.title} className={a.done ? "" : "opacity-60"}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${a.done ? "bg-emerald/15 text-[color:var(--emerald)]" : "bg-muted text-muted-foreground"}`}>
              <a.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">{a.title}</p>
            <p className="text-xs text-muted-foreground">{a.desc}</p>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
