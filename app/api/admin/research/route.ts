import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const productId = req.nextUrl.searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId requis" }, { status: 422 })

  const research = await prisma.productResearch.findUnique({
    where:   { productId },
    include: { product: { select: { price: true, costPrice: true } } },
  })

  if (!research) return NextResponse.json(null)

  // Confirmed order count for estimated CPA
  const confirmedCount = await prisma.order.count({
    where: { productId, status: { in: ["CONFIRME","LIVRE"] } },
  })

  return NextResponse.json({ ...research, confirmedCount })
}

const upsertSchema = z.object({
  productId:       z.string().cuid(),
  supplierUrl:     z.string().url().nullable().optional(),
  alibabaUrl:      z.string().url().nullable().optional(),
  url1688:         z.string().url().nullable().optional(),
  buyingPrice:     z.number().int().min(0).nullable().optional(),
  shippingCost:    z.number().int().min(0).nullable().optional(),
  competitorUrls:  z.array(z.string()).default([]),
  competitorPrices:z.array(z.number().int().min(0)).default([]),
  testingNotes:    z.string().max(5000).nullable().optional(),
  winningScore:    z.number().int().min(0).max(10).default(0),
  breakEvenCpa:    z.number().int().min(0).nullable().optional(),
  adSpendTotal:    z.number().int().min(0).default(0),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
  }

  const parsed = upsertSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 })

  const { productId, ...data } = parsed.data

  const research = await prisma.productResearch.upsert({
    where:  { productId },
    update: data,
    create: { productId, ...data },
  })

  return NextResponse.json(research)
}
