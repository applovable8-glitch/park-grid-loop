import { createFileRoute } from "@tanstack/react-router";
import { AdminHeader } from "@/components/admin/AdminTable";
import { MAPS_KEY } from "@/lib/google-maps";
import { ABU_DHABI, ABU_DHABI_LABEL } from "@/lib/geo-defaults";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettings,
});

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
  const maps = MAPS_KEY ? "Configured" : "Not configured";
  const mapsTone: Tone = MAPS_KEY ? "ok" : "off";

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Read-only view of the configuration this app actually runs on" />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
            { label: "Google Maps browser key", value: maps, tone: mapsTone },
            { label: "Maps JavaScript API", value: maps, tone: mapsTone },
            { label: "Geocoding (area names)", value: maps, tone: mapsTone },
            { label: "Places", value: "Not used", tone: "off" },
            { label: "Directions", value: "Not used", tone: "off" },
            { label: "Location priority", value: "GPS → picked area → Abu Dhabi" },
          ]}
        />
        <Section
          title="Payments"
          rows={[
            { label: "Provider", value: "Not configured", tone: "off" },
            { label: "Environment", value: "Not available", tone: "off" },
            { label: "Currency", value: "AED" },
            { label: "Point purchases", value: "Disabled", tone: "off" },
          ]}
        />
        <Section
          title="Notifications"
          rows={[
            { label: "In-app notifications", value: "Enabled" },
            { label: "Realtime delivery", value: "Enabled" },
            { label: "Push provider", value: "Not configured", tone: "off" },
            { label: "Broadcast tooling", value: "Not available", tone: "off" },
          ]}
        />
        <Section
          title="Email / SMTP"
          rows={[
            { label: "Sender domain", value: "Not configured", tone: "off" },
            { label: "SMTP", value: "Not configured", tone: "off" },
            { label: "Auth emails", value: "Platform default sender" },
          ]}
        />
        <Section
          title="Security & admins"
          rows={[
            { label: "User authentication", value: "Enabled" },
            { label: "Row level security", value: "Enabled" },
            { label: "Admin role system", value: "Not configured", tone: "off" },
            { label: "Audit logging", value: "Not configured", tone: "off" },
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

      <p className="mt-3 text-[11px] text-slate-400">No credentials or secret values are stored or displayed in this console.</p>
    </div>
  );
}
