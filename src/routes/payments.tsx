import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Screen, RowGroup, Row, Card, Badge } from "@/components/kit";

export const Route = createFileRoute("/payments")({ component: PaymentMethods });

const cards = [
  { id: "1", last4: "4242", brand: "Visa", primary: true, exp: "08/28" },
  { id: "2", last4: "0005", brand: "Mastercard", primary: false, exp: "11/26" },
];

function PaymentMethods() {
  return (
    <Screen title="Payment methods" back="/settings" right={<Link to="/payments/add" className="rounded-full bg-primary p-2 text-primary-foreground"><Plus className="h-4 w-4" /></Link>}>
      <div className="space-y-2">
        {cards.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><CreditCard className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{c.brand} · •••• {c.last4}</p>
                <p className="text-xs text-muted-foreground">Exp {c.exp}</p>
              </div>
              {c.primary && <Badge tone="emerald">Primary</Badge>}
              <button onClick={() => toast.success("Card removed")} className="ml-2 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        ))}
      </div>
      <RowGroup title="Records">
        <Row icon={CreditCard} label="Billing history" to="/payments/history" />
        <Row icon={CreditCard} label="Invoices" to="/payments/invoices" />
        <Row icon={CreditCard} label="Subscriptions" to="/payments/subscriptions" />
      </RowGroup>
    </Screen>
  );
}
