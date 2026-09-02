import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button, Toggle, Row, RowGroup } from "@/components/kit";
import { Smartphone, LogOut } from "lucide-react";
import { useApp, DEFAULT_APP_PREFS, type AppPrefs } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/security")({ component: Security });

function Security() {
  const { user, updatePassword, updateProfile, signOut } = useApp();
  const { t } = useI18n();
  const nav = useNavigate();
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState<AppPrefs>(user?.app_prefs ?? DEFAULT_APP_PREFS);
  useEffect(() => { if (user) setP(user.app_prefs); }, [user]);

  const patch = async (v: Partial<AppPrefs>) => {
    const nextPrefs = { ...p, ...v };
    setP(nextPrefs);
    const { error } = await updateProfile({ app_prefs: nextPrefs });
    if (error) toast.error(error); else toast.success(t("saved"));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) return toast.error(t("password_short"));
    setBusy(true);
    const { error } = await updatePassword(next);
    setBusy(false);
    if (error) toast.error(error);
    else { toast.success(t("password_updated")); setNext(""); nav({ to: "/settings" }); }
  };

  return (
    <Screen title={t("security")} back="/settings">
      <form onSubmit={submit} className="space-y-3">
        <Field label={t("new_password")}>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} autoComplete="new-password" />
        </Field>
        <Button type="submit" disabled={busy}>{busy ? t("saving") : t("change_password")}</Button>
      </form>
      <RowGroup title={t("security")}>
        <div>
          <Toggle label={t("two_factor")} hint={t("two_factor_hint")} checked={p.two_factor} onChange={(v) => patch({ two_factor: v })} />
          <Toggle label={t("biometric")} hint={t("biometric_hint")} checked={p.biometric} onChange={(v) => patch({ biometric: v })} />
        </div>
      </RowGroup>
      <RowGroup>
        <Row icon={Smartphone} label={user?.email ?? ""} hint={t("connected")} />
        <Row icon={LogOut} label={t("sign_out_all")} danger onClick={async () => { await signOut(); nav({ to: "/auth" }); }} />
      </RowGroup>
    </Screen>
  );
}
