// ─── WhatsApp admin alert ─────────────────────────────────────────────────────
// V1: server-side fetch to wa.me is not possible (browsers only).
// We use a webhook-style approach: if WHATSAPP_WEBHOOK_URL is set,
// POST to it (e.g. Make.com / n8n scenario). Otherwise log only.

interface AdminAlertPayload {
  orderNumber:  string
  customerName: string
  phone:        string
  total:        number  // centimes
  city:         string
  isBlacklist?: boolean
  isDuplicate?: boolean
}

function buildMessage(p: AdminAlertPayload): string {
  const totalMAD = (p.total / 100).toFixed(0)
  const flag     = p.isBlacklist ? "🚫 BLACKLIST" : p.isDuplicate ? "⚠️ DOUBLON" : "🛒 NOUVELLE COMMANDE"

  return [
    `${flag}`,
    `Commande : ${p.orderNumber}`,
    `Client   : ${p.customerName}`,
    `Tél      : ${p.phone}`,
    `Ville    : ${p.city}`,
    `Total    : ${totalMAD} MAD`,
  ].join("\n")
}

export async function sendAdminAlert(payload: AdminAlertPayload): Promise<void> {
  const message = buildMessage(payload)

  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          phone:   process.env.WHATSAPP_ADMIN_PHONE,
          message,
          ...payload,
        }),
      })
    } catch (err) {
      // Non-fatal — order was already saved
      console.error("[WhatsApp] Failed to send alert:", err)
    }
    return
  }

  // Fallback: log to console (visible in EasyPanel logs)
  console.log("[WhatsApp Alert]\n" + message)
}

// ─── Customer-facing WhatsApp link (for thank-you page) ──────────────────────

export function buildWhatsAppLink(
  phone:       string,
  orderNumber: string,
  productName: string,
): string {
  const text = encodeURIComponent(
    `Bonjour, j'ai passé la commande ${orderNumber} pour ${productName}. Pouvez-vous confirmer ?`,
  )
  // Normalize phone: strip spaces/dashes, ensure starts with +212
  const normalized = phone
    .replace(/[\s\-().]/g, "")
    .replace(/^0/, "+212")
  return `https://wa.me/${normalized}?text=${text}`
}
