import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verification policy for account creation / sign-in.
 * Stored as non-secret configuration in integration_settings (id = "auth_verification").
 *
 * Phone (SMS OTP) is only reported as available when an SMS/OTP provider is actually
 * configured for the auth backend. None is wired today, so it stays "backend configuration
 * required" instead of becoming a toggle that changes nothing.
 */
export type VerificationSettings = {
  emailVerification: boolean;
  phoneVerification: boolean;
  phoneAvailable: boolean;
  required: "none" | "email" | "phone" | "email_phone";
  updatedAt: string | null;
};

const ROW_ID = "auth_verification";

function shape(cfg: Record<string, unknown>, updatedAt: string | null): VerificationSettings {
  const email = cfg["email_verification"] === true;
  return {
    emailVerification: email,
    phoneVerification: false,
    phoneAvailable: false,
    required: email ? "email" : "none",
    updatedAt,
  };
}

export const getVerificationSettings = createServerFn({ method: "GET" }).handler(async (): Promise<VerificationSettings> => {
  const { getAdmin } = await import("./admin-integrations.server");
  const admin = await getAdmin();
  const { data } = await admin
    .from("integration_settings")
    .select("config, updated_at")
    .eq("id", ROW_ID)
    .maybeSingle();
  return shape((data?.config ?? {}) as Record<string, unknown>, data?.updated_at ?? null);
});

export const saveVerificationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { emailVerification: boolean }) => z.object({ emailVerification: z.boolean() }).parse(d))
  .handler(async ({ data, context }): Promise<VerificationSettings> => {
    const { getAdmin, requireSuperAdmin, audit } = await import("./admin-integrations.server");
    await requireSuperAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const config = { email_verification: data.emailVerification };
    const { data: row, error } = await admin
      .from("integration_settings")
      .upsert(
        {
          id: ROW_ID,
          provider: "Supabase Auth",
          environment: "production",
          enabled: true,
          config: config as never,
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        },
        { onConflict: "id" },
      )
      .select("config, updated_at")
      .single();
    if (error) throw new Error(error.message);
    await audit(admin, context.userId, "auth.verification.update", ROW_ID, config);
    return shape((row.config ?? {}) as Record<string, unknown>, row.updated_at);
  });
