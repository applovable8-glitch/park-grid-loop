import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Screen, Field, inputCls, Button, Toggle } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile/vehicles/add")({ component: EditVehicle });

const TYPES = ["Sedan", "SUV", "Hatchback", "Pickup", "Van", "Coupe", "Electric"];
const COLORS = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Green", "Other"];

function EditVehicle() {
  const { user, updateProfile } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const nav = useNavigate();

  const [plate, setPlate] = useState("");
  const [type, setType] = useState("Sedan");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("White");
  const [showPhone, setShowPhone] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPlate(user.plate ?? "");
    setType(user.car_type || "Sedan");
    setMake(user.car_make ?? "");
    setModel(user.car_model ?? "");
    setColor(user.car_color || "White");
    setShowPhone(user.show_phone ?? true);
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return toast.error(ar ? "أدخل رقم اللوحة" : "Enter your plate");
    setBusy(true);
    const { error } = await updateProfile({
      plate: plate.trim().toUpperCase(),
      car_type: type,
      car_make: make.trim() || null,
      car_model: model.trim() || null,
      car_color: color,
      show_phone: showPhone,
    });
    setBusy(false);
    if (error) return toast.error(error);
    toast.success(ar ? "تم حفظ المركبة" : "Vehicle saved");
    nav({ to: "/profile/vehicles" });
  };

  return (
    <Screen title={ar ? "تفاصيل المركبة" : "Vehicle details"} back="/profile/vehicles">
      <form onSubmit={submit} className="space-y-4">
        <Field label={ar ? "رقم اللوحة" : "Plate number"}>
          <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} maxLength={16} className={inputCls} placeholder="DXB A 12345" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={ar ? "النوع" : "Type"}>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label={ar ? "اللون" : "Colour"}>
            <select value={color} onChange={(e) => setColor(e.target.value)} className={inputCls}>
              {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={ar ? "الشركة" : "Make"}><input value={make} onChange={(e) => setMake(e.target.value)} className={inputCls} placeholder="Toyota" /></Field>
          <Field label={ar ? "الطراز" : "Model"}><input value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} placeholder="Camry" /></Field>
        </div>
        <div className="rounded-2xl bg-card p-1 shadow-[var(--shadow-card)]">
          <Toggle label={ar ? "السماح للسائقين بالاتصال بي" : "Let drivers call my number"} checked={showPhone} onChange={setShowPhone} />
        </div>
        <Button type="submit" variant="emerald" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> {ar ? "حفظ" : "Save vehicle"}</>}
        </Button>
      </form>
    </Screen>
  );
}
