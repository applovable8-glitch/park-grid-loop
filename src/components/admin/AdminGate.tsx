import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { getAdminAccess, claimSuperAdmin } from "@/lib/admin-integrations.functions";

type Access = { roles: string[]; isSuperAdmin: boolean; isAdmin: boolean; needsBootstrap: boolean };

export function useAdminAccess() {
  const load = useServerFn(getAdminAccess);
  const [access, setAccess] = useState<Access | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    load()
      .then((a) => {
        setAccess(a as Access);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not check permissions"))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { access, error, loading, refresh };
}

function Panel({ icon, title, detail, children }: { icon: ReactNode; title: string; detail: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">{icon}</div>
      <p className="mt-4 font-[var(--font-display)] text-lg font-bold">{title}</p>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { access, error, loading, refresh } = useAdminAccess();
  const claim = useServerFn(claimSuperAdmin);
  const [claiming, setClaiming] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !access) {
    return (
      <Panel
        icon={<ShieldAlert className="h-6 w-6 text-amber-500" />}
        title="Sign in required"
        detail="This console is only available to signed-in administrators."
      >
        <Link to="/auth" className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Go to sign in
        </Link>
      </Panel>
    );
  }

  if (access.needsBootstrap) {
    return (
      <Panel
        icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
        title="Claim super admin access"
        detail="No administrator exists yet. The first signed-in user can claim Super Admin once — after that this option disappears and further roles must be granted by an admin."
      >
        <button
          disabled={claiming}
          onClick={() => {
            setClaiming(true);
            claim()
              .then(() => refresh())
              .finally(() => setClaiming(false));
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
          Claim Super Admin
        </button>
      </Panel>
    );
  }

  if (!access.isAdmin) {
    return (
      <Panel
        icon={<ShieldAlert className="h-6 w-6 text-red-500" />}
        title="Access denied"
        detail="Your account has no administrator role, so this console is not available to you."
      >
        <Link to="/home" className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10">
          Back to AndiPark
        </Link>
      </Panel>
    );
  }

  return <>{children}</>;
}
