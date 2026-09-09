const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full rounded-2xl bg-red-100 px-4 py-2 text-center text-xs text-red-800">
        Production checkout is not configured yet.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full rounded-2xl bg-orange-100 px-4 py-2 text-center text-xs text-orange-800">
        All payments made in the preview are in test mode.
      </div>
    );
  }
  return null;
}
