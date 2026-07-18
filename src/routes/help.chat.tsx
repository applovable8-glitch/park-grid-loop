import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { Screen } from "@/components/kit";

export const Route = createFileRoute("/help/chat")({ component: Chat });

type Msg = { from: "you" | "bot"; text: string };

function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi there! I'm ParkOut support. How can I help?" },
  ]);
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "you", text }]);
    setText("");
    setTimeout(() => setMsgs((m) => [...m, { from: "bot", text: "Thanks — a human agent will pick this up in a moment." }]), 800);
  };
  return (
    <Screen title="Live chat" back="/help" bottomPad={24}>
      <div className="space-y-2 pb-24">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "you" ? "ml-auto bg-primary text-primary-foreground" : "bg-card shadow-[var(--shadow-card)]"}`}>{m.text}</div>
        ))}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[440px] items-center gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message" className="flex-1 rounded-full bg-muted px-4 py-3 text-sm outline-none" />
        <button onClick={send} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
      </div>
    </Screen>
  );
}
