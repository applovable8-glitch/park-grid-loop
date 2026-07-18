import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { InfoState, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/verify-email")({ component: VerifyEmail });

function VerifyEmail() {
  const { user, session } = useApp();
  const email = session?.user?.email || user?.email || "your email";
  return (
    <div className="min-h-screen bg-background">
      <InfoState
        icon={Mail}
        title="Check your inbox"
        description={`We sent a verification link to ${email}. Tap it to activate your account, then come back.`}
        action={
          <div className="space-y-2">
            <Link to="/home"><Button>Continue</Button></Link>
            <Link to="/auth" className="block text-center text-xs text-muted-foreground underline">Use a different email</Link>
          </div>
        }
      />
    </div>
  );
}
