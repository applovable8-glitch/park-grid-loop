import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/settings/theme")({ component: Theme });

const themes = [
  { v: "light", icon: Sun, label: "Light" },
  { v: "dark", icon: Moon, label: "Dark" },
  { v: "system", icon: Monitor, label: "Match system" },
];

function Theme() {
  const { user, updateProfile } = useApp();
  const nav = useNavigate();
  const pick = async (v: string) => {
    const { error } = await updateProfile({ theme: v });
    if (error) toast.error(error); else { toast.success("Theme updated"); nav({ to: "/settings" }); }
  };
  return (
    <Screen title="Theme" back="/settings">
      <div className="space-y-2">
        {themes.map((t) => (
          <button key={t.v} onClick={() => pick(t.v)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><t.icon className="h-5 w-5" /></div>
            <span className="flex-1 text-left text-sm font-semibold">{t.label}</span>
            {user?.theme === t.v && <Check className="h-4 w-4 text-[color:var(--emerald)]" />}
          </button>
        ))}
      </div>
    </Screen>
  );
}
