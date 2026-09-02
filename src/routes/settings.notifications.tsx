import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, Toggle, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/notifications")({ component: NotifSettings });

function NotifSettings() {
  const { user, updateProfile } = useApp();
  const { t } = useI18n();
  const [p, setP] = useState(user?.notification_prefs);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) setP(user.notification_prefs); }, [user]);
  if (!p) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await updateProfile({ notification_prefs: p });
    setSaving(false);
    if (error) toast.error(error); else toast.success(t("saved"));
  };

  return (
    <Screen title={t("notifications")} back="/settings">
      <div className="rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label={t("push_notifications")} hint={t("push_hint")} checked={p.push} onChange={(v) => setP({ ...p, push: v })} />
        <Toggle label={t("nearby_alerts")} hint={t("nearby_alerts_hint")} checked={p.nearby_spots} onChange={(v) => setP({ ...p, nearby_spots: v })} />
        <Toggle label={t("reservation_updates")} hint={t("reservation_updates_hint")} checked={p.reservations} onChange={(v) => setP({ ...p, reservations: v })} />
        <Toggle label={t("points_rewards")} hint={t("points_rewards_hint")} checked={p.points} onChange={(v) => setP({ ...p, points: v })} />
      </div>
      <div className="mt-6"><Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button></div>
    </Screen>
  );
}
