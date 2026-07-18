import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/reports/user")({ component: ReportUser });

const reasons = ["Fake parking", "No-show", "Harassment", "Impersonation", "Other"];

function ReportUser() {
  const nav = useNavigate();
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Report received · Trust team notified");
    nav({ to: "/home" });
  };
  return (
    <Screen title="Report user" back="/home">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
            {reasons.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Details"><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className={inputCls} /></Field>
        <Button variant="danger" type="submit">Report</Button>
      </form>
    </Screen>
  );
}
