import { createFileRoute } from "@tanstack/react-router";
import { Bell, Shield, MapPin, Lock, Settings2, Languages, Palette, Ruler, KeyRound, Link2, HelpCircle, FileText, Users } from "lucide-react";
import { Screen, RowGroup, Row } from "@/components/kit";

export const Route = createFileRoute("/settings")({ component: SettingsHome });

function SettingsHome() {
  return (
    <Screen title="Settings" back="/profile">
      <RowGroup title="Preferences">
        <Row icon={Bell} label="Notifications" to="/settings/notifications" />
        <Row icon={Shield} label="Privacy" to="/settings/privacy" />
        <Row icon={MapPin} label="Location" to="/settings/location" />
        <Row icon={Lock} label="Security" to="/settings/security" />
        <Row icon={Settings2} label="App preferences" to="/settings/preferences" />
      </RowGroup>
      <RowGroup title="Appearance & language">
        <Row icon={Languages} label="Language" to="/settings/language" />
        <Row icon={Palette} label="Theme" to="/settings/theme" />
        <Row icon={Ruler} label="Units" to="/settings/units" />
      </RowGroup>
      <RowGroup title="Accounts & permissions">
        <Row icon={KeyRound} label="Permissions" to="/settings/permissions" />
        <Row icon={Link2} label="Connected accounts" to="/settings/accounts" />
      </RowGroup>
      <RowGroup title="More">
        <Row icon={HelpCircle} label="Help center" to="/help" />
        <Row icon={FileText} label="Terms & privacy" to="/help/terms" />
        <Row icon={Users} label="Community" to="/community/guidelines" />
      </RowGroup>
    </Screen>
  );
}
