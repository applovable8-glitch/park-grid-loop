import { Sun, Moon, Monitor } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

const ORDER = ["light", "dark", "system"] as const;

/** Compact 3-way theme switcher with an animated sliding pill. */
export function ThemeToggle({ variant = "light" }: { variant?: "light" | "onHero" }) {
  const { user, updateProfile } = useApp();
  const { t } = useI18n();
  const current = (user?.theme ?? "system") as (typeof ORDER)[number];
  const idx = Math.max(0, ORDER.indexOf(current));

  const icons = { light: Sun, dark: Moon, system: Monitor };
  const labels = { light: t("light"), dark: t("dark"), system: t("system_theme") };

  const onHero = variant === "onHero";

  return (
    <div
      className={`relative flex w-full items-center rounded-2xl p-1 ${
        onHero ? "bg-white/10 ring-1 ring-white/15 backdrop-blur-md" : "bg-muted"
      }`}
      role="group"
      aria-label={t("theme")}
    >
      <span
        aria-hidden
        className={`absolute inset-y-1 w-[calc(33.333%-0.166rem)] rounded-xl transition-[inset-inline-start] duration-300 ease-out ${
          onHero ? "bg-white/25" : "bg-card shadow-[var(--shadow-card)]"
        }`}
        style={{ insetInlineStart: `calc(0.25rem + ${idx} * (33.333% - 0.166rem) + ${idx} * 0.083rem)` }}
      />
      {ORDER.map((v) => {
        const Icon = icons[v];
        const active = v === current;
        return (
          <button
            key={v}
            type="button"
            onClick={() => { if (!active) void updateProfile({ theme: v }); }}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 ${
              active ? (onHero ? "text-white" : "text-foreground") : onHero ? "text-white/60" : "text-muted-foreground"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 transition-transform duration-300 ${active ? "scale-110" : ""}`} />
            <span className="truncate">{labels[v]}</span>
          </button>
        );
      })}
    </div>
  );
}
