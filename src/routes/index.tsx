import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Car, Clock, Gift, MapPin, Menu, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { getSiteContent } from "@/lib/site-content.functions";
import { list, pick, pickOf, sectionOf, str, type SiteContent, type StepItem, type ManualStat } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  loader: () => getSiteContent(),
  head: ({ loaderData }) => {
    const seo = (loaderData as SiteContent | undefined)?.seo;
    const title = seo?.title_en || "AndiPark — Find parking the moment someone leaves";
    const description =
      seo?.description_en ||
      "AndiPark is a community parking app: drivers share the spot they are about to leave, and nearby drivers park without circling the block.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: seo?.og_title || title },
      { property: "og:description", content: seo?.og_description || description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: seo?.twitter_title || title },
      { name: "twitter:description", content: seo?.twitter_description || description },
    ];
    if (seo?.keywords) meta.push({ name: "keywords", content: seo.keywords });
    if (seo?.noindex) meta.push({ name: "robots", content: "noindex" });
    const links = seo?.canonical_url ? [{ rel: "canonical", href: seo.canonical_url }] : [];
    return { meta, links };
  },
  errorComponent: () => <SiteFallback />,
  notFoundComponent: () => <SiteFallback />,
  component: Website,
});

function SiteFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">AndiPark</h1>
        <p className="mt-2 text-sm text-muted-foreground">Community parking, in real time.</p>
        <Link to="/app" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Open the app
        </Link>
      </div>
    </main>
  );
}

const ICONS: Record<string, typeof MapPin> = { map: MapPin, clock: Clock, car: Car, gift: Gift, shield: ShieldCheck, users: Users, spark: Sparkles };

function Icon({ name, className }: { name?: string; className?: string }) {
  const C = ICONS[name ?? "spark"] ?? Sparkles;
  return <C className={className} />;
}

function Website() {
  const content = Route.useLoaderData() as SiteContent;
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [menu, setMenu] = useState(false);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const hero = sectionOf(content, "hero");
  const how = sectionOf(content, "how");
  const features = sectionOf(content, "features");
  const rewards = sectionOf(content, "rewards");
  const preview = sectionOf(content, "preview");
  const download = sectionOf(content, "download");
  const stats = sectionOf(content, "stats");
  const footer = sectionOf(content, "footer");

  const nav = [
    { href: "#how", label: t("How it works", "كيف يعمل") },
    { href: "#features", label: t("Features", "المزايا") },
    { href: "#rewards", label: t("Rewards", "المكافآت") },
    { href: "#faq", label: t("FAQ", "الأسئلة") },
  ];

  const manualStats = list<ManualStat>(stats?.data, "items").filter((s) => s.enabled);
  const showStats = stats?.enabled && (content.stats || manualStats.length > 0);

  return (
    <div dir={dir} className="min-h-screen bg-white text-slate-900 dark:bg-[#070c16] dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-[#070c16]/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/andipark-logo.png" alt="AndiPark" className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-[var(--font-display)] text-lg font-bold">
              Andi<span className="text-emerald-600">Park</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-emerald-600">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-white/15"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
            <Link
              to="/app"
              className="hidden rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:inline-flex"
            >
              {t("Open the app", "افتح التطبيق")}
            </Link>
            <button onClick={() => setMenu((m) => !m)} className="md:hidden" aria-label={t("Menu", "القائمة")}>
              {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-slate-200 px-5 py-3 md:hidden dark:border-white/10">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenu(false)} className="block py-2 text-sm font-medium">
                {n.label}
              </a>
            ))}
            <Link to="/app" className="mt-2 block rounded-full bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white">
              {t("Open the app", "افتح التطبيق")}
            </Link>
          </nav>
        )}
      </header>

      {/* Hero */}
      {hero?.enabled !== false && (
        <section id="top" className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-28 start-1/4 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 end-10 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                {pick(hero?.data, "eyebrow", lang) || t("Community-powered parking", "ركن بمساعدة المجتمع")}
              </span>
              <h1 className="mt-4 font-[var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                {pick(hero?.data, "title", lang) || t("Find parking the moment someone leaves", "اعثر على موقف في اللحظة التي يغادر فيها أحدهم")}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {pick(hero?.data, "subtitle", lang) ||
                  t(
                    "Drivers share the spot they are about to leave. Nearby drivers see it live and park without circling the block.",
                    "السائق يشارك الموقف الذي سيغادره، والسائقون القريبون يرونه مباشرة ويركنون دون لفّ حول الحي.",
                  )}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  {pick(hero?.data, "cta_primary", lang) || t("Open the app", "افتح التطبيق")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <a href="#how" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold dark:border-white/15">
                  {pick(hero?.data, "cta_secondary", lang) || t("See how it works", "كيف يعمل")}
                </a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-[36px] border border-slate-200 bg-slate-50 p-3 shadow-2xl dark:border-white/10 dark:bg-white/5">
                <img
                  src={str(hero?.data, "image") || "/andipark-logo.png"}
                  alt={pick(hero?.data, "image_alt", lang) || "AndiPark"}
                  className="h-[420px] w-full rounded-[28px] object-contain"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      {showStats && (
        <section className="border-y border-slate-200 bg-slate-50 py-10 dark:border-white/10 dark:bg-white/5">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-5 text-center md:grid-cols-3">
            {content.stats && (
              <>
                <Stat value={content.stats.drivers} label={t("Drivers on AndiPark", "سائق على AndiPark")} />
                <Stat value={content.stats.spotsShared} label={t("Spots shared", "موقف تمت مشاركته")} />
                <Stat value={content.stats.handoffs} label={t("Completed handovers", "عملية تسليم مكتملة")} />
              </>
            )}
            {manualStats.map((s) => (
              <div key={s.key}>
                <p className="font-[var(--font-display)] text-3xl font-extrabold text-emerald-600">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{lang === "ar" ? s.label_ar : s.label_en}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      {how?.enabled !== false && (
        <section id="how" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <SectionHead
            title={pick(how?.data, "title", lang) || t("How AndiPark works", "كيف يعمل AndiPark")}
            subtitle={pick(how?.data, "subtitle", lang)}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {list<StepItem>(how?.data, "items")
              .filter((s) => s.enabled)
              .map((s, i) => (
                <article key={s.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs font-bold text-emerald-600">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-[var(--font-display)] text-lg font-bold">{lang === "ar" ? s.title_ar : s.title_en}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{lang === "ar" ? s.desc_ar : s.desc_en}</p>
                </article>
              ))}
          </div>
        </section>
      )}

      {/* Features */}
      {features?.enabled !== false && (
        <section id="features" className="bg-slate-50 py-16 md:py-20 dark:bg-white/5">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              title={pick(features?.data, "title", lang) || t("Built for real streets", "مصمَّم لواقع الشوارع")}
              subtitle={pick(features?.data, "subtitle", lang)}
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list<StepItem>(features?.data, "items")
                .filter((s) => s.enabled)
                .map((s) => (
                  <article key={s.key} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1424]">
                    <Icon name={s.icon} className="h-5 w-5 text-emerald-600" />
                    <h3 className="mt-3 font-semibold">{lang === "ar" ? s.title_ar : s.title_en}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{lang === "ar" ? s.desc_ar : s.desc_en}</p>
                  </article>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Rewards */}
      {rewards?.enabled !== false && (
        <section id="rewards" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 md:p-12 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-transparent">
            <Gift className="h-7 w-7 text-emerald-600" />
            <h2 className="mt-4 font-[var(--font-display)] text-2xl font-bold md:text-3xl">
              {pick(rewards?.data, "title", lang) || t("Share a spot, earn AndiPoints", "شارك موقفًا واكسب نقاطًا")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {pick(rewards?.data, "body", lang) ||
                t(
                  "Every completed handover rewards the driver who shared the spot. Points come back to you when you need a spot yourself.",
                  "كل عملية تسليم مكتملة تكافئ من شارك الموقف، والنقاط تعود إليك عندما تحتاج موقفًا.",
                )}
            </p>
          </div>
        </section>
      )}

      {/* Media / preview */}
      {preview?.enabled !== false && content.media.length > 0 && (
        <section className="bg-slate-50 py-16 dark:bg-white/5">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead title={pick(preview?.data, "title", lang) || t("Inside the app", "داخل التطبيق")} subtitle={pick(preview?.data, "subtitle", lang)} />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {content.media.map((m) => (
                <figure key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0d1424]">
                  <img src={m.url} alt={pickOf(m as unknown as Record<string, unknown>, "alt", lang)} loading="lazy" className="h-64 w-full object-cover" />
                  {(m.caption_en || m.caption_ar) && (
                    <figcaption className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {pickOf(m as unknown as Record<string, unknown>, "caption", lang)}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {content.faq.length > 0 && (
        <section id="faq" className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <SectionHead title={t("Frequently asked questions", "الأسئلة الشائعة")} subtitle="" />
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {content.faq.map((f) => (
              <details key={f.id} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                  {pickOf(f as unknown as Record<string, unknown>, "question", lang)}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {pickOf(f as unknown as Record<string, unknown>, "answer", lang)}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Download / CTA */}
      {download?.enabled !== false && (
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="rounded-3xl bg-slate-900 p-10 text-center text-white dark:bg-[#0d1424]">
            <h2 className="font-[var(--font-display)] text-2xl font-bold md:text-3xl">
              {pick(download?.data, "title", lang) || t("Start parking smarter today", "ابدأ الركن بذكاء اليوم")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
              {pick(download?.data, "subtitle", lang) ||
                t("AndiPark runs in your browser right now. Store apps are on the way.", "AndiPark يعمل في متصفحك الآن، وتطبيقات المتاجر في الطريق.")}
            </p>
            <Link to="/app" className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white">
              {t("Open the app", "افتح التطبيق")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-slate-500 md:flex-row dark:text-slate-400">
          <p>{pick(footer?.data, "note", lang) || t("AndiPark is an independent community app.", "AndiPark تطبيق مجتمعي مستقل.")}</p>
          <nav className="flex flex-wrap items-center gap-5">
            <Link to="/help/privacy">{t("Privacy", "الخصوصية")}</Link>
            <Link to="/help/terms">{t("Terms", "الشروط")}</Link>
            <Link to="/help/contact">{t("Contact", "اتصل بنا")}</Link>
          </nav>
          <p>© {new Date().getFullYear()} AndiPark</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-[var(--font-display)] text-3xl font-extrabold text-emerald-600">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-[var(--font-display)] text-2xl font-bold md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{subtitle}</p>}
    </div>
  );
}
