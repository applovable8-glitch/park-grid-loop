import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Plus, Star } from "lucide-react";
import { Screen, Card, Button, Badge } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/profile/vehicles")({ component: Vehicles });

function Vehicles() {
  const { user } = useApp();
  const plate = user?.plate;
  const list = plate ? [{ id: "1", plate, model: "Primary vehicle", primary: true }] : [];
  return (
    <Screen title="My vehicles" back="/profile" right={<Link to="/profile/vehicles/add" className="rounded-full bg-primary p-2 text-primary-foreground"><Plus className="h-4 w-4" /></Link>}>
      {list.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Car className="h-6 w-6" /></div>
          <p className="mt-3 font-semibold">No vehicles yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your plate for a smoother sharing experience.</p>
          <Link to="/profile/vehicles/add"><Button className="mt-4" variant="emerald">Add vehicle</Button></Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((v) => (
            <Card key={v.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Car className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="font-[var(--font-display)] text-base font-bold">{v.plate}</p>
                  <p className="text-xs text-muted-foreground">{v.model}</p>
                </div>
                {v.primary && <Badge tone="emerald"><Star className="h-3 w-3" /> Primary</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}
