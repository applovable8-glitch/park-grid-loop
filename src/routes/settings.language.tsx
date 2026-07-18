import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/settings/language")({ component: Language });

const langs = [
  { c: "en", label: "English" }, { c: "ar", label: "العربية" },
  { c: "fr", label: "Français" }, { c: "es", label: "Español" },
  { c: "de", label: "Deutsch" }, { c: "hi", label: "हिन्दी" },
];

function Language() {
  const { user, updateProfile } = useApp();
  const nav = useNavigate();
  const pick = async (c: string) => {
    const { error } = await updateProfile({ language: c });
    if (error) toast.error(error); else { toast.success("Language updated"); nav({ to: "/settings" }); }
  };
  return (
    <Screen title="Language" back="/settings">
      <div className="rounded-3xl bg-card p-2 shadow-[var(--shadow-card)]">
        {langs.map((l) => (
          <button key={l.c} onClick={() => pick(l.c)} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 hover:bg-muted">
            <span className="text-sm font-medium">{l.label}</span>
            {user?.language === l.c && <Check className="h-4 w-4 text-[color:var(--emerald)]" />}
          </button>
        ))}
      </div>
    </Screen>
  );
}
