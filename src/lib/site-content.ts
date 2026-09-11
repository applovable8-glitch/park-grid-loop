/** Client-safe types and helpers for the public AndiPark website content. */

export type Bilingual = { en: string; ar: string };

export type StepItem = {
  key: string;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  image?: string;
  icon?: string;
  enabled: boolean;
};

export type ManualStat = { key: string; label_en: string; label_ar: string; value: string; enabled: boolean };

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type SectionData = { [key: string]: Json };

export type Section = { id: string; data: SectionData; enabled: boolean };

export type FaqRow = {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  sort_order: number;
  enabled: boolean;
};

export type MediaRow = {
  id: string;
  slot: string;
  url: string;
  alt_en: string;
  alt_ar: string;
  caption_en: string;
  caption_ar: string;
  sort_order: number;
  enabled: boolean;
};

export type SeoRow = {
  page: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  keywords: string;
  canonical_url: string;
  og_image: string;
  og_title: string;
  og_description: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  noindex: boolean;
};

export type SiteContent = {
  sections: Section[];
  faq: FaqRow[];
  media: MediaRow[];
  seo: SeoRow | null;
  /** Real platform counts. Null when the admin turned dynamic statistics off. */
  stats: { drivers: number; spotsShared: number; handoffs: number } | null;
};

export const SECTION_IDS = ["hero", "how", "features", "rewards", "preview", "download", "stats", "footer", "settings"] as const;

export function sectionOf(content: SiteContent | null | undefined, id: string): Section | undefined {
  return content?.sections.find((s) => s.id === id);
}

export function str(data: SectionData | undefined, key: string, fallback = ""): string {
  const v = data?.[key];
  return typeof v === "string" ? v : fallback;
}

export function bool(data: SectionData | undefined, key: string, fallback = false): boolean {
  const v = data?.[key];
  return typeof v === "boolean" ? v : fallback;
}

export function list<T>(data: SectionData | undefined, key: string): T[] {
  const v = data?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Picks the English or Arabic variant of a `<base>_en` / `<base>_ar` pair. */
export function pick(data: SectionData | undefined, base: string, lang: "en" | "ar"): string {
  const localized = str(data, `${base}_${lang}`);
  return localized || str(data, `${base}_en`);
}

export function pickOf(row: Record<string, unknown>, base: string, lang: "en" | "ar"): string {
  const localized = row[`${base}_${lang}`];
  if (typeof localized === "string" && localized) return localized;
  const en = row[`${base}_en`];
  return typeof en === "string" ? en : "";
}
