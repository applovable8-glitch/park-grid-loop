import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, Toggle, Button, Field } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/settings/location")({ component: LocationSettings });

function LocationSettings() {
  const { user, updateProfile } = useApp();
  const [p, setP] = useState(user?.location_prefs);
  useEffect(() => { if (user) setP(user.location_prefs); }, [user]);
  if (!p) return null;
  const save = async () => {
    const { error } = await updateProfile({ location_prefs: p });
    if (error) toast.error(error); else toast.success("Saved");
  };
  return (
    <Screen title="Location" back="/settings">
      <div className="rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label="Share my location" hint="Required to share spots" checked={p.share_location} onChange={(v) => setP({ ...p, share_location: v })} />
      </div>
      <div className="mt-4">
        <Field label={`Search radius · ${p.radius_m}m`}>
          <input type="range" min={200} max={3000} step={100} value={p.radius_m} onChange={(e) => setP({ ...p, radius_m: +e.target.value })} className="w-full accent-[var(--emerald)]" />
        </Field>
      </div>
      <div className="mt-6"><Button onClick={save}>Save</Button></div>
    </Screen>
  );
}
