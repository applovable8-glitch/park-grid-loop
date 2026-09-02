import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, Toggle, Button, Field } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/location")({ component: LocationSettings });

function LocationSettings() {
  const { user, updateProfile } = useApp();
  const { t } = useI18n();
  const [p, setP] = useState(user?.location_prefs);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) setP(user.location_prefs); }, [user]);
  if (!p) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await updateProfile({ location_prefs: p });
    setSaving(false);
    if (error) toast.error(error); else toast.success(t("saved"));
  };

  return (
    <Screen title={t("location")} back="/settings">
      <div className="rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label={t("share_location")} hint={t("share_location_hint")} checked={p.share_location} onChange={(v) => setP({ ...p, share_location: v })} />
      </div>
      <div className="mt-4">
        <Field label={`${t("search_radius")} · ${p.radius_m}m`}>
          <input
            type="range"
            min={200}
            max={3000}
            step={100}
            value={p.radius_m}
            onChange={(e) => setP({ ...p, radius_m: +e.target.value })}
            className="w-full accent-[var(--emerald)]"
          />
        </Field>
      </div>
      <div className="mt-6"><Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button></div>
    </Screen>
  );
}
