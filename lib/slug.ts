import type { PrismaClient } from "@prisma/client"

// ─── Accent map (French / European) ──────────────────────────────────────────

const ACCENT_MAP: Record<string, string> = {
  à: "a", â: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  î: "i", ï: "i",
  ô: "o", ö: "o",
  ù: "u", û: "u", ü: "u",
  ç: "c",
  ñ: "n",
}

// ─── Arabic transliteration map ───────────────────────────────────────────────
// Covers all basic Arabic letters (حروف الهجاء) including common variants

const ARABIC_MAP: Record<string, string> = {
  "ا": "a",  "أ": "a",  "إ": "i",  "آ": "aa",
  "ب": "b",  "ت": "t",  "ث": "th",
  "ج": "j",  "ح": "h",  "خ": "kh",
  "د": "d",  "ذ": "dh",
  "ر": "r",  "ز": "z",
  "س": "s",  "ش": "sh",
  "ص": "s",  "ض": "d",
  "ط": "t",  "ظ": "z",
  "ع": "a",  "غ": "gh",
  "ف": "f",  "ق": "q",
  "ك": "k",  "ل": "l",
  "م": "m",  "ن": "n",
  "ه": "h",  "و": "w",
  "ي": "y",  "ى": "a",
  "ة": "a",  "ء": "",   "ئ": "y",  "ؤ": "w",
  "لا": "la", "لأ": "la", "لإ": "li", "لآ": "laa",
  // Diacritics (tashkeel) — strip them
  "ً": "", "ٌ": "", "ٍ": "",
  "َ": "", "ُ": "", "ِ": "",
  "ّ": "", "ْ": "", "ٰ": "",
}

// ─── Transliterate Arabic text ────────────────────────────────────────────────

function transliterateArabic(text: string): string {
  // Handle two-char combinations first (لا etc.)
  let result = text
  for (const [ar, lat] of Object.entries(ARABIC_MAP)) {
    if (ar.length === 2) result = result.split(ar).join(lat)
  }
  return result
    .split("")
    .map((ch) => ARABIC_MAP[ch] ?? ch)
    .join("")
}

// ─── generateSlug ─────────────────────────────────────────────────────────────

export function generateSlug(text: string): string {
  if (!text?.trim()) return `product-${Date.now()}`

  // Transliterate Arabic characters first
  const transliterated = transliterateArabic(text)

  const slug = transliterated
    .toLowerCase()
    .split("")
    .map((ch) => ACCENT_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")   // strip remaining non-alphanumeric
    .trim()
    .replace(/[\s]+/g, "-")          // spaces → hyphens
    .replace(/-{2,}/g, "-")          // collapse multiple hyphens
    .replace(/^-+|-+$/g, "")         // trim leading/trailing hyphens
    .slice(0, 60)

  // If result is empty after stripping (e.g. pure emoji title), use timestamp
  return slug || `product-${Date.now()}`
}

// ─── ensureUniqueSlug ─────────────────────────────────────────────────────────

export async function ensureUniqueSlug(
  slug:      string,
  prisma:    PrismaClient,
  excludeId?: string,
): Promise<string> {
  const base = generateSlug(slug)   // re-sanitize just in case
  let candidate = base
  let suffix    = 2

  while (true) {
    const existing = await prisma.product.findUnique({
      where:  { slug: candidate },
      select: { id: true },
    })

    if (!existing || existing.id === excludeId) {
      return candidate
    }

    candidate = `${base}-${suffix}`
    suffix++
  }
}
