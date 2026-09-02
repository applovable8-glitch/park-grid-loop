import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Languages, Palette, Ruler, Check } from "lucide-react";
import { toast } from "sonner";
import { Screen, Row, RowGroup, Toggle, Button } from "@/components/kit";
import { useApp, DEFAULT_APP_PREFS, type AppPrefs } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/preferences")({ component: Preferences });

function Preferences() {
  const { user, updateProfile } = useApp();
  const { t, lang } = useI18n();
  const [p, setP] = useState<AppPrefs>(user?.app_prefs ?? DEFAULT_APP_PREFS);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) setP(user.app_prefs); }, [user]);

  const save = async () => {
    setSaving(true);
    const { error } = await updateProfile({ app_prefs: p });
    setSaving(false);
    if (error) toast.error(error); else toast.success(t("saved"));
  };

  const mapTypes: [AppPrefs["map_type"], string][] = [
    ["roadmap", t("map_roadmap")],
    ["satellite", t("map_satellite")],
    ["hybrid", t("map_hybrid")],
    ["terrain", t("map_terrain")],
  ];

  return (
    <Screen title={t("app_preferences")} back="/settings">
      <RowGroup>
        <Row icon={Languages} label={t("language")} hint={lang === "ar" ? "العربية" : "English"} to="/settings/language" />
        <Row icon={Palette} label={t("theme")} to="/settings/theme" />
        <Row icon={Ruler} label={t("units")} hint={p.units === "metric" ? t("metric_km") : t("imperial_mi")} to="/settings/units" />
      </RowGroup>

      <RowGroup title={t("feedback")}>
        <div>
          <Toggle label={t("sound_effects")} hint={t("sound_hint")} checked={p.sound} onChange={(v) => setP({ ...p, sound: v })} />
          <Toggle label={t("haptic_feedback")} hint={t("haptic_hint")} checked={p.haptics} onChange={(v) => setP({ ...p, haptics: v })} />
        </div>
      </RowGroup>

      <RowGroup title={t("map")}>
        <div className="px-2 pb-2">
          <p className="px-2 pt-2 text-xs font-medium text-muted-foreground">{t("map_type")}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {mapTypes.map(([v, label]) => (
              <button
                key={v}
                onClick={() => setP({ ...p, map_type: v })}
                className={`flex items-center justify-center gap-1 rounded-2xl py-2.5 text-xs font-semibold ${p.map_type === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {p.map_type === v && <Check className="h-3 w-3" />} {label}
              </button>
            ))}
          </div>
          <div className="mt-1">
            <Toggle label={t("traffic_layer")} checked={p.traffic} onChange={(v) => setP({ ...p, traffic: v })} />
          </div>
        </div>
      </RowGroup>

      <div className="mt-6"><Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button></div>
    </Screen>
  );
}
