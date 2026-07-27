export type CookieCategory = "necessary" | "preferences" | "analytics" | "marketing";

export type CookieConsentState = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string | null;
};

export const COOKIE_CONSENT_COOKIE = "mebi_cc";
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export const COOKIE_CATEGORIES: {
  id: CookieCategory;
  label: string;
  description: string;
  locked?: boolean;
}[] = [
  {
    id: "necessary",
    label: "Necessary",
    description: "Required for sign-in, security, and basic product function. Always on.",
    locked: true,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Remembers theme, locale, and other display choices across visits.",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Helps us understand product usage so we can improve mebi.",
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Used for campaign measurement and relevant product updates.",
  },
];

export const DEFAULT_COOKIE_CONSENT: CookieConsentState = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  decidedAt: null,
};

export function hasDecidedConsent(state: CookieConsentState): boolean {
  return Boolean(state.decidedAt);
}

export function acceptAllConsent(): CookieConsentState {
  return {
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
    decidedAt: new Date().toISOString(),
  };
}

export function rejectOptionalConsent(): CookieConsentState {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    decidedAt: new Date().toISOString(),
  };
}

export function normalizeCookieConsent(raw: unknown): CookieConsentState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_COOKIE_CONSENT };
  }
  const value = raw as Record<string, unknown>;
  return {
    necessary: true,
    preferences: value.preferences === true,
    analytics: value.analytics === true,
    marketing: value.marketing === true,
    decidedAt: typeof value.decidedAt === "string" ? value.decidedAt : null,
  };
}

export function serializeCookieConsent(state: CookieConsentState): string {
  return encodeURIComponent(
    JSON.stringify({
      v: 1,
      preferences: state.preferences,
      analytics: state.analytics,
      marketing: state.marketing,
      decidedAt: state.decidedAt,
    }),
  );
}

export function parseCookieConsentHeader(cookieHeader: string | null | undefined): CookieConsentState {
  if (!cookieHeader) return { ...DEFAULT_COOKIE_CONSENT };
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_CONSENT_COOKIE}=([^;]*)`));
  if (!match?.[1]) return { ...DEFAULT_COOKIE_CONSENT };
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as unknown;
    return normalizeCookieConsent(parsed);
  } catch {
    return { ...DEFAULT_COOKIE_CONSENT };
  }
}

export function writeConsentBrowserCookie(state: CookieConsentState) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_CONSENT_COOKIE}=${serializeCookieConsent(state)}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax`;
}

export function canUseCategory(
  state: CookieConsentState,
  category: Exclude<CookieCategory, "necessary">,
): boolean {
  if (!hasDecidedConsent(state)) return false;
  return state[category];
}
