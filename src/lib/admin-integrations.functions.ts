import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { INTEGRATIONS, integrationById, type IntegrationState, type IntegrationStatus } from "./admin-integrations";

/* ------------------------------------------------------------------ access */

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: roles }, { data: exists }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.rpc("super_admin_exists"),
    ]);
    const list = (roles ?? []).map((r) => r.role as string);
    return {
      roles: list,
      isSuperAdmin: list.includes("super_admin"),
      isAdmin: list.some((r) => r === "super_admin" || r === "admin" || r === "moderator" || r === "support" || r === "analyst"),
      needsBootstrap: exists !== true,
    };
  });

export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_super_admin");
    if (error) throw new Error(error.message);
    if (data === true) {
      const { getAdmin, audit } = await import("./admin-integrations.server");
      await audit(await getAdmin(), context.userId, "role.claim_super_admin", context.userId);
    }
    return { claimed: data === true };
  });

export const listAdminRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAdmin, requireSuperAdmin } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const { data: rows } = await admin.from("user_roles").select("user_id, role, created_at").order("created_at", { ascending: true });
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await admin.from("profiles").select("user_id, name").in("user_id", ids)
      : { data: [] as { user_id: string; name: string }[] };
    const names = new Map((profiles ?? []).map((p) => [p.user_id, p.name]));
    return (rows ?? []).map((r) => ({
      userId: r.user_id,
      role: r.role as string,
      createdAt: r.created_at,
      name: names.get(r.user_id) ?? null,
    }));
  });

/* ------------------------------------------------------------ integrations */

function statusFor(def: (typeof INTEGRATIONS)[number], row: Row | undefined): IntegrationStatus {
  if (!def.editable && !def.testable) return "unavailable";
  if (row && row.enabled === false) return "disabled";
  if (row?.last_test_ok === true) return "connected";
  if (row?.last_test_ok === false) return "failed";
  return "not_configured";
}

type Row = {
  id: string;
  provider: string | null;
  environment: string;
  enabled: boolean;
  config: unknown;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  updated_at: string;
};

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationState[]> => {
    const { getAdmin, requireSuperAdmin } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const admin = await getAdmin();

    const [{ data: rows }, { data: secrets }] = await Promise.all([
      admin.from("integration_settings").select("*"),
      admin.from("integration_secrets").select("integration_id, field"),
    ]);
    const byId = new Map((rows ?? []).map((r) => [r.id, r as unknown as Row]));

    return INTEGRATIONS.map((def) => {
      const row = byId.get(def.id);
      const cfg = (row?.config ?? {}) as Record<string, string | number | boolean | null>;
      return {
        id: def.id,
        provider: (row?.provider ?? def.provider) as string | null,
        environment: row?.environment ?? "production",
        enabled: row?.enabled ?? false,
        status: statusFor(def, row),
        config: cfg,
        secretsSet: (secrets ?? []).filter((s) => s.integration_id === def.id).map((s) => s.field),
        lastTestedAt: row?.last_tested_at ?? null,
        lastTestOk: row?.last_test_ok ?? null,
        lastTestMessage: row?.last_test_message ?? null,
        updatedAt: row?.updated_at ?? null,
      };
    });
  });

const saveInput = z.object({
  id: z.string().min(1).max(64),
  environment: z.enum(["sandbox", "production"]),
  enabled: z.boolean(),
  config: z.record(z.union([z.string().max(500), z.number(), z.boolean(), z.null()])),
  /** Only fields the admin actually typed. Absent = keep stored value. */
  secrets: z.record(z.string().max(4000)).optional(),
});

export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { getAdmin, requireSuperAdmin, encryptSecret, hintOf, audit } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const def = integrationById(data.id);
    if (!def) throw new Error("Unknown integration");
    if (!def.editable) throw new Error("This integration cannot be configured from the console");

    const admin = await getAdmin();
    const allowed = new Set(def.fields.filter((f) => f.type !== "secret").map((f) => f.key));
    const config: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(data.config)) if (allowed.has(k)) config[k] = v;

    const { error } = await admin.from("integration_settings").upsert(
      {
        id: def.id,
        provider: def.provider,
        environment: data.environment,
        enabled: data.enabled,
        config: config as never,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);

    const written: string[] = [];
    for (const [field, value] of Object.entries(data.secrets ?? {})) {
      if (!def.secrets.includes(field)) continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      const { ciphertext, iv } = await encryptSecret(trimmed);
      await admin.from("integration_secrets").upsert(
        {
          integration_id: def.id,
          field,
          ciphertext,
          iv,
          hint: hintOf(trimmed),
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        },
        { onConflict: "integration_id,field" },
      );
      written.push(field);
    }

    await audit(admin, context.userId, "integration.save", def.id, {
      environment: data.environment,
      enabled: data.enabled,
      secrets_replaced: written,
    });
    return { ok: true };
  });

export const removeIntegrationSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().max(64), field: z.string().max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { getAdmin, requireSuperAdmin, audit } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    await admin.from("integration_secrets").delete().eq("integration_id", data.id).eq("field", data.field);
    await audit(admin, context.userId, "integration.secret_removed", data.id, { field: data.field });
    return { ok: true };
  });

export const setIntegrationEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().max(64), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getAdmin, requireSuperAdmin, audit } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const def = integrationById(data.id);
    if (!def || !def.editable) throw new Error("This integration cannot be changed from the console");
    const admin = await getAdmin();
    await admin
      .from("integration_settings")
      .upsert({ id: data.id, provider: def.provider, enabled: data.enabled, updated_at: new Date().toISOString(), updated_by: context.userId }, { onConflict: "id" });
    await audit(admin, context.userId, data.enabled ? "integration.enabled" : "integration.disabled", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------------- tests */

async function testGoogleMaps(storedKey: string | null): Promise<{ ok: boolean; message: string }> {
  const path = "/maps/api/geocode/json?latlng=24.4539,54.3773&language=en";
  let res: Response;
  if (storedKey) {
    res = await fetch(`https://maps.googleapis.com${path}&key=${encodeURIComponent(storedKey)}`);
  } else {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectorKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !connectorKey) {
      return { ok: false, message: "No server API key saved and no Google Maps workspace connection is available." };
    }
    res = await fetch(`https://connector-gateway.lovable.dev/google_maps${path}`, {
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectorKey },
    });
  }
  const body = await res.text();
  if (!res.ok) return { ok: false, message: `Google responded ${res.status}: ${body.slice(0, 200)}` };
  let parsed: { status?: string; error_message?: string } = {};
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    return { ok: false, message: "Unreadable response from Google." };
  }
  if (parsed.status !== "OK") return { ok: false, message: `${parsed.status ?? "ERROR"}: ${parsed.error_message ?? "Geocoding request rejected."}` };
  return { ok: true, message: storedKey ? "Geocoding succeeded with the saved server key." : "Geocoding succeeded through the workspace Google Maps connection." };
}

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { getAdmin, requireSuperAdmin, readSecret, audit } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const def = integrationById(data.id);
    if (!def?.testable) throw new Error("This integration cannot be tested");
    const admin = await getAdmin();

    let result: { ok: boolean; message: string };
    if (def.id === "google_maps") {
      result = await testGoogleMaps(await readSecret(admin, "google_maps", "server_api_key"));
    } else if (def.id === "supabase") {
      const { error, count } = await admin.from("profiles").select("id", { count: "exact", head: true });
      result = error ? { ok: false, message: error.message } : { ok: true, message: `Database reachable — ${count ?? 0} profiles.` };
    } else {
      result = { ok: false, message: "No test is implemented for this integration." };
    }

    const testedAt = new Date().toISOString();
    if (def.editable) {
      await admin.from("integration_settings").upsert(
        {
          id: def.id,
          provider: def.provider,
          last_tested_at: testedAt,
          last_test_ok: result.ok,
          last_test_message: result.message,
          updated_at: testedAt,
          updated_by: context.userId,
        },
        { onConflict: "id" },
      );
    }
    await audit(admin, context.userId, "integration.test", def.id, { ok: result.ok });
    return { ...result, testedAt };
  });

/* ------------------------------------------------------------- audit feed */

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAdmin, requireSuperAdmin } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const { data } = await admin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(100);
    return (data ?? []).map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      action: r.action,
      target: r.target,
      meta: JSON.stringify(r.meta ?? {}),
      createdAt: r.created_at,
    }));
  });
