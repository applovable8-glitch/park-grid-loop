import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Screen, Button } from "@/components/kit";

export const Route = createFileRoute("/otp")({ component: Otp });

function Otp() {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [left, setLeft] = useState(30);
  const nav = useNavigate();

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const onChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const submit = () => {
    if (digits.join("").length !== 6) return toast.error("Enter all 6 digits");
    toast.success("Verified");
    nav({ to: "/create-profile" });
  };

  return (
    <Screen title="Enter code" back="/verify-phone">
      <p className="text-sm text-muted-foreground">We sent a 6-digit code to your phone. Enter it below.</p>
      <div className="mt-6 flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i} ref={(el) => { refs.current[i] = el; }} value={d}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }}
            className="h-14 w-12 rounded-2xl border border-border bg-card text-center text-xl font-bold outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15"
            inputMode="numeric" maxLength={1}
          />
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {left > 0 ? `Resend in ${left}s` : <button className="underline" onClick={() => setLeft(30)}>Resend code</button>}
      </p>
      <div className="mt-6"><Button onClick={submit}>Verify</Button></div>
    </Screen>
  );
}
