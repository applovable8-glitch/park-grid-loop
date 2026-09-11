import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves website media from the private storage bucket.
 * Only files referenced by an enabled row in site_media are served.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("site_media")
          .select("id")
          .eq("storage_path", path)
          .eq("enabled", true)
          .maybeSingle();
        if (!row) return new Response("Not found", { status: 404 });

        const { data, error } = await supabaseAdmin.storage.from("website").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
