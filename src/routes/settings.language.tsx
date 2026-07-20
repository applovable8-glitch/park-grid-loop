import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/kit";
import { useI18n, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/settings/language")({ component: Language });

const langs: { c: Lang; label: string; sub: string; flag: string }[] = [
  { c: "en", label: "English", sub: "English", flag: "🇬🇧" },
  { c: "ar", label: "العربية", sub: "Arabic", flag: "🇸🇦" },
];

function Language() {
  const { lang, setLang, t } = useI18n();
  const nav = useNavigate();
  const pick = (c: Lang) => {
    setLang(c);
    toast.success(t("language_updated"));
    setTimeout(() => nav({ to: "/settings" }), 150);
  };
  return (
    <Screen title={t("language")} back="/settings">
      <div className="rounded-3xl bg-card p-2 shadow-[var(--shadow-card)]">
        {langs.map((l) => (
          <button
            key={l.c}
            onClick={() => pick(l.c)}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start hover:bg-muted"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-lg">{l.flag}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{l.label}</p>
              <p className="text-xs text-muted-foreground">{l.sub}</p>
            </div>
            {lang === l.c && <Check className="h-5 w-5 text-[color:var(--emerald)]" />}
          </button>
        ))}
      </div>
      <p className="mt-4 px-1 text-xs text-muted-foreground">
        {lang === "ar"
          ? "سيتم تغيير اتجاه الواجهة تلقائيًا لتتناسب مع اللغة المختارة."
          : "The interface direction will adjust automatically to match your language."}
      </p>
    </Screen>
  );
}
