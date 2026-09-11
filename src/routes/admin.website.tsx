import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminTable";
import {
  deleteFaq,
  deleteSiteMedia,
  getSiteAdminContent,
  saveFaq,
  saveSeo,
  saveSiteMedia,
  saveSiteSection,
  uploadSiteMedia,
} from "@/lib/site-content.functions";
import type { FaqRow, Json, MediaRow, SectionData, SeoRow } from "@/lib/site-content";

export const Route = createFileRoute("/admin/website")({
  head: () => ({ meta: [{ title: "Website content — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminWebsite,
});

type Admin = {
  sections: { id: string; data: SectionData; enabled: boolean }[];
  faq: FaqRow[];
  media: MediaRow[];
  seo: SeoRow[];
};

const TABS = ["Content", "FAQ", "Media", "SEO"] as const;

const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0B1120]";
const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]";
const btn = "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60";
const ghost = "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-white/10";

function label(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Field({ k, value, onChange }: { k: string; value: Json; onChange: (v: Json) => void }) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-xs font-semibold">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {label(k)}
      </label>
    );
  }
  const long = typeof value === "string" && (value.length > 90 || k.startsWith("body") || k.startsWith("desc") || k.startsWith("subtitle"));
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label(k)}</span>
      {long ? (
        <textarea rows={3} className={input} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={input} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function SectionEditor({ section, onSaved }: { section: Admin["sections"][number]; onSaved: () => void }) {
  const save = useServerFn(saveSiteSection);
  const [data, setData] = useState<SectionData>(section.data);
  const [enabled, setEnabled] = useState(section.enabled);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setKey = (k: string, v: Json) => setData((d) => ({ ...d, [k]: v }));

  const submit = () => {
    setBusy(true);
    setMsg(null);
    save({ data: { id: section.id, data: data as Record<string, unknown>, enabled } })
      .then(() => {
        setMsg("Saved");
        onSaved();
      })
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : "Could not save"))
      .finally(() => setBusy(false));
  };

  const entries = Object.entries(data);

  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-[var(--font-display)] text-base font-bold capitalize">{section.id}</h3>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Visible on site
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {entries
          .filter(([, v]) => !Array.isArray(v))
          .map(([k, v]) => (
            <Field key={k} k={k} value={v} onChange={(nv) => setKey(k, nv)} />
          ))}
      </div>

      {entries
        .filter(([, v]) => Array.isArray(v))
        .map(([k, v]) => {
          const items = v as Record<string, Json>[];
          return (
            <div key={k} className="mt-5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label(k)}</p>
              <div className="mt-2 space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(item).map(([ik, iv]) => (
                        <Field
                          key={ik}
                          k={ik}
                          value={iv}
                          onChange={(nv) => {
                            const next = items.map((it, j) => (j === i ? { ...it, [ik]: nv } : it));
                            setKey(k, next as Json);
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setKey(k, items.filter((_, j) => j !== i) as Json)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove item
                    </button>
                  </div>
                ))}
                {items[0] && (
                  <button
                    onClick={() => {
                      const blank = Object.fromEntries(
                        Object.entries(items[0]!).map(([ik, iv]) => [ik, typeof iv === "boolean" ? true : typeof iv === "number" ? 0 : ""]),
                      );
                      setKey(k, [...items, blank] as Json);
                    }}
                    className={ghost}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add item
                  </button>
                )}
              </div>
            </div>
          );
        })}

      <div className="mt-4 flex items-center gap-3">
        <button onClick={submit} disabled={busy} className={btn}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save section
        </button>
        {msg && <span className="text-xs text-slate-500">{msg}</span>}
      </div>
    </section>
  );
}

function FaqTab({ rows, refresh }: { rows: FaqRow[]; refresh: () => void }) {
  const save = useServerFn(saveFaq);
  const remove = useServerFn(deleteFaq);
  const [draft, setDraft] = useState<Partial<FaqRow> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const commit = (row: Partial<FaqRow>) => {
    setBusy(true);
    setMsg(null);
    save({
      data: {
        ...(row.id ? { id: row.id } : {}),
        question_en: row.question_en ?? "",
        question_ar: row.question_ar ?? "",
        answer_en: row.answer_en ?? "",
        answer_ar: row.answer_ar ?? "",
        sort_order: row.sort_order ?? rows.length,
        enabled: row.enabled ?? true,
      },
    })
      .then(() => {
        setDraft(null);
        refresh();
      })
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : "Could not save"))
      .finally(() => setBusy(false));
  };

  const editing = draft;

  return (
    <div className="space-y-3">
      <button onClick={() => setDraft({ enabled: true, sort_order: rows.length })} className={btn}>
        <Plus className="h-3.5 w-3.5" /> New question
      </button>
      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {editing && (
        <div className={card}>
          <div className="grid gap-3 md:grid-cols-2">
            {(["question_en", "question_ar", "answer_en", "answer_ar"] as const).map((k) => (
              <label key={k} className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-500">{label(k)}</span>
                <textarea rows={k.startsWith("answer") ? 3 : 2} className={input} value={String(editing[k] ?? "")} onChange={(e) => setDraft({ ...editing, [k]: e.target.value })} />
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input type="checkbox" checked={editing.enabled ?? true} onChange={(e) => setDraft({ ...editing, enabled: e.target.checked })} />
              Published
            </label>
            <input
              type="number"
              className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-[#0B1120]"
              value={editing.sort_order ?? 0}
              onChange={(e) => setDraft({ ...editing, sort_order: Number(e.target.value) })}
            />
            <button disabled={busy} onClick={() => commit(editing)} className={btn}>
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={() => setDraft(null)} className={ghost}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.map((f) => (
        <div key={f.id} className={`${card} flex items-start justify-between gap-4`}>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{f.question_en}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{f.question_ar}</p>
            <p className="mt-1 text-[11px] text-slate-400">{f.enabled ? "Published" : "Hidden"} · order {f.sort_order}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setDraft(f)} className={ghost}>
              Edit
            </button>
            <button
              onClick={() => remove({ data: { id: f.id } }).then(refresh)}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaTab({ rows, refresh }: { rows: MediaRow[]; refresh: () => void }) {
  const upload = useServerFn(uploadSiteMedia);
  const save = useServerFn(saveSiteMedia);
  const remove = useServerFn(deleteSiteMedia);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setMsg(null);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image is larger than 5 MB");
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (const b of buf) bin += String.fromCharCode(b);
      await upload({ data: { filename: file.name, contentType: file.type || "image/jpeg", base64: btoa(bin), slot: "gallery" } });
      refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className={`${btn} cursor-pointer`}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {msg && <p className="text-xs text-red-500">{msg}</p>}
      <p className="text-[11px] text-slate-400">JPG, PNG or WebP up to 5 MB. Images are stored privately and served through the app.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((m) => (
          <MediaCard key={m.id} row={m} onSave={(r) => save({ data: r }).then(refresh)} onDelete={() => remove({ data: { id: m.id } }).then(refresh)} />
        ))}
      </div>
    </div>
  );
}

function MediaCard({
  row,
  onSave,
  onDelete,
}: {
  row: MediaRow;
  onSave: (r: { id: string; alt_en: string; alt_ar: string; caption_en: string; caption_ar: string; sort_order: number; enabled: boolean; slot: string }) => void;
  onDelete: () => void;
}) {
  const [r, setR] = useState(row);
  return (
    <div className={card}>
      <img src={r.url} alt={r.alt_en} className="h-40 w-full rounded-lg object-cover" />
      <div className="mt-3 grid gap-2">
        {(["alt_en", "alt_ar", "caption_en", "caption_ar", "slot"] as const).map((k) => (
          <label key={k} className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">{label(k)}</span>
            <input className={input} value={String(r[k] ?? "")} onChange={(e) => setR({ ...r, [k]: e.target.value })} />
          </label>
        ))}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={r.enabled} onChange={(e) => setR({ ...r, enabled: e.target.checked })} />
            Visible
          </label>
          <input
            type="number"
            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-[#0B1120]"
            value={r.sort_order}
            onChange={(e) => setR({ ...r, sort_order: Number(e.target.value) })}
          />
          <button
            onClick={() =>
              onSave({
                id: r.id,
                alt_en: r.alt_en,
                alt_ar: r.alt_ar,
                caption_en: r.caption_en,
                caption_ar: r.caption_ar,
                sort_order: r.sort_order,
                enabled: r.enabled,
                slot: r.slot,
              })
            }
            className={btn}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button onClick={onDelete} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const SEO_KEYS = [
  "title_en",
  "title_ar",
  "description_en",
  "description_ar",
  "keywords",
  "canonical_url",
  "og_title",
  "og_description",
  "og_image",
  "twitter_title",
  "twitter_description",
  "twitter_image",
] as const;

function SeoTab({ rows, refresh }: { rows: SeoRow[]; refresh: () => void }) {
  const save = useServerFn(saveSeo);
  const base = rows.find((r) => r.page === "home");
  const [r, setR] = useState<SeoRow>(
    base ?? {
      page: "home",
      title_en: "",
      title_ar: "",
      description_en: "",
      description_ar: "",
      keywords: "",
      canonical_url: "",
      og_image: "",
      og_title: "",
      og_description: "",
      twitter_title: "",
      twitter_description: "",
      twitter_image: "",
      noindex: false,
    },
  );
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className={card}>
      <h3 className="font-[var(--font-display)] text-base font-bold">Home page SEO</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {SEO_KEYS.map((k) => (
          <label key={k} className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">{label(k)}</span>
            {k.startsWith("description") ? (
              <textarea rows={3} className={input} value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })} />
            ) : (
              <input className={input} value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })} />
            )}
            {k.startsWith("title") && <span className="mt-1 block text-[10px] text-slate-400">{r[k].length}/60 characters</span>}
            {k.startsWith("description") && <span className="mt-1 block text-[10px] text-slate-400">{r[k].length}/160 characters</span>}
          </label>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
        <input type="checkbox" checked={r.noindex} onChange={(e) => setR({ ...r, noindex: e.target.checked })} />
        Ask search engines not to index this page
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() =>
            save({ data: r })
              .then(() => {
                setMsg("Saved");
                refresh();
              })
              .catch((e: unknown) => setMsg(e instanceof Error ? e.message : "Could not save"))
          }
          className={btn}
        >
          <Save className="h-3.5 w-3.5" /> Save SEO
        </button>
        {msg && <span className="text-xs text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}

function AdminWebsite() {
  const load = useServerFn(getSiteAdminContent);
  const [data, setData] = useState<Admin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Content");

  const refresh = useCallback(() => {
    load()
      .then((d) => {
        setData(d as unknown as Admin);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load website content"));
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sections = useMemo(() => data?.sections ?? [], [data]);

  return (
    <div>
      <AdminHeader title="Public website" subtitle="Content, media and search settings for andipark.app" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${tab === tb ? "bg-emerald-600 text-white" : "border border-slate-200 dark:border-white/10"}`}
          >
            {tb}
          </button>
        ))}
        <a href="/" target="_blank" rel="noreferrer" className={ghost}>
          Preview site
        </a>
      </div>

      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-500/5 p-4 text-sm text-red-500">{error}</p>}
      {!error && !data && (
        <div className="mt-8 flex justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {data && (
        <div className="mt-5 space-y-4">
          {tab === "Content" && sections.map((s) => <SectionEditor key={s.id} section={s} onSaved={refresh} />)}
          {tab === "FAQ" && <FaqTab rows={data.faq} refresh={refresh} />}
          {tab === "Media" && <MediaTab rows={data.media} refresh={refresh} />}
          {tab === "SEO" && <SeoTab rows={data.seo} refresh={refresh} />}
        </div>
      )}
    </div>
  );
}
