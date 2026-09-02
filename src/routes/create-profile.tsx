import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { isProfileComplete } from "@/lib/use-require-auth";

export const Route = createFileRoute("/create-profile")({ component: CreateProfile });

const CAR_TYPES = ["Sedan", "SUV", "Hatchback", "Pickup", "Van", "Coupe", "Electric"];
const COLORS = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Green", "Other"];

function CreateProfile() {
  const { updateProfile, session, user, loading } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) { nav({ to: "/auth" }); return; }
    if (isProfileComplete(user)) nav({ to: "/home" });
  }, [loading, session, user, nav]);

  useEffect(() => {
    if (user) {
      setName((v) => v || user.name || "");
      setPhone((v) => v || user.phone || "");
      setPlate((v) => v || user.plate || "");
      setCarType((v) => user.car_type || v);
      setMake((v) => v || user.car_make || "");
      setModel((v) => v || user.car_model || "");
      setColor((v) => user.car_color || v);
      setShowPhone(user.show_phone ?? true);
    }
  }, [user]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [carType, setCarType] = useState("Sedan");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("White");
  const [showPhone, setShowPhone] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter your name");
    if (!phone.trim()) return toast.error("Enter your mobile number");
    if (!plate.trim()) return toast.error("Enter your vehicle plate");
    setBusy(true);
    const { error } = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      plate: plate.trim().toUpperCase(),
      car_type: carType,
      car_make: make.trim() || null,
      car_model: model.trim() || null,
      car_color: color,
      show_phone: showPhone,
    });
    setBusy(false);
    if (error) return toast.error(error);
    nav({ to: "/auth/success" });
  };

  return (
    <Screen title="Create your profile" back={false}>
      <p className="text-sm text-muted-foreground">
        Drivers see your car and contact details when you share or request a spot.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Alex Driver" />
        </Field>
        <Field label="Mobile number">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required maxLength={30} className={inputCls} placeholder="+971 50 000 0000" />
        </Field>
        <Field label="Vehicle plate">
          <input value={plate} onChange={(e) => setPlate(e.target.value)} required maxLength={16} className={inputCls} placeholder="DXB A 12345" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Car type">
            <select value={carType} onChange={(e) => setCarType(e.target.value)} className={inputCls}>
              {CAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Colour">
            <select value={color} onChange={(e) => setColor(e.target.value)} className={inputCls}>
              {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make"><input value={make} onChange={(e) => setMake(e.target.value)} className={inputCls} placeholder="Toyota" /></Field>
          <Field label="Model"><input value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} placeholder="Camry" /></Field>
        </div>
        <label className="flex items-center gap-3 rounded-2xl bg-muted p-3 text-sm">
          <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} className="h-4 w-4 accent-[var(--emerald)]" />
          Let other drivers call me on my number
        </label>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
      </form>
    </Screen>
  );
}
