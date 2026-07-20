import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Gift, Bell, User } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";

const tabs = [
  { to: "/home", icon: Home, key: "nav_home" as TKey },
  { to: "/search", icon: Search, key: "nav_search" as TKey },
  { to: "/rewards", icon: Gift, key: "nav_rewards" as TKey },
  { to: "/notifications", icon: Bell, key: "nav_alerts" as TKey },
  { to: "/profile", icon: User, key: "nav_profile" as TKey },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-3">
      <div className="pointer-events-auto glass mx-4 flex w-full max-w-[420px] items-center justify-between rounded-3xl px-2 py-2 shadow-[var(--shadow-elevated)]">
        {tabs.map(({ to, icon: Icon, key }) => {
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
              <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
