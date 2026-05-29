import type { PrismaClient } from "@prisma/client"

// ─── Accent map ───────────────────────────────────────────────────────────────

const ACCENT_MAP: Record<string, string> = {
  à: "a", â: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  î: "i", ï: "i",
  ô: "o", ö: "o",
  ù: "u", û: "u", ü: "u",
  ç: "c",
  ñ: "n",
  // Uppercase variants handled by toLowerCase() first
}

// ─── generateSlug ─────────────────────────────────────────────────────────────

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => ACCENT_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")   // remove non-alphanumeric (keep spaces + hyphens)
    .trim()
    .replace(/[\s]+/g, "-")          // spaces → hyphens
    .replace(/-{2,}/g, "-")          // collapse multiple hyphens
    .slice(0, 60)
}

// ─── ensureUniqueSlug ─────────────────────────────────────────────────────────

export async function ensureUniqueSlug(
  slug:      string,
  prisma:    PrismaClient,
  excludeId?: string,
): Promise<string> {
  let candidate = slug
  let suffix    = 2

  while (true) {
    const existing = await prisma.product.findUnique({
      where:  { slug: candidate },
      select: { id: true },
    })

    if (!existing || existing.id === excludeId) {
      return candidate
    }

    candidate = `${slug}-${suffix}`
    suffix++
  }
}
