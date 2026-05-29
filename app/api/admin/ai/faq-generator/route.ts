import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { getOpenAIClient, MODEL } from "@/lib/openai"

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  productTitle:    z.string().min(1).max(200),
  productBenefits: z.string().max(1000).optional().default(""),
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

  const { productTitle, productBenefits } = parsed.data

  const prompt = `
You are an expert in Moroccan e-commerce customer support for COD (cash on delivery) stores.

Product: ${productTitle}
Benefits: ${productBenefits}

Generate 8 FAQ questions and answers that address the real concerns of Moroccan online shoppers.
Cover these topics:
1-2: Livraison (délai, zones, suivi)
3-4: Paiement à la livraison (comment ça marche, sécurité)
5-6: Produit (utilisation, taille/compatibilité, résultats)
7: Retour/remboursement (politique)
8: Service client (contact, horaires)

Rules:
- Write questions in French
- Write answers in French, reassuring and professional
- Include realistic Moroccan delivery timeframes (24-72h grandes villes, 3-5j zones rurales)
- Mention COD naturally
- Keep answers concise (2-4 sentences)
- Add a Darija version of the question (questionDarija field)

Return JSON:
{
  "faq": [
    {
      "question": "French question?",
      "questionDarija": "Darija question؟",
      "answer": "French answer.",
      "category": "livraison|paiement|produit|retour|support"
    }
  ]
}

Return only the JSON object.`

  try {
    const completion = await (await getOpenAIClient()).chat.completions.create({
      model:       MODEL,
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens:  1200,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content ?? "{}"
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    console.error("OpenAI error:", err)
    return NextResponse.json({ error: "Erreur OpenAI" }, { status: 500 })
  }
}
