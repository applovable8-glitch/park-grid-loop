import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MapPin, Bell, Camera } from "lucide-react";
import { toast } from "sonner";
import { Screen, Row, RowGroup, Badge } from "@/components/kit";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings/permissions")({ component: Perms });

type PermState = "granted" | "denied" | "prompt" | "unsupported";

function Perms() {
  const { t } = useI18n();
  const [loc, setLoc] = useState<PermState>("prompt");
  const [notif, setNotif] = useState<PermState>("prompt");
  const [cam, setCam] = useState<PermState>("prompt");

  const read = useCallback(async () => {
    if (typeof navigator === "undefined") return;
    if (typeof Notification !== "undefined") {
      setNotif(Notification.permission === "default" ? "prompt" : (Notification.permission as PermState));
    } else setNotif("unsupported");

    const q = navigator.permissions?.query?.bind(navigator.permissions);
    if (!q) { setLoc("unsupported"); setCam("unsupported"); return; }
    try {
      const l = await q({ name: "geolocation" as PermissionName });
      setLoc(l.state as PermState);
    } catch { setLoc("unsupported"); }
    try {
      const c = await q({ name: "camera" as PermissionName });
      setCam(c.state as PermState);
    } catch { setCam("unsupported"); }
  }, []);

  useEffect(() => { void read(); }, [read]);

  const badge = (s: PermState) => {
    if (s === "granted") return <Badge tone="emerald">{t("perm_allowed")}</Badge>;
    if (s === "denied") return <Badge tone="red">{t("perm_denied")}</Badge>;
    return <Badge tone="muted">{t("perm_ask")}</Badge>;
  };

  const askLocation = () => {
    if (loc === "granted") return toast.info(t("perm_device_hint"));
    navigator.geolocation?.getCurrentPosition(
      () => { setLoc("granted"); toast.success(t("perm_allowed")); },
      () => { setLoc("denied"); toast.error(t("perm_device_hint")); },
    );
  };

  const askNotifications = async () => {
    if (typeof Notification === "undefined") return toast.error(t("perm_device_hint"));
    if (Notification.permission !== "default") return toast.info(t("perm_device_hint"));
    const res = await Notification.requestPermission();
    setNotif(res === "default" ? "prompt" : (res as PermState));
    if (res === "granted") toast.success(t("perm_allowed")); else toast.error(t("perm_device_hint"));
  };

  const askCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((tr) => tr.stop());
      setCam("granted");
      toast.success(t("perm_allowed"));
    } catch {
      setCam("denied");
      toast.error(t("perm_device_hint"));
    }
  };

  return (
    <Screen title={t("permissions")} back="/settings">
      <RowGroup>
        <Row icon={MapPin} label={t("perm_location")} hint={t("perm_location_hint")} right={badge(loc)} onClick={askLocation} />
        <Row icon={Bell} label={t("perm_notifications")} hint={t("perm_notifications_hint")} right={badge(notif)} onClick={askNotifications} />
        <Row icon={Camera} label={t("perm_camera")} hint={t("perm_camera_hint")} right={badge(cam)} onClick={askCamera} />
      </RowGroup>
      <p className="mt-4 px-1 text-xs text-muted-foreground">{t("perm_device_hint")}</p>
    </Screen>
  );
}
