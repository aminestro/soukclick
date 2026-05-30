import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOpenAIClient, MODEL } from "@/lib/openai"
import { fromCentimes } from "@/lib/format"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  productId: z.string().cuid(),
  platform:  z.enum(["META", "TIKTOK", "INSTAGRAM", "GOOGLE"]),
  language:  z.enum(["fr", "darija", "ar"]),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const { productId, platform, language } = parsed.data

  const product = await prisma.product.findUnique({
    where:  { id: productId },
    select: { titleFr: true, titleAr: true, descriptionFr: true, price: true, costPrice: true },
  })
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const priceMAD = fromCentimes(product.price).toFixed(0)

  const langNote =
    language === "darija" ? "Write EVERYTHING in Moroccan Darija (Arabic script دارجة). Sound like a real Moroccan person."
    : language === "ar"   ? "Write EVERYTHING in Modern Standard Arabic (فصحى)."
    : "Write EVERYTHING in Moroccan French. Casual, urgent, COD-focused."

  const platformNote =
    platform === "TIKTOK"    ? "TikTok Ads: very short, punchy, use emojis, casual tone, trending style. Also generate a full tiktok_script."
    : platform === "META"    ? "Facebook/Instagram Ads: emotional, benefit-driven, story format for primary texts."
    : platform === "INSTAGRAM" ? "Instagram Ads: visual-first, lifestyle angle, aspirational tone."
    : "Google Search Ads: keyword-driven, clear value prop, include price if good."

  const prompt = `You are a Moroccan COD ecommerce ads expert. Generate high-converting ad copy.

Product: ${product.titleFr}
Price: ${priceMAD} MAD
Description: ${(product.descriptionFr ?? "").slice(0, 400)}

Platform: ${platform} — ${platformNote}
${langNote}

COD market rules:
- Always emphasize "الدفع عند الاستلام" / "paiement à la livraison"
- Create urgency (limited stock, today only, fast delivery)
- Focus on transformation/benefit, not features
- Use social proof language

Return ONLY valid JSON with this exact structure:
{
  "hooks": [
    "hook 1 — attention-grabbing opening line (max 15 words)",
    "hook 2",
    "hook 3"
  ],
  "primary_texts": [
    "full ad copy version 1 (3-5 sentences)",
    "full ad copy version 2",
    "full ad copy version 3"
  ],
  "headlines": [
    "headline 1 (max 6 words)",
    "headline 2",
    "headline 3"
  ],
  "tiktok_script": {
    "hook": "first 3 seconds — shocking/curiosity hook",
    "body": "main script body with stage directions [smile] [show product]",
    "cta": "closing call to action with اطلب دابا"
  },
  "hashtags": [
    "#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5",
    "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10",
    "#hashtag11", "#hashtag12", "#hashtag13", "#hashtag14", "#hashtag15"
  ]
}

Note: always include tiktok_script even if platform is not TikTok (it can be used for UGC).
Hashtags must be relevant to Morocco and the product category.`

  try {
    const openai = await getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model:           MODEL,
      messages:        [{ role: "user", content: prompt }],
      temperature:     0.82,
      max_tokens:      1800,
      response_format: { type: "json_object" },
    })
    const content = completion.choices[0]?.message?.content ?? "{}"
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    console.error("OpenAI error:", err)
    return NextResponse.json({ error: "Erreur OpenAI" }, { status: 500 })
  }
}
