import type { Lang } from "./i18n";

type Kind =
  | "request" | "confirmed" | "declined" | "extension" | "cancelled"
  | "handoff_done" | "handoff_missed" | "rating" | "referral" | "on_the_way";

const AR: Record<Kind, { title: string; body: string }> = {
  request: {
    title: "شخص يريد موقفك",
    body: "وصلك طلب حجز لموقفك في وقت خروجك المحدد. يمكنك الموافقة أو تمديد بقائك.",
  },
  confirmed: {
    title: "تم تأكيد الحجز",
    body: "تمت الموافقة، الموقف محجوز الآن.",
  },
  declined: {
    title: "تم رفض الطلب",
    body: "لم تتم الموافقة على الطلب. اختر موقفًا آخر قريبًا منك.",
  },
  extension: {
    title: "طلب تمديد الوقت",
    body: "صاحب الموقف يريد البقاء وقتًا أطول. هل ما زلت ترغب بهذا الموقف؟",
  },
  cancelled: {
    title: "تم إلغاء الطلب",
    body: "تم إلغاء طلب الموقف.",
  },
  handoff_done: {
    title: "تم التسليم",
    body: "تم أخذ موقفك بنجاح وأضيفت النقاط إلى رصيدك.",
  },
  handoff_missed: {
    title: "لم يؤخذ الموقف",
    body: "لم يأخذ السائق الموقف، وأصبح متاحًا مرة أخرى.",
  },
  rating: {
    title: "وصلك تقييم جديد",
    body: "قام سائق ركن معك بتقييمك.",
  },
  on_the_way: {
    title: "السائق في طريقه إليك",
    body: "السائق الذي وافقت على طلبه في طريقه الآن إلى موقفك.",
  },
  referral: {
    title: "ربحت نقاطًا",
    body: "انضم صديق إلى ParkOut عبر رابط دعوتك.",
  },
};

/** Localized notification copy — Arabic uses curated wording, English keeps the stored text. */
export function localizeNotification(
  lang: Lang,
  kind: string | undefined,
  title: string,
  body: string,
) {
  if (lang !== "ar") return { title, body };
  const t = kind ? AR[kind as Kind] : undefined;
  return t ?? { title, body };
}
