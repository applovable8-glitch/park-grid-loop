import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

// Untyped admin client: the new purchase RPC is not in the generated types yet.
let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

async function creditPoints(session: any, env: StripeEnv) {
  const userId = session?.metadata?.userId as string | undefined;
  const points = Number(session?.metadata?.points ?? 0);
  if (!userId || !points) {
    console.error("Checkout session missing userId/points metadata");
    return;
  }

  const { data: credited, error } = await getSupabase().rpc("credit_purchased_points", {
    _user_id: userId,
    _session_id: session.id,
    _price_id: session?.metadata?.priceId ?? "unknown",
    _points: points,
    _amount_total: session?.amount_total ?? null,
    _currency: session?.currency ?? null,
    _environment: env,
  });
  if (error) {
    console.error("credit_purchased_points failed:", error.message);
    return;
  }

  if (credited) {
    await getSupabase().from("notifications").insert({
      user_id: userId,
      title: "Points added",
      body: `${points} points were added to your balance.`,
      icon: "points",
      metadata: { kind: "points_purchased", points },
    });
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") await creditPoints(session, env);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await creditPoints(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv as StripeEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
