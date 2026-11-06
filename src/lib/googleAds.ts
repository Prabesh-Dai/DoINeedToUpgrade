// Google Ads conversion tracking. Off unless NEXT_PUBLIC_GOOGLE_ADS_ID is set (e.g. "AW-123456789");
// each conversion also needs its label from Google Ads (Goals > Conversions > the action > Tag setup).
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

const LABELS = {
  check: process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECK_LABEL,
  scanner: process.env.NEXT_PUBLIC_GOOGLE_ADS_SCANNER_LABEL,
};

// The visitor's answer in the cookie banner, also read by the inline tag script in <head>.
export const CONSENT_KEY = "adsConsent";

// Accepting allows conversion measurement only; ads are never personalized from this site.
export const CONSENT_UPDATES = {
  granted: { ad_storage: "granted", ad_user_data: "granted" },
  denied: { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" },
} as const;

export type ConsentChoice = keyof typeof CONSENT_UPDATES;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackAdsConversion(kind: keyof typeof LABELS) {
  const label = LABELS[kind];
  if (!GOOGLE_ADS_ID || !label) return;
  window.gtag?.("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${label}` });
}

export function getConsent(): ConsentChoice | null {
  try {
    const saved = localStorage.getItem(CONSENT_KEY);
    return saved === "granted" || saved === "denied" ? saved : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {}
  window.gtag?.("consent", "update", CONSENT_UPDATES[choice]);
}

// There's no geo lookup in the browser, so the time zone decides who gets asked. Erring wide is fine:
// Google keeps ad cookies off for EEA/UK/CH IPs until consent is granted, so anyone missed stays untracked.
export function shouldAskConsent() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz.startsWith("Europe/") || /^Atlantic\/(Canary|Madeira|Azores|Reykjavik)$/.test(tz);
  } catch {
    return true;
  }
}
