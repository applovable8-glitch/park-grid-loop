import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Users, Gift } from "lucide-react";
import { Screen, Card, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/rewards/invite")({ component: Invite });

function Invite() {
  const { user } = useApp();
  const code = (user?.id ?? "PARKOUT").slice(0, 6).toUpperCase();
  const link = `https://parkout.app/i/${code}`;
  const copy = async () => { await navigator.clipboard.writeText(link); toast.success("Invite link copied"); };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: "ParkOut", text: "Join me on ParkOut and get 100 free points", url: link }); } catch {} }
    else copy();
  };
  return (
    <Screen title="Invite friends" back="/rewards">
      <Card className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald/15 text-[color:var(--emerald)]"><Users className="h-8 w-8" /></div>
        <h2 className="mt-3 font-[var(--font-display)] text-xl font-bold">Give 100, get 100</h2>
        <p className="mt-1 text-sm text-muted-foreground">Both you and your friend earn 100 points when they sign up and share their first spot.</p>
        <div className="mt-4 rounded-2xl bg-muted p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your code</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">{code}</p>
        </div>
      </Card>
      <div className="mt-4 space-y-2">
        <Button variant="emerald" onClick={share}><Gift className="h-4 w-4" /> Share invite</Button>
        <Button variant="secondary" onClick={copy}><Copy className="h-4 w-4" /> Copy link</Button>
      </div>
    </Screen>
  );
}
