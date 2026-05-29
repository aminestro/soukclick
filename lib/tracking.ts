"use client"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClickIds {
  fbclid:       string | null
  ttclid:       string | null
  gclid:        string | null
  utm_source:   string | null
  utm_medium:   string | null
  utm_campaign: string | null
  utm_content:  string | null
  utm_term:     string | null
}

export interface PixelEventData {
  eventId?:      string
  value?:        number   // in MAD (not centimes)
  currency?:     string
  contentIds?:   string[]
  contentName?:  string
  contentType?:  string
  numItems?:     number
}

const STORAGE_KEY = "sc_click_ids"

// ─── UTM + click ID capture ───────────────────────────────────────────────────

export function captureClickIds(): void {
  if (typeof window === "undefined") return

  const params = new URLSearchParams(window.location.search)

  const ids: ClickIds = {
    fbclid:       params.get("fbclid"),
    ttclid:       params.get("ttclid"),
    gclid:        params.get("gclid"),
    utm_source:   params.get("utm_source"),
    utm_medium:   params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content:  params.get("utm_content"),
    utm_term:     params.get("utm_term"),
  }

  // Only persist non-null values; preserve existing if no new value in URL
  const existing = getStoredClickIds()
  const merged: ClickIds = { ...existing }

  for (const key of Object.keys(ids) as Array<keyof ClickIds>) {
    if (ids[key] !== null) merged[key] = ids[key]
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // sessionStorage unavailable (private mode edge case)
  }
}

export function getStoredClickIds(): ClickIds {
  const empty: ClickIds = {
    fbclid: null, ttclid: null, gclid: null,
    utm_source: null, utm_medium: null, utm_campaign: null,
    utm_content: null, utm_term: null,
  }

  if (typeof window === "undefined") return empty

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    return { ...empty, ...(JSON.parse(raw) as Partial<ClickIds>) }
  } catch {
    return empty
  }
}

// ─── Meta Pixel ───────────────────────────────────────────────────────────────

declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & { loaded?: boolean }
    ttq: {
      track: (event: string, data?: Record<string, unknown>) => void
      identify?: (data: Record<string, unknown>) => void
    }
    gtag: (...args: unknown[]) => void
  }
}

export function firePixelEvent(event: string, data: PixelEventData = {}): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return

  const payload: Record<string, unknown> = {}
  if (data.value       !== undefined) payload["value"]        = data.value
  if (data.currency    !== undefined) payload["currency"]     = data.currency ?? "MAD"
  if (data.contentIds  !== undefined) payload["content_ids"]  = data.contentIds
  if (data.contentName !== undefined) payload["content_name"] = data.contentName
  if (data.contentType !== undefined) payload["content_type"] = data.contentType ?? "product"
  if (data.numItems    !== undefined) payload["num_items"]    = data.numItems

  if (data.eventId) {
    window.fbq("track", event, payload, { eventID: data.eventId })
  } else {
    window.fbq("track", event, payload)
  }
}

// ─── TikTok Pixel ─────────────────────────────────────────────────────────────

export function fireTikTokEvent(event: string, data: PixelEventData = {}): void {
  if (typeof window === "undefined" || !window.ttq?.track) return

  const payload: Record<string, unknown> = {
    currency: data.currency ?? "MAD",
  }
  if (data.value      !== undefined) payload["value"]       = data.value
  if (data.contentIds !== undefined) payload["content_id"]  = data.contentIds?.[0]
  if (data.contentName!== undefined) payload["content_name"]= data.contentName

  window.ttq.track(event, payload)
}

// ─── GA4 ──────────────────────────────────────────────────────────────────────

export function fireGA4Event(event: string, data: PixelEventData = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return

  const payload: Record<string, unknown> = {}
  if (data.value      !== undefined) payload["value"]    = data.value
  if (data.currency   !== undefined) payload["currency"] = data.currency ?? "MAD"
  if (data.numItems   !== undefined) payload["quantity"] = data.numItems

  window.gtag("event", event, payload)
}

// ─── Convenience: fire all three ─────────────────────────────────────────────

export function fireAllPixels(
  metaEvent:   string,
  tiktokEvent: string,
  ga4Event:    string,
  data:        PixelEventData = {},
): void {
  firePixelEvent(metaEvent, data)
  fireTikTokEvent(tiktokEvent, data)
  fireGA4Event(ga4Event, data)
}
