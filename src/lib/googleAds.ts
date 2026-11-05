// Google Ads conversion tracking. Off unless NEXT_PUBLIC_GOOGLE_ADS_ID is set (e.g. "AW-123456789");
// each conversion also needs its label from Google Ads (Goals > Conversions > the action > Tag setup).
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

const LABELS = {
  check: process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECK_LABEL,
  scanner: process.env.NEXT_PUBLIC_GOOGLE_ADS_SCANNER_LABEL,
};

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
