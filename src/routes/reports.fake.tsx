import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/reports/fake")({ component: FakeParking });

function FakeParking() {
  const nav = useNavigate();
  const [addr, setAddr] = useState("");
  const [details, setDetails] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr) return toast.error("Enter the parking address");
    toast.success("Report submitted · Thanks");
    nav({ to: "/home" });
  };
  return (
    <Screen title="Report fake parking" back="/home">
      <p className="text-sm text-muted-foreground">Help us keep the map trustworthy. Reports are reviewed within 24 hours.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Parking address"><input value={addr} onChange={(e) => setAddr(e.target.value)} className={inputCls} /></Field>
        <Field label="What was wrong?"><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className={inputCls} placeholder="No spot when I arrived…" /></Field>
        <Button variant="danger" type="submit">Submit report</Button>
      </form>
    </Screen>
  );
}
