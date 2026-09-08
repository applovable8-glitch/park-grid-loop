import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/")({ component: Splash });

function Splash() {
  const navigate = useNavigate();
  const { session, loading } = useApp();
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => navigate({ to: session ? "/home" : "/auth" }), 900);
    return () => clearTimeout(t);
  }, [navigate, session, loading]);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden text-white" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute -start-20 top-20 h-64 w-64 rounded-full bg-emerald/30 blur-3xl" />
      <div className="absolute -end-16 bottom-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative flex flex-col items-center gap-5 animate-scale-in">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-[32px] bg-white/95 p-3 ring-1 ring-white/30 shadow-[var(--shadow-elevated)]">
          <img src="/andipark-logo.png" alt="AndiPark" className="h-full w-full object-contain" />
        </div>
        <div className="text-center">
          <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight">
            Andi<span className="text-[color:var(--emerald)]">Park</span>
          </h1>
          <p className="mt-1 text-sm text-white/70">You Leave. They Park.</p>
        </div>
      </div>

      <div className="absolute bottom-10 flex items-center gap-1.5 text-xs text-white/60">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" />
        Loading nearby spots…
      </div>
    </div>
  );
}
