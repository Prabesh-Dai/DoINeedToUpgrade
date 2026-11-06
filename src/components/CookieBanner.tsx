"use client";

import { useEffect, useState } from "react";
import { LuCookie } from "react-icons/lu";
import { GOOGLE_ADS_ID, getConsent, saveConsent, shouldAskConsent, type ConsentChoice } from "@/lib/googleAds";

// Dispatched by Settings > Cookies to ask again.
export const COOKIE_SETTINGS_EVENT = "cookiesettings";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null && shouldAskConsent()) setVisible(true);
    const reopen = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!GOOGLE_ADS_ID || !visible) return null;

  function choose(choice: ConsentChoice) {
    saveConsent(choice);
    setVisible(false);
  }

  return (
    <div
      className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-auto z-50 sm:max-w-sm animate-toast-in"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="rounded-md border border-base-content/10 bg-base-100/95 p-4 shadow-lift backdrop-blur-md">
        <p className="flex items-center gap-2.5 text-sm font-semibold">
          <LuCookie className="h-4 w-4 shrink-0 text-base-content/60" />
          Cookies for ad measurement
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-base-content/60">
          They tell us which of our Google ads bring people here. Never used to personalize ads, and the site works
          the same without them.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => choose("denied")}>
            Decline
          </button>
          <button type="button" className="btn btn-primary btn-sm px-5" onClick={() => choose("granted")}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
