import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Payments are not configured for this build. Complete payment go-live to enable production checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}

/** Point packs available for purchase (price ids come from the payments catalog). */
export const POINT_PACKS = [
  { priceId: "points_100_onetime", pts: 100, price: "AED 9", tag: null as string | null },
  { priceId: "points_500_onetime", pts: 500, price: "AED 39", tag: "Popular" },
  { priceId: "points_1200_onetime", pts: 1200, price: "AED 79", tag: "Best value" },
  { priceId: "points_3000_onetime", pts: 3000, price: "AED 179", tag: null },
];
