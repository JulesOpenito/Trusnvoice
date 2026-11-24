/// <reference types="vite/client" />

export interface CookieConsentPreferences {
  essential: boolean;
  analytics: boolean;
  updatedAt: string;
}

const CONSENT_STORAGE_KEY = "trustinvoice_cookie_consent";
const SESSION_STORAGE_KEY = "trustinvoice_session_id";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getStoredCookieConsent(): CookieConsentPreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    if (typeof parsed.analytics === "boolean" && typeof parsed.essential === "boolean") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(analytics: boolean): CookieConsentPreferences {
  const prefs: CookieConsentPreferences = {
    essential: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }

  if (analytics) {
    initOptionalGA4();
  }
  return prefs;
}

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return `sess-${Date.now()}`;
  }
}

function isAnalyticsPermitted(): boolean {
  if (typeof window === "undefined") return false;
  if (navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1") {
    return false;
  }
  const consent = getStoredCookieConsent();
  return Boolean(consent?.analytics);
}

let ga4Initialized = false;

export function initOptionalGA4(): void {
  if (ga4Initialized || !isAnalyticsPermitted()) return;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId) return;

  ga4Initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });

  const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`);
  if (!existing) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }
}

export function trackAudienceEvent(
  eventType: "page_view" | "cta_click" | "form_submit",
  path: string,
  metadata?: Record<string, string | number | boolean>
): void {
  if (!isAnalyticsPermitted()) return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventType, {
      page_path: path,
      ...metadata,
    });
  }

  const payload = JSON.stringify({
    eventType,
    path,
    sessionId: getOrCreateSessionId(),
    referrer: document.referrer || "direct",
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/collect", blob);
    } else {
      fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking audience measurement
  }
}
