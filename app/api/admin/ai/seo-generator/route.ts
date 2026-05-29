import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { openai, MODEL } from "@/lib/openai"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  productTitle:       z.string().min(1).max(200),
  productDescription: z.string().max(2000).optional().default(""),
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

  const { productTitle, productDescription } = parsed.data

  const prompt = `
You are an SEO expert specializing in Moroccan French e-commerce.

Product: ${productTitle}
Description: ${productDescription}

Generate SEO content optimized for:
- Moroccan French search queries
- Google.ma search engine
- Mobile-first Moroccan users
- COD e-commerce context

Rules:
- meta_title: max 60 characters, include main keyword, brand optional
- meta_description: max 160 characters, include CTA, mention livraison Maroc
- keywords: 10 keywords, mix of French + occasional Darija transliteration
- slug: URL-friendly, lowercase, hyphens, French, max 50 chars

Return JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9", "kw10"],
  "slug": "product-slug-here",
  "h1": "suggested H1 heading",
  "altText": "suggested image alt text"
}

Return only the JSON object.`

  try {
    const completion = await openai.chat.completions.create({
      model:       MODEL,
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.5,
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
