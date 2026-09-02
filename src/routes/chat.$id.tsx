import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Car, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/parkout-store";
import { carLabel, useDriverProfile, useThread } from "@/lib/chat";

export const Route = createFileRoute("/chat/$id")({
  component: ChatScreen,
  validateSearch: (s: Record<string, unknown>) => ({
    spot: typeof s['spot'] === "string" ? (s['spot'] as string) : undefined,
  }),
});

function ChatScreen() {
  const { id } = useParams({ from: "/chat/$id" });
  const { spot } = useSearch({ from: "/chat/$id" });
  const { user } = useApp();
  const { profile } = useDriverProfile(id);
  const { messages, send } = useThread(user?.id, id, spot ?? null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text;
    setText("");
    const { error } = await send(body);
    if (error) { toast.error(error); setText(body); }
  };

  const phone = profile?.show_phone ? profile?.phone : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
        <Link to="/search" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {(profile?.name?.[0] ?? "D").toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{profile?.name || "Driver"}</p>
          <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <Car className="h-3 w-3" /> {carLabel(profile)}{profile?.plate ? ` · ${profile.plate}` : ""}
          </p>
        </div>
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--emerald)] text-white">
            <Phone className="h-4 w-4" />
          </a>
        )}
      </header>

      <div className="flex-1 space-y-2 px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            Say hello — ask about the exact spot or the exit time.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  mine ? "bg-[var(--emerald)] text-white" : "bg-card shadow-[var(--shadow-card)]"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          maxLength={1000}
          className="flex-1 rounded-2xl bg-muted px-4 py-3 text-sm outline-none"
        />
        <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--emerald)] text-white" aria-label="Send">
          <Send className="h-4 w-4 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
}
