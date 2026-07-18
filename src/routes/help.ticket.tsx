import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/help/ticket")({ component: Ticket });

function Ticket() {
  const nav = useNavigate();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) return toast.error("Fill in both fields");
    toast.success("Ticket submitted · #PK-" + Math.floor(Math.random() * 90000 + 10000));
    nav({ to: "/help" });
  };
  return (
    <Screen title="Submit a ticket" back="/help">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} /></Field>
        <Field label="Describe the issue"><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className={inputCls} /></Field>
        <Button type="submit">Send ticket</Button>
      </form>
    </Screen>
  );
}
