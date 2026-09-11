/**
 * Client-safe registry of the external services AndiPark can be configured with.
 * Contains NO credential values — only field definitions and metadata.
 */

export type FieldType = "text" | "secret" | "select" | "number" | "boolean";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  help?: string;
};

export type IntegrationDef = {
  id: string;
  name: string;
  group: "Maps" | "Money" | "Messaging" | "Platform";
  provider: string | null;
  editable: boolean;
  testable: boolean;
  /** Explains why the card cannot be edited / tested. */
  unavailable?: string;
  testNote?: string;
  /** Shown inside the editor: what saving here does and does not switch on. */
  runtimeNote?: string;
  fields: FieldDef[];
  /** Secret field keys — stored encrypted server-side, never returned to the browser. */
  secrets: string[];
  summary: string;
};

const ENV_FIELD: FieldDef = { key: "environment", label: "Environment", type: "select", options: ["sandbox", "production"] };

export const INTEGRATIONS: IntegrationDef[] = [
  {
    id: "google_maps",
    name: "Google Maps",
    group: "Maps",
    provider: "Google Maps Platform",
    editable: true,
    testable: true,
    summary: "Map rendering, area names and geocoding.",
    runtimeNote:
      "The browser Maps key is injected at build time and is public by design (restricted by referrer). Only the server key is stored here, encrypted.",
    fields: [
      ENV_FIELD,
      {
        key: "server_api_key",
        label: "Server API key",
        type: "secret",
        placeholder: "AIza…",
        help: "Server-side only. Used for geocoding tests and server calls. Leave empty to use the workspace Google Maps connection.",
      },
      { key: "maps_js_enabled", label: "Maps JavaScript API", type: "boolean" },
      { key: "geocoding_enabled", label: "Geocoding API", type: "boolean" },
      { key: "places_enabled", label: "Places API", type: "boolean" },
      { key: "directions_enabled", label: "Directions API", type: "boolean" },
    ],
    secrets: ["server_api_key"],
  },
  {
    id: "payments",
    name: "Payment gateway",
    group: "Money",
    provider: null,
    editable: true,
    testable: true,
    summary: "Point purchases and paid features.",
    runtimeNote:
      "Saving valid credentials authenticates against the provider and stores them encrypted, but no checkout flow is built into the app yet — nothing is charged until a purchase flow is added.",
    fields: [
      { key: "provider", label: "Provider", type: "select", options: ["Not configured", "Stripe"] },
      ENV_FIELD,
      { key: "public_key", label: "Public key / Merchant ID", type: "text", placeholder: "pk_test_…" },
      { key: "secret_key", label: "Secret key", type: "secret", placeholder: "sk_test_…" },
      { key: "currency", label: "Currency", type: "text", placeholder: "AED" },
    ],
    secrets: ["secret_key"],
  },
  {
    id: "otp",
    name: "OTP / Phone verification",
    group: "Messaging",
    provider: null,
    editable: true,
    testable: true,
    summary: "SMS one-time codes.",
    runtimeNote:
      "Credentials are verified against the provider and stored encrypted. Phone sign-in itself still has to be switched on in the auth backend before codes are sent to users.",
    fields: [
      { key: "provider", label: "Provider", type: "select", options: ["Not configured", "Twilio"] },
      ENV_FIELD,
      { key: "account_sid", label: "Account SID / API key ID", type: "text", placeholder: "AC…" },
      { key: "auth_token", label: "Auth token / secret", type: "secret" },
      { key: "sender_id", label: "Sender ID / from number", type: "text", placeholder: "+9715…" },
      { key: "country", label: "Default country", type: "text", placeholder: "AE" },
      { key: "otp_expiration", label: "OTP expiry (seconds)", type: "number", placeholder: "300" },
      { key: "resend_cooldown", label: "Resend cooldown (seconds)", type: "number", placeholder: "60" },
      { key: "max_attempts", label: "Max attempts", type: "number", placeholder: "5" },
    ],
    secrets: ["auth_token"],
  },
  {
    id: "smtp",
    name: "SMTP / Email",
    group: "Messaging",
    provider: "Custom SMTP",
    editable: true,
    testable: true,
    summary: "Transactional and auth email sending.",
    testNote:
      "Raw SMTP needs a TCP socket, which this serverless runtime cannot open — choose the HTTP API provider to run a real send test. SMTP credentials are still stored encrypted for the auth backend.",
    fields: [
      { key: "provider", label: "Provider", type: "select", options: ["Custom SMTP", "Resend (HTTP API)"] },
      ENV_FIELD,
      { key: "host", label: "SMTP host", type: "text", placeholder: "smtp.example.com" },
      { key: "port", label: "Port", type: "number", placeholder: "587" },
      { key: "tls", label: "Use TLS", type: "boolean" },
      { key: "username", label: "Username", type: "text" },
      { key: "password", label: "Password / API key", type: "secret" },
      { key: "from_name", label: "From name", type: "text", placeholder: "AndiPark" },
      { key: "from_email", label: "From address", type: "text", placeholder: "no-reply@andipark.ae" },
      { key: "reply_to", label: "Reply-to", type: "text" },
      { key: "test_recipient", label: "Test email recipient", type: "text", placeholder: "you@example.com" },
    ],
    secrets: ["password"],
  },
  {
    id: "push",
    name: "Push notifications",
    group: "Messaging",
    provider: null,
    editable: false,
    testable: false,
    unavailable:
      "Backend configuration required. Notifications are delivered in-app in realtime; no push provider (FCM/APNs/Web Push) is wired into the app, so credentials stored here would never be used.",
    summary: "Device push delivery.",
    fields: [],
    secrets: [],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    group: "Platform",
    provider: "AndiPark endpoint",
    editable: true,
    testable: true,
    summary: "Inbound provider callbacks.",
    runtimeNote:
      "Incoming calls are verified with an HMAC-SHA256 signature over the raw body, sent in the x-andipark-signature header. Only verified calls are recorded.",
    fields: [
      { key: "endpoint", label: "Endpoint path", type: "text", placeholder: "/api/public/webhooks/andipark" },
      { key: "signing_secret", label: "Signing secret", type: "secret" },
    ],
    secrets: ["signing_secret"],
  },
  {
    id: "supabase",
    name: "Backend (database & auth)",
    group: "Platform",
    provider: "Lovable Cloud",
    editable: false,
    testable: true,
    unavailable:
      "The backend connection is managed by the platform. Its URL and public key are injected at build time and its service key is never exposed, so it cannot be edited here — only tested.",
    summary: "Database, auth, storage and realtime.",
    fields: [],
    secrets: [],
  },
];

export function integrationById(id: string): IntegrationDef | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export type IntegrationStatus = "connected" | "not_configured" | "failed" | "disabled" | "unavailable";

export type IntegrationState = {
  id: string;
  provider: string | null;
  environment: string;
  enabled: boolean;
  status: IntegrationStatus;
  /** Non-secret configuration values only. */
  config: Record<string, string | number | boolean | null>;
  /** Secret field keys that currently hold a stored value. */
  secretsSet: string[];
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
  updatedAt: string | null;
};

export const MASK = "••••••••••••";

export function statusLabel(s: IntegrationStatus): { label: string; tone: "emerald" | "red" | "amber" | "slate" } {
  switch (s) {
    case "connected":
      return { label: "Connected", tone: "emerald" };
    case "failed":
      return { label: "Connection failed", tone: "red" };
    case "disabled":
      return { label: "Disabled", tone: "amber" };
    case "unavailable":
      return { label: "Backend configuration required", tone: "slate" };
    default:
      return { label: "Not configured", tone: "slate" };
  }
}
