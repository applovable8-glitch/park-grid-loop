import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppProvider } from "../lib/parkout-store";
import { I18nProvider, useI18n } from "../lib/i18n";
import { captureReferralFromUrl } from "../lib/referrals";
import { NotificationSound } from "../lib/notification-sound";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This street doesn't exist on our map.</p>
        <Link to="/home" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Back to map</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "AndiPark — Community parking, in real time" },
      { name: "description", content: "AndiPark helps drivers find parking by sharing spots the moment someone leaves. Community-powered, real-time, reward-driven." },
      { name: "theme-color", content: "#10B981" },
      { property: "og:title", content: "AndiPark — Community parking, in real time" },
      { property: "og:description", content: "Find parking the moment someone's leaving. Share your spot. Earn points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <I18nProvider>
          <LocalizedShell />
        </I18nProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

function LocalizedShell() {
  const { dir } = useI18n();
  useEffect(() => { captureReferralFromUrl(); }, []);
  return (
    <>
      <NotificationSound />
      <div dir={dir} className="min-h-screen w-full bg-[oklch(0.94_0.01_240)]">
        <div className="mx-auto min-h-screen w-full max-w-[440px] bg-background shadow-none md:my-6 md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[36px] md:shadow-[var(--shadow-elevated)] md:ring-1 md:ring-black/5">
          <Outlet />
        </div>
      </div>
      <Toaster position="top-center" richColors closeButton dir={dir} />
    </>
  );
}
