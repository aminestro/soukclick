import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOpenAIClient, MODEL } from "@/lib/openai"
import type { LandingSection } from "@/types/landing"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  productId: z.string().min(1),
  template:  z.enum(["PROBLEM_SOLUTION", "GADGET_DEMO", "BEFORE_AFTER", "BUNDLE", "VIRAL"]),
  language:  z.enum(["fr", "darija", "ar"]).default("fr"),
})

// ─── Language instructions ────────────────────────────────────────────────────

function getLangInstruction(language: string): string {
  if (language === "darija") {
    return `You MUST write ALL content in Moroccan Darija dialect (دارجة مغربية) using Arabic script.
Use informal, warm Moroccan tone. Typical phrases: "خاصك تجرب", "مزيان", "بلا مشاكل", "ضمان كامل".
Reviewer names: Fatima, Mohamed, Aicha, Youssef, Khadija, Hamid, Nadia, Omar.
Cities: Casablanca, Rabat, Marrakech, Fès, Agadir, Tanger, Meknès, Oujda.`
  }
  if (language === "ar") {
    return `You MUST write ALL content in Modern Standard Arabic (فصحى).
Use formal, professional tone suitable for e-commerce.
Reviewer names: فاطمة, محمد, عائشة, يوسف, خديجة, حامد, نادية, عمر.
Cities: الدار البيضاء, الرباط, مراكش, فاس, أكادير, طنجة.`
  }
  return `Write ALL content in French. Use casual, persuasive Moroccan French tone.
Emphasize "paiement à la livraison", "livraison rapide", "satisfait ou remboursé".
Reviewer names: Fatima Z., Mohamed A., Aicha B., Youssef K., Khadija M.
Cities: Casablanca, Rabat, Marrakech, Fès, Agadir, Tanger.`
}

// ─── Build sections from AI JSON ──────────────────────────────────────────────

function buildSections(
  template: string,
  ai: AIContent,
  language: string,
): LandingSection[] {
  const rtl = language === "darija" || language === "ar"

  const hero: LandingSection = {
    type: "hero", enabled: true, order: 1,
    data: {
      headline:           ai.hero.headline,
      subheadline:        ai.hero.subheadline,
      image_url:          null,
      video_url:          null,
      cta_text:           ai.hero.cta_text,
      cta_color:          "#f97316",
      show_price:         true,
      show_compare_price: true,
      badges:             ["cod", "livraison_gratuite", "garantie"],
    },
  }

  const benefits: LandingSection = {
    type: "benefits", enabled: true, order: 2,
    data: {
      title: rtl ? (language === "ar" ? "المزايا" : "الفوايد") : "Pourquoi choisir ce produit ?",
      items: ai.benefits.map((b) => ({
        icon:        b.icon,
        title:       b.title,
        description: b.description,
      })),
    },
  }

  const features: LandingSection = {
    type: "features", enabled: true, order: 3,
    data: {
      title: rtl ? (language === "ar" ? "المميزات" : "الخصائص") : "Caractéristiques",
      items: ai.features.map((f) => ({
        image_url:   null,
        title:       f.title,
        description: f.description,
      })),
    },
  }

  const video: LandingSection = {
    type: "video", enabled: true, order: 4,
    data: {
      url:           "",
      thumbnail_url: null,
      caption:       rtl ? (language === "ar" ? "شاهد كيف يعمل" : "شوف كيفاش كيخدم") : "Regardez comment ça marche",
    },
  }

  const reviews: LandingSection = {
    type: "reviews", enabled: true, order: 5,
    data: {
      title:      rtl ? (language === "ar" ? "آراء العملاء" : "آراء الكليان") : "Ce que disent nos clients",
      review_ids: [],
    },
  }

  const faq: LandingSection = {
    type: "faq", enabled: true, order: 6,
    data: {
      title: rtl ? (language === "ar" ? "الأسئلة الشائعة" : "الأسئلة المتكررة") : "Questions fréquentes",
      items: ai.faq.map((f) => ({ question: f.question, answer: f.answer })),
    },
  }

  const beforeAfter: LandingSection = {
    type: "before_after", enabled: true, order: 3,
    data: {
      before_image: "",
      after_image:  "",
      caption:      rtl ? (language === "ar" ? "النتائج قبل وبعد" : "النتايج قبل وبعد") : "Résultats avant / après",
    },
  }

  const cta: LandingSection = {
    type: "cta", enabled: true, order: 8,
    data: {
      headline:     ai.cta.headline,
      cta_text:     ai.cta.button_text,
      cta_color:    "#f97316",
      urgency_text: ai.cta.subheadline,
    },
  }

  const ORDER: Record<string, LandingSection[]> = {
    PROBLEM_SOLUTION: [hero, benefits,   video,  reviews, faq, cta],
    GADGET_DEMO:      [hero, features,   video,  benefits, reviews, faq, cta],
    BEFORE_AFTER:     [hero, beforeAfter, benefits, reviews, faq, cta],
    BUNDLE:           [hero, features,   benefits, reviews, faq, cta],
    VIRAL:            [hero, video,       benefits, reviews, faq, cta],
  }

  const sections = ORDER[template] ?? ORDER["GADGET_DEMO"]!
  return sections.map((s, i) => ({ ...s, order: i + 1 }))
}

// ─── AI response type ─────────────────────────────────────────────────────────

interface AIContent {
  hero: {
    headline:    string
    subheadline: string
    cta_text:    string
  }
  benefits: Array<{ icon: string; title: string; description: string }>
  features:  Array<{ title: string; description: string }>
  reviews:   Array<{ author_name: string; author_city: string; rating: number; content: string }>
  faq:       Array<{ question: string; answer: string }>
  cta: {
    headline:    string
    subheadline: string
    button_text: string
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const { productId, template, language } = parsed.data

  const product = await prisma.product.findUnique({
    where:  { id: productId },
    select: {
      titleFr:       true,
      descriptionFr: true,
      price:         true,
      comparePrice:  true,
    },
  })
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const priceMAD       = (product.price / 100).toFixed(0)
  const langInstruction = getLangInstruction(language)
  const isRtl          = language !== "fr"

  const prompt = `You are an expert Moroccan COD e-commerce copywriter.
Generate complete, high-converting landing page content for this product.

PRODUCT:
- Title: ${product.titleFr}
- Price: ${priceMAD} MAD
- Description: ${product.descriptionFr ?? "No description provided"}

${langInstruction}

${isRtl ? "IMPORTANT: Every single text field MUST be in the specified language/dialect. No French or English." : ""}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "hero": {
    "headline": "catchy main headline (max 80 chars)",
    "subheadline": "supporting subheadline (max 120 chars)",
    "cta_text": "CTA button text (max 30 chars)"
  },
  "benefits": [
    { "icon": "⚡", "title": "short title", "description": "1-2 sentence benefit" },
    { "icon": "✅", "title": "short title", "description": "1-2 sentence benefit" },
    { "icon": "🚚", "title": "short title", "description": "1-2 sentence benefit" },
    { "icon": "💎", "title": "short title", "description": "1-2 sentence benefit" },
    { "icon": "🔒", "title": "short title", "description": "1-2 sentence benefit" }
  ],
  "features": [
    { "title": "feature name", "description": "detailed description" },
    { "title": "feature name", "description": "detailed description" },
    { "title": "feature name", "description": "detailed description" },
    { "title": "feature name", "description": "detailed description" }
  ],
  "reviews": [
    { "author_name": "Fatima Z.", "author_city": "Casablanca", "rating": 5, "content": "authentic customer review 2-3 sentences" },
    { "author_name": "Mohamed A.", "author_city": "Rabat", "rating": 5, "content": "authentic customer review 2-3 sentences" },
    { "author_name": "Khadija B.", "author_city": "Marrakech", "rating": 4, "content": "authentic customer review 2-3 sentences" }
  ],
  "faq": [
    { "question": "delivery question", "answer": "answer" },
    { "question": "payment/COD question", "answer": "answer" },
    { "question": "return/guarantee question", "answer": "answer" },
    { "question": "usage/how-to question", "answer": "answer" },
    { "question": "product quality question", "answer": "answer" }
  ],
  "cta": {
    "headline": "urgent closing headline",
    "subheadline": "scarcity/urgency text (max 80 chars)",
    "button_text": "commander button text"
  }
}`

  try {
    const openai     = await getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model:           MODEL,
      messages:        [{ role: "user", content: prompt }],
      temperature:     0.75,
      max_tokens:      3000,
      response_format: { type: "json_object" },
    })

    const rawContent = completion.choices[0]?.message?.content ?? "{}"
    const ai         = JSON.parse(rawContent) as AIContent

    const sections = buildSections(template, ai, language)

    return NextResponse.json({ sections, reviews: ai.reviews })
  } catch (err) {
    console.error("[generate-landing-content] OpenAI error:", err)
    return NextResponse.json({ error: "Erreur génération AI" }, { status: 500 })
  }
}
