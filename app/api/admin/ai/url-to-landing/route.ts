import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { scrapeProductPage } from "@/lib/firecrawl"
import { getOpenAIClient, MODEL } from "@/lib/openai"
import { uploadToR2, buildKey } from "@/lib/r2"
import type { LandingSection } from "@/types/landing"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  url:       z.string().url(),
  productId: z.string().cuid().optional(),
})

// ─── AI analysis schema ───────────────────────────────────────────────────────

interface AIAnalysis {
  title_fr:             string
  title_ar:             string
  price_suggestion:     number
  cost_estimate:        number
  benefits:             Array<{ fr: string; ar: string }>
  features:             Array<{ title: string; description: string }>
  description_fr:       string
  description_darija:   string
  faq:                  Array<{ question: string; answer: string }>
  meta_title:           string
  meta_description:     string
  hero_headline:        string
  hero_subheadline:     string
  cta_text:             string
  trust_badges:         string[]
  template_suggestion:  "PROBLEM_SOLUTION" | "GADGET_DEMO" | "BEFORE_AFTER" | "BUNDLE" | "VIRAL"
}

// ─── Section builder ──────────────────────────────────────────────────────────

function buildSections(ai: AIAnalysis, images: string[]): LandingSection[] {
  const sections: LandingSection[] = []
  let order = 1

  // Hero
  sections.push({
    type: "hero", enabled: true, order: order++,
    data: {
      headline:           ai.hero_headline,
      subheadline:        ai.hero_subheadline,
      image_url:          images[0] ?? null,
      video_url:          null,
      cta_text:           ai.cta_text || "Commander Maintenant",
      cta_color:          "#f97316",
      show_price:         true,
      show_compare_price: true,
      badges:             ["cod", "livraison_gratuite", "garantie"],
    },
  })

  // Benefits
  if (ai.benefits?.length) {
    sections.push({
      type: "benefits", enabled: true, order: order++,
      data: {
        title: "Pourquoi choisir ce produit ?",
        items: ai.benefits.slice(0, 6).map((b) => ({
          icon:        "✅",
          title:       b.fr.split(" ").slice(0, 3).join(" "),
          description: b.fr,
        })),
      },
    })
  }

  // Features
  if (ai.features?.length) {
    sections.push({
      type: "features", enabled: true, order: order++,
      data: {
        title: "Caractéristiques",
        items: ai.features.slice(0, 5).map((f, i) => ({
          image_url:   images[i + 1] ?? null,
          title:       f.title,
          description: f.description,
        })),
      },
    })
  }

  // FAQ
  if (ai.faq?.length) {
    sections.push({
      type: "faq", enabled: true, order: order++,
      data: {
        title: "Questions fréquentes",
        items: ai.faq.slice(0, 6).map((f) => ({
          question: f.question,
          answer:   f.answer,
        })),
      },
    })
  }

  // CTA bottom
  sections.push({
    type: "cta", enabled: true, order: order++,
    data: {
      headline:     ai.hero_headline,
      cta_text:     ai.cta_text || "Commander Maintenant",
      cta_color:    "#f97316",
      urgency_text: "⚡ Offre limitée — Livraison gratuite aujourd'hui",
    },
  })

  return sections
}

// ─── Image downloader ─────────────────────────────────────────────────────────

async function downloadImagesToR2(urls: string[]): Promise<string[]> {
  const r2Urls: string[] = []

  for (const url of urls.slice(0, 5)) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0" },
      })
      if (!res.ok) continue

      const contentType = res.headers.get("content-type") ?? "image/jpeg"
      if (!contentType.startsWith("image/")) continue

      const buffer  = Buffer.from(await res.arrayBuffer())
      const ext     = contentType.split("/")[1]?.split(";")[0] ?? "jpg"
      const key     = buildKey("products", `ai-generated-${Date.now()}-${r2Urls.length}.${ext}`)
      const r2Url   = await uploadToR2(buffer, key, contentType)
      r2Urls.push(r2Url)
    } catch {
      // skip failed images
    }
  }

  return r2Urls
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const { url } = parsed.data

  // ── Step 1: Scrape ────────────────────────────────────────────────────────────
  let scraped: Awaited<ReturnType<typeof scrapeProductPage>>
  try {
    scraped = await scrapeProductPage(url)
  } catch (err) {
    return NextResponse.json({
      error: `Impossible de scraper cette URL: ${(err as Error).message}`,
    }, { status: 422 })
  }

  // ── Step 2: Analyze with GPT-4o ───────────────────────────────────────────────
  const systemPrompt = `You are an expert Moroccan ecommerce copywriter specializing in COD dropshipping.
Analyze the product page content and generate complete landing page copy optimized for the Moroccan market.
Always return ONLY valid JSON matching the exact schema requested. No markdown, no explanations.`

  const userPrompt = `Analyze this product page and return a JSON object with this EXACT structure:
{
  "title_fr": "catchy French product title for Morocco (max 80 chars)",
  "title_ar": "Arabic/Darija product title",
  "price_suggestion": 299,
  "cost_estimate": 80,
  "benefits": [
    {"fr": "benefit in French", "ar": "benefit in Arabic/Darija"}
  ],
  "features": [
    {"title": "feature name", "description": "feature description in French"}
  ],
  "description_fr": "compelling French description 100-200 words",
  "description_darija": "same description in Moroccan Darija",
  "faq": [
    {"question": "French question?", "answer": "French answer."}
  ],
  "meta_title": "SEO title max 60 chars",
  "meta_description": "SEO description max 160 chars — mention Maroc + livraison",
  "hero_headline": "powerful headline in French max 60 chars",
  "hero_subheadline": "subheadline in French max 100 chars — mention COD",
  "cta_text": "CTA button text in French",
  "trust_badges": ["cod", "livraison_gratuite", "garantie"],
  "template_suggestion": "GADGET_DEMO"
}

Rules:
- price_suggestion and cost_estimate are integers in Moroccan Dirhams (MAD)
- Suggest price between 149-599 MAD based on product type
- benefits: include 5-6 items
- features: include 4-5 items
- faq: include 6 items covering delivery, COD payment, usage, returns
- template_suggestion must be one of: PROBLEM_SOLUTION, GADGET_DEMO, BEFORE_AFTER, BUNDLE, VIRAL
- All French copy must be optimized for Moroccan market
- Trust badges must be array of strings from: ["cod", "livraison_gratuite", "garantie", "retour"]

PRODUCT PAGE CONTENT:
${scraped.markdown.slice(0, 5000)}`

  const messages: Parameters<Awaited<ReturnType<typeof getOpenAIClient>>["chat"]["completions"]["create"]>[0]["messages"] = [
    { role: "system", content: systemPrompt },
  ]

  // Attach screenshot if available for vision analysis
  if (scraped.screenshot) {
    messages.push({
      role: "user",
      content: [
        {
          type:      "image_url",
          image_url: {
            url:    scraped.screenshot.startsWith("data:")
              ? scraped.screenshot
              : scraped.screenshot,
            detail: "low",
          },
        },
        { type: "text", text: userPrompt },
      ],
    })
  } else {
    messages.push({ role: "user", content: userPrompt })
  }

  let ai: AIAnalysis
  try {
    const openai     = await getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model:           MODEL,
      messages,
      temperature:     0.6,
      max_tokens:      2500,
      response_format: { type: "json_object" },
    })
    ai = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as AIAnalysis
  } catch (err) {
    return NextResponse.json({ error: `Erreur OpenAI: ${(err as Error).message}` }, { status: 500 })
  }

  // ── Step 3: Download images to R2 ────────────────────────────────────────────
  const r2Images = await downloadImagesToR2(scraped.imageUrls)

  // ── Step 4: Build sections ────────────────────────────────────────────────────
  const sections = buildSections(ai, r2Images)

  return NextResponse.json({
    product: {
      titleFr:      ai.title_fr,
      titleAr:      ai.title_ar,
      descriptionFr:ai.description_fr,
      price:        ai.price_suggestion * 100,  // to centimes
      costPrice:    ai.cost_estimate * 100,
      images:       r2Images,
      status:       "DRAFT",
    },
    landingPage: {
      sections,
      metaTitle:    ai.meta_title,
      metaDesc:     ai.meta_description,
      template:     ai.template_suggestion ?? "GADGET_DEMO",
    },
    raw: {
      benefits:          ai.benefits,
      features:          ai.features,
      faq:               ai.faq,
      descriptionDarija: ai.description_darija,
      heroHeadline:      ai.hero_headline,
      heroSubheadline:   ai.hero_subheadline,
      ctaText:           ai.cta_text,
      trustBadges:       ai.trust_badges,
    },
    sourceUrl: url,
    scrapeInfo: {
      title:       scraped.title,
      imageCount:  scraped.imageUrls.length,
      r2Count:     r2Images.length,
      hasScreenshot: !!scraped.screenshot,
    },
  })
}
