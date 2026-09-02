import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Car } from "lucide-react";
import { Screen, EmptyState, SkeletonList } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { carLabel, useThreads } from "@/lib/chat";
import { useRequireAuth } from "@/lib/use-require-auth";

export const Route = createFileRoute("/messages")({
  component: MessagesScreen,
  head: () => ({
    meta: [
      { title: "Messages — ParkOut" },
      { name: "description", content: "Chat with drivers about parking spots, exit times and handoffs on ParkOut." },
      { property: "og:title", content: "Messages — ParkOut" },
      { property: "og:description", content: "Chat with drivers about parking spots, exit times and handoffs on ParkOut." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function timeAgo(iso: string, ar: boolean) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return ar ? "الآن" : "now";
  if (m < 60) return ar ? `${m} د` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return ar ? `${h} س` : `${h}h`;
  return new Date(iso).toLocaleDateString();
}

function MessagesScreen() {
  useRequireAuth();
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { threads, loading } = useThreads(user?.id);

  return (
    <Screen title={ar ? "الرسائل" : "Messages"} back="/home">
      {loading ? (
        <SkeletonList n={4} />
      ) : threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={ar ? "لا توجد محادثات" : "No conversations yet"}
          description={
            ar
              ? "عند تواصل شخص معك حول موقفك ستظهر المحادثة هنا."
              : "When someone contacts you about your spot, the chat appears here."
          }
        />
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link
              key={t.otherId}
              to="/chat/$id"
              params={{ id: t.otherId }}
              search={{ spot: t.spotId ?? undefined }}
              className="flex items-center gap-3 rounded-2xl bg-card px-3.5 py-3 shadow-[var(--shadow-card)]"
            >
              {t.profile?.avatar_url ? (
                <img src={t.profile.avatar_url} alt={t.profile.name} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {(t.profile?.name?.[0] ?? "D").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold">{t.profile?.name || (ar ? "سائق" : "Driver")}</p>
                  <span className="ms-auto shrink-0 text-[10px] text-muted-foreground">{timeAgo(t.lastAt, ar)}</span>
                </div>
                <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <Car className="h-3 w-3 shrink-0" /> {carLabel(t.profile)}
                  {t.profile?.plate ? ` · ${t.profile.plate}` : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">{t.lastBody}</p>
              </div>
              {t.unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--emerald)] px-1.5 text-[10px] font-bold text-white">
                  {t.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </Screen>
  );
}
