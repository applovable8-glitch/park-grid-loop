import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck, Loader2, RefreshCw, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirm your email — AndiPark" },
      { name: "description", content: "Confirm your email address to finish setting up your AndiPark account." },
      { property: "og:title", content: "Confirm your email — AndiPark" },
      { property: "og:description", content: "Confirm your email address to finish setting up your AndiPark account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyEmail,
});

const copy = {
  en: {
    title: "Confirm your email",
    body: "We sent a confirmation link to",
    hint: "Open the link on this device, then come back and tap “I've confirmed”.",
    resend: "Resend the link",
    check: "I've confirmed",
    signout: "Use a different account",
    sent: "Confirmation link sent",
    notyet: "Still not confirmed. Open the link in your inbox first.",
    done: "Email confirmed",
  },
  ar: {
    title: "أكّد بريدك الإلكتروني",
    body: "أرسلنا رابط تأكيد إلى",
    hint: "افتح الرابط من هذا الجهاز، ثم عد واضغط «لقد أكّدت».",
    resend: "إعادة إرسال الرابط",
    check: "لقد أكّدت",
    signout: "استخدام حساب آخر",
    sent: "تم إرسال رابط التأكيد",
    notyet: "لم يتم التأكيد بعد. افتح الرابط في بريدك أولًا.",
    done: "تم تأكيد البريد",
  },
} as const;

function VerifyEmail() {
  const nav = useNavigate();
  const { lang } = useI18n();
  const { session, loading } = useApp();
  const c = copy[lang === "ar" ? "ar" : "en"];
  const [busy, setBusy] = useState<null | "resend" | "check">(null);
  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  const resend = async () => {
    if (!email) return;
    setBusy("resend");
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success(c.sent);
  };

  const check = async () => {
    setBusy("check");
    const { data, error } = await supabase.auth.getUser();
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    if (data.user?.email_confirmed_at) {
      toast.success(c.done);
      nav({ to: "/home" });
    } else {
      toast.error(c.notyet);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <div className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald/12 text-[color:var(--emerald)]">
        <MailCheck className="h-9 w-9" />
      </div>
      <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {c.body} <span className="font-semibold text-foreground">{email}</span>
      </p>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">{c.hint}</p>

      <div className="mt-8 w-full max-w-xs space-y-3">
        <button
          type="button"
          onClick={check}
          disabled={busy !== null}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
        >
          {busy === "check" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {c.check}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={busy !== null}
          className="w-full rounded-2xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted disabled:opacity-60"
        >
          {busy === "resend" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : c.resend}
        </button>
        <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline">
          <LogOut className="h-3.5 w-3.5" /> {c.signout}
        </button>
      </div>
    </div>
  );
}
