import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/profile/vehicles/add")({ component: Add });

function Add() {
  const { updateProfile } = useApp();
  const nav = useNavigate();
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return toast.error("Enter your plate");
    const { error } = await updateProfile({ plate: plate.trim().toUpperCase() });
    if (error) return toast.error(error);
    toast.success("Vehicle added");
    nav({ to: "/profile/vehicles" });
  };
  return (
    <Screen title="Add vehicle" back="/profile/vehicles">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Plate number"><input value={plate} onChange={(e) => setPlate(e.target.value)} className={inputCls} placeholder="DXB A 12345" /></Field>
        <Field label="Model (optional)"><input value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} placeholder="Tesla Model 3" /></Field>
        <Field label="Color (optional)"><input value={color} onChange={(e) => setColor(e.target.value)} className={inputCls} placeholder="Pearl white" /></Field>
        <Button type="submit" variant="emerald">Save vehicle</Button>
      </form>
    </Screen>
  );
}
