import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sun, Moon, Monitor, Check, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/theme")({ component: Theme });

function Theme() {
  const { user, updateProfile } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const themes: { v: string; icon: LucideIcon; label: string }[] = [
    { v: "light", icon: Sun, label: t("light") },
    { v: "dark", icon: Moon, label: t("dark") },
    { v: "system", icon: Monitor, label: t("system_theme") },
  ];
  const pick = async (v: string) => {
    const { error } = await updateProfile({ theme: v });
    if (error) toast.error(error);
    else { toast.success(t("theme_updated")); nav({ to: "/settings" }); }
  };
  return (
    <Screen title={t("theme")} back="/settings">
      <div className="space-y-2">
        {themes.map((it) => (
          <button key={it.v} onClick={() => pick(it.v)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><it.icon className="h-5 w-5" /></div>
            <span className="flex-1 text-start text-sm font-semibold">{it.label}</span>
            {user?.theme === it.v && <Check className="h-4 w-4 text-[color:var(--emerald)]" />}
          </button>
        ))}
      </div>
    </Screen>
  );
}
