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

  const Tab = ({ to, icon: Icon, key: k }: { to: string; icon: typeof Home; key: TKey }) => {
    const active = pathname === to || (to === "/home" && pathname === "/");
    const badge = to === "/notifications" ? unread : 0;
    return (
      <Link
        to={to}
        className="group relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors"
      >
        <div
          className={`relative flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
            active ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          {badge > 0 && (
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--emerald)] px-1 text-[9px] font-bold text-white shadow">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{t(k)}</span>
      </Link>
    );
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-3">
      <div className="pointer-events-auto glass mx-4 flex w-full max-w-[420px] items-center justify-between rounded-3xl px-2 py-2 shadow-[var(--shadow-elevated)]">
        {left.map((tab) => <Tab key={tab.to} {...tab} />)}

        {/* Centered "I'm Leaving" action */}
        <div className="relative flex w-[86px] shrink-0 justify-center">
          <Link
            to="/leaving"
            aria-label={t("im_leaving")}
            className={`-mt-9 flex flex-col items-center justify-center rounded-full text-white shadow-[var(--shadow-elevated)] ${
              mySpot ? "h-16 w-16" : "h-16 w-16 pulse-emerald"
            }`}
            style={{ background: "var(--gradient-emerald)" }}
          >
            {mySpot ? (
              <>
                <Clock className="h-4 w-4" />
                <span className="mt-0.5 text-[10px] font-bold leading-none">
                  {clockOf(mySpot.planned_leave_at ?? mySpot.leave_at)}
                </span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 fill-white" />
                <span className="mt-0.5 text-[9px] font-bold leading-none">{t("im_leaving")}</span>
              </>
            )}
          </Link>
        </div>

        {right.map((tab) => <Tab key={tab.to} {...tab} />)}
      </div>
    </nav>
  );
}
