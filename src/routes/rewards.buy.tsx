import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Screen, Card, Button } from "@/components/kit";

export const Route = createFileRoute("/rewards/buy")({ component: BuyPoints });

const packs = [
  { pts: 100, price: "AED 9", tag: null },
  { pts: 500, price: "AED 39", tag: "Popular" },
  { pts: 1200, price: "AED 79", tag: "Best value" },
  { pts: 3000, price: "AED 179", tag: null },
];

function BuyPoints() {
  const nav = useNavigate();
  const [sel, setSel] = useState(1);
  return (
    <Screen title="Buy points" back="/rewards">
      <p className="text-sm text-muted-foreground">Reserve without waiting — top up your point balance.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {packs.map((p, i) => (
          <button key={p.pts} onClick={() => setSel(i)} className={`relative rounded-3xl p-4 text-start shadow-[var(--shadow-card)] ring-1 transition ${sel === i ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-transparent"}`}>
            {p.tag && <span className="absolute -top-2 end-3 rounded-full bg-[var(--emerald)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">{p.tag}</span>}
            <Sparkles className={`h-4 w-4 ${sel === i ? "text-white" : "text-[color:var(--emerald)]"}`} />
            <p className="mt-2 font-[var(--font-display)] text-2xl font-bold">{p.pts}</p>
            <p className={`text-xs ${sel === i ? "text-white/70" : "text-muted-foreground"}`}>points</p>
            <p className="mt-2 text-sm font-semibold">{p.price}</p>
          </button>
        ))}
      </div>
      <Card className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">You'll receive</span>
          <span className="font-[var(--font-display)] text-lg font-bold">{packs[sel].pts} pts</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{packs[sel].price}</span>
        </div>
      </Card>
      <div className="mt-4"><Button variant="emerald" onClick={() => nav({ to: "/payments/checkout" })}>Continue to payment</Button></div>
    </Screen>
  );
}
