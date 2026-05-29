import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { getOpenAIClient, MODEL } from "@/lib/openai"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  productTitle:    z.string().min(1).max(200),
  productBenefits: z.string().max(1000).optional().default(""),
  duration:        z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
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

  const { productTitle, productBenefits, duration } = parsed.data

  const wordCount = duration === 15 ? "30-40" : duration === 30 ? "70-90" : "140-160"

  const prompt = `
You are an expert TikTok UGC scriptwriter for the Moroccan market.
Write in authentic Moroccan Darija (دارجة مغربية) using Arabic script.
The script should sound like a real Moroccan person talking naturally on TikTok.

Product: ${productTitle}
Benefits: ${productBenefits}
Video duration: ${duration} seconds (${wordCount} words total)

Create a complete TikTok UGC script with this structure:

1. HOOK (first 2-3 seconds): Shocking, curiosity-triggering, or relatable opener
2. PROBLEM: Briefly describe the problem this product solves (Moroccan context)
3. INTRODUCTION: Introduce the product naturally
4. BENEFITS: Show 2-3 key benefits conversationally
5. CTA: End with "اطلب دابا" (order now) + COD mention "والدفع عند الاستلام"

Style guidelines:
- Use natural Darija expressions (واخا، بزاف، مزيان، خويا/أختي, etc.)
- Include pauses and natural speech indicators [pause] [smile] [show product]
- TikTok energy: fast-paced, enthusiastic
- No formal Arabic (فصحى), pure Darija

Return JSON:
{
  "hook": "the opening 2-3 second line",
  "script": "the full script with stage directions in [brackets]",
  "cta": "the closing call to action",
  "duration": ${duration},
  "language": "darija"
}

Return only the JSON object.`

  try {
    const completion = await (await getOpenAIClient()).chat.completions.create({
      model:       MODEL,
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens:  800,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content ?? "{}"
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    console.error("OpenAI error:", err)
    return NextResponse.json({ error: "Erreur OpenAI" }, { status: 500 })
  }
}
