import type { Lang } from "@/lib/i18n";

export type CountryCode = string; // ISO-3166 alpha-2 (BR, GB, US, CA, ...)

export interface LocaleInfo {
  lang: Lang;
  countryCode: CountryCode;
  currency: string; // ISO-4217 (BRL, GBP, USD, CAD, ...)
  paddleLocale: string; // e.g. "pt-BR", "en-GB", "en"
}

const COUNTRY_CURRENCY: Record<string, string> = {
  BR: "BRL",
  GB: "GBP",
  US: "USD",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", IE: "EUR",
  CH: "CHF",
  JP: "JPY",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  IN: "INR",
};

export function buildLocale(country: string | undefined | null, langOverride?: Lang): LocaleInfo {
  const cc = (country || "").toUpperCase();
  let lang: Lang = "en-GB";
  if (cc === "BR" || cc === "PT") lang = "pt-BR";
  if (langOverride) lang = langOverride;

  const currency = COUNTRY_CURRENCY[cc] || "USD";
  const paddleLocale = lang === "pt-BR" ? "pt-BR" : (cc === "GB" ? "en-GB" : "en");

  return { lang, countryCode: cc || "US", currency, paddleLocale };
}

/** Detect country from browser. Tries Intl region first, then navigator.language tag. */
export function detectCountryFromBrowser(): string | null {
  try {
    const region = (Intl as any).Locale ? new (Intl as any).Locale(navigator.language).region : null;
    if (region) return String(region).toUpperCase();
  } catch {}
  const tag = navigator.language || "";
  const parts = tag.split("-");
  if (parts.length > 1) return parts[1].toUpperCase();
  // Some heuristics by language
  if (tag.toLowerCase().startsWith("pt")) return "BR";
  return null;
}

/** Best-effort Geo-IP fallback (free, CORS-friendly, cached). */
export async function detectCountryFromIP(): Promise<string | null> {
  try {
    const cached = sessionStorage.getItem("geo_country");
    if (cached) return cached;
  } catch {}
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const cc = (data?.country_code || data?.country || "").toUpperCase();
    if (cc) {
      try { sessionStorage.setItem("geo_country", cc); } catch {}
      return cc;
    }
  } catch {}
  return null;
}

/** Map a language tag (e.g. "pt-BR", "en-US", "fr") into one of our supported Lang values. */
export function langFromTag(tag: string | undefined | null): Lang | null {
  if (!tag) return null;
  const lower = tag.toLowerCase();
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("en")) return "en-GB";
  return null;
}
