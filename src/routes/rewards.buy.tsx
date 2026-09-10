import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Screen, Card, Button } from "@/components/kit";
import { POINT_PACKS } from "@/lib/stripe";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/rewards/buy")({ component: BuyPoints });

function BuyPoints() {
  const { session } = useApp();
  const [sel, setSel] = useState(1);
  const [paying, setPaying] = useState(false);
  const pack = POINT_PACKS[sel]!;

  return (
    <Screen title="Buy points" back="/rewards">
      <PaymentTestModeBanner />
      <p className="mt-3 text-sm text-muted-foreground">Reserve without waiting — top up your point balance.</p>

      {!paying && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {POINT_PACKS.map((p, i) => (
              <button
                key={p.priceId}
                onClick={() => setSel(i)}
                className={`relative rounded-3xl p-4 text-start shadow-[var(--shadow-card)] ring-1 transition ${sel === i ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-transparent"}`}
              >
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
              <span className="font-[var(--font-display)] text-lg font-bold">{pack.pts} pts</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{pack.price}</span>
            </div>
          </Card>

          <div className="mt-4">
            <Button variant="emerald" onClick={() => setPaying(true)}>Continue to payment</Button>
          </div>
        </>
      )}

      {paying && (
        <div className="mt-4">
          <StripeEmbeddedCheckout
            priceId={pack.priceId}
            points={pack.pts}
            customerEmail={session?.user?.email ?? undefined}
            userId={session?.user?.id ?? undefined}
            returnUrl={`${window.location.origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`}
          />
          <button onClick={() => setPaying(false)} className="mt-4 w-full text-center text-xs text-muted-foreground underline">
            Choose another package
          </button>
        </div>
      )}
    </Screen>
  );
}
