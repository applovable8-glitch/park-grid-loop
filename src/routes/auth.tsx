import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { captureReferralFromUrl, pendingReferralCode } from "@/lib/referrals";
import { Gift } from "lucide-react";
import howFind from "@/assets/how-find.png";
import howShare from "@/assets/how-share.png";
import howEarn from "@/assets/how-earn.png";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const nav = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, resetPassword } = useApp();
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google" | "apple" | "reset">(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    captureReferralFromUrl();
    setInviteCode(pendingReferralCode());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy("email");
    if (mode === "login") {
      const { error } = await signInWithEmail(email, password);
      setBusy(null);
      if (error) { toast.error(error); return; }
      toast.success("Welcome back");
      nav({ to: "/home" });
    } else {
      if (!name.trim()) { setBusy(null); toast.error("Please enter your name"); return; }
      const { error } = await signUpWithEmail(email, password, name.trim());
      setBusy(null);
      if (error) { toast.error(error); return; }
      toast.success("Account created — complete your profile");
      nav({ to: "/create-profile" });
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setBusy(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) { setBusy(null); toast.error(error); return; }
    // The OAuth helper either redirects or sets the session; navigate on success
    setBusy(null);
    nav({ to: "/home" });
  };

  const forgot = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    setBusy("reset");
    const { error } = await resetPassword(email);
    setBusy(null);
    if (error) toast.error(error);
    else toast.success("Password reset email sent");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="relative h-56 overflow-hidden text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -end-10 -top-10 h-56 w-56 rounded-full bg-emerald/25 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-6">
          <div className="flex items-center gap-2 text-white/80">
            <MapPin className="h-5 w-5" fill="var(--emerald)" strokeWidth={2} />
            <span className="text-sm font-semibold tracking-wide">AndiPark</span>
          </div>
          <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold leading-tight">
            {mode === "login" ? t("welcome_back") : t("join_movement")}
          </h1>
          <p className="mt-1 text-sm text-white/70">{t("auth_tagline")}</p>
        </div>
      </div>

      <div className="animate-scale-in -mt-8 flex-1 rounded-t-[28px] bg-background px-6 pb-10 pt-6 shadow-[var(--shadow-elevated)]">
        <div className="flex rounded-full bg-muted p-1">
          {(["login", "register"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
                mode === m ? "bg-background text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground"}`}>
              {m === "login" ? t("log_in") : t("sign_up")}
            </button>
          ))}
        </div>

        {inviteCode && (
          <div className="animate-scale-in mt-4 flex items-center gap-3 rounded-2xl bg-emerald/10 p-3 ring-1 ring-emerald/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/15 text-[color:var(--emerald)]">
              <Gift className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t("invite_applied_title")}</p>
              <p className="text-xs text-muted-foreground">{t("invite_applied_desc")} <span className="font-bold tracking-widest">{inviteCode}</span></p>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="animate-fade-up mt-5 space-y-3">
          {mode === "register" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("name")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Alex Driver"
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15" />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("email")}</span>
            <div className="relative">
              <Mail className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required
                className="w-full rounded-2xl border border-border bg-card py-3 ps-11 pe-4 text-sm outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("password")}</span>
            <div className="relative">
              <Lock className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6}
                className="w-full rounded-2xl border border-border bg-card py-3 ps-11 pe-4 text-sm outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15" />
            </div>
          </label>

          {mode === "login" && (
            <button type="button" onClick={forgot} className="ms-1 text-xs font-medium text-muted-foreground underline">
              {t("forgot_password")}
            </button>
          )}

          <button type="submit" disabled={busy !== null}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary transition-transform hover:scale-[1.01] py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
              {mode === "login" ? t("log_in") : t("create_account")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </>}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> {t("or_continue_with")} <div className="h-px flex-1 bg-border" />
        </div>

        <div className="animate-fade-up grid grid-cols-2 gap-3">
          <button onClick={() => oauth("google")} disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted disabled:opacity-60">
            {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4 5.6 5.6 0 0 1 3.95 1.53l2.7-2.6A9.4 9.4 0 0 0 12 2.4a9.6 9.6 0 1 0 0 19.2c5.55 0 9.2-3.9 9.2-9.4 0-.65-.07-1.15-.16-2H12z" /></svg>
            )}
            Google
          </button>
          <button onClick={() => oauth("apple")} disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted disabled:opacity-60">
            {busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16.365 1.43c0 1.14-.42 2.23-1.19 3.02-.83.87-2.17 1.52-3.28 1.44-.13-1.09.4-2.22 1.15-3.02.83-.87 2.24-1.5 3.32-1.44zM20.5 17.4c-.55 1.27-.82 1.83-1.53 2.95-.99 1.55-2.39 3.48-4.11 3.5-1.53.02-1.93-.99-4.01-.98-2.08.01-2.52 1-4.05.98-1.72-.02-3.05-1.76-4.04-3.31C.5 16.3-.06 11.9 2.13 9.29c1.11-1.32 2.86-2.16 4.5-2.16 1.68 0 2.73.9 4.11.9 1.34 0 2.15-.9 4.1-.9 1.47 0 3.03.8 4.14 2.19-3.64 2-3.05 7.2 1.52 8.08z" /></svg>
            )}
            Apple
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-center font-[var(--font-display)] text-base font-bold">{t("how_it_works")}</h2>
          <div className="mt-4 space-y-3">
            {[
              { img: howFind, t: t("how1_t"), d: t("how1_d") },
              { img: howShare, t: t("how2_t"), d: t("how2_d") },
              { img: howEarn, t: t("how3_t"), d: t("how3_d") },
            ].map((s, i) => (
              <div
                key={s.t}
                className="animate-fade-up hover-scale flex items-center gap-3 rounded-3xl bg-card p-3 shadow-[var(--shadow-card)]"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <img src={s.img} alt={s.t} loading="lazy" width={640} height={640} className="h-16 w-16 shrink-0 rounded-2xl bg-muted object-contain p-1" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{s.t}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("terms_agree")}
        </p>
      </div>
    </div>
  );
}
