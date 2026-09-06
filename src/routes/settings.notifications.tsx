import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Volume2 } from "lucide-react";
import { Screen, Toggle, Button } from "@/components/kit";
import { useApp, DEFAULT_APP_PREFS, type AppPrefs } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { playChime } from "@/lib/notification-sound";

export const Route = createFileRoute("/settings/notifications")({ component: NotifSettings });

function NotifSettings() {
  const { user, updateProfile } = useApp();
  const { t } = useI18n();
  const [p, setP] = useState(user?.notification_prefs);
  const [ap, setAp] = useState<AppPrefs>(user?.app_prefs ?? DEFAULT_APP_PREFS);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) { setP(user.notification_prefs); setAp(user.app_prefs); } }, [user]);
  if (!p) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await updateProfile({ notification_prefs: p, app_prefs: ap });
    setSaving(false);
    if (error) toast.error(error); else toast.success(t("saved"));
  };

  return (
    <Screen title={t("notifications")} back="/settings">
      <div className="animate-fade-up rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label={t("push_notifications")} hint={t("push_hint")} checked={p.push} onChange={(v) => setP({ ...p, push: v })} />
        <Toggle label={t("nearby_alerts")} hint={t("nearby_alerts_hint")} checked={p.nearby_spots} onChange={(v) => setP({ ...p, nearby_spots: v })} />
        <Toggle label={t("reservation_updates")} hint={t("reservation_updates_hint")} checked={p.reservations} onChange={(v) => setP({ ...p, reservations: v })} />
        <Toggle label={t("points_rewards")} hint={t("points_rewards_hint")} checked={p.points} onChange={(v) => setP({ ...p, points: v })} />
      </div>

      <div className="animate-fade-up mt-4 rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]" style={{ animationDelay: "60ms" }}>
        <Toggle label={t("notif_sound")} hint={t("notif_sound_hint")} checked={ap.sound} onChange={(v) => { setAp({ ...ap, sound: v }); if (v) playChime(); }} />
        <Toggle label={t("haptic_feedback")} hint={t("haptic_hint")} checked={ap.haptics} onChange={(v) => {
          setAp({ ...ap, haptics: v });
          if (v && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate([30, 40, 30]);
        }} />
        <button
          type="button"
          onClick={() => playChime()}
          className="hover-scale flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[color:var(--emerald)] transition-colors hover:bg-muted"
        >
          <Volume2 className="h-4 w-4" /> {t("test_sound")}
        </button>
      </div>

      <div className="mt-6"><Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button></div>
    </Screen>
  );
}
