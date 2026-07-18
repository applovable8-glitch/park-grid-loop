import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button, Toggle, Row, RowGroup } from "@/components/kit";
import { Smartphone, Fingerprint, LogOut } from "lucide-react";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/settings/security")({ component: Security });

function Security() {
  const { updatePassword, signOut } = useApp();
  const nav = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [twoFa, setTwoFa] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) return toast.error("Password must be 6+ characters");
    const { error } = await updatePassword(next);
    if (error) toast.error(error); else { toast.success("Password updated"); nav({ to: "/settings" }); }
  };
  return (
    <Screen title="Security" back="/settings">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Current password"><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} /></Field>
        <Field label="New password"><input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} /></Field>
        <Button type="submit">Change password</Button>
      </form>
      <RowGroup title="Two-factor">
        <div className="rounded-2xl">
          <Toggle label="Two-factor authentication" hint="SMS code on login" checked={twoFa} onChange={setTwoFa} />
          <Toggle label="Biometric unlock" hint="Face ID / fingerprint" checked={biometric} onChange={setBiometric} />
        </div>
      </RowGroup>
      <RowGroup title="Sessions">
        <Row icon={Smartphone} label="This device" hint="Signed in now" />
        <Row icon={Fingerprint} label="Manage sessions" hint="See all devices" onClick={() => toast.info("No other active sessions")} />
        <Row icon={LogOut} label="Sign out of all devices" danger onClick={async () => { await signOut(); nav({ to: "/auth" }); }} />
      </RowGroup>
    </Screen>
  );
}
