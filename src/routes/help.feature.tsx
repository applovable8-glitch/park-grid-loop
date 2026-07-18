import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Field, inputCls, Button } from "@/components/kit";

export const Route = createFileRoute("/help/feature")({ component: Feature });

function Feature() {
  const nav = useNavigate();
  const [idea, setIdea] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea) return toast.error("Share your idea first");
    toast.success("Thanks — feature request logged");
    nav({ to: "/help" });
  };
  return (
    <Screen title="Feature request" back="/help">
      <form onSubmit={submit} className="space-y-3">
        <Field label="What should we build?"><textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={6} className={inputCls} placeholder="I wish ParkOut could…" /></Field>
        <Button type="submit">Send suggestion</Button>
      </form>
    </Screen>
  );
}
