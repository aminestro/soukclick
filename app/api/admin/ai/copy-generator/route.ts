import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { openai, MODEL } from "@/lib/openai"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  productTitle:    z.string().min(1).max(200),
  productBenefits: z.string().max(1000).optional().default(""),
  platform:        z.enum(["meta","tiktok","google"]),
  language:        z.enum(["fr","darija","ar"]).default("fr"),
  type:            z.enum(["headline","primary","description"]),
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

  const { productTitle, productBenefits, platform, language, type } = parsed.data

  const langNote = language === "darija"
    ? "Write in Moroccan Darija (Arabic script). Informal and energetic."
    : language === "ar"
    ? "Write in Modern Standard Arabic."
    : "Write in Moroccan French. Casual, urgent, sales-driven."

  const platformGuide = {
    meta:   "Facebook/Instagram ads. Focus on emotion + benefits. 2-3 sentences for primary text.",
    tiktok: "TikTok ads. Very short, punchy, trendy. Use emojis. Sound like a real Moroccan person.",
    google: "Google Search ads. Clear value proposition. Include keyword naturally.",
  }[platform]

  const typeGuide = {
    headline:    "Short punchy title, max 30 chars. Creates curiosity or states clear benefit.",
    primary:     "Main ad text, 50-150 chars. Hook + benefit + CTA.",
    description: "Supporting description, max 90 chars. Reinforce the offer.",
  }[type]

  const prompt = `
You are an expert Moroccan digital marketing copywriter for COD e-commerce.

Product: ${productTitle}
Benefits: ${productBenefits}
Platform: ${platform} — ${platformGuide}
Copy type: ${type} — ${typeGuide}
${langNote}

Generate exactly 3 different ${type} copy variations for ${platform} ads.
Each variation must be unique in approach (emotional / rational / urgency).
Always include COD mention naturally: "الدفع عند الاستلام" / "payez à la livraison".

Return JSON:
{
  "copies": [
    "variation 1",
    "variation 2",
    "variation 3"
  ]
}

Return only the JSON object.`

  try {
    const completion = await openai.chat.completions.create({
      model:       MODEL,
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens:  600,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content ?? "{}"
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    console.error("OpenAI error:", err)
    return NextResponse.json({ error: "Erreur OpenAI" }, { status: 500 })
  }
}
