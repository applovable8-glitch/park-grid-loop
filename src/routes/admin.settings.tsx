import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock, Plug, RefreshCw, X, CheckCircle2, XCircle } from "lucide-react";
import { AdminHeader, StatusPill } from "@/components/admin/AdminTable";
import { MAPS_KEY } from "@/lib/google-maps";
import { ABU_DHABI, ABU_DHABI_LABEL } from "@/lib/geo-defaults";
import {
  INTEGRATIONS,
  MASK,
  statusLabel,
  type FieldDef,
  type IntegrationDef,
  type IntegrationState,
} from "@/lib/admin-integrations";
import { listIntegrations, saveIntegration, setIntegrationEnabled, testIntegration, removeIntegrationSecret } from "@/lib/admin-integrations.functions";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettings,
});

type Cfg = Record<string, string | number | boolean | null>;

function fmtTime(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/* ------------------------------------------------------------------ editor */

function Editor({
  def,
  state,
  onClose,
  onSaved,
}: {
  def: IntegrationDef;
  state: IntegrationState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(saveIntegration);
  const removeSecret = useServerFn(removeIntegrationSecret);
  const [config, setConfig] = useState<Cfg>(() => ({ ...state.config }));
  const [environment, setEnvironment] = useState(state.environment === "sandbox" ? "sandbox" : "production");
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setBusy(true);
    setErr(null);
    save({ data: { id: def.id, environment: environment as "sandbox" | "production", enabled: state.enabled, config, secrets } })
      .then(() => onSaved())
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Could not save"))
      .finally(() => setBusy(false));
  };

  const renderField = (f: FieldDef) => {
    if (f.key === "environment") {
      return (
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0B1120]"
        >
          <option value="sandbox">Sandbox</option>
          <option value="production">Production</option>
        </select>
      );
    }
    if (f.type === "boolean") {
      return (
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(config[f.key])}
            onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.checked }))}
            className="h-4 w-4 accent-emerald-600"
          />
          <span className="text-slate-500 dark:text-slate-400">Enabled</span>
        </label>
      );
    }
    if (f.type === "secret") {
      const isSet = state.secretsSet.includes(f.key);
      return (
        <div className="space-y-2">
          {isSet && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/5">
              <span className="font-mono tracking-widest text-slate-500">{MASK}</span>
              <button
                type="button"
                onClick={() => {
                  setBusy(true);
                  removeSecret({ data: { id: def.id, field: f.key } })
                    .then(() => onSaved())
                    .finally(() => setBusy(false));
                }}
                className="text-xs font-semibold text-red-500"
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="password"
            autoComplete="new-password"
            value={secrets[f.key] ?? ""}
            placeholder={isSet ? "Enter a new value to replace" : (f.placeholder ?? "")}
            onChange={(e) => setSecrets((s) => ({ ...s, [f.key]: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0B1120]"
          />
        </div>
      );
    }
    return (
      <input
        type={f.type === "number" ? "number" : "text"}
        value={String(config[f.key] ?? "")}
        placeholder={f.placeholder ?? ""}
        onChange={(e) => setConfig((c) => ({ ...c, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0B1120]"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl dark:border-white/10 dark:bg-[#111827]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[var(--font-display)] text-lg font-bold">{def.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{def.summary}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {def.fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {f.label}
                {f.type === "secret" && <Lock className="h-3 w-3 text-slate-400" />}
              </label>
              {renderField(f)}
              {f.help && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-white/5 dark:text-slate-400">
          Credentials are encrypted before storage and are never sent back to this browser. Once saved, a secret can only be replaced or removed.
        </p>

        {err && <p className="mt-3 text-xs font-semibold text-red-500">{err}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- card */

function IntegrationCard({
  def,
  state,
  onRefresh,
  onEdit,
}: {
  def: IntegrationDef;
  state: IntegrationState;
  onRefresh: () => void;
  onEdit: () => void;
}) {
  const test = useServerFn(testIntegration);
  const toggle = useServerFn(setIntegrationEnabled);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const status = statusLabel(state.status);

  const configured = def.secrets.some((s) => state.secretsSet.includes(s)) || Object.values(state.config).some((v) => v !== "" && v !== null && v !== false);

  return (
    <section className="animate-fade-up flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-[var(--font-display)] text-base font-bold">{def.name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{state.provider ?? "No provider"}</p>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-slate-400">Environment</dt>
          <dd className="font-semibold capitalize">{def.editable ? state.environment : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Configuration</dt>
          <dd className="font-semibold">{def.editable ? (configured ? "Saved" : "Empty") : "Managed outside"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Last tested</dt>
          <dd className="font-semibold">{fmtTime(state.lastTestedAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Secrets stored</dt>
          <dd className="font-semibold">{state.secretsSet.length ? `${state.secretsSet.length} (masked)` : "None"}</dd>
        </div>
      </dl>

      {def.unavailable && <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500 dark:bg-white/5 dark:text-slate-400">{def.unavailable}</p>}
      {def.testNote && <p className="mt-3 rounded-lg bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">{def.testNote}</p>}

      {(result ?? state.lastTestMessage) && (
        <p className={`mt-3 flex items-start gap-1.5 text-[11px] ${(result?.ok ?? state.lastTestOk) ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
          {(result?.ok ?? state.lastTestOk) ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-px h-3.5 w-3.5 shrink-0" />}
          <span className="break-words">{result?.message ?? state.lastTestMessage}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
        <button
          disabled={!def.testable || busy}
          onClick={() => {
            setBusy(true);
            test({ data: { id: def.id } })
              .then((r) => {
                setResult({ ok: r.ok, message: r.message });
                onRefresh();
              })
              .catch((e: unknown) => setResult({ ok: false, message: e instanceof Error ? e.message : "Test failed" }))
              .finally(() => setBusy(false));
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-white/10"
          title={def.testable ? "Run a real connection test" : (def.testNote ?? def.unavailable ?? "Testing is not available")}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Test connection
        </button>
        <button
          disabled={!def.editable}
          onClick={onEdit}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-white/10"
          title={def.editable ? "Edit configuration" : (def.unavailable ?? "Not editable")}
        >
          Edit
        </button>
        <button
          disabled={!def.editable || busy}
          onClick={() => {
            setBusy(true);
            toggle({ data: { id: def.id, enabled: !state.enabled } })
              .then(() => onRefresh())
              .finally(() => setBusy(false));
          }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-white/10"
        >
          {state.enabled ? "Disable" : "Enable"}
        </button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- page */

type Tone = "ok" | "off";
function Section({ title, rows }: { title: string; rows: { label: string; value: string; tone?: Tone }[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827]">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold dark:border-white/5">{title}</h2>
      <dl>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-white/5">
            <dt className="min-w-0 text-sm text-slate-500 dark:text-slate-400">{r.label}</dt>
            <dd className={`shrink-0 text-sm font-semibold ${r.tone === "off" ? "text-slate-400" : ""}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AdminSettings() {
  const load = useServerFn(listIntegrations);
  const [states, setStates] = useState<IntegrationState[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const refresh = useCallback(() => {
    load()
      .then((rows) => {
        setStates(rows as IntegrationState[]);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load integrations"));
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byId = useMemo(() => new Map((states ?? []).map((s) => [s.id, s])), [states]);
  const editingDef = editing ? INTEGRATIONS.find((d) => d.id === editing) : undefined;
  const editingState = editing ? byId.get(editing) : undefined;

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Integration centre and the configuration this app actually runs on" />

      <section className="mt-6">
        <div className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-emerald-500" />
          <h2 className="font-[var(--font-display)] text-lg font-bold">Integrations</h2>
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Super Admin only. Secrets are encrypted server-side, shown masked, and never returned to the browser.
        </p>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-500/5 p-4 text-sm text-red-500">{error}</p>}

        {!states && !error ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INTEGRATIONS.map((def) => {
              const state = byId.get(def.id);
              if (!state) return null;
              return <IntegrationCard key={def.id} def={def} state={state} onRefresh={refresh} onEdit={() => setEditing(def.id)} />;
            })}
          </div>
        )}
      </section>

      {editingDef && editingState && (
        <Editor
          def={editingDef}
          state={editingState}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      <h2 className="mt-8 font-[var(--font-display)] text-lg font-bold">Platform</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <Section
          title="General"
          rows={[
            { label: "App name", value: "AndiPark" },
            { label: "Environment", value: import.meta.env.DEV ? "Development" : "Production" },
            { label: "Default currency", value: "AED" },
            { label: "Default country", value: "United Arab Emirates" },
            { label: "Default city", value: ABU_DHABI_LABEL },
            { label: "Fallback map center", value: `${ABU_DHABI.lat}, ${ABU_DHABI.lng}` },
          ]}
        />
        <Section
          title="Maps & location"
          rows={[
            { label: "Browser Maps key", value: MAPS_KEY ? "Configured (public, restricted)" : "Not configured", tone: MAPS_KEY ? "ok" : "off" },
            { label: "Maps JavaScript API", value: MAPS_KEY ? "In use" : "Not configured", tone: MAPS_KEY ? "ok" : "off" },
            { label: "Geocoding (area names)", value: MAPS_KEY ? "In use" : "Not configured", tone: MAPS_KEY ? "ok" : "off" },
            { label: "Places", value: "Not used", tone: "off" },
            { label: "Directions", value: "Not used", tone: "off" },
            { label: "Location priority", value: "GPS → picked area → Abu Dhabi" },
          ]}
        />
      </div>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">
        <h2 className="text-sm font-bold">Abu Dhabi parking context</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          AndiPark is a community handoff service — Find. Share. Park. It does not resell public parking or replace MAWAQiF, and it applies no
          public parking tariffs. Parking categories (Standard, Premium, Resident, Multi-storey, Other) are recognised by the interface, but no
          parking-type, restriction, operating-hours or public-holiday data source is connected, so existing spots stay “Parking type not configured”.
        </p>
      </section>

      <p className="mt-3 text-[11px] text-slate-400">No secret value is ever rendered in this console — stored credentials appear only as {MASK}.</p>
    </div>
  );
}
