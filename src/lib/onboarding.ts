const KEY = "andipark.onboarding.v1";

/** True when the user has already seen (or skipped) the onboarding tour on this device. */
export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) === "done";
  } catch {
    return true;
  }
}

export function markOnboardingComplete() {
  try {
    window.localStorage.setItem(KEY, "done");
  } catch {
    /* storage unavailable — onboarding simply shows again next launch */
  }
}

/** Lets the user replay the tour from Settings / Profile. */
export function resetOnboarding() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
