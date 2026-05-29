import { createHash } from "crypto"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CAPIEvent {
  eventName:         string
  eventId:           string
  value?:            number   // MAD (not centimes)
  currency?:         string
  phone?:            string   // raw — will be hashed
  fbclid?:           string | null
  userAgent?:        string | null
  clientIpAddress?:  string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex")
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function sendCAPIEvent(event: CAPIEvent): Promise<void> {
  const pixelId     = process.env.META_PIXEL_ID
  const accessToken = process.env.META_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    // Env vars not configured — log and return silently
    console.warn("[CAPI] META_PIXEL_ID or META_ACCESS_TOKEN not set — skipping")
    return
  }

  const userData: Record<string, string> = {}
  if (event.phone) {
    // Normalize Moroccan number before hashing: 06XXXXXXXX → +2126XXXXXXXX
    const normalized = event.phone
      .replace(/[\s\-().]/g, "")
      .replace(/^0/, "+212")
    userData["ph"] = sha256(normalized)
  }
  if (event.clientIpAddress) userData["client_ip_address"] = event.clientIpAddress
  if (event.userAgent)       userData["client_user_agent"]  = event.userAgent
  if (event.fbclid)          userData["fbc"] = `fb.1.${Date.now()}.${event.fbclid}`

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name:        event.eventName,
        event_time:        Math.floor(Date.now() / 1000),
        event_id:          event.eventId,
        action_source:     "website",
        user_data:         userData,
        custom_data: {
          value:    event.value    ?? 0,
          currency: event.currency ?? "MAD",
        },
      },
    ],
  }

  // Include test event code when present (for Meta Events Manager validation)
  if (process.env.META_TEST_EVENT_CODE) {
    payload["test_event_code"] = process.env.META_TEST_EVENT_CODE
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      },
    )

    if (!res.ok) {
      const text = await res.text()
      console.error(`[CAPI] HTTP ${res.status} — ${text}`)
    } else {
      const json = await res.json() as { events_received?: number }
      console.log(`[CAPI] ${event.eventName} sent — received: ${json.events_received}`)
    }
  } catch (err) {
    // Never break the order flow — CAPI is best-effort
    console.error("[CAPI] Network error:", err)
  }
}
