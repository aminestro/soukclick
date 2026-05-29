export type MarketingMetadata = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  sc_click_id?: string | null;
};

const STORAGE_KEY = "soukclick_marketing_metadata";
const TRACKED_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "ttclid", "sc_click_id"] as const;

export function readUtmParams(searchParams: URLSearchParams): MarketingMetadata {
  return {
    utm_source: searchParams.get("utm_source"),
    utm_medium: searchParams.get("utm_medium"),
    utm_campaign: searchParams.get("utm_campaign"),
    utm_content: searchParams.get("utm_content"),
    utm_term: searchParams.get("utm_term"),
    fbclid: searchParams.get("fbclid"),
    ttclid: searchParams.get("ttclid"),
    sc_click_id: searchParams.get("sc_click_id"),
  };
}

export function captureMarketingMetadataFromUrl() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const current = readMarketingMetadata();
  const next: MarketingMetadata = { ...current };
  let hasNewValue = false;

  for (const key of TRACKED_KEYS) {
    const value = params.get(key);
    if (value) {
      next[key] = value;
      hasNewValue = true;
    }
  }

  if (hasNewValue) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

export function readMarketingMetadata(): MarketingMetadata {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
