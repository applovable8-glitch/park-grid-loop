import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/reports/appeal")({ component: Appeal });

function Appeal() {
  const nav = useNavigate();
  const [text, setText] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return toast.error("Please explain your appeal");
    toast.success("Appeal submitted");
    nav({ to: "/help" });
  };
  return (
    <Screen title="Appeal a decision" back="/help">
      <p className="text-sm text-muted-foreground">If your account was restricted or a report was rejected, share your side of the story.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Your appeal"><textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className={inputCls} placeholder="I believe this was a misunderstanding because…" /></Field>
        <Button type="submit">Submit appeal</Button>
      </form>
    </Screen>
  );
}
