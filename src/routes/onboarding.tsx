import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Zap, Gift, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const steps = [
  { icon: MapPin, title: "See every free spot", body: "Live parking around you, updated the second someone leaves." },
  { icon: Zap, title: "Reserve instantly", body: "One tap and the spot is locked for 90 seconds. Drive straight to it." },
  { icon: Gift, title: "Share & earn", body: "Tell drivers when you're leaving. Every handoff earns points." },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute -end-16 top-20 h-72 w-72 rounded-full bg-emerald/30 blur-3xl" />
      <div className="flex justify-end px-6 pt-6">
        <Link to="/auth" className="text-sm text-white/70">Skip</Link>
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-8 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[36px] bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
          <step.icon className="h-14 w-14 text-white" strokeWidth={2} />
        </div>
        <h1 className="mt-8 font-[var(--font-display)] text-3xl font-bold">{step.title}</h1>
        <p className="mt-3 text-base text-white/70">{step.body}</p>
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 pb-10">
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
          ))}
        </div>
        <button
          onClick={() => (last ? nav({ to: "/auth" }) : setI((v) => v + 1))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-foreground"
        >
          {last ? "Create account" : "Next"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
