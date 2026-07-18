import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Zap, Gift, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/welcome")({ component: Welcome });

function Welcome() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-emerald/30 blur-3xl" />
      <div className="absolute -right-16 bottom-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative flex-1 px-6 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
          <MapPin className="h-10 w-10 text-white" fill="var(--emerald)" strokeWidth={2.2} />
        </div>
        <h1 className="mt-8 font-[var(--font-display)] text-4xl font-bold leading-tight">Parking, powered by your neighborhood.</h1>
        <p className="mt-3 text-base text-white/70">Find a spot the moment someone's leaving. Share yours to earn points.</p>

        <div className="mt-10 space-y-3">
          {[
            { icon: Zap, t: "Real-time spot alerts", d: "See parking as it opens up." },
            { icon: MapPin, t: "Reserve in one tap", d: "90-second lock so no one takes it." },
            { icon: Gift, t: "Earn on every share", d: "Turn points into rewards." },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald text-emerald-foreground"><f.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold">{f.t}</p>
                <p className="text-xs text-white/60">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative space-y-3 px-6 pb-10">
        <Link to="/onboarding" className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-foreground">
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/auth" className="block text-center text-sm text-white/70">I already have an account</Link>
      </div>
    </div>
  );
}
