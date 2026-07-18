import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/create-profile")({ component: CreateProfile });

function CreateProfile() {
  const { updateProfile } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter your name");
    setBusy(true);
    const { error } = await updateProfile({ name: name.trim(), plate: plate.trim().toUpperCase() || null });
    setBusy(false);
    if (error) return toast.error(error);
    nav({ to: "/auth/success" });
  };

  return (
    <Screen title="Create your profile" back="/auth">
      <p className="text-sm text-muted-foreground">Just a couple of details so drivers can find and trust you.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Alex Driver" /></Field>
        <Field label="Vehicle plate (optional)"><input value={plate} onChange={(e) => setPlate(e.target.value)} className={inputCls} placeholder="DXB A 12345" /></Field>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
      </form>
    </Screen>
  );
}
