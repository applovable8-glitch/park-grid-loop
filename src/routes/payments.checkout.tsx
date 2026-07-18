import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Screen, Card, Button } from "@/components/kit";
import { CreditCard, Lock } from "lucide-react";

export const Route = createFileRoute("/payments/checkout")({ component: Checkout });

function Checkout() {
  const nav = useNavigate();
  return (
    <Screen title="Checkout" back="/rewards/buy">
      <Card>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Order summary</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm">500 points pack</span>
          <span className="font-semibold">AED 39.00</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>VAT (5%)</span><span>AED 1.95</span>
        </div>
        <div className="my-3 h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-[var(--font-display)] text-xl font-bold">AED 40.95</span>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><CreditCard className="h-5 w-5" /></div>
          <div className="flex-1"><p className="text-sm font-semibold">Visa •••• 4242</p><p className="text-xs text-muted-foreground">Exp 08/28</p></div>
          <button onClick={() => nav({ to: "/payments" })} className="text-xs font-semibold text-[color:var(--emerald)]">Change</button>
        </div>
      </Card>

      <div className="mt-6"><Button variant="emerald" onClick={() => nav({ to: "/payments/success" })}><Lock className="h-4 w-4" /> Pay AED 40.95</Button></div>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">Secure payment · Encrypted end-to-end</p>
    </Screen>
  );
}
