// ─── Money ────────────────────────────────────────────────────────────────────

export function formatMAD(centimes: number): string {
  return `${(centimes / 100).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`
}

export function formatMADShort(centimes: number): string {
  return `${(centimes / 100).toFixed(0)} MAD`
}

export function toCentimes(mad: number | string): number {
  const n = typeof mad === "string" ? parseFloat(mad) : mad
  return Math.round(n * 100)
}

export function fromCentimes(centimes: number): number {
  return centimes / 100
}

// ─── Date ─────────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  "Jan","Fév","Mar","Avr","Mai","Jun",
  "Jul","Aoû","Sep","Oct","Nov","Déc",
]

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const day   = d.getDate().toString().padStart(2, "0")
  const month = MONTHS_FR[d.getMonth()]
  const year  = d.getFullYear()
  const h     = d.getHours().toString().padStart(2, "0")
  const m     = d.getMinutes().toString().padStart(2, "0")
  return `${day} ${month} ${year} à ${h}:${m}`
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("fr-MA", {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
  })
}

// ─── Phone ────────────────────────────────────────────────────────────────────

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
  }
  return phone
}

// ─── Margin ───────────────────────────────────────────────────────────────────

export function calcMargin(priceCentimes: number, costCentimes: number): number {
  if (priceCentimes <= 0) return 0
  return Math.round(((priceCentimes - costCentimes) / priceCentimes) * 1000) / 10
}

export function marginColor(margin: number): "green" | "orange" | "red" {
  if (margin >= 50) return "green"
  if (margin >= 30) return "orange"
  return "red"
}

// ─── Break-even CPA ──────────────────────────────────────────────────────────

export function calcBreakEvenCPA(
  priceCentimes:    number,
  costCentimes:     number,
  deliveryCentimes: number,
): number {
  return priceCentimes - costCentimes - deliveryCentimes
}

// ─── File size ────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
