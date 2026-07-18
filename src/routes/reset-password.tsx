import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { useApp } from "@/lib/parkout-store";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const { updatePassword } = useApp();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) return toast.error(error);
    toast.success("Password updated");
    nav({ to: "/home" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative h-40 text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex h-full items-end p-6">
          <h1 className="font-[var(--font-display)] text-2xl font-bold">Set a new password</h1>
        </div>
      </div>
      <form onSubmit={submit} className="-mt-6 flex-1 space-y-3 rounded-t-[28px] bg-background px-6 py-6">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">New password</span>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6}
              className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15" />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Confirm password</span>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required minLength={6}
              className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15" />
          </div>
        </label>
        <button type="submit" disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update password <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </div>
  );
}
