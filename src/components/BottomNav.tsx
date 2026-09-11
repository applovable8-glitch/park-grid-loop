import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Gift, Bell, User, Zap, Clock } from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { useApp } from "@/lib/parkout-store";
import { useUnreadNotifs } from "@/lib/use-unread-notifs";
import { useMySharedSpot, clockOf } from "@/lib/parking-live";

const left = [
  { to: "/home", icon: Home, key: "nav_home" as TKey },
  { to: "/rewards", icon: Gift, key: "nav_rewards" as TKey },
] as const;

const right = [
  { to: "/notifications", icon: Bell, key: "nav_alerts" as TKey },
  { to: "/profile", icon: User, key: "nav_profile" as TKey },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  const { user } = useApp();
  const unread = useUnreadNotifs(user?.id);
  const { spot: mySpot } = useMySharedSpot(user?.id);

  const Tab = ({ to, icon: Icon, tkey: k }: { to: string; icon: typeof Home; tkey: TKey }) => {
    const active = pathname === to || pathname.startsWith(`${to}/`) || (to === "/home" && pathname === "/");
    const badge = to === "/notifications" ? unread : 0;
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className="press group relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5"
      >
        <div className="relative flex h-6 w-6 items-center justify-center">
          <Icon
            className={`h-[21px] w-[21px] transition-colors duration-200 ${
              active ? "text-[color:var(--emerald)]" : "text-muted-foreground group-hover:text-foreground"
            }`}
            strokeWidth={active ? 2.5 : 2}
          />
          {badge > 0 && (
            <span className="animate-scale-in absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white ring-2 ring-card">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] leading-none transition-colors duration-200 ${
            active ? "font-bold text-foreground" : "font-medium text-muted-foreground"
          }`}
        >
          {t(k)}
        </span>
        <span
          className={`h-1 w-1 rounded-full transition-all duration-200 ${
            active ? "bg-[var(--emerald)] opacity-100" : "opacity-0"
          }`}
        />
      </Link>
    );
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto glass mx-4 flex w-full max-w-[420px] items-center justify-between rounded-[26px] px-2 py-2 shadow-[var(--shadow-elevated)]">
        {left.map((tab) => <Tab key={tab.to} to={tab.to} icon={tab.icon} tkey={tab.key} />)}

        {/* Centered "I'm Leaving" — the most important action in the app */}
        <div className="relative flex w-[84px] shrink-0 justify-center">
          <Link
            to="/leaving"
            aria-label={t("im_leaving")}
            className={`press -mt-8 flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full text-white ring-4 ring-card ${
              mySpot ? "" : "pulse-emerald"
            }`}
            style={{ background: "var(--gradient-emerald)", boxShadow: "var(--shadow-glow)" }}
          >
            {mySpot ? (
              <>
                <Clock className="h-[18px] w-[18px]" strokeWidth={2.4} />
                <span className="mt-0.5 text-[10px] font-bold leading-none tabular-nums">
                  {clockOf(mySpot.planned_leave_at ?? mySpot.leave_at)}
                </span>
              </>
            ) : (
              <>
                <Zap className="h-[20px] w-[20px] fill-white" />
                <span className="mt-0.5 text-[9px] font-bold leading-none">{t("im_leaving")}</span>
              </>
            )}
          </Link>
        </div>

        {right.map((tab) => <Tab key={tab.to} to={tab.to} icon={tab.icon} tkey={tab.key} />)}
      </div>
    </nav>
  );
}
