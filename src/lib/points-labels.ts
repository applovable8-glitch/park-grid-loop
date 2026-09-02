const EN: Record<string, string> = {
  reservation: "Spot reserved",
  spot_shared: "Spot shared — handoff bonus",
  referral_bonus: "Friend joined with your invite",
  referral_joined: "Welcome bonus from an invite",
  purchase: "Points package purchased",
  redeem: "Reward redeemed",
  daily: "Daily activity reward",
};

const AR: Record<string, string> = {
  reservation: "حجز موقف",
  spot_shared: "مشاركة موقف — مكافأة تسليم",
  referral_bonus: "انضم صديق عبر دعوتك",
  referral_joined: "مكافأة ترحيب من دعوة",
  purchase: "شراء باقة نقاط",
  redeem: "استبدال مكافأة",
  daily: "مكافأة النشاط اليومي",
};

export function reasonLabel(reason: string, ar = false) {
  const dict = ar ? AR : EN;
  return dict[reason] ?? reason.replace(/_/g, " ");
}

export function timeAgo(iso: string, ar = false) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return ar ? "الآن" : "just now";
  if (m < 60) return ar ? `قبل ${m} د` : `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return ar ? `قبل ${h} س` : `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return ar ? `قبل ${d} يوم` : `${d}d ago`;
  return new Date(iso).toLocaleDateString(ar ? "ar" : "en", { day: "numeric", month: "short" });
}

export function formatDateTime(iso: string, ar = false) {
  return new Date(iso).toLocaleString(ar ? "ar" : "en", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
