/**
 * Server-only helpers for the integration centre.
 * Credential values are encrypted with AES-GCM before they touch the database
 * and are never returned to the browser.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;

export async function getAdmin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Admin;
}

/** Throws unless the caller holds the super_admin role. */
export async function requireSuperAdmin(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" });
  if (error) throw new Error("Could not verify admin permissions");
  if (data !== true) throw new Error("Forbidden: super admin only");
}

async function cryptoKey(): Promise<CryptoKey> {
  const raw = process.env["INTEGRATION_ENCRYPTION_KEY"];
  if (!raw) throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(value: string): Uint8Array<ArrayBuffer> {
  const bin = atob(value);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptSecret(value: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await cryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return { ciphertext: toB64(new Uint8Array(buf)), iv: toB64(iv) };
}

export async function decryptSecret(ciphertext: string, iv: string): Promise<string> {
  const key = await cryptoKey();
  const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ciphertext));
  return new TextDecoder().decode(buf);
}

/** Reads and decrypts a stored credential. Server-side callers only. */
export async function readSecret(admin: Admin, integrationId: string, field: string): Promise<string | null> {
  const { data } = await admin
    .from("integration_secrets")
    .select("ciphertext, iv")
    .eq("integration_id", integrationId)
    .eq("field", field)
    .maybeSingle();
  if (!data) return null;
  try {
    return await decryptSecret(data.ciphertext, data.iv);
  } catch {
    return null;
  }
}

export async function audit(admin: Admin, actorId: string, action: string, target: string, meta: Record<string, unknown> = {}) {
  await admin.from("admin_audit_log").insert({ actor_id: actorId, action, target, meta: meta as never });
}

/** Last 4 characters of a credential, for a non-reversible reminder of which key is stored. */
export function hintOf(value: string): string {
  return value.length <= 4 ? "" : `…${value.slice(-4)}`;
}
