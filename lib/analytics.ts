/**
 * Meta Pixel, off by default and never loaded without being asked.
 *
 * Two switches have to agree before a single request leaves the browser: the
 * shop has to have configured a pixel id, and the visitor has to have accepted.
 * Neither implies the other, and the privacy page reads the first of them so it
 * cannot end up describing tracking that is not there, or staying silent about
 * tracking that is.
 *
 * Everything here is a no-op on the server and a no-op before consent, so
 * callers can fire events unconditionally rather than guarding each one.
 */

const PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").trim();

export const CONSENT_KEY = "shukarsh-consent";

export type Consent = "granted" | "denied";

/** Whether the shop has a pixel at all. Safe to call during a server render. */
export function trackingConfigured(): boolean {
  return PIXEL_ID.length > 0;
}

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    // Private browsing can throw on access alone. No answer means no tracking.
    return null;
  }
}

/** Always null, so the banner is never part of the server-rendered markup. */
export function readConsentOnServer(): Consent | null {
  return null;
}

const listeners = new Set<() => void>();

/**
 * Subscribed to rather than read into state, so the banner can be a plain
 * useSyncExternalStore read. Also catches the answer being given in another tab,
 * which would otherwise leave this one still asking.
 */
export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function writeConsent(consent: Consent): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Refusing to remember the choice is survivable; asking again next visit is
    // the correct fallback, and it is the privacy-preserving one.
  }
  listeners.forEach((listener) => listener());
}

interface Fbq {
  (...args: unknown[]): void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  callMethod?: (...args: unknown[]) => void;
  push?: unknown;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Installs the stub and the remote script, once.
 *
 * Hand-rolled rather than dropped in with next/script because the decision to
 * load happens at runtime, after a click, not at render time.
 */
export function loadPixel(): void {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  if (window.fbq) return;

  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";

  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", PIXEL_ID);
}

/**
 * Fires an event if — and only if — there is a pixel and the visitor said yes.
 *
 * Reads consent on every call rather than caching it, so declining mid-session
 * stops the very next event instead of the next page load.
 */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  if (readConsent() !== "granted") return;

  loadPixel();
  window.fbq?.("track", event, params);
}
