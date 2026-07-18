import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, Toggle, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings/notifications")({ component: NotifSettings });

function NotifSettings() {
  const { user, updateProfile } = useApp();
  const [p, setP] = useState(user?.notification_prefs);
  useEffect(() => { if (user) setP(user.notification_prefs); }, [user]);
  if (!p) return null;
  const save = async () => {
    const { error } = await updateProfile({ notification_prefs: p });
    if (error) toast.error(error); else toast.success("Saved");
  };
  return (
    <Screen title="Notifications" back="/settings">
      <div className="rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label="Push notifications" hint="Everything below requires push" checked={p.push} onChange={(v) => setP({ ...p, push: v })} />
        <Toggle label="Nearby parking alerts" hint="Live spots within your radius" checked={p.nearby_spots} onChange={(v) => setP({ ...p, nearby_spots: v })} />
        <Toggle label="Reservation updates" hint="90s lock reminders & handoffs" checked={p.reservations} onChange={(v) => setP({ ...p, reservations: v })} />
        <Toggle label="Points & rewards" hint="Earned points and promotions" checked={p.points} onChange={(v) => setP({ ...p, points: v })} />
      </div>
      <div className="mt-6"><Button onClick={save}>Save</Button></div>
    </Screen>
  );
}
