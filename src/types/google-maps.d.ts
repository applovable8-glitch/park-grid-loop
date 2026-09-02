/* Minimal local typings for the Google Maps JS API surface we use. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
  // Loosely typed on purpose — avoids depending on @types/google.maps.
  const google: any;
  interface Window {
    google?: any;
  }
}
