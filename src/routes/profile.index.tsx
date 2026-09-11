import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Star, Settings, Bell, HelpCircle, LogOut, ChevronRight, Shield, Pencil, Car, Clock, Award, Users, Gift, MessageCircle, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { maskPlate } from "@/lib/format";

export const Route = createFileRoute("/profile/")({ component: Profile });

function Profile() {
  const { user, session, loading, signOut } = useApp();
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  if (loading || !user) return null;

  const onSignOut = async () => { await signOut(); nav({ to: "/auth" }); };

  const score = Math.round((user.reputation / 5) * 100);
  const scoreLabel = score >= 90 ? (ar ? "ممتاز" : "Excellent") : score >= 75 ? (ar ? "جيد جداً" : "Great") : score >= 60 ? (ar ? "جيد" : "Good") : (ar ? "قيد البناء" : "Building");
  const plate = maskPlate(user.plate);
  const carLine = [user.car_make, user.car_model].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="relative overflow-hidden px-5 pb-8 pt-8 text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -end-16 top-0 h-56 w-56 rounded-full bg-emerald/25 blur-3xl" />
        <div className="relative animate-fade-up flex items-center gap-4">
          <div className="relative">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="h-16 w-16 rounded-3xl object-cover ring-2 ring-white/20" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald text-emerald-foreground font-[var(--font-display)] text-2xl font-bold ring-2 ring-white/20">
                {user.avatar}
              </div>
            )}
            <Link to="/profile/edit" aria-label={t("edit_profile")}
              className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-md">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-[var(--font-display)] text-2xl font-bold">{user.name || t("driver")}</h1>
            <p className="text-xs text-white/60">{ar ? "ملفك في AndiPark" : "Your AndiPark profile"}</p>
            <Link to="/profile/reputation" className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs ring-1 ring-white/15">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold tabular-nums">{user.reputation.toFixed(1)}</span>
              <span className="text-white/60">{t("reputation")}</span>
            </Link>
          </div>
        </div>

        {/* AndiScore */}
        <Link to="/profile/reputation" className="press relative mt-5 block rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">AndiScore</p>
            <p className="text-xs font-semibold text-white/80">{scoreLabel}</p>
          </div>
          <p className="mt-1 font-[var(--font-display)] text-3xl font-bold tabular-nums">{score}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[color:var(--emerald)] transition-[width] duration-[var(--dur-slow,360ms)]" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
          </div>
        </Link>

        {/* Community stats */}
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Link to="/rewards"><MiniStat label={t("points")} value={user.points} /></Link>
          <Link to="/leaving/history"><MiniStat label={ar ? "مواقف تمت مشاركتها" : "Spots shared"} value={user.shared} /></Link>
          <Link to="/profile/reservations"><MiniStat label={ar ? "عمليات ركن ناجحة" : "Connections"} value={user.reservations} /></Link>
        </div>

        <div className="relative mt-4">
          <ThemeToggle variant="onHero" />
        </div>
      </header>

      <div className="px-4 pt-6">
        {/* Vehicle */}
        <SectionTitle>{ar ? "سيارتي" : "My vehicle"}</SectionTitle>
        <Link to="/profile/vehicles" className="press mt-2 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/12 text-[color:var(--emerald)]"><Car className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{carLine || (ar ? "أضف سيارتك" : "Add your vehicle")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {plate ? `${ar ? "اللوحة" : "Plate"}: ${plate}` : t("add_plate")}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
        </Link>

        {/* Account */}
        <SectionTitle className="mt-6">{ar ? "الحساب" : "Account"}</SectionTitle>
        <Group>
          <Link to="/profile/edit"><Row icon={Pencil} label={t("edit_profile")} hint={t("edit_profile_hint")} /></Link>
          <Link to="/messages"><Row icon={MessageCircle} label={ar ? "الرسائل" : "Messages"} hint={ar ? "محادثاتك مع السائقين" : "Your driver chats"} /></Link>
          <Link to="/profile/history"><Row icon={Clock} label={t("parking_history")} hint={t("all_shares")} /></Link>
          <Link to="/profile/stats"><Row icon={Award} label={t("statistics")} hint={t("stats_hint")} /></Link>
          <Link to="/rewards/invite">
            <Row icon={Gift}
              label={ar ? "الدعوات والإحالة" : "Invite & referrals"}
              hint={user.referral_code ? `${ar ? "رمزك" : "Your code"} · ${user.referral_code}` : ar ? "امنح 100، واربح 100" : "Give 100, get 100"} />
          </Link>
        </Group>

        {/* Preferences */}
        <SectionTitle className="mt-6">{ar ? "التفضيلات" : "Preferences"}</SectionTitle>
        <Group>
          <Link to="/settings/language"><Row icon={Settings} label={t("language")} hint={lang.toUpperCase()} /></Link>
          <Link to="/settings/theme"><Row icon={Settings} label={t("theme")} hint={user.theme} /></Link>
          <Link to="/settings/notifications"><Row icon={Bell} label={t("notifications")} hint={notifSummary(user.notification_prefs, t)} /></Link>
        </Group>

        {/* Privacy & Safety */}
        <SectionTitle className="mt-6">{ar ? "الخصوصية والأمان" : "Privacy & Safety"}</SectionTitle>
        <Group>
          <Link to="/settings/privacy"><Row icon={Shield} label={t("privacy")} hint={user.location_prefs.share_location ? t("location_on") : t("location_off")} /></Link>
          <Link to="/reports/blocked"><Row icon={ShieldAlert} label={ar ? "المستخدمون المحظورون" : "Blocked users"} hint={ar ? "إدارة الحظر" : "Manage blocks"} /></Link>
          <Link to="/settings/security"><Row icon={Shield} label={ar ? "الأمان" : "Safety"} hint={ar ? "كلمة المرور والجلسات" : "Password & sessions"} /></Link>
        </Group>

        {/* Community */}
        <SectionTitle className="mt-6">{ar ? "المجتمع" : "Community"}</SectionTitle>
        <Group>
          <Link to="/community"><Row icon={Users} label={t("community")} hint={t("community_hint")} /></Link>
          <Link to="/profile/badges"><Row icon={Award} label={t("all_badges")} hint={t("achievements")} /></Link>
          <Link to="/rewards/leaderboard"><Row icon={Star} label={t("leaderboard")} hint={ar ? "ترتيب السائقين" : "Top drivers"} /></Link>
          <Link to="/help"><Row icon={HelpCircle} label={t("help_center")} hint={t("help_hint")} /></Link>
          <Link to="/settings"><Row icon={Settings} label={t("settings")} hint={ar ? "كل الإعدادات" : "All settings"} /></Link>
        </Group>

        <button onClick={onSignOut} className="press mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-semibold text-[color:var(--danger)] shadow-[var(--shadow-card)]">
          <LogOut className="h-4 w-4 rtl:-scale-x-100" /> {t("sign_out")}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground ${className}`}>{children}</h2>;
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 divide-y divide-border/60 rounded-2xl bg-card px-1 shadow-[var(--shadow-card)]">{children}</div>;
}

function notifSummary(p: { push: boolean; nearby_spots: boolean; reservations: boolean; points: boolean }, t: (k: "all_off" | "notifications_hint_on") => string) {
  const anyOn = p.push || p.nearby_spots || p.reservations || p.points;
  return anyOn ? t("notifications_hint_on") : t("all_off");
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-2.5 text-center ring-1 ring-white/15 backdrop-blur-md">
      <p className="font-[var(--font-display)] text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-white/60">{label}</p>
    </div>
  );
}

function Row({ icon: Icon, label, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition-colors hover:bg-muted/60">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
    </div>
  );
}
