import { createFileRoute } from "@tanstack/react-router";
import { Screen, Card, Button } from "@/components/kit";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/payments/invoices")({ component: () => (
  <Screen title="Invoices" back="/payments">
    <div className="space-y-2">
      {["INV-2026-0812", "INV-2026-0805", "INV-2026-0722"].map((n) => (
        <Card key={n}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><FileText className="h-4 w-4" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{n}</p>
              <p className="text-xs text-muted-foreground">PDF · Paid</p>
            </div>
            <button onClick={() => toast.success("Invoice downloaded")} className="rounded-full bg-muted p-2"><Download className="h-4 w-4" /></button>
          </div>
        </Card>
      ))}
    </div>
    <div className="mt-6"><Button variant="secondary" onClick={() => toast.info("Sending all invoices to your email…")}>Email all invoices</Button></div>
  </Screen>
) });
