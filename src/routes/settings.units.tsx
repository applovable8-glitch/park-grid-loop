import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Screen, Button } from "@/components/kit";
import { useApp, DEFAULT_APP_PREFS, type AppPrefs } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/units")({ component: Units });

function Units() {
  const { user, updateProfile } = useApp();
  const { t } = useI18n();
  const [p, setP] = useState<AppPrefs>(user?.app_prefs ?? DEFAULT_APP_PREFS);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) setP(user.app_prefs); }, [user]);

  const save = async () => {
    setSaving(true);
    const { error } = await updateProfile({ app_prefs: p });
    setSaving(false);
    if (error) toast.error(error); else toast.success(t("saved"));
  };

  const seg = <T extends string>(value: T, set: (v: T) => void, options: [T, string][]) => (
    <div className="mt-2 flex rounded-2xl bg-muted p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => set(v)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold ${value === v ? "bg-background shadow-[var(--shadow-card)]" : "text-muted-foreground"}`}
        >
          {value === v && <Check className="h-3 w-3" />} {l}
        </button>
      ))}
    </div>
  );

  return (
    <Screen title={t("units")} back="/settings">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("distance")}</p>
      {seg(p.units, (v) => setP({ ...p, units: v }), [["metric", t("metric_km")], ["imperial", t("imperial_mi")]])}
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("currency")}</p>
      {seg(p.currency, (v) => setP({ ...p, currency: v }), [["AED", "AED"], ["USD", "USD"], ["EUR", "EUR"], ["SAR", "SAR"]])}
      <div className="mt-6"><Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button></div>
    </Screen>
  );
}
