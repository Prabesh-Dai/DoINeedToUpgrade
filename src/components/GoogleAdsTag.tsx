import { GOOGLE_ADS_ID } from "@/lib/googleAds";

// EEA, UK and Switzerland need consent for ad cookies, and the site has no consent banner, so there they
// stay off: Google gets cookieless pings and models the conversions instead.
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "LV",
  "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "CH",
];

// Rendered into <head> as plain tags, the way Google's install instructions ask. next/script would only
// inject it after hydration, so the served HTML had no tag (Google Ads flagged the site as "missing a
// Google tag") and visitors who left before hydration were never seen.
export default function GoogleAdsTag() {
  if (!GOOGLE_ADS_ID) return null;

  const init = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", region: ${JSON.stringify(CONSENT_REGIONS)} });
gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
gtag("js", new Date());
gtag("config", ${JSON.stringify(GOOGLE_ADS_ID)});`;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} />
      <script dangerouslySetInnerHTML={{ __html: init }} />
    </>
  );
}
