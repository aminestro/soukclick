import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { getOpenAIClient, MODEL } from "@/lib/openai"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  url:      z.string().url(),
  language: z.enum(["fr", "ar", "darija"]).default("fr"),
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

  const { url, language } = parsed.data

  // Fetch page content (best-effort, no JS rendering)
  let pageContent = ""
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SoukClickBot/1.0)" },
      signal:  AbortSignal.timeout(8000),
    })
    const html = await res.text()
    // Strip HTML tags, keep text
    pageContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 6000)
  } catch {
    pageContent = `URL fournie: ${url}`
  }

  const langInstruction = language === "darija"
    ? `LANGUAGE: Generate ALL content (title, description, benefits, features, FAQ, metaAdsCopy, tiktokHooks) in Moroccan Darija (دارجة مغربية) using Arabic script. Use informal Moroccan conversational tone. The "title" field can remain in French for SEO, but "titleAr" must be in Darija.`
    : language === "ar"
    ? `LANGUAGE: Generate ALL content (title, description, benefits, features, FAQ, metaAdsCopy, tiktokHooks) in Modern Standard Arabic (فصحى). Formal, professional tone. The "title" field can remain in French for SEO, but "titleAr" must be in MSA.`
    : `LANGUAGE: Generate ALL content (title, description, benefits, features, FAQ, metaAdsCopy) in French. Casual, sales-oriented Moroccan French. TikTok hooks should be in Darija as Moroccan TikTok audiences prefer it.`

  const prompt = `You are an expert Moroccan e-commerce copywriter specializing in COD (cash on delivery) dropshipping.

Analyze this product page content and generate a complete product listing optimized for the Moroccan market.

PAGE CONTENT:
${pageContent}

${langInstruction}

Return a JSON object with this exact structure:
{
  "title": "product title in French (max 80 chars, for SEO)",
  "titleAr": "product title in the selected language (Arabic/Darija)",
  "description": "compelling product description 150-300 words, benefits-focused, in selected language",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
  "features": ["feature 1", "feature 2", "feature 3"],
  "suggestedPrice": 299,
  "suggestedCost": 80,
  "faq": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "metaAdsCopy": [
    {"headline": "...", "primaryText": "...", "description": "..."},
    {"headline": "...", "primaryText": "...", "description": "..."},
    {"headline": "...", "primaryText": "...", "description": "..."}
  ],
  "tiktokHooks": [
    "hook version 1 (first 3 seconds, shocking/curiosity-driven)",
    "hook version 2",
    "hook version 3"
  ]
}

Rules:
- suggestedPrice and suggestedCost are in Moroccan Dirhams (integers)
- Suggest a price between 149-499 MAD based on product type
- All copy must feel authentic for Moroccan buyers
- COD focus: emphasize paiement à la livraison / الدفع عند الاستلام
- FAQ must cover: delivery time, COD payment, returns, product usage
Return only the JSON object, no markdown.`

  try {
    const completion = await (await getOpenAIClient()).chat.completions.create({
      model:       MODEL,
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens:  2000,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content ?? "{}"
    const result  = JSON.parse(content)
    return NextResponse.json(result)
  } catch (err) {
    console.error("OpenAI error:", err)
    return NextResponse.json({ error: "Erreur OpenAI" }, { status: 500 })
  }
}
