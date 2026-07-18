import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/verify-phone")({ component: VerifyPhone });

function VerifyPhone() {
  const [phone, setPhone] = useState("");
  const nav = useNavigate();
  return (
    <Screen title="Verify phone" back="/profile/edit">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]">
        <Phone className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-[var(--font-display)] text-xl font-bold">Add your number</h2>
      <p className="mt-1 text-sm text-muted-foreground">We'll send a 6-digit code by SMS.</p>

      <form onSubmit={(e) => { e.preventDefault(); if (!phone) return toast.error("Enter a phone number"); nav({ to: "/otp" }); }} className="mt-6 space-y-4">
        <Field label="Phone number">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+971 50 000 0000" className={inputCls} />
        </Field>
        <Button type="submit">Send code</Button>
      </form>
    </Screen>
  );
}
