import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useApp } from "./parkout-store";

export type Lang = "en" | "ar";

const dict = {
  en: {
    // Nav
    nav_home: "Home", nav_search: "Search", nav_rewards: "Rewards", nav_alerts: "Alerts", nav_profile: "Profile",
    // Common
    back: "Back", close: "Close", save: "Save", cancel: "Cancel", continue: "Continue", loading: "Loading…",
    // Home
    current_area: "Current area", where_park: "Where do you want to park?",
    live: "live", around_you: "Around you", live_parking: "Live parking",
    open: "open", soon: "soon", available: "Available", reserved: "Reserved",
    available_now: "Available now", leaving_in: "Leaving in",
    distance: "Distance", eta: "ETA", cost: "Cost", pts: "pts",
    reserve_lock: "Reserve · 90s lock", im_leaving: "I'm Leaving",
    // Auth
    welcome_back: "Welcome back.", join_movement: "Join the movement.",
    auth_tagline: "Find parking. Share parking. Earn points.",
    log_in: "Log in", sign_up: "Sign up", create_account: "Create account",
    name: "Name", email: "Email", password: "Password",
    forgot_password: "Forgot password?", or_continue_with: "or continue with",
    terms_agree: "By continuing you agree to ParkOut's Terms and Privacy Policy.",
    // Settings
    settings: "Settings",
    preferences: "Preferences", appearance_language: "Appearance & language",
    accounts_permissions: "Accounts & permissions", more: "More",
    notifications: "Notifications", privacy: "Privacy", location: "Location", security: "Security",
    app_preferences: "App preferences",
    language: "Language", theme: "Theme", units: "Units",
    permissions: "Permissions", connected_accounts: "Connected accounts",
    help_center: "Help center", terms_privacy: "Terms & privacy", community: "Community",
    language_updated: "Language updated",
    // Profile
    driver: "Driver", reputation: "reputation",
    points: "Points", shared: "Shared", reservations: "Reserved",
    edit_profile: "Edit profile", edit_profile_hint: "Name, phone, vehicle plate",
    my_vehicles: "My vehicles", add_plate: "Add your plate",
    parking_history: "Parking history", all_shares: "All your shares & reservations",
    statistics: "Statistics", stats_hint: "Your activity at a glance",
    payment_methods: "Payment methods", payment_hint: "Cards, invoices, subscriptions",
    community_hint: "Invite, leaderboard, referrals",
    help_hint: "FAQ, contact, chat",
    notifications_hint_on: "On", location_on: "Location sharing on", location_off: "Location sharing off",
    all_off: "All off",
    achievements: "Achievements", all_badges: "All badges", leaderboard: "Leaderboard",
    sign_out: "Sign out",
  },
  ar: {
    nav_home: "الرئيسية", nav_search: "بحث", nav_rewards: "المكافآت", nav_alerts: "التنبيهات", nav_profile: "حسابي",
    back: "رجوع", close: "إغلاق", save: "حفظ", cancel: "إلغاء", continue: "متابعة", loading: "جارٍ التحميل…",
    current_area: "المنطقة الحالية", where_park: "أين تريد أن تركن؟",
    live: "مباشر", around_you: "حولك", live_parking: "مواقف مباشرة",
    open: "متاح", soon: "قريباً", available: "متاح", reserved: "محجوز",
    available_now: "متاح الآن", leaving_in: "يغادر خلال",
    distance: "المسافة", eta: "الوصول", cost: "التكلفة", pts: "نقطة",
    reserve_lock: "احجز · قفل ٩٠ ثانية", im_leaving: "أنا مغادر",
    welcome_back: "مرحبًا بعودتك.", join_movement: "انضم إلينا.",
    auth_tagline: "اعثر على موقف. شارك موقفك. اكسب نقاطًا.",
    log_in: "تسجيل الدخول", sign_up: "إنشاء حساب", create_account: "إنشاء حساب",
    name: "الاسم", email: "البريد الإلكتروني", password: "كلمة المرور",
    forgot_password: "نسيت كلمة المرور؟", or_continue_with: "أو تابع باستخدام",
    terms_agree: "بمتابعتك فأنت توافق على شروط ParkOut وسياسة الخصوصية.",
    settings: "الإعدادات",
    preferences: "التفضيلات", appearance_language: "المظهر واللغة",
    accounts_permissions: "الحسابات والأذونات", more: "المزيد",
    notifications: "الإشعارات", privacy: "الخصوصية", location: "الموقع", security: "الأمان",
    app_preferences: "تفضيلات التطبيق",
    language: "اللغة", theme: "المظهر", units: "الوحدات",
    permissions: "الأذونات", connected_accounts: "الحسابات المرتبطة",
    help_center: "مركز المساعدة", terms_privacy: "الشروط والخصوصية", community: "المجتمع",
    language_updated: "تم تحديث اللغة",
    driver: "سائق", reputation: "التقييم",
    points: "النقاط", shared: "مشاركات", reservations: "الحجوزات",
    edit_profile: "تعديل الملف الشخصي", edit_profile_hint: "الاسم، الهاتف، رقم اللوحة",
    my_vehicles: "مركباتي", add_plate: "أضف رقم لوحتك",
    parking_history: "سجل المواقف", all_shares: "كل مشاركاتك وحجوزاتك",
    statistics: "الإحصائيات", stats_hint: "نشاطك بلمحة",
    payment_methods: "طرق الدفع", payment_hint: "البطاقات، الفواتير، الاشتراكات",
    community_hint: "الدعوات، المتصدرون، الإحالات",
    help_hint: "الأسئلة الشائعة، التواصل، الدردشة",
    notifications_hint_on: "مُفعّل", location_on: "مشاركة الموقع مُفعّلة", location_off: "مشاركة الموقع مُعطّلة",
    all_off: "الكل مُعطّل",
    achievements: "الإنجازات", all_badges: "كل الشارات", leaderboard: "المتصدرون",
    sign_out: "تسجيل الخروج",
  },
} as const;

export type TKey = keyof typeof dict.en;

interface I18nCtx { lang: Lang; dir: "ltr" | "rtl"; t: (k: TKey) => string; setLang: (l: Lang) => void; }
const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useApp();
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("parkout.lang");
    return (saved === "ar" || saved === "en") ? saved : "en";
  });

  // Sync from profile once loaded
  useEffect(() => {
    if (user?.language === "ar" || user?.language === "en") setLangState(user.language);
  }, [user?.language]);

  // Apply dir/lang on html
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("parkout.lang", lang);
  }, [lang]);

  const value = useMemo<I18nCtx>(() => ({
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: (k) => (dict[lang][k] ?? dict.en[k] ?? k) as string,
    setLang: (l) => {
      setLangState(l);
      if (user) void updateProfile({ language: l });
    },
  }), [lang, user, updateProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}
