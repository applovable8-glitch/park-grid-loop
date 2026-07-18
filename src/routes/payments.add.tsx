import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/payments/add")({ component: AddCard });

function AddCard() {
  const nav = useNavigate();
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (num.replace(/\s/g, "").length < 12) return toast.error("Enter a valid card number");
    toast.success("Card added");
    nav({ to: "/payments" });
  };
  return (
    <Screen title="Add card" back="/payments">
      <div className="mb-4 rounded-3xl p-5 text-white shadow-[var(--shadow-elevated)]" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-center gap-2 text-xs text-white/70"><CreditCard className="h-4 w-4" /> New card</div>
        <p className="mt-6 font-[var(--font-display)] text-2xl font-bold tracking-widest">{num || "•••• •••• •••• ••••"}</p>
        <div className="mt-4 flex justify-between text-xs text-white/70">
          <span>{name || "CARDHOLDER"}</span>
          <span>{exp || "MM/YY"}</span>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Card number"><input value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))} className={inputCls} placeholder="4242 4242 4242 4242" inputMode="numeric" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry"><input value={exp} onChange={(e) => setExp(e.target.value.replace(/[^\d/]/g, "").slice(0, 5))} className={inputCls} placeholder="MM/YY" /></Field>
          <Field label="CVC"><input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} className={inputCls} placeholder="123" inputMode="numeric" /></Field>
        </div>
        <Field label="Name on card"><input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className={inputCls} placeholder="ALEX DRIVER" /></Field>
        <Button type="submit" variant="emerald">Add card</Button>
      </form>
    </Screen>
  );
}
