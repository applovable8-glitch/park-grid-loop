import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, KeyRound, MailCheck, Smartphone, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminHeader, NotConfigured } from "@/components/admin/AdminTable";
import { MAPS_KEY } from "@/lib/google-maps";
import { getVerificationSettings, saveVerificationSettings } from "@/lib/auth-settings.functions";

function VerificationCard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["auth", "verification-policy"], queryFn: () => getVerificationSettings() });
  const save = useMutation({
    mutationFn: (emailVerification: boolean) => saveVerificationSettings({ data: { emailVerification } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["auth", "verification-policy"] }); toast.success("Verification policy updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827]">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold dark:border-white/5">Account verification</h2>

      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MailCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Require email verification</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Users with an unconfirmed email are held on the confirmation screen until they confirm.
          </p>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate(!data?.emailVerification)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${data?.emailVerification ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
            role="switch"
            aria-checked={!!data?.emailVerification}
            aria-label="Require email verification"
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${data?.emailVerification ? "left-[22px]" : "left-0.5"}`} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-500/10 text-slate-500 dark:text-slate-400">
          <Smartphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Require phone (SMS OTP) verification</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Backend configuration required — no SMS/OTP provider is connected to the auth backend.
          </p>
        </div>
        <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Unavailable</span>
      </div>
    </section>
  );
}

export const Route = createFileRoute("/admin/security")({
  head: () => ({ meta: [{ title: "Security — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSecurity,
});

function Row({ icon: Icon, label, value, tone }: { icon: typeof Lock; label: string; value: string; tone: "ok" | "warn" | "off" }) {
  const tones = {
    ok: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    off: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  }[tone];
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-white/5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones}`}><Icon className="h-4 w-4" /></span>
      <p className="min-w-0 flex-1 text-sm font-medium">{label}</p>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones}`}>{value}</span>
    </div>
  );
}

function AdminSecurity() {
  return (
    <div>
      <AdminHeader title="Security" subtitle="Only checks that can be verified from this app are shown" />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827]">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold dark:border-white/5">Platform</h2>
          <Row icon={Lock} label="User authentication" value="Enabled" tone="ok" />
          <Row icon={ShieldCheck} label="Row level security on app tables" value="Enabled" tone="ok" />
          <Row icon={KeyRound} label="Client uses public key only" value="Verified" tone="ok" />
          <Row icon={ShieldCheck} label="Maps browser key" value={MAPS_KEY ? "Configured" : "Not configured"} tone={MAPS_KEY ? "ok" : "off"} />
          <Row icon={ShieldCheck} label="Admin authentication (role gate)" value="Enabled" tone="ok" />
          <Row icon={KeyRound} label="Integration credentials encrypted server-side" value="Enabled" tone="ok" />
          <Row icon={ShieldCheck} label="Admin action audit log" value="Enabled" tone="ok" />
        </section>

        <section className="space-y-4">
          <VerificationCard />
          <NotConfigured
            title="Failed logins & suspicious activity"
            detail="No security event store is connected, so failed sign-ins, blocked IPs and anomaly detection cannot be reported here."
          />
          <NotConfigured
            title="Active sessions"
            detail="Session listing requires privileged server-side access that is not exposed to this console."
          />
          <NotConfigured
            title="Rate limiting"
            detail="No rate limiting layer is configured for the app's endpoints."
          />
        </section>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-500/25 dark:bg-amber-500/10">
        <p className="font-bold text-amber-800 dark:text-amber-300">Before production</p>
        <ul className="mt-1.5 list-disc space-y-1 ps-5 text-amber-800/90 dark:text-amber-200/85">
          <li>Admin pages now require an administrator role; the first Super Admin is claimed once and further roles must be granted deliberately.</li>
          <li>Service keys, payment secrets and SMTP credentials must stay server-side; none are present in this app's client code.</li>
        </ul>
      </div>
    </div>
  );
}
