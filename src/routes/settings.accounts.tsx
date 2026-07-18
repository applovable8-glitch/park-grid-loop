import { createFileRoute } from "@tanstack/react-router";
import { Screen, Row, RowGroup, Badge } from "@/components/kit";
import { Mail, Facebook } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/settings/accounts")({ component: Accounts });

function Accounts() {
  const { user, signInWithOAuth } = useApp();
  const connect = async (p: "google" | "apple") => { const { error } = await signInWithOAuth(p); if (error) toast.error(error); };
  return (
    <Screen title="Connected accounts" back="/settings">
      <RowGroup>
        <Row icon={Mail} label="Email" hint={user?.email} right={<Badge tone="emerald">Primary</Badge>} />
        <Row icon={Mail} label="Google" hint="Sign in with Google" onClick={() => connect("google")} />
        <Row icon={Mail} label="Apple" hint="Sign in with Apple" onClick={() => connect("apple")} />
        <Row icon={Facebook} label="Facebook" hint="Not connected" onClick={() => toast.info("Facebook login coming soon")} />
      </RowGroup>
    </Screen>
  );
}
