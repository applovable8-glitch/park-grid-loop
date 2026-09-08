import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Users, Gift, Check, Share2, Ticket } from "lucide-react";
import { Screen, Card, Button, inputCls } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { useReferral, redeemReferral } from "@/lib/referrals";
import { timeAgo } from "@/lib/points-labels";

export const Route = createFileRoute("/rewards/invite")({ component: Invite });

function Invite() {
  const { user, refreshProfile } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { code, link, friends, loading, refresh: reloadRefs } = useReferral(user?.id);
  const [copied, setCopied] = useState(false);
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(ar ? "تم نسخ رابط الدعوة" : "Invite link copied");
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (!link) return;
    const text = ar ? "انضم إلي في AndiPark واحصل على 100 نقطة مجانية" : "Join me on AndiPark and get 100 free points";
    if (navigator.share) { try { await navigator.share({ title: "AndiPark", text, url: link }); return; } catch { /* cancelled */ } }
    await copy();
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.trim()) return;
    setBusy(true);
    const { error } = await redeemReferral(entry);
    setBusy(false);
    if (error) {
      const map: Record<string, string> = {
        invalid_code: ar ? "رمز غير صحيح" : "That code doesn't exist",
        own_code: ar ? "لا يمكنك استخدام رمزك الخاص" : "You can't use your own code",
        already_referred: ar ? "لقد استخدمت رمز دعوة من قبل" : "You already used an invite code",
      };
      return toast.error(map[error] ?? error);
    }
    setEntry("");
    toast.success(ar ? "تم! حصلت على 100 نقطة" : "Done! You earned 100 points");
    await refreshProfile();
    await reloadRefs();
  };

  return (
    <Screen title={ar ? "دعوة الأصدقاء" : "Invite friends"} back="/rewards">
      <Card className="text-center">
        <div className="mx-auto flex h-16 w-16 animate-scale-in items-center justify-center rounded-3xl bg-emerald/15 text-[color:var(--emerald)]">
          <Users className="h-8 w-8" />
        </div>
        <h2 className="mt-3 font-[var(--font-display)] text-xl font-bold">{ar ? "امنح 100، واربح 100" : "Give 100, get 100"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar ? "تحصل أنت وصديقك على 100 نقطة عند انضمامه عبر رابطك." : "You and your friend each earn 100 points when they join with your link."}
        </p>
        <div className="mt-4 rounded-2xl bg-muted p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{ar ? "رمزك" : "Your code"}</p>
          <p className="font-[var(--font-display)] text-3xl font-bold tracking-[0.25em]">{code ?? "······"}</p>
        </div>
        {link && (
          <p className="mt-2 truncate rounded-xl bg-card px-3 py-2 text-[11px] text-muted-foreground ring-1 ring-border">{link}</p>
        )}
      </Card>

      <div className="mt-4 space-y-2">
        <Button variant="emerald" onClick={share} disabled={!link}><Share2 className="h-4 w-4" /> {ar ? "مشاركة الدعوة" : "Share invite"}</Button>
        <Button variant="secondary" onClick={copy} disabled={!link}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {ar ? "نسخ الرابط" : "Copy link"}
        </Button>
      </div>

      {!user?.referred_by && (
        <Card className="mt-5">
          <p className="flex items-center gap-2 text-sm font-semibold"><Ticket className="h-4 w-4 text-[color:var(--emerald)]" /> {ar ? "لديك رمز دعوة؟" : "Got an invite code?"}</p>
          <form onSubmit={submitCode} className="mt-3 flex gap-2">
            <input value={entry} onChange={(e) => setEntry(e.target.value.toUpperCase())} maxLength={12}
              placeholder={ar ? "مثال: A1B2C3" : "e.g. A1B2C3"} className={`${inputCls} tracking-widest`} />
            <button type="submit" disabled={busy || !entry.trim()}
              className="shrink-0 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-50">
              {ar ? "تفعيل" : "Apply"}
            </button>
          </form>
        </Card>
      )}

      <h3 className="mt-6 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {ar ? "أصدقاء انضموا" : "Friends joined"} · {friends.length}
      </h3>
      <div className="mt-2 space-y-2">
        {!loading && friends.length === 0 && (
          <p className="rounded-2xl bg-card p-4 text-center text-xs text-muted-foreground shadow-[var(--shadow-card)]">
            {ar ? "لم ينضم أحد بعد. شارك رابطك!" : "Nobody yet. Share your link!"}
          </p>
        )}
        {friends.map((f) => (
          <div key={f.id} className="flex animate-fade-in items-center gap-3 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
            {f.avatar_url
              ? <img src={f.avatar_url} alt={f.name} className="h-10 w-10 rounded-2xl object-cover" />
              : <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald/15 text-sm font-bold text-[color:var(--emerald)]">{f.name.charAt(0).toUpperCase()}</div>}
            <div className="flex-1">
              <p className="text-sm font-semibold">{f.name}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(f.created_at, ar)}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2.5 py-1 text-xs font-bold text-[color:var(--emerald)]">
              <Gift className="h-3 w-3" /> +{f.points_awarded}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}
