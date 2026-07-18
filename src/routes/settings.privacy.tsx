import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Toggle, Button, Row, RowGroup } from "@/components/kit";
import { Users, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings/privacy")({ component: Privacy });

function Privacy() {
  const [publicProfile, setPublicProfile] = useState(true);
  const [showPlate, setShowPlate] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  return (
    <Screen title="Privacy" back="/settings">
      <div className="rounded-3xl bg-card p-1 shadow-[var(--shadow-card)]">
        <Toggle label="Public profile" hint="Other drivers see your name" checked={publicProfile} onChange={setPublicProfile} />
        <Toggle label="Show vehicle plate" hint="Only during handoffs" checked={showPlate} onChange={setShowPlate} />
        <Toggle label="Analytics" hint="Help us improve ParkOut" checked={analytics} onChange={setAnalytics} />
      </div>
      <RowGroup title="Data">
        <Row icon={Users} label="Blocked users" to="/reports/blocked" />
        <Row icon={Trash2} label="Delete my account" danger onClick={() => toast.error("Contact support to delete your account")} />
      </RowGroup>
      <div className="mt-6"><Button onClick={() => toast.success("Privacy saved")}>Save</Button></div>
    </Screen>
  );
}
