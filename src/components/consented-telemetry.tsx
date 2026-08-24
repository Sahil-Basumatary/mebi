"use client";

import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { useCookieConsent } from "@/components/cookie-consent-provider";

const THEME_KEY = "hackollab-theme";
const UTM_KEY = "hackollab_utm";

export function ConsentedTelemetry() {
  const { canUse } = useCookieConsent();

  useEffect(() => {
    if (!canUse("preferences")) {
      try {
        localStorage.removeItem(THEME_KEY);
      } catch {}
    }

    const params = new URLSearchParams(window.location.search);
    const bits = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].flatMap(
      (key) => {
        const value = params.get(key);
        return value ? [`${key}=${value}`] : [];
      },
    );

    if (!canUse("marketing")) {
      try {
        localStorage.removeItem(UTM_KEY);
      } catch {}
      return;
    }

    if (bits.length) {
      try {
        localStorage.setItem(UTM_KEY, bits.join("&"));
      } catch {}
    }
  }, [canUse]);

  if (!canUse("analytics")) return null;
  return <Analytics />;
}
