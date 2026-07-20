import { createFileRoute } from "@tanstack/react-router";
import { Bell, Shield, MapPin, Lock, Settings2, Languages, Palette, Ruler, KeyRound, Link2, HelpCircle, FileText, Users } from "lucide-react";
import { Screen, RowGroup, Row } from "@/components/kit";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({ component: SettingsHome });

function SettingsHome() {
  const { t, lang } = useI18n();
  return (
    <Screen title={t("settings")} back="/profile">
      <RowGroup title={t("preferences")}>
        <Row icon={Bell} label={t("notifications")} to="/settings/notifications" />
        <Row icon={Shield} label={t("privacy")} to="/settings/privacy" />
        <Row icon={MapPin} label={t("location")} to="/settings/location" />
        <Row icon={Lock} label={t("security")} to="/settings/security" />
        <Row icon={Settings2} label={t("app_preferences")} to="/settings/preferences" />
      </RowGroup>
      <RowGroup title={t("appearance_language")}>
        <Row icon={Languages} label={t("language")} hint={lang === "ar" ? "العربية" : "English"} to="/settings/language" />
        <Row icon={Palette} label={t("theme")} to="/settings/theme" />
        <Row icon={Ruler} label={t("units")} to="/settings/units" />
      </RowGroup>
      <RowGroup title={t("accounts_permissions")}>
        <Row icon={KeyRound} label={t("permissions")} to="/settings/permissions" />
        <Row icon={Link2} label={t("connected_accounts")} to="/settings/accounts" />
      </RowGroup>
      <RowGroup title={t("more")}>
        <Row icon={HelpCircle} label={t("help_center")} to="/help" />
        <Row icon={FileText} label={t("terms_privacy")} to="/help/terms" />
        <Row icon={Users} label={t("community")} to="/community/guidelines" />
      </RowGroup>
    </Screen>
  );
}
