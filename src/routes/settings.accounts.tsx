import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Screen, Row, RowGroup, Badge } from "@/components/kit";
import { Mail, Chrome, Apple } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings/accounts")({ component: Accounts });

function Accounts() {
  const { user, signInWithOAuth } = useApp();
  const { t } = useI18n();
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setProviders((data.user?.identities ?? []).map((i) => i.provider));
    });
  }, []);

  const connect = async (p: "google" | "apple") => {
    if (providers.includes(p)) return toast.info(t("connected"));
    const { error } = await signInWithOAuth(p);
    if (error) toast.error(error);
  };

  const badge = (p: string) =>
    providers.includes(p) ? <Badge tone="emerald">{t("connected")}</Badge> : <Badge tone="muted">{t("not_connected")}</Badge>;

  return (
    <Screen title={t("connected_accounts")} back="/settings">
      <RowGroup>
        <Row icon={Mail} label={t("email_account")} hint={user?.email} right={<Badge tone="emerald">{t("primary")}</Badge>} />
        <Row icon={Chrome} label={t("google")} right={badge("google")} onClick={() => connect("google")} />
        <Row icon={Apple} label={t("apple")} right={badge("apple")} onClick={() => connect("apple")} />
      </RowGroup>
    </Screen>
  );
}
