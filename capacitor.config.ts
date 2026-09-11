import type { CapacitorConfig } from "@capacitor/cli";

/**
 * AndiPark Android shell.
 *
 * The app is a server-rendered TanStack Start app (maps search, reservations and
 * admin all run through server functions), so the native shell loads the hosted
 * build instead of a static copy. Point `server.url` at the published site.
 */
const config: CapacitorConfig = {
  appId: "app.andipark.mobile",
  appName: "AndiPark",
  webDir: "dist/client",
  server: {
    url: "https://park-grid-loop.lovable.app/app",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["park-grid-loop.lovable.app", "*.lovable.app", "accounts.google.com", "maps.googleapis.com"],
  },
  android: {
    backgroundColor: "#0B1220",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#0B1220",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
