import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Gift, Bell, User } from "lucide-react";

const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/rewards", icon: Gift, label: "Rewards" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-3">
      <div className="pointer-events-auto glass mx-4 flex w-full max-w-[420px] items-center justify-between rounded-3xl px-2 py-2 shadow-[var(--shadow-elevated)]">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to === "/home" && pathname === "/");
          return (
            <Link
              key={to}
              to={to}
              className="group relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                  active ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
