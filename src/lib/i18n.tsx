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
    driver_on_the_way: "Driver on the way to your spot",
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
    // Settings — extended
    saved: "Saved", saving: "Saving…", done: "Done",
    push_notifications: "Push notifications", push_hint: "Everything below requires push",
    nearby_alerts: "Nearby parking alerts", nearby_alerts_hint: "Live spots within your radius",
    reservation_updates: "Reservation updates", reservation_updates_hint: "Requests, approvals & handoffs",
    points_rewards: "Points & rewards", points_rewards_hint: "Earned points and promotions",
    share_location: "Share my location", share_location_hint: "Required to share spots",
    search_radius: "Search radius", data: "Data",
    public_profile: "Public profile", public_profile_hint: "Other drivers see your name",
    show_plate: "Show vehicle plate", show_plate_hint: "Only during handoffs",
    show_phone: "Show my phone number", show_phone_hint: "Drivers can call you directly",
    analytics: "Analytics", analytics_hint: "Help us improve ParkOut",
    blocked_users: "Blocked users", delete_account: "Delete my account",
    delete_account_hint: "Contact support to delete your account",
    current_password: "Current password", new_password: "New password",
    change_password: "Change password", password_short: "Password must be 6+ characters",
    password_updated: "Password updated",
    two_factor: "Two-factor authentication", two_factor_hint: "SMS code on login",
    biometric: "Biometric unlock", biometric_hint: "Face ID / fingerprint",
    sign_out_all: "Sign out of this device",
    metric_km: "Metric (km)", imperial_mi: "Imperial (mi)", currency: "Currency",
    light: "Light", dark: "Dark", system_theme: "Match system", theme_updated: "Theme updated",
    sound_effects: "Sound effects", sound_hint: "Confirmations and alerts",
    haptic_feedback: "Haptic feedback", haptic_hint: "Vibration on actions",
    feedback: "Feedback", map: "Map", map_type: "Map type", traffic_layer: "Traffic layer",
    map_roadmap: "Default", map_satellite: "Satellite", map_hybrid: "Hybrid", map_terrain: "Terrain",
    perm_location: "Location", perm_location_hint: "Required for parking",
    perm_notifications: "Notifications", perm_notifications_hint: "Real-time alerts",
    perm_camera: "Camera", perm_camera_hint: "Photos in chat",
    perm_allowed: "Allowed", perm_denied: "Denied", perm_ask: "Ask", perm_request: "Enable",
    perm_device_hint: "If a permission is blocked, enable it from your browser or device settings.",
    email_account: "Email", primary: "Primary", connected: "Connected", not_connected: "Not connected",
    connect: "Connect", google: "Google", apple: "Apple",
    // Handoff
    handoff: "Handoff", did_you_take: "Did you take the parking spot?",
    did_you_take_hint: "Confirm the handoff so points are transferred and the spot is removed from the map.",
    yes_took_it: "Yes, I took it", no_didnt: "No, I didn't",
    rate_owner: "Rate the driver", rate_hint: "How was the handoff?",
    add_note: "Add a note (optional)", submit_rating: "Submit rating", skip: "Skip",
    handoff_done: "Handoff complete", points_charged: "Points charged",
    share_your_exit: "Share your exit time?",
    share_your_exit_hint: "You are parked here now. Share when you'll leave and earn points — the same location is kept, only your car details change.",
    share_and_earn: "Share and earn", not_now: "Not now",
    confirm_handoff_cta: "Confirm handoff",
    spot_released: "The spot was released for other drivers.",
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
    driver_on_the_way: "السائق في طريقه إلى موقفك",
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
    saved: "تم الحفظ", saving: "جارٍ الحفظ…", done: "تم",
    push_notifications: "الإشعارات الفورية", push_hint: "كل ما بالأسفل يتطلب تفعيلها",
    nearby_alerts: "تنبيهات المواقف القريبة", nearby_alerts_hint: "المواقف المباشرة ضمن نطاقك",
    reservation_updates: "تحديثات الحجز", reservation_updates_hint: "الطلبات والموافقات والتسليم",
    points_rewards: "النقاط والمكافآت", points_rewards_hint: "النقاط المكتسبة والعروض",
    share_location: "مشاركة موقعي", share_location_hint: "مطلوبة لمشاركة المواقف",
    search_radius: "نطاق البحث", data: "البيانات",
    public_profile: "ملف شخصي عام", public_profile_hint: "يرى السائقون اسمك",
    show_plate: "إظهار رقم اللوحة", show_plate_hint: "أثناء التسليم فقط",
    show_phone: "إظهار رقم هاتفي", show_phone_hint: "يمكن للسائقين الاتصال بك مباشرة",
    analytics: "التحليلات", analytics_hint: "ساعدنا في تحسين ParkOut",
    blocked_users: "المستخدمون المحظورون", delete_account: "حذف حسابي",
    delete_account_hint: "تواصل مع الدعم لحذف حسابك",
    current_password: "كلمة المرور الحالية", new_password: "كلمة المرور الجديدة",
    change_password: "تغيير كلمة المرور", password_short: "كلمة المرور 6 أحرف على الأقل",
    password_updated: "تم تحديث كلمة المرور",
    two_factor: "المصادقة الثنائية", two_factor_hint: "رمز عبر SMS عند الدخول",
    biometric: "الفتح بالبصمة", biometric_hint: "بصمة الوجه أو الإصبع",
    sign_out_all: "تسجيل الخروج من هذا الجهاز",
    metric_km: "متري (كم)", imperial_mi: "إمبراطوري (ميل)", currency: "العملة",
    light: "فاتح", dark: "داكن", system_theme: "حسب النظام", theme_updated: "تم تحديث المظهر",
    sound_effects: "المؤثرات الصوتية", sound_hint: "التأكيدات والتنبيهات",
    haptic_feedback: "الاهتزاز", haptic_hint: "اهتزاز عند التنفيذ",
    feedback: "التنبيهات الحسية", map: "الخريطة", map_type: "نوع الخريطة", traffic_layer: "طبقة الازدحام",
    map_roadmap: "افتراضية", map_satellite: "قمر صناعي", map_hybrid: "مختلطة", map_terrain: "تضاريس",
    perm_location: "الموقع", perm_location_hint: "مطلوب للمواقف",
    perm_notifications: "الإشعارات", perm_notifications_hint: "تنبيهات لحظية",
    perm_camera: "الكاميرا", perm_camera_hint: "الصور في المحادثات",
    perm_allowed: "مسموح", perm_denied: "مرفوض", perm_ask: "يُسأل", perm_request: "تفعيل",
    perm_device_hint: "إذا كان الإذن محظورًا، فعّله من إعدادات المتصفح أو الجهاز.",
    email_account: "البريد الإلكتروني", primary: "أساسي", connected: "مرتبط", not_connected: "غير مرتبط",
    connect: "ربط", google: "جوجل", apple: "آبل",
    handoff: "تسليم الموقف", did_you_take: "هل قمت بأخذ الباركينج؟",
    did_you_take_hint: "أكّد الاستلام ليتم خصم النقاط وإزالة الموقف من الخريطة.",
    yes_took_it: "نعم، أخذته", no_didnt: "لا، لم آخذه",
    rate_owner: "قيّم صاحب الباركينج", rate_hint: "كيف كانت عملية التسليم؟",
    add_note: "أضف ملاحظة (اختياري)", submit_rating: "إرسال التقييم", skip: "تخطي",
    handoff_done: "تم التسليم", points_charged: "تم خصم النقاط",
    share_your_exit: "هل تريد مشاركة وقت خروجك؟",
    share_your_exit_hint: "أنت الآن متوقف هنا. شارك وقت خروجك واربح نقاطًا — يتم حفظ نفس المكان تلقائيًا وتتغير بيانات السيارة إلى بياناتك.",
    share_and_earn: "شارك واربح", not_now: "ليس الآن",
    confirm_handoff_cta: "تأكيد الاستلام",
    spot_released: "تم تحرير الموقف للسائقين الآخرين.",
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
