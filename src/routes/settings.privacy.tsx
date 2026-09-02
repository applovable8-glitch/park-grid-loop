import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Trash2 } from "lucide-react";
import { Screen, Toggle, Button, Row, RowGroup } from "@/components/kit";
import { useApp, DEFAULT_APP_PREFS } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/privacy")({ component: Privacy });

function Privacy() {
  const { user, updateProfile } = useApp();
  const { t } = useI18n();
  const [p, setP] = useState(user?.app_prefs ?? DEFAULT_APP_PREFS);
  const [showPhone, setShowPhone] = useState(user?.show_phone ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setP(user.app_prefs);
    setShowPhone(user.show_phone);
  }, [user]);

  const save = async () => {
    setSaving(true);
    const { error } = await updateProfile({ app_prefs: p, show_phone: showPhone });
    setSaving(false);
    if (error) toast.error(error); else toast.success(t("saved"));
  };

  return (
    <Screen title={t("privacy")} back="/settings">
      <div className="rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label={t("public_profile")} hint={t("public_profile_hint")} checked={p.public_profile} onChange={(v) => setP({ ...p, public_profile: v })} />
        <Toggle label={t("show_plate")} hint={t("show_plate_hint")} checked={p.show_plate} onChange={(v) => setP({ ...p, show_plate: v })} />
        <Toggle label={t("show_phone")} hint={t("show_phone_hint")} checked={showPhone} onChange={setShowPhone} />
        <Toggle label={t("analytics")} hint={t("analytics_hint")} checked={p.analytics} onChange={(v) => setP({ ...p, analytics: v })} />
      </div>
      <RowGroup title={t("data")}>
        <Row icon={Users} label={t("blocked_users")} to="/reports/blocked" />
        <Row icon={Trash2} label={t("delete_account")} danger onClick={() => toast.error(t("delete_account_hint"))} />
      </RowGroup>
      <div className="mt-6"><Button onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</Button></div>
    </Screen>
  );
}
