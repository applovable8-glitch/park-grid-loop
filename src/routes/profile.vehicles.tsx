import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Pencil, Star, Palette, Hash } from "lucide-react";
import { Screen, Card, Button, Badge } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile/vehicles")({ component: Vehicles });

function Vehicles() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const hasVehicle = Boolean(user?.plate);
  const title = [user?.car_make, user?.car_model].filter(Boolean).join(" ") || (ar ? "مركبتي" : "My vehicle");

  return (
    <Screen
      title={ar ? "مركباتي" : "My vehicles"}
      back="/profile"
      right={<Link to="/profile/vehicles/add" className="rounded-full bg-primary p-2 text-primary-foreground transition active:scale-90"><Pencil className="h-4 w-4" /></Link>}
    >
      {!hasVehicle ? (
        <Card className="animate-fade-in text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Car className="h-6 w-6" /></div>
          <p className="mt-3 font-semibold">{ar ? "لا توجد مركبة بعد" : "No vehicle yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{ar ? "أضف رقم لوحتك ليتعرف عليك السائقون." : "Add your plate so drivers can recognise you."}</p>
          <Link to="/profile/vehicles/add"><Button className="mt-4" variant="emerald">{ar ? "إضافة مركبة" : "Add vehicle"}</Button></Link>
        </Card>
      ) : (
        <>
          <div className="animate-fade-in overflow-hidden rounded-3xl p-5 text-white" style={{ background: "var(--gradient-hero)" }}>
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><Car className="h-6 w-6" /></div>
              <Badge tone="emerald"><Star className="h-3 w-3" /> {ar ? "أساسية" : "Primary"}</Badge>
            </div>
            <p className="mt-4 font-[var(--font-display)] text-xl font-bold">{title}</p>
            <p className="mt-1 inline-block rounded-lg bg-white/15 px-3 py-1 font-[var(--font-display)] text-lg font-bold tracking-widest">{user?.plate}</p>
          </div>

          <div className="mt-3 space-y-2">
            <InfoRow icon={Hash} label={ar ? "النوع" : "Type"} value={user?.car_type || "—"} />
            <InfoRow icon={Palette} label={ar ? "اللون" : "Colour"} value={user?.car_color || "—"} />
            <InfoRow icon={Car} label={ar ? "الطراز" : "Make & model"} value={[user?.car_make, user?.car_model].filter(Boolean).join(" ") || "—"} />
          </div>

          <Link to="/profile/vehicles/add"><Button className="mt-4" variant="secondary"><Pencil className="h-4 w-4" /> {ar ? "تعديل المركبة" : "Edit vehicle"}</Button></Link>
        </>
      )}
    </Screen>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><Icon className="h-4 w-4" /></div>
      <p className="flex-1 text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
