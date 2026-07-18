import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/help/bug")({ component: Bug });

function Bug() {
  const nav = useNavigate();
  const [what, setWhat] = useState("");
  const [steps, setSteps] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!what) return toast.error("Describe the bug first");
    toast.success("Bug report received. Thanks!");
    nav({ to: "/help" });
  };
  return (
    <Screen title="Report a bug" back="/help">
      <form onSubmit={submit} className="space-y-3">
        <Field label="What went wrong?"><input value={what} onChange={(e) => setWhat(e.target.value)} className={inputCls} /></Field>
        <Field label="Steps to reproduce"><textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={5} className={inputCls} placeholder="1. Open …" /></Field>
        <Button type="submit">Send bug report</Button>
      </form>
    </Screen>
  );
}
