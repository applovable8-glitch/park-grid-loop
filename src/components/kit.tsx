import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, CheckCircle2, XCircle, Info, WifiOff, Loader2, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/* -------------------- Screen shell -------------------- */
export function Screen({
  title, back = "/home", right, children, hero, bottomPad = 6,
}: {
  title?: string; back?: string | false; right?: ReactNode; children: ReactNode; hero?: ReactNode; bottomPad?: number;
}) {
  return (
    <div className={`min-h-screen bg-background pb-${bottomPad}`}>
      {hero ? hero : (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur-xl">
          {back !== false && (
            <Link to={back as string} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          )}
          <h1 className="flex-1 truncate font-[var(--font-display)] text-lg font-bold">{title}</h1>
          {right}
        </div>
      )}
      <div className="px-5 pt-3 pb-8 animate-fade-up">{children}</div>
    </div>
  );
}

/* -------------------- Hero (gradient) -------------------- */
export function Hero({ title, subtitle, back = "/home", children }: { title: string; subtitle?: string; back?: string | false; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden px-5 pb-8 pt-6 text-white" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute -end-10 -top-10 h-56 w-56 rounded-full bg-emerald/25 blur-3xl" />
      <div className="relative">
        {back !== false && (
          <Link to={back as string} className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-md">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        )}
        <h1 className="font-[var(--font-display)] text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/* -------------------- Row -------------------- */
export function Row({ icon: Icon, label, hint, to, right, danger, onClick }: {
  icon?: LucideIcon; label: string; hint?: string; to?: string; right?: ReactNode; danger?: boolean; onClick?: () => void;
}) {
  const body = (
    <div className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start hover:bg-muted ${danger ? "text-[color:var(--danger)]" : ""}`}>
      {Icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${danger ? "bg-red-100 text-[color:var(--danger)]" : "bg-muted"}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{label}</p>
        {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
      </div>
      {right ?? <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />}
    </div>
  );
  if (to) return <Link to={to}>{body}</Link>;
  return <button type="button" onClick={onClick} className="w-full">{body}</button>;
}

export function RowGroup({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="mt-4">
      {title && <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
      <div className="rounded-3xl bg-card p-2 shadow-[var(--shadow-card)]">{children}</div>
    </div>
  );
}

/* -------------------- Card -------------------- */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] ${className}`}>{children}</div>;
}

/* -------------------- Badge -------------------- */
export function Badge({ tone = "muted", children }: { tone?: "emerald" | "orange" | "red" | "blue" | "muted"; children: ReactNode }) {
  const map = {
    emerald: "bg-emerald/15 text-[color:var(--emerald)]",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-600",
    muted: "bg-muted text-muted-foreground",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[tone]}`}>{children}</span>;
}

/* -------------------- Button -------------------- */
export function Button({ children, variant = "primary", full = true, ...p }: {
  children: ReactNode; variant?: "primary" | "secondary" | "emerald" | "ghost" | "danger"; full?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "press inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold disabled:opacity-60 disabled:active:scale-100";
  const v = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-card text-foreground ring-1 ring-border",
    emerald: "text-white shadow-[var(--shadow-glow)]",
    ghost: "bg-muted text-foreground",
    danger: "bg-red-50 text-[color:var(--danger)] ring-1 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/25",
  }[variant];
  const style = variant === "emerald" ? { background: "var(--gradient-emerald)" } : undefined;
  return <button {...p} style={style} className={`${base} ${v} ${full ? "w-full" : ""} ${p.className ?? ""}`}>{children}</button>;
}


/* -------------------- Input -------------------- */
export const inputCls = "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* -------------------- Toggle -------------------- */
export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-start hover:bg-muted">
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground truncate">{hint}</span>}
      </div>
      <span className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[var(--emerald)]" : "bg-border"}`}>
        <span className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5"}`} />
      </span>
    </button>
  );
}

/* -------------------- State panels -------------------- */
function StatePanel({ icon: Icon, tone, title, description, action }: {
  icon: LucideIcon; tone: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] ${tone}`}>
        <Icon className="h-10 w-10" />
      </div>
      <h2 className="font-[var(--font-display)] text-xl font-bold">{title}</h2>
      {description && <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}

export function EmptyState(p: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return <StatePanel {...p} tone="bg-muted text-muted-foreground" />;
}
export function ErrorState(p: { title: string; description?: string; action?: ReactNode; icon?: LucideIcon }) {
  return <StatePanel {...p} icon={p.icon ?? XCircle} tone="bg-red-100 text-[color:var(--danger)]" />;
}
export function SuccessState(p: { title: string; description?: string; action?: ReactNode }) {
  return <StatePanel {...p} icon={CheckCircle2} tone="bg-emerald/20 text-[color:var(--emerald)]" />;
}
export function InfoState(p: { title: string; description?: string; action?: ReactNode; icon?: LucideIcon }) {
  return <StatePanel {...p} icon={p.icon ?? Info} tone="bg-blue-100 text-blue-600" />;
}
export function OfflineState({ action }: { action?: ReactNode }) {
  return <StatePanel icon={WifiOff} tone="bg-muted text-muted-foreground" title="You're offline" description="Reconnect to load real-time parking around you." action={action} />;
}

/* -------------------- Skeletons -------------------- */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl bg-muted ${className}`} />;
}
export function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2.5 h-4 w-2/3" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
export function SkeletonList({ n = 4 }: { n?: number }) {
  return <div className="space-y-3">{Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}</div>;
}
export function SkeletonRows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-2 h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
export function SkeletonMap() {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-3xl">
      <Skeleton className="absolute inset-0 rounded-3xl" />
      <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}


/* -------------------- Countdown -------------------- */
export function Countdown({ seconds, onEnd, label }: { seconds: number; onEnd?: () => void; label?: string }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { setLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (left <= 0) { onEnd?.(); return; }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onEnd]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="text-center">
      <p className="font-[var(--font-display)] text-5xl font-bold tabular-nums">{mm}:{ss}</p>
      {label && <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>}
    </div>
  );
}
