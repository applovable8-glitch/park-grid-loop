import { createFileRoute } from "@tanstack/react-router";

/**
 * Inbound webhook endpoint. Every call must carry an HMAC-SHA256 hex signature of the
 * raw body in `x-andipark-signature`, computed with the signing secret configured in
 * Admin → Settings → Integrations → Webhooks. Unverified calls are rejected and are
 * recorded as failures; the secret itself is never logged.
 */
async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/webhooks/andipark")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getAdmin, readSecret } = await import("@/lib/admin-integrations.server");
        const admin = await getAdmin();
        const body = await request.text();
        const source = request.headers.get("x-andipark-source") ?? "unknown";

        const record = async (ok: boolean, status: number, message: string, eventType = "") => {
          await admin.from("webhook_events").insert({ source, event_type: eventType, ok, status_code: status, message });
          return new Response(message, { status });
        };

        const secret = await readSecret(admin, "webhooks", "signing_secret");
        if (!secret) return record(false, 503, "Webhook signing secret is not configured");

        const provided = request.headers.get("x-andipark-signature") ?? "";
        const expected = await hmacHex(secret, body);
        if (!safeEqual(provided.toLowerCase(), expected)) return record(false, 401, "Invalid signature");

        let eventType = "";
        try {
          const parsed = JSON.parse(body) as { type?: string; event?: string };
          eventType = String(parsed.type ?? parsed.event ?? "");
        } catch {
          return record(false, 400, "Body is not valid JSON");
        }

        return record(true, 200, "Received", eventType);
      },
    },
  },
});
