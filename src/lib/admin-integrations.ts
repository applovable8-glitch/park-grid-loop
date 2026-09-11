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
  /** Providers offered in the UI. A single "Not configured" entry means no implementation exists. */
  providers?: string[];
  editable: boolean;
  testable: boolean;
  /** Explains why the card cannot be edited / tested. */
  unavailable?: string;
  testNote?: string;
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
    fields: [
      ENV_FIELD,
      {
        key: "server_api_key",
        label: "Server API key",
        type: "secret",
        placeholder: "AIza…",
        help: "Server-side only. Used for geocoding tests and future server calls. Leave empty to use the workspace Google Maps connection.",
      },
      { key: "places_enabled", label: "Places API", type: "boolean" },
      { key: "geocoding_enabled", label: "Geocoding API", type: "boolean" },
      { key: "directions_enabled", label: "Directions API", type: "boolean" },
    ],
    secrets: ["server_api_key"],
  },
  {
    id: "payments",
    name: "Payment gateway",
    group: "Money",
    provider: null,
    providers: ["Not configured"],
    editable: false,
    testable: false,
    unavailable:
      "No payment provider is implemented in this app, so there is nothing to authenticate against. Connect a provider first; the fields (public key, secret key, currency, environment) will then be enabled here.",
    summary: "Point purchases and paid features.",
    fields: [
      { key: "provider", label: "Provider", type: "select", options: ["Not configured"] },
      ENV_FIELD,
      { key: "public_key", label: "Public key / Merchant ID", type: "text" },
      { key: "secret_key", label: "Secret key", type: "secret" },
      { key: "currency", label: "Currency", type: "text", placeholder: "AED" },
    ],
    secrets: ["secret_key"],
  },
  {
    id: "otp",
    name: "OTP / Phone verification",
    group: "Messaging",
    provider: null,
    providers: ["Not configured"],
    editable: false,
    testable: false,
    unavailable: "Phone verification currently runs through the built-in auth provider. No external OTP provider is wired into the app, so credentials stored here would never be used.",
    summary: "SMS one-time codes.",
    fields: [
      { key: "provider", label: "Provider", type: "select", options: ["Not configured"] },
      { key: "sender_id", label: "Sender ID", type: "text" },
      { key: "api_token", label: "API token", type: "secret" },
    ],
    secrets: ["api_token"],
  },
  {
    id: "smtp",
    name: "SMTP / Email",
    group: "Messaging",
    provider: "Custom SMTP",
    editable: true,
    testable: false,
    testNote: "SMTP uses raw TCP, which this serverless runtime cannot open, so the connection cannot be tested from the console. Credentials are stored encrypted server-side.",
    summary: "Transactional and auth email sending.",
    fields: [
      ENV_FIELD,
      { key: "host", label: "SMTP host", type: "text", placeholder: "smtp.example.com" },
      { key: "port", label: "Port", type: "number", placeholder: "587" },
      { key: "username", label: "Username", type: "text" },
      { key: "password", label: "Password", type: "secret" },
      { key: "from_email", label: "From address", type: "text", placeholder: "no-reply@andipark.ae" },
      { key: "from_name", label: "From name", type: "text", placeholder: "AndiPark" },
      { key: "tls", label: "Use TLS", type: "boolean" },
    ],
    secrets: ["password"],
  },
  {
    id: "push",
    name: "Push notifications",
    group: "Messaging",
    provider: null,
    providers: ["Not configured"],
    editable: false,
    testable: false,
    unavailable: "Notifications are delivered in-app in realtime. No push provider (FCM/APNs/Web Push) is integrated, so there is no credential for this console to manage yet.",
    summary: "Device push delivery.",
    fields: [
      { key: "provider", label: "Provider", type: "select", options: ["Not configured"] },
      { key: "server_key", label: "Server key", type: "secret" },
    ],
    secrets: ["server_key"],
  },
  {
    id: "supabase",
    name: "Backend (database & auth)",
    group: "Platform",
    provider: "Lovable Cloud",
    editable: false,
    testable: true,
    unavailable: "The backend connection is managed by the platform. Its URL and public key are injected at build time and its service key is never exposed, so it cannot be edited here — only tested.",
    summary: "Database, auth, storage and realtime.",
    fields: [],
    secrets: [],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    group: "Platform",
    provider: null,
    editable: false,
    testable: false,
    unavailable: "No inbound webhook endpoint is deployed in this app, so a signing secret stored here would verify nothing. Add an endpoint first.",
    summary: "Inbound provider callbacks.",
    fields: [{ key: "signing_secret", label: "Signing secret", type: "secret" }],
    secrets: ["signing_secret"],
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
      return { label: "Not available", tone: "slate" };
    default:
      return { label: "Not configured", tone: "slate" };
  }
}
