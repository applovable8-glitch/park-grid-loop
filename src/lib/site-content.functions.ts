import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FaqRow, MediaRow, SectionData, SeoRow, SiteContent } from "./site-content";

/* ------------------------------------------------------------ public reads */

/** Public, unauthenticated read of everything the marketing site renders. */
export const getSiteContent = createServerFn({ method: "GET" }).handler(async (): Promise<SiteContent> => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const [sections, faq, media, seo] = await Promise.all([
    supabase.from("site_sections").select("id, data, enabled"),
    supabase.from("site_faq").select("*").eq("enabled", true).order("sort_order"),
    supabase.from("site_media").select("*").eq("enabled", true).order("sort_order"),
    supabase.from("site_seo").select("*").eq("page", "home").maybeSingle(),
  ]);

  const sectionRows = (sections.data ?? []).map((s) => ({
    id: s.id as string,
    data: (s.data ?? {}) as SectionData,
    enabled: Boolean(s.enabled),
  }));

  const statsSection = sectionRows.find((s) => s.id === "stats");
  let stats: SiteContent["stats"] = null;
  if (statsSection?.enabled && statsSection.data["dynamic_enabled"] === true) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [drivers, spots, handoffs] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }),
      supabaseAdmin.from("parking_spots").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("reservations").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ]);
    stats = { drivers: drivers.count ?? 0, spotsShared: spots.count ?? 0, handoffs: handoffs.count ?? 0 };
  }

  return {
    sections: sectionRows,
    faq: (faq.data ?? []) as unknown as FaqRow[],
    media: (media.data ?? []) as unknown as MediaRow[],
    seo: (seo.data ?? null) as unknown as SeoRow | null,
    stats,
  };
});

/* --------------------------------------------------------- admin utilities */

async function assertSuperAdmin(supabase: Parameters<typeof requireGuard>[0], userId: string) {
  const { requireSuperAdmin } = await import("./admin-integrations.server");
  await requireSuperAdmin(supabase, userId);
}
// Type helper only — never called.
declare function requireGuard(supabase: never, userId: string): void;

/** Everything the CMS edits, including rows the public site hides. */
export const getSiteAdminContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin } = await import("./admin-integrations.server");
    const admin = await getAdmin();
    const [sections, faq, media, seo] = await Promise.all([
      admin.from("site_sections").select("id, data, enabled"),
      admin.from("site_faq").select("*").order("sort_order"),
      admin.from("site_media").select("*").order("sort_order"),
      admin.from("site_seo").select("*").order("page"),
    ]);
    return {
      sections: (sections.data ?? []).map((s) => ({ id: s.id as string, data: (s.data ?? {}) as SectionData, enabled: Boolean(s.enabled) })),
      faq: (faq.data ?? []) as unknown as FaqRow[],
      media: (media.data ?? []) as unknown as MediaRow[],
      seo: (seo.data ?? []) as unknown as SeoRow[],
    };
  });

export const saveSiteSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().max(64), data: z.record(z.any()), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin, audit } = await import("./admin-integrations.server");
    const admin = await getAdmin();
    const { error } = await admin
      .from("site_sections")
      .upsert(
        { id: data.id, data: data.data as never, enabled: data.enabled, updated_at: new Date().toISOString(), updated_by: context.userId },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    await audit(admin, context.userId, "website.section_saved", data.id, { enabled: data.enabled });
    return { ok: true };
  });

const faqInput = z.object({
  id: z.string().uuid().optional(),
  question_en: z.string().max(300),
  question_ar: z.string().max(300),
  answer_en: z.string().max(4000),
  answer_ar: z.string().max(4000),
  sort_order: z.number().int(),
  enabled: z.boolean(),
});

export const saveFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => faqInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin, audit } = await import("./admin-integrations.server");
    const admin = await getAdmin();
    const row = { ...data, updated_at: new Date().toISOString() };
    const { error } = data.id ? await admin.from("site_faq").update(row).eq("id", data.id) : await admin.from("site_faq").insert(row);
    if (error) throw new Error(error.message);
    await audit(admin, context.userId, data.id ? "website.faq_updated" : "website.faq_created", data.id ?? "new");
    return { ok: true };
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin, audit } = await import("./admin-integrations.server");
    const admin = await getAdmin();
    await admin.from("site_faq").delete().eq("id", data.id);
    await audit(admin, context.userId, "website.faq_deleted", data.id);
    return { ok: true };
  });

export const saveSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        page: z.string().max(64),
        title_en: z.string().max(200),
        title_ar: z.string().max(200),
        description_en: z.string().max(400),
        description_ar: z.string().max(400),
        keywords: z.string().max(500),
        canonical_url: z.string().max(300),
        og_image: z.string().max(500),
        og_title: z.string().max(200),
        og_description: z.string().max(400),
        twitter_title: z.string().max(200),
        twitter_description: z.string().max(400),
        twitter_image: z.string().max(500),
        noindex: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin, audit } = await import("./admin-integrations.server");
    const admin = await getAdmin();
    const { error } = await admin
      .from("site_seo")
      .upsert({ ...data, updated_at: new Date().toISOString(), updated_by: context.userId }, { onConflict: "page" });
    if (error) throw new Error(error.message);
    await audit(admin, context.userId, "website.seo_saved", data.page);
    return { ok: true };
  });

/* -------------------------------------------------------------------- media */

export const uploadSiteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        filename: z.string().max(200),
        contentType: z.string().max(100),
        /** base64 payload without the data: prefix, max ~5MB decoded. */
        base64: z.string().max(7_500_000),
        slot: z.string().max(40).default("gallery"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin, audit } = await import("./admin-integrations.server");
    const admin = await getAdmin();

    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.length > 5 * 1024 * 1024) throw new Error("Image is larger than 5 MB");

    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
    const path = `${data.slot}/${Date.now()}-${safe}`;
    const { error } = await admin.storage.from("website").upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);

    const { data: row, error: insertError } = await admin
      .from("site_media")
      .insert({ slot: data.slot, url: `/api/public/media/${path}`, storage_path: path, sort_order: 0 })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    await audit(admin, context.userId, "website.media_uploaded", path);
    return { id: row.id as string, url: `/api/public/media/${path}` };
  });

export const saveSiteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        alt_en: z.string().max(300),
        alt_ar: z.string().max(300),
        caption_en: z.string().max(300),
        caption_ar: z.string().max(300),
        sort_order: z.number().int(),
        enabled: z.boolean(),
        slot: z.string().max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin, audit } = await import("./admin-integrations.server");
    const admin = await getAdmin();
    const { id, ...rest } = data;
    const { error } = await admin.from("site_media").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    await audit(admin, context.userId, "website.media_updated", id);
    return { ok: true };
  });

export const deleteSiteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { getAdmin, audit } = await import("./admin-integrations.server");
    const admin = await getAdmin();
    const { data: row } = await admin.from("site_media").select("storage_path").eq("id", data.id).maybeSingle();
    if (row?.storage_path) await admin.storage.from("website").remove([row.storage_path]);
    await admin.from("site_media").delete().eq("id", data.id);
    await audit(admin, context.userId, "website.media_deleted", data.id);
    return { ok: true };
  });
