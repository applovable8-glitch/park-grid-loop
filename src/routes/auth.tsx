import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, MailCheck, User, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { captureReferralFromUrl, pendingReferralCode } from "@/lib/referrals";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AndiPark" },
      { name: "description", content: "Sign in or create your AndiPark account to find and share real-time parking." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign in — AndiPark" },
      { property: "og:description", content: "Sign in or create your AndiPark account to find and share real-time parking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});

const inputBase =
  "w-full rounded-2xl border border-border bg-card py-3.5 text-[15px] outline-none transition-colors focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15";

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
  const [showPass, setShowPass] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.success("Check your email to confirm your account");
        setPendingEmail(email);
        return;
      }
      toast.success("Account created — complete your profile");
      nav({ to: "/create-profile" });
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setBusy(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) { setBusy(null); toast.error(error); return; }
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
    <main
      className="flex min-h-[100svh] w-full flex-col overflow-x-hidden bg-background"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 0.5rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card p-1.5 shadow-[var(--shadow-card)] ring-1 ring-border">
            <img src="/andipark-logo.png" alt="AndiPark" width={44} height={44} className="h-full w-full object-contain" />
          </span>
          <span className="font-[var(--font-display)] text-base font-bold tracking-tight">AndiPark</span>
        </div>

        {/* Heading */}
        <h1 className="mt-6 font-[var(--font-display)] text-[26px] font-bold leading-tight tracking-tight">
          {mode === "login" ? t("welcome_back") : t("join_movement")}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("auth_tagline")}</p>

        {/* Mode switch */}
        <div className="mt-5 flex rounded-full bg-muted p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                mode === m ? "bg-background text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground"
              }`}
            >
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
              <p className="text-xs text-muted-foreground">
                {t("invite_applied_desc")} <span className="font-bold tracking-widest">{inviteCode}</span>
              </p>
            </div>
          </div>
        )}

        {pendingEmail && (
          <div className="animate-scale-in mt-4 flex items-start gap-3 rounded-2xl bg-emerald/10 p-3 ring-1 ring-emerald/30">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--emerald)]" />
            <div className="min-w-0 text-start">
              <p className="text-sm font-bold">Confirm your email</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                We sent a confirmation link to <span className="font-semibold text-foreground">{pendingEmail}</span>. Open it, then log in here.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="mt-5 space-y-3.5">
          {mode === "register" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("name")}</span>
              <div className="relative">
                <User className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className={`${inputBase} ps-11 pe-4`}
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("email")}</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                className={`${inputBase} ps-11 pe-4`}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("password")}</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                className={`${inputBase} ps-11 pe-12`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {mode === "login" && (
            <div className="flex justify-end">
              <button type="button" onClick={forgot} className="text-xs font-semibold text-[color:var(--emerald)]">
                {t("forgot_password")}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={busy !== null}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? t("log_in") : t("create_account")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        {/* Social */}
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> {t("or_continue_with")} <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => oauth("google")}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
          >
            {busy === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4 5.6 5.6 0 0 1 3.95 1.53l2.7-2.6A9.4 9.4 0 0 0 12 2.4a9.6 9.6 0 1 0 0 19.2c5.55 0 9.2-3.9 9.2-9.4 0-.65-.07-1.15-.16-2H12z" />
              </svg>
            )}
            Google
          </button>
          <button
            onClick={() => oauth("apple")}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
          >
            {busy === "apple" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M16.365 1.43c0 1.14-.42 2.23-1.19 3.02-.83.87-2.17 1.52-3.28 1.44-.13-1.09.4-2.22 1.15-3.02.83-.87 2.24-1.5 3.32-1.44zM20.5 17.4c-.55 1.27-.82 1.83-1.53 2.95-.99 1.55-2.39 3.48-4.11 3.5-1.53.02-1.93-.99-4.01-.98-2.08.01-2.52 1-4.05.98-1.72-.02-3.05-1.76-4.04-3.31C.5 16.3-.06 11.9 2.13 9.29c1.11-1.32 2.86-2.16 4.5-2.16 1.68 0 2.73.9 4.11.9 1.34 0 2.15-.9 4.1-.9 1.47 0 3.03.8 4.14 2.19-3.64 2-3.05 7.2 1.52 8.08z" />
              </svg>
            )}
            Apple
          </button>
        </div>

        <div className="mt-auto pt-8">
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                {"Don't have an account? "}
                <button type="button" onClick={() => setMode("register")} className="font-semibold text-[color:var(--emerald)]">
                  {t("sign_up")}
                </button>
              </>
            ) : (
              <>
                {"Already have an account? "}
                <button type="button" onClick={() => setMode("login")} className="font-semibold text-[color:var(--emerald)]">
                  {t("log_in")}
                </button>
              </>
            )}
          </p>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">{t("terms_agree")}</p>
        </div>
      </div>
    </main>
  );
}
